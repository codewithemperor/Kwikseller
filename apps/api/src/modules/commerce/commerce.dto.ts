import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

const PRODUCT_TYPES = ['PHYSICAL', 'DIGITAL'] as const;
const PRODUCT_SOURCES = ['VENDOR_STOCK', 'POOL_RESALE', 'GROUP_BUY'] as const;
const POOL_SOURCE_TYPES = ['ADMIN_POOL', 'VENDOR_PRODUCT'] as const;
const PRODUCT_STATUSES = ['ACTIVE', 'DRAFT', 'ARCHIVED', 'PENDING'] as const;
const INVENTORY_POLICIES = ['TRACKED', 'UNLIMITED', 'LICENSE_LIMITED'] as const;
const ORDER_STATUSES = [
  'DRAFT',
  'PENDING_PAYMENT',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'FULFILLED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
] as const;

export class AddCartItemDto {
  @IsString()
  productId!: string;

  @IsOptional()
  @IsString()
  variantId?: string;

  @IsOptional()
  @IsString()
  poolOfferId?: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class UpdateCartItemDto {
  @IsInt()
  @Min(0)
  quantity!: number;
}

export class ShippingAddressDto {
  @IsString()
  fullName!: string;

  @IsString()
  phone!: string;

  @IsString()
  addressLine1!: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsOptional()
  @IsString()
  localGovernment?: string;

  @IsOptional()
  @IsString()
  stateId?: string;

  @IsOptional()
  @IsString()
  lgaId?: string;

  @IsOptional()
  @IsString()
  deliveryInstructions?: string;

  @IsString()
  city!: string;

  @IsString()
  state!: string;

  @IsString()
  country!: string;
}

export class CheckoutItemDto {
  @IsString()
  productId!: string;

  @IsOptional()
  @IsString()
  variantId?: string;

  @IsOptional()
  @IsString()
  poolOfferId?: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CheckoutDto {
  @IsOptional()
  @IsString()
  cartId?: string;

  @IsOptional()
  @IsString()
  storeSlug?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items?: CheckoutItemDto[];

  @IsOptional()
  @IsString()
  deliveryMethod?: 'PICKUP' | 'STANDARD_DELIVERY';

  @IsOptional()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress?: ShippingAddressDto;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

export class ValidateCartCouponDto {
  @IsString()
  code!: string;
}

export class DeliveryRateLookupDto {
  @IsString()
  state!: string;

  @IsString()
  localGovernment!: string;
}

export class UpsertDeliveryRateDto {
  @IsString()
  state!: string;

  @IsString()
  localGovernment!: string;

  @IsNumber()
  @Min(0)
  fee!: number;

  @IsInt()
  @Min(0)
  minDeliveryDays!: number;

  @IsInt()
  @Min(0)
  maxDeliveryDays!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class InventoryAdjustmentDto {
  @IsString()
  productId!: string;

  @IsOptional()
  @IsString()
  variantId?: string;

  @IsInt()
  quantityDelta!: number;

  @IsString()
  reason!: string;
}

export class DigitalAssetDto {
  @IsString()
  productId!: string;

  @IsOptional()
  @IsString()
  variantId?: string;

  @IsIn(['DOWNLOAD', 'LICENSE_KEY', 'EXTERNAL_ACCESS'])
  deliveryType!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsString()
  licenseKey?: string;
}

export class CreateVendorProductDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  comparePrice?: number;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  brandId?: string;

  @IsIn(PRODUCT_TYPES)
  productType!: string;

  @IsOptional()
  @IsIn(PRODUCT_SOURCES)
  productSource?: string;

  @IsOptional()
  @IsBoolean()
  requiresShipping?: boolean;

  @IsOptional()
  @IsBoolean()
  trackInventory?: boolean;

  @IsOptional()
  @IsIn(INVENTORY_POLICIES)
  inventoryPolicy?: string;

  @IsOptional()
  @IsIn(PRODUCT_STATUSES)
  status?: string;

  @IsOptional()
  @IsInt()
  initialStock?: number;

  @IsOptional()
  @IsInt()
  lowStock?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsBoolean()
  poolEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  poolBasePrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  poolMinSalePrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  poolMaxSelectableQuantity?: number;
  }

export class UpdateVendorProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  comparePrice?: number;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  brandId?: string;

  @IsOptional()
  @IsIn(PRODUCT_STATUSES)
  status?: string;

  @IsOptional()
  @IsIn(PRODUCT_TYPES)
  productType?: string;

  @IsOptional()
  @IsBoolean()
  requiresShipping?: boolean;

  @IsOptional()
  @IsBoolean()
  trackInventory?: boolean;

  @IsOptional()
  @IsIn(INVENTORY_POLICIES)
  inventoryPolicy?: string;

  @IsOptional()
  @IsInt()
  lowStock?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsBoolean()
  poolEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  poolBasePrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  poolMinSalePrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  poolMaxSelectableQuantity?: number;
  }

export class UpdateDeliverySettingsDto {
  @IsOptional()
  @IsBoolean()
  manualDeliveryEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  kwiksellerDeliveryEnabled?: boolean;

