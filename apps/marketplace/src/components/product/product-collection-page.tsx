"use client";

/**
 * ProductCollectionPage
 * ---------------------
 * Shared layout for the curated product-collection routes:
 *   /products/trending
 *   /products/new-arrivals
 *   /products/top-rated
 *
 * Each route page is a thin wrapper that passes an infinite product query
 * result here. This component owns the breadcrumb, header, client-side
 * sort dropdown, product grid, quick-view modal, infinite loader, and
 * loading / empty / error states — keeping the three route files trivial.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, PackageOpen, type LucideIcon } from "lucide-react";
import { MarketplaceProductCard } from "@/components/landing/shared/marketplace-product-card";
import { ProductListingToolbar } from "@/components/product/product-listing-toolbar";
import { useHeaderSearch } from "@/components/layout/marketplace-shell-context";
import { ProductGridSkeleton } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import type { MarketplaceProduct } from "@/data/marketplace-home";
import { productMatchesQuery } from "@/lib/product-search";

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
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
}

export interface ProductCollectionPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  queryResult: ProductCollectionQueryResult;
  breadcrumbLabel: string;
  onSearchFallback?: (query: string) => void;
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
  queryResult,
  breadcrumbLabel,
  onSearchFallback,
}: ProductCollectionPageProps) {
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = queryResult;
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [quickViewProduct, setQuickViewProduct] =
    useState<MarketplaceProduct | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedSearchQuery(searchQuery.trim()),
      300,
    );
    return () => window.clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    if (!onSearchFallback) return;

    const term = debouncedSearchQuery.trim();
    if (!term) {
      onSearchFallback("");
      return;
    }

    if (isLoading) return;

    const hasLoadedMatch = (data ?? []).some((product) =>
      productMatchesQuery(product, term),
    );

    if (!hasLoadedMatch) {
      onSearchFallback(term);
    }
  }, [data, debouncedSearchQuery, isLoading, onSearchFallback]);

  // Client-side sort over the (already API-sorted) list. `relevance` keeps
  // the API's default ordering.
  const sortedProducts = useMemo<MarketplaceProduct[]>(() => {
    const list = (data ?? [])
      .filter((product) => productMatchesQuery(product, debouncedSearchQuery))
      .slice();
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
  }, [data, debouncedSearchQuery, sortBy]);

  const count = sortedProducts.length;
  const sortDisabled = isLoading || isError || count === 0;
  const headerSearchConfig = useMemo(
    () => ({
      value: searchQuery,
      onChange: setSearchQuery,
      placeholder: `Search ${breadcrumbLabel.toLowerCase()} products...`,
      onToggleFilters: undefined,
      showFilters: false,
      activeFilterCount: 0,
    }),
    [breadcrumbLabel, searchQuery],
  );

  useHeaderSearch(headerSearchConfig);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !fetchNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0]?.isIntersecting &&
          hasNextPage &&
          !isFetchingNextPage
        ) {
          fetchNextPage();
        }
      },
      { rootMargin: "420px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 700);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <ProductListingToolbar
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Products", href: "/products" },
          { label: breadcrumbLabel },
        ]}
        sortControl={
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortOption)}
            aria-label="Sort products"
            disabled={sortDisabled}
            className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground outline-none transition-colors hover:border-kwik-orange/50 focus:border-kwik-orange focus:ring-2 focus:ring-kwik-orange/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        }
      />

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

        {!isLoading && !isError && count > 0 ? (
          <div ref={sentinelRef} className="flex items-center justify-center py-8">
            {isFetchingNextPage ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-kwik-orange border-t-transparent" />
                Loading more products...
              </div>
            ) : hasNextPage ? (
              <div className="text-sm text-muted-foreground">Scroll to load more</div>
            ) : (
              <div className="text-sm text-muted-foreground">You&apos;re at the end of the catalog.</div>
            )}
          </div>
        ) : null}
      </div>

      <AnimatePresence>
        {showScrollTop ? (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-24 left-5 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full bg-kwik-orange text-white shadow-lg shadow-kwik-orange/20 transition hover:bg-kwik-orange-hover md:bottom-5"
            aria-label="Scroll to top"
          >
            <ArrowUp className="h-5 w-5" />
          </motion.button>
        ) : null}
      </AnimatePresence>

      {/* ── Quick view ── */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}
