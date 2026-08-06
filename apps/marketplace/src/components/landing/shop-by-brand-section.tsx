"use client";

/**
 * ShopByBrandSection
 * ------------------
 * Horizontal-scrolling brand showcase for the home page.
 * Each brand card surfaces cover image, logo, rating, follower
 * count, and product count. Backed by the shared `useBrands` hook
 * (dummy API in dev, real backend in prod).
 *
 * Section header has "View all" → /brands, and the row supports
 * keyboard navigation (←/→) when focused.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Star,
  Users,
  Package,
  BadgeCheck,
  Sparkles,
} from "lucide-react";
import { useBrands } from "@/lib/api-hooks";
import { AppImage } from "@/components/ui/app-image";
import { fetchProducts, type Brand, type Product } from "@/lib/api";
import { cn } from "@/lib/utils";

/** Format a NGN price for the compact overlay thumbnail. */
function formatPriceShort(n: number): string {
  if (n >= 100_000) return `₦${(n / 1000).toFixed(0)}k`;
  if (n >= 1_000) return `₦${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return `₦${n}`;
}

function formatFollowers(n?: number): string {
  if (!n) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

function BrandCard({
  brand,
  index,
  topProducts = [],
}: {
  brand: Brand;
  index: number;
  topProducts?: Product[];
}) {
  const productCount = brand._count?.products ?? 0;
  const hasTopProducts = topProducts.length > 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.4), duration: 0.4 }}
      className="group relative w-[260px] shrink-0 overflow-hidden rounded-2xl border border-kwik-border-light bg-kwik-bg-surface shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-kwik-orange/10 sm:w-[280px]"
    >
      <Link href={`/brands/${brand.slug}`} className="block" aria-label={`Browse ${brand.name}`}>
        {/* Cover */}
        <div className="relative h-28 w-full overflow-hidden bg-gradient-to-br from-kwik-orange-tint/60 to-kwik-amber-tint/40">
          {brand.coverImage ? (
            <AppImage
              src={brand.coverImage}
              alt=""
              width={280}
              height={112}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Verified badge */}
          {brand.verified ? (
            <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-kwik-orange shadow-sm backdrop-blur">
              <BadgeCheck className="h-3 w-3" /> Verified
            </span>
          ) : null}

          {/* Top-products hover overlay — slides up from the bottom of the cover */}
          <div className="absolute inset-x-0 bottom-0 translate-y-full bg-black/70 backdrop-blur-sm px-3 py-2 text-white transition-transform duration-300 group-hover:translate-y-0">
            <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-white/80">
              <Sparkles className="h-3 w-3 text-kwik-orange" />
              Top products
            </div>
            {hasTopProducts ? (
              <div className="flex gap-2">
                {topProducts.map((p) => {
                  const mainImg = p.images?.find((i) => i.isMain)?.url ?? p.images?.[0]?.url;
                  return (
                    <Link
                      key={p.id}
                      href={`/products/${p.id}`}
                      className="group/thumb flex min-w-0 flex-1 flex-col items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`View ${p.name}`}
                    >
                      <AppImage
                        src={mainImg}
                        alt={p.name}
                        width={40}
                        height={40}
                        className="h-9 w-9 shrink-0 rounded-md border border-white/20 object-cover transition-transform duration-200 group-hover/thumb:scale-105"
                      />
                      <span className="w-full truncate text-center text-[9px] leading-tight text-white/90">
                        {p.name}
                      </span>
                      <span className="text-[10px] font-bold text-kwik-orange">
                        {formatPriceShort(p.price)}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-between gap-1 py-1 text-[11px] font-medium text-white/90">
                Browse all products
                <ArrowRight className="h-3.5 w-3.5 text-kwik-orange" />
              </div>
            )}
          </div>

          {/* Logo */}
          <div className="absolute -bottom-6 left-4 h-14 w-14 overflow-hidden rounded-xl border-4 border-kwik-bg-surface bg-kwik-bg-surface shadow-md">
            {brand.image ? (
              <AppImage
                src={brand.image}
                alt={brand.name}
                width={56}
                height={56}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-kwik-orange-tint text-kwik-orange">
                <Sparkles className="h-6 w-6" />
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="px-4 pb-4 pt-8">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-heading text-sm font-bold text-kwik-dark">
                {brand.name}
              </h3>
              {brand.tagline ? (
                <p className="mt-0.5 line-clamp-1 text-[11px] italic text-kwik-muted">
                  {brand.tagline}
                </p>
              ) : null}
            </div>
            {typeof brand.rating === "number" ? (
              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-kwik-amber-tint/60 px-1.5 py-0.5 text-[11px] font-bold text-kwik-amber">
                <Star className="h-3 w-3 fill-current" />
                {brand.rating.toFixed(1)}
              </span>
            ) : null}
          </div>

          {/* Stats */}
          <div className="mt-3 flex items-center gap-3 text-[11px] text-kwik-muted">
            <span className="inline-flex items-center gap-1">
              <Package className="h-3.5 w-3.5 text-kwik-orange/80" />
              {productCount} products
            </span>
            <span className="h-3 w-px bg-kwik-border-light" />
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-kwik-orange/80" />
              {formatFollowers(brand.followCount)} followers
            </span>
          </div>

          {/* Categories */}
          {brand.categories?.length ? (
            <div className="mt-3 flex flex-wrap gap-1">
              {brand.categories.slice(0, 3).map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-kwik-orange-tint/60 px-2 py-0.5 text-[10px] font-medium text-kwik-orange"
                >
                  {c}
                </span>
              ))}
            </div>
          ) : null}

          {/* CTA */}
          <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-kwik-orange transition-transform group-hover:translate-x-0.5">
            Shop brand <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function ShopByBrandSection() {
  const { data: brands = [], isLoading } = useBrands();
  // Fetch raw products once so each BrandCard can show the brand's top 3.
  // We use the raw Product shape (not MarketplaceProduct) because it carries
  // `brandId` and `totalSales` — needed to filter by brand and pick the best.
  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ["brand-section-products"],
    queryFn: async () => {
      const res = await fetchProducts({ limit: 100 });
      return res.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
  // Group the top 3 products (by totalSales) per brand id.
  const topProductsByBrand = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const p of allProducts) {
      if (!p.brandId) continue;
      const arr = map.get(p.brandId);
      if (arr) arr.push(p);
      else map.set(p.brandId, [p]);
    }
    for (const [id, arr] of map) {
      arr.sort((a, b) => (b.totalSales ?? 0) - (a.totalSales ?? 0));
      map.set(id, arr.slice(0, 3));
    }
    return map;
  }, [allProducts]);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [updateArrows, brands.length]);

  const scrollBy = useCallback((dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.min(el.clientWidth * 0.85, 720);
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  }, []);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        scrollBy(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        scrollBy(-1);
      }
    },
    [scrollBy],
  );

  if (!isLoading && brands.length === 0) return null;

  return (
    <section className="container-px py-2" aria-label="Shop by brand">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-kwik-orange-tint px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-kwik-orange">
            <Sparkles className="h-3 w-3" /> Featured brands
          </div>
          <h2 className="font-heading text-xl font-bold text-kwik-dark md:text-2xl">
            Shop by brand
          </h2>
          <p className="mt-1 text-sm text-kwik-muted">
            Discover authentic brands loved by buyers across Africa.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => scrollBy(-1)}
            disabled={!canLeft}
            className={cn(
              "hidden h-9 w-9 items-center justify-center rounded-full border border-kwik-border-light bg-background text-kwik-dark transition sm:flex",
              canLeft
                ? "hover:border-kwik-orange hover:text-kwik-orange hover:shadow-sm"
                : "cursor-not-allowed opacity-40",
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => scrollBy(1)}
            disabled={!canRight}
            className={cn(
              "hidden h-9 w-9 items-center justify-center rounded-full border border-kwik-border-light bg-background text-kwik-dark transition sm:flex",
              canRight
                ? "hover:border-kwik-orange hover:text-kwik-orange hover:shadow-sm"
                : "cursor-not-allowed opacity-40",
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <Link
            href="/brands"
            className="inline-flex h-9 items-center gap-1 rounded-full border border-kwik-border-light bg-background px-3 text-xs font-semibold text-kwik-dark transition hover:border-kwik-orange hover:text-kwik-orange"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="w-[260px] shrink-0 animate-pulse rounded-2xl border border-kwik-border-light bg-kwik-bg-surface sm:w-[280px]"
            >
              <div className="h-28 rounded-t-2xl bg-kwik-orange/5" />
              <div className="space-y-2 p-4 pt-8">
                <div className="h-3.5 w-2/3 rounded bg-kwik-orange/10" />
                <div className="h-3 w-1/2 rounded bg-kwik-orange/5" />
                <div className="h-3 w-3/4 rounded bg-kwik-orange/5" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          ref={scrollerRef}
          tabIndex={0}
          onKeyDown={onKeyDown}
          role="listbox"
          aria-label="Brand carousel"
          className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide focus:outline-none focus-visible:ring-2 focus-visible:ring-kwik-orange/40 focus-visible:ring-offset-2"
        >
          {brands.map((b, i) => (
            <BrandCard
              key={b.id}
              brand={b}
              index={i}
              topProducts={topProductsByBrand.get(b.id) ?? []}
            />
          ))}
        </div>
      )}
    </section>
  );
}
