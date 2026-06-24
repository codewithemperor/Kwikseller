// KWIKSELLER - Shared TypeScript Types
// All domain types for the application

// Export auth validation schemas
export * from './auth'

// ==================== USER & AUTH ====================

export type UserRole = 'BUYER' | 'VENDOR' | 'ADMIN' | 'RIDER' | 'SUPER_ADMIN'
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'PENDING'
export type KycStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type AdminRole =
  | 'SUPER_ADMIN'
  | 'FINANCE'
  | 'VENDOR_SUPPORT'
  | 'OPERATIONS'
  | 'MARKETING'
  | 'CONTENT'
  | 'CUSTOMER_SUPPORT'
  | 'LOGISTICS'
  | 'CATALOG_MANAGER'
  | 'AUDITOR'

export interface User {
  id: string
  email: string
  phone?: string
  role: UserRole
  status: UserStatus
  emailVerified: boolean
  createdAt: string
  updatedAt: string
  profile?: UserProfile
  store?: Store
  subscription?: Subscription
  adminPermission?: AdminPermission
}

export interface UserProfile {
  id: string
  userId: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
  bio?: string
  dateOfBirth?: string
}

export interface Address {
  id: string
  userId: string
  line1: string
  line2?: string
  city: string
  state: string
  localGovernment?: string
  deliveryInstructions?: string
  country: string
  postalCode?: string
  isDefault: boolean
  type: 'SHIPPING' | 'BILLING'
}

export interface KycDocument {
  id: string
  userId: string
  type: 'NIN' | 'CAC' | 'BVN' | 'PASSPORT'
  documentUrl: string
  status: KycStatus
  reviewedBy?: string
  reviewedAt?: string
  rejectionReason?: string
}

export interface AdminPermission {
  id: string
  adminUserId: string
  role: AdminRole
  permissions: string[]
  grantedBy: string
  isActive: boolean
}

// ==================== STORE ====================

export interface Store {
  id: string
  vendorId: string
  name: string
  slug: string
  description?: string
  logoUrl?: string
  bannerUrl?: string
  category?: string
  isVerified: boolean
  onboardingComplete: boolean
  createdAt: string
  updatedAt: string
  products?: Product[]
  storefrontDesign?: StorefrontDesignConfig
}

export interface StorefrontDesignConfig {
  id?: string
  themePreset: string
  navbarTemplate?: string
  bottomNavTemplate?: string
  layoutTemplate?: string
  cartTemplate?: string
  typographyPreset?: string
  primaryColor: string
  accentColor: string
  fontPairing: string
  headingFont?: StorefrontFontKey
  bodyFont?: StorefrontFontKey
  heroLayout: string
  productCardStyle: string
  sections: string[]
  heroTitle?: string | null
  heroSubtitle?: string | null
}

export type StorefrontFontKey =
  | 'SORA'
  | 'FIGTREE'
  | 'INTER'
  | 'POPPINS'
  | 'DM_SANS'
  | 'LATO'
  | 'MONTSERRAT'
  | 'PLAYFAIR_DISPLAY'
  | 'MERRIWEATHER'

// ==================== SUBSCRIPTION ====================

export type SubscriptionPlan = 'STARTER' | 'GROWTH' | 'PRO' | 'SCALE'
export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'PENDING'

export interface Subscription {
  id: string
  vendorId: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  startDate?: string
  endDate?: string
  productLimit: number
  adCreditsIncluded: number
  autoRenew: boolean
  paymentToken?: string
}

export interface PlanConfig {
  name: SubscriptionPlan
  displayName: string
  price: number
  productLimit: number
  adCreditsIncluded: number
  commissionRate: number
  features: string[]
  recommended?: boolean
}

// ==================== KWIKCOINS & CREDITS ====================

export type CoinTransactionType = 'EARNED' | 'SPENT' | 'PURCHASED' | 'ADJUSTED' | 'REFERRAL'

export interface KwikCoins {
  id: string
  vendorId: string
  balance: number
  totalEarned: number
  totalSpent: number
  totalPurchased: number
}

export interface CoinTransaction {
  id: string
  vendorId: string
  amount: number
  type: CoinTransactionType
  source?: string
  balanceAfter: number
  createdAt: string
}

export interface Milestone {
  id: string
  key: string
  name: string
  description?: string
  coinsAwarded: number
  isRepeatable: boolean
}

// ==================== PRODUCTS ====================

