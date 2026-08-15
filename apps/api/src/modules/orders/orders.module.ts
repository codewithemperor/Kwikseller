import { Module } from '@nestjs/common';
import { SharedModule } from '../../common/shared.module';
import { PaymentsModule } from '../../payments/payments.module';
import { VendorOrdersController } from './orders.controller';
import { OrderLifecycleService } from './order-lifecycle.service';
import { OrderLifecycleController } from './order-lifecycle.controller';

@Module({
  // SharedModule is @Global() but we list it explicitly for clarity.
  // PaymentsModule exports EscrowService (needed for confirmReceipt → releaseByOrderId).
  imports: [SharedModule, PaymentsModule],
  controllers: [VendorOrdersController, OrderLifecycleController],
  providers: [OrderLifecycleService],
  exports: [OrderLifecycleService],
})
export class OrdersModule {}
