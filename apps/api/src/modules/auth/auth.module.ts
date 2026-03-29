/**
 * Auth Module - KWIKSELLER
 * Handles authentication for all user types: BUYER, VENDOR, ADMIN, RIDER
 * 
 * Features:
 * - JWT authentication with access/refresh tokens
 * - Redis-based refresh token rotation
 * - Email verification flow
 * - Password reset
 * - Google OAuth
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { AdminPermissionsGuard } from './guards/admin-permissions.guard';
import { SharedModule } from '../../common/shared.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: '15m',
        },
      }),
      inject: [ConfigService],
    }),
    SharedModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtRefreshStrategy,
    JwtAuthGuard,
    RolesGuard,
    AdminPermissionsGuard,
  ],
  exports: [AuthService, JwtAuthGuard, RolesGuard, AdminPermissionsGuard],
})
export class AuthModule {}