  @IsOptional()
  @IsInt()
  processingDays?: number;

  @IsOptional()
  @IsString()
  dispatchNote?: string;

  @IsOptional()
  @IsString()
  returnPolicy?: string;
}

export class UpdateOrderStatusDto {
  @IsIn(ORDER_STATUSES)
  status!: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class CreatePoolOfferDto {
  @IsOptional()
  @IsIn(POOL_SOURCE_TYPES)
  sourceType?: string;

  @IsOptional()
  @IsString()
  poolProductId?: string;

  @IsOptional()
  @IsString()
  sourceProductId?: string;

  @IsNumber()
  @Min(0)
  retailPrice!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  markup?: number;
}

export class UpdatePoolOfferDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  retailPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  markup?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsIn(['DRAFT', 'ACTIVE', 'PAUSED', 'SUSPENDED'])
  status?: string;
}

export class CreatePoolProductDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsNumber()
  @Min(0)
  basePrice!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  suggestedRetailPrice?: number;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsIn(PRODUCT_TYPES)
  productType!: string;
}

export class CreatePoolCampaignDto {
  @IsString()
  poolProductId!: string;

  @IsString()
  title!: string;

  @IsInt()
  @Min(1)
  targetQuantity!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @IsString()
  startsAt!: string;

  @IsString()
  endsAt!: string;
}

export class ManualDeliveryDto {
  @IsString()
  orderId!: string;

  @IsIn(ORDER_STATUSES)
  status!: string;

  @IsOptional()
  @IsString()
  trackingCode?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class RefundPaymentDto {
  @IsString()
  paymentId!: string;

  @IsOptional()
  @IsString()
  orderId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsString()
  reason!: string;
}

export class CreatePaymentIntentDto {
  @IsString()
  orderId!: string;

  @IsOptional()
  @IsString()
  callbackUrl?: string;
}

export class WebhookReplayDto {
  @IsOptional()
  @IsArray()
  eventIds?: string[];
}

export class UpdateStorefrontDesignDto {
  @IsOptional()
  @IsString()
  themePreset?: string;

  @IsOptional()
  @IsString()
  navbarTemplate?: string;

  @IsOptional()
  @IsString()
  bottomNavTemplate?: string;

  @IsOptional()
  @IsString()
  layoutTemplate?: string;

  @IsOptional()
  @IsString()
  cartTemplate?: string;

  @IsOptional()
  @IsString()
  typographyPreset?: string;

  @IsOptional()
  @IsString()
  primaryColor?: string;

  @IsOptional()
  @IsString()
  accentColor?: string;

  @IsOptional()
  @IsString()
  fontPairing?: string;

  @IsOptional()
  @IsString()
  headingFont?: string;

  @IsOptional()
  @IsString()
  bodyFont?: string;

  @IsOptional()
  @IsString()
  heroLayout?: string;

  @IsOptional()
  @IsString()
  productCardStyle?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sections?: string[];

  @IsOptional()
  @IsString()
  heroTitle?: string;

  @IsOptional()
  @IsString()
  heroSubtitle?: string;
}
