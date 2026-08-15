"use client";

/**
 * ProductCollectionPage
 * ---------------------
 * Shared layout for the curated product-collection routes:
 *   /products/trending
 *   /products/new-arrivals
 *   /products/top-rated
 *
 * Each route page is a thin wrapper that calls the relevant React Query
 * hook (`useTrending`, `useNewArrivals`, `useTopProducts`) and passes the
 * result here. This component owns the breadcrumb, header, client-side
 * sort dropdown, product grid, quick-view modal, and loading / empty /
 * error states — keeping the three route files trivial.
 */

import React, { useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  PackageOpen,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MarketplaceProductCard } from "@/components/landing/shared/marketplace-product-card";
import { ProductGridSkeleton } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import type { MarketplaceProduct } from "@/data/marketplace-home";

// Quick-view modal is dynamically imported (client-only) — same pattern as
// /categories and /products to keep the bundle small.
const QuickViewModal = dynamic(
  () =>
    import("@/components/landing/quick-view-modal").then(
      (mod) => mod.QuickViewModal,
    ),
  { ssr: false },
);

// ─── Sort options ───────────────────────────────────────────────────────────

type SortOption =
  | "relevance"
  | "price-asc"
  | "price-desc"
  | "rating"
  | "best-selling";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "best-selling", label: "Best Selling" },
];

// ─── Props ──────────────────────────────────────────────────────────────────

interface ProductCollectionQueryResult {
  data?: MarketplaceProduct[];
  isLoading: boolean;
  isError: boolean;
}

export interface ProductCollectionPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  queryResult: ProductCollectionQueryResult;
  breadcrumbLabel: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Read an optional `totalSales` field off a MarketplaceProduct, returning 0
 * when absent. The MarketplaceProduct interface doesn't officially declare
 * `totalSales`, but the underlying API Product model includes it — we
 * tolerate either shape so the "Best Selling" sort can use real sales data
 * when present, and fall back to rating otherwise.
 */
function readTotalSales(p: MarketplaceProduct): number {
  const v = (p as unknown as { totalSales?: unknown }).totalSales;
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ProductCollectionPage({
  title,
  description,
  icon: Icon,
  queryResult,
  breadcrumbLabel,
}: ProductCollectionPageProps) {
  const { data, isLoading, isError } = queryResult;
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [sortOpen, setSortOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] =
    useState<MarketplaceProduct | null>(null);

  // Client-side sort over the (already API-sorted) list. `relevance` keeps
  // the API's default ordering.
  const sortedProducts = useMemo<MarketplaceProduct[]>(() => {
    const list = (data ?? []).slice();
    switch (sortBy) {
      case "price-asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        list.sort((a, b) => b.rating - a.rating);
        break;
      case "best-selling": {
        // Prefer totalSales when the API supplied it; otherwise fall back
        // to rating (MarketplaceProduct has no totalSales by default).
        const hasTotalSales = list.some((p) => readTotalSales(p) > 0);
        if (hasTotalSales) {
          list.sort((a, b) => readTotalSales(b) - readTotalSales(a));
        } else {
          list.sort((a, b) => b.rating - a.rating);
        }
        break;
      }
      case "relevance":
      default:
        break;
    }
    return list;
  }, [data, sortBy]);

  const count = sortedProducts.length;
  const sortDisabled = isLoading || isError || count === 0;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <div className="border-b border-border bg-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav
            className="flex items-center gap-1.5 py-3 text-xs text-muted-foreground"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="transition-colors hover:text-kwik-orange">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" aria-hidden="true" />
            <Link
              href="/products"
              className="transition-colors hover:text-kwik-orange"
            >
              Products
            </Link>
            <ChevronRight className="h-3 w-3" aria-hidden="true" />
            <span className="font-medium text-foreground">{breadcrumbLabel}</span>
          </nav>

          {/* Title block */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex items-center gap-4 pb-5"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-kwik-orange-tint text-kwik-orange ring-1 ring-kwik-orange/20">
              <Icon className="h-7 w-7" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">
                {title}
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {description}
              </p>
            </div>
            {!isLoading && !isError && (
              <div className="hidden text-right sm:block">
                <span className="text-2xl font-bold text-foreground">
                  {count}
                </span>
                <span className="ml-1 text-sm text-muted-foreground">
                  product{count !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── Toolbar (sticky) ── */}
      <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 py-3">
            <p className="text-sm text-muted-foreground">
              {isLoading ? (
                "Loading products…"
              ) : isError ? (
                "Couldn\u2019t load products."
              ) : (
                <>
                  <span className="font-semibold text-foreground">{count}</span>{" "}
                  product{count !== 1 ? "s" : ""}
                </>
              )}
            </p>

            {/* Sort dropdown — mirrors the pattern in /categories/[id] */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setSortOpen((v) => !v)}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                aria-expanded={sortOpen}
                aria-haspopup="menu"
                disabled={sortDisabled}
              >
                <SlidersHorizontal className="h-4 w-4 text-kwik-orange" />
                <span className="hidden sm:inline">Sort:</span>
                <span className="max-w-[100px] truncate">
                  {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
                </span>
              </button>
              <AnimatePresence>
                {sortOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setSortOpen(false)}
                      aria-hidden="true"
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-lg border border-border bg-background shadow-lg"
                      role="menu"
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          role="menuitemradio"
                          aria-checked={sortBy === opt.value}
                          onClick={() => {
                            setSortBy(opt.value);
                            setSortOpen(false);
                          }}
                          className={cn(
                            "block w-full px-3 py-2.5 text-left text-sm transition-colors",
                            sortBy === opt.value
                              ? "bg-kwik-orange-tint font-medium text-kwik-orange"
                              : "text-foreground hover:bg-muted",
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Loading */}
        {isLoading && (
          <ProductGridSkeleton
            count={10}
            columns={4}
            className="sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
          />
        )}

        {/* Error */}
        {!isLoading && isError && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <PackageOpen className="h-7 w-7 text-muted-foreground" />
            </div>
            <h2 className="mt-5 text-lg font-semibold text-foreground">
              Something went wrong
            </h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              We couldn&apos;t load this collection right now. Please try again
              in a moment, or browse the full marketplace.
            </p>
            <Link
              href="/products"
              className="mt-5 inline-flex h-10 items-center justify-center rounded-md border border-kwik-orange px-5 text-sm font-semibold text-kwik-orange transition-colors hover:bg-kwik-orange-tint"
            >
              Browse all products
            </Link>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && count === 0 && (
          <EmptyState
            variant="default"
            title="No products found yet"
            description="This collection is empty right now. Check back soon, or explore the full marketplace."
            action={
              <Link
                href="/products"
                className="inline-flex h-11 items-center justify-center rounded-md bg-kwik-orange px-5 text-sm font-semibold text-white transition-colors hover:bg-kwik-orange-hover"
              >
                Browse all products
              </Link>
            }
          />
        )}

        {/* Product grid */}
        {!isLoading && !isError && count > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {sortedProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: Math.min(index * 0.03, 0.3),
                  ease: "easeOut",
                }}
              >
                <MarketplaceProductCard
                  product={product}
                  onQuickView={() => setQuickViewProduct(product)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Quick view ── */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}
