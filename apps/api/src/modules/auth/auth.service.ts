import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../../common/services/email.service';
import { CacheService } from '../../common/services/cache.service';
import { AuditService } from '../../common/services/audit.service';

import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  ChangePasswordDto,
  UserRole,
  ResendVerificationDto,
} from './dto/auth.dto';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  sessionId: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  status: string;
  emailVerified: boolean;
  permissions?: string[];
  profile?: {
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  };
  store?: {
    id: string;
    name: string;
    slug: string;
    isVerified: boolean;
    onboardingComplete: boolean;
  };
  subscription?: {
    plan: string;
    status: string;
    productLimit: number;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly accessTokenExpiry = 15 * 60; // 15 minutes
  private readonly refreshTokenExpiry = 7 * 24 * 60 * 60; // 7 days

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
    private readonly cacheService: CacheService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Register a new user
   */
  async register(dto: RegisterDto, ipAddress: string) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Validate admin registration requires invite token
    if (dto.role === UserRole.ADMIN) {
      if (!dto.inviteToken) {
        throw new ForbiddenException('Admin registration requires an invite token');
      }
      const validInvite = await this.validateAdminInvite(dto.inviteToken);
      if (!validInvite) {
        throw new ForbiddenException('Invalid or expired invite token');
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create user with transaction
    const user = await this.prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          role: dto.role,
          status: 'PENDING',
          emailVerified: false,
          phone: dto.phone,
        },
      });

      // Create profile
      if (dto.firstName || dto.lastName) {
        await tx.userProfile.create({
          data: {
            userId: newUser.id,
            firstName: dto.firstName,
            lastName: dto.lastName,
          },
        });
      }

      // Role-specific setup
      if (dto.role === UserRole.VENDOR) {
        // Create default subscription (Starter)
        await tx.subscription.create({
          data: {
            vendorId: newUser.id,
            plan: 'STARTER',
            status: 'ACTIVE',
            productLimit: 10,
          },
        });

        // Create KwikCoins wallet
        await tx.kwikCoins.create({
          data: {
            vendorId: newUser.id,
            balance: 0,
          },
        });

        // Create Wallet
        await tx.wallet.create({
          data: {
            vendorId: newUser.id,
          },
        });
      }

      if (dto.role === UserRole.RIDER) {
        await tx.rider.create({
          data: {
            userId: newUser.id,
            vehicleType: dto.vehicleType || 'BIKE',
            plateNumber: dto.plateNumber,
          },
        });
      }

      if (dto.role === UserRole.ADMIN && dto.inviteToken) {
        // Get permissions from invite
        const invite = await this.getAdminInvite(dto.inviteToken);
        if (invite) {
          await tx.adminPermission.create({
            data: {
              adminUserId: newUser.id,
              role: invite.role as any, // Cast from cache string to AdminRole enum
              permissions: JSON.stringify(invite.permissions),
              grantedBy: invite.grantedBy,
            },
          });
          // Mark invite as used
          await this.cacheService.del(`admin-invite:${dto.inviteToken}`);
        }
      }

      return newUser;
    });

    // Generate email verification token
    const verificationToken = uuidv4();
    await this.cacheService.set(
      `email-verification:${verificationToken}`,
      { userId: user.id, email: user.email },
      24 * 60 * 60, // 24 hours
    );

    // Send verification email
    await this.emailService.sendEmail(
      user.email,
      'Verify Your Email - KWIKSELLER',
      'email-verify',
      {
        name: dto.firstName || 'User',
        verificationUrl: `${this.config.get('FRONTEND_URL')}/verify-email?token=${verificationToken}`,
      },
    );

    // Log audit
    await this.auditService.log({
      userId: user.id,
      action: 'USER_REGISTERED',
      entity: 'User',
      entityId: user.id,
      changes: { email: user.email, role: user.role },
      ipAddress,
    });

    this.logger.log(`User registered: ${user.email} (${user.role})`);

    return {
      message: 'Registration successful. Please check your email to verify your account.',
      userId: user.id,
    };
  }

  /**
   * Login user
   */
  async login(dto: LoginDto, ipAddress: string, userAgent: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        profile: true,
        store: true,
        subscription: true,
        adminPermission: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === 'BANNED') {
      throw new ForbiddenException('Your account has been banned');
    }

    if (user.status === 'SUSPENDED') {
      throw new ForbiddenException('Your account has been suspended');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Create session in Redis
    const sessionId = uuidv4();
    await this.cacheService.set(
      `session:${sessionId}`,
      {
        userId: user.id,
        deviceId: dto.deviceId,
        userAgent,
        ipAddress,
        createdAt: Date.now(),
      },
      this.refreshTokenExpiry,
    );

    // Update user status to active if pending
    if (user.status === 'PENDING' && user.emailVerified) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { status: 'ACTIVE' },
      });
    }

    // Log audit
    await this.auditService.log({
      userId: user.id,
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: user.id,
      ipAddress,
    });

    this.logger.log(`User logged in: ${user.email}`);

    return {
      ...tokens,
      user: this.formatUserResponse(user),
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(dto: RefreshTokenDto, ipAddress: string) {
    // Verify refresh token
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.config.get('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if token is blacklisted
    const blacklisted = await this.cacheService.get(`blacklist:${dto.refreshToken}`);
    if (blacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }

    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        profile: true,
        store: true,
        subscription: true,
        adminPermission: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Blacklist the old refresh token (rotation)
    await this.cacheService.set(
      `blacklist:${dto.refreshToken}`,
      { userId: user.id, reason: 'rotation' },
      this.refreshTokenExpiry,
    );

    // Generate new tokens
    const tokens = await this.generateTokens(user);

    // Log audit
    await this.auditService.log({
      userId: user.id,
      action: 'TOKEN_REFRESHED',
      entity: 'User',
      entityId: user.id,
      ipAddress,
    });

    return tokens;
  }

  /**
   * Logout user
   */
  async logout(userId: string, refreshToken?: string, ipAddress?: string) {
    if (refreshToken) {
      // Blacklist the refresh token
      await this.cacheService.set(
        `blacklist:${refreshToken}`,
        { userId, reason: 'logout' },
        this.refreshTokenExpiry,
      );
    }

    // Log audit
    await this.auditService.log({
      userId,
      action: 'USER_LOGOUT',
      entity: 'User',
      entityId: userId,
      ipAddress,
    });

    this.logger.log(`User logged out: ${userId}`);

    return { message: 'Logged out successfully' };
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        store: true,
        subscription: true,
        adminPermission: true,
        kwikCoins: true,
        wallet: true,
        rider: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.formatUserResponse(user);
  }

  /**
   * Forgot password
   */
  async forgotPassword(dto: ForgotPasswordDto, ipAddress: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { profile: true },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If the email exists, a reset link has been sent' };
    }

    // Generate reset token
    const resetToken = uuidv4();
    await this.cacheService.set(
      `password-reset:${resetToken}`,
      { userId: user.id, email: user.email },
      60 * 60, // 1 hour
    );

    // Send reset email
    await this.emailService.sendEmail(
      user.email,
      'Reset Your Password - KWIKSELLER',
      'password-reset',
      {
        name: user.profile?.firstName || 'User',
        resetUrl: `${this.config.get('FRONTEND_URL')}/reset-password?token=${resetToken}`,
      },
    );

    // Log audit
    await this.auditService.log({
      userId: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      entity: 'User',
      entityId: user.id,
      ipAddress,
    });

    return { message: 'If the email exists, a reset link has been sent' };
  }

  /**
   * Reset password
   */
  async resetPassword(dto: ResetPasswordDto, ipAddress: string) {
    const resetData = await this.cacheService.get<{ userId: string; email: string }>(
      `password-reset:${dto.token}`,
    );

    if (!resetData) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    // Update password
    await this.prisma.user.update({
      where: { id: resetData.userId },
      data: { passwordHash, status: 'ACTIVE' },
    });

    // Delete reset token
    await this.cacheService.del(`password-reset:${dto.token}`);

    // Log audit
    await this.auditService.log({
      userId: resetData.userId,
      action: 'PASSWORD_RESET_COMPLETED',
      entity: 'User',
      entityId: resetData.userId,
      ipAddress,
    });

    return { message: 'Password reset successfully' };
  }

  /**
   * Verify email
   */
  async verifyEmail(dto: VerifyEmailDto, ipAddress: string) {
    const verificationData = await this.cacheService.get<{ userId: string; email: string }>(
      `email-verification:${dto.token}`,
    );

    if (!verificationData) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    // Update user
    await this.prisma.user.update({
      where: { id: verificationData.userId },
      data: { emailVerified: true, status: 'ACTIVE' },
    });

    // Delete verification token
    await this.cacheService.del(`email-verification:${dto.token}`);

    // Log audit
    await this.auditService.log({
      userId: verificationData.userId,
      action: 'EMAIL_VERIFIED',
      entity: 'User',
      entityId: verificationData.userId,
      ipAddress,
    });

    return { message: 'Email verified successfully' };
  }

  /**
   * Resend verification email
   */
  async resendVerification(dto: ResendVerificationDto, _ipAddress: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { profile: true },
    });

    if (!user || user.emailVerified) {
      return { message: 'If the email exists and is unverified, a new link has been sent' };
    }

    // Generate new verification token
    const verificationToken = uuidv4();
    await this.cacheService.set(
      `email-verification:${verificationToken}`,
      { userId: user.id, email: user.email },
      24 * 60 * 60,
    );

    // Send verification email
    await this.emailService.sendEmail(
      user.email,
      'Verify Your Email - KWIKSELLER',
      'email-verify',
      {
        name: user.profile?.firstName || 'User',
        verificationUrl: `${this.config.get('FRONTEND_URL')}/verify-email?token=${verificationToken}`,
      },
    );

    return { message: 'If the email exists and is unverified, a new link has been sent' };
  }

  /**
   * Change password
   */
  async changePassword(userId: string, dto: ChangePasswordDto, ipAddress: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const passwordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Log audit
    await this.auditService.log({
      userId,
      action: 'PASSWORD_CHANGED',
      entity: 'User',
      entityId: userId,
      ipAddress,
    });

    return { message: 'Password changed successfully' };
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(user: any): Promise<TokenPair> {
    const sessionId = uuidv4();

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: `${this.accessTokenExpiry}s`,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get('jwt.refreshSecret'),
      expiresIn: `${this.refreshTokenExpiry}s`,
    });

    // Store refresh token in Redis
    await this.cacheService.set(
      `refresh-token:${user.id}:${sessionId}`,
      { token: refreshToken, createdAt: Date.now() },
      this.refreshTokenExpiry,
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessTokenExpiry,
      refreshExpiresIn: this.refreshTokenExpiry,
    };
  }

  /**
   * Format user response with permissions
   */
  private formatUserResponse(user: any): AuthUser {
    const response: AuthUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      profile: user.profile
        ? {
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            avatarUrl: user.profile.avatarUrl,
          }
        : undefined,
    };

    // Add permissions for admin users
    if (user.role === UserRole.ADMIN && user.adminPermission) {
      response.permissions = JSON.parse(user.adminPermission.permissions);
    }

    // Add store for vendor users
    if (user.role === UserRole.VENDOR && user.store) {
      response.store = {
        id: user.store.id,
        name: user.store.name,
        slug: user.store.slug,
        isVerified: user.store.isVerified,
        onboardingComplete: user.store.onboardingComplete,
      };
    }

    // Add subscription for vendor users
    if (user.role === UserRole.VENDOR && user.subscription) {
      response.subscription = {
        plan: user.subscription.plan,
        status: user.subscription.status,
        productLimit: user.subscription.productLimit,
      };
    }

    return response;
  }

  /**
   * Validate admin invite token
   */
  private async validateAdminInvite(token: string): Promise<boolean> {
    const invite = await this.cacheService.get(`admin-invite:${token}`);
    return !!invite;
  }

  /**
   * Get admin invite details
   */
  private async getAdminInvite(
    token: string,
  ): Promise<{ role: string; permissions: string[]; grantedBy: string } | null> {
    return this.cacheService.get(`admin-invite:${token}`);
  }

  /**
   * Validate JWT token (for guards)
   */
  async validateToken(token: string): Promise<JwtPayload | null> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      
      // Check if token is blacklisted
      const blacklisted = await this.cacheService.get(`blacklist:${token}`);
      if (blacklisted) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }
}
