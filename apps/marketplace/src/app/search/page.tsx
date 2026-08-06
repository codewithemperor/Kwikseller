"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Search,
  TrendingUp,
  Clock,
  X,
  Flame,
  ArrowRight,
  Sparkles,
  History,
  Trash2,
  Package,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMarketplaceShell } from "@/components/layout/marketplace-shell-context";
import { MarketplaceProductCard } from "@/components/landing/shared/marketplace-product-card";
import { ProductGridSkeleton } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import {
  useSearch,
  useTrending,
  useCategories,
  useTrendingSearches,
} from "@/lib/api-hooks";
import { useRecentSearches } from "@/hooks";
import type { MarketplaceProduct } from "@/data/marketplace-home";

// Dynamic import for QuickViewModal to reduce initial bundle
const QuickViewModal = dynamic(
  () => import("@/components/landing/quick-view-modal").then((mod) => mod.QuickViewModal),
  { ssr: false },
);

/* ─── Sort Options ──────────────────────────────────────────── */

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
  { value: "newest", label: "Newest" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

/* ─── Helpers ──────────────────────────────────────────────── */

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(new Date(ts));
}

/* ─── Search Page Component ────────────────────────────────── */

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const shell = useMarketplaceShell();
  const query = (searchParams.get("q") || "").trim();
  const categoryParam = searchParams.get("category") || "";
  const filtersParam = searchParams.get("filters") === "true";

  const [activeCategory, setActiveCategory] = useState(categoryParam);
  const [sortBy, setSortBy] = useState<SortValue>("relevance");
  const [quickViewProduct, setQuickViewProduct] = useState<MarketplaceProduct | null>(null);

  // Read showFilters from layout shell context
  const showFilters = shell?.showFilters ?? filtersParam;

  // Fetch live search results from the shared hook (debounced internally
  // by React Query's keepPreviousData + the enabled flag).
  const searchQuery = useSearch(query, 30, query.length > 0);
  const trendingQuery = useTrending(5);
  const categoriesQuery = useCategories();
  const trendingSearchesQuery = useTrendingSearches(12);
  const { items: recentSearches, addSearch, removeSearch, clearSearches } = useRecentSearches();

  // Persist every successful query into recent searches (max once per query change).
  useEffect(() => {
    if (query && !searchQuery.isFetching && !searchQuery.isLoading) {
      addSearch(query);
    }
  }, [query, searchQuery.isSuccess, searchQuery.isFetching, searchQuery.isLoading, addSearch]);

  const results: MarketplaceProduct[] = useMemo(
    () => searchQuery.data ?? [],
    [searchQuery.data],
  );

  // Filter results by selected category (client-side — the API search
  // endpoint already filters server-side by query string; the category
  // chip narrows within the returned set). `MarketplaceProduct` exposes
  // `category` (the name) but not the slug, so we resolve the active
  // category slug → name via the categories list and match on that.
  const categoryNameForSlug = useMemo(() => {
    if (!activeCategory) return null;
    const match = (categoriesQuery.data ?? []).find(
      (c: { slug?: string; name: string }) => c.slug === activeCategory,
    );
    return match?.name ?? null;
  }, [activeCategory, categoriesQuery.data]);

  const filteredResults = useMemo(() => {
    if (!categoryNameForSlug) return results;
    return results.filter((p) => p.category === categoryNameForSlug);
  }, [results, categoryNameForSlug]);

  // Sort results
  const sortedResults = useMemo(() => {
    const sorted = [...filteredResults];

    switch (sortBy) {
      case "price-low":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        sorted.sort((a, b) => Number(b.isNew ?? false) - Number(a.isNew ?? false));
        break;
      default:
        break;
    }

    return sorted;
  }, [filteredResults, sortBy]);

  // Sync category with URL param
  React.useEffect(() => {
    setActiveCategory(categoryParam);
  }, [categoryParam]);

  // Handle category change
  const handleCategoryChange = useCallback(
    (slug: string) => {
      setActiveCategory(slug);
      if (query) {
        const params = new URLSearchParams({ q: query });
        if (slug) params.set("category", slug);
        router.push(`/search?${params.toString()}`);
      }
    },
    [query, router],
  );

  // Run a search (clicking a recent/trending term)
  const runSearch = useCallback(
    (term: string) => {
      const params = new URLSearchParams({ q: term });
      router.push(`/search?${params.toString()}`);
    },
    [router],
  );

  // Quick view handler
  const handleQuickView = useCallback((p: MarketplaceProduct) => {
    setQuickViewProduct(p);
  }, []);

  const isLoading = searchQuery.isLoading;
  const popularSearches = useMemo(
    () => (trendingQuery.data ?? []).slice(0, 5),
    [trendingQuery.data],
  );

  const trendingSearches = useMemo(
    () => trendingSearchesQuery.data ?? [],
    [trendingSearchesQuery.data],
  );

  const categoryTabs = useMemo(() => {
    const cats = categoriesQuery.data ?? [];
    return [
      { slug: "", name: "All" },
      ...cats.slice(0, 7).map((c: { name: string; slug: string }) => ({
        slug: c.slug,
        name: c.name,
      })),
    ];
  }, [categoriesQuery.data]);

  // Suggested alternative queries when no results are returned.
  // Picks the 3 trending terms most different from the current query.
  const noResultSuggestions = useMemo(() => {
    if (!query || sortedResults.length > 0) return [];
    const q = query.toLowerCase();
    return trendingSearches
      .filter((t) => !t.query.toLowerCase().includes(q) && !q.includes(t.query.toLowerCase()))
      .slice(0, 4);
  }, [query, sortedResults.length, trendingSearches]);

  return (
    <div className="min-h-screen bg-background">
      {/* Category tabs - sticky below the header */}
      <div className="sticky top-[53px] z-20 border-b border-border bg-background md:top-[64px]">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1.5 overflow-x-auto py-2.5 scrollbar-hide -mx-4 px-4">
            {categoryTabs.map((cat) => {
              const isActive = activeCategory === cat.slug;
              return (
                <motion.button
                  key={cat.slug || "all"}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCategoryChange(cat.slug)}
                  className={`flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-kwik-orange to-kwik-amber text-white shadow-md shadow-kwik-orange/20"
                      : "bg-white text-kwik-gray ring-1 ring-kwik-border/70 hover:bg-neutral-50 hover:text-kwik-dark dark:bg-white/5 dark:text-white/65 dark:ring-white/10 dark:hover:bg-white/10 dark:hover:text-white"
                  }`}
                >
                  {cat.name}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Filters panel with improved sort buttons */}
        {showFilters && (
          <div className="border-t border-kwik-border">
            <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-semibold text-kwik-gray-light uppercase tracking-wider">
                  Sort by:
                </span>
                <div className="flex items-center gap-1.5 rounded-md bg-white p-1 ring-1 ring-kwik-border/70 dark:bg-white/5 dark:ring-white/10">
                  {SORT_OPTIONS.map((opt) => {
                    const isActive = sortBy === opt.value;
                    return (
                      <motion.button
                        key={opt.value}
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSortBy(opt.value)}
                        className={`rounded-lg px-3 py-1 text-xs font-medium transition-all duration-200 ${
                          isActive
                            ? "bg-gradient-to-r from-kwik-orange to-kwik-amber text-white shadow-sm"
                            : "text-kwik-gray hover:bg-neutral-50 hover:text-kwik-dark dark:text-white/65 dark:hover:bg-white/10 dark:hover:text-white"
                        }`}
                      >
                        {opt.label}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results area */}
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Results count with animated counter */}
        {query ? (
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-kwik-gray-light">
              {isLoading ? (
                "Searching..."
              ) : (
                <>
                  <span className="font-semibold text-kwik-dark">{sortedResults.length}</span>{" "}
                  result{sortedResults.length !== 1 ? "s" : ""} for{" "}
                  <span className="font-semibold text-kwik-orange">&ldquo;{query}&rdquo;</span>
                </>
              )}
            </p>
          </div>
        ) : null}

        {/* Loading skeleton */}
        {isLoading && <ProductGridSkeleton count={10} columns={5} />}

        {/* No query state — show recent + trending searches & popular products */}
        {!query && !isLoading && (
          <div className="space-y-10">
            <div className="flex flex-col items-center justify-center py-10 px-4">
              <div className="relative mb-6">
                {/* Decorative background */}
                <div className="absolute -inset-8 rounded-full bg-kwik-orange/5 blur-2xl" />
                <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-kwik-orange/10 to-kwik-orange/5 ring-1 ring-kwik-orange/20">
                  <Search className="h-12 w-12 text-kwik-orange" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-kwik-dark">Search Kwikseller</h3>
              <p className="mt-2 max-w-sm text-center text-sm text-kwik-gray-light">
                Find products, stores, brands, and categories. Start typing to see live results.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Recent searches */}
              <RecentSearchesCard
                searches={recentSearches}
                onPick={runSearch}
                onRemove={removeSearch}
                onClear={clearSearches}
              />

              {/* Trending searches */}
              <TrendingSearchesCard
                searches={trendingSearches}
                isLoading={trendingSearchesQuery.isLoading}
                onPick={runSearch}
              />
            </div>

            {/* Quick category chips */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-kwik-orange" />
                <h2 className="text-sm font-semibold text-kwik-dark">Quick picks</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {["Electronics", "Fashion", "Phones", "Beauty", "Food", "Home"].map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => {
                      const params = new URLSearchParams({ q: term });
                      router.push(`/search?${params.toString()}`);
                    }}
                    className="rounded-full border border-kwik-border-light bg-kwik-bg-surface px-4 py-2 text-xs font-medium text-kwik-gray transition-all duration-200 hover:border-kwik-orange/50 hover:bg-kwik-orange-tint hover:text-kwik-orange hover:-translate-y-0.5"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </section>

            {/* Popular / trending products */}
            {popularSearches.length > 0 ? (
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-kwik-orange" />
                  <h2 className="text-base font-semibold text-kwik-dark">Popular right now</h2>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {popularSearches.map((product) => (
                    <MarketplaceProductCard
                      key={product.id}
                      product={product}
                      onQuickView={handleQuickView}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}

        {/* Empty state when query returns no results */}
        {query && !isLoading && sortedResults.length === 0 ? (
          <div className="space-y-8">
            <EmptyState
              variant="search"
              title="No results found"
              description={`We couldn't find anything matching "${query}". Try a different search term or browse popular products.`}
              action={
                <button
                  type="button"
                  onClick={() => router.push("/products")}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-kwik-orange px-5 text-sm font-semibold text-white hover:bg-kwik-orange-hover"
                >
                  Browse all products
                </button>
              }
            />

            {/* Smart suggestions: trending terms different from the failed query */}
            {noResultSuggestions.length > 0 && (
              <section className="rounded-2xl border border-kwik-border-light bg-kwik-bg-surface p-5 sm:p-6">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-kwik-orange" />
                  <h3 className="text-sm font-semibold text-kwik-dark">
                    Try one of these trending searches
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {noResultSuggestions.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => runSearch(t.query)}
                      className="group inline-flex items-center gap-2 rounded-full border border-kwik-border-light bg-background px-4 py-2 text-xs font-medium text-kwik-gray transition-all duration-200 hover:border-kwik-orange/50 hover:bg-kwik-orange-tint hover:text-kwik-orange hover:-translate-y-0.5"
                    >
                      <Flame className="h-3 w-3 text-kwik-orange" />
                      {t.label}
                      <span className="text-[10px] text-kwik-muted group-hover:text-kwik-orange/70">
                        {formatCount(t.count)}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Browse by category fallback */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Package className="h-4 w-4 text-kwik-orange" />
                <h3 className="text-sm font-semibold text-kwik-dark">Browse by category</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {(categoriesQuery.data ?? []).slice(0, 8).map(
                  (c: { id: string; name: string; slug: string; imageUrl?: string }) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => router.push(`/categories?name=${c.slug}`)}
                      className="group flex items-center gap-3 rounded-xl border border-kwik-border-light bg-kwik-bg-surface p-3 text-left transition-all duration-200 hover:border-kwik-orange/50 hover:shadow-sm hover:-translate-y-0.5"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-kwik-orange-tint text-kwik-orange">
                        <Package className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-kwik-dark">{c.name}</p>
                        <p className="text-[11px] text-kwik-muted">Explore products</p>
                      </div>
                      <ArrowRight className="ml-auto h-4 w-4 text-kwik-muted transition-transform group-hover:translate-x-0.5 group-hover:text-kwik-orange" />
                    </button>
                  ),
                )}
              </div>
            </section>
          </div>
        ) : null}

        {/* Results grid */}
        {query && !isLoading && sortedResults.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {sortedResults.map((product) => (
              <MarketplaceProductCard
                key={product.id}
                product={product}
                onQuickView={() => handleQuickView(product)}
              />
            ))}
          </div>
        ) : null}
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}

/* ─── Recent Searches Card ─────────────────────────────────── */

function RecentSearchesCard({
  searches,
  onPick,
  onRemove,
  onClear,
}: {
  searches: { query: string; timestamp: number }[];
  onPick: (q: string) => void;
  onRemove: (q: string) => void;
  onClear: () => void;
}) {
  return (
    <section className="rounded-2xl border border-kwik-border-light bg-kwik-bg-surface p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-kwik-orange-tint text-kwik-orange">
            <History className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-kwik-dark">Recent searches</h2>
            <p className="text-[11px] text-kwik-muted">Pick up where you left off</p>
          </div>
        </div>
        {searches.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium text-kwik-muted transition hover:bg-kwik-red/5 hover:text-kwik-red"
          >
            <Trash2 className="h-3 w-3" /> Clear all
          </button>
        )}
      </div>

      {searches.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-kwik-border-light py-8 text-center">
          <Clock className="h-7 w-7 text-kwik-muted/60" />
          <p className="mt-2 text-xs font-medium text-kwik-muted">No recent searches yet</p>
          <p className="text-[11px] text-kwik-muted/70">Your search history will appear here.</p>
        </div>
      ) : (
        <ul className="space-y-1.5">
          <AnimatePresence initial={false}>
            {searches.map((s) => (
              <motion.li
                key={`${s.query}-${s.timestamp}`}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8, height: 0 }}
                className="group flex items-center gap-2 rounded-xl border border-transparent bg-background px-3 py-2 transition-colors hover:border-kwik-border-light hover:bg-kwik-bg-surface"
              >
                <button
                  type="button"
                  onClick={() => onPick(s.query)}
                  className="flex flex-1 items-center gap-2.5 text-left"
                >
                  <Clock className="h-3.5 w-3.5 text-kwik-muted transition group-hover:text-kwik-orange" />
                  <span className="truncate text-sm font-medium text-kwik-dark">{s.query}</span>
                  <span className="ml-auto shrink-0 text-[10px] text-kwik-muted">
                    {timeAgo(s.timestamp)}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${s.query}`}
                  onClick={() => onRemove(s.query)}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-kwik-muted opacity-0 transition hover:bg-kwik-red/10 hover:text-kwik-red group-hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
}

/* ─── Trending Searches Card ───────────────────────────────── */

function TrendingSearchesCard({
  searches,
  isLoading,
  onPick,
}: {
  searches: {
    id: string;
    label: string;
    query: string;
    category: string;
    count: number;
  }[];
  isLoading: boolean;
  onPick: (q: string) => void;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-kwik-orange/20 bg-gradient-to-br from-kwik-orange-tint/40 via-kwik-bg-surface to-kwik-amber-tint/30 p-5 sm:p-6">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-kwik-orange/10 blur-2xl" />
      <div className="relative mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-kwik-gradient text-white shadow-sm shadow-kwik-orange/30">
          <Flame className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-kwik-dark">Trending searches</h2>
          <p className="text-[11px] text-kwik-muted">What other buyers are looking for</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-8 w-24 animate-pulse rounded-full bg-kwik-orange/10"
              style={{ width: `${60 + (i % 4) * 22}px` }}
            />
          ))}
        </div>
      ) : (
        <div className="relative flex flex-wrap gap-2">
          {searches.map((t, i) => (
            <motion.button
              key={t.id}
              type="button"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onPick(t.query)}
              className="group inline-flex items-center gap-1.5 rounded-full border border-kwik-border-light bg-background px-3 py-1.5 text-xs font-medium text-kwik-dark shadow-sm transition-all duration-200 hover:border-kwik-orange/50 hover:bg-kwik-orange-tint hover:text-kwik-orange hover:-translate-y-0.5"
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-kwik-orange-tint text-[9px] font-bold text-kwik-orange">
                {i + 1}
              </span>
              {t.label}
              <span className="text-[10px] text-kwik-muted group-hover:text-kwik-orange/70">
                {formatCount(t.count)}
              </span>
            </motion.button>
          ))}
        </div>
      )}
    </section>
  );
}

/* ─── Default export with Suspense ──────────────────────────── */

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <ProductGridSkeleton count={10} columns={5} />
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
