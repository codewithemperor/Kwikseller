import { Global, Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { PrismaService } from '../database/prisma.service';
import { 
  EmailService, 
  PushService, 
  CacheService, 
  StorageService, 
  AuditService, 
  NotificationService, 
  PaymentService 
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
    EmailService,
    PushService,
    CacheService,
    StorageService,
    AuditService,
    NotificationService,
    PaymentService,
  ],
  exports: [
    PrismaService,
    EmailService,
    PushService,
    CacheService,
    StorageService,
    AuditService,
    NotificationService,
    PaymentService,
    ConfigModule,
    EventEmitterModule,
  ],
})
export class SharedModule implements OnModuleInit {
  onModuleInit() {
    console.log('📦 SharedModule initialized');
  }
}