export type ProductStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED' | 'PENDING'
export type ProductType = 'PHYSICAL' | 'DIGITAL'
export type ProductSource = 'VENDOR_STOCK' | 'POOL_RESALE' | 'GROUP_BUY'
export type PoolSourceType = 'ADMIN_POOL' | 'VENDOR_PRODUCT'
export type InventoryPolicy = 'TRACKED' | 'UNLIMITED' | 'LICENSE_LIMITED'
export type DigitalDeliveryType = 'DOWNLOAD' | 'LICENSE_KEY' | 'EXTERNAL_ACCESS'
export type ProductCondition = 'NEW' | 'USED' | 'REFURBISHED'
export type MediaType = 'IMAGE' | 'VIDEO'

export interface Product {
  id: string
  storeId: string
  name: string
  slug: string
  shortDescription?: string
  description?: string
  price: number
  comparePrice?: number
  sku?: string
  barcode?: string
  productType?: ProductType
  productSource?: ProductSource
  inventoryPolicy?: InventoryPolicy
  requiresShipping?: boolean
  useStoreDeliveryZones?: boolean
  trackInventory?: boolean
  lowStock?: number
  stock: number
  minOrderQuantity?: number
  maxOrderQuantity?: number
  condition?: ProductCondition
  isPreorder?: boolean
  preorderDate?: string
  weight?: number
  status: ProductStatus
  categoryId?: string
  isPoolProduct: boolean
  poolProductId?: string
  poolEnabled?: boolean
  poolBasePrice?: number
  poolMinSalePrice?: number
  poolMaxSelectableQuantity?: number
  poolSourceStoreId?: string
  poolSourceProductId?: string
  poolSourceBasePrice?: number
  poolMargin?: number
  digitalAssets?: DigitalAsset[]
  inventoryItems?: InventoryItem[]
  createdAt: string
  updatedAt: string
  store?: Store
  variants?: ProductVariant[]
  variantTypes?: VariantType[]
  images?: ProductMedia[]
  category?: Category
}

export interface ProductVariant {
  id: string
  productId: string
  name: string
  values?: VariantValue[]
  price: number
  stock: number
  inventoryItem?: InventoryItem
  sku?: string
}

