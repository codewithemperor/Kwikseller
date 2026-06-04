import { Module } from '@nestjs/common';
import { SharedModule } from '../../common/shared.module';
import { VendorSubscriptionsController } from './subscriptions.controller';

@Module({
  imports: [SharedModule],
  controllers: [VendorSubscriptionsController],
})
export class SubscriptionsModule {}
