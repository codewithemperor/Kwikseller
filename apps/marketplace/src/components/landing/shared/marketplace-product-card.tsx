"use client";

import React from "react";
import { Download, Eye, Heart, PackageCheck, ShoppingBag, Star, Users } from "lucide-react";
import { kwikToast } from "@kwikseller/utils";
import { useCartStore, useWishlistStore } from "@/stores";
import { AppImage } from "@/components/ui/app-image";
import { CompareToggle } from "@/components/landing/compare-panel";
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
  const BadgeIcon = badge.icon;

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
      className="group relative flex w-full cursor-pointer flex-col overflow-hidden border border-neutral-200 bg-white transition-all duration-300 hover:border-kwik-dark dark:border-white/10 dark:bg-white/5 dark:hover:border-white/50"
      onClick={() => onQuickView?.(product)}
    >
      <div className="relative aspect-square overflow-hidden bg-neutral-100">
        <AppImage
          src={product.image}
          alt={product.name}
          fallbackVariant="product"
          fallbackHint={product.category}
          className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
        />

        <div className="absolute left-3 top-3 flex max-w-[calc(100%-72px)] flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 text-[10px] font-semibold text-[#111827]">
            <BadgeIcon className="h-3 w-3" />
            {badge.label}
          </span>
          {discount > 0 && (
            <span className="bg-white px-2 py-0.5 text-[11px] font-semibold text-[#111827]">
              -{discount}%
            </span>
          )}
          {product.isNew && (
            <span className="bg-white px-2 py-0.5 text-[11px] font-semibold text-[#111827]">
              New
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleWishlistToggle();
          }}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white transition-all duration-200 hover:scale-110"
          aria-label={isWished ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            className={`h-4 w-4 transition-all duration-200 ${
              isWished ? "fill-kwik-orange text-kwik-orange" : "text-kwik-muted"
            }`}
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2 px-3 pb-3 pt-3">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-kwik-dark dark:text-white">{product.name}</p>

        <div className="flex items-end justify-between pb-3 pt-0.5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-kwik-muted dark:text-white/50">{product.store}</p>
            <div className="flex items-center gap-1 text-[11px]">
              <Star className="h-3 w-3 fill-kwik-star text-kwik-star" />
              <span className="font-semibold text-kwik-dark-medium dark:text-white/75">{product.rating.toFixed(1)}</span>
            </div>
          </div>
          <div className="text-right">
            {product.comparePrice && (
              <p className="text-[10px] text-kwik-muted line-through dark:text-white/45">{formatPrice(product.comparePrice)}</p>
            )}
            <p className="text-xs font-bold text-kwik-dark dark:text-white">{formatPrice(product.price)}</p>
          </div>
        </div>

        <div className="mt-auto flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAddToCart();
            }}
            className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md bg-[#f3f5f2] text-[10px] font-medium text-kwik-dark-medium transition-colors hover:bg-kwik-dark hover:text-white"
          >
            <ShoppingBag className="h-3 w-3" />
            Add to Cart
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickView?.(product);
            }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#f3f5f2] transition-colors hover:bg-kwik-orange-tint hover:text-kwik-orange"
            aria-label="Quick view"
          >
            <Eye className="h-3.5 w-3.5 text-kwik-gray-light" />
          </button>
          <CompareToggle
            product={{
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
            }}
          />
        </div>
      </div>
    </article>
  );
}
