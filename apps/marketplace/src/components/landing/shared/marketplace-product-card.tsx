"use client";

import React from "react";
import { Check, Heart, Scale, ShoppingCart, Star } from "lucide-react";
import { kwikToast } from "@/lib/toast";
import { useCartStore, useCompareStore, useWishlistStore } from "@/stores";
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

export function MarketplaceProductCard({
  product,
  onQuickView,
}: {
  product: MarketplaceProduct;
  priority?: boolean;
  onQuickView?: (p: MarketplaceProduct) => void;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const isInCart = useCartStore((s) => s.items.some((item) => item.productId === product.id));
  const { toggleItem, isInWishlist } = useWishlistStore();
  const { addProduct, isInCompare, setOpen } = useCompareStore();
  const isWished = isInWishlist(product.id);
  const isCompared = isInCompare(product.id);
  const discount = discountPct(product.price, product.comparePrice);

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

  const handleCompare = () => {
    const success = addProduct({
      id: product.id,
      name: product.name,
      price: product.price,
      comparePrice: product.comparePrice,
      image: product.image,
      category: product.category,
      rating: product.rating,
      reviews: product.reviewCount,
      store: product.store ?? "Verified vendor",
      specs: {
        "Seller price": formatPrice(product.price),
        "Market price": product.comparePrice ? formatPrice(product.comparePrice) : "Not available",
        Savings: product.comparePrice ? formatPrice(product.comparePrice - product.price) : "Not available",
        Store: product.store ?? "Verified vendor",
        Category: product.category,
      },
    });

    if (!success) {
      kwikToast.warning("You can compare up to 4 products at a time. Remove one first.");
      return;
    }

    setOpen(true);
    kwikToast.success(isCompared ? "Comparison opened" : "Added to comparison");
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
      <div className="relative aspect-[3/4] min-h-[148px] overflow-hidden bg-neutral-100 dark:bg-white/5 sm:min-h-[190px] md:aspect-[4/5]">
        <AppImage
          src={product.image}
          alt={product.name}
          fallbackVariant="product"
          fallbackHint={product.category}
          className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
        />

        <div className="absolute left-2 top-2 flex max-w-[calc(100%-56px)] flex-wrap gap-1.5">
          {discount > 0 && (
            <span className="rounded-full bg-kwik-orange px-2 py-1 text-[11px] font-semibold text-white shadow-sm">
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
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/95 shadow-sm transition-all duration-200 hover:scale-110"
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
          {/* Reserve space for 2 title lines so cards with 1-line and 2-line
              titles keep a consistent height (spec #12). leading-snug at
              text-sm ≈ 1.2rem per line → min-h reserves exactly 2 lines. */}
          <p className="line-clamp-2 min-h-[2.4rem] text-sm font-semibold leading-snug text-kwik-dark dark:text-white">{product.name}</p>
          <div className="mt-1 flex items-center gap-2 text-xs text-kwik-muted dark:text-white/55">
            <span className="line-clamp-1">{product.store ?? "Verified vendor"}</span>
            <span className="inline-flex items-center gap-1">
              <Star className="h-3 w-3 fill-kwik-star text-kwik-star" />
              {product.rating.toFixed(1)}
            </span>
          </div>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3">
          <div>
            {product.comparePrice && (
              <p className="text-[10px] text-kwik-muted line-through dark:text-white/45">{formatPrice(product.comparePrice)}</p>
            )}
            <p className="text-base font-bold text-kwik-dark dark:text-white">{formatPrice(product.price)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCompare();
              }}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-md border text-white transition ${
                isCompared
                  ? "border-kwik-orange bg-kwik-orange"
                  : "border-white/10 bg-kwik-blue hover:bg-kwik-blue/90 dark:bg-white/10 dark:hover:bg-white/15"
              }`}
              aria-label={isCompared ? "Open comparison" : "Compare price"}
            >
              <Scale className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart();
              }}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-white transition ${
                isInCart ? "bg-emerald-600 hover:bg-emerald-700" : "bg-kwik-orange hover:bg-kwik-orange-hover"
              }`}
              aria-label={isInCart ? "Added to cart" : "Add to cart"}
            >
              {isInCart ? <Check className="h-3.5 w-3.5" /> : <ShoppingCart className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
