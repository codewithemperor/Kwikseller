import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { NotificationService } from "../common/services/notification.service";
import { AuditService } from "../common/services/audit.service";
import { PlatformSettingService } from "../common/services/platform-setting.service";
import { WalletService } from "./wallet.service";

const DEFAULT_HOLD_HOURS = 24;

type DbClient = Record<string, any>;

@Injectable()
export class EscrowService {
  private readonly logger = new Logger(EscrowService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly auditService: AuditService,
    private readonly platformSetting: PlatformSettingService,
    private readonly walletService: WalletService,
  ) {}

  private db(): DbClient {
    return this.prisma as unknown as DbClient;
  }

  // ─── Hold Payment (called when customer pays successfully) ─────────────────
  //
  // Creates an Escrow row (status=HELD) and a Commission row capturing the
  // platform fee at the CURRENT configurable rate. The vendor wallet is NOT
  // credited here — that happens only at releaseFunds().
  //
  async holdPayment(orderId: string): Promise<void> {
    const db = this.db();
    const order = await db.order?.findUnique({
      where: { id: orderId },
      include: { store: true, escrow: true },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (order.escrow) {
      this.logger.warn(`Escrow already exists for order ${orderId}`);
      return;
    }

    const vendorId = order.store?.vendorId ?? order.storeId;

    // Default release time = 24h from now (no auto-release until delivery confirmed)
    const releaseAt = new Date();
    releaseAt.setHours(releaseAt.getHours() + DEFAULT_HOLD_HOURS);

    const transactionRef = `ESC-${orderId.slice(-8).toUpperCase()}-${Date.now()}`;

    const escrow = await db.escrow?.create({
      data: {
        orderId: order.id,
        vendorId,
        amount: order.totalAmount,
        status: "HELD",
        releaseAt,
        heldAt: new Date(),
        transactionRef,
      },
    });

    // Create commission record using the configurable platform fee percent.
    // saleAmount here = order.totalAmount (subtotal + agreedDeliveryFee + processingFee).
    // The processing fee was already added to totalAmount at checkout/agreement time;
    // the commission.platformFeeAmount is the platform's cut from the vendor's proceeds.
    const saleAmount = order.totalAmount;
    const feePercent = await this.platformSetting.getProcessingFeePercent();
    const feeAmount = Math.round(saleAmount * (feePercent / 100) * 100) / 100;
    const vendorEarnings = Math.round((saleAmount - feeAmount) * 100) / 100;

    await db.commission?.create({
      data: {
        orderId: order.id,
        vendorId,
        saleAmount,
        platformFeePercent: feePercent,
        platformFeeAmount: feeAmount,
        vendorEarnings,
        plan: "DEFAULT",
      },
    });

    // Notify vendor (in-app)
    try {
      await this.notificationService.create({
        userId: vendorId,
        type: "PAYMENT_HELD",
        title: "Payment Received — Held in Kwikscrow",
        message: `₦${saleAmount.toLocaleString()} from order #${orderId.slice(-8)} is now held in Kwikscrow. Funds will be released after delivery confirmation.`,
        data: { orderId, escrowId: escrow?.id, amount: saleAmount },
      });
    } catch (err) {
      this.logger.warn("Failed to send payment-held notification", err);
    }

    this.logger.log(`Escrow (Kwikscrow) created for order ${orderId}: ₦${saleAmount} held for vendor ${vendorId}`);
  }

  // ─── Initiate Release (called when customer confirms delivery receipt) ──────

  async initiateRelease(deliveryId: string): Promise<void> {
    const db = this.db();
    const delivery = await db.delivery?.findUnique({
      where: { id: deliveryId },
      include: { order: { include: { escrow: true, store: true } } },
    });

    if (!delivery) {
      throw new NotFoundException(`Delivery ${deliveryId} not found`);
    }

    const escrow = delivery.order?.escrow;
    if (!escrow) {
      throw new NotFoundException("No escrow found for this order");
    }

    if (escrow.status !== "HELD") {
      throw new BadRequestException(
        `Escrow is in ${escrow.status} state — cannot initiate release`,
      );
    }

    // Mark as pending release (actual credit happens via releaseFunds)
    await db.escrow?.update({
      where: { id: escrow.id },
      data: { status: "PENDING_RELEASE", releaseAt: new Date() },
    });

    this.logger.log(
      `Escrow ${escrow.id} marked PENDING_RELEASE for delivery ${deliveryId}`,
    );
  }

  // ─── Release Funds (called by cron job or directly after hold period) ───────

  async releaseFunds(deliveryId: string): Promise<void> {
    const db = this.db();
    const delivery = await db.delivery?.findUnique({
      where: { id: deliveryId },
      include: {
        order: {
          include: { escrow: true, store: true, commission: true },
        },
      },
    });

    if (!delivery) {
      throw new NotFoundException(`Delivery ${deliveryId} not found`);
    }

    const escrow = delivery.order?.escrow;
    if (!escrow) {
      throw new NotFoundException("No escrow found for this order");
    }

    if (escrow.status === "RELEASED" || escrow.status === "REFUNDED") {
      this.logger.warn(
        `Escrow ${escrow.id} already ${escrow.status} — skipping release`,
      );
      return;
    }

    if (escrow.status !== "HELD" && escrow.status !== "PENDING_RELEASE") {
      throw new BadRequestException(
        `Escrow is in ${escrow.status} state — cannot release funds`,
      );
    }

    const commission = delivery.order?.commission;
    const vendorEarnings = commission?.vendorEarnings ?? escrow.amount;
    const orderId = delivery.order?.id;

    const vendorId = escrow.vendorId;

    // Mark escrow RELEASED first (idempotent: if already RELEASED we returned above)
    await db.escrow?.update({
      where: { id: escrow.id },
      data: { status: "RELEASED", releasedAt: new Date() },
    });

    // Credit vendor wallet — IDEMPOTENT. The reference is derived from the
    // escrow id, so a second call with the same escrow is a no-op.
    const creditReference = `ESCROW-RELEASE-${escrow.id}`;
    const result = await this.walletService.creditWallet(
      vendorId,
      vendorEarnings,
      "ESCROW_RELEASE",
      creditReference,
      {
        orderId,
        escrowId: escrow.id,
        reason: `Kwikscrow release for order #${orderId?.slice(-8)}`,
      },
    );

    // Mark commission as settled (only if the credit actually happened)
    if (result.credited && commission) {
      await db.commission?.update({
        where: { id: commission.id },
        data: { settledAt: new Date() },
      });
    }

    // Notify vendor
    try {
      await this.notificationService.create({
        userId: vendorId,
        type: "FUNDS_RELEASED",
        title: "Kwikscrow Funds Released",
        message: `₦${vendorEarnings.toLocaleString()} has been credited to your wallet from order #${orderId?.slice(-8)}.`,
        data: {
          escrowId: escrow.id,
          amount: vendorEarnings,
          orderId: delivery.order?.id,
        },
      });
    } catch (err) {
      this.logger.warn("Failed to send funds-released notification", err);
    }

    // Audit log
    await this.auditService.log({
      userId: vendorId,
      action: "escrow.release",
      entity: "Escrow",
      entityId: escrow.id,
      changes: {
        deliveryId,
        orderId: delivery.order?.id,
        amount: vendorEarnings,
        status: "RELEASED",
      },
    });

    this.logger.log(
      `Escrow ${escrow.id} RELEASED: ₦${vendorEarnings} to vendor ${vendorId}`,
    );
  }

  // ─── Release by Order ID (used by customer confirm-receipt endpoint) ──────
  //
  // Resolves the Delivery row for the given orderId and delegates to releaseFunds.
  // For PICKUP orders, the Delivery row's `pickupConfirmed` path triggers this.
  // For STANDARD_DELIVERY, `customerConfirmed` triggers this.
  //
  async releaseByOrderId(orderId: string): Promise<void> {
    const db = this.db();
    const delivery = await db.delivery?.findUnique({
      where: { orderId },
    });
    if (!delivery) {
      throw new NotFoundException(`No delivery record for order ${orderId}`);
    }
    await this.releaseFunds(delivery.id);
  }

  // ─── Freeze for Dispute (called when customer opens dispute) ───────────────

  async freezeForDispute(orderId: string, reason: string): Promise<void> {
    const db = this.db();

    const order = await db.order?.findUnique({
      where: { id: orderId },
      include: { escrow: true },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    const escrow = order.escrow;
    if (!escrow) {
      throw new NotFoundException("No escrow found for this order");
    }

    if (!["HELD", "PENDING_RELEASE"].includes(escrow.status)) {
      throw new BadRequestException(
        `Cannot freeze escrow in ${escrow.status} state`,
      );
    }

    await db.escrow?.update({
      where: { id: escrow.id },
      data: { status: "DISPUTED" },
    });

    await db.order?.update({
      where: { id: orderId },
      data: {
        disputeStatus: "OPENED",
        disputeReason: reason,
      },
    });

    this.logger.log(`Escrow ${escrow.id} DISPUTED for order ${orderId}`);
  }

  // ─── Resolve Dispute (admin action) ─────────────────────────────────────────

  async resolveDispute(
    deliveryId: string,
    resolution: "release_to_vendor" | "refund_to_customer" | "partial",
    vendorAmount?: number,
    refundReason?: string,
  ): Promise<void> {
    const db = this.db();
    const delivery = await db.delivery?.findUnique({
      where: { id: deliveryId },
      include: {
        order: {
          include: { escrow: true, commission: true, store: true },
        },
      },
    });

    if (!delivery) {
      throw new NotFoundException(`Delivery ${deliveryId} not found`);
    }

    const escrow = delivery.order?.escrow;
    if (!escrow) {
      throw new NotFoundException("No escrow found for this order");
    }

    if (escrow.status !== "DISPUTED") {
      throw new BadRequestException(
        `Escrow is in ${escrow.status} state — must be DISPUTED to resolve`,
      );
    }

    const order = delivery.order;
    const commission = order.commission;
    const totalAmount = escrow.amount;
    const vendorId = escrow.vendorId;
    const buyerId = order.buyerId;

    if (resolution === "release_to_vendor") {
      const vendorEarnings = commission?.vendorEarnings ?? totalAmount;

      await db.$transaction(async (tx: any) => {
        await tx.escrow?.update({
          where: { id: escrow.id },
          data: { status: "RELEASED", releasedAt: new Date() },
        });

        // Credit vendor wallet
        const wallet = await tx.wallet?.findUnique({ where: { vendorId } });
        if (wallet) {
          await tx.wallet?.update({
            where: { vendorId },
            data: {
              availableBalance: { increment: vendorEarnings },
              pendingBalance: {
                decrement: Math.min(wallet.pendingBalance ?? 0, vendorEarnings),
              },
              totalEarned: { increment: vendorEarnings },
            },
          });
        } else {
          await tx.wallet?.create({
            data: {
              vendorId,
              availableBalance: vendorEarnings,
              totalEarned: vendorEarnings,
            },
          });
        }

        if (commission) {
          await tx.commission?.update({
            where: { id: commission.id },
            data: { settledAt: new Date() },
          });
        }
      });

      await this.notifyDisputeResolution(
        vendorId,
        buyerId,
        order.id,
        "release_to_vendor",
        vendorEarnings,
      );
    } else if (resolution === "refund_to_customer") {
      await db.$transaction(async (tx: any) => {
        await tx.escrow?.update({
          where: { id: escrow.id },
          data: { status: "REFUNDED" },
        });

        await tx.order?.update({
          where: { id: order.id },
          data: { status: "REFUNDED", paymentStatus: "REFUNDED" },
        });
      });

      await this.notifyDisputeResolution(
        vendorId,
        buyerId,
        order.id,
        "refund_to_customer",
        totalAmount,
        refundReason,
      );
    } else if (resolution === "partial") {
      if (!vendorAmount || vendorAmount <= 0 || vendorAmount >= totalAmount) {
        throw new BadRequestException(
          "Partial resolution requires vendorAmount between 0 and total escrow amount",
        );
      }

      await db.$transaction(async (tx: any) => {
        await tx.escrow?.update({
          where: { id: escrow.id },
          data: { status: "PARTIAL", releasedAt: new Date() },
        });

        const wallet = await tx.wallet?.findUnique({ where: { vendorId } });
        if (wallet) {
          await tx.wallet?.update({
            where: { vendorId },
            data: {
              availableBalance: { increment: vendorAmount },
              pendingBalance: {
                decrement: Math.min(wallet.pendingBalance ?? 0, vendorAmount),
              },
              totalEarned: { increment: vendorAmount },
            },
          });
        } else {
          await tx.wallet?.create({
            data: {
              vendorId,
              availableBalance: vendorAmount,
              totalEarned: vendorAmount,
            },
          });
        }
      });

      const refundAmount = Math.round((totalAmount - vendorAmount) * 100) / 100;
      await this.notifyDisputeResolution(
        vendorId,
        buyerId,
        order.id,
        "partial",
        vendorAmount,
        refundReason,
        refundAmount,
      );
    }

    // Update order dispute fields
    await db.order?.update({
      where: { id: order.id },
      data: {
        disputeStatus: "RESOLVED",
        disputeResolvedAt: new Date(),
        disputeResolution: resolution,
      },
    });

    // Audit log
    await this.auditService.log({
      action: "escrow.dispute_resolved",
      entity: "Escrow",
      entityId: escrow.id,
      changes: {
        resolution,
        vendorAmount,
        refundReason,
        deliveryId,
        orderId: order.id,
      },
    });

    this.logger.log(`Dispute resolved for escrow ${escrow.id}: ${resolution}`);
  }

  // ─── Refund to Customer (cancelled orders, returns) ────────────────────────

  async refundToCustomer(orderId: string, reason?: string): Promise<void> {
    const db = this.db();
    const order = await db.order?.findUnique({
      where: { id: orderId },
      include: { escrow: true },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    const escrow = order.escrow;
    if (!escrow) {
      this.logger.warn(
        `No escrow for order ${orderId} — updating order status only`,
      );
      await db.order?.update({
        where: { id: orderId },
        data: { status: "REFUNDED", paymentStatus: "REFUNDED" },
      });
      return;
    }

    if (escrow.status === "RELEASED") {
      throw new BadRequestException(
        "Cannot refund — funds already released to vendor",
      );
    }

    if (escrow.status === "REFUNDED") {
      this.logger.warn(`Escrow ${escrow.id} already REFUNDED`);
      return;
    }

    await db.$transaction(async (tx: any) => {
      await tx.escrow?.update({
        where: { id: escrow.id },
        data: {
          status: "REFUNDED",
          disputeReason: reason ?? escrow.disputeReason,
        },
      });

      await tx.order?.update({
        where: { id: orderId },
        data: { status: "REFUNDED", paymentStatus: "REFUNDED" },
      });
    });

    // Notify vendor
    try {
      await this.notificationService.create({
        userId: escrow.vendorId,
        type: "ORDER_REFUNDED",
        title: "Order Refunded",
        message: `Order #${orderId.slice(-8)} has been refunded${reason ? ` (${reason})` : ""}. Escrow funds returned to customer.`,
        data: { orderId, escrowId: escrow.id, amount: escrow.amount },
      });
    } catch (err) {
      this.logger.warn("Failed to send refund notification", err);
    }

    await this.auditService.log({
      userId: escrow.vendorId,
      action: "escrow.refund",
      entity: "Escrow",
      entityId: escrow.id,
      changes: { orderId, reason, amount: escrow.amount },
    });

    this.logger.log(`Escrow ${escrow.id} REFUNDED for order ${orderId}`);
  }

  // ─── Get Vendor Holdings ───────────────────────────────────────────────────

  async getVendorHoldings(vendorId: string) {
    const db = this.db();
    return db.escrow?.findMany({
      where: {
        vendorId,
        status: { in: ["HELD", "PENDING_RELEASE", "DISPUTED"] },
      },
      include: {
        order: {
          include: {
            buyer: { include: { profile: true } },
            store: { select: { name: true, slug: true } },
            delivery: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // ─── Get Escrow by Delivery ID ──────────────────────────────────────────────

  async getByDeliveryId(deliveryId: string) {
    const db = this.db();
    const delivery = await db.delivery?.findUnique({
      where: { id: deliveryId },
      include: {
        order: {
          include: {
            escrow: true,
            commission: true,
            buyer: { include: { profile: true } },
            store: true,
          },
        },
      },
    });

    if (!delivery) {
      throw new NotFoundException(`Delivery ${deliveryId} not found`);
    }

    return delivery.order?.escrow ?? null;
  }

  // ─── Get Escrow by ID ──────────────────────────────────────────────────────

  async getById(escrowId: string) {
    const db = this.db();
    const escrow = await db.escrow?.findUnique({
      where: { id: escrowId },
      include: {
        order: {
          include: {
            buyer: { include: { profile: true } },
            store: true,
            commission: true,
            delivery: true,
          },
        },
      },
    });

    if (!escrow) {
      throw new NotFoundException(`Escrow ${escrowId} not found`);
    }

    return escrow;
  }

  // ─── Get Escrows Pending Release (for cron) ────────────────────────────────

  async getPendingRelease() {
    const db = this.db();
    return db.escrow?.findMany({
      where: {
        status: "PENDING_RELEASE",
        releaseAt: { lte: new Date() },
      },
      include: {
        order: { include: { delivery: true, commission: true } },
      },
      orderBy: { releaseAt: "asc" },
    });
  }

  // ─── List Disputes ─────────────────────────────────────────────────────────

  async listDisputes(
    params: { page?: number; limit?: number; status?: string } = {},
  ) {
    const db = this.db();
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      disputeStatus: { not: "NONE" },
    };
    if (params.status && params.status !== "all") {
      where.disputeStatus = params.status;
    }

    const [orders, total] = await Promise.all([
      db.order?.findMany({
        where,
        include: {
          buyer: { include: { profile: true } },
          store: { select: { name: true, slug: true } },
          escrow: true,
          delivery: true,
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      db.order?.count({ where }),
    ]);

    return {
      data: orders ?? [],
      meta: {
        page,
        limit,
        total: total ?? 0,
        totalPages: Math.ceil((total ?? 0) / limit),
      },
    };
  }

  // ─── Process Escrows Pending Auto-Release (called by cron) ────────────────
  async processEscrowAutoRelease(): Promise<{
    processed: number;
    failed: number;
  }> {
    const db = this.db();
    let processed = 0;
    let failed = 0;

    // 1) Release PENDING_RELEASE escrows whose releaseAt has passed
    const pendingRelease = await db.escrow?.findMany({
      where: { status: "PENDING_RELEASE", releaseAt: { lte: new Date() } },
      include: { order: { include: { delivery: true } } },
    });

    for (const escrow of pendingRelease ?? []) {
      const deliveryId = escrow.order?.delivery?.id;
      if (!deliveryId) {
        this.logger.warn(
          `Escrow ${escrow.id} PENDING_RELEASE but no delivery — skipping`,
        );
        continue;
      }
      try {
        await this.releaseFunds(deliveryId);
        processed++;
      } catch (err) {
        failed++;
        this.logger.warn(
          `Failed to auto-release escrow ${escrow.id}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    // 2) Release HELD escrows whose delivery was customer-confirmed
    const confirmedHeld = await db.escrow?.findMany({
      where: { status: "HELD" },
      include: { order: { include: { delivery: true } } },
    });

    for (const escrow of confirmedHeld ?? []) {
      const delivery = escrow.order?.delivery;
      if (!delivery || !delivery.customerConfirmed) continue;
      try {
        await db.escrow?.update({
          where: { id: escrow.id },
          data: { status: "PENDING_RELEASE", releaseAt: new Date() },
        });
        await this.releaseFunds(delivery.id);
        processed++;
      } catch (err) {
        failed++;
        this.logger.warn(
          `Failed to release confirmed escrow ${escrow.id}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    // 3) Auto-release delivered standard-delivery orders once the ETA window
    //    has fully elapsed and the customer has not disputed or responded.
    const overdueDelivered = await db.escrow?.findMany({
      where: {
        status: "HELD",
        releaseAt: { lte: new Date() },
        order: {
          status: "DELIVERED",
          deliveryMethod: "STANDARD_DELIVERY",
          disputeStatus: { not: "OPENED" },
        },
      },
      include: { order: { include: { delivery: true } } },
    });

    for (const escrow of overdueDelivered ?? []) {
      const delivery = escrow.order?.delivery;
      if (!delivery || delivery.customerConfirmed || delivery.customerRejected) {
        continue;
      }

      try {
        await db.delivery?.update({
          where: { id: delivery.id },
          data: {
            customerConfirmed: true,
            customerConfirmedAt: new Date(),
          },
        });
        await db.escrow?.update({
          where: { id: escrow.id },
          data: { status: "PENDING_RELEASE", releaseAt: new Date() },
        });
        await this.releaseFunds(delivery.id);
        processed++;
      } catch (err) {
        failed++;
        this.logger.warn(
          `Failed to auto-release overdue delivered escrow ${escrow.id}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    return { processed, failed };
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────

  private async notifyDisputeResolution(
    vendorId: string,
    buyerId: string,
    orderId: string,
    resolution: string,
    amount: number,
    reason?: string,
    refundAmount?: number,
  ) {
    const shortOrderId = orderId.slice(-8);
    const notifications: Promise<unknown>[] = [];

    const sendNotif = (
      userId: string,
      title: string,
      message: string,
      data: Record<string, unknown>,
    ) =>
      this.notificationService
        .create({ userId, type: "DISPUTE_RESOLVED", title, message, data })
        .catch(() => undefined);

    if (resolution === "release_to_vendor") {
      notifications.push(
        sendNotif(
          vendorId,
          "Dispute Resolved — Funds Released",
          `The dispute for order #${shortOrderId} has been resolved in your favour. ₦${amount.toLocaleString()} has been credited to your wallet.`,
          { orderId, amount, resolution },
        ),
      );
      notifications.push(
        sendNotif(
          buyerId,
          "Dispute Resolved",
          `The dispute for order #${shortOrderId} has been resolved. Funds have been released to the vendor.`,
          { orderId, resolution },
        ),
      );
    } else if (resolution === "refund_to_customer") {
      notifications.push(
        sendNotif(
          vendorId,
          "Dispute Resolved — Refund Issued",
          `The dispute for order #${shortOrderId} has been resolved. A full refund of ₦${amount.toLocaleString()} has been issued to the customer.${reason ? ` Reason: ${reason}` : ""}`,
          { orderId, amount, resolution, reason },
        ),
      );
      notifications.push(
        sendNotif(
          buyerId,
          "Dispute Resolved — Refund Issued",
          `The dispute for order #${shortOrderId} has been resolved in your favour. A refund of ₦${amount.toLocaleString()} will be processed.`,
          { orderId, amount, resolution },
        ),
      );
    } else if (resolution === "partial") {
      notifications.push(
        sendNotif(
          vendorId,
          "Dispute Resolved — Partial Release",
          `The dispute for order #${shortOrderId} has been partially resolved. ₦${amount.toLocaleString()} has been credited to your wallet.`,
          { orderId, amount, resolution },
        ),
      );
      notifications.push(
        sendNotif(
          buyerId,
          "Dispute Resolved — Partial Refund",
          `The dispute for order #${shortOrderId} has been partially resolved. A refund of ₦${refundAmount?.toLocaleString()} will be processed.`,
          { orderId, refundAmount, resolution },
        ),
      );
    }

    await Promise.allSettled(notifications);
  }
}
