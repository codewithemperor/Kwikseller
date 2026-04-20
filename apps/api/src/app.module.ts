import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './database/prisma.service';
import { SharedModule } from './common/shared.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [
        () => ({
          port: parseInt(process.env.PORT || '4000', 10),
          nodeEnv: process.env.NODE_ENV || 'development',
          databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
          frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
          jwt: {
            secret: process.env.JWT_SECRET || 'kwikseller-secret-key-change-in-production',
            expiresIn: process.env.JWT_EXPIRATION || '15m',
            refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
            refreshSecret: process.env.JWT_REFRESH_SECRET || 'kwikseller-refresh-secret-change-in-production',
          },
          vapid: {
            publicKey: process.env.VAPID_PUBLIC_KEY || '',
            privateKey: process.env.VAPID_PRIVATE_KEY || '',
            email: process.env.VAPID_EMAIL || 'support@kwikseller.com',
          },
          redis: {
            url: process.env.REDIS_URL || 'redis://localhost:6379',
          },
          email: {
            host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            user: process.env.SMTP_USER || 'apikey',
            pass: process.env.SMTP_PASS || process.env.SENDGRID_API_KEY || '',
            from:
              process.env.SMTP_FROM ||
              process.env.SENDGRID_FROM_EMAIL ||
              'noreply@kwikseller.com',
          },
          cloudinary: {
            cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
            apiKey: process.env.CLOUDINARY_API_KEY || '',
            apiSecret: process.env.CLOUDINARY_API_SECRET || '',
          },
          payment: {
            paystackSecret: process.env.PAYSTACK_SECRET_KEY || '',
            paystackPublic: process.env.PAYSTACK_PUBLIC_KEY || '',
            flutterwaveSecret: process.env.FLUTTERWAVE_SECRET_KEY || '',
            flutterwavePublic: process.env.FLUTTERWAVE_PUBLIC_KEY || '',
          },
        }),
      ],
    }),

    // Event emitter for internal events
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 20,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),

    // Rate limiting - Global 100 req/15min
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,      // 1 second
        limit: 3,       // 3 requests per second for auth
      },
      {
        name: 'medium',
        ttl: 60000,     // 1 minute
        limit: 100,     // 100 requests per minute
      },
      {
        name: 'long',
        ttl: 900000,    // 15 minutes
        limit: 1000,    // 1000 requests per 15 minutes
      },
    ]),

    // Shared module with all services
    SharedModule,
    
    // Auth module
    AuthModule,

    // Users module
    UsersModule,

    // Products module
    ProductsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    // Global response interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    // Global exception filter
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    // Global rate limiting guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    console.log('🚀 KWIKSELLER API Module initialized');
    console.log('📦 SharedModule loaded with all services');
    console.log('🔐 AuthModule loaded');
    console.log('👥 UsersModule loaded');
    console.log('🛍️ ProductsModule loaded');
    console.log('🔗 EventEmitter2 ready for events');
  }
}
