import { Global, Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { PrismaService } from '../database/prisma.service';
import {
  EmailService,
  EmailQueueWorker,
  PushService,
  CacheService,
  StorageService,
  AuditService,
  NotificationService,
  PaymentService,
  PlatformSettingService,
  OrderEventListener,
  InventoryCronService,
  JobQueueService,
  RedisService,
} from './services';

@Global()
@Module({
  imports: [
    ConfigModule,
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),
  ],
  providers: [
    PrismaService,
    RedisService,
    EmailService,
    EmailQueueWorker,
    PushService,
    CacheService,
    StorageService,
    AuditService,
    NotificationService,
    PaymentService,
    PlatformSettingService,
    JobQueueService,
    // Event listeners + cron — registered here so they are instantiated at
    // bootstrap, which is what wires up their @OnEvent / @Cron decorators.
    OrderEventListener,
    InventoryCronService,
  ],
  exports: [
    PrismaService,
    RedisService,
    EmailService,
    PushService,
    CacheService,
    StorageService,
    AuditService,
    NotificationService,
    PaymentService,
    PlatformSettingService,
    JobQueueService,
    ConfigModule,
    EventEmitterModule,
  ],
})
export class SharedModule implements OnModuleInit {
  onModuleInit() {
    console.log('📦 SharedModule initialized');
  }
}
