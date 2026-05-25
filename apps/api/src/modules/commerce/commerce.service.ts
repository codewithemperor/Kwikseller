import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';
import { PaystackService } from './paystack.service';
import {
  AddCartItemDto,
  CheckoutDto,
  CreatePaymentIntentDto,
  CreatePoolCampaignDto,
  CreatePoolOfferDto,
  CreatePoolProductDto,
  CreateVendorProductDto,
  DigitalAssetDto,
  InventoryAdjustmentDto,
  ManualDeliveryDto,
  RefundPaymentDto,
  UpdateCartItemDto,
  UpdateDeliverySettingsDto,
  UpdateOrderStatusDto,
  UpdatePoolOfferDto,
  UpdateStorefrontDesignDto,
  UpdateVendorProductDto,
  UpsertDeliveryRateDto,
  ValidateCouponDto,
} from './commerce.dto';

type AuthContext = {
  id?: string;
  sub?: string;
  userId?: string;
  role?: string;
  storeId?: string;
  email?: string;
};

type CartValidationIssue = {
  code: string;
  message: string;
  cartItemId?: string;
  productId?: string;
  field?: string;
  available?: number;
  requested?: number;
};

const STOREFRONT_TEMPLATE_OPTIONS = {
  themePreset: ['CLASSIC', 'MODERN_DARK', 'EDITORIAL_LIGHT'],
  navbarTemplate: ['NAVBAR_CLASSIC', 'NAVBAR_CENTERED', 'NAVBAR_MINIMAL'],
  bottomNavTemplate: ['BOTTOM_TABS_CLASSIC', 'BOTTOM_TABS_COMPACT', 'BOTTOM_NONE'],
  layoutTemplate: ['GRID_COMMERCE', 'DENSE_GRID', 'EDITORIAL_STACK'],
  cartTemplate: ['CART_COMPACT', 'CART_SIDEPANEL', 'CART_MINIMAL'],
  typographyPreset: ['FIGTREE_QUESTRIAL', 'INTER_TIGHT', 'SERIF_EDITORIAL'],
  fontPairing: ['FIGTREE_QUESTRIAL', 'INTER_TIGHT', 'SERIF_EDITORIAL'],
  heroLayout: ['BANNER_LEFT', 'CENTERED_HERO', 'MINIMAL_STRIP'],
  productCardStyle: ['CLEAN_GRID', 'COMPACT_COMMERCE', 'EDITORIAL_CARD'],
} as const;

const STOREFRONT_FONT_KEYS = [
  'SORA',
  'FIGTREE',
  'INTER',
  'POPPINS',
  'DM_SANS',
  'LATO',
  'MONTSERRAT',
  'PLAYFAIR_DISPLAY',
  'MERRIWEATHER',
] as const;

