import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { CommerceService } from './commerce.service';

/**
 * PaymentReconciliationService
 *
 * Background reconciliation for pending gateway payments.
 * This keeps payment/order status moving even when:
 * - the customer closes the callback page before frontend verification runs
 * - Paystack webhook delivery is delayed
 * - the client polls late or not at all
 */
@Injectable()
export class PaymentReconciliationService {
  private readonly logger = new Logger(PaymentReconciliationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly commerceService: CommerceService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async reconcilePendingPayments() {
    const pendingPayments = await this.prisma.payment.findMany({
      where: {
        status: 'PENDING',
        gateway: 'PAYSTACK',
        createdAt: {
          lte: new Date(Date.now() - 2 * 60 * 1000),
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 25,
      select: {
        id: true,
        reference: true,
        createdAt: true,
      },
    });

    if (pendingPayments.length === 0) {
      return;
    }

    let processed = 0;
    let stillPending = 0;
    let failed = 0;

    for (const payment of pendingPayments) {
      try {
        const result = await this.commerceService.verifyPayment(payment.reference);
        const normalizedStatus = String(result?.status ?? '').toUpperCase();

        if (normalizedStatus === 'PAID' || normalizedStatus === 'SUCCESS') {
          processed += 1;
        } else if (normalizedStatus === 'PENDING') {
          stillPending += 1;
        } else {
          failed += 1;
        }
      } catch (error) {
        failed += 1;
        this.logger.warn(
          `Pending payment reconciliation failed for ${payment.reference}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    this.logger.log(
      `Payment reconciliation scanned ${pendingPayments.length} pending payments: ${processed} confirmed, ${stillPending} still pending, ${failed} failed`,
    );
  }
}
