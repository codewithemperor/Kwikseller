"use client";

/**
 * marketplace-product-card.tsx
 * Compact product card matching the TON Merano Chair reference design,
 * with full cart and wishlist functionality.
 */

import Image from "next/image";
import React from "react";
import { Eye, Heart, ShoppingBag, Star } from "lucide-react";
import { kwikToast } from "@kwikseller/utils";
import { useCartStore, useWishlistStore } from "@/stores";
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

  // Extract dimensions from product or use defaults
  const dimensions = product.dimensions?.split("x").map((d) => d.trim()) || [
    "58",
    "79",
    "60",
  ];

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
    <article className="group relative flex w-full flex-col overflow-hidden rounded-[22px] bg-white shadow-sm ring-1 ring-black/4 transition-shadow hover:shadow-md">
      {/* ── Image ── */}
      <div className="relative aspect-square overflow-hidden rounded-[18px] m-2 bg-[#f3f4f6]">
        <Image
          src={product.image}
          alt={product.name}
          fill
          priority={priority}
          sizes="(max-width: 640px) 50vw, 25vw"
          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />

        {/* Badges */}
        <div className="absolute left-3 top-3 flex gap-1.5">
          {discount > 0 && (
            <span className="rounded-lg bg-[#1c1c1e] px-2 py-0.5 text-[11px] font-semibold text-white">
              -{discount}%
            </span>
          )}
          {product.isNew && (
            <span className="rounded-lg bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-[#111827]">
              New
            </span>
          )}
        </div>

        {/* Wishlist button */}
        <button
          type="button"
          onClick={handleWishlistToggle}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
          aria-label={isWished ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            className={`h-4 w-4 transition-colors ${
              isWished ? "fill-[#ea580c] text-[#ea580c]" : "text-[#9ca3af]"
            }`}
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2 px-3 pb-3 pt-2">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-[#111827]">
          {product.name}
        </p>

        {/* ── Footer ── */}
        <div className="flex items-end justify-between pb-3 pt-0.5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9ca3af]">
              {product.store}
            </p>
            <div className="flex items-center gap-1 rounded-xl text-[11px]">
              <Star className="h-3 w-3 fill-[#f59e0b] text-[#f59e0b]" />
              <span className="font-semibold text-[#374151]">
                {product.rating.toFixed(1)}
              </span>
            </div>
          </div>
          <div className="text-right">
            {product.comparePrice && (
              <p className="text-[10px] text-[#9ca3af] line-through">
                {formatPrice(product.comparePrice)}
              </p>
            )}
            <p className="text-xs font-bold text-[#111827]">
              {formatPrice(product.price)}
            </p>
          </div>
        </div>

        {/* Add to Cart + Eye */}
        <div className="flex items-center gap-2 mt-auto">
          <button
            onClick={handleAddToCart}
            className="flex h-7 flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent-soft-hover hover text-[10px] font-medium text-[#374151] transition-colors"
          >
            <ShoppingBag className="h-3 w-3" />
            Add to Cart
          </button>

          <button
            type="button"
            onClick={() => onQuickView?.(product)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#f3f4f6] transition-colors hover:bg-[#fff7ed] hover:text-[#ea580c]"
            aria-label="Quick view"
          >
            <Eye className="h-3.5 w-3.5 text-[#6b7280]" />
          </button>
        </div>
      </div>
    </article>
  );
}
