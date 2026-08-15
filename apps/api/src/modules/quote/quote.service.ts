import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';
import { PaystackService } from '../commerce/paystack.service';
import {
  QuoteNoteDto,
  RequestReductionDto,
  ReviseQuoteDto,
  SubmitQuoteDto,
} from './quote.dto';

type AuthContext = {
  id?: string;
  sub?: string;
  userId?: string;
  role?: string;
  storeId?: string;
  email?: string;
};

type LoadedOrder = {
  id: string;
  buyerId: string;
  storeId: string;
  subtotal: number;
  totalAmount: number;
  processingFeePercent: number;
  processingFeeAmount: number;
  agreedDeliveryFee: number;
  agreedAt: Date | null;
  quoteStatus: string;
  deliveryMethod: string | null;
  store?: { id: string; vendorId: string | null } | null;
  buyer?: { id: string; email: string } | null;
  quote?: {
    id: string;
    orderId: string;
    vendorId: string;
    buyerId: string;
    status: string;
    currentAmount: number;
    agreedAmount: number | null;
    agreedAt: Date | null;
    rejectedAt: Date | null;
    rejectedBy: string | null;
    rejectReason: string | null;
    expiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
};

/**
 * QuoteService — implements the quote negotiation lifecycle between a vendor
 * and a customer for the delivery fee on an order.
 *
 * State machine (QuoteStatus):
 *   PENDING_VENDOR_QUOTE
 *     → QUOTED                       (vendor: submitQuote)
 *       → CUSTOMER_REQUESTED_REDUCTION (customer: requestReduction)
 *         → VENDOR_REVISED              (vendor: reviseQuote)
 *           → CUSTOMER_REQUESTED_REDUCTION (loop)
 *         → AGREED                      (vendor: acceptReduction)
 *         → QUOTED                      (vendor: rejectReduction → reverts)
 *       → AGREED                       (customer: acceptQuote)
 *       → REJECTED                     (customer: rejectQuote — terminal)
 *
 * PICKUP orders are created directly with status=AGREED (no negotiation).
 * The customer can never directly set the delivery fee — only request a
 * reduction; only the vendor can set/revise the actual quote amount.
 */
@Injectable()
export class QuoteService {
  private readonly logger = new Logger(QuoteService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly paystack: PaystackService,
    private readonly config: ConfigService,
  ) {}

  // ─── helpers ────────────────────────────────────────────────────────────────

  /**
   * DbClient pattern — same convention used by CommerceService and
   * VendorStoreService. Lets us write `this.db().quote.findUnique(...)`
   * without fighting Prisma's generated types when fields change.
   */
  private db() {
    return this.prisma as unknown as Record<string, any>;
  }

  private getUserId(user: AuthContext | null | undefined): string {
    const userId = user?.id ?? user?.sub ?? user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }
    return userId;
  }

  private async loadOrderWithQuote(orderId: string): Promise<LoadedOrder> {
    const db = this.db();
    const order = (await db.order.findUnique({
      where: { id: orderId },
      include: {
        store: { select: { id: true, vendorId: true } },
        buyer: { select: { id: true, email: true } },
        quote: true,
      },
    })) as LoadedOrder | null;

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }
    if (!order.quote) {
      throw new BadRequestException(
        `Order ${orderId} does not have an associated Quote row`,
      );
    }
    return order;
  }

  /**
   * Vendor ownership check: vendor must own the store that owns the order.
   */
  private async loadOrderForVendor(
    orderId: string,
    userId: string,
  ): Promise<LoadedOrder> {
    const order = await this.loadOrderWithQuote(orderId);
    const vendorId = order.store?.vendorId ?? null;
    if (!vendorId || vendorId !== userId) {
      // Intentionally return 404 (not 403) to avoid leaking order existence.
      throw new NotFoundException(`Order ${orderId} not found`);
    }
    return order;
  }

  /**
   * Customer ownership check: the buyer must own the order.
   */
  private async loadOrderForBuyer(
    orderId: string,
    userId: string,
  ): Promise<LoadedOrder> {
    const order = await this.loadOrderWithQuote(orderId);
    if (order.buyerId !== userId) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }
    return order;
  }

  /**
   * Shared (either customer or vendor) ownership check — used by getQuote.
   */
  private async loadOrderForParty(
    orderId: string,
    userId: string,
  ): Promise<LoadedOrder> {
    const order = await this.loadOrderWithQuote(orderId);
    const vendorId = order.store?.vendorId ?? null;
    const isVendor = !!vendorId && vendorId === userId;
    const isBuyer = order.buyerId === userId;
    if (!isVendor && !isBuyer) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }
    return order;
  }

  private requireStatus(
    quote: NonNullable<LoadedOrder['quote']>,
    allowed: string[],
    action: string,
  ) {
    if (!allowed.includes(quote.status)) {
      throw new BadRequestException(
        `Cannot ${action}: quote is in status ${quote.status}, expected ${allowed.join(' | ')}`,
      );
    }
  }

  private paymentReference(): string {
    return `KWK-Q-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;
  }

  private defaultPaymentCallbackUrl(reference: string): string {
    const frontendUrl =
      this.config.get<string>('frontendUrl') ?? 'http://localhost:3000';
    return `${frontendUrl.replace(/\/$/, '')}/checkout/verify?reference=${encodeURIComponent(reference)}`;
  }

  /**
   * Look up the most recent vendor-authored amount (VENDOR_QUOTE or VENDOR_REVISE)
   * in the revision history — used by `rejectReduction` to restore the original
   * quote amount when the vendor rejects the customer's reduction request.
   */
  private async lastVendorAuthoredAmount(
    quoteId: string,
  ): Promise<number | null> {
    const db = this.db();
    const revisions = await db.quoteRevision.findMany({
      where: {
        quoteId,
        type: { in: ['VENDOR_QUOTE', 'VENDOR_REVISE'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });
    return revisions?.[0]?.amount ?? null;
  }

  // ─── Vendor actions ───────────────────────────────────────────────────────

  /**
   * 1. Vendor submits the initial delivery quote.
   *    PENDING_VENDOR_QUOTE → QUOTED
   */
  async submitQuote(user: AuthContext, orderId: string, dto: SubmitQuoteDto) {
    const userId = this.getUserId(user);
    const order = await this.loadOrderForVendor(orderId, userId);
    const quote = order.quote!;
    this.requireStatus(quote, ['PENDING_VENDOR_QUOTE'], 'submit quote');

    if (dto.amount <= 0) {
      throw new BadRequestException('Quote amount must be greater than zero');
    }

    const db = this.db();
    const updated = await db.$transaction(
      async (tx: any) => {
        const next = await tx.quote.update({
          where: { orderId: order.id },
          data: {
            status: 'QUOTED',
            currentAmount: dto.amount,
          },
        });

        await tx.quoteRevision.create({
          data: {
            quoteId: next.id,
            type: 'VENDOR_QUOTE',
            amount: dto.amount,
            actorId: userId,
            note: dto.note ?? null,
          },
        });

        await tx.order.update({
          where: { id: order.id },
          data: { quoteStatus: 'QUOTED' },
        });

        return next;
      },
      { maxWait: 15_000, timeout: 30_000 },
    );

    this.eventEmitter.emit('quote.submitted', {
      orderId: order.id,
      quoteId: quote.id,
      vendorId: userId,
      buyerId: order.buyerId,
      amount: dto.amount,
      note: dto.note ?? null,
    });

    this.logger.log(
      `Vendor ${userId} submitted quote ${quote.id} for order ${order.id}: ${dto.amount}`,
    );

    return this.getQuote(user, order.id);
  }

  /**
   * 2. Vendor revises the quote after the customer requested a reduction.
   *    CUSTOMER_REQUESTED_REDUCTION → VENDOR_REVISED
   */
  async reviseQuote(user: AuthContext, orderId: string, dto: ReviseQuoteDto) {
    const userId = this.getUserId(user);
    const order = await this.loadOrderForVendor(orderId, userId);
    const quote = order.quote!;
    this.requireStatus(
      quote,
      ['CUSTOMER_REQUESTED_REDUCTION'],
      'revise quote',
    );

    if (dto.amount <= 0) {
      throw new BadRequestException('Quote amount must be greater than zero');
    }

    const db = this.db();
    await db.$transaction(
      async (tx: any) => {
        await tx.quote.update({
          where: { orderId: order.id },
          data: {
            status: 'VENDOR_REVISED',
            currentAmount: dto.amount,
          },
        });

        await tx.quoteRevision.create({
          data: {
            quoteId: quote.id,
            type: 'VENDOR_REVISE',
            amount: dto.amount,
            actorId: userId,
            note: dto.note ?? null,
          },
        });

        await tx.order.update({
          where: { id: order.id },
          data: { quoteStatus: 'VENDOR_REVISED' },
        });
      },
      { maxWait: 15_000, timeout: 30_000 },
    );

    this.eventEmitter.emit('quote.revised', {
      orderId: order.id,
      quoteId: quote.id,
      vendorId: userId,
      buyerId: order.buyerId,
      amount: dto.amount,
      note: dto.note ?? null,
    });

    this.logger.log(
      `Vendor ${userId} revised quote ${quote.id} for order ${order.id}: ${dto.amount}`,
    );

    return this.getQuote(user, order.id);
  }

  /**
   * 3. Vendor accepts the customer's requested reduction.
   *    CUSTOMER_REQUESTED_REDUCTION → AGREED (terminal-agreement)
   *
   * The agreed amount = quote.currentAmount (the customer's requested amount,
   * which was set by `requestReduction`). The vendor cannot negotiate further
   * here — they either accept the customer's request or reject it.
   */
  async acceptReduction(user: AuthContext, orderId: string, dto?: QuoteNoteDto) {
    const userId = this.getUserId(user);
    const order = await this.loadOrderForVendor(orderId, userId);
    const quote = order.quote!;
    this.requireStatus(
      quote,
      ['CUSTOMER_REQUESTED_REDUCTION'],
      'accept reduction',
    );

    const agreedAmount = quote.currentAmount;
    const now = new Date();
    const newTotal =
      Number(order.subtotal || 0) +
      Number(order.processingFeeAmount || 0) +
      Number(agreedAmount || 0);

    const db = this.db();
    await db.$transaction(
      async (tx: any) => {
        await tx.quote.update({
          where: { orderId: order.id },
          data: {
            status: 'AGREED',
            agreedAmount,
            agreedAt: now,
          },
        });

        await tx.quoteRevision.create({
          data: {
            quoteId: quote.id,
            type: 'VENDOR_ACCEPT_REDUCTION',
            amount: agreedAmount,
            actorId: userId,
            note: dto?.note ?? null,
          },
        });

        await tx.order.update({
          where: { id: order.id },
          data: {
            quoteStatus: 'AGREED',
            agreedDeliveryFee: agreedAmount,
            agreedAt: now,
            totalAmount: newTotal,
          },
        });
      },
      { maxWait: 15_000, timeout: 30_000 },
    );

    this.eventEmitter.emit('quote.agreed', {
      orderId: order.id,
      quoteId: quote.id,
      vendorId: userId,
      buyerId: order.buyerId,
      agreedAmount,
      initiator: 'VENDOR',
      note: dto?.note ?? null,
    });

    this.logger.log(
      `Vendor ${userId} accepted reduction on quote ${quote.id} (order ${order.id}): ${agreedAmount}`,
    );

    return this.getQuote(user, order.id);
  }

  /**
   * 4. Vendor rejects the customer's requested reduction.
   *    CUSTOMER_REQUESTED_REDUCTION → QUOTED (customer can accept original or cancel)
   *
   * We restore `quote.currentAmount` to the last vendor-authored amount
   * (VENDOR_QUOTE or VENDOR_REVISE) so the customer sees the vendor's quote,
   * not their own rejected request.
   */
  async rejectReduction(user: AuthContext, orderId: string, dto?: QuoteNoteDto) {
    const userId = this.getUserId(user);
    const order = await this.loadOrderForVendor(orderId, userId);
    const quote = order.quote!;
    this.requireStatus(
      quote,
      ['CUSTOMER_REQUESTED_REDUCTION'],
      'reject reduction',
    );

    const restoreAmount =
      (await this.lastVendorAuthoredAmount(quote.id)) ?? quote.currentAmount;

    const db = this.db();
    await db.$transaction(
      async (tx: any) => {
        await tx.quote.update({
          where: { orderId: order.id },
          data: {
            status: 'QUOTED',
            currentAmount: restoreAmount,
          },
        });

        await tx.quoteRevision.create({
          data: {
            quoteId: quote.id,
            type: 'VENDOR_REJECT_REDUCTION',
            amount: restoreAmount,
            actorId: userId,
            note: dto?.note ?? null,
          },
        });

        await tx.order.update({
          where: { id: order.id },
          data: { quoteStatus: 'QUOTED' },
        });
      },
      { maxWait: 15_000, timeout: 30_000 },
    );

    this.eventEmitter.emit('quote.rejected_reduction', {
      orderId: order.id,
      quoteId: quote.id,
      vendorId: userId,
      buyerId: order.buyerId,
      restoredAmount: restoreAmount,
      note: dto?.note ?? null,
    });

    this.logger.log(
      `Vendor ${userId} rejected reduction on quote ${quote.id} (order ${order.id}); restored amount ${restoreAmount}`,
    );

    return this.getQuote(user, order.id);
  }

  // ─── Customer actions ─────────────────────────────────────────────────────

  /**
   * 5. Customer accepts the vendor's current quote.
   *    QUOTED | VENDOR_REVISED → AGREED (terminal-agreement)
   */
  async acceptQuote(user: AuthContext, orderId: string, dto?: QuoteNoteDto) {
    const userId = this.getUserId(user);
    const order = await this.loadOrderForBuyer(orderId, userId);
    const quote = order.quote!;
    this.requireStatus(
      quote,
      ['QUOTED', 'VENDOR_REVISED'],
      'accept quote',
    );

    const agreedAmount = quote.currentAmount;
    const now = new Date();
    const newTotal =
      Number(order.subtotal || 0) +
      Number(order.processingFeeAmount || 0) +
      Number(agreedAmount || 0);

    const db = this.db();
    await db.$transaction(
      async (tx: any) => {
        await tx.quote.update({
          where: { orderId: order.id },
          data: {
            status: 'AGREED',
            agreedAmount,
            agreedAt: now,
          },
        });

        await tx.quoteRevision.create({
          data: {
            quoteId: quote.id,
            type: 'CUSTOMER_ACCEPT',
            amount: agreedAmount,
            actorId: userId,
            note: dto?.note ?? null,
          },
        });

        await tx.order.update({
          where: { id: order.id },
          data: {
            quoteStatus: 'AGREED',
            agreedDeliveryFee: agreedAmount,
            agreedAt: now,
            totalAmount: newTotal,
          },
        });
      },
      { maxWait: 15_000, timeout: 30_000 },
    );

    this.eventEmitter.emit('quote.agreed', {
      orderId: order.id,
      quoteId: quote.id,
      buyerId: userId,
      vendorId: order.quote!.vendorId,
      agreedAmount,
      initiator: 'CUSTOMER',
      note: dto?.note ?? null,
    });

    this.logger.log(
      `Customer ${userId} accepted quote ${quote.id} for order ${order.id}: ${agreedAmount}`,
    );

    return this.getQuote(user, order.id);
  }

  /**
   * 6. Customer requests a lower delivery fee.
   *    QUOTED | VENDOR_REVISED → CUSTOMER_REQUESTED_REDUCTION
   *
   * IMPORTANT: the customer does NOT overwrite the vendor's quote — they create
   * a revision capturing their requested amount, and `quote.currentAmount` is
   * set to their request (so the vendor can see it). `quote.agreedAmount` stays
   * null. The vendor's original amount is preserved in the QuoteRevision history.
   */
  async requestReduction(
    user: AuthContext,
    orderId: string,
    dto: RequestReductionDto,
  ) {
    const userId = this.getUserId(user);
    const order = await this.loadOrderForBuyer(orderId, userId);
    const quote = order.quote!;
    this.requireStatus(
      quote,
      ['QUOTED', 'VENDOR_REVISED'],
      'request reduction',
    );

    if (dto.amount < 0) {
      throw new BadRequestException(
        'Reduction amount cannot be negative',
      );
    }
    if (dto.amount >= quote.currentAmount) {
      throw new BadRequestException(
        `Requested amount (${dto.amount}) must be lower than the current quote (${quote.currentAmount}). Use /quote/accept to accept the vendor's quote.`,
      );
    }

    const db = this.db();
    await db.$transaction(
      async (tx: any) => {
        await tx.quote.update({
          where: { orderId: order.id },
          data: {
            status: 'CUSTOMER_REQUESTED_REDUCTION',
            currentAmount: dto.amount,
          },
        });

        await tx.quoteRevision.create({
          data: {
            quoteId: quote.id,
            type: 'CUSTOMER_REQUEST_REDUCTION',
            amount: dto.amount,
            actorId: userId,
            note: dto.note ?? null,
          },
        });

        await tx.order.update({
          where: { id: order.id },
          data: { quoteStatus: 'CUSTOMER_REQUESTED_REDUCTION' },
        });
      },
      { maxWait: 15_000, timeout: 30_000 },
    );

    this.eventEmitter.emit('quote.reduction_requested', {
      orderId: order.id,
      quoteId: quote.id,
      buyerId: userId,
      vendorId: quote.vendorId,
      requestedAmount: dto.amount,
      previousAmount: quote.currentAmount,
      note: dto.note ?? null,
    });

    this.logger.log(
      `Customer ${userId} requested reduction on quote ${quote.id} (order ${order.id}): ${dto.amount} (was ${quote.currentAmount})`,
    );

    return this.getQuote(user, order.id);
  }

  /**
   * 7. Customer rejects the vendor's quote entirely (terminal).
   *    * → REJECTED
   */
  async rejectQuote(user: AuthContext, orderId: string, dto?: QuoteNoteDto) {
    const userId = this.getUserId(user);
    const order = await this.loadOrderForBuyer(orderId, userId);
    const quote = order.quote!;

    if (quote.status === 'AGREED') {
      throw new BadRequestException(
        'Cannot reject a quote that has already been agreed',
      );
    }
    if (quote.status === 'REJECTED') {
      throw new BadRequestException('Quote is already rejected');
    }

    const now = new Date();
    const db = this.db();
    await db.$transaction(
      async (tx: any) => {
        await tx.quote.update({
          where: { orderId: order.id },
          data: {
            status: 'REJECTED',
            rejectedAt: now,
            rejectedBy: userId,
            rejectReason: dto?.note ?? null,
          },
        });

        await tx.quoteRevision.create({
          data: {
            quoteId: quote.id,
            type: 'CUSTOMER_REJECT',
            amount: quote.currentAmount,
            actorId: userId,
            note: dto?.note ?? null,
          },
        });

        await tx.order.update({
          where: { id: order.id },
          data: { quoteStatus: 'REJECTED' },
        });
      },
      { maxWait: 15_000, timeout: 30_000 },
    );

    this.eventEmitter.emit('quote.rejected', {
      orderId: order.id,
      quoteId: quote.id,
      buyerId: userId,
      vendorId: quote.vendorId,
      reason: dto?.note ?? null,
    });

    this.logger.log(
      `Customer ${userId} rejected quote ${quote.id} for order ${order.id}`,
    );

    return this.getQuote(user, order.id);
  }

  // ─── Shared actions ───────────────────────────────────────────────────────

  /**
   * 8. Returns the quote with all revisions (both customer and vendor can view).
   */
  async getQuote(user: AuthContext, orderId: string) {
    const userId = this.getUserId(user);
    await this.loadOrderForParty(orderId, userId);

    const db = this.db();
    const quote = await db.quote.findUnique({
      where: { orderId },
      include: {
        revisions: {
          orderBy: { createdAt: 'asc' },
        },
        order: {
          select: {
            id: true,
            subtotal: true,
            processingFeeAmount: true,
            processingFeePercent: true,
            totalAmount: true,
            agreedDeliveryFee: true,
            agreedAt: true,
            quoteStatus: true,
            deliveryMethod: true,
            status: true,
          },
        },
      },
    });

    if (!quote) {
      throw new NotFoundException(`Quote for order ${orderId} not found`);
    }

    return quote;
  }

  /**
   * 9. Initialize a Paystack payment for the order.
   *    ONLY allowed when quote.status === AGREED.
   *
   * Creates a Payment row with gateway=PAYSTACK, status=PENDING, then calls
   * PaystackService.initializeTransaction to get the authorization URL.
   */
  async initializePayment(user: AuthContext, orderId: string) {
    const userId = this.getUserId(user);
    const order = await this.loadOrderForBuyer(orderId, userId);
    const quote = order.quote!;

    if (quote.status !== 'AGREED') {
      throw new BadRequestException(
        `Cannot initialize payment: quote must be AGREED (current status: ${quote.status})`,
      );
    }

    const buyerEmail = order.buyer?.email;
    if (!buyerEmail) {
      throw new BadRequestException(
        'Buyer email is required to initialize payment',
      );
    }

    const reference = this.paymentReference();
    const amount = Number(order.totalAmount || 0);
    const callbackUrl = this.defaultPaymentCallbackUrl(reference);

    const db = this.db();

    // If a payment already exists for this order, reuse it (idempotent) —
    // but only if it's still PENDING. Otherwise create a new one.
    let payment = order.id
      ? await db.payment.findUnique({ where: { orderId: order.id } })
      : null;

    if (payment && payment.status !== 'PENDING') {
      throw new BadRequestException(
        `Order ${order.id} already has a payment in status ${payment.status}`,
      );
    }

    if (!payment) {
      payment = await db.payment.create({
        data: {
          orderId: order.id,
          entityType: 'ORDER',
          entityId: order.id,
          amount,
          gateway: 'PAYSTACK',
          status: 'PENDING',
          reference,
        },
      });
    }

    // Initialize the Paystack transaction (this hits the Paystack API).
    const initialized = await this.paystack.initializeTransaction({
      email: buyerEmail,
      amount,
      reference: payment.reference,
      callbackUrl,
      metadata: {
        orderId: order.id,
        quoteId: quote.id,
        buyerId: userId,
        vendorId: quote.vendorId,
        source: 'kwikseller_quote_payment',
      },
    });

    // Persist the authorization URL + gateway response.
    payment = await db.payment.update({
      where: { id: payment.id },
      data: {
        authorizationUrl: initialized.authorizationUrl,
        gatewayResponse: JSON.stringify({
          initialize: initialized.raw,
          accessCode: initialized.accessCode,
        }),
      },
    });

    this.eventEmitter.emit('payment.initialized', {
      orderId: order.id,
      quoteId: quote.id,
      paymentId: payment.id,
      reference: payment.reference,
      amount,
      buyerId: userId,
      vendorId: quote.vendorId,
      source: 'quote',
    });

    this.logger.log(
      `Initialized payment ${payment.id} (ref ${payment.reference}) for order ${order.id} — amount ${amount}`,
    );

    return {
      payment,
      authorizationUrl: initialized.authorizationUrl,
      reference: payment.reference,
    };
  }
}
