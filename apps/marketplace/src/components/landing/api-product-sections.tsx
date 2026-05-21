"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Flame,
  Heart,
  Loader2,
  PackageOpen,
  ShoppingCart,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import { kwikToast } from "@kwikseller/utils";
import { productsApi } from "@kwikseller/api-client";
import { useCartStore, useWishlistStore } from "@/stores";
import { AppImage } from "@/components/ui/app-image";
import { EmptyState } from "@/components/ui/empty-state";
import { toSearchableProduct, type SearchableProduct } from "@/data/products";
import type { MarketplaceProduct } from "@/data/marketplace-home";
import dynamic from "next/dynamic";

const QuickViewModal = dynamic(
  () =>
    import("@/components/landing/quick-view-modal").then(
      (mod) => mod.QuickViewModal,
    ),
  { ssr: false },
);

/* ─── Stagger animation helpers ──────────────────────────── */
const staggerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const staggerChildVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

function StaggerWrap({ children }: { children: React.ReactNode }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-30px" });
  return (
    <motion.div ref={ref} initial="hidden" animate={inView ? "visible" : "hidden"} variants={staggerVariants}>
      {children}
    </motion.div>
  );
}
function StaggerChild({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <motion.div variants={staggerChildVariants} className={className}>{children}</motion.div>;
}

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

export function ApiProductCard({
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
      className="group relative flex w-full flex-col border-b border-neutral-200 pb-4 transition-colors dark:border-white/10 cursor-pointer"
      onClick={() => onQuickView?.(product)}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-kwik-bg-light dark:bg-white/5">
        <AppImage
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute left-2 top-2 flex max-w-[calc(100%-56px)] gap-1.5">
          {discount > 0 && (
            <span className="rounded-full bg-white/95 px-2 py-1 text-[11px] font-semibold text-[#111827] shadow-sm dark:bg-[#111827]/90 dark:text-white">
              -{discount}%
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleWishlistToggle}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/95 shadow-sm backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-background dark:bg-[#111827]/90"
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
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-kwik-dark dark:text-white">
            {product.name}
          </p>
          <div className="mt-1 flex items-center gap-2 text-xs text-kwik-muted dark:text-white/55">
            <span className="line-clamp-1">{product.store ?? "Verified vendor"}</span>
            <span className="inline-flex items-center gap-1">
              <Star className="h-3 w-3 fill-kwik-star text-kwik-star" />
              {product.rating.toFixed(1)}
            </span>
          </div>
          <p className="mt-1 line-clamp-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
            Vendor Stock
          </p>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] text-kwik-muted dark:text-white/55">Vendor price</p>
            {product.comparePrice && (
              <p className="text-[10px] text-kwik-muted line-through dark:text-white/45">
                {formatPrice(product.comparePrice)}
              </p>
            )}
            <p className="text-base font-bold text-kwik-dark dark:text-white">
              {formatPrice(product.price)}
            </p>
          </div>
          <button
            onClick={handleAddToCart}
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
            setProducts(response.data.map(toSearchableProduct));
          }
        }
      } catch {
        // No fallback — show empty state
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
        ) : products.length === 0 ? (
          <EmptyState
            icon={<PackageOpen className="h-8 w-8" />}
            title="No trending products yet"
            description="Products will appear here as they gain popularity."
          />
        ) : (
          <StaggerWrap>
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-2">
                {products.map((product) => (
                  <StaggerChild key={product.id} className="min-w-0 shrink-0 basis-[calc(50%-8px)] sm:basis-[calc(33.33%-11px)] lg:basis-[calc(25%-12px)] xl:basis-[calc(20%-13px)] p-0.5">
                    <ApiProductCard
                      product={product}
                      onQuickView={handleQuickView}
                    />
                  </StaggerChild>
                ))}
              </div>
            </div>
          </StaggerWrap>
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
            setProducts(response.data.map(toSearchableProduct));
          }
        }
      } catch {
        // No fallback — show empty state
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
        ) : products.length === 0 ? (
          <EmptyState
            icon={<PackageOpen className="h-8 w-8" />}
            title="No top rated products yet"
            description="Rated products will appear here once customers start reviewing."
          />
        ) : (
          <StaggerWrap>
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-2">
                {products.map((product) => (
                  <StaggerChild key={product.id} className="min-w-0 shrink-0 basis-[calc(50%-8px)] sm:basis-[calc(33.33%-11px)] lg:basis-[calc(25%-12px)] xl:basis-[calc(20%-13px)] p-0.5">
                    <ApiProductCard
                      product={product}
                      onQuickView={handleQuickView}
                    />
                  </StaggerChild>
                ))}
              </div>
            </div>
          </StaggerWrap>
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
            setProducts(response.data.map(toSearchableProduct));
          }
        }
      } catch {
        // No fallback — show empty state
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
        ) : products.length === 0 ? (
          <EmptyState
            icon={<PackageOpen className="h-8 w-8" />}
            title="No deals available yet"
            description="Check back soon for exclusive discounts and offers."
          />
        ) : (
          <StaggerWrap>
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-2">
                {products.map((product) => (
                  <StaggerChild key={product.id} className="min-w-0 shrink-0 basis-[calc(50%-8px)] sm:basis-[calc(33.33%-11px)] lg:basis-[calc(25%-12px)] xl:basis-[calc(20%-13px)] p-0.5">
                    <ApiProductCard
                      product={product}
                      onQuickView={handleQuickView}
                    />
                  </StaggerChild>
                ))}
              </div>
            </div>
          </StaggerWrap>
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
