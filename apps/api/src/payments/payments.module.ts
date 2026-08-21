import { Module } from '@nestjs/common';
import { SharedModule } from '../common/shared.module';
import { EscrowSchedulerService } from './escrow-scheduler.service';
import { EscrowService } from './escrow.service';
import { WalletService } from './wallet.service';
import { PaymentsController } from './payments.controller';

@Module({
  imports: [SharedModule],
  controllers: [PaymentsController],
  providers: [EscrowService, EscrowSchedulerService, WalletService],
  exports: [EscrowService, WalletService], // Exported so CommerceModule can call holdPayment/releaseFunds
})
export class PaymentsModule {}
