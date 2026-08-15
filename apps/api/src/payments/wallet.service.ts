import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { NotificationService } from '../common/services/notification.service';
import { PayoutRequestDto, TransactionQueryDto, WithdrawalQueryDto } from './dto/payments.dto';

type DbClient = Record<string, any>;

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
  ) {}

  private db(): DbClient {
    return this.prisma as unknown as DbClient;
  }

  // ─── Get Vendor Balance ────────────────────────────────────────────────────

  async getVendorBalance(vendorId: string): Promise<{
    available: number;
    pending: number;
    totalEarned: number;
  }> {
    const wallet = await this.getOrCreateWallet(vendorId);
    return {
      available: Number(wallet.availableBalance ?? 0),
      pending: Number(wallet.pendingBalance ?? 0),
      totalEarned: Number(wallet.totalEarned ?? 0),
    };
  }

  // ─── Request Payout / Withdrawal ──────────────────────────────────────────

  async requestPayout(vendorId: string, dto: PayoutRequestDto) {
    const db = this.db();
    const wallet = await this.getOrCreateWallet(vendorId);

    const amount = Number(dto.amount);
    const available = Number(wallet.availableBalance ?? 0);

    if (amount > available) {
      throw new BadRequestException(
        `Insufficient balance. Available: ₦${available.toLocaleString()}, Requested: ₦${amount.toLocaleString()}`,
      );
    }

    if (amount < 100) {
      throw new BadRequestException('Minimum withdrawal amount is ₦100');
    }

    const reference = `WDR-${Date.now()}-${vendorId.slice(0, 8).toUpperCase()}`;

    // Create withdrawal record + debit wallet in transaction
    const withdrawal = await db.$transaction(async (tx: any) => {
      // Debit wallet
      await tx.wallet?.update({
        where: { vendorId },
        data: {
          availableBalance: { decrement: amount },
          totalWithdrawn: { increment: amount },
        },
      });

      // Create withdrawal
      return tx.withdrawal?.create({
        data: {
          vendorId,
          amount,
          bankCode: dto.bankCode,
          accountNumber: dto.accountNumber,
          accountName: dto.accountName,
          status: 'PENDING',
          reference,
        },
      });
    });

    // Notify vendor
    try {
      await this.notificationService.create({
        userId: vendorId,
        type: 'WITHDRAWAL_REQUESTED',
        title: 'Withdrawal Requested',
        message: `Your withdrawal of ₦${amount.toLocaleString()} to ${dto.accountName} (${dto.accountNumber}) is being processed. Reference: ${reference}`,
        data: { withdrawalId: withdrawal?.id, amount, reference },
      });
    } catch (err) {
      this.logger.warn('Failed to send withdrawal notification', err);
    }

    // Audit log
    await this.auditService.log({
      userId: vendorId,
      action: 'wallet.withdrawal_requested',
      entity: 'Withdrawal',
      entityId: withdrawal?.id,
      changes: { amount, bankCode: dto.bankCode, accountNumber: dto.accountNumber, reference },
    });

    this.logger.log(`Withdrawal ${withdrawal?.id} created: ₦${amount} from vendor ${vendorId}`);
    return withdrawal;
  }

  // ─── Get Payout History ───────────────────────────────────────────────────

  async getPayoutHistory(vendorId: string, params: WithdrawalQueryDto) {
    const db = this.db();
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { vendorId };
    if (params.status && params.status !== 'all') {
      where.status = params.status;
    }

    const [withdrawals, total] = await Promise.all([
      db.withdrawal?.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.withdrawal?.count({ where }),
    ]);

    return {
      data: withdrawals ?? [],
      meta: { page, limit, total: total ?? 0, totalPages: Math.ceil((total ?? 0) / limit) },
    };
  }

  // ─── Get Transaction History ──────────────────────────────────────────────

  async getTransactionHistory(vendorId: string, params: TransactionQueryDto) {
    const db = this.db();
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    // Build combined transaction list from escrow releases, withdrawals, and refunds
    const typeFilter = params.type;
    const statusFilter = params.status;

    // Escrow releases (money in)
    const escrowWhere: Record<string, unknown> = {
      vendorId,
      status: 'RELEASED',
    };
    const releasedEscrows = await db.escrow?.findMany({
      where: escrowWhere,
      include: { order: { select: { checkoutReference: true } } },
      orderBy: { releasedAt: 'desc' },
    });

    // Withdrawals (money out)
    const withdrawalWhere: Record<string, unknown> = { vendorId };
    if (statusFilter && statusFilter !== 'all') {
      withdrawalWhere.status = statusFilter;
    }
    const withdrawals = await db.withdrawal?.findMany({
      where: withdrawalWhere,
      orderBy: { createdAt: 'desc' },
    });

    // Refunded escrows (money returned)
    const refundedEscrows = await db.escrow?.findMany({
      where: { vendorId, status: 'REFUNDED' },
      include: { order: { select: { checkoutReference: true } } },
      orderBy: { updatedAt: 'desc' },
    });

    // Map escrows to transaction items
    const escrowTransactions = (releasedEscrows ?? []).map((e: any) => ({
      id: e.id,
      type: 'escrow_release',
      status: 'completed',
      amount: e.amount,
      description: `Escrow release — Order #${(e.order?.checkoutReference ?? e.orderId).slice(-8)}`,
      reference: e.id,
      createdAt: e.releasedAt ?? e.updatedAt,
    }));

    const refundTransactions = (refundedEscrows ?? []).map((e: any) => ({
      id: e.id,
      type: 'refund',
      status: 'completed',
      amount: -e.amount,
      description: `Refund — Order #${(e.order?.checkoutReference ?? e.orderId).slice(-8)}`,
      reference: e.id,
      createdAt: e.updatedAt,
    }));

    const withdrawalTransactions = (withdrawals ?? []).map((w: any) => ({
      id: w.id,
      type: 'withdrawal',
      status: w.status?.toLowerCase() ?? 'pending',
      amount: -w.amount,
      description: `Withdrawal to ${w.accountName} (${w.accountNumber.slice(-4)})`,
      reference: w.reference ?? w.id,
      createdAt: w.createdAt,
    }));

    // Combine and sort
    let transactions = [
      ...escrowTransactions,
      ...withdrawalTransactions,
      ...refundTransactions,
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply type filter
    if (typeFilter && typeFilter !== 'all') {
      transactions = transactions.filter((t) => t.type === typeFilter);
    }

    const total = transactions.length;
    const paginated = transactions.slice(skip, skip + limit);

    return {
      data: paginated,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── Credit Wallet (IDEMPOTENT — uses WalletTransaction ledger) ──────────
  //
  // This is the canonical wallet-credit method. It is idempotent: if called
  // twice with the same `reference`, the second call is a no-op.
  // The WalletTransaction row is the single source of truth for balance changes.
  //
  async creditWallet(
    vendorId: string,
    amount: number,
    type: string,
    reference: string,
    metadata?: { orderId?: string; escrowId?: string; reason?: string; createdBy?: string },
  ): Promise<{ credited: boolean; balanceAfter: number }> {
    const db = this.db();
    return db.$transaction(async (tx: any) => {
      // Idempotency check — if a transaction with this reference exists, no-op.
      const existing = await tx.walletTransaction?.findUnique({ where: { reference } });
      if (existing) {
        this.logger.warn(`Wallet credit already applied for reference ${reference} — skipping (idempotent)`);
        return { credited: false, balanceAfter: Number(existing.balanceAfter ?? 0) };
      }

      // Get or create wallet inside the transaction (lock via vendorId unique)
      let wallet = await tx.wallet?.findUnique({ where: { vendorId } });
      if (!wallet) {
        wallet = await tx.wallet?.create({
          data: { vendorId, availableBalance: 0, pendingBalance: 0, totalEarned: 0, totalWithdrawn: 0 },
        });
      }

      const balanceAfter = Number(wallet.availableBalance ?? 0) + amount;

      // Create the ledger entry (atomic with the balance update)
      await tx.walletTransaction?.create({
        data: {
          walletId: wallet.id,
          vendorId,
          type: type as any,
          amount,
          balanceAfter,
          reference,
          orderId: metadata?.orderId,
          escrowId: metadata?.escrowId,
          reason: metadata?.reason ?? type,
          createdBy: metadata?.createdBy,
        },
      });

      // Update wallet balances
      await tx.wallet?.update({
        where: { vendorId },
        data: {
          availableBalance: { increment: amount },
          totalEarned: { increment: amount },
        },
      });

      this.logger.log(`Wallet credited: ₦${amount} to vendor ${vendorId} (${type}, ref: ${reference}) — balance now ₦${balanceAfter}`);
      return { credited: true, balanceAfter };
    });
  }

  // ─── Debit Wallet (IDEMPOTENT — for withdrawals) ─────────────────────────

  async debitWallet(
    vendorId: string,
    amount: number,
    reference: string,
    metadata?: { reason?: string; createdBy?: string },
  ): Promise<{ debited: boolean; balanceAfter: number }> {
    const db = this.db();
    return db.$transaction(async (tx: any) => {
      const existing = await tx.walletTransaction?.findUnique({ where: { reference } });
      if (existing) {
        this.logger.warn(`Wallet debit already applied for reference ${reference} — skipping (idempotent)`);
        return { debited: false, balanceAfter: Number(existing.balanceAfter ?? 0) };
      }

      const wallet = await tx.wallet?.findUnique({ where: { vendorId } });
      if (!wallet || Number(wallet.availableBalance ?? 0) < amount) {
        throw new BadRequestException('Insufficient wallet balance for debit');
      }

      const balanceAfter = Number(wallet.availableBalance ?? 0) - amount;

      await tx.walletTransaction?.create({
        data: {
          walletId: wallet.id,
          vendorId,
          type: 'WITHDRAWAL',
          amount: -amount, // negative for debit
          balanceAfter,
          reference,
          reason: metadata?.reason ?? 'WITHDRAWAL',
          createdBy: metadata?.createdBy,
        },
      });

      await tx.wallet?.update({
        where: { vendorId },
        data: {
          availableBalance: { decrement: amount },
          totalWithdrawn: { increment: amount },
        },
      });

      this.logger.log(`Wallet debited: ₦${amount} from vendor ${vendorId} (ref: ${reference}) — balance now ₦${balanceAfter}`);
      return { debited: true, balanceAfter };
    });
  }

  // ─── Get wallet transaction history (ledger) ──────────────────────────────

  async getTransactions(vendorId: string, params: { page?: number; limit?: number } = {}) {
    const page = Math.max(params.page ?? 1, 1);
    const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where: { vendorId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.walletTransaction.count({ where: { vendorId } }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── Get or Create Wallet ──────────────────────────────────────────────────

  async getOrCreateWallet(vendorId: string) {
    const db = this.db();
    let wallet = await db.wallet?.findUnique({ where: { vendorId } });

    if (!wallet) {
      wallet = await db.wallet?.create({
        data: {
          vendorId,
          availableBalance: 0,
          pendingBalance: 0,
          totalEarned: 0,
          totalWithdrawn: 0,
        },
      });
    }

    return wallet;
  }

  // ─── Process Withdrawal (admin action) ────────────────────────────────────

  async processWithdrawal(withdrawalId: string, status: 'PROCESSED' | 'FAILED'): Promise<void> {
    const db = this.db();
    const withdrawal = await db.withdrawal?.findUnique({
      where: { id: withdrawalId },
    });

    if (!withdrawal) {
      throw new NotFoundException(`Withdrawal ${withdrawalId} not found`);
    }

    if (withdrawal.status !== 'PENDING') {
      throw new BadRequestException(`Withdrawal is already ${withdrawal.status}`);
    }

    await db.$transaction(async (tx: any) => {
      await tx.withdrawal?.update({
        where: { id: withdrawalId },
        data: { status, processedAt: new Date() },
      });

      // If failed, reverse the debit
      if (status === 'FAILED') {
        await tx.wallet?.update({
          where: { vendorId: withdrawal.vendorId },
          data: {
            availableBalance: { increment: withdrawal.amount },
            totalWithdrawn: { decrement: withdrawal.amount },
          },
        });
      }
    });

    // Notify vendor
    try {
      const title =
        status === 'PROCESSED'
          ? 'Withdrawal Processed'
          : 'Withdrawal Failed';
      const message =
        status === 'PROCESSED'
          ? `Your withdrawal of ₦${withdrawal.amount.toLocaleString()} has been processed successfully.`
          : `Your withdrawal of ₦${withdrawal.amount.toLocaleString()} failed. The amount has been returned to your wallet.`;

      await this.notificationService.create({
        userId: withdrawal.vendorId,
        type: status === 'PROCESSED' ? 'WITHDRAWAL_PROCESSED' : 'WITHDRAWAL_FAILED',
        title,
        message,
        data: { withdrawalId, amount: withdrawal.amount, status },
      });
    } catch (err) {
      this.logger.warn('Failed to send withdrawal status notification', err);
    }

    await this.auditService.log({
      userId: withdrawal.vendorId,
      action: `withdrawal.${status.toLowerCase()}`,
      entity: 'Withdrawal',
      entityId: withdrawalId,
      changes: { amount: withdrawal.amount, reference: withdrawal.reference },
    });
  }
}
