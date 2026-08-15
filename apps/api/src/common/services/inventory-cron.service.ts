import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';

/**
 * InventoryCronService — releases expired inventory reservations and cancels
 * unpaid orders whose 15-minute payment TTL elapsed.
 *
 * Reservation lifecycle (commerce.service.ts:reserveInventoryForCheckoutItem):
 *   ACTIVE  → on payment success: COMMITTED (funds captured, stock consumed)
 *          → on expiry (this cron): EXPIRED, stock returned to available
 *
 * For every expired ACTIVE reservation whose associated Order still has
 * `paymentStatus = PENDING`, the Order is moved to:
 *   status      = CANCELLED
 *   quoteStatus = CANCELLED
 *
 * Each reservation's expiry is handled in its own $transaction so one
 * failure cannot block the others. All errors are logged + swallowed
 * (the cron itself must never throw — @nestjs/schedule would just log
 * anyway, but we want to keep the loop going for sibling reservations).
 *
 * Schedule: every 5 minutes via standard 5-field cron.
 */
@Injectable()
export class InventoryCronService {
  private readonly logger = new Logger(InventoryCronService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron('*/5 * * * *')
  async expireReservations() {
    const now = new Date();
    let expiredCount = 0;
    let failedCount = 0;
    let ordersCancelled = 0;

    let reservations: any[];
    try {
      reservations = await this.prisma.inventoryReservation.findMany({
        where: { status: 'ACTIVE', expiresAt: { lt: now } },
        include: {
          inventoryItem: { select: { id: true, available: true, reserved: true } },
          orderItem: { select: { id: true, orderId: true } },
        },
        orderBy: { expiresAt: 'asc' },
      });
    } catch (err) {
      this.logger.error(
        `expireReservations: failed to fetch reservations: ${err instanceof Error ? err.message : String(err)}`,
      );
      return;
    }

    if (reservations.length === 0) return; // silent — nothing to do

    this.logger.log(
      `expireReservations: processing ${reservations.length} expired ACTIVE reservation(s) as of ${now.toISOString()}`,
    );

    for (const reservation of reservations) {
      try {
        const result = await this.prisma.$transaction(async (tx: any) => {
          // 1. Mark reservation EXPIRED
          await tx.inventoryReservation.update({
            where: { id: reservation.id },
            data: { status: 'EXPIRED' },
          });

          // 2. Restore inventory — move quantity back from reserved → available
          if (reservation.inventoryItem) {
            await tx.inventoryItem.update({
              where: { id: reservation.inventoryItem.id },
              data: {
                available: { increment: reservation.quantity },
                reserved: { decrement: reservation.quantity },
              },
            });
          }

          // 3. Cancel the associated order if payment is still PENDING
          let orderCancelled = false;
          const orderId = reservation.orderItem?.orderId;
          if (orderId) {
            const order = await tx.order.findUnique({
              where: { id: orderId },
              select: { id: true, paymentStatus: true, status: true, quoteStatus: true },
            });

            if (order && order.paymentStatus === 'PENDING') {
              await tx.order.update({
                where: { id: orderId },
                data: {
                  status: 'CANCELLED',
                  quoteStatus: 'CANCELLED',
                },
              });
              orderCancelled = true;
            }
          }

          return { orderId, orderCancelled };
        });

        expiredCount += 1;
        if (result.orderCancelled) ordersCancelled += 1;
        this.logger.log(
          `expireReservations: reservation ${reservation.id} → EXPIRED, restored ${reservation.quantity} unit(s) to inventoryItem ${reservation.inventoryItem?.id}` +
            (result.orderCancelled ? `, order ${result.orderId} → CANCELLED` : ''),
        );
      } catch (err) {
        failedCount += 1;
        this.logger.error(
          `expireReservations: failed to expire reservation ${reservation.id}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    this.logger.log(
      `expireReservations: done — expired=${expiredCount} cancelledOrders=${ordersCancelled} failed=${failedCount}`,
    );
  }
}