export interface DigitalAsset {
  id: string
  productId: string
  variantId?: string
  deliveryType: DigitalDeliveryType
  name: string
  fileUrl?: string
  accessUrl?: string
  licenseKey?: string
  maxDownloads?: number
  expiresAfterDays?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type InventoryReservationStatus = 'ACTIVE' | 'COMMITTED' | 'RELEASED' | 'EXPIRED'

export interface InventoryItem {
  id: string
  productId: string
  variantId?: string
  storeId?: string
  poolProductId?: string
  sku?: string
  available: number
  reserved: number
  safetyStock: number
  lowStockThreshold: number
  policy: InventoryPolicy
  createdAt: string
  updatedAt: string
}

export interface InventoryReservation {
  id: string
  inventoryItemId: string
  cartItemId?: string
  orderItemId?: string
  quantity: number
  status: InventoryReservationStatus
  expiresAt: string
  createdAt: string
  updatedAt: string
}

export interface VariantType {
  id: string
  productId: string
  name: string
  position: number
  values?: VariantValue[]
}

export interface VariantValue {
  id: string
  variantTypeId: string
  value: string
  hexCode?: string
  imageUrl?: string
  position: number
}

export interface ProductMedia {
  id: string
  productId: string
  url: string
  mediaType: MediaType
  thumbnailUrl?: string
  alt?: string
  position: number
  isMain: boolean
}

export interface Category {
  id: string
  name: string
  slug: string
  parentId?: string
  imageUrl?: string
  isActive: boolean
  parent?: Category
  children?: Category[]
}

// ==================== CART ====================

export interface Cart {
  id: string
  userId?: string
  sessionId?: string
  expiresAt?: string
  items: CartItem[]
}

export interface CartItem {
  id: string
  cartId: string
  productId: string
  variantId?: string
  quantity: number
  price: number
  productType?: ProductType
  productSource?: ProductSource
  poolOfferId?: string
  requiresShipping?: boolean
  reservation?: InventoryReservation
  product?: Product
  variant?: ProductVariant
}

export interface CartValidationIssue {
  code: string
  message: string
  cartItemId?: string
  productId?: string
  field?: string
  available?: number
  requested?: number
}

export interface CartValidationResponse {
  valid: boolean
  errors: CartValidationIssue[]
  warnings: CartValidationIssue[]
  cart?: Cart | null
  groups?: CartVendorGroup[]
  totals: {
    subtotal: number
    discount: number
    total: number
  }
  requiresShipping: boolean
  hasDigitalDelivery: boolean
}

export interface CartVendorGroup {
  storeId: string
  storeSlug?: string
  storeName: string
  subtotal: number
  itemCount: number
  requiresShipping: boolean
  hasDigitalDelivery: boolean
  productSources?: ProductSource[]
  issues?: CartValidationIssue[]
}

export interface DeliveryRate {
  id: string
  state: string
  localGovernment: string
  fee: number
  minDeliveryDays: number
  maxDeliveryDays: number
  isActive: boolean
  estimatedDeliveryStart?: string
  estimatedDeliveryEnd?: string
  dispatchNote?: string
  createdAt: string
  updatedAt: string
}

export interface CouponValidationResponse {
  valid: boolean
  couponId: string
  code: string
  title?: string
  discount: number
  message?: string
}

// ==================== ORDERS ====================

export type OrderStatus =
  | 'DRAFT'
  | 'PENDING_PAYMENT'
  | 'PENDING'
  | 'PAID'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'FULFILLED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'
export type PaymentStatus = 'PENDING' | 'AUTHORIZED' | 'PAID' | 'FAILED' | 'REFUNDED'
export type FulfillmentStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FULFILLED' | 'DELIVERED' | 'FAILED' | 'CANCELLED'
export type FulfillmentType = 'PHYSICAL_MANUAL' | 'DIGITAL_ACCESS'

export interface Order {
  id: string
  buyerId: string
  storeId?: string
  parentCheckoutId?: string
  status: OrderStatus
  subtotal: number
  shippingFee: number
  discount?: number
  totalAmount: number
  paymentStatus: PaymentStatus
  addressId?: string
  poolOrderId?: string
  checkoutReference?: string
  deliveryRateId?: string
  deliveryState?: string
  deliveryLocalGovernment?: string
  estimatedDeliveryStart?: string
  estimatedDeliveryEnd?: string
  deliveryRateSnapshot?: string
  createdAt: string
  updatedAt: string
  buyer?: User
  store?: Store
  address?: Address
  items?: OrderItem[]
  payment?: Payment
  parentCheckout?: ParentCheckout
  escrow?: Escrow
  delivery?: Delivery
  fulfillments?: Fulfillment[]
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  variantId?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  isPoolItem: boolean
  productType?: ProductType
  productSource?: ProductSource
  poolOfferId?: string
  sellerStoreId?: string
  sourceStoreId?: string
  sourceProductId?: string
  sourceBasePrice?: number
  resellerMargin?: number
  platformFeeAmount?: number
  fulfillmentStatus?: FulfillmentStatus
  product?: Product
  variant?: ProductVariant
  reservation?: InventoryReservation
}

// ==================== PAYMENTS ====================

export type PaymentGateway = 'PAYSTACK' | 'FLUTTERWAVE' | 'CASH_ON_DELIVERY' | 'WALLET'
export type ParentCheckoutStatus = 'PENDING_PAYMENT' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED'
export type PaymentType = 'CHECKOUT' | 'ORDER' | 'SUBSCRIPTION' | 'CREDIT_PURCHASE'

export interface ParentCheckout {
  id: string
  buyerId: string
  status: ParentCheckoutStatus
  subtotal: number
  shippingFee: number
  discount: number
  totalAmount: number
  paymentStatus: PaymentStatus
  checkoutReference: string
  idempotencyKey?: string
  couponId?: string
  createdAt: string
  updatedAt: string
  orders?: Order[]
  payment?: Payment
}

export interface Payment {
  id: string
  orderId?: string
  parentCheckoutId?: string
  entityType: PaymentType
  entityId: string
  amount: number
  gateway: PaymentGateway
  reference: string
  status: PaymentStatus
  authorizationUrl?: string
  paidAt?: string
  verifiedAt?: string
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface Fulfillment {
  id: string
  orderId: string
  orderItemId?: string
  type: FulfillmentType
  status: FulfillmentStatus
  manualCarrier?: string
  trackingNumber?: string
  digitalAssetId?: string
  accessUrl?: string
  deliveredAt?: string
  createdAt: string
  updatedAt: string
}

export interface CheckoutRequest {
  cartId?: string
  storeSlug?: string
  shippingAddress?: {
    fullName: string
    phone: string
    addressLine1: string
    addressLine2?: string
    localGovernment?: string
    deliveryInstructions?: string
    city: string
    state: string
    country: string
  }
  couponCode?: string
  idempotencyKey?: string
}

export interface CheckoutResponse {
  order?: Order
  orders?: Order[]
  parentCheckout?: ParentCheckout
  payment: Payment
  authorizationUrl?: string
  requiresShipping: boolean
  reference?: string
}

export interface SplitCheckoutResponse extends CheckoutResponse {
  orders: Order[]
  parentCheckout: ParentCheckout
}

// ==================== POOL COMMERCE ====================

export type PoolProductStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
export type PoolOfferStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED'
export type PoolCampaignStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'THRESHOLD_MET' | 'FULFILLING' | 'COMPLETED' | 'CANCELLED'

export interface PoolProduct {
  id: string
  name: string
  description?: string
  wholesalePrice: number
  suggestedRetailPrice?: number
  categoryId?: string
  category?: string
  supplierId?: string
  status: PoolProductStatus
  productType: ProductType
  images?: string[]
  inventoryItem?: InventoryItem
  inventoryItems?: InventoryItem[]
  sourceType?: PoolSourceType
  sourceProductId?: string
  sourceStoreId?: string
  sourceStoreName?: string
  sourceStoreSlug?: string
  alreadySelected?: boolean
  linkedOfferId?: string
  linkedProductId?: string
  createdAt: string
  updatedAt: string
}

export interface VendorPoolOffer {
  id: string
  storeId: string
  poolProductId?: string
  sourceType?: PoolSourceType
  sourceStoreId?: string
  sourceProductId?: string
  sourceBasePrice?: number
  retailPrice: number
  markup: number
  status: PoolOfferStatus
  productId?: string
  poolProduct?: PoolProduct
  sourceProduct?: Product
  product?: Product
  createdAt: string
  updatedAt: string
}

export interface PoolSelectionRequest {
  sourceType: PoolSourceType
  poolProductId?: string
  sourceProductId?: string
  retailPrice: number
}

export interface PoolCampaign {
  id: string
  poolProductId: string
  title: string
  targetQuantity: number
  committedQuantity: number
  unitPrice: number
  status: PoolCampaignStatus
  startsAt: string
  endsAt?: string
  createdAt: string
  updatedAt: string
}

export interface VendorDashboardSeriesPoint {
  label: string
  value: number
}

export interface VendorDashboardKpi {
  value: number
  trend: number
  period: string
}

export interface VendorDashboardSearchSuggestion {
  id: string
  type: 'product' | 'order' | 'inventory' | 'pool' | string
  text: string
  subtext?: string
  href: string
}

export interface VendorDashboardMetrics {
  revenue: number
  orders?: number
  ordersCount: number
  productsCount: number
  pendingFulfillments?: number
  lowStockItems?: number
  inventoryAlerts: InventoryItem[]
  fulfillmentTasks: Order[]
  poolEarnings: number
  recentOrders: Order[]
  poolOffers: VendorPoolOffer[]
  wallet: {
    currentBalance: number
    availableBalance: number
    pendingBalance: number
    totalEarned: number
    totalWithdrawn: number
  }
  kpis: {
    walletBalance: VendorDashboardKpi
    availableBalance: VendorDashboardKpi
    pendingSettlement: VendorDashboardKpi
    totalRevenue: VendorDashboardKpi
    totalOrders: VendorDashboardKpi
    activeProducts: VendorDashboardKpi
  }
  analytics: {
    revenueTrend: VendorDashboardSeriesPoint[]
    orderVolume: VendorDashboardSeriesPoint[]
    settlementHistory: VendorDashboardSeriesPoint[]
    cashFlow: VendorDashboardSeriesPoint[]
  }
  totals: {
    allProducts: number
    lowStockItems: number
    pendingOrders: number
  }
  searchSuggestions: VendorDashboardSearchSuggestion[]
}

// ==================== ESCROW ====================

export type EscrowStatus = 'HELD' | 'RELEASED' | 'DISPUTED' | 'PARTIAL'

export interface Escrow {
  id: string
  orderId: string
  vendorId: string
  amount: number
  status: EscrowStatus
  releaseAt?: string
  releasedAt?: string
  disputeReason?: string
}

// ==================== WALLET ====================

export type WithdrawalStatus = 'PENDING' | 'PROCESSED' | 'FAILED'

export interface Wallet {
  id: string
  vendorId: string
  availableBalance: number
  pendingBalance: number
  totalEarned: number
  totalWithdrawn: number
}

export interface Withdrawal {
  id: string
  vendorId: string
  amount: number
  bankCode: string
  accountNumber: string
  accountName: string
  status: WithdrawalStatus
  reference?: string
  processedAt?: string
}

// ==================== RIDERS ====================

export type DeliveryStatus = 'ASSIGNED' | 'ACCEPTED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED'

export interface Rider {
  id: string
  userId: string
  vehicleType: 'BIKE' | 'CAR' | 'TRUCK'
  plateNumber?: string
  isAvailable: boolean
  rating: number
  totalDeliveries: number
  totalEarnings: number
}

export interface Delivery {
  id: string
  orderId: string
  riderId: string
  status: DeliveryStatus
  pickupPhotoUrl?: string
  deliveryPhotoUrl?: string
  otp?: string
  assignedAt: string
  pickedUpAt?: string
  deliveredAt?: string
  rider?: Rider
}

// ==================== NOTIFICATIONS ====================

export type NotificationType = 
  | 'ORDER_UPDATE' 
  | 'PAYMENT_RECEIVED' 
  | 'SUBSCRIPTION_RENEWED' 
  | 'RIDER_ASSIGNED' 
  | 'KYC_STATUS' 
  | 'AD_APPROVED' 
  | 'MILESTONE_EARNED' 
  | 'ADMIN_ALERT' 
  | 'SYSTEM'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  data?: Record<string, unknown>
  createdAt: string
}

// ==================== API RESPONSES ====================

export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
  }
}

