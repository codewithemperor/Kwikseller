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
import { BrandsModule } from './modules/brands/brands.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { BannersModule } from './modules/banners/banners.module';
import { DealsModule } from './modules/deals/deals.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { UploadModule } from './modules/upload/upload.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AdminModule } from './modules/admin/admin.module';
import { SellersModule } from './modules/sellers/sellers.module';
import { CommerceModule } from './modules/commerce/commerce.module';
import { StoreModule } from './modules/store/store.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { KycModule } from './modules/kyc/kyc.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { OrdersModule } from './modules/orders/orders.module';
import { VendorProfileModule } from './modules/vendor-profile/vendor-profile.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { OrderOperationsModule } from './modules/order-operations/order-operations.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/api/.env.local', 'apps/api/.env', '.env.local', '.env'],
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

    // Brands module
    BrandsModule,

    // Categories module
    CategoriesModule,

    // Banners module
    BannersModule,

    // Deals/Promotions module
    DealsModule,

    // Coupons module
    CouponsModule,

    // Upload module
    UploadModule,

    // Dashboard module
    DashboardModule,

    // Admin module (routes with /admin/ prefix)
    AdminModule,

    // Sellers module (public seller listings)
    SellersModule,

    // Vendor store profile module
    StoreModule,

    // Commerce module (cart, checkout, orders, payments, pool, vendor/admin ops)
    CommerceModule,

    // Payments module (vendor wallet and escrow holdings)
    PaymentsModule,

    // Notifications module (vendor notifications)
    NotificationsModule,

    // Subscriptions module (vendor subscription management)
    SubscriptionsModule,

    // KYC module (vendor KYC verification)
    KycModule,

    // Analytics module (vendor analytics)
    AnalyticsModule,

    // Orders module (vendor order actions)
    OrdersModule,

    // Vendor profile module (vendor profile update)
    VendorProfileModule,

    // Delivery module (vendor delivery management + admin escrow)
    DeliveryModule,

    // Order operations module (vendor order notes + operations)
    OrderOperationsModule,
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
    console.log('🏷️ BrandsModule loaded');
    console.log('📁 CategoriesModule loaded');
    console.log('🖼️ BannersModule loaded');
    console.log('🔥 DealsModule loaded');
    console.log('🎫 CouponsModule loaded');
    console.log('📤 UploadModule loaded');
    console.log('📊 DashboardModule loaded');
    console.log('🔧 AdminModule loaded');
    console.log('🏪 SellersModule loaded');
    console.log('🔗 EventEmitter2 ready for events');
    console.log('🪪 KycModule loaded');
    console.log('📈 AnalyticsModule loaded');
    console.log('📦 OrdersModule loaded');
    console.log('👤 VendorProfileModule loaded');
    console.log('🚚 DeliveryModule loaded');
    console.log('📋 OrderOperationsModule loaded');
  }
}
