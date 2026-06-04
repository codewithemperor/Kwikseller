import { Module } from '@nestjs/common';
import { SharedModule } from '../../common/shared.module';
import { DeliveryService } from './delivery.service';
import {
  VendorDeliveryController,
  VendorEscrowController,
  AdminDeliveryController,
  AdminEscrowController,
} from './delivery.controllers';

@Module({
  imports: [SharedModule],
  controllers: [
    VendorDeliveryController,
    VendorEscrowController,
    AdminDeliveryController,
    AdminEscrowController,
  ],
  providers: [DeliveryService],
  exports: [DeliveryService],
})
export class DeliveryModule {}
