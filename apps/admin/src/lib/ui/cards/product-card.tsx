"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Heart, Star, ImageIcon } from "lucide-react";
import { cn, formatCurrency, truncate } from "../lib/utils";

/**
 * Variant of the generic ProductCard.
 * - `default`    — vertical card, square image, full details + CTA row
 * - `compact`    — slim vertical card, minimal info (great in carousels)
 * - `horizontal` — image on the left, content on the right (list rows)
 */
export type ProductCardVariant = "default" | "compact" | "horizontal";

export interface ProductCardProps {
  /** Primary product image URL. Falls back to an icon placeholder when empty. */
  image?: string;
  /** Alt text for the image. Defaults to the product name. */
  imageAlt?: string;
  /** Product name. */
  name: string;
  /** Current selling price (NGN). */
  price: number;
  /** Original (pre-discount) price. When present, the discount % is shown. */
  comparePrice?: number;
  /** Average rating (0-5). When omitted, the rating row is hidden. */
  rating?: number;
  /** Number of reviews; shown next to the rating when present. */
  reviewCount?: number;
  /** Store / vendor name shown above the product name. */
  storeName?: string;
  /** Category label, shown as a small caption. */
  category?: string;
  /** Free-form badge label (e.g. "Bestseller", "Trending"). */
  tag?: string;
  /** Show a "New" badge. */
  isNew?: boolean;
  /** Link wrapping the whole card. Use a string href (rendered as <a>). */
  href?: string;
  /** Fired when the add-to-cart button is pressed. */
  onAddToCart?: () => void;
  /** Fired when the wishlist heart is pressed. */
  onWishlist?: () => void;
  /** Whether the product is already wishlisted (fills the heart). */
  isWishlisted?: boolean;
  /** Layout variant. */
  variant?: ProductCardVariant;
  /** Extra Tailwind classes for the outer element. */
  className?: string;
}

/**
 * Compute discount percentage from price + comparePrice.
 * Returns 0 when no discount applies.
 */
function computeDiscount(price: number, comparePrice?: number): number {
  if (!comparePrice || comparePrice <= price) return 0;
  return Math.round(((comparePrice - price) / comparePrice) * 100);
}

/**
 * Small rating row: ★ 4.5 (123)
 */
function RatingRow({ rating, reviewCount }: { rating: number; reviewCount?: number }) {
  return (
    <div
      className="flex items-center gap-1"
      aria-label={`Rated ${rating.toFixed(1)} out of 5${
        reviewCount !== undefined ? ` from ${reviewCount} reviews` : ""
      }`}
    >
      <Star className="h-3.5 w-3.5 fill-warning text-warning" aria-hidden="true" />
      <span className="text-xs font-semibold text-foreground">
        {rating.toFixed(1)}
      </span>
      {reviewCount !== undefined && (
        <span className="text-xs text-gray-500">({reviewCount})</span>
      )}
    </div>
  );
}

/**
 * Image placeholder shown when no image URL is provided.
 */
function ImagePlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-gray-100 text-gray-400",
        className,
      )}
      aria-hidden="true"
    >
      <ImageIcon className="h-10 w-10" strokeWidth={1.25} />
    </div>
  );
}

/**
 * ProductCard — generic, app-agnostic product card for the Kwikseller
 * marketplace, vendor portal, admin and future apps.
 *
 * Uses the unified OKLCH design tokens (primary=blue, secondary=orange,
 * gray=blue-gray). CTA buttons use the orange secondary palette; the
 * discount badge uses the red danger token for urgency.
 *
 * The card is keyboard accessible (the whole card is a link when `href`
 * is provided; the wishlist + add-to-cart buttons are real <button>s
 * with aria-labels and stopPropagation so they don't trigger navigation).
 */
