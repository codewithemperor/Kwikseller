"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  Flame,
  Heart,
  Loader2,
  ShoppingBag,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react";
import { kwikToast } from "@kwikseller/utils";
import { productsApi } from "@kwikseller/api-client";
import { useCartStore, useWishlistStore } from "@/stores";
import type { SearchableProduct } from "@/data/products";
import type { MarketplaceProduct } from "@/data/marketplace-home";
import dynamic from "next/dynamic";

const QuickViewModal = dynamic(
  () =>
    import("@/components/landing/quick-view-modal").then(
      (mod) => mod.QuickViewModal,
    ),
  { ssr: false },
);

/* ─── Helpers ──────────────────────────────────────────────── */

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

/* ─── Product Card ─────────────────────────────────────────── */

function ApiProductCard({
  product,
  onQuickView,
}: {
  product: SearchableProduct;
  onQuickView?: (p: SearchableProduct) => void;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const { toggleItem, isInWishlist } = useWishlistStore();
  const isWished = isInWishlist(product.id);
  const discount = discountPct(product.price, product.comparePrice);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleItem({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.comparePrice,
      image: product.image,
      rating: product.rating,
      category: product.categorySlug,
    });
    kwikToast.success(isWished ? "Removed from wishlist" : "Added to wishlist");
  };

  return (
    <article
      className="group relative flex w-full flex-col overflow-hidden rounded-[22px] bg-background shadow-sm border  transition-shadow hover:shadow-md cursor-pointer"
      onClick={() => onQuickView?.(product)}
    >
      <div className="relative aspect-square overflow-hidden rounded-[18px] m-2 bg-kwik-bg-light">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 60vw, 20vw"
          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
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
        <button
          type="button"
          onClick={handleWishlistToggle}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 shadow-sm backdrop-blur-sm transition-colors hover:bg-background"
          aria-label={isWished ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            className={`h-4 w-4 transition-colors ${
              isWished ? "fill-kwik-orange text-kwik-orange" : "text-kwik-muted"
            }`}
          />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-2 px-3 pb-3 pt-2">
        <p className="line-clamp-1 text-base font-semibold leading-snug text-kwik-dark">
          {product.name}
        </p>
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
        <div className="flex items-center gap-2 mt-auto">
          <button
            onClick={handleAddToCart}
            className="flex h-7 flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent hover text-[10px] md:text-xs font-medium text-white transition-colors"
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
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-kwik-bg-light transition-colors hover:bg-kwik-orange-tint hover:text-kwik-orange"
            aria-label="Quick view"
          >
            <Eye className="h-3.5 w-3.5 text-kwik-gray-light" />
          </button>
        </div>
      </div>
    </article>
  );
}

/* ─── Convert for QuickViewModal ──────────────────────────── */

function toMarketplaceProduct(p: SearchableProduct): MarketplaceProduct {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    comparePrice: p.comparePrice,
    image: p.image,
    rating: p.rating,
    reviewCount: p.reviewCount,
    store: p.store,
    category: p.categorySlug,
    isNew: p.isNew,
    tag: p.category,
    description: p.description,
    images: [p.image],
    features: p.tags.slice(0, 4),
    specifications: [],
    reviews: [],
  };
}

/* ─── Section Wrapper ─────────────────────────────────────── */

function SectionShell({
  icon,
  iconBg,
  title,
  subtitle,
  viewAllHref,
  children,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  viewAllHref: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <section className="bg-kwik-bg-page py-6 sm:py-8">
      <div className="container mx-auto px-0 md:px-4">
        <div className="rounded-[24px] border border-kwik-border bg-background p-4 shadow-sm sm:p-6">
          {/* Header */}
          <div className="mb-5 flex items-center justify-between border-b border-kwik-border pb-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-2xl ${iconBg}`}
              >
                {icon}
              </div>
              <div>
                <h2 className="text-lg font-bold text-kwik-dark sm:text-xl">
                  {title}
                </h2>
                <p className="text-xs text-kwik-gray-light sm:text-sm">
                  {subtitle}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.push(viewAllHref)}
              className="flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium text-kwik-orange transition-colors hover:bg-kwik-orange-tint sm:text-sm"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Content */}
          {children}
        </div>
      </div>
    </section>
  );
}

/* ─── Trending Products Section ───────────────────────────── */

