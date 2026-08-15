import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../database/prisma.service';
import { NotificationService } from './notification.service';
import { EmailService } from './email.service';

/**
 * OrderEventListener — listens to commerce/quote/payment domain events
 * emitted by CommerceService (and the in-flight QuoteService) and:
 *   1. creates real in-app `Notification` rows via NotificationService.create()
 *   2. sends transactional emails via EmailService.sendEmail()
 *
 * CRITICAL: every notification + every email call is wrapped in its own
 * try/catch so that a failure (missing user, SMTP down, malformed payload)
 * NEVER propagates back to the originating order flow. The caller must not
 * know or care whether notifications fired.
 *
 * Event payloads (emitted by commerce.service.ts / quote.service.ts):
 *   order.created               { orderId, buyerId, storeId, vendorId, totalAmount, deliveryMethod, quoteStatus, items }
 *   quote.submitted             { orderId, buyerId, vendorId, amount }
 *   quote.revised               { orderId, buyerId, vendorId, amount }
 *   quote.reduction_requested   { orderId, buyerId, vendorId, amount }
 *   quote.agreed                { orderId, buyerId, vendorId, amount }
 *   quote.rejected              { orderId, buyerId, vendorId }
 *   escrow.held                 { orderId }
 *   payment.initialized         { orderId, buyerId, reference, amount }
 *
 * Note: `vendorId` is a User.id (the vendor owning the Store), NOT a Store.id.
 */
@Injectable()
export class OrderEventListener {
  private readonly logger = new Logger(OrderEventListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly emailService: EmailService,
  ) {}

  // ============================================================
  // Helpers
  // ============================================================