export interface ApiError {
  statusCode: number
  message: string
  error?: string
  details?: Record<string, string[]>
}

// ==================== AUTH ====================

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  phone?: string
  role: UserRole
  firstName?: string
  lastName?: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthUser {
  user: User
  tokens: AuthTokens
}

// ==================== PERMISSIONS ====================

export const PERMISSIONS = {
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  VENDORS_KYC_REVIEW: 'vendors:kyc:review',
  VENDORS_SUBSCRIPTIONS_MANAGE: 'vendors:subscriptions:manage',
  ORDERS_READ: 'orders:read',
  ORDERS_MANAGE: 'orders:manage',
  FINANCE_READ: 'finance:read',
  FINANCE_MANAGE: 'finance:manage',
  DISPUTES_READ: 'disputes:read',
  DISPUTES_RESOLVE: 'disputes:resolve',
  PRODUCTS_MODERATE: 'products:moderate',
  POOL_MANAGE: 'pool:manage',
  ADS_MODERATE: 'ads:moderate',
  ANALYTICS_READ: 'analytics:read',
  CONFIG_READ: 'config:read',
  CONFIG_WRITE: 'config:write',
  ADMINS_MANAGE: 'admins:manage',
  AUDIT_READ: 'audit:read',
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

// ==================== SUBSCRIPTION PLANS CONFIG ====================

export const SUBSCRIPTION_PLANS: PlanConfig[] = [
  {
    name: 'STARTER',
    displayName: 'Starter',
    price: 0,
    productLimit: 10,
    adCreditsIncluded: 0,
    commissionRate: 15,
    features: [
      'Up to 10 products',
      'Basic analytics',
      'Standard support',
      '15% platform fee',
    ],
  },
  {
    name: 'GROWTH',
    displayName: 'Growth',
    price: 5000,
    productLimit: 50,
    adCreditsIncluded: 100,
    commissionRate: 12,
    features: [
      'Up to 50 products',
      'Advanced analytics',
      'Priority support',
      '12% platform fee',
      '100 KwikCoins bonus',
    ],
    recommended: true,
  },
  {
    name: 'PRO',
    displayName: 'Pro',
    price: 15000,
    productLimit: 200,
    adCreditsIncluded: 300,
    commissionRate: 10,
    features: [
      'Up to 200 products',
      'Full analytics suite',
      '24/7 support',
      '10% platform fee',
      '300 KwikCoins bonus',
      'Pool access',
    ],
  },
  {
    name: 'SCALE',
    displayName: 'Scale',
    price: 50000,
    productLimit: -1,
    adCreditsIncluded: 1000,
    commissionRate: 8,
    features: [
      'Unlimited products',
      'Enterprise analytics',
      'Dedicated account manager',
      '8% platform fee',
      '1000 KwikCoins bonus',
      'Pool access',
      'API access',
    ],
  },
]