export function TrendingProductsSection() {
  const [products, setProducts] = useState<SearchableProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quickViewProduct, setQuickViewProduct] =
    useState<MarketplaceProduct | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await productsApi.getTrending({ limit: 10 });
        if (response.success && response.data) {
          if (Array.isArray(response.data)) {
            setProducts(response.data as unknown as SearchableProduct[]);
          }
        }
      } catch {
        // Fallback: use local data
        const { getFeaturedProducts } = await import("@/data/products");
        setProducts(getFeaturedProducts(10));
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  const handleQuickView = useCallback((p: SearchableProduct) => {
    setQuickViewProduct(toMarketplaceProduct(p));
  }, []);

  return (
    <>
      <SectionShell
        icon={<Flame className="h-5 w-5 text-kwik-orange" />}
        iconBg="bg-kwik-orange-tint"
        title="Trending Now"
        subtitle="Popular items shoppers are adding to cart right now."
        viewAllHref="/search?q=trending"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-kwik-orange" />
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-2">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="min-w-0 shrink-0 basis-[calc(60%-8px)] sm:basis-[calc(33.33%-11px)] lg:basis-[calc(25%-12px)] xl:basis-[calc(20%-13px)] p-0.5"
                >
                  <ApiProductCard
                    product={product}
                    onQuickView={handleQuickView}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </SectionShell>

      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </>
  );
}

/* ─── Top Products Section ────────────────────────────────── */

export function TopProductsSection() {
  const [products, setProducts] = useState<SearchableProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quickViewProduct, setQuickViewProduct] =
    useState<MarketplaceProduct | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await productsApi.getTopProducts({ limit: 10 });
        if (response.success && response.data) {
          if (Array.isArray(response.data)) {
            setProducts(response.data as unknown as SearchableProduct[]);
          }
        }
      } catch {
        const { allProducts } = await import("@/data/products");
        setProducts(
          [...allProducts].sort((a, b) => b.rating - a.rating).slice(0, 10),
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  const handleQuickView = useCallback((p: SearchableProduct) => {
    setQuickViewProduct(toMarketplaceProduct(p));
  }, []);

  return (
    <>
      <SectionShell
        icon={<TrendingUp className="h-5 w-5 text-kwik-green" />}
        iconBg="bg-green-50 dark:bg-green-950/30"
        title="Top Rated Products"
        subtitle="Highest-rated items trusted by thousands of shoppers."
        viewAllHref="/search?q=top+rated"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-kwik-orange" />
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-2">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="min-w-0 shrink-0 basis-[calc(60%-8px)] sm:basis-[calc(33.33%-11px)] lg:basis-[calc(25%-12px)] xl:basis-[calc(20%-13px)] p-0.5"
                >
                  <ApiProductCard
                    product={product}
                    onQuickView={handleQuickView}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </SectionShell>

      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </>
  );
}

/* ─── Deal of the Day Section ─────────────────────────────── */

export function DealOfTheDaySection() {
  const [products, setProducts] = useState<SearchableProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quickViewProduct, setQuickViewProduct] =
    useState<MarketplaceProduct | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await productsApi.getDeals({ limit: 10 });
        if (response.success && response.data) {
          if (Array.isArray(response.data)) {
            setProducts(response.data as unknown as SearchableProduct[]);
          }
        }
      } catch {
        const { allProducts } = await import("@/data/products");
        setProducts(
          allProducts
            .filter((p) => p.comparePrice && p.comparePrice > p.price)
            .sort((a, b) => {
              const dA = a.comparePrice
                ? ((a.comparePrice - a.price) / a.comparePrice) * 100
                : 0;
              const dB = b.comparePrice
                ? ((b.comparePrice - b.price) / b.comparePrice) * 100
                : 0;
              return dB - dA;
            })
            .slice(0, 10),
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  const handleQuickView = useCallback((p: SearchableProduct) => {
    setQuickViewProduct(toMarketplaceProduct(p));
  }, []);

  return (
    <>
      <SectionShell
        icon={<Zap className="h-5 w-5 text-kwik-red" />}
        iconBg="bg-red-50 dark:bg-red-950/30"
        title="Deal of the Day"
        subtitle="Biggest discounts — grab them before they're gone!"
        viewAllHref="/search?q=deals"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-kwik-orange" />
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-2">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="min-w-0 shrink-0 basis-[calc(60%-8px)] sm:basis-[calc(33.33%-11px)] lg:basis-[calc(25%-12px)] xl:basis-[calc(20%-13px)] p-0.5"
                >
                  <ApiProductCard
                    product={product}
                    onQuickView={handleQuickView}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </SectionShell>

      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </>
  );
}
