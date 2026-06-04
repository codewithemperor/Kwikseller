import { Module } from '@nestjs/common';
import { SharedModule } from '../../common/shared.module';
import { VendorProfileController } from './vendor-profile.controller';

@Module({
  imports: [SharedModule],
  controllers: [VendorProfileController],
})
export class VendorProfileModule {}
