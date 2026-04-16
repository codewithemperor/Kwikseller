// KWIKSELLER - Shared UI Components
// This package provides custom KWIKSELLER components using HeroUI v3
// Import HeroUI components directly from '@heroui/react' in your apps

// ==================== Utilities ====================
export {
  cn,
  formatCurrency,
  formatDate,
  formatRelativeTime,
  truncate,
  slugify,
  capitalize,
  getInitials,
  generateId,
  maskEmail,
} from "./lib/utils";

// ==================== Form Input Components ====================
// Modern, clean form inputs using HeroUI v3
export {
  TextInput,
  PasswordInput,
  NumberInput,
  TextareaInput,
  DatePickerInput,
  DateRangePickerInput,
  TimeFieldInput,
  SelectInput,
  Text,
  Password,
  Number,
  Textarea,
  DatePicker,
  DateRangePicker,
  Time,
  Select,
} from "./inputs";
export type {
  BaseInputProps,
  TextInputProps,
  PasswordInputProps,
  NumberInputProps,
  TextareaInputProps,
} from "./inputs";

// OTP Components
export { OTPInput, OTPModal, SubmitButton } from "./inputs";
export type { OTPInputProps, OTPModalProps, SubmitButtonProps } from "./inputs";

// ==================== Custom Commerce Components ====================
// These are KWIKSELLER-specific components shared across all apps

// Product Card
export { ProductCard } from "./commerce/product-card";
export type { ProductCardProps, Product } from "./commerce/product-card";

// Product Grid
export { ProductGrid } from "./commerce/product-grid";
export type { ProductGridProps } from "./commerce/product-grid";

// Order Status Badge
export { OrderStatusBadge } from "./commerce/order-status-badge";
export type {
  OrderStatusBadgeProps,
  OrderStatus,
} from "./commerce/order-status-badge";

// Price Display
export { PriceDisplay } from "./commerce/price-display";
export type { PriceDisplayProps } from "./commerce/price-display";

// Quantity Selector
export { QuantitySelector } from "./commerce/quantity-selector";
export type { QuantitySelectorProps } from "./commerce/quantity-selector";

// ==================== Custom Layout Components ====================

// App Shell
export { AppShell } from "./layout/app-shell";
export type { AppShellProps } from "./layout/app-shell";

// Page Header
export { PageHeader } from "./layout/page-header";
export type { PageHeaderProps } from "./layout/page-header";

// ==================== Custom Feedback Components ====================

// Empty State
export { EmptyState } from "./feedback/empty-state";
export type {
  EmptyStateProps,
  EmptyStateVariant,
} from "./feedback/empty-state";

// Loading Overlay
export { LoadingOverlay } from "./feedback/loading-overlay";
export type { LoadingOverlayProps } from "./feedback/loading-overlay";

// Offline Banner
export { OfflineBanner, ConnectionStatus } from "./feedback/offline-banner";
export type { OfflineBannerProps } from "./feedback/offline-banner";

export { OTPVerification } from "./components/otp-verification";
export type { OTPVerificationProps } from "./components/otp-verification";

// ==================== Marketplace Components ====================
// Role-aware product actions shared between buyer marketplace & vendor portal

// Product Actions — role-based action buttons (cart, wishlist, pool, edit, etc.)
export { ProductActions, PRODUCT_ACTIONS } from "./marketplace/product-actions";
export type { ProductActionsProps, UserRole, ProductAction } from "./marketplace/product-actions";

// Product Card Actions — ProductCard wrapper with vendor/buyer actions
export { ProductCardActions } from "./marketplace/product-card-actions";
export type { ProductCardActionsProps } from "./marketplace/product-card-actions";

// Vendor Badge — "Verified Vendor" indicator
export { VendorBadge } from "./marketplace/vendor-badge";
export type { VendorBadgeProps, VendorBadgeSize, VendorBadgeVariant } from "./marketplace/vendor-badge";

// Pool Status Badge — pool selling status indicator
export { PoolStatusBadge } from "./marketplace/pool-status-badge";
export type { PoolStatusBadgeProps, PoolStatus } from "./marketplace/pool-status-badge";

// Role-Aware Product Card — deeply integrated card that changes badges & actions by role
export { RoleAwareProductCard } from "./marketplace/role-aware-product-card";
export type {
  RoleAwareProductCardProps,
} from "./marketplace/role-aware-product-card";

// ==================== Auth / Portal Configs ====================
// Centralised portal configurations for all Kwikseller apps

export {
  PORTALS,
  getPortalConfig,
  getLoginUrl,
  getRedirectUrl,
  isMfaRequired,
} from "./auth/portal-configs";
export type { PortalSlug, PortalConfig } from "./auth/portal-configs";
