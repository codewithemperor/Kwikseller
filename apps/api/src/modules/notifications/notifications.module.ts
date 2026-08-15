import { Module } from '@nestjs/common';
import { SharedModule } from '../../common/shared.module';
import { VendorNotificationsController } from './notifications.controller';
import { UserNotificationsController } from './user-notifications.controller';

@Module({
  imports: [SharedModule],
  controllers: [VendorNotificationsController, UserNotificationsController],
})
export class NotificationsModule {}
