import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { UserRole as PrismaUserRole } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

import { PrismaService } from "../../database/prisma.service";
import { EmailService } from "../../common/services/email.service";
import { CacheService } from "../../common/services/cache.service";
import { AuditService } from "../../common/services/audit.service";

import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  ChangePasswordDto,
  UserRole as AuthUserRole,
  ResendVerificationDto,
  VerifyOTPDto,
} from "./dto/auth.dto";

export interface JwtPayload {
  sub: string;
  email: string;
  role: PrismaUserRole;
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
  role: PrismaUserRole;
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
    verificationStatus?: string;
    onboardingStep?: string;
  };
  rider?: {
    id: string;
    isAvailable: boolean;
    onboardingComplete: boolean;
    verificationStatus?: string;
    onboardingStep?: string;
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
  private readonly otpExpiry = 10 * 60; // 10 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
    private readonly cacheService: CacheService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Generate a 6-digit OTP
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private getEmailRoleCacheKey(
    prefix: string,
    email: string,
    role: string,
  ): string {
    return `${prefix}:${email.toLowerCase()}:${role}`;
  }

  private getLoginRoles(role: AuthUserRole): PrismaUserRole[] {
    if (role === AuthUserRole.ADMIN) {
      return [PrismaUserRole.ADMIN, PrismaUserRole.SUPER_ADMIN];
    }

    return [role as PrismaUserRole];
  }

  private async findUsersForLogin(email: string, role: AuthUserRole) {
    return this.prisma.user.findMany({
      where: {
        email,
        role: { in: this.getLoginRoles(role) },
      },
      include: {
        profile: true,
        store: true,
        rider: true,
        subscription: true,
        adminPermission: true,
      },
    });
  }

  private async findUserByEmailAndRole(email: string, role: AuthUserRole) {
    return this.prisma.user.findFirst({
      where: { email, role: role as PrismaUserRole },
      include: {
        profile: true,
        store: true,
        rider: true,
        subscription: true,
        adminPermission: true,
      },
    });
  }

  /**
   * Register a new user
   */
  async register(dto: RegisterDto, ipAddress: string) {
    // Check if user already exists
    const existingUser = await this.findUserByEmailAndRole(dto.email, dto.role);

    if (existingUser) {
      throw new ConflictException(
        "User with this email already exists for this role",
      );
    }

    // Validate admin registration requires invite token
    if (dto.role === AuthUserRole.ADMIN) {
      if (!dto.inviteToken) {
        throw new ForbiddenException(
          "Admin registration requires an invite token",
        );
      }
      const validInvite = await this.validateAdminInvite(dto.inviteToken);
      if (!validInvite) {
        throw new ForbiddenException("Invalid or expired invite token");
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
          status: "PENDING",
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
      if (dto.role === AuthUserRole.VENDOR) {
        // Create default subscription (Starter)
        await tx.subscription.create({
          data: {
            vendorId: newUser.id,
            plan: "STARTER",
            status: "ACTIVE",
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

      if (dto.role === AuthUserRole.RIDER) {
        await tx.rider.create({
          data: {
            userId: newUser.id,
          },
        });
      }

      if (dto.role === AuthUserRole.ADMIN && dto.inviteToken) {
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

    // Generate email verification OTP
    const otp = this.generateOTP();
    await this.cacheService.set(
      this.getEmailRoleCacheKey("email-verification", user.email, user.role),
      { userId: user.id, email: user.email, role: user.role, otp },
      this.otpExpiry,
    );

    // Send verification email with OTP
    await this.emailService.sendEmail(
      user.email,
      "Verify Your Email - KWIKSELLER",
      "email-verify",
      {
        name: dto.firstName || "User",
        otp,
      },
    );

    // Log audit
    await this.auditService.log({
      userId: user.id,
      action: "USER_REGISTERED",
      entity: "User",
      entityId: user.id,
      changes: { email: user.email, role: user.role },
      ipAddress,
    });

    this.logger.log(`User registered: ${user.email} (${user.role})`);

    return {
      message:
        "Registration successful. Please check your email for the verification code.",
      userId: user.id,
      email: user.email,
    };
  }

  /**
   * Login user
   */
  async login(dto: LoginDto, ipAddress: string, userAgent: string) {
    const candidates = await this.findUsersForLogin(dto.email, dto.role);
    const passwordMatches = await Promise.all(
      candidates.map((candidate) =>
        bcrypt.compare(dto.password, candidate.passwordHash),
      ),
    );
    const user = candidates.find((candidate, index) => passwordMatches[index]);

    if (!user) {
      throw new UnauthorizedException(
        `No ${dto.role.toLowerCase().replace("_", " ")} account found with these credentials`,
      );
    }

    if (user.status === "BANNED") {
      throw new ForbiddenException("Your account has been banned");
    }

    if (user.status === "SUSPENDED") {
      throw new ForbiddenException("Your account has been suspended");
    }

    this.assertLoginRoleAccess(user, dto.role);

    // Check if email is verified before generating tokens
    if (!user.emailVerified) {
      // Generate and send OTP for email verification
      const otp = this.generateOTP();
      await this.cacheService.set(
        this.getEmailRoleCacheKey("email-verification", user.email, user.role),
        { userId: user.id, email: user.email, role: user.role, otp },
        this.otpExpiry,
      );

      // Send verification email with OTP
      await this.emailService.sendEmail(
        user.email,
        "Verify Your Email - KWIKSELLER",
        "email-verify",
        {
          name: user.profile?.firstName || "User",
          otp,
        },
      );

      // Log audit
      await this.auditService.log({
        userId: user.id,
        action: "LOGIN_ATTEMPT_UNVERIFIED",
        entity: "User",
        entityId: user.id,
        ipAddress,
      });

      // Throw special exception for unverified email
      throw new ForbiddenException({
        code: "EMAIL_NOT_VERIFIED",
        message:
          "Email not verified. A verification code has been sent to your email.",
        email: user.email,
      });
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
    if (user.status === "PENDING" && user.emailVerified) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { status: "ACTIVE" },
      });
    }

    // Log audit
    await this.auditService.log({
      userId: user.id,
      action: "USER_LOGIN",
      entity: "User",
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
        secret: this.config.get("jwt.refreshSecret"),
      });
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }

    // Check if token is blacklisted
    const blacklisted = await this.cacheService.get(
      `blacklist:${dto.refreshToken}`,
    );
    if (blacklisted) {
      throw new UnauthorizedException("Token has been revoked");
    }

    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        profile: true,
        store: true,
        rider: true,
        subscription: true,
        adminPermission: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    // Blacklist the old refresh token (rotation)
    await this.cacheService.set(
      `blacklist:${dto.refreshToken}`,
      { userId: user.id, reason: "rotation" },
      this.refreshTokenExpiry,
    );

    // Generate new tokens
    const tokens = await this.generateTokens(user);

    // Log audit
    await this.auditService.log({
      userId: user.id,
      action: "TOKEN_REFRESHED",
      entity: "User",
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
        { userId, reason: "logout" },
        this.refreshTokenExpiry,
      );
    }

    // Log audit
    await this.auditService.log({
      userId,
      action: "USER_LOGOUT",
      entity: "User",
      entityId: userId,
      ipAddress,
    });

    this.logger.log(`User logged out: ${userId}`);

    return { message: "Logged out successfully" };
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
      throw new UnauthorizedException("User not found");
    }

    return this.formatUserResponse(user);
  }

  /**
   * Forgot password
   */
  async forgotPassword(dto: ForgotPasswordDto, ipAddress: string) {
    const user = await this.findUserByEmailAndRole(dto.email, dto.role);

    // Return error if email not found
    if (!user) {
      throw new NotFoundException("No account found with this email address");
    }

    // BLOCK: SUPER_ADMIN cannot reset password
    if (user.role === PrismaUserRole.SUPER_ADMIN) {
      // Log the attempt but return success to not reveal existence
      this.logger.warn(
        `Password reset attempted for SUPER_ADMIN: ${dto.email}`,
      );
      await this.auditService.log({
        userId: user.id,
        action: "PASSWORD_RESET_BLOCKED",
        entity: "User",
        entityId: user.id,
        ipAddress,
      });
      // Return success message but don't send OTP
      return {
        message:
          "If this email is registered, a verification code has been sent",
        email: dto.email,
      };
    }

    // Generate OTP
    const otp = this.generateOTP();
    await this.cacheService.set(
      this.getEmailRoleCacheKey("password-reset", user.email, user.role),
      { userId: user.id, email: user.email, role: user.role, otp },
      this.otpExpiry,
    );

    // Send reset email with OTP
    await this.emailService.sendEmail(
      user.email,
      "Reset Your Password - KWIKSELLER",
      "password-reset",
      {
        name: user.profile?.firstName || "User",
        otp,
      },
    );

    // Log audit
    await this.auditService.log({
      userId: user.id,
      action: "PASSWORD_RESET_REQUESTED",
      entity: "User",
      entityId: user.id,
      ipAddress,
    });

    return {
      message: "Verification code sent to your email",
      email: user.email,
    };
  }

  /**
   * Reset password with OTP
   */
  async resetPassword(dto: ResetPasswordDto, ipAddress: string) {
    const resetData = await this.cacheService.get<{
      userId: string;
      email: string;
      role: PrismaUserRole;
      otp: string;
    }>(this.getEmailRoleCacheKey("password-reset", dto.email, dto.role));

    if (!resetData || resetData.otp !== dto.otp) {
      throw new BadRequestException("Invalid or expired verification code");
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    // Update password
    await this.prisma.user.update({
      where: { id: resetData.userId },
      data: { passwordHash, status: "ACTIVE" },
    });

    // Delete reset OTP
    await this.cacheService.del(
      this.getEmailRoleCacheKey("password-reset", dto.email, dto.role),
    );

    // Log audit
    await this.auditService.log({
      userId: resetData.userId,
      action: "PASSWORD_RESET_COMPLETED",
      entity: "User",
      entityId: resetData.userId,
      ipAddress,
    });

    return { message: "Password reset successfully" };
  }

  /**
   * Verify email with OTP
   * Returns tokens and user data for automatic login after verification
   */
  async verifyEmail(dto: VerifyEmailDto, ipAddress: string) {
    const verificationData = await this.cacheService.get<{
      userId: string;
      email: string;
      role: PrismaUserRole;
      otp: string;
    }>(this.getEmailRoleCacheKey("email-verification", dto.email, dto.role));

    if (!verificationData || verificationData.otp !== dto.otp) {
      throw new BadRequestException("Invalid or expired verification code");
    }

    // Get user with all relations before updating
    const user = await this.prisma.user.findUnique({
      where: { id: verificationData.userId },
      include: {
        profile: true,
        store: true,
        rider: true,
        subscription: true,
        adminPermission: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    // Update user - mark email as verified and status as active
    await this.prisma.user.update({
      where: { id: verificationData.userId },
      data: { emailVerified: true, status: "ACTIVE" },
    });

    // Delete verification OTP
    await this.cacheService.del(
      this.getEmailRoleCacheKey("email-verification", dto.email, dto.role),
    );

    // Generate tokens for auto-login
    const tokens = await this.generateTokens(user);

    // Create session in Redis
    const sessionId = uuidv4();
    await this.cacheService.set(
      `session:${sessionId}`,
      {
        userId: user.id,
        userAgent: "Email Verification",
        ipAddress,
        createdAt: Date.now(),
      },
      this.refreshTokenExpiry,
    );

    // Log audit
    await this.auditService.log({
      userId: verificationData.userId,
      action: "EMAIL_VERIFIED",
      entity: "User",
      entityId: verificationData.userId,
      ipAddress,
    });

    this.logger.log(`Email verified and auto-login: ${user.email}`);

    return {
      ...tokens,
      user: this.formatUserResponse(user),
    };
  }

  /**
   * Resend verification email with OTP
   */
  async resendVerification(dto: ResendVerificationDto, _ipAddress: string) {
    const user = await this.findUserByEmailAndRole(dto.email, dto.role);

    if (!user || user.emailVerified) {
      return {
        message:
          "If the email exists and is unverified, a new code has been sent",
      };
    }

    // Generate new OTP
    const otp = this.generateOTP();
    await this.cacheService.set(
      this.getEmailRoleCacheKey("email-verification", user.email, user.role),
      { userId: user.id, email: user.email, role: user.role, otp },
      this.otpExpiry,
    );

    // Send verification email with OTP
    await this.emailService.sendEmail(
      user.email,
      "Verify Your Email - KWIKSELLER",
      "email-verify",
      {
        name: user.profile?.firstName || "User",
        otp,
      },
    );

    return {
      message:
        "If the email exists and is unverified, a new code has been sent",
      email: user.email,
    };
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    ipAddress: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    const passwordValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!passwordValid) {
      throw new UnauthorizedException("Current password is incorrect");
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
      action: "PASSWORD_CHANGED",
      entity: "User",
      entityId: userId,
      ipAddress,
    });

    return { message: "Password changed successfully" };
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
      secret: this.config.get("jwt.refreshSecret"),
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

  private assertLoginRoleAccess(user: any, requestedRole: AuthUserRole): void {
    const isAdminPortal =
      requestedRole === AuthUserRole.ADMIN ||
      requestedRole === AuthUserRole.SUPER_ADMIN;
    const hasMatchingRole = isAdminPortal
      ? user.role === PrismaUserRole.ADMIN ||
        user.role === PrismaUserRole.SUPER_ADMIN
      : user.role === (requestedRole as PrismaUserRole);

    if (!hasMatchingRole) {
      throw new UnauthorizedException(
        `No ${requestedRole.toLowerCase().replace("_", " ")} account found with these credentials`,
      );
    }

    if (
      requestedRole === AuthUserRole.ADMIN &&
      user.role === PrismaUserRole.ADMIN &&
      !user.adminPermission
    ) {
      throw new ForbiddenException(
        "Admin account is not configured for portal access",
      );
    }

    if (requestedRole === AuthUserRole.RIDER && !user.rider) {
      throw new ForbiddenException("Rider account setup is incomplete");
    }
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

    // Add permissions for admin/super_admin users
    if (user.role === PrismaUserRole.ADMIN && user.adminPermission) {
      response.permissions = JSON.parse(user.adminPermission.permissions);
    }

    // SUPER_ADMIN has all permissions
    if (user.role === PrismaUserRole.SUPER_ADMIN) {
      response.permissions = ["*"]; // All permissions
    }

    // Add store for vendor users
    if (user.role === PrismaUserRole.VENDOR && user.store) {
      response.store = {
        id: user.store.id,
        name: user.store.name,
        slug: user.store.slug,
        isVerified: user.store.isVerified,
        onboardingComplete: user.store.onboardingComplete,
        verificationStatus: user.store.verificationStatus,
        onboardingStep: user.store.onboardingStep,
      };
    }

    // Add rider info for rider users
    if (user.role === PrismaUserRole.RIDER && user.rider) {
      response.rider = {
        id: user.rider.id,
        isAvailable: user.rider.isAvailable,
        onboardingComplete: user.rider.onboardingComplete,
        verificationStatus: user.rider.verificationStatus,
        onboardingStep: user.rider.onboardingStep,
      };
    }

    // Add subscription for vendor users
    if (user.role === PrismaUserRole.VENDOR && user.subscription) {
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
  private async getAdminInvite(token: string): Promise<{
    role: string;
    permissions: string[];
    grantedBy: string;
  } | null> {
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
