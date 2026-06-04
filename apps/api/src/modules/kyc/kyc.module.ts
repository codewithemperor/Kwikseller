import { Module } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VendorKycController } from './kyc.controller';
import { AdminKycController } from './kyc-admin.controller';

@Module({
  imports: [],
  controllers: [VendorKycController, AdminKycController],
  providers: [PrismaService, JwtAuthGuard],
  exports: [],
})
export class KycModule {}
