import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../database/prisma.service';
import { EscrowService } from '../../payments/escrow.service';

/**
 * OrderLifecycleService
 *
 * Single source of truth for order state transitions:
 *   - Customer confirm-receipt (the ONLY trigger for Kwikscrow release)
 *   - Customer cancel (pre-payment only)
 *   - Vendor prepare / ready-for-pickup / dispatch / mark-delivered
 *
 * Critical rules:
 *   - `confirmReceipt` is the ONLY method that calls `escrowService.releaseByOrderId()`.
 *   - Vendor actions NEVER release escrow or credit the vendor wallet.
 *   - `cancelOrder` only works before payment — after payment it's a refund/dispute flow.
 *   - Every action verifies ownership server-side (buyer owns order, or vendor owns the store).
 */

type DbClient = Record<string, any>;

interface AuthUser {
  id: string;
  sub?: string;
  email?: string;
  role?: string;
}

interface CancelOrderDto {
  reason?: string;
}

interface DispatchOrderDto {
  trackingNumber?: string;
  carrier?: string;
}

@Injectable()
export class OrderLifecycleService {
  private readonly logger = new Logger(OrderLifecycleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly escrowService: EscrowService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /** Loose-typed Prisma client (matches the codebase-wide DbClient pattern). */
  private db(): DbClient {
    return this.prisma as unknown as DbClient;
  }

  /** Normalise the user id from either `id` (JwtStrategy.validate output) or `sub` (legacy). */
  private userId(user: AuthUser): string {
    const id = user?.id || user?.sub;
    if (!id) {
      throw new ForbiddenException('Authenticated user id missing');
    }
    return id;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /** Load an order with the relations needed for ownership + state checks. */
  private async loadOrder(orderId: string) {
    const db = this.db();
    const order = await db.order?.findUnique({
      where: { id: orderId },
      include: {
        store: { select: { id: true, vendorId: true, name: true, slug: true } },
        items: { select: { id: true, productId: true, variantId: true, quantity: true } },
        delivery: true,
        escrow: true,
        payment: true,
      },
    });
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }
    return order;
  }

  /** Verify the authenticated user is the buyer of this order. */
  private assertBuyer(order: any, userId: string): void {
    if (order.buyerId !== userId) {
      // Deliberately return 404 (not 403) to avoid leaking order existence.
      throw new NotFoundException(`Order ${order.id} not found`);
    }
  }

  /** Verify the authenticated user owns the store the order belongs to. */
  private async assertVendor(order: any, userId: string): Promise<void> {
    if (!order.store || order.store.vendorId !== userId) {
      throw new NotFoundException(`Order ${order.id} not found`);
    }
  }

  // ─── 1. Customer: Confirm Receipt (THE escrow-release trigger) ────────────

  async confirmReceipt(user: AuthUser, orderId: string) {
    const userId = this.userId(user);
    const db = this.db();
    const order = await this.loadOrder(orderId);
    this.assertBuyer(order, userId);

    if (order.paymentStatus !== 'PAID') {
      throw new BadRequestException(
        `Cannot confirm receipt: order paymentStatus is ${order.paymentStatus} (must be PAID).`,
      );
    }

    if (order.status === 'COMPLETED') {
      // Idempotent: already confirmed. Return as-is.
      this.logger.log(
        `Order ${orderId} already COMPLETED — confirmReceipt is a no-op`,
      );
      return order;
    }

    const now = new Date();
    const isPickup = order.deliveryMethod === 'PICKUP';

    // Ensure a Delivery row exists. If checkout/agreement didn't create one
    // (legacy path), create a minimal one now so the escrow release can resolve it.
    let delivery = order.delivery;
    if (!delivery) {
      const storeAddress =
        order.store?.name || 'Vendor location';
      delivery = await db.delivery?.create({
        data: {
          orderId: order.id,
          status: isPickup ? 'COMPLETED' : 'DELIVERED',
          pickupAddress: storeAddress,
          deliveryAddress: storeAddress,
          customerConfirmed: true,
          customerConfirmedAt: now,
          ...(isPickup
            ? { pickupConfirmedAt: now, pickupConfirmedBy: userId }
            : { deliveredAt: now }),
        },
      });
    } else {
      const deliveryUpdate: Record<string, any> = {
        customerConfirmed: true,
        customerConfirmedAt: now,
      };
      if (isPickup) {
        deliveryUpdate.pickupConfirmedAt = now;
        deliveryUpdate.pickupConfirmedBy = userId;
        deliveryUpdate.status = 'COMPLETED';
      } else {
        // Standard delivery: mark as DELIVERED (if not already COMPLETED).
        if (delivery.status !== 'COMPLETED') {
          deliveryUpdate.status = 'DELIVERED';
        }
        if (!delivery.deliveredAt) {
          deliveryUpdate.deliveredAt = now;
        }
      }
      delivery = await db.delivery?.update({
        where: { id: delivery.id },
        data: deliveryUpdate,
      });
    }

    // Two-phase order status transition: PENDING/CONFIRMED/PROCESSING/etc → DELIVERED → COMPLETED.
    // We do both writes inside a single transaction so the order never sits in a half-state.
    const updatedOrder = await db.$transaction?.([
      db.order?.update({
        where: { id: order.id },
        data: { status: 'DELIVERED' },
      }),
      // Second update is sequenced after the first via the same transaction array
      // (Prisma interactive transactions would be cleaner, but $transaction([...])
      // runs sequentially and is what this codebase uses elsewhere).
      db.order?.update({
        where: { id: order.id },
        data: { status: 'COMPLETED' },
      }),
    ]);

    // Take the final state from the last write.
    const finalOrder = Array.isArray(updatedOrder)
      ? updatedOrder[updatedOrder.length - 1]
      : updatedOrder;

    // ─── THE KWIKSCROW RELEASE ────────────────────────────────────────────
    // This is the ONLY call site in the codebase that triggers the release of
    // held funds → vendor wallet credit. If this throws, we still keep the
    // order/delivery state above (customer has confirmed receipt) but log the
    // failure so the release can be retried via the admin escrow endpoint.
    try {
      await this.escrowService.releaseByOrderId(order.id);
    } catch (err) {
      this.logger.error(
        `Escrow release failed for order ${order.id}: ${
          (err as Error)?.message || err
        }`,
      );
      // Do NOT rethrow — the customer's confirmation is recorded; the release
      // can be retried manually via the admin escrow release endpoint.
    }

    this.eventEmitter.emit('order.confirmed', {
      orderId: order.id,
      buyerId: order.buyerId,
      storeId: order.storeId,
      deliveryMethod: order.deliveryMethod,
      confirmedAt: now,
    });

    this.logger.log(
      `Order ${order.id} confirmed by buyer ${userId} — escrow release triggered`,
    );

    // Return a fresh, fully-populated order object.
    return this.loadOrder(order.id);
  }

  // ─── 2. Customer: Cancel Order (pre-payment only) ────────────────────────

  async cancelOrder(user: AuthUser, orderId: string, dto?: CancelOrderDto) {
    const userId = this.userId(user);
    const db = this.db();
    const order = await this.loadOrder(orderId);
    this.assertBuyer(order, userId);

    if (order.paymentStatus === 'PAID') {
      throw new BadRequestException(
        'Cannot cancel a paid order — open a dispute or request a refund instead.',
      );
    }
    if (order.status === 'CANCELLED') {
      // Idempotent.
      return order;
    }

    // Update order status + release inventory reservations inside a transaction.
    const updatedOrder = await db.$transaction?.(async (tx: DbClient) => {
      const updated = await tx.order?.update({
        where: { id: order.id },
        data: {
          status: 'CANCELLED',
          quoteStatus: 'CANCELLED',
        },
      });

      // Release all ACTIVE inventory reservations tied to this order's items.
      const orderItemIds = (order.items || []).map((i: any) => i.id);
      if (orderItemIds.length > 0) {
        const activeReservations = await tx.inventoryReservation?.findMany({
          where: {
            orderItemId: { in: orderItemIds },
            status: 'ACTIVE',
          },
          include: { inventoryItem: true },
        });

        for (const res of activeReservations || []) {
          await tx.inventoryReservation?.update({
            where: { id: res.id },
            data: { status: 'RELEASED' },
          });
          // Restore the available count on the inventory item.
          if (res.inventoryItem) {
            await tx.inventoryItem?.update({
              where: { id: res.inventoryItemId },
              data: {
                available: { increment: res.quantity },
                reserved: { decrement: res.quantity },
              },
            });
          }
        }
      }

      // If a Delivery row exists, mark it CANCELLED too.
      if (order.delivery) {
        await tx.delivery?.update({
          where: { id: order.delivery.id },
          data: { status: 'CANCELLED' },
        });
      }

      return updated;
    });

    this.eventEmitter.emit('order.cancelled', {
      orderId: order.id,
      buyerId: order.buyerId,
      storeId: order.storeId,
      reason: dto?.reason,
      cancelledAt: new Date(),
    });

    this.logger.log(
      `Order ${order.id} cancelled by buyer ${userId}${dto?.reason ? ` (reason: ${dto.reason})` : ''}`,
    );

    return this.loadOrder(order.id);
  }

  // ─── 3. Vendor: Prepare Order ────────────────────────────────────────────

  async prepareOrder(user: AuthUser, orderId: string) {
    const userId = this.userId(user);
    const db = this.db();
    const order = await this.loadOrder(orderId);
    await this.assertVendor(order, userId);

    if (order.status !== 'CONFIRMED' && order.status !== 'PAID') {
      // Allow from CONFIRMED (post-quote flow) or PAID (legacy direct-payment flow).
      throw new BadRequestException(
        `Cannot prepare order in ${order.status} status (must be CONFIRMED or PAID).`,
      );
    }

    const now = new Date();

    const updatedOrder = await db.$transaction?.(async (tx: DbClient) => {
      const updated = await tx.order?.update({
        where: { id: order.id },
        data: { status: 'PROCESSING' },
      });

      if (order.delivery) {
        await tx.delivery?.update({
          where: { id: order.delivery.id },
          data: {
            status: 'PREPARING',
            vendorPreparingAt: now,
          },
        });
      } else {
        // Create a Delivery row if missing (legacy path).
        await tx.delivery?.create({
          data: {
            orderId: order.id,
            status: 'PREPARING',
            vendorPreparingAt: now,
            pickupAddress: order.store?.name || 'Vendor location',
            deliveryAddress: order.store?.name || 'Vendor location',
          },
        });
      }

      return updated;
    });

    this.eventEmitter.emit('order.preparing', {
      orderId: order.id,
      storeId: order.storeId,
      buyerId: order.buyerId,
      at: now,
    });

    this.logger.log(`Order ${order.id} prepare started by vendor ${userId}`);
    return this.loadOrder(order.id);
  }

  // ─── 4. Vendor: Ready for Pickup (PICKUP orders only) ────────────────────

  async readyForPickup(user: AuthUser, orderId: string) {
    const userId = this.userId(user);
    const db = this.db();
    const order = await this.loadOrder(orderId);
    await this.assertVendor(order, userId);

    if (order.deliveryMethod && order.deliveryMethod !== 'PICKUP') {
      throw new BadRequestException(
        `ready-for-pickup is only valid for PICKUP orders (this order is ${order.deliveryMethod}). Use /dispatch instead.`,
      );
    }

    if (order.status !== 'PROCESSING') {
      throw new BadRequestException(
        `Cannot mark ready-for-pickup from ${order.status} status (must be PROCESSING — call /prepare first).`,
      );
    }

    const now = new Date();

    const updatedOrder = await db.$transaction?.(async (tx: DbClient) => {
      const updated = await tx.order?.update({
        where: { id: order.id },
        data: { status: 'FULFILLED' },
      });

      if (order.delivery) {
        await tx.delivery?.update({
          where: { id: order.delivery.id },
          data: {
            status: 'READY_FOR_PICKUP',
            vendorReadyAt: now,
          },
        });
      }

      // Create a Fulfillment record (READY state) — idempotent: skip if one already exists.
      const existingReady = await tx.fulfillment?.findFirst({
        where: { orderId: order.id, status: 'READY' },
      });
      if (!existingReady) {
        await tx.fulfillment?.create({
          data: {
            orderId: order.id,
            type: 'PHYSICAL_MANUAL',
            status: 'READY',
          },
        });
      }

      return updated;
    });

    this.eventEmitter.emit('order.ready_for_pickup', {
      orderId: order.id,
      storeId: order.storeId,
      buyerId: order.buyerId,
      at: now,
    });

    this.logger.log(`Order ${order.id} marked ready-for-pickup by vendor ${userId}`);
    return this.loadOrder(order.id);
  }

  // ─── 5. Vendor: Dispatch (STANDARD_DELIVERY only) ────────────────────────

  async dispatchOrder(user: AuthUser, orderId: string, dto?: DispatchOrderDto) {
    const userId = this.userId(user);
    const db = this.db();
    const order = await this.loadOrder(orderId);
    await this.assertVendor(order, userId);

    if (order.deliveryMethod && order.deliveryMethod !== 'STANDARD_DELIVERY') {
      throw new BadRequestException(
        `dispatch is only valid for STANDARD_DELIVERY orders (this order is ${order.deliveryMethod}). Use /ready-for-pickup instead.`,
      );
    }

    if (order.status !== 'PROCESSING' && order.status !== 'CONFIRMED' && order.status !== 'PAID') {
      throw new BadRequestException(
        `Cannot dispatch order in ${order.status} status (must be PROCESSING, CONFIRMED, or PAID).`,
      );
    }

    const now = new Date();

    const updatedOrder = await db.$transaction?.(async (tx: DbClient) => {
      const updated = await tx.order?.update({
        where: { id: order.id },
        data: { status: 'SHIPPED' },
      });

      if (order.delivery) {
        await tx.delivery?.update({
          where: { id: order.delivery.id },
          data: {
            status: 'IN_TRANSIT',
            pickedUpAt: now,
            inTransitAt: now,
          },
        });
      }

      // Create a Fulfillment record capturing tracking + carrier.
      // NOTE: 'DISPATCHED' is not in the FulfillmentStatus enum (PENDING/PROCESSING/
      // READY/FULFILLED/DELIVERED/FAILED/CANCELLED). We use 'FULFILLED' as the
      // semantic state for "vendor has dispatched the package" — the Delivery row
      // carries the finer-grained IN_TRANSIT status.
      await tx.fulfillment?.create({
        data: {
          orderId: order.id,
          type: 'PHYSICAL_MANUAL',
          status: 'FULFILLED',
          ...(dto?.trackingNumber ? { trackingNumber: dto.trackingNumber } : {}),
          ...(dto?.carrier ? { manualCarrier: dto.carrier } : {}),
        },
      });

      return updated;
    });

    this.eventEmitter.emit('order.dispatched', {
      orderId: order.id,
      storeId: order.storeId,
      buyerId: order.buyerId,
      trackingNumber: dto?.trackingNumber,
      carrier: dto?.carrier,
      at: now,
    });

    this.logger.log(
      `Order ${order.id} dispatched by vendor ${userId}${
        dto?.trackingNumber ? ` (tracking: ${dto.trackingNumber})` : ''
      }`,
    );
    return this.loadOrder(order.id);
  }

  // ─── 6. Vendor: Mark Delivered (after rider drop-off) ────────────────────
  //
  // NOTE: This does NOT release escrow. Only customer confirm-receipt does that.
  // The vendor marking delivered is a signal that the package is at the customer's
  // door; the customer still has to confirm receipt for funds to flow.

  async markDelivered(user: AuthUser, orderId: string) {
    const userId = this.userId(user);
    const db = this.db();
    const order = await this.loadOrder(orderId);
    await this.assertVendor(order, userId);

    if (order.status !== 'SHIPPED' && order.status !== 'PROCESSING') {
      // Allow from SHIPPED (post-dispatch) for STANDARD_DELIVERY,
      // or PROCESSING for PICKUP (legacy edge case where vendor marks delivered directly).
      throw new BadRequestException(
        `Cannot mark delivered from ${order.status} status (must be SHIPPED or PROCESSING).`,
      );
    }

    const now = new Date();

    const updatedOrder = await db.$transaction?.(async (tx: DbClient) => {
      const updated = await tx.order?.update({
        where: { id: order.id },
        data: { status: 'DELIVERED' },
      });

      if (order.delivery) {
        await tx.delivery?.update({
          where: { id: order.delivery.id },
          data: {
            status: 'DELIVERED',
            deliveredAt: now,
          },
        });
      }

      return updated;
    });

    this.eventEmitter.emit('order.delivered', {
      orderId: order.id,
      storeId: order.storeId,
      buyerId: order.buyerId,
      at: now,
    });

    this.logger.log(
      `Order ${order.id} marked delivered by vendor ${userId} (escrow NOT released — awaiting customer confirmation)`,
    );
    return this.loadOrder(order.id);
  }
}
