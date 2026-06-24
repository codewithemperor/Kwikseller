import { Module } from '@nestjs/common';
import { SharedModule } from '../../common/shared.module';
import { DeliveryService } from './delivery.service';
import {
  VendorDeliveryController,
  AdminDeliveryController,
  AdminEscrowController,
} from './delivery.controllers';

@Module({
  imports: [SharedModule],
  controllers: [
    VendorDeliveryController,
    AdminDeliveryController,
    AdminEscrowController,
  ],
  providers: [DeliveryService],
  exports: [DeliveryService],
})
export class DeliveryModule {}
