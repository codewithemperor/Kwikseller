/**
 * Barrel export for reusable product components.
 *
 * These shared components are used by both the Product Quick View and the
 * Product Detail Page to avoid duplicating product logic.
 */

export { ProductGallery } from "./product-gallery";
export { PriceDisplay } from "./price-display";
export { RatingDisplay } from "./rating-display";
export { StockBadge, getStockStatus, type StockStatus } from "./stock-badge";
export { QuantitySelector } from "./quantity-selector";
export { VendorSummary } from "./vendor-summary";
export { ReviewSummary } from "./review-summary";
export { ReviewList } from "./review-list";
export { ReviewForm } from "./review-form";
export { ProductInfoSection } from "./product-info-section";
export { RelatedProducts } from "./related-products";
export { formatCurrency, discountPercent, formatRelativeDate, hasHtmlMarkup } from "./format";
