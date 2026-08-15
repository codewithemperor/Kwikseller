import { Module } from '@nestjs/common';
import { UploadModule } from '../upload/upload.module';
import { VendorStoreController } from './vendor-store.controller';
import { VendorStoreService } from './vendor-store.service';

@Module({
  imports: [UploadModule],
  controllers: [VendorStoreController],
  providers: [VendorStoreService],
})
export class VendorStoreModule {}
