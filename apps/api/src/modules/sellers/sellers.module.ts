import { Module } from '@nestjs/common';
import { SharedModule } from '../../common/shared.module';
import { SellersController } from './sellers.controller';

@Module({
  imports: [SharedModule],
  controllers: [SellersController],
})
export class SellersModule {}
