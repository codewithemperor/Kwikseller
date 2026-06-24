import { Module } from '@nestjs/common';
import { SharedModule } from '../common/shared.module';
import { EscrowService } from './escrow.service';
import { WalletService } from './wallet.service';
import { PaymentsController } from './payments.controller';

@Module({
  imports: [SharedModule],
  controllers: [PaymentsController],
  providers: [EscrowService, WalletService],
  exports: [EscrowService], // Exported so CommerceModule can call holdPayment on checkout
})
export class PaymentsModule {}
