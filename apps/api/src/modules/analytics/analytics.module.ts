import { Module } from '@nestjs/common';
import { SharedModule } from '../../common/shared.module';
import { VendorAnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [SharedModule],
  controllers: [VendorAnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
