import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../modules/auth/decorators/current-user.decorator';
import { Roles } from '../modules/auth/decorators/roles.decorator';
import { UserRole } from '../modules/auth/dto/auth.dto';
import { EscrowService } from './escrow.service';
import { WalletService } from './wallet.service';
import { DisputeResolutionDto } from './dto/payments.dto';

type AuthContext = {
  id?: string;
  sub?: string;
  userId?: string;
  role?: string;
  email?: string;
};

@Controller('admin/escrow')
@UseGuards(JwtAuthGuard)
export class PaymentsAdminController {
  constructor(
    private readonly escrowService: EscrowService,
    private readonly walletService: WalletService,
  ) {}

  // ─── Get Escrow Details ──────────────────────────────────────────────────

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getEscrow(@Param('id') id: string) {
    return this.escrowService.getById(id);
  }

  // ─── Manual Escrow Release ──────────────────────────────────────────────

  @Post(':deliveryId/release')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async releaseEscrow(
    @Param('deliveryId') deliveryId: string,
    @CurrentUser() user: AuthContext,
  ) {
    await this.escrowService.releaseFunds(deliveryId);
    return { success: true, message: 'Escrow funds released successfully' };
  }

  // ─── Admin Refund ────────────────────────────────────────────────────────

  @Post(':deliveryId/refund')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async refundEscrow(
    @Param('deliveryId') deliveryId: string,
    @Body() body: { reason?: string },
    @CurrentUser() user: AuthContext,
  ) {
    // Get escrow by delivery ID first
    const escrow = await this.escrowService.getByDeliveryId(deliveryId);
    if (!escrow) {
      return { success: false, message: 'No escrow found for this delivery' };
    }

    await this.escrowService.refundToCustomer(
      escrow.orderId,
      body.reason,
    );
    return { success: true, message: 'Refund processed successfully' };
  }

  // ─── Resolve Dispute ────────────────────────────────────────────────────

  @Post(':deliveryId/dispute/resolve')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async resolveDispute(
    @Param('deliveryId') deliveryId: string,
    @Body() dto: DisputeResolutionDto,
    @CurrentUser() user: AuthContext,
  ) {
    await this.escrowService.resolveDispute(
      deliveryId,
      dto.resolution,
      dto.vendorAmount,
      dto.refundReason,
    );
    return { success: true, message: `Dispute resolved: ${dto.resolution}` };
  }

  // ─── Get Escrows Pending Release (for cron / admin dashboard) ─────────────

  @Get('pending-release')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getPendingRelease() {
    return this.escrowService.getPendingRelease();
  }

  // ─── List Disputes ───────────────────────────────────────────────────────

  @Get('disputes')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async listDisputes(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.escrowService.listDisputes({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
    });
  }

  // ─── Process Withdrawal ───────────────────────────────────────────────────

  @Post('withdrawals/:withdrawalId/process')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async processWithdrawal(
    @Param('withdrawalId') withdrawalId: string,
    @Body() body: { status: 'PROCESSED' | 'FAILED' },
    @CurrentUser() user: AuthContext,
  ) {
    await this.walletService.processWithdrawal(withdrawalId, body.status);
    return { success: true, message: `Withdrawal ${body.status.toLowerCase()} successfully` };
  }
}
