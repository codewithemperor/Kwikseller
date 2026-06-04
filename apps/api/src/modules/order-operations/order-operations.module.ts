import { Module } from '@nestjs/common';
import { SharedModule } from '../../common/shared.module';
import { VendorOrderOperationsController } from './order-operations.controller';
import { OrderOperationsService } from './order-operations.service';

@Module({
  imports: [SharedModule],
  controllers: [VendorOrderOperationsController],
  providers: [OrderOperationsService],
})
export class OrderOperationsModule {}
