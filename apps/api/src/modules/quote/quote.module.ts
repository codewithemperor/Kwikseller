import { Module } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PaystackService } from '../commerce/paystack.service';
import { QuoteController } from './quote.controller';
import { QuoteService } from './quote.service';

/**
 * QuoteModule — wires the quote negotiation lifecycle.
 *
 * QuoteService depends on:
 *   - PrismaService  (persistence, provided here as a non-global provider
 *                     to mirror the CommerceModule convention)
 *   - EventEmitter2  (provided globally by SharedModule + EventEmitterModule.forRoot
 *                     in app.module.ts)
 *   - PaystackService (for initializePayment — provided here locally; CommerceModule
 *                     has its own instance, which is fine — PaystackService is a
 *                     stateless thin wrapper around the Paystack REST API)
 *   - ConfigService   (global, for frontendUrl — needed by the callback URL builder)
 *
 * Routes are registered on `/orders/:orderId/...` — see QuoteController for the
 * full list.
 */
@Module({
  controllers: [QuoteController],
  providers: [QuoteService, PrismaService, PaystackService],
  exports: [QuoteService],
})
export class QuoteModule {}
