import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../modules/auth/decorators/current-user.decorator';
import { EscrowService } from './escrow.service';
import { WalletService } from './wallet.service';
import { PayoutRequestDto, TransactionQueryDto, WithdrawalQueryDto } from './dto/payments.dto';

type AuthContext = {
  id?: string;
  sub?: string;
  userId?: string;
  role?: string;
  storeId?: string;
  email?: string;
};

@Controller('vendor/wallet')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(
    private readonly walletService: WalletService,
    private readonly escrowService: EscrowService,
  ) {}

  private getVendorId(user: AuthContext): string {
    return user?.id ?? user?.sub ?? user?.userId ?? '';
  }

  // ─── Wallet Balance ──────────────────────────────────────────────────────

  @Get()
  async getWallet(@CurrentUser() user: AuthContext) {
    const vendorId = this.getVendorId(user);
    return this.walletService.getVendorBalance(vendorId);
  }

  // ─── Transaction History ─────────────────────────────────────────────────

  @Get('transactions')
  async getTransactions(
    @CurrentUser() user: AuthContext,
    @Query() query: TransactionQueryDto,
  ) {
    const vendorId = this.getVendorId(user);
    return this.walletService.getTransactionHistory(vendorId, {
      page: query.page ? Number(query.page) : undefined,
      limit: query.limit ? Number(query.limit) : undefined,
      type: query.type,
      status: query.status,
    });
  }

  // ─── Request Withdrawal ──────────────────────────────────────────────────

  @Post('withdraw')
  async requestWithdrawal(
    @CurrentUser() user: AuthContext,
    @Body() dto: PayoutRequestDto,
  ) {
    const vendorId = this.getVendorId(user);
    return this.walletService.requestPayout(vendorId, dto);
  }

  // ─── Withdrawal History ───────────────────────────────────────────────────

  @Get('withdrawals')
  async getWithdrawals(
    @CurrentUser() user: AuthContext,
    @Query() query: WithdrawalQueryDto,
  ) {
    const vendorId = this.getVendorId(user);
    return this.walletService.getPayoutHistory(vendorId, {
      page: query.page ? Number(query.page) : undefined,
      limit: query.limit ? Number(query.limit) : undefined,
      status: query.status,
    });
  }

  // ─── Escrow Holdings ──────────────────────────────────────────────────────

  @Get('escrow-holdings')
  async getEscrowHoldings(@CurrentUser() user: AuthContext) {
    const vendorId = this.getVendorId(user);
    return this.escrowService.getVendorHoldings(vendorId);
  }
}
