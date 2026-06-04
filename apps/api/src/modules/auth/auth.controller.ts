import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Ip,
  Headers,
  HttpCode,
  HttpStatus,
  Patch,
  Optional,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import * as bcrypt from 'bcryptjs';

import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../../common/services/email.service';
import { CacheService } from '../../common/services/cache.service';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  ChangePasswordDto,
  ResendVerificationDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Register new user
   * Supports all roles: BUYER, VENDOR, ADMIN, RIDER
   */
  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(
    @Body() dto: RegisterDto,
    @Ip() ipAddress: string,
  ) {
    return this.authService.register(dto, ipAddress);
  }

  /**
   * Login user
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiHeader({
    name: 'user-agent',
    required: false,
    description: 'Browser/Client user agent (optional - auto-captured by browser)',
  })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Email not verified - OTP sent to email' })
  async login(
    @Body() dto: LoginDto,
    @Ip() ipAddress: string,
    @Optional() @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.login(dto, ipAddress, userAgent || 'Unknown');
  }

  /**
   * Refresh access token
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(
    @Body() dto: RefreshTokenDto,
    @Ip() ipAddress: string,
  ) {
    return this.authService.refreshToken(dto, ipAddress);
  }

  /**
   * Logout user
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(
    @CurrentUser('id') userId: string,
    @Body() body: { refreshToken?: string },
    @Ip() ipAddress: string,
  ) {
    return this.authService.logout(userId, body?.refreshToken, ipAddress);
  }

  /**
   * Get current user profile
   */
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(@CurrentUser('id') userId: string) {
    return this.authService.getCurrentUser(userId);
  }

  /**
   * Forgot password - Send OTP code
   */
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset OTP' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 404, description: 'Email not found' })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @Ip() ipAddress: string,
  ) {
    return this.authService.forgotPassword(dto, ipAddress);
  }

  /**
   * Reset password with OTP
   */
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with OTP code' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Ip() ipAddress: string,
  ) {
    return this.authService.resetPassword(dto, ipAddress);
  }

  /**
   * Verify email with OTP
   */
  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address with OTP code' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  async verifyEmail(
    @Body() dto: VerifyEmailDto,
    @Ip() ipAddress: string,
  ) {
    return this.authService.verifyEmail(dto, ipAddress);
  }

  /**
   * Resend verification email
   */
  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend verification email' })
  @ApiResponse({ status: 200, description: 'Verification email sent if email exists' })
  async resendVerification(
    @Body() dto: ResendVerificationDto,
    @Ip() ipAddress: string,
  ) {
    return this.authService.resendVerification(dto, ipAddress);
  }

  /**
   * Change password (authenticated)
   */
  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Current password is incorrect' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
    @Ip() ipAddress: string,
  ) {
    return this.authService.changePassword(userId, dto, ipAddress);
  }

  /**
   * Change email — sends verification OTP to new email
   * Does NOT change email until OTP is verified via /auth/verify-email
   */
  @UseGuards(JwtAuthGuard)
  @Post('change-email')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request email change — OTP sent to new email' })
  @ApiResponse({ status: 200, description: 'Verification OTP sent to new email' })
  @ApiResponse({ status: 401, description: 'Current password is incorrect' })
  @ApiResponse({ status: 409, description: 'New email already in use' })
  async changeEmail(
    @CurrentUser('id') userId: string,
    @Body() dto: { newEmail: string; password: string },
    @Ip() _ipAddress: string,
  ) {
    if (!dto.newEmail || !dto.password) {
      throw new BadRequestException('newEmail and password are required.');
    }

    // Get user with password hash
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new BadRequestException('User not found.');
    }

    // Verify current password
    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new BadRequestException('Current password is incorrect.');
    }

    // Check new email isn't the same as current
    if (dto.newEmail.toLowerCase() === user.email.toLowerCase()) {
      throw new BadRequestException('New email must be different from current email.');
    }

    // Check new email isn't already taken
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: dto.newEmail.toLowerCase(),
        role: user.role,
      },
    });
    if (existingUser) {
      throw new BadRequestException(
        'This email is already registered. Please use a different email address.',
      );
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store pending email change in cache (10 min expiry)
    const cacheKey = `email-change:${userId}`;
    await this.cacheService.set(
      cacheKey,
      {
        userId,
        oldEmail: user.email,
        newEmail: dto.newEmail.toLowerCase(),
        otp,
      },
      10 * 60, // 10 minutes
    );

    // Send verification OTP to new email
    await this.emailService.sendEmail(
      dto.newEmail,
      'Verify Your New Email - KWIKSELLER',
      'email-verify',
      {
        name: user.profile?.firstName || 'User',
        otp,
      },
    );

    return {
      success: true,
      message: `Verification OTP sent to ${dto.newEmail}. Please verify to complete the email change.`,
    };
  }

  /**
   * Validate token (for other services)
   */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate JWT token' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  @ApiResponse({ status: 401, description: 'Invalid token' })
  async validateToken(@Body() body: { token: string }) {
    const payload = await this.authService.validateToken(body.token);
    if (!payload) {
      return { valid: false };
    }
    return { valid: true, payload };
  }
}
