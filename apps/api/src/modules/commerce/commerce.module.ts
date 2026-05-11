import { Module } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CommerceService } from './commerce.service';
import { PaystackService } from './paystack.service';
import {
  AdminCommerceController,
  CartController,
  CheckoutController,
  DeliveryRatesController,
  OrdersController,
  PaymentsController,
  PoolController,
  PublicStoresController,
  VendorCommerceController,
} from './commerce.controller';

@Module({
  controllers: [
    CartController,
    CheckoutController,
    DeliveryRatesController,
    PaymentsController,
    OrdersController,
    PoolController,
    PublicStoresController,
    VendorCommerceController,
    AdminCommerceController,
  ],
  providers: [CommerceService, PaystackService, PrismaService],
  exports: [CommerceService],
})
export class CommerceModule {}