const RESERVATION_MINUTES = 15;
const STARTER_POOL_SELECTION_LIMIT = 50;
const ORDER_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['PENDING_PAYMENT', 'CANCELLED'],
  PENDING_PAYMENT: ['PAID', 'CANCELLED'],
  PENDING: ['PAID', 'CANCELLED'],
  PAID: ['PROCESSING', 'FULFILLED', 'CANCELLED', 'REFUNDED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['FULFILLED', 'SHIPPED', 'CANCELLED', 'REFUNDED'],
  FULFILLED: ['DELIVERED', 'REFUNDED'],
  SHIPPED: ['DELIVERED', 'REFUNDED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
};

@Injectable()
export class CommerceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly paystack: PaystackService,
  ) {}

  private db() {
    return this.prisma as unknown as Record<string, any>;
  }

  private getUserId(user: AuthContext | null | undefined) {
    const userId = user?.id ?? user?.sub ?? user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }
    return userId;
  }

  private assertRole(user: AuthContext | null | undefined, allowed: string[]) {
    const role = `${user?.role ?? ''}`.toUpperCase();
    if (!allowed.includes(role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }

  private async resolveStoreId(user: AuthContext) {
    if (user.storeId) {
      return user.storeId;
    }

    const userId = this.getUserId(user);
    const store = await this.db()
      .store?.findFirst({
        where: { vendorId: userId },
        select: { id: true },
      })
      .catch(() => null);

    if (store?.id) {
      return store.id;
    }

    const vendor = await this.db().user?.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!vendor || `${vendor.role}`.toUpperCase() !== 'VENDOR') {
      throw new ForbiddenException('Vendor store is required for this action');
    }

    const baseName =
      [vendor.profile?.firstName, vendor.profile?.lastName].filter(Boolean).join(' ').trim() ||
      vendor.email?.split('@')[0] ||
      'Vendor Store';
    const created = await this.db().store?.create({
      data: {
        vendorId: userId,
        name: baseName,
        slug: `${this.slugify(baseName)}-${randomUUID().slice(0, 6)}`,
        category: 'other',
        onboardingStep: 'STORE_SETUP',
        storefrontDesign: {
          create: {
            headingFont: 'SORA',
            bodyFont: 'FIGTREE',
          },
        },
        deliverySetting: {
          create: {
            manualDeliveryEnabled: true,
            kwiksellerDeliveryEnabled: false,
            processingDays: 1,
          },
        },
      },
      select: { id: true },
    });

    if (!created?.id) {
      throw new ForbiddenException('Vendor store is required for this action');
    }

    return created.id;
  }

  private checkoutReference() {
    return `KWK-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;
  }

  private normalizeLocationPart(value: string) {
    return value.trim().replace(/\s+/g, ' ');
  }

  private deliveryEstimate(rate: { minDeliveryDays: number; maxDeliveryDays: number }) {
    const start = new Date();
    const end = new Date();
    start.setDate(start.getDate() + Number(rate.minDeliveryDays ?? 0));
    end.setDate(end.getDate() + Number(rate.maxDeliveryDays ?? rate.minDeliveryDays ?? 0));
    return { estimatedDeliveryStart: start, estimatedDeliveryEnd: end };
  }

  private normalizeStorefrontDesign(design?: any) {
    const fallbackSections = ['hero', 'products', 'pool', 'policies'];
    const sections =
      typeof design?.sections === 'string'
        ? (() => {
            try {
              const parsed = JSON.parse(design.sections);
              return Array.isArray(parsed) ? parsed : fallbackSections;
            } catch {
              return fallbackSections;
            }
          })()
        : fallbackSections;

    return {
      id: design?.id,
      themePreset: this.safeTemplateKey('themePreset', design?.themePreset),
      navbarTemplate: this.safeTemplateKey('navbarTemplate', design?.navbarTemplate),
      bottomNavTemplate: this.safeTemplateKey('bottomNavTemplate', design?.bottomNavTemplate),
      layoutTemplate: this.safeTemplateKey('layoutTemplate', design?.layoutTemplate),
      cartTemplate: this.safeTemplateKey('cartTemplate', design?.cartTemplate),
      typographyPreset: this.safeTemplateKey('typographyPreset', design?.typographyPreset),
      primaryColor: this.safeHexColor(design?.primaryColor, '#071A2F'),
      accentColor: this.safeHexColor(design?.accentColor, '#F97316'),
      fontPairing: this.safeTemplateKey('fontPairing', design?.fontPairing),
      headingFont: this.safeFontKey(design?.headingFont, 'SORA'),
      bodyFont: this.safeFontKey(design?.bodyFont, 'FIGTREE'),
      heroLayout: this.safeTemplateKey('heroLayout', design?.heroLayout),
      productCardStyle: this.safeTemplateKey('productCardStyle', design?.productCardStyle),
      sections,
      heroTitle: design?.heroTitle ?? null,
      heroSubtitle: design?.heroSubtitle ?? null,
    };
  }

  private safeTemplateKey<T extends keyof typeof STOREFRONT_TEMPLATE_OPTIONS>(field: T, value?: string) {
    const options = STOREFRONT_TEMPLATE_OPTIONS[field] as readonly string[];
    return value && options.includes(value) ? value : options[0];
  }

  private assertTemplateKey<T extends keyof typeof STOREFRONT_TEMPLATE_OPTIONS>(field: T, value?: string) {
    if (!value) return undefined;
    const options = STOREFRONT_TEMPLATE_OPTIONS[field] as readonly string[];
    if (!options.includes(value)) {
      throw new BadRequestException(`${field} must be one of: ${options.join(', ')}`);
    }
    return value;
  }

  private assertProductCanPublish(product: any) {
    if (!product.categoryId) {
      throw new BadRequestException('Publishing requires a category');
    }
    const images = Array.isArray(product.images) ? product.images : [];
    if (!images.length) {
      throw new BadRequestException('Publishing requires at least one product image');
    }
    if (Number(product.price ?? 0) <= 0) {
      throw new BadRequestException('Publishing requires a valid price');
    }
    const isTrackedPhysical =
      product.productType === 'PHYSICAL' &&
      (product.trackInventory ?? product.inventoryPolicy === 'TRACKED');
    if (isTrackedPhysical && Number(product.stock ?? 0) < 1) {
      throw new BadRequestException('Publishing tracked physical products requires available stock');
    }
  }

  private safeHexColor(value: unknown, fallback: string) {
    return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value.toUpperCase() : fallback;
  }

  private assertHexColor(field: string, value?: string) {
    if (value === undefined) return undefined;
    if (!/^#[0-9a-fA-F]{6}$/.test(value)) {
      throw new BadRequestException(`${field} must be a valid #RRGGBB color`);
    }
    return value.toUpperCase();
  }

  private safeFontKey(value: unknown, fallback: (typeof STOREFRONT_FONT_KEYS)[number]) {
    return typeof value === 'string' && (STOREFRONT_FONT_KEYS as readonly string[]).includes(value)
      ? value
      : fallback;
  }

  private assertFontKey(field: string, value?: string) {
    if (!value) return undefined;
    if (!(STOREFRONT_FONT_KEYS as readonly string[]).includes(value)) {
      throw new BadRequestException(`${field} must be one of: ${STOREFRONT_FONT_KEYS.join(', ')}`);
    }
    return value;
  }

  async getCart(user: AuthContext) {
    const userId = this.getUserId(user);
    const db = this.db();

    const existingCart = await db.cart?.findFirst({
      where: { userId },
      include: {
        items: {
          include: {
            product: { include: { store: true } },
            variant: true,
            poolOffer: {
              include: {
                poolProduct: true,
                store: true,
                sourceStore: true,
                sourceProduct: { include: { inventoryItems: true, store: true } },
              },
            },
            reservations: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (existingCart) {
      return this.withCartTotals(existingCart);
    }

    const cart = await db.cart?.create({
      data: { userId },
      include: { items: true },
    });

    return this.withCartTotals(cart);
  }

  async addCartItem(user: AuthContext, dto: AddCartItemDto) {
    this.getUserId(user);
    const db = this.db();
    const cart = await this.getCart(user);
    const product = await db.product?.findUnique({
      where: { id: dto.productId },
      include: {
        inventoryItems: true,
        digitalAssets: true,
        store: true,
        poolProduct: { include: { inventoryItems: true } },
        vendorPoolOffers: {
          where: { isActive: true, status: 'ACTIVE' },
          include: {
            poolProduct: { include: { inventoryItems: true } },
            sourceStore: true,
            sourceProduct: { include: { inventoryItems: true, store: true } },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    let poolOffer: any = null;
    if (dto.poolOfferId) {
      poolOffer = await db.vendorPoolOffer?.findUnique({
        where: { id: dto.poolOfferId },
        include: {
          poolProduct: { include: { inventoryItems: true } },
          store: true,
          sourceStore: true,
          sourceProduct: { include: { inventoryItems: true, store: true } },
        },
      });
      if (!poolOffer || !poolOffer.isActive) {
        throw new BadRequestException('Pool offer is not available');
      }
    }

    const existing = await db.cartItem?.findFirst({
      where: {
        cartId: cart.id,
        productId: dto.productId,
        variantId: dto.variantId ?? null,
        poolOfferId: dto.poolOfferId ?? null,
      },
    });
    const requestedQuantity = Number(existing?.quantity ?? 0) + Number(dto.quantity ?? 0);
    await this.assertCartLineCanBeAdded({
      product,
      quantity: requestedQuantity,
      variantId: dto.variantId,
      poolOfferId: dto.poolOfferId,
      poolOffer,
    });

    if (existing) {
      await db.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + dto.quantity },
      });
    } else {
      await db.cartItem?.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          variantId: dto.variantId,
          poolOfferId: dto.poolOfferId,
          quantity: dto.quantity,
          price: product.salePrice ?? product.price,
          productType: product.productType ?? 'PHYSICAL',
          productSource: product.productSource ?? 'VENDOR_STOCK',
          requiresShipping: product.requiresShipping ?? product.productType !== 'DIGITAL',
        },
      });
    }

    return this.getCart(user);
  }

  async addPoolOfferToCart(user: AuthContext, poolOfferId: string, quantity: number) {
    const poolOffer = await this.db().vendorPoolOffer?.findUnique({
      where: { id: poolOfferId },
      include: { product: true, poolProduct: true, store: true, sourceStore: true, sourceProduct: true },
    });

    if (!poolOffer?.productId) {
      throw new BadRequestException('Pool offer is not linked to a storefront product yet');
    }

    return this.addCartItem(user, {
      productId: poolOffer.productId,
      poolOfferId,
      quantity,
    });
  }

  async updateCartItem(user: AuthContext, itemId: string, dto: UpdateCartItemDto) {
    const userId = this.getUserId(user);
    const db = this.db();
    const item = await db.cartItem?.findFirst({
      where: { id: itemId, cart: { userId } },
      include: {
        product: {
          include: {
            inventoryItems: true,
              digitalAssets: true,
              store: true,
              poolProduct: { include: { inventoryItems: true } },
              vendorPoolOffers: {
                where: { isActive: true, status: 'ACTIVE' },
                include: {
                  poolProduct: { include: { inventoryItems: true } },
                  sourceStore: true,
                  sourceProduct: { include: { inventoryItems: true, store: true } },
                },
              },
            },
          },
          poolOffer: {
            include: {
              poolProduct: { include: { inventoryItems: true } },
              store: true,
              sourceStore: true,
              sourceProduct: { include: { inventoryItems: true, store: true } },
            },
          },
        },
      });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    if (dto.quantity === 0) {
      await db.cartItem.delete({ where: { id: itemId } });
    } else {
      await this.assertCartLineCanBeAdded({
        product: item.product,
        quantity: dto.quantity,
        variantId: item.variantId,
        poolOfferId: item.poolOfferId,
        poolOffer: item.poolOffer,
      });
      await db.cartItem.update({
        where: { id: itemId },
        data: { quantity: dto.quantity },
      });
    }

    return this.getCart(user);
  }

  async removeCartItem(user: AuthContext, itemId: string) {
    return this.updateCartItem(user, itemId, { quantity: 0 });
  }

  async clearCart(user: AuthContext) {
    const userId = this.getUserId(user);
    const cart = await this.db().cart?.findFirst({ where: { userId } });
    if (cart) {
      await this.db().cartItem?.deleteMany({ where: { cartId: cart.id } });
    }
    return this.getCart(user);
  }

  async clearStoreCart(user: AuthContext, storeSlug: string) {
    const userId = this.getUserId(user);
    const cart = await this.db().cart?.findFirst({
      where: { userId },
      include: this.cartValidationInclude(),
    });
    if (!cart) return this.getCart(user);

    const itemIds = (cart.items ?? [])
      .filter((item: any) => this.cartItemMatchesStoreSlug(item, storeSlug))
      .map((item: any) => item.id)
      .filter(Boolean);

    if (itemIds.length) {
      await this.db().cartItem?.deleteMany({
        where: { cartId: cart.id, id: { in: itemIds } },
      });
    }

    return this.getCart(user);
  }

  async validateCart(user: AuthContext) {
    const userId = this.getUserId(user);
    const cart = await this.db().cart?.findFirst({
      where: { userId },
      include: this.cartValidationInclude(),
      orderBy: { updatedAt: 'desc' },
    });

    if (!cart) {
      return {
        valid: true,
        errors: [],
        warnings: [],
        cart: null,
        totals: { subtotal: 0, discount: 0, total: 0 },
        requiresShipping: false,
        hasDigitalDelivery: false,
      };
    }

    return this.buildCartValidation(cart);
  }

  async lookupDeliveryRate(state: string, localGovernment: string) {
    const normalizedState = this.normalizeLocationPart(state ?? '');
    const normalizedLga = this.normalizeLocationPart(localGovernment ?? '');

    if (!normalizedState || !normalizedLga) {
      throw new BadRequestException('State and local government are required');
    }

    const rate = await (this.db() as any).deliveryRate?.findFirst({
      where: {
        state: { equals: normalizedState, mode: 'insensitive' },
        localGovernment: { equals: normalizedLga, mode: 'insensitive' },
        isActive: true,
      },
    });

    if (!rate) {
      throw new NotFoundException('Delivery is not active for this state and local government yet');
    }

    return {
      ...rate,
      ...this.deliveryEstimate(rate),
      dispatchNote: 'Kwikseller operations will assign manual dispatch after payment.',
    };
  }

  async validateCouponForCart(user: AuthContext, dto: ValidateCouponDto) {
    this.getUserId(user);
    const cart = await this.getCart(user);
    return this.resolveCouponDiscount(this.db(), dto.code, cart.subtotal);
  }

  async checkout(user: AuthContext, dto: CheckoutDto) {
    const userId = this.getUserId(user);
    const db = this.db();
    const buyerEmail = await this.resolveBuyerEmail(userId, user);
    const cartWhere = dto.cartId ? { id: dto.cartId, userId } : { userId };

    const result = await db.$transaction(async (tx: any) => {
      if (dto.idempotencyKey) {
        const existingCheckout = await tx.parentCheckout.findFirst({
          where: { buyerId: userId, idempotencyKey: dto.idempotencyKey },
          include: {
            payment: true,
            orders: {
              include: { items: true, store: true },
              orderBy: { createdAt: 'asc' },
            },
          },
        });

        if (existingCheckout?.payment) {
          return {
            parentCheckout: existingCheckout,
            orders: existingCheckout.orders,
            order: existingCheckout.orders[0],
            payment: existingCheckout.payment,
            authorizationUrl: existingCheckout.payment.authorizationUrl,
            reference: existingCheckout.payment.reference,
            requiresShipping: existingCheckout.orders.some((order: any) => Number(order.shippingFee ?? 0) > 0),
          };
        }

        const existingOrder = await tx.order.findFirst({
          where: { buyerId: userId, idempotencyKey: dto.idempotencyKey },
          include: { payment: true, items: true },
        });

        if (existingOrder?.payment) {
          return {
            order: existingOrder,
            payment: existingOrder.payment,
            authorizationUrl: existingOrder.payment.authorizationUrl,
            reference: existingOrder.payment.reference,
            requiresShipping: this.withCartTotals({ items: existingOrder.items }).requiresShipping,
          };
        }
      }

      const cart = await tx.cart.findFirst({
        where: cartWhere,
        include: this.cartValidationInclude(),
        orderBy: { updatedAt: 'desc' },
      });

      if (dto.storeSlug) {
        const store = await tx.store.findUnique({
          where: { slug: dto.storeSlug },
          select: { id: true },
        });
        if (!store) {
          throw new BadRequestException('Vendor store not found');
        }
      }

      const checkoutCart = dto.storeSlug ? this.scopeCartToStore(cart, dto.storeSlug) : cart;
      const checkoutCartItemIds = (checkoutCart?.items ?? [])
        .map((item: any) => item.id)
        .filter(Boolean);

      if (!checkoutCart?.items?.length) {
        throw new BadRequestException(dto.storeSlug ? 'Vendor cart is empty' : 'Cart is empty');
      }

      const validation = this.buildCartValidation(checkoutCart);
      if (!validation.valid) {
        throw new BadRequestException({
          message: 'Cart validation failed',
          errors: validation.errors,
          warnings: validation.warnings,
        });
      }

      const groupedItems = this.groupCartItemsByStore(checkoutCart.items);
      const groups = [...groupedItems.values()];
      const hasPhysicalItems = groups.some((group) => group.requiresShipping);
      if (hasPhysicalItems && !dto.shippingAddress) {
        throw new BadRequestException('Shipping address is required for physical products');
      }

      const deliveryQuotes = new Map<string, any>();
      if (hasPhysicalItems) {
        for (const group of groups) {
          if (group.requiresShipping) {
            deliveryQuotes.set(
              group.storeId,
              await this.resolveDeliveryQuote(
                tx,
                dto.shippingAddress?.state,
                dto.shippingAddress?.localGovernment,
                group.storeId,
              ),
            );
          }
        }
      }

      const address = dto.shippingAddress
        ? await tx.address.create({
            data: {
              userId,
              line1: dto.shippingAddress.addressLine1,
              line2: dto.shippingAddress.addressLine2,
              city: dto.shippingAddress.city,
              state: dto.shippingAddress.state,
              localGovernment: dto.shippingAddress.localGovernment,
              deliveryInstructions: dto.shippingAddress.deliveryInstructions,
              country: dto.shippingAddress.country,
              type: 'SHIPPING',
            },
          })
        : null;

      const totals = this.withCartTotals(checkoutCart);
      const coupon = dto.couponCode
        ? await this.resolveCouponDiscount(tx, dto.couponCode, totals.subtotal)
        : null;
      const discount = coupon ? Number(coupon.discount ?? 0) : totals.discount;
      const groupDiscounts = this.allocateDiscount(discount, groups);
      const shippingFee = groups.reduce(
        (sum, group) => sum + (group.requiresShipping ? Number(deliveryQuotes.get(group.storeId)?.rate.fee ?? 0) : 0),
        0,
      );
      const totalAmount = Math.max(0, totals.subtotal + shippingFee - discount);
      const reference = this.checkoutReference();

      const parentCheckout = await tx.parentCheckout.create({
        data: {
          buyerId: userId,
          subtotal: totals.subtotal,
          shippingFee,
          discount,
          totalAmount,
          couponId: coupon?.couponId,
          status: 'PENDING_PAYMENT',
          paymentStatus: 'PENDING',
          checkoutReference: reference,
          idempotencyKey: dto.idempotencyKey,
        },
      });

      const orders: any[] = [];
      for (const [index, group] of groups.entries()) {
        const deliveryQuote = deliveryQuotes.get(group.storeId);
        const groupShippingFee = group.requiresShipping ? Number(deliveryQuote?.rate.fee ?? 0) : 0;
        const groupDiscount = groupDiscounts.get(group.storeId) ?? 0;
        const groupTotal = Math.max(0, group.subtotal + groupShippingFee - groupDiscount);
        const order = await tx.order.create({
          data: {
            buyerId: userId,
            storeId: group.storeId,
            parentCheckoutId: parentCheckout.id,
            addressId: group.requiresShipping ? address?.id : null,
            subtotal: group.subtotal,
            shippingFee: groupShippingFee,
            totalAmount: groupTotal,
            discount: groupDiscount,
            couponId: coupon?.couponId,
            deliveryRateId: group.requiresShipping ? deliveryQuote?.rate.id : null,
            deliveryState: group.requiresShipping ? deliveryQuote?.rate.state : null,
            deliveryLocalGovernment: group.requiresShipping ? deliveryQuote?.rate.localGovernment : null,
            estimatedDeliveryStart: group.requiresShipping ? deliveryQuote?.estimatedDeliveryStart : null,
            estimatedDeliveryEnd: group.requiresShipping ? deliveryQuote?.estimatedDeliveryEnd : null,
            deliveryRateSnapshot: group.requiresShipping && deliveryQuote ? JSON.stringify(deliveryQuote.rate) : null,
            status: 'PENDING_PAYMENT',
            paymentStatus: 'PENDING',
            checkoutReference: `${reference}-${index + 1}`,
            idempotencyKey: dto.idempotencyKey ? `${dto.idempotencyKey}:${group.storeId}` : undefined,
            items: {
              create: group.items.map((item: any) => ({
              productId: item.productId,
              variantId: item.variantId,
              poolOfferId: item.poolOfferId,
              quantity: item.quantity,
              unitPrice: item.price,
              totalPrice: Number(item.price ?? 0) * Number(item.quantity ?? 0),
              isPoolItem: Boolean(item.poolOfferId),
              productType: item.productType ?? item.product?.productType ?? 'PHYSICAL',
                productSource: item.productSource ?? item.product?.productSource ?? 'VENDOR_STOCK',
                sellerStoreId: item.product?.storeId ?? item.poolOffer?.storeId,
                sourceStoreId: item.poolOffer?.sourceStoreId ?? item.product?.poolSourceStoreId ?? group.storeId,
                sourceProductId: item.poolOffer?.sourceProductId ?? item.product?.poolSourceProductId,
                sourceBasePrice: item.poolOffer?.sourceBasePrice ?? item.product?.poolSourceBasePrice,
                resellerMargin: item.poolOfferId
                  ? Math.max(0, Number(item.price ?? 0) - Number(item.poolOffer?.sourceBasePrice ?? item.product?.poolSourceBasePrice ?? 0))
                  : 0,
                platformFeeAmount: 0,
                fulfillmentStatus: 'PENDING',
              })),
            },
          },
          include: { items: true, store: true },
        });

        for (const orderItem of order.items) {
          const cartItem = group.items.find((item: any) => this.lineItemKey(item) === this.lineItemKey(orderItem));
          await this.reserveInventoryForOrderItem(tx, orderItem, cartItem);
          await this.createPoolSettlementForOrderItem(tx, order, orderItem, cartItem);
        }

        orders.push(order);
      }

      const payment = await tx.payment.create({
        data: {
          parentCheckoutId: parentCheckout.id,
          entityType: 'CHECKOUT',
          entityId: parentCheckout.id,
          amount: totalAmount,
          gateway: 'PAYSTACK',
          status: 'PENDING',
          reference,
        },
      });

      await tx.cartItem.deleteMany({
        where: dto.storeSlug
          ? { cartId: cart.id, id: { in: checkoutCartItemIds } }
          : { cartId: cart.id },
      });
      await this.writeAudit(tx, {
        userId,
        action: 'checkout.created',
        entity: 'ParentCheckout',
        entityId: parentCheckout.id,
        changes: {
          reference,
          total: totalAmount,
          shippingFee,
          discount,
          couponCode: coupon?.code,
            deliveryRateId: [...deliveryQuotes.values()][0]?.rate.id,
          vendorOrders: orders.map((order: any) => order.id),
          reservedItems: orders.reduce((sum: number, order: any) => sum + order.items.length, 0),
        },
      });

      return {
        parentCheckout,
        orders,
        order: orders[0],
        payment,
        authorizationUrl: payment.authorizationUrl,
        reference,
        requiresShipping: totals.requiresShipping,
      };
    });

    try {
      const callbackUrl = this.defaultPaymentCallbackUrl(result.reference);
      const initialized = await this.paystack.initializeTransaction({
        email: buyerEmail,
        amount: result.parentCheckout?.totalAmount ?? result.order.totalAmount,
        reference: result.reference,
        callbackUrl,
        metadata: {
          parentCheckoutId: result.parentCheckout?.id,
          orderIds: result.orders?.map((order: any) => order.id) ?? [result.order.id],
          buyerId: userId,
          source: 'kwikseller_checkout',
        },
      });

      const payment = await db.payment.update({
        where: { id: result.payment.id },
        data: {
          authorizationUrl: initialized.authorizationUrl,
          gatewayResponse: JSON.stringify({
            initialize: initialized.raw,
            accessCode: initialized.accessCode,
          }),
        },
      });

      return {
        ...result,
        payment,
        authorizationUrl: initialized.authorizationUrl,
        requiresShipping:
          result.requiresShipping ??
          this.withCartTotals({ items: result.orders?.flatMap((order: any) => order.items) ?? result.order.items })
            .requiresShipping,
      };
    } catch (error) {
      await this.failPaymentInitialization(result.reference, error);
      throw error;
    }
  }

  async createPaymentIntent(user: AuthContext, dto: CreatePaymentIntentDto) {
    const userId = this.getUserId(user);
    const db = this.db();
    const buyerEmail = await this.resolveBuyerEmail(userId, user);
    const order = await db.order?.findFirst({
      where: { id: dto.orderId, buyerId: userId },
      include: { payment: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const reference = order.checkoutReference ?? this.checkoutReference();
    let payment = order.payment;
    if (!payment) {
      payment = await db.payment?.create({
        data: {
          orderId: order.id,
          entityType: 'ORDER',
          entityId: order.id,
          amount: order.totalAmount,
          gateway: 'PAYSTACK',
          status: 'PENDING',
          reference,
        },
      });
    }

    if (!payment.authorizationUrl) {
      const initialized = await this.paystack.initializeTransaction({
        email: buyerEmail,
        amount: order.totalAmount,
        reference,
        callbackUrl: dto.callbackUrl ?? this.defaultPaymentCallbackUrl(reference),
        metadata: {
          orderId: order.id,
          buyerId: userId,
          source: 'kwikseller_payment_intent',
        },
      });

      payment = await db.payment?.update({
        where: { id: payment.id },
        data: {
          authorizationUrl: initialized.authorizationUrl,
          gatewayResponse: JSON.stringify({
            initialize: initialized.raw,
            accessCode: initialized.accessCode,
          }),
        },
      });
    }

    return { payment, reference, authorizationUrl: payment.authorizationUrl };
  }

  async verifyPayment(reference: string) {
    const db = this.db();
    const payment = await db.payment?.findUnique({
      where: { reference },
      include: {
        order: { include: { items: true } },
        parentCheckout: { include: { orders: { include: { items: true, store: true } } } },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment reference not found');
    }

    if (payment.status === 'PENDING') {
      const verification = await this.paystack.verifyTransaction(reference);
      const gatewayStatus = verification?.data?.status;

      if (gatewayStatus === 'success') {
        return this.processSuccessfulPayment(reference, {
          source: 'payment.verify',
          payload: verification.data,
        });
      }

      if (['failed', 'abandoned'].includes(gatewayStatus)) {
        await this.failPaymentReference(reference, verification.data);
      }
    }

    const refreshed = await db.payment?.findUnique({
      where: { reference },
      include: {
        order: { include: { items: true, fulfillments: true } },
        parentCheckout: {
          include: { orders: { include: { items: true, fulfillments: true, store: true } } },
        },
      },
    });

    return {
      reference,
      status: refreshed?.status ?? payment.status,
      order: refreshed?.order ?? payment.order,
      parentCheckout: refreshed?.parentCheckout ?? payment.parentCheckout,
      orders: refreshed?.parentCheckout?.orders ?? (refreshed?.order ? [refreshed.order] : undefined),
      verifiedAt: refreshed?.verifiedAt ?? payment.verifiedAt,
    };
  }

  async handlePaystackWebhook(signature: string | undefined, body: unknown) {
    const secret = this.config.get<string>('payment.paystackSecret');
    if (!secret) {
      throw new ForbiddenException('Paystack secret is not configured');
    }

    const payload = JSON.stringify(body);
    const expected = createHmac('sha512', secret).update(payload).digest('hex');
    if (!signature || !this.safeEqual(signature, expected)) {
      throw new ForbiddenException('Invalid Paystack signature');
    }

    const event = body as any;
    if (event.event !== 'charge.success') {
      return { received: true, ignored: true };
    }

    const reference = event.data?.reference;
    if (!reference) {
      throw new BadRequestException('Webhook reference is missing');
    }

    const idempotencyKey = this.paystackWebhookIdempotencyKey(event);
    const webhookEvent = await this.recordWebhookEvent(idempotencyKey, event.event, reference, event);
    if (webhookEvent.idempotent) {
      return { received: true, reference, idempotent: true };
    }

    try {
      const result = await this.processSuccessfulPayment(reference, {
        source: 'payment.webhook.paystack.charge_success',
        payload: event.data ?? {},
      });
      await this.markWebhookEventProcessed(webhookEvent.id);
      return { received: true, reference, idempotent: result.idempotent };
    } catch (error) {
      await this.markWebhookEventFailed(webhookEvent.id, error);
      throw error;
    }
  }

  async listOrders(user: AuthContext) {
    const userId = this.getUserId(user);
    return this.db().order?.findMany({
      where: { buyerId: userId },
      include: {
        items: { include: { product: true, variant: true } },
        payment: true,
        fulfillments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrder(user: AuthContext, orderId: string) {
    const userId = this.getUserId(user);
    const order = await this.db().order?.findFirst({
      where: { id: orderId, buyerId: userId },
      include: {
        items: { include: { product: true, variant: true } },
        payment: true,
        fulfillments: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async getVendorDashboard(user: AuthContext) {
    const storeId = await this.resolveStoreId(user);
    const db = this.db();
    const [orders, products, alerts, poolOffers] = await Promise.all([
      db.order?.findMany({
        where: { items: { some: { product: { storeId } } } },
        include: { items: true, payment: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      db.product?.count({ where: { storeId } }),
      db.inventoryItem?.findMany({
        where: { product: { storeId }, available: { lte: 5 } },
        take: 10,
      }),
      db.vendorPoolOffer?.findMany({
        where: { storeId },
        include: { poolProduct: true },
        take: 10,
      }),
    ]);

    const revenue = (orders ?? [])
      .filter((order: any) => ['PAID', 'PROCESSING', 'FULFILLED', 'DELIVERED'].includes(order.status))
      .reduce((sum: number, order: any) => sum + Number(order.totalAmount ?? 0), 0);

    return {
      revenue,
      ordersCount: orders?.length ?? 0,
      productsCount: products ?? 0,
      inventoryAlerts: alerts ?? [],
      fulfillmentTasks: (orders ?? []).filter((order: any) => order.status === 'PAID'),
      poolEarnings: (poolOffers ?? []).reduce(
        (sum: number, offer: any) => sum + Number(offer.markup ?? 0),
        0,
      ),
      recentOrders: orders ?? [],
      poolOffers: poolOffers ?? [],
    };
  }

  async listVendorProducts(user: AuthContext) {
    const storeId = await this.resolveStoreId(user);
    return this.db().product?.findMany({
      where: { storeId },
      include: { variants: true, inventoryItems: true, digitalAssets: true, images: true, category: true, brand: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPublicStore(slug: string) {
    const store = await this.db().store?.findUnique({
      where: { slug },
      include: {
        storefrontDesign: true,
        products: {
          where: { status: 'ACTIVE' },
          include: { images: true, inventoryItems: true, digitalAssets: true, category: true },
          orderBy: { updatedAt: 'desc' },
          take: 8,
        },
        poolOffers: {
          where: { isActive: true, status: 'ACTIVE' },
          include: { poolProduct: true, product: { include: { images: true, inventoryItems: true } } },
          orderBy: { updatedAt: 'desc' },
          take: 6,
        },
      },
    });

    if (!store) {
      throw new NotFoundException('Vendor store not found');
    }

    return {
      ...store,
      storefrontDesign: this.normalizeStorefrontDesign(store.storefrontDesign),
    };
  }

  async listPublicStoreProducts(
    slug: string,
    options: { limit?: number; search?: string; category?: string; source?: string } = {},
  ) {
    const store = await this.db().store?.findUnique({ where: { slug }, select: { id: true, slug: true, name: true } });
    if (!store) {
      throw new NotFoundException('Vendor store not found');
    }

    const take = Math.min(Math.max(Number(options.limit) || 100, 1), 500);
    const search = options.search?.trim();
    const category = options.category?.trim();
    const source = options.source?.trim();
    const where: Record<string, unknown> = { storeId: store.id, status: 'ACTIVE' };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { category: { name: { contains: search } } },
      ];
    }

    if (category && category !== 'all') {
      where.category = { name: category };
    }

    if (source && source !== 'all') {
      if (source === 'DIGITAL') {
        where.productType = 'DIGITAL';
      } else {
        where.productSource = source;
      }
    }

    return this.db().product?.findMany({
      where,
      include: {
        store: true,
        images: true,
        variants: true,
        inventoryItems: true,
        digitalAssets: true,
        category: true,
        vendorPoolOffers: { where: { isActive: true, status: 'ACTIVE' }, include: { poolProduct: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take,
    });
  }

  async getPublicStoreProduct(slug: string, productSlug: string) {
    const product = await this.db().product?.findFirst({
      where: {
        slug: productSlug,
        status: 'ACTIVE',
        store: { slug },
      },
      include: {
        store: { include: { storefrontDesign: true } },
        images: true,
        variants: true,
        inventoryItems: true,
        digitalAssets: true,
        category: true,
        vendorPoolOffers: { where: { isActive: true, status: 'ACTIVE' }, include: { poolProduct: true } },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found for this vendor store');
    }

    return {
      ...product,
      store: product.store
        ? {
            ...product.store,
            storefrontDesign: this.normalizeStorefrontDesign(product.store.storefrontDesign),
          }
        : product.store,
    };
  }

  async getVendorStorefrontDesign(user: AuthContext) {
    const storeId = await this.resolveStoreId(user);
    const design = await this.db().storefrontDesign?.findUnique({ where: { storeId } });
    return this.normalizeStorefrontDesign(design);
  }

  async updateVendorStorefrontDesign(user: AuthContext, dto: UpdateStorefrontDesignDto) {
    const storeId = await this.resolveStoreId(user);
    const safeSections = dto.sections?.filter((section) =>
      ['hero', 'products', 'pool', 'policies', 'trust'].includes(section),
    );
    const data = {
      themePreset: this.assertTemplateKey('themePreset', dto.themePreset),
      navbarTemplate: this.assertTemplateKey('navbarTemplate', dto.navbarTemplate),
      bottomNavTemplate: this.assertTemplateKey('bottomNavTemplate', dto.bottomNavTemplate),
      layoutTemplate: this.assertTemplateKey('layoutTemplate', dto.layoutTemplate),
      cartTemplate: this.assertTemplateKey('cartTemplate', dto.cartTemplate),
      typographyPreset: this.assertTemplateKey('typographyPreset', dto.typographyPreset),
      primaryColor: this.assertHexColor('primaryColor', dto.primaryColor),
      accentColor: this.assertHexColor('accentColor', dto.accentColor),
      fontPairing: this.assertTemplateKey('fontPairing', dto.fontPairing),
      headingFont: this.assertFontKey('headingFont', dto.headingFont),
      bodyFont: this.assertFontKey('bodyFont', dto.bodyFont),
      heroLayout: this.assertTemplateKey('heroLayout', dto.heroLayout),
      productCardStyle: this.assertTemplateKey('productCardStyle', dto.productCardStyle),
      heroTitle: dto.heroTitle,
      heroSubtitle: dto.heroSubtitle,
      sections: safeSections ? JSON.stringify(safeSections) : undefined,
    };

    const design = await this.db().storefrontDesign?.upsert({
      where: { storeId },
      create: { storeId, ...data },
      update: data,
    });

    await this.writeAudit(this.db(), {
      userId: this.getUserId(user),
      action: 'storefront_design.updated',
      entity: 'Store',
      entityId: storeId,
      changes: this.normalizeStorefrontDesign(design),
    });

    return this.normalizeStorefrontDesign(design);
  }

  async createVendorProduct(user: AuthContext, dto: CreateVendorProductDto) {
    const storeId = await this.resolveStoreId(user);
    const isPhysical = dto.productType === 'PHYSICAL';
    const inventoryPolicy = dto.inventoryPolicy ?? (isPhysical ? 'TRACKED' : 'UNLIMITED');
    const trackInventory = dto.trackInventory ?? inventoryPolicy === 'TRACKED';
    const initialStock = isPhysical && trackInventory ? Number(dto.initialStock ?? 0) : 0;
    const images = dto.images?.filter(Boolean) ?? [];
    const poolEnabled = Boolean(dto.poolEnabled) && dto.productSource !== 'POOL_RESALE';
    const poolBasePrice = poolEnabled ? Number(dto.poolBasePrice ?? dto.price) : undefined;
    const poolMinSalePrice = poolEnabled ? Number(dto.poolMinSalePrice ?? poolBasePrice ?? dto.price) : undefined;
    if (poolEnabled) {
      if (!isPhysical || !trackInventory || !dto.requiresShipping && dto.requiresShipping !== undefined) {
        throw new BadRequestException('Only tracked physical products can be made available in Pool');
      }
      if (Number(poolBasePrice ?? 0) <= 0) {
        throw new BadRequestException('Pool base price must be greater than zero');
      }
      if (Number(poolMinSalePrice ?? 0) < Number(poolBasePrice ?? 0)) {
        throw new BadRequestException('Pool minimum sale price cannot be lower than the base price');
      }
    }
    if (dto.status === 'ACTIVE') {
      this.assertProductCanPublish({
        ...dto,
        images,
        inventoryPolicy,
        trackInventory,
        stock: initialStock,
      });
    }

    const product = await this.db().product?.create({
      data: {
        name: dto.name,
        slug: `${this.slugify(dto.name)}-${randomUUID().slice(0, 6)}`,
        description: dto.description ?? '',
        price: dto.price,
        comparePrice: dto.comparePrice,
        sku: dto.sku,
        categoryId: dto.categoryId,
        brandId: dto.brandId,
        storeId,
        productType: dto.productType,
        productSource: dto.productSource ?? 'VENDOR_STOCK',
        inventoryPolicy,
        requiresShipping: dto.requiresShipping ?? isPhysical,
        trackInventory,
        stock: initialStock,
        lowStock: dto.lowStock ?? 5,
        status: dto.status ?? 'DRAFT',
        poolEnabled,
        poolBasePrice,
        poolMinSalePrice,
        poolMaxSelectableQuantity: poolEnabled ? dto.poolMaxSelectableQuantity : undefined,
        images: images.length
          ? {
              create: images.map((url, index) => ({
                url,
                alt: dto.name,
                position: index,
                isMain: index === 0,
              })),
            }
          : undefined,
        inventoryItems:
          !trackInventory
            ? undefined
            : {
                create: {
                  storeId,
                  sku: dto.sku,
                  available: initialStock,
                  reserved: 0,
                  lowStockThreshold: dto.lowStock ?? 5,
                  policy: inventoryPolicy,
                },
              },
      },
      include: { inventoryItems: true, digitalAssets: true, images: true, category: true, brand: true },
    });

    return product;
  }

  async updateVendorProduct(user: AuthContext, productId: string, dto: UpdateVendorProductDto) {
    const storeId = await this.resolveStoreId(user);
    await this.assertVendorProductOwnership(storeId, productId);
    const product = await this.db().product?.findFirst({
      where: { id: productId, storeId },
      include: { images: true, inventoryItems: true },
    });
    const next = { ...product, ...dto, images: dto.images ?? product?.images?.map((image: any) => image.url) ?? [] };
    const nextPoolEnabled = dto.poolEnabled ?? product?.poolEnabled ?? false;
    const nextProductType = dto.productType ?? product?.productType;
    const nextTrackInventory = dto.trackInventory ?? product?.trackInventory;
    const nextRequiresShipping = dto.requiresShipping ?? product?.requiresShipping;
    const nextPoolBasePrice = dto.poolBasePrice ?? product?.poolBasePrice ?? dto.price ?? product?.price;
    const nextPoolMinSalePrice = dto.poolMinSalePrice ?? product?.poolMinSalePrice ?? nextPoolBasePrice;
    if (nextPoolEnabled) {
      if (product?.productSource === 'POOL_RESALE') {
        throw new BadRequestException('Pool-sourced products cannot be offered back into Pool');
      }
      if (nextProductType !== 'PHYSICAL' || nextTrackInventory === false || nextRequiresShipping === false) {
        throw new BadRequestException('Only tracked physical products can be made available in Pool');
      }
      if (Number(nextPoolBasePrice ?? 0) <= 0) {
        throw new BadRequestException('Pool base price must be greater than zero');
      }
      if (Number(nextPoolMinSalePrice ?? 0) < Number(nextPoolBasePrice ?? 0)) {
        throw new BadRequestException('Pool minimum sale price cannot be lower than the base price');
      }
    }
    if (dto.status === 'ACTIVE') {
      this.assertProductCanPublish({
        ...next,
        stock: product?.inventoryItems?.[0]?.available ?? product?.stock ?? 0,
      });
    }

    return this.db().$transaction(async (tx: any) => {
      if (dto.images) {
        await tx.productImage.deleteMany({ where: { productId } });
        if (dto.images.length) {
          await tx.productImage.createMany({
            data: dto.images.map((url, index) => ({
              productId,
              url,
              alt: dto.name ?? product?.name,
              position: index,
              isMain: index === 0,
            })),
          });
        }
      }

      const { images: _images, ...data } = dto;
      return tx.product.update({
      where: { id: productId },
        data: {
          ...data,
          poolBasePrice: nextPoolEnabled ? nextPoolBasePrice : null,
          poolMinSalePrice: nextPoolEnabled ? nextPoolMinSalePrice : null,
          poolMaxSelectableQuantity: nextPoolEnabled
            ? dto.poolMaxSelectableQuantity ?? product?.poolMaxSelectableQuantity ?? null
            : null,
        },
        include: { inventoryItems: true, digitalAssets: true, images: true, category: true, brand: true },
      });
    });
  }

  async getVendorDeliverySettings(user: AuthContext) {
    const storeId = await this.resolveStoreId(user);
    return this.db().storeDeliverySetting?.upsert({
      where: { storeId },
      create: {
        storeId,
        manualDeliveryEnabled: true,
        kwiksellerDeliveryEnabled: false,
        processingDays: 1,
      },
      update: {},
      include: { areas: true },
    });
  }

  async updateVendorDeliverySettings(user: AuthContext, dto: UpdateDeliverySettingsDto) {
    const storeId = await this.resolveStoreId(user);
    return this.db().storeDeliverySetting?.upsert({
      where: { storeId },
      create: {
        storeId,
        manualDeliveryEnabled: dto.manualDeliveryEnabled ?? true,
        kwiksellerDeliveryEnabled: false,
        processingDays: dto.processingDays ?? 1,
        dispatchNote: dto.dispatchNote,
        returnPolicy: dto.returnPolicy,
      },
      update: {
        manualDeliveryEnabled: dto.manualDeliveryEnabled,
        kwiksellerDeliveryEnabled: false,
        processingDays: dto.processingDays,
        dispatchNote: dto.dispatchNote,
        returnPolicy: dto.returnPolicy,
      },
      include: { areas: true },
    });
  }

  async adjustInventory(user: AuthContext, dto: InventoryAdjustmentDto) {
    const storeId = await this.resolveStoreId(user);
    await this.assertVendorProductOwnership(storeId, dto.productId);
    const db = this.db();
    const inventory = await db.inventoryItem?.findFirst({
      where: {
        productId: dto.productId,
        variantId: dto.variantId ?? null,
        storeId,
      },
    });

    if (!inventory) {
      return db.inventoryItem?.create({
        data: {
          productId: dto.productId,
          variantId: dto.variantId,
          storeId,
          available: dto.quantityDelta,
          reserved: 0,
          lowStockThreshold: 5,
        },
      });
    }

    return db.inventoryItem?.update({
      where: { id: inventory.id },
      data: {
        available: inventory.available + dto.quantityDelta,
      },
    });
  }

  async addDigitalAsset(user: AuthContext, dto: DigitalAssetDto) {
    const storeId = await this.resolveStoreId(user);
    await this.assertVendorProductOwnership(storeId, dto.productId);
    return this.db().digitalAsset?.create({
      data: {
        productId: dto.productId,
        variantId: dto.variantId,
        name: dto.name,
        deliveryType: dto.deliveryType,
        fileUrl: dto.fileUrl,
        licenseKey: dto.licenseKey,
      },
    });
  }

  async listVendorOrders(user: AuthContext) {
    const storeId = await this.resolveStoreId(user);
    return this.db().order?.findMany({
      where: { storeId },
      include: {
        items: { include: { product: true, variant: true } },
        payment: true,
        parentCheckout: { include: { payment: true } },
        fulfillments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateVendorOrderStatus(user: AuthContext, orderId: string, dto: UpdateOrderStatusDto) {
    const storeId = await this.resolveStoreId(user);
    const order = await this.db().order?.findFirst({
      where: { id: orderId, storeId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.transitionOrderStatus(this.db(), orderId, dto.status, {
      userId: this.getUserId(user),
      note: dto.note,
      scope: 'vendor',
    });
  }

  async listPoolCatalog(user: AuthContext, options: { categoryId?: string; vendorId?: string; search?: string } = {}) {
    const storeId = await this.resolveStoreId(user);
    const db = this.db();
    const search = options.search?.trim();
    const ownOffers = await db.vendorPoolOffer?.findMany({
      where: { storeId, isActive: true },
      select: { id: true, poolProductId: true, sourceProductId: true, productId: true, sourceType: true },
    });
    const selectedAdminIds = new Map<string, any>(
      (ownOffers ?? [])
        .filter((offer: any) => offer.poolProductId)
        .map((offer: any) => [offer.poolProductId, offer]),
    );
    const selectedVendorIds = new Map<string, any>(
      (ownOffers ?? [])
        .filter((offer: any) => offer.sourceProductId)
        .map((offer: any) => [offer.sourceProductId, offer]),
    );

    const adminItems = await db.poolProduct?.findMany({
      where: {
        status: 'ACTIVE',
        isActive: true,
        ...(options.categoryId ? { categoryId: options.categoryId } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { category: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: { inventoryItems: true, campaigns: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const vendorItems = await db.product?.findMany({
      where: {
        poolEnabled: true,
        status: 'ACTIVE',
        productSource: 'VENDOR_STOCK',
        storeId: { not: storeId },
        requiresShipping: true,
        ...(options.categoryId ? { categoryId: options.categoryId } : {}),
        ...(options.vendorId ? { storeId: options.vendorId } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { store: { name: { contains: search, mode: 'insensitive' } } },
                { category: { name: { contains: search, mode: 'insensitive' } } },
              ],
            }
          : {}),
        store: {
          deliverySetting: {
            is: {
              manualDeliveryEnabled: true,
              areas: { some: { isActive: true } },
            },
          },
        },
      },
      include: { store: true, images: true, inventoryItems: true, category: true },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });

    const adminCatalog = (adminItems ?? []).map((item: any) => {
      const linked = selectedAdminIds.get(item.id);
      return {
        ...item,
        images: this.parseImageList(item.images),
        sourceType: 'ADMIN_POOL',
        sourceProductId: item.id,
        sourceBasePrice: Number(item.wholesalePrice ?? 0),
        sourceStoreName: 'Kwikseller',
        alreadySelected: Boolean(linked),
        linkedOfferId: linked?.id,
        linkedProductId: linked?.productId,
      };
    });

    const vendorCatalog = (vendorItems ?? []).map((product: any) => {
      const linked = selectedVendorIds.get(product.id);
      const basePrice = Number(product.poolBasePrice ?? product.price ?? 0);
      return {
        id: product.id,
        name: product.name,
        description: product.description,
        wholesalePrice: basePrice,
        suggestedRetailPrice: Number(product.poolMinSalePrice ?? product.comparePrice ?? product.price ?? basePrice),
        productType: product.productType,
        status: 'ACTIVE',
        categoryId: product.categoryId,
        category: product.category?.name,
        stock: product.poolMaxSelectableQuantity ?? product.inventoryItems?.[0]?.available ?? product.stock ?? 0,
        supplierId: product.storeId,
        images: (product.images ?? []).map((image: any) => image.url),
        isActive: true,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        inventoryItems: product.inventoryItems,
        sourceType: 'VENDOR_PRODUCT',
        sourceProductId: product.id,
        sourceStoreId: product.storeId,
        sourceStoreName: product.store?.name,
        sourceStoreSlug: product.store?.slug,
        sourceBasePrice: basePrice,
        alreadySelected: Boolean(linked),
        linkedOfferId: linked?.id,
        linkedProductId: linked?.productId,
      };
    });

    return [...adminCatalog, ...vendorCatalog];
  }

  async listAdminPoolProducts(user: AuthContext) {
    this.assertRole(user, ['ADMIN', 'SUPER_ADMIN']);
    return this.db().poolProduct?.findMany({
      include: { inventoryItems: true, vendorOffers: true, campaigns: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listAdminPoolCampaigns(user: AuthContext) {
    this.assertRole(user, ['ADMIN', 'SUPER_ADMIN']);
    return this.db().poolCampaign?.findMany({
      include: { poolProduct: true },
      orderBy: { startsAt: 'asc' },
    });
  }

  async listPublicPoolOffers() {
    return this.db().vendorPoolOffer?.findMany({
      where: { status: 'ACTIVE', isActive: true },
      include: { poolProduct: true, store: true, product: true, sourceProduct: true, sourceStore: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async listPoolCampaigns() {
    return this.db().poolCampaign?.findMany({
      where: { status: { in: ['SCHEDULED', 'ACTIVE'] } },
      include: { poolProduct: true },
      orderBy: { startsAt: 'asc' },
    });
  }

  async createPoolOffer(user: AuthContext, dto: CreatePoolOfferDto) {
    const storeId = await this.resolveStoreId(user);
    const userId = this.getUserId(user);
    const sourceType = dto.sourceType ?? (dto.sourceProductId ? 'VENDOR_PRODUCT' : 'ADMIN_POOL');
    return this.db().$transaction(async (tx: any) => {
      const selectionCount = await tx.vendorPoolOffer.count({
        where: { storeId, isActive: true, status: { in: ['ACTIVE', 'DRAFT'] } },
      });
      const subscription = await tx.subscription.findUnique({ where: { vendorId: userId } }).catch(() => null);

      let source: any;
      let duplicate: any;
      let sourceBasePrice = 0;
      let minSalePrice = 0;
      let sourceStoreId: string | null = null;
      let sourceProductId: string | null = null;
      let poolProductId: string | null = null;
      let images: string[] = [];

      if (sourceType === 'VENDOR_PRODUCT') {
        if (!dto.sourceProductId) {
          throw new BadRequestException('Source product is required');
        }
        source = await tx.product.findUnique({
          where: { id: dto.sourceProductId },
          include: { store: { include: { deliverySetting: { include: { areas: true } } } }, images: true, inventoryItems: true },
        });
        if (!source || source.storeId === storeId || !source.poolEnabled || source.status !== 'ACTIVE') {
          throw new BadRequestException('This product is not available in the Pool catalog');
        }
        if (!source.requiresShipping || !source.store?.deliverySetting?.manualDeliveryEnabled) {
          throw new BadRequestException('This product does not have source-vendor delivery configured');
        }
        sourceBasePrice = Number(source.poolBasePrice ?? source.price ?? 0);
        minSalePrice = Number(source.poolMinSalePrice ?? sourceBasePrice);
        sourceStoreId = source.storeId;
        sourceProductId = source.id;
        images = (source.images ?? []).map((image: any) => image.url).filter(Boolean);
        duplicate = await tx.vendorPoolOffer.findFirst({
          where: { storeId, sourceType: 'VENDOR_PRODUCT', sourceProductId: source.id },
          include: { product: true },
        });
      } else {
        if (!dto.poolProductId) {
          throw new BadRequestException('Pool product is required');
        }
        source = await tx.poolProduct.findUnique({
          where: { id: dto.poolProductId },
        });
        if (!source || source.status !== 'ACTIVE' || !source.isActive) {
          throw new BadRequestException('Pool product is not available');
        }
        sourceBasePrice = Number(source.wholesalePrice ?? 0);
        minSalePrice = Number(source.wholesalePrice ?? 0);
        poolProductId = source.id;
        sourceProductId = null;
        images = this.parseImageList(source.images);
        duplicate = await tx.vendorPoolOffer.findFirst({
          where: { storeId, sourceType: 'ADMIN_POOL', poolProductId: source.id },
          include: { product: true },
        });
      }

      if (Number(dto.retailPrice ?? 0) < Math.max(sourceBasePrice, minSalePrice)) {
        throw new BadRequestException('Your sale price cannot be lower than the source price');
      }
      if (!duplicate && (subscription?.plan ?? 'STARTER') === 'STARTER' && selectionCount >= STARTER_POOL_SELECTION_LIMIT) {
        throw new BadRequestException('Starter vendors can select up to 50 Pool-sourced products');
      }

      const markup = dto.markup ?? Math.max(0, Number(dto.retailPrice) - sourceBasePrice);
      const productData = {
        storeId,
        poolProductId,
        name: source.name,
        slug: `${this.slugify(source.name)}-${randomUUID().slice(0, 6)}`,
        description: source.description,
        price: dto.retailPrice,
        comparePrice: source.suggestedRetailPrice ?? source.comparePrice ?? undefined,
        productType: source.productType,
        productSource: 'POOL_RESALE',
        inventoryPolicy: source.productType === 'PHYSICAL' ? 'TRACKED' : 'UNLIMITED',
        requiresShipping: source.productType === 'PHYSICAL',
        trackInventory: source.productType === 'PHYSICAL',
        categoryId: source.categoryId,
        isPoolProduct: true,
        poolSourceStoreId: sourceStoreId,
        poolSourceProductId: sourceProductId,
        poolSourceBasePrice: sourceBasePrice,
        poolMargin: markup,
        status: 'ACTIVE',
      };

      const product = duplicate?.productId
        ? await tx.product.update({
            where: { id: duplicate.productId },
            data: {
              price: dto.retailPrice,
              comparePrice: productData.comparePrice,
              poolSourceBasePrice: sourceBasePrice,
              poolMargin: markup,
            },
          })
        : await tx.product.create({
            data: {
              ...productData,
              images: images.length
                ? {
                    create: images.slice(0, 5).map((url, index) => ({
                      url,
                      alt: source.name,
                      position: index,
                      isMain: index === 0,
                    })),
                  }
                : undefined,
            },
          });

      const offer = duplicate
        ? await tx.vendorPoolOffer.update({
            where: { id: duplicate.id },
            data: {
              productId: product.id,
              retailPrice: dto.retailPrice,
              markup,
              sourceBasePrice,
              status: 'ACTIVE',
              isActive: true,
            },
            include: { poolProduct: true, product: true, sourceProduct: true, sourceStore: true },
          })
        : await tx.vendorPoolOffer.create({
            data: {
              storeId,
              poolProductId,
              sourceType,
              sourceStoreId,
              sourceProductId,
              sourceBasePrice,
              productId: product.id,
              retailPrice: dto.retailPrice,
              markup,
              status: 'ACTIVE',
              isActive: true,
            },
            include: { poolProduct: true, product: true, sourceProduct: true, sourceStore: true },
          });

      await this.writeAudit(tx, {
        userId,
        action: 'pool.offer.created',
        entity: 'VendorPoolOffer',
        entityId: offer.id,
        changes: { sourceType, poolProductId, sourceProductId, retailPrice: dto.retailPrice },
      });

      return offer;
    });
  }

  async updatePoolOffer(user: AuthContext, offerId: string, dto: UpdatePoolOfferDto) {
    const storeId = await this.resolveStoreId(user);
    const offer = await this.db().vendorPoolOffer?.findFirst({
      where: { id: offerId, storeId },
      include: { product: true },
    });

    if (!offer) {
      throw new NotFoundException('Pool offer not found');
    }

    if (dto.retailPrice !== undefined && Number(dto.retailPrice) < Number(offer.sourceBasePrice ?? 0)) {
      throw new BadRequestException('Your sale price cannot be lower than the source price');
    }

    return this.db().$transaction(async (tx: any) => {
      if (dto.retailPrice !== undefined && offer.productId) {
        await tx.product.update({
          where: { id: offer.productId },
          data: {
            price: dto.retailPrice,
            poolMargin: Math.max(0, Number(dto.retailPrice) - Number(offer.sourceBasePrice ?? 0)),
          },
        });
      }
      return tx.vendorPoolOffer.update({
      where: { id: offerId },
        data: {
          ...dto,
          markup: dto.retailPrice !== undefined
            ? Math.max(0, Number(dto.retailPrice) - Number(offer.sourceBasePrice ?? 0))
            : dto.markup,
        },
        include: { poolProduct: true, product: true, sourceProduct: true, sourceStore: true },
      });
    });
  }

  async deletePoolOffer(user: AuthContext, offerId: string) {
    const storeId = await this.resolveStoreId(user);
    const offer = await this.db().vendorPoolOffer?.findFirst({ where: { id: offerId, storeId } });
    if (!offer) {
      throw new NotFoundException('Pool selection not found');
    }
    return this.db().$transaction(async (tx: any) => {
      await tx.vendorPoolOffer.update({
        where: { id: offerId },
        data: { isActive: false, status: 'PAUSED' },
      });
      if (offer.productId) {
        await tx.product.update({
          where: { id: offer.productId },
          data: { status: 'ARCHIVED' },
        }).catch(() => undefined);
      }
      return { success: true };
    });
  }

  async getAdminCommerceOverview(user: AuthContext) {
    this.assertRole(user, ['ADMIN', 'SUPER_ADMIN']);
    const db = this.db();
    const [orders, payments, lowStock, pendingFulfillment, poolProducts, failedWebhookEvents] = await Promise.all([
      db.order?.count(),
      db.payment?.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
      db.inventoryItem?.findMany({
        where: { available: { lte: 5 } },
        include: { product: true },
        take: 20,
      }),
      db.order?.findMany({
        where: { status: { in: ['PAID', 'PROCESSING'] } },
        include: { items: true },
        take: 20,
      }),
      db.poolProduct?.count(),
      (db as any).paymentWebhookEvent?.count({ where: { status: 'FAILED' } }).catch(() => 0),
    ]);

    return {
      ordersCount: orders ?? 0,
      poolProductsCount: poolProducts ?? 0,
      recentPayments: payments ?? [],
      riskFlags: {
        lowStock: lowStock ?? [],
        pendingFulfillment: pendingFulfillment ?? [],
        failedPaymentWebhooks: failedWebhookEvents ?? 0,
        suspiciousActivity: [],
      },
    };
  }

  async listAdminPayments(user: AuthContext) {
    this.assertRole(user, ['ADMIN', 'SUPER_ADMIN']);
    return this.db().payment?.findMany({
      include: {
        order: { include: { store: true, items: true } },
        parentCheckout: { include: { orders: { include: { store: true, items: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async refundPayment(user: AuthContext, dto: RefundPaymentDto) {
    this.assertRole(user, ['ADMIN', 'SUPER_ADMIN']);
    return this.db().$transaction(async (tx: any) => {
      const payment = await tx.payment.findUnique({
        where: { id: dto.paymentId },
        include: {
          order: { include: { items: { include: { reservations: true } }, fulfillments: true } },
          parentCheckout: {
            include: {
              orders: {
                include: { items: { include: { reservations: true } }, fulfillments: true },
              },
            },
          },
        },
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      if (payment.status !== 'PAID') {
        throw new BadRequestException('Only paid payments can be refunded');
      }

      if (dto.amount !== undefined && dto.amount > Number(payment.amount ?? 0)) {
        throw new BadRequestException('Refund amount cannot exceed the payment amount');
      }

      const childOrders = payment.parentCheckout?.orders ?? (payment.order ? [payment.order] : []);
      const targetOrders = dto.orderId ? childOrders.filter((order: any) => order.id === dto.orderId) : childOrders;
      if (!targetOrders.length) {
        throw new NotFoundException('Order not found for this payment');
      }

      const updatedPayment = await tx.payment.update({
        where: { id: dto.paymentId },
        data: {
          status: dto.orderId ? payment.status : 'REFUNDED',
          gatewayResponse: JSON.stringify({
            refundReason: dto.reason,
            amount: dto.amount ?? 'FULL',
            orderId: dto.orderId,
            refundedBy: this.getUserId(user),
            refundedAt: new Date().toISOString(),
          }),
        },
      });

      for (const order of targetOrders) {
        await this.transitionOrderStatus(tx, order.id, 'REFUNDED', {
          userId: this.getUserId(user),
          note: dto.reason,
          scope: 'admin.refund',
        });
      }

      if (payment.parentCheckout && !dto.orderId) {
        await tx.parentCheckout.update({
          where: { id: payment.parentCheckout.id },
          data: { status: 'REFUNDED', paymentStatus: 'REFUNDED' },
        });
      }

      await this.writeAudit(tx, {
        userId: this.getUserId(user),
        action: 'payment.refunded',
        entity: 'Payment',
        entityId: payment.id,
        changes: {
          parentCheckoutId: payment.parentCheckout?.id,
          orderIds: targetOrders.map((order: any) => order.id),
          amount: dto.amount ?? 'FULL',
          reason: dto.reason,
        },
      });

      return updatedPayment;
    });
  }

  async listAdminOrders(user: AuthContext, status?: string) {
    this.assertRole(user, ['ADMIN', 'SUPER_ADMIN']);
    return this.db().order?.findMany({
      where: status ? { status } : undefined,
      include: {
        buyer: true,
        store: true,
        address: true,
        delivery: true,
        items: { include: { product: true, variant: true } },
        payment: true,
        parentCheckout: { include: { payment: true } },
        fulfillments: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async listAdminDeliveryRates(
    user: AuthContext,
    filters: { state?: string; isActive?: string } = {},
  ) {
    this.assertRole(user, ['ADMIN', 'SUPER_ADMIN']);
    const where: Record<string, unknown> = {};
    if (filters.state) {
      where.state = { equals: this.normalizeLocationPart(filters.state), mode: 'insensitive' };
    }
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive === 'true';
    }

    return (this.db() as any).deliveryRate?.findMany({
      where,
      orderBy: [{ state: 'asc' }, { localGovernment: 'asc' }],
      take: 500,
    });
  }

  async createDeliveryRate(user: AuthContext, dto: UpsertDeliveryRateDto) {
    this.assertRole(user, ['ADMIN', 'SUPER_ADMIN']);
    const state = this.normalizeLocationPart(dto.state);
    const localGovernment = this.normalizeLocationPart(dto.localGovernment);
    const maxDeliveryDays = Math.max(dto.minDeliveryDays, dto.maxDeliveryDays);

    const rate = await (this.db() as any).deliveryRate?.upsert({
      where: { state_localGovernment: { state, localGovernment } },
      update: {
        fee: dto.fee,
        minDeliveryDays: dto.minDeliveryDays,
        maxDeliveryDays,
        isActive: dto.isActive ?? true,
      },
      create: {
        state,
        localGovernment,
        fee: dto.fee,
        minDeliveryDays: dto.minDeliveryDays,
        maxDeliveryDays,
        isActive: dto.isActive ?? true,
      },
    });

    await this.writeAudit(this.db(), {
      userId: this.getUserId(user),
      action: 'delivery_rate.upserted',
      entity: 'DeliveryRate',
      entityId: rate?.id,
      changes: { state, localGovernment, fee: dto.fee },
    });

    return rate;
  }

  async updateDeliveryRate(user: AuthContext, rateId: string, dto: Partial<UpsertDeliveryRateDto>) {
    this.assertRole(user, ['ADMIN', 'SUPER_ADMIN']);
    const data: Record<string, unknown> = {};
    if (dto.state !== undefined) data.state = this.normalizeLocationPart(dto.state);
    if (dto.localGovernment !== undefined) data.localGovernment = this.normalizeLocationPart(dto.localGovernment);
    if (dto.fee !== undefined) data.fee = dto.fee;
    if (dto.minDeliveryDays !== undefined) data.minDeliveryDays = dto.minDeliveryDays;
    if (dto.maxDeliveryDays !== undefined) data.maxDeliveryDays = dto.maxDeliveryDays;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    const rate = await (this.db() as any).deliveryRate?.update({
      where: { id: rateId },
      data,
    });

    await this.writeAudit(this.db(), {
      userId: this.getUserId(user),
      action: 'delivery_rate.updated',
      entity: 'DeliveryRate',
      entityId: rateId,
      changes: data,
    });

    return rate;
  }

  async deactivateDeliveryRate(user: AuthContext, rateId: string) {
    return this.updateDeliveryRate(user, rateId, { isActive: false });
  }

  async updateManualDelivery(user: AuthContext, dto: ManualDeliveryDto) {
    this.assertRole(user, ['ADMIN', 'SUPER_ADMIN']);
    return this.db().$transaction(async (tx: any) => {
      const order = await this.transitionOrderStatus(tx, dto.orderId, dto.status, {
        userId: this.getUserId(user),
        note: dto.note,
        scope: 'admin.manual_delivery',
      });

      if (dto.trackingCode) {
        await tx.fulfillment.updateMany({
          where: { orderId: dto.orderId, type: 'PHYSICAL_MANUAL' },
          data: {
            trackingNumber: dto.trackingCode,
            status: ['FULFILLED', 'SHIPPED', 'DELIVERED'].includes(dto.status)
              ? 'FULFILLED'
              : 'PROCESSING',
          },
        });
      }

      return order;
    });
  }

  async releaseExpiredReservations(user: AuthContext) {
    this.assertRole(user, ['ADMIN', 'SUPER_ADMIN']);
    const now = new Date();

    return this.db().$transaction(async (tx: any) => {
      const reservations = await tx.inventoryReservation.findMany({
        where: {
          status: 'ACTIVE',
          expiresAt: { lte: now },
        },
        include: {
          orderItem: { include: { order: true } },
        },
        take: 100,
      });

      for (const reservation of reservations) {
        await tx.inventoryItem.update({
          where: { id: reservation.inventoryItemId },
          data: {
            available: { increment: reservation.quantity },
            reserved: { decrement: reservation.quantity },
          },
        });
        await tx.inventoryReservation.update({
          where: { id: reservation.id },
          data: { status: 'EXPIRED' },
        });

        const order = reservation.orderItem?.order;
        if (order && ['PENDING_PAYMENT', 'PENDING'].includes(order.status)) {
          await tx.order.update({
            where: { id: order.id },
            data: {
              status: 'CANCELLED',
              paymentStatus: 'FAILED',
            },
          });
        }
      }

      await this.writeAudit(tx, {
        userId: this.getUserId(user),
        action: 'inventory.reservations.expired_released',
        entity: 'InventoryReservation',
        changes: { count: reservations.length },
      });

      return { released: reservations.length };
    });
  }

  async createPoolProduct(user: AuthContext, dto: CreatePoolProductDto) {
    this.assertRole(user, ['ADMIN', 'SUPER_ADMIN']);
    return this.db().poolProduct?.create({
      data: {
        name: dto.title,
        description: dto.description,
        wholesalePrice: dto.basePrice,
        suggestedRetailPrice: dto.suggestedRetailPrice,
        categoryId: dto.categoryId,
        productType: dto.productType,
        status: 'ACTIVE',
      },
    });
  }

  async updatePoolProduct(user: AuthContext, poolProductId: string, dto: Partial<CreatePoolProductDto>) {
    this.assertRole(user, ['ADMIN', 'SUPER_ADMIN']);
    return this.db().poolProduct?.update({
      where: { id: poolProductId },
      data: dto,
    });
  }

  async createPoolCampaign(user: AuthContext, dto: CreatePoolCampaignDto) {
    this.assertRole(user, ['ADMIN', 'SUPER_ADMIN']);
    return this.db().poolCampaign?.create({
      data: {
        poolProductId: dto.poolProductId,
        title: dto.title,
        targetQuantity: dto.targetQuantity,
        unitPrice: dto.unitPrice,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        status: 'SCHEDULED',
      },
      include: { poolProduct: true },
    });
  }

  private async reserveInventoryForOrderItem(tx: any, orderItem: any, cartItem: any) {
    if (!cartItem?.product) {
      throw new BadRequestException('Cart item product could not be resolved');
    }

    const product = cartItem.product;
    const productType = orderItem.productType ?? product.productType;
    if (productType === 'DIGITAL' || product.trackInventory === false || product.inventoryPolicy === 'UNLIMITED') {
      return;
    }

    const inventoryWhere =
      product.productSource === 'POOL_RESALE' && cartItem.poolOffer?.sourceType === 'VENDOR_PRODUCT' && cartItem.poolOffer?.sourceProductId
        ? { productId: cartItem.poolOffer.sourceProductId, variantId: orderItem.variantId ?? null }
        : product.productSource === 'POOL_RESALE' && product.poolProductId
          ? { poolProductId: product.poolProductId }
          : {
              productId: product.id,
              variantId: orderItem.variantId ?? null,
            };

    const inventory = await tx.inventoryItem.findFirst({
      where: {
        ...inventoryWhere,
        available: { gte: orderItem.quantity },
      },
      orderBy: { updatedAt: 'asc' },
    });

    if (!inventory) {
      throw new BadRequestException(`Insufficient inventory for ${product.name}`);
    }

    await tx.inventoryItem.update({
      where: { id: inventory.id },
      data: {
        available: { decrement: orderItem.quantity },
        reserved: { increment: orderItem.quantity },
      },
    });

    await tx.inventoryReservation.create({
      data: {
        inventoryItemId: inventory.id,
        orderItemId: orderItem.id,
        quantity: orderItem.quantity,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000),
      },
    });
  }

  private async createPoolSettlementForOrderItem(tx: any, order: any, orderItem: any, cartItem: any) {
    if (!cartItem?.poolOfferId || !cartItem?.poolOffer) {
      return;
    }
    const quantity = Number(orderItem.quantity ?? cartItem.quantity ?? 1);
    const saleAmount = Number(orderItem.totalPrice ?? Number(cartItem.price ?? 0) * quantity);
    const sourceBasePrice = Number(cartItem.poolOffer.sourceBasePrice ?? cartItem.product?.poolSourceBasePrice ?? 0);
    const sourceAmount = sourceBasePrice * quantity;
    const resellerMargin = Math.max(0, saleAmount - sourceAmount);
    await tx.poolSettlement?.create({
      data: {
        orderId: order.id,
        orderItemId: orderItem.id,
        buyerStoreId: cartItem.product?.storeId ?? cartItem.poolOffer.storeId,
        sourceStoreId: cartItem.poolOffer.sourceStoreId ?? cartItem.product?.poolSourceStoreId ?? order.storeId,
        sourceProductId: cartItem.poolOffer.sourceProductId ?? cartItem.product?.poolSourceProductId,
        poolOfferId: cartItem.poolOfferId,
        quantity,
        saleAmount,
        sourceAmount,
        resellerMargin,
        platformFeeAmount: 0,
        status: 'HELD',
      },
    }).catch(() => undefined);
  }

  private async processSuccessfulPayment(
    reference: string,
    gateway: { source: string; payload: Record<string, unknown> },
  ) {
    return this.db().$transaction(async (tx: any) => {
      const payment = await tx.payment.findUnique({
        where: { reference },
        include: {
          order: {
            include: {
              items: {
                include: {
                  reservations: { where: { status: 'ACTIVE' }, include: { inventoryItem: true } },
                  product: { include: { digitalAssets: true } },
                },
              },
              fulfillments: true,
            },
          },
          parentCheckout: {
            include: {
              orders: {
                include: {
                  items: {
                    include: {
                      reservations: { where: { status: 'ACTIVE' }, include: { inventoryItem: true } },
                      product: { include: { digitalAssets: true } },
                    },
                  },
                  fulfillments: true,
                },
              },
            },
          },
        },
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      if (payment.status === 'PAID') {
        return { payment, idempotent: true };
      }

      this.assertGatewayAmountMatchesOrder(payment, gateway.payload);

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          gatewayResponse: JSON.stringify(gateway.payload ?? {}),
          paidAt: new Date(),
          verifiedAt: new Date(),
        },
      });

      if (payment.parentCheckout) {
        await tx.parentCheckout.update({
          where: { id: payment.parentCheckout.id },
          data: { status: 'PAID', paymentStatus: 'PAID' },
        });

        for (const order of payment.parentCheckout.orders ?? []) {
          await tx.order.update({
            where: { id: order.id },
            data: { status: 'PAID', paymentStatus: 'PAID' },
          });
          await this.commitReservations(tx, order.items);
          await this.createFulfillmentsForPaidOrder(tx, order);
        }

        if (payment.parentCheckout.couponId) {
          await tx.coupon.update({
            where: { id: payment.parentCheckout.couponId },
            data: { usedCount: { increment: 1 } },
          });
        }

        await this.writeAudit(tx, {
          action: gateway.source,
          entity: 'Payment',
          entityId: payment.id,
          changes: {
            reference,
            parentCheckoutId: payment.parentCheckout.id,
            orderIds: payment.parentCheckout.orders?.map((order: any) => order.id),
            gatewayStatus: gateway.payload?.status,
          },
        });

        return { payment, idempotent: false };
      }

      if (!payment.order) {
        throw new NotFoundException('Payment order not found');
      }

      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          status: 'PAID',
          paymentStatus: 'PAID',
        },
      });

      await this.commitReservations(tx, payment.order.items);
      if (payment.order?.couponId) {
        await tx.coupon.update({
          where: { id: payment.order.couponId },
          data: { usedCount: { increment: 1 } },
        });
      }
      await this.createFulfillmentsForPaidOrder(tx, payment.order);
      await this.writeAudit(tx, {
        action: gateway.source,
        entity: 'Payment',
        entityId: payment.id,
        changes: {
          reference,
          orderId: payment.orderId,
          gatewayStatus: gateway.payload?.status,
        },
      });

      return { payment, idempotent: false };
    });
  }

  private paystackWebhookIdempotencyKey(event: any) {
    const eventId = event?.data?.id ?? event?.id;
    const reference = event?.data?.reference ?? 'unknown-reference';
    const paidAt = event?.data?.paid_at ?? event?.data?.paidAt ?? '';
    return ['PAYSTACK', event?.event ?? 'unknown-event', reference, eventId ?? paidAt].join(':');
  }

  private async recordWebhookEvent(
    idempotencyKey: string,
    eventType: string,
    reference: string,
    payload: unknown,
  ) {
    try {
      const event = await (this.db() as any).paymentWebhookEvent.create({
        data: {
          gateway: 'PAYSTACK',
          eventType,
          idempotencyKey,
          reference,
          status: 'RECEIVED',
          payload: JSON.stringify(payload ?? {}),
        },
      });
      return { id: event.id, idempotent: false };
    } catch (error: any) {
      if (error?.code === 'P2002') {
        const existing = await (this.db() as any).paymentWebhookEvent.findUnique({
          where: { idempotencyKey },
        });
        return { id: existing?.id, idempotent: true };
      }
      throw error;
    }
  }

  private async markWebhookEventProcessed(eventId?: string) {
    if (!eventId) return;
    await (this.db() as any).paymentWebhookEvent
      .update({
        where: { id: eventId },
        data: {
          status: 'PROCESSED',
          processedAt: new Date(),
          error: null,
        },
      })
      .catch(() => undefined);
  }

  private async markWebhookEventFailed(eventId: string | undefined, error: unknown) {
    if (!eventId) return;
    await (this.db() as any).paymentWebhookEvent
      .update({
        where: { id: eventId },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : String(error),
        },
      })
      .catch(() => undefined);
  }

  private assertGatewayAmountMatchesOrder(payment: any, payload: Record<string, unknown>) {
    const gatewayAmount = Number(payload?.amount);
    if (!Number.isFinite(gatewayAmount) || gatewayAmount <= 0) {
      return;
    }

    const expectedKobo = Math.round(Number(payment.amount ?? 0) * 100);
    if (gatewayAmount !== expectedKobo) {
      throw new BadRequestException({
        message: 'Payment amount mismatch',
        errors: [
          {
            code: 'PAYMENT_AMOUNT_MISMATCH',
            message: 'Paystack amount does not match the order total.',
            field: 'payment.amount',
          },
        ],
      });
    }
  }

  private async failPaymentInitialization(reference: string, error: unknown) {
    await this.failPaymentReference(reference, {
      source: 'paystack.initialize',
      error: error instanceof Error ? error.message : String(error),
    });
  }

  private async failPaymentReference(reference: string, gatewayResponse: unknown) {
    await this.db().$transaction(async (tx: any) => {
      const payment = await tx.payment.findUnique({
        where: { reference },
        include: {
          order: {
            include: {
              items: { include: { reservations: true } },
            },
          },
          parentCheckout: {
            include: {
              orders: {
                include: { items: { include: { reservations: true } } },
              },
            },
          },
        },
      });

      if (!payment) {
        return;
      }

      const childOrders = payment.parentCheckout?.orders ?? (payment.order ? [payment.order] : []);
      if (payment.status === 'PAID' || childOrders.some((order: any) => order.paymentStatus === 'PAID')) {
        await this.writeAudit(tx, {
          action: 'payment.failed_ignored_paid_order',
          entity: 'Payment',
          entityId: payment.id,
          changes: { reference, gatewayResponse },
        });
        return;
      }

      for (const order of childOrders) {
        await this.releaseReservations(tx, order.items);
      }
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          verifiedAt: new Date(),
          gatewayResponse: JSON.stringify(gatewayResponse ?? {}),
        },
      });
      if (payment.parentCheckout) {
        await tx.parentCheckout.update({
          where: { id: payment.parentCheckout.id },
          data: { status: 'FAILED', paymentStatus: 'FAILED' },
        });
        await tx.order.updateMany({
          where: { parentCheckoutId: payment.parentCheckout.id },
          data: { status: 'CANCELLED', paymentStatus: 'FAILED' },
        });
      } else if (payment.orderId) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            status: 'CANCELLED',
            paymentStatus: 'FAILED',
          },
        });
      }
      await this.writeAudit(tx, {
        action: 'payment.failed',
        entity: 'Payment',
        entityId: payment.id,
        changes: { reference, gatewayResponse },
      });
    });
  }

  private async commitReservations(tx: any, orderItems: any[]) {
    for (const item of orderItems) {
      for (const reservation of item.reservations ?? []) {
        await tx.inventoryItem.update({
          where: { id: reservation.inventoryItemId },
          data: { reserved: { decrement: reservation.quantity } },
        });
        await tx.inventoryReservation.update({
          where: { id: reservation.id },
          data: { status: 'COMMITTED' },
        });
      }
    }
  }

  private async releaseReservations(tx: any, orderItems: any[]) {
    for (const item of orderItems) {
      for (const reservation of item.reservations ?? []) {
        if (reservation.status !== 'ACTIVE') {
          continue;
        }

        await tx.inventoryItem.update({
          where: { id: reservation.inventoryItemId },
          data: {
            available: { increment: reservation.quantity },
            reserved: { decrement: reservation.quantity },
          },
        });
        await tx.inventoryReservation.update({
          where: { id: reservation.id },
          data: { status: 'RELEASED' },
        });
      }
    }
  }

  private async createFulfillmentsForPaidOrder(tx: any, order: any) {
    const existingByItem = new Set((order.fulfillments ?? []).map((fulfillment: any) => fulfillment.orderItemId));

    for (const item of order.items ?? []) {
      if (existingByItem.has(item.id)) {
        continue;
      }

      if (item.productType === 'DIGITAL') {
        const digitalAsset = item.product?.digitalAssets?.find((asset: any) => asset.isActive);
        if (!digitalAsset) {
          await tx.fulfillment.create({
            data: {
              orderId: order.id,
              orderItemId: item.id,
              type: 'DIGITAL_ACCESS',
              status: 'FAILED',
            },
          });
          continue;
        }

        await tx.fulfillment.create({
          data: {
            orderId: order.id,
            orderItemId: item.id,
            type: 'DIGITAL_ACCESS',
            status: 'READY',
            digitalAssetId: digitalAsset.id,
            accessUrl: digitalAsset.accessUrl ?? digitalAsset.fileUrl,
          },
        });
        await tx.orderItem.update({
          where: { id: item.id },
          data: { fulfillmentStatus: 'READY' },
        });
      } else {
        await tx.fulfillment.create({
          data: {
            orderId: order.id,
            orderItemId: item.id,
            type: 'PHYSICAL_MANUAL',
            status: 'PENDING',
          },
        });
      }
    }
  }

  private async resolveDeliveryQuote(db: any, state?: string, localGovernment?: string, storeId?: string) {
    const normalizedState = this.normalizeLocationPart(state ?? '');
    const normalizedLga = this.normalizeLocationPart(localGovernment ?? '');

    if (!normalizedState || !normalizedLga) {
      throw new BadRequestException({
        message: 'Cart validation failed',
        errors: [
          {
            code: 'DELIVERY_LOCATION_REQUIRED',
            message: 'Select a state and local government before checkout.',
            field: 'shippingAddress',
          },
        ],
      });
    }

    if (storeId) {
      const storeRate = await db.storeDeliveryArea.findFirst({
        where: {
          state: { equals: normalizedState, mode: 'insensitive' },
          localGovernment: { equals: normalizedLga, mode: 'insensitive' },
          isActive: true,
          setting: {
            storeId,
            manualDeliveryEnabled: true,
          },
        },
        include: { setting: true },
      });
      if (storeRate) {
        return { rate: storeRate, ...this.deliveryEstimate(storeRate) };
      }
    }

    const rate = await db.deliveryRate.findFirst({
      where: {
        state: { equals: normalizedState, mode: 'insensitive' },
        localGovernment: { equals: normalizedLga, mode: 'insensitive' },
        isActive: true,
      },
    });

    if (!rate) {
      throw new BadRequestException({
        message: 'Cart validation failed',
        errors: [
          {
            code: 'DELIVERY_RATE_UNAVAILABLE',
            message: 'Delivery is not active for the selected state and local government.',
            field: 'shippingAddress.localGovernment',
          },
        ],
      });
    }

    return { rate, ...this.deliveryEstimate(rate) };
  }

  private async resolveCouponDiscount(db: any, code: string, subtotal: number) {
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) {
      throw new BadRequestException('Coupon code is required');
    }

    const now = new Date();
    const coupon = await db.coupon.findFirst({
      where: {
        code: { equals: normalizedCode, mode: 'insensitive' },
        isActive: true,
      },
    });

    const invalid = (message: string): never => {
      throw new BadRequestException({
        message,
        errors: [{ code: 'COUPON_INVALID', message, field: 'couponCode' }],
      });
    };

    if (!coupon) invalid('Coupon is invalid or inactive.');
    if (coupon.startDate && coupon.startDate > now) invalid('Coupon is not active yet.');
    if (coupon.endDate && coupon.endDate < now) invalid('Coupon has expired.');
    if (coupon.maxUses !== null && coupon.maxUses !== undefined && coupon.usedCount >= coupon.maxUses) {
      invalid('Coupon usage limit has been reached.');
    }
    if (subtotal < Number(coupon.minOrderValue ?? 0)) {
      invalid(`Coupon requires a minimum cart subtotal of ${Number(coupon.minOrderValue ?? 0)}.`);
    }

    const rawDiscount =
      coupon.discountType === 'PERCENTAGE'
        ? subtotal * (Number(coupon.discountValue ?? 0) / 100)
        : Number(coupon.discountValue ?? 0);
    const cappedDiscount =
      coupon.maxDiscount !== null && coupon.maxDiscount !== undefined
        ? Math.min(rawDiscount, Number(coupon.maxDiscount))
        : rawDiscount;
    const discount = Math.max(0, Math.min(subtotal, cappedDiscount));

    return {
      valid: true,
      couponId: coupon.id,
      code: coupon.code,
      title: coupon.title,
      discount,
      message: 'Coupon applied.',
    };
  }

  private async transitionOrderStatus(
    db: any,
    orderId: string,
    nextStatus: string,
    context: { userId?: string; note?: string; scope: string },
  ) {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { reservations: true } },
        payment: true,
        fulfillments: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === nextStatus) {
      return order;
    }

    const allowed = ORDER_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(nextStatus)) {
      throw new BadRequestException(`Cannot move order from ${order.status} to ${nextStatus}`);
    }

    if (nextStatus === 'CANCELLED' && ['DRAFT', 'PENDING_PAYMENT', 'PENDING'].includes(order.status)) {
      await this.releaseReservations(db, order.items);
    }

    const updated = await db.order.update({
      where: { id: orderId },
      data: {
        status: nextStatus,
        paymentStatus: nextStatus === 'REFUNDED' ? 'REFUNDED' : order.paymentStatus,
      },
      include: { fulfillments: true, items: true },
    });

    await this.writeAudit(db, {
      userId: context.userId,
      action: `order.status.${context.scope}`,
      entity: 'Order',
      entityId: orderId,
      changes: {
        from: order.status,
        to: nextStatus,
        note: context.note,
      },
    });

    return updated;
  }

  private async writeAudit(
    db: any,
    input: {
      userId?: string;
      action: string;
      entity: string;
      entityId?: string;
      changes?: Record<string, unknown>;
    },
  ) {
    await db.auditLog
      .create({
        data: {
          userId: input.userId,
          action: input.action,
          entity: input.entity,
          entityId: input.entityId,
          changes: input.changes ? JSON.stringify(input.changes) : null,
        },
      })
      .catch(() => undefined);
  }

  private async assertVendorProductOwnership(storeId: string, productId: string) {
    const product = await this.db().product?.findFirst({
      where: { id: productId, storeId },
    });

    if (!product) {
      throw new NotFoundException('Product not found for this vendor');
    }
  }

  private cartValidationInclude() {
    return {
      items: {
        include: {
          product: {
            include: {
              inventoryItems: true,
              digitalAssets: true,
              store: true,
              poolProduct: { include: { inventoryItems: true } },
              vendorPoolOffers: {
                where: { isActive: true, status: 'ACTIVE' },
                include: {
                  poolProduct: { include: { inventoryItems: true } },
                  sourceStore: true,
                  sourceProduct: { include: { inventoryItems: true, store: true } },
                },
              },
            },
          },
          variant: true,
          poolOffer: {
            include: {
              poolProduct: { include: { inventoryItems: true } },
              store: true,
              sourceStore: true,
              sourceProduct: { include: { inventoryItems: true, store: true } },
            },
          },
          reservations: true,
        },
      },
    };
  }

  private cartItemMatchesStoreSlug(item: any, storeSlug: string) {
    return item.product?.store?.slug === storeSlug || item.poolOffer?.store?.slug === storeSlug;
  }

  private scopeCartToStore(cart: any, storeSlug: string) {
    if (!cart) return cart;
    return {
      ...cart,
      items: (cart.items ?? []).filter((item: any) => this.cartItemMatchesStoreSlug(item, storeSlug)),
    };
  }

  private async assertCartLineCanBeAdded(input: {
    product: any;
    quantity: number;
    variantId?: string | null;
    poolOfferId?: string | null;
    poolOffer?: any;
  }) {
    const issues = this.validateCartLine({
      cartItemId: undefined,
      product: input.product,
      quantity: input.quantity,
      variantId: input.variantId,
      poolOfferId: input.poolOfferId,
      poolOffer: input.poolOffer,
    });

    if (issues.length) {
      throw new BadRequestException({
        message: issues[0].message,
        errors: issues,
      });
    }
  }

  private buildCartValidation(cart: any) {
    const errors: CartValidationIssue[] = [];
    const warnings: CartValidationIssue[] = [];

    for (const item of cart.items ?? []) {
      errors.push(
        ...this.validateCartLine({
          cartItemId: item.id,
          product: item.product,
          quantity: item.quantity,
          variantId: item.variantId,
          poolOfferId: item.poolOfferId,
          poolOffer: item.poolOffer,
        }),
      );
    }

    const totals = this.withCartTotals(cart);
    const groups = [...this.groupCartItemsByStore(cart.items ?? []).values()].map((group) => ({
      storeId: group.storeId,
      storeSlug: group.storeSlug,
      storeName: group.storeName,
      subtotal: group.subtotal,
      itemCount: group.items.reduce((sum: number, item: any) => sum + Number(item.quantity ?? 0), 0),
      requiresShipping: group.requiresShipping,
      hasDigitalDelivery: group.hasDigitalDelivery,
      productSources: [...new Set(group.items.map((item: any) => item.productSource ?? item.product?.productSource))],
      issues: errors.filter((issue) => group.items.some((item: any) => item.id === issue.cartItemId)),
    }));

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      cart: totals,
      groups,
      totals: {
        subtotal: totals.subtotal,
        discount: totals.discount,
        total: totals.total,
      },
      requiresShipping: totals.requiresShipping,
      hasDigitalDelivery: totals.hasDigitalDelivery,
    };
  }

  private validateCartLine(input: {
    cartItemId?: string;
    product: any;
    quantity: number;
    variantId?: string | null;
    poolOfferId?: string | null;
    poolOffer?: any;
  }): CartValidationIssue[] {
    const issues: CartValidationIssue[] = [];
    const product = input.product;
    const quantity = Number(input.quantity ?? 0);

    if (!product) {
      return [
        {
          code: 'PRODUCT_NOT_FOUND',
          message: 'A product in your cart is no longer available.',
          cartItemId: input.cartItemId,
        },
      ];
    }

    if (quantity < 1) {
      issues.push({
        code: 'INVALID_QUANTITY',
        message: 'Cart quantity must be at least 1.',
        cartItemId: input.cartItemId,
        productId: product.id,
        requested: quantity,
        field: 'quantity',
      });
    }

    if (product.status && product.status !== 'ACTIVE') {
      issues.push({
        code: 'PRODUCT_INACTIVE',
        message: `${product.name} is not available for checkout.`,
        cartItemId: input.cartItemId,
        productId: product.id,
      });
    }

    if (input.poolOfferId) {
      if (!input.poolOffer) {
        issues.push({
          code: 'POOL_OFFER_NOT_FOUND',
          message: `${product.name} is no longer linked to a Pool offer.`,
          cartItemId: input.cartItemId,
          productId: product.id,
        });
      } else if (!input.poolOffer.isActive || (input.poolOffer.status && input.poolOffer.status !== 'ACTIVE')) {
        issues.push({
          code: 'POOL_OFFER_INACTIVE',
          message: `${product.name} Pool resale offer is not active.`,
          cartItemId: input.cartItemId,
          productId: product.id,
        });
      }
    }

    if (product.productSource === 'GROUP_BUY') {
      issues.push({
        code: 'GROUP_BUY_CHECKOUT_NOT_OPEN',
        message: `${product.name} is a group-buy item. Subscribe to the campaign before checkout opens.`,
        cartItemId: input.cartItemId,
        productId: product.id,
      });
    }

    if (product.productType === 'DIGITAL') {
      const hasDelivery = product.digitalAssets?.some((asset: any) => asset.isActive !== false);
      if (!hasDelivery) {
        issues.push({
          code: 'DIGITAL_DELIVERY_NOT_READY',
          message: `${product.name} is not ready for digital delivery yet.`,
          cartItemId: input.cartItemId,
          productId: product.id,
        });
      }
      return issues;
    }

    if (product.trackInventory === false || product.inventoryPolicy === 'UNLIMITED') {
      return issues;
    }

    const available = this.availableInventoryForLine(product, input.variantId, input.poolOffer);
    if (available < quantity) {
      issues.push({
        code: 'INSUFFICIENT_INVENTORY',
        message:
          available > 0
            ? `Only ${available} unit${available === 1 ? '' : 's'} of ${product.name} can be checked out right now.`
            : `${product.name} is out of stock.`,
        cartItemId: input.cartItemId,
        productId: product.id,
        available,
        requested: quantity,
        field: 'quantity',
      });
    }

    return issues;
  }

  private availableInventoryForLine(product: any, variantId?: string | null, poolOffer?: any) {
    const poolInventory =
      poolOffer?.sourceType === 'VENDOR_PRODUCT'
        ? poolOffer?.sourceProduct?.inventoryItems
        : poolOffer?.poolProduct?.inventoryItems ?? product.poolProduct?.inventoryItems;
    const inventoryItems =
      (product.productSource === 'POOL_RESALE' || poolOffer) && poolInventory?.length
        ? poolInventory
        : product.inventoryItems;

    return (inventoryItems ?? [])
      .filter((item: any) => {
          if (item.policy === 'UNLIMITED') return true;
          if (variantId) return item.variantId === variantId;
          return !item.variantId || item.productId === product.id || item.productId === poolOffer?.sourceProductId || item.poolProductId === product.poolProductId;
        })
      .reduce((sum: number, item: any) => {
        if (item.policy === 'UNLIMITED') return Number.MAX_SAFE_INTEGER;
        return sum + Math.max(0, Number(item.available ?? 0));
      }, 0);
  }

  private groupCartItemsByStore(items: any[]) {
    const groups = new Map<
      string,
      {
        storeId: string;
        storeSlug?: string;
        storeName: string;
        items: any[];
        subtotal: number;
        requiresShipping: boolean;
        hasDigitalDelivery: boolean;
      }
    >();

    for (const item of items ?? []) {
      const isSourceFulfilledPool = Boolean(item.poolOfferId && item.poolOffer?.sourceStoreId);
      const store = isSourceFulfilledPool
        ? item.poolOffer?.sourceStore ?? item.product?.store
        : item.product?.store ?? item.poolOffer?.store;
      const storeId = isSourceFulfilledPool
        ? item.poolOffer?.sourceStoreId
        : item.product?.storeId ?? item.poolOffer?.storeId;
      if (!storeId) {
        continue;
      }

      if (!groups.has(storeId)) {
        groups.set(storeId, {
          storeId,
          storeSlug: store?.slug,
          storeName: store?.name ?? 'Vendor store',
          items: [],
          subtotal: 0,
          requiresShipping: false,
          hasDigitalDelivery: false,
        });
      }

      const group = groups.get(storeId)!;
      group.items.push(item);
      group.subtotal += Number(item.price ?? 0) * Number(item.quantity ?? 0);
      group.requiresShipping =
        group.requiresShipping || Boolean(item.requiresShipping || item.product?.productType !== 'DIGITAL');
      group.hasDigitalDelivery =
        group.hasDigitalDelivery || item.productType === 'DIGITAL' || item.product?.productType === 'DIGITAL';
    }

    return groups;
  }

  private allocateDiscount(discount: number, groups: Array<{ storeId: string; subtotal: number }>) {
    const allocations = new Map<string, number>();
    const totalSubtotal = groups.reduce((sum, group) => sum + Number(group.subtotal ?? 0), 0);
    const discountCents = Math.round(Number(discount ?? 0) * 100);
    if (discountCents <= 0 || totalSubtotal <= 0 || groups.length === 0) {
      groups.forEach((group) => allocations.set(group.storeId, 0));
      return allocations;
    }

    let allocatedCents = 0;
    groups.forEach((group, index) => {
      const cents =
        index === groups.length - 1
          ? discountCents - allocatedCents
          : Math.floor((discountCents * Number(group.subtotal ?? 0)) / totalSubtotal);
      allocatedCents += cents;
      allocations.set(group.storeId, cents / 100);
    });

    return allocations;
  }

  private lineItemKey(item: any) {
    return [item.productId, item.variantId ?? '', item.poolOfferId ?? ''].join(':');
  }

  private parseImageList(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
    }
    if (typeof value !== 'string' || !value.trim()) {
      return [];
    }
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string' && item.length > 0);
      }
    } catch {
      // Seed data sometimes stores a single URL instead of JSON.
    }
    return [value].filter(Boolean);
  }

  private slugify(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 80);
  }

  private withCartTotals(cart: any) {
    const items = cart?.items ?? [];
    const subtotal = items.reduce(
      (sum: number, item: any) => sum + Number(item.price ?? 0) * Number(item.quantity ?? 0),
      0,
    );
    const discount = 0;
    const total = Math.max(0, subtotal - discount);

    return {
      ...cart,
      subtotal,
      discount,
      total,
      requiresShipping: items.some(
        (item: any) => item.requiresShipping || item.product?.productType !== 'DIGITAL',
      ),
      hasDigitalDelivery: items.some(
        (item: any) => item.productType === 'DIGITAL' || item.product?.productType === 'DIGITAL',
      ),
    };
  }

  private async resolveBuyerEmail(userId: string, user: AuthContext) {
    if (user.email) {
      return user.email;
    }

    const account = await this.db().user?.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!account?.email) {
      throw new BadRequestException('Buyer email is required for Paystack checkout');
    }

    return account.email;
  }

  private defaultPaymentCallbackUrl(reference: string) {
    const frontendUrl = this.config.get<string>('frontendUrl') ?? 'http://localhost:3000';
    return `${frontendUrl.replace(/\/$/, '')}/checkout/verify?reference=${encodeURIComponent(reference)}`;
  }

  private buildPaystackAuthorizationUrl(reference: string, callbackUrl?: string) {
    const publicKey = this.config.get<string>('payment.paystackPublic');
    const params = new URLSearchParams({ reference });
    if (publicKey) {
      params.set('key', publicKey);
    }
    if (callbackUrl) {
      params.set('callback_url', callbackUrl);
    }
    return `https://checkout.paystack.com/?${params.toString()}`;
  }

  private safeEqual(actual: string, expected: string) {
    const actualBuffer = Buffer.from(actual);
    const expectedBuffer = Buffer.from(expected);
    return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
  }
}
