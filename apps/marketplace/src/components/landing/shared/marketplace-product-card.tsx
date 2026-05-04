"use client";

/**
 * marketplace-product-card.tsx
 * Compact product card matching the TON Merano Chair reference design,
 * with full cart and wishlist functionality.
 */

import React from "react";
import { Eye, Heart, ShoppingBag, Star } from "lucide-react";
import { kwikToast } from "@kwikseller/utils";
import { useCartStore, useWishlistStore } from "@/stores";
import { AppImage } from "@/components/ui/app-image";
import { CompareToggle } from "@/components/landing/compare-panel";
import type { MarketplaceProduct } from "@/data/marketplace-home";

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
function formatPrice(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(n);
}

function discountPct(price: number, compare?: number) {
  if (!compare) return 0;
  return Math.round(((compare - price) / compare) * 100);
}

/* ─────────────────────────────────────────────
   Compact Product Card
   Matches reference: image area → specs row → brand / price footer
   Includes cart and wishlist functionality
───────────────────────────────────────────── */
export function MarketplaceProductCard({
  product,
  priority = false,
  onQuickView,
}: {
  product: MarketplaceProduct;
  priority?: boolean;
  onQuickView?: (p: MarketplaceProduct) => void;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const { toggleItem, isInWishlist } = useWishlistStore();
  const isWished = isInWishlist(product.id);
  const discount = discountPct(product.price, product.comparePrice);

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      comparePrice: product.comparePrice,
      image: product.image,
      store: product.store,
    });
    kwikToast.success(`${product.name} added to cart`);
  };

  const handleWishlistToggle = () => {
    toggleItem({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.comparePrice,
      image: product.image,
      rating: product.rating,
      category: product.category,
    });
    kwikToast.success(isWished ? "Removed from wishlist" : "Added to wishlist");
  };

  return (
    <article
      className="group relative flex w-full flex-col overflow-hidden rounded-[22px] bg-background shadow-sm ring-1 ring-border transition-all duration-300 hover:shadow-md hover-lift press-scale card-hover-border cursor-pointer"
      onClick={() => onQuickView?.(product)}
    >
      {/* ── Image ── */}
      <div className="relative aspect-square overflow-hidden rounded-[18px] m-2 bg-kwik-bg-light">
        <AppImage
          src={product.image}
          alt={product.name}
          fallbackVariant="product"
          fallbackHint={product.category}
          className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-110"
        />

        {/* Badges */}
        <div className="absolute left-3 top-3 flex gap-1.5">
          {discount > 0 && (
            <span className="rounded-lg bg-kwik-badge-dark px-2 py-0.5 text-[11px] font-semibold text-white">
              -{discount}%
            </span>
          )}
          {product.isNew && (
            <span className="rounded-lg bg-background/90 px-2 py-0.5 text-[11px] font-semibold text-kwik-dark">
              New
            </span>
          )}
        </div>

        {/* Wishlist button */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleWishlistToggle(); }}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 shadow-sm backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-background"
          aria-label={isWished ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            className={`h-4 w-4 transition-all duration-200 ${
              isWished ? "fill-kwik-orange text-kwik-orange" : "text-kwik-muted"
            }`}
          />
        </button>


      </div>

      <div className="flex flex-1 flex-col gap-2 px-3 pb-3 pt-2">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-kwik-dark">
          {product.name}
        </p>

        {/* ── Footer ── */}
        <div className="flex items-end justify-between pb-3 pt-0.5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-kwik-muted">
              {product.store}
            </p>
            <div className="flex items-center gap-1 rounded-xl text-[11px]">
              <Star className="h-3 w-3 fill-kwik-star text-kwik-star" />
              <span className="font-semibold text-kwik-dark-medium">
                {product.rating.toFixed(1)}
              </span>
            </div>
          </div>
          <div className="text-right">
            {product.comparePrice && (
              <p className="text-[10px] text-kwik-muted line-through">
                {formatPrice(product.comparePrice)}
              </p>
            )}
            <p className="text-xs font-bold text-kwik-dark">
              {formatPrice(product.price)}
            </p>
          </div>
        </div>

        {/* Bottom action row - always visible */}
        <div className="flex items-center gap-2 mt-auto">
          <button
            onClick={(e) => { e.stopPropagation(); handleAddToCart(); }}
            className="flex h-7 flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent-soft-hover hover text-[10px] font-medium text-kwik-dark-medium transition-colors"
          >
            <ShoppingBag className="h-3 w-3" />
            Add to Cart
          </button>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onQuickView?.(product); }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-kwik-bg-light transition-colors hover:bg-kwik-orange-tint hover:text-kwik-orange"
            aria-label="Quick view"
          >
            <Eye className="h-3.5 w-3.5 text-kwik-gray-light" />
          </button>
          <CompareToggle product={{
            id: product.id,
            name: product.name,
            price: product.price,
            comparePrice: product.comparePrice,
            image: product.image,
            category: product.category,
            rating: product.rating,
            reviews: product.reviewCount || 0,
            store: product.store,
            specs: {},
          }} />
        </div>
      </div>
    </article>
  );
}
