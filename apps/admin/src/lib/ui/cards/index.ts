/**
 * Generic, configurable card components shared across all Kwikseller apps
 * (marketplace, vendor portal, admin, rider).
 *
 * Each card uses the unified OKLCH design tokens (primary=blue,
 * secondary=orange, gray=blue-gray) and is app-agnostic — pass props in,
 * get a polished, animated, accessible card out.
 *
 * Re-exported from the package root `@/lib/ui`. The new generic
 * ProductCard is also exposed at the package root as `GenericProductCard`
 * to avoid clashing with the legacy commerce/product-card `ProductCard`.
 */

export { ProductCard } from "./product-card";
export type { ProductCardProps, ProductCardVariant } from "./product-card";

export { CategoryCard } from "./category-card";
export type { CategoryCardProps } from "./category-card";

export { VendorCard } from "./vendor-card";
export type { VendorCardProps } from "./vendor-card";

export { BrandCard } from "./brand-card";
export type { BrandCardProps } from "./brand-card";

export { DealCard } from "./deal-card";
export type { DealCardProps } from "./deal-card";

