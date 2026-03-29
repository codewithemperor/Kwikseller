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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { AuthService } from './auth.service';
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
  constructor(private readonly authService: AuthService) {}

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
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() dto: LoginDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.login(dto, ipAddress, userAgent);
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
   * Forgot password
   */
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Reset email sent if email exists' })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @Ip() ipAddress: string,
  ) {
    return this.authService.forgotPassword(dto, ipAddress);
  }

  /**
   * Reset password
   */
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Ip() ipAddress: string,
  ) {
    return this.authService.resetPassword(dto, ipAddress);
  }

  /**
   * Verify email
   */
  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
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
