"use client";

import React from "react";
import { Download, Heart, PackageCheck, ShoppingCart, Star, Users } from "lucide-react";
import { kwikToast } from "@kwikseller/utils";
import { useCartStore, useWishlistStore } from "@/stores";
import { AppImage } from "@/components/ui/app-image";
import type { MarketplaceProduct } from "@/data/marketplace-home";

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

function sourceBadge(product: MarketplaceProduct) {
  if (product.productSource === "POOL_RESALE") return { label: "Pool Resale", icon: Users };
  if (product.productSource === "GROUP_BUY") return { label: "Group Buy", icon: Users };
  if (product.productType === "DIGITAL") return { label: "Digital", icon: Download };
  return { label: "Vendor Stock", icon: PackageCheck };
}

export function MarketplaceProductCard({
  product,
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
  const badge = sourceBadge(product);

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      comparePrice: product.comparePrice,
      image: product.image,
      store: product.store,
      storeId: product.storeId,
      storeSlug: product.storeSlug,
      storeName: product.store,
      productType: product.productType,
      productSource: product.productSource,
      requiresShipping: product.requiresShipping,
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
      className="group relative flex w-full cursor-pointer flex-col border-b border-neutral-200 pb-4 dark:border-white/10"
      onClick={() => onQuickView?.(product)}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100 dark:bg-white/5">
        <AppImage
          src={product.image}
          alt={product.name}
          fallbackVariant="product"
          fallbackHint={product.category}
          className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
        />

        <div className="absolute left-2 top-2 flex max-w-[calc(100%-56px)] flex-wrap gap-1.5">
          {discount > 0 && (
            <span className="rounded-full bg-white/95 px-2 py-1 text-[11px] font-semibold text-[#111827] shadow-sm dark:bg-[#111827]/90 dark:text-white">
              -{discount}%
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleWishlistToggle();
          }}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-sm transition-all duration-200 hover:scale-110 dark:bg-[#111827]/90"
          aria-label={isWished ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            className={`h-4 w-4 transition-all duration-200 ${
              isWished ? "fill-kwik-orange text-kwik-orange" : "text-kwik-muted"
            }`}
          />
        </button>
      </div>

      <div className="mt-3 flex flex-1 flex-col space-y-3">
        <div>
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-kwik-dark dark:text-white">{product.name}</p>
          <div className="mt-1 flex items-center gap-2 text-xs text-kwik-muted dark:text-white/55">
            <span className="line-clamp-1">{product.store ?? "Verified vendor"}</span>
            <span className="inline-flex items-center gap-1">
              <Star className="h-3 w-3 fill-kwik-star text-kwik-star" />
              {product.rating.toFixed(1)}
            </span>
          </div>
          <p className="mt-1 line-clamp-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
            {badge.label}
          </p>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] text-kwik-muted dark:text-white/55">Vendor price</p>
            {product.comparePrice && (
              <p className="text-[10px] text-kwik-muted line-through dark:text-white/45">{formatPrice(product.comparePrice)}</p>
            )}
            <p className="text-base font-bold text-kwik-dark dark:text-white">{formatPrice(product.price)}</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAddToCart();
            }}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-kwik-dark px-3 text-xs font-semibold text-white transition hover:bg-black"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Cart
          </button>
        </div>
      </div>
    </article>
  );
}
