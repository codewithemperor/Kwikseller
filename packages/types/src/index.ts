// KWIKSELLER - Shared TypeScript Types
// All domain types for the application

// ==================== USER & AUTH ====================

export type UserRole = 'BUYER' | 'VENDOR' | 'ADMIN' | 'RIDER'
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'PENDING'
export type KycStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type AdminRole = 'SUPER_ADMIN' | 'FINANCE' | 'VENDOR_SUPPORT' | 'OPERATIONS' | 'MARKETING' | 'CONTENT'

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
}

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

export interface Product {
  id: string
  storeId: string
  name: string
  slug: string
  description?: string
  price: number
  comparePrice?: number
  sku?: string
  stock: number
  status: ProductStatus
  categoryId?: string
  isPoolProduct: boolean
  createdAt: string
  updatedAt: string
  store?: Store
  variants?: ProductVariant[]
  images?: ProductImage[]
  category?: Category
}

export interface ProductVariant {
  id: string
  productId: string
  name: string
  options: Record<string, string>
  price: number
  stock: number
  sku?: string
}

export interface ProductImage {
  id: string
  productId: string
  url: string
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
  product?: Product
  variant?: ProductVariant
}

// ==================== ORDERS ====================

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'

export interface Order {
  id: string
  buyerId: string
  storeId: string
  status: OrderStatus
  subtotal: number
  shippingFee: number
  totalAmount: number
  paymentStatus: PaymentStatus
  addressId: string
  poolOrderId?: string
  createdAt: string
  updatedAt: string
  buyer?: User
  store?: Store
  address?: Address
  items?: OrderItem[]
  payment?: Payment
  escrow?: Escrow
  delivery?: Delivery
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
  product?: Product
  variant?: ProductVariant
}

// ==================== PAYMENTS ====================

export type PaymentGateway = 'PAYSTACK' | 'FLUTTERWAVE'
export type PaymentType = 'ORDER' | 'SUBSCRIPTION' | 'CREDIT_PURCHASE'

export interface Payment {
  id: string
  orderId?: string
  entityType: PaymentType
  entityId: string
  amount: number
  gateway: PaymentGateway
  reference: string
  status: PaymentStatus
  metadata?: Record<string, unknown>
  createdAt: string
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
