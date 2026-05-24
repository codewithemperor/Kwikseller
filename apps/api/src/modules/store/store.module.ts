import { Module } from '@nestjs/common';
import { UploadModule } from '../upload/upload.module';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';

@Module({
  imports: [UploadModule],
  controllers: [StoreController],
  providers: [StoreService],
})
export class StoreModule {}
