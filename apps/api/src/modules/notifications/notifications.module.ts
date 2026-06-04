import { Module } from '@nestjs/common';
import { SharedModule } from '../../common/shared.module';
import { VendorNotificationsController } from './notifications.controller';

@Module({
  imports: [SharedModule],
  controllers: [VendorNotificationsController],
})
export class NotificationsModule {}
