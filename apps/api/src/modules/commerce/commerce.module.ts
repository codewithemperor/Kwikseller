import { Module } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CommerceService } from './commerce.service';
import { PaystackService } from './paystack.service';
import { PaymentsModule } from '../../payments/payments.module';
import {
  AdminCommerceController,
  CartController,
  CheckoutController,
  DeliveryRatesController,
  OrdersController,
  PaymentsController,
  PoolController,
  PublicVendorsController,
  VendorCommerceController,
} from './commerce.controller';

@Module({
  imports: [PaymentsModule],
  controllers: [
    CartController,
    CheckoutController,
    DeliveryRatesController,
    PaymentsController,
    OrdersController,
    PoolController,
    PublicVendorsController,
    VendorCommerceController,
    AdminCommerceController,
  ],
  providers: [CommerceService, PaystackService, PrismaService],
  exports: [CommerceService],
})
export class CommerceModule {}