  /**
   * Resolve a user's email + display name. Returns null if user not found.
   * Display name falls back to the email local-part when no profile name set.
   */
  private async resolveUser(userId: string | undefined | null) {
    if (!userId) return null;
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          profile: { select: { firstName: true, lastName: true } },
        },
      });
      if (!user) return null;
      const firstName = user.profile?.firstName?.trim() || '';
      const lastName = user.profile?.lastName?.trim() || '';
      const fullName = `${firstName} ${lastName}`.trim();
      const displayName = fullName || user.email.split('@')[0];
      return { id: user.id, email: user.email, name: displayName };
    } catch (err) {
      this.logger.warn(
        `resolveUser(${userId}) failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
    }
  }

  /**
   * Resolve an order by id with buyer + vendor (store.vendorId) info.
   */
  private async resolveOrder(orderId: string) {
    try {
      return await this.prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          buyerId: true,
          storeId: true,
          totalAmount: true,
          quoteStatus: true,
          status: true,
          store: { select: { id: true, vendorId: true, name: true } },
        },
      });
    } catch (err) {
      this.logger.warn(
        `resolveOrder(${orderId}) failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
    }
  }

  /** Best-effort in-app notification create. Never throws. */
  private async safeNotify(
    userId: string | null | undefined,
    type: string,
    title: string,
    message: string,
    data?: Record<string, unknown>,
  ) {
    if (!userId) return;
    try {
      await this.notificationService.create({ userId, type, title, message, data });
    } catch (err) {
      this.logger.warn(
        `safeNotify(userId=${userId}, type=${type}) failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /** Best-effort email send. Never throws. */
  private async safeEmail(
    to: string | null | undefined,
    subject: string,
    template: string,
    variables: Record<string, unknown>,
  ) {
    if (!to) return;
    try {
      await this.emailService.sendEmail(to, subject, template, variables);
    } catch (err) {
      this.logger.warn(
        `safeEmail(to=${to}, template=${template}) failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private orderUrl(orderId: string): string {
    return `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/orders/${orderId}`;
  }

  // ============================================================
  // order.created
  // ============================================================
  @OnEvent('order.created')
  async handleOrderCreated(payload: any) {
    const { orderId, buyerId, vendorId, totalAmount, quoteStatus } = payload ?? {};
    this.logger.log(`order.created orderId=${orderId} buyerId=${buyerId} vendorId=${vendorId}`);

    const [buyer, vendor] = await Promise.all([
      this.resolveUser(buyerId),
      this.resolveUser(vendorId),
    ]);

    const orderNumber = orderId;
    const total = Number(totalAmount ?? 0);

    // 1. Notify buyer — "Order Placed"
    await this.safeNotify(
      buyer?.id ?? buyerId,
      'ORDER',
      'Order Placed',
      `Your order #${orderNumber} has been placed successfully${
        quoteStatus ? ` (status: ${quoteStatus})` : ''
      }.`,
      { orderId, totalAmount: total, quoteStatus },
    );

    // 2. Email buyer — order-confirmed template
    await this.safeEmail(buyer?.email, `Order #${orderNumber} Confirmed`, 'order-confirmed', {
      name: buyer?.name ?? 'Customer',
      orderNumber,
      total,
      orderUrl: this.orderUrl(orderId),
    });

    // 3. Notify vendor — "New Order Received"
    await this.safeNotify(
      vendor?.id ?? vendorId,
      'NEW_ORDER',
      'New Order Received',
      `You received a new order #${orderNumber} from ${buyer?.name ?? 'a customer'}.`,
      { orderId, buyerId, totalAmount: total },
    );

    // 4. Email vendor — new-order-vendor template
    await this.safeEmail(
      vendor?.email,
      `New Order #${orderNumber} Received`,
      'new-order-vendor',
      {
        vendorName: vendor?.name ?? 'Vendor',
        buyerName: buyer?.name ?? 'Customer',
        orderNumber,
        total,
        orderUrl: this.orderUrl(orderId),
      },
    );
  }

  // ============================================================
  // quote.submitted — vendor sent buyer a quote
  // ============================================================
  @OnEvent('quote.submitted')
  async handleQuoteSubmitted(payload: any) {
    const { orderId, buyerId, vendorId, amount } = payload ?? {};
    this.logger.log(`quote.submitted orderId=${orderId} amount=${amount}`);

    await this.safeNotify(
      buyerId,
      'QUOTE',
      'Vendor Quote Received',
      `A vendor has submitted a quote of ₦${Number(amount ?? 0).toLocaleString()} for your order #${orderId}. Review and accept or request a reduction.`,
      { orderId, vendorId, amount: Number(amount ?? 0) },
    );
  }

  // ============================================================
  // quote.revised — vendor revised after a reduction request
  // ============================================================
  @OnEvent('quote.revised')
  async handleQuoteRevised(payload: any) {
    const { orderId, buyerId, vendorId, amount } = payload ?? {};
    this.logger.log(`quote.revised orderId=${orderId} amount=${amount}`);

    await this.safeNotify(
      buyerId,
      'QUOTE',
      'Vendor Revised Quote',
      `The vendor revised your delivery quote to ₦${Number(amount ?? 0).toLocaleString()} for order #${orderId}.`,
      { orderId, vendorId, amount: Number(amount ?? 0) },
    );
  }

  // ============================================================
  // quote.reduction_requested — customer asked vendor for a lower amount
  // ============================================================
  @OnEvent('quote.reduction_requested')
  async handleQuoteReductionRequested(payload: any) {
    const { orderId, buyerId, vendorId, amount } = payload ?? {};
    this.logger.log(`quote.reduction_requested orderId=${orderId} amount=${amount}`);

    const buyer = await this.resolveUser(buyerId);

    await this.safeNotify(
      vendorId,
      'QUOTE',
      'Customer Requested Reduction',
      `${buyer?.name ?? 'A customer'} requested a reduction to ₦${Number(amount ?? 0).toLocaleString()} for order #${orderId}. Review and revise or accept.`,
      { orderId, buyerId, amount: Number(amount ?? 0) },
    );
  }

  // ============================================================
  // quote.agreed — both parties reached agreement, payment unlocked
  // ============================================================
  @OnEvent('quote.agreed')
  async handleQuoteAgreed(payload: any) {
    const { orderId, buyerId, vendorId, amount } = payload ?? {};
    this.logger.log(`quote.agreed orderId=${orderId} amount=${amount}`);

    await this.safeNotify(
      buyerId,
      'QUOTE',
      'Quote Agreed',
      `Your delivery quote of ₦${Number(amount ?? 0).toLocaleString()} for order #${orderId} has been agreed. You can now proceed to payment.`,
      { orderId, vendorId, amount: Number(amount ?? 0) },
    );

    await this.safeNotify(
      vendorId,
      'QUOTE',
      'Quote Agreed',
      `The customer agreed to your quote of ₦${Number(amount ?? 0).toLocaleString()} for order #${orderId}. Awaiting payment.`,
      { orderId, buyerId, amount: Number(amount ?? 0) },
    );
  }

  // ============================================================
  // quote.rejected — either party rejected the quote (terminal)
  // ============================================================
  @OnEvent('quote.rejected')
  async handleQuoteRejected(payload: any) {
    const { orderId, buyerId, vendorId } = payload ?? {};
    this.logger.log(`quote.rejected orderId=${orderId}`);

    await this.safeNotify(
      buyerId,
      'QUOTE',
      'Quote Rejected',
      `The quote for order #${orderId} has been rejected. The order is now cancelled.`,
      { orderId, vendorId },
    );

    await this.safeNotify(
      vendorId,
      'QUOTE',
      'Quote Rejected',
      `The quote for order #${orderId} has been rejected by the customer. The order is now cancelled.`,
      { orderId, buyerId },
    );
  }

  // ============================================================
  // escrow.held — payment captured and held in Kwikscrow
  // Payload is { orderId } only — we must resolve buyer + vendor.
  // ============================================================
  @OnEvent('escrow.held')
  async handleEscrowHeld(payload: any) {
    const { orderId } = payload ?? {};
    this.logger.log(`escrow.held orderId=${orderId}`);

    const order = await this.resolveOrder(orderId);
    if (!order) {
      this.logger.warn(`escrow.held: order ${orderId} not found, skipping notifications`);
      return;
    }

    const buyerId = order.buyerId;
    const vendorId = order.store?.vendorId;
    const total = Number(order.totalAmount ?? 0);

    // Notify buyer
    await this.safeNotify(
      buyerId,
      'ESCROW',
      'Payment Held in Kwikscrow',
      `Your payment of ₦${total.toLocaleString()} for order #${orderId} is now held safely in Kwikscrow. The vendor will be paid once you confirm delivery.`,
      { orderId, amount: total },
    );

    // Notify vendor
    await this.safeNotify(
      vendorId,
      'ESCROW',
      'Payment Received — Held in Kwikscrow',
      `Payment of ₦${total.toLocaleString()} for order #${orderId} has been received and held in Kwikscrow. Funds will be released to your wallet once the customer confirms delivery.`,
      { orderId, amount: total },
    );
  }

  // ============================================================
  // payment.initialized — Paystack checkout started, awaiting payment
  // ============================================================
  @OnEvent('payment.initialized')
  async handlePaymentInitialized(payload: any) {
    const { orderId, buyerId, reference, amount } = payload ?? {};
    this.logger.log(`payment.initialized orderId=${orderId} reference=${reference}`);

    await this.safeNotify(
      buyerId,
      'PAYMENT',
      'Payment Initialized',
      `Payment of ₦${Number(amount ?? 0).toLocaleString()} for order #${orderId} has been initialized (ref: ${reference}). Complete the payment to confirm your order.`,
      { orderId, reference, amount: Number(amount ?? 0) },
    );
  }
}
