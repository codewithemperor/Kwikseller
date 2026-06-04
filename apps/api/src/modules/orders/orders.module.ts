import { Module } from '@nestjs/common';
import { SharedModule } from '../../common/shared.module';
import { VendorOrdersController } from './orders.controller';

@Module({
  imports: [SharedModule],
  controllers: [VendorOrdersController],
})
export class OrdersModule {}