export function ProductCard({
  image,
  imageAlt,
  name,
  price,
  comparePrice,
  rating,
  reviewCount,
  storeName,
  category,
  tag,
  isNew,
  href,
  onAddToCart,
  onWishlist,
  isWishlisted = false,
  variant = "default",
  className,
}: ProductCardProps) {
  const discount = computeDiscount(price, comparePrice);
  const altText = imageAlt ?? name;

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onWishlist?.();
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart?.();
  };

  // ── Horizontal variant ────────────────────────────────────────────
  if (variant === "horizontal") {
    return (
      <motion.article
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        whileHover={{ y: -2 }}
        className={cn(
          "group flex w-full cursor-pointer overflow-hidden rounded-xl border border-border bg-background transition-shadow hover:shadow-md",
          className,
        )}
      >
        <a
          href={href}
          className="flex w-full flex-row"
          aria-label={name}
          tabIndex={href ? 0 : -1}
        >
          {/* Image */}
          <div className="relative h-28 w-28 shrink-0 overflow-hidden bg-gray-100 sm:h-32 sm:w-32">
            {image ? (
              <img
                src={image}
                alt={altText}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <ImagePlaceholder />
            )}
            {discount > 0 && (
              <span className="absolute left-1.5 top-1.5 rounded-md bg-danger px-1.5 py-0.5 text-[10px] font-bold text-danger-foreground">
                -{discount}%
              </span>
            )}
          </div>

          {/* Body */}
          <div className="flex min-w-0 flex-1 flex-col gap-1 p-3">
            {storeName && (
              <span className="truncate text-[11px] font-medium text-primary-600">
                {storeName}
              </span>
            )}
            <h3 className="line-clamp-2 text-sm font-semibold text-foreground">
              {name}
            </h3>
            {rating !== undefined && <RatingRow rating={rating} reviewCount={reviewCount} />}
            <div className="mt-auto flex items-center justify-between gap-2 pt-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-bold text-foreground">
                  {formatCurrency(price)}
                </span>
                {comparePrice && comparePrice > price && (
                  <span className="text-xs text-gray-400 line-through">
                    {formatCurrency(comparePrice)}
                  </span>
                )}
              </div>
              {onAddToCart && (
                <button
                  type="button"
                  onClick={handleAddToCart}
                  aria-label={`Add ${name} to cart`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-secondary-500 text-white transition hover:bg-secondary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </a>
      </motion.article>
    );
  }

  // ── Compact variant ───────────────────────────────────────────────
  if (variant === "compact") {
    return (
      <motion.article
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        whileHover={{ y: -3 }}
        className={cn(
          "group w-full overflow-hidden rounded-xl border border-border bg-background transition-shadow hover:shadow-md",
          className,
        )}
      >
        <a href={href} aria-label={name} tabIndex={href ? 0 : -1} className="block">
          <div className="relative aspect-square overflow-hidden bg-gray-100">
            {image ? (
              <img
                src={image}
                alt={altText}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <ImagePlaceholder />
            )}
            {discount > 0 && (
              <span className="absolute left-1.5 top-1.5 rounded-md bg-danger px-1.5 py-0.5 text-[10px] font-bold text-danger-foreground">
                -{discount}%
              </span>
            )}
            {onWishlist && (
              <button
                type="button"
                onClick={handleWishlist}
                aria-label={isWishlisted ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
                aria-pressed={isWishlisted}
                className="absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-background/90 text-gray-500 shadow-sm backdrop-blur-sm transition hover:text-secondary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                <Heart
                  className={cn("h-3.5 w-3.5", isWishlisted && "fill-secondary-500 text-secondary-500")}
                  aria-hidden="true"
                />
              </button>
            )}
          </div>
          <div className="space-y-0.5 p-2.5">
            {storeName && (
              <span className="block truncate text-[11px] font-medium text-primary-600">
                {storeName}
              </span>
            )}
            <h4 className="line-clamp-1 text-sm font-medium text-foreground">
              {truncate(name, 40)}
            </h4>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold text-foreground">
                {formatCurrency(price)}
              </span>
              {comparePrice && comparePrice > price && (
                <span className="text-[11px] text-gray-400 line-through">
                  {formatCurrency(comparePrice)}
                </span>
              )}
            </div>
          </div>
        </a>
      </motion.article>
    );
  }

  // ── Default variant ───────────────────────────────────────────────
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      className={cn(
        "group flex w-full flex-col overflow-hidden rounded-xl border border-border bg-background transition-shadow hover:shadow-lg",
        className,
      )}
    >
      <a
        href={href}
        aria-label={name}
        tabIndex={href ? 0 : -1}
        className="block"
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {image ? (
            <img
              src={image}
              alt={altText}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <ImagePlaceholder />
          )}

          {/* Top-left badges */}
          <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
            {discount > 0 && (
              <span className="rounded-md bg-danger px-1.5 py-0.5 text-[11px] font-bold text-danger-foreground">
                -{discount}%
              </span>
            )}
            {isNew && (
              <span className="rounded-md bg-primary-500 px-1.5 py-0.5 text-[11px] font-bold text-primary-foreground">
                New
              </span>
            )}
            {tag && (
              <span className="rounded-md bg-gray-900 px-1.5 py-0.5 text-[11px] font-bold text-white">
                {tag}
              </span>
            )}
          </div>

          {/* Wishlist heart */}
          {onWishlist && (
            <button
              type="button"
              onClick={handleWishlist}
              aria-label={isWishlisted ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
              aria-pressed={isWishlisted}
              className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-gray-500 shadow-sm backdrop-blur-sm transition hover:text-secondary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              <Heart
                className={cn("h-4 w-4", isWishlisted && "fill-secondary-500 text-secondary-500")}
                aria-hidden="true"
              />
            </button>
          )}
        </div>
      </a>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {category && (
          <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
            {category}
          </span>
        )}
        {storeName && (
          <span className="truncate text-xs font-medium text-primary-600">
            {storeName}
          </span>
        )}
        <a href={href} aria-label={name} tabIndex={href ? 0 : -1}>
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-foreground">
            {name}
          </h3>
        </a>

        {rating !== undefined && (
          <RatingRow rating={rating} reviewCount={reviewCount} />
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <div className="flex min-w-0 flex-col">
            <span className="text-base font-bold text-foreground">
              {formatCurrency(price)}
            </span>
            {comparePrice && comparePrice > price && (
              <span className="text-xs text-gray-400 line-through">
                {formatCurrency(comparePrice)}
              </span>
            )}
          </div>
          {onAddToCart && (
            <button
              type="button"
              onClick={handleAddToCart}
              aria-label={`Add ${name} to cart`}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-secondary-500 px-3 text-xs font-semibold text-white transition hover:bg-secondary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <ShoppingCart className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Add</span>
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export default ProductCard;
