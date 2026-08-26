"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Search as SearchIcon, TrendingUp, History, Clock, Flame, Sparkles, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MarketplaceProductCard } from "@/components/landing/shared/marketplace-product-card";
import { ProductGridSkeleton } from "@/components/ui/loading-state";
import { ProductListingToolbar } from "@/components/product/product-listing-toolbar";
import { useHeaderSearch } from "@/components/layout/marketplace-shell-context";
import {
  useSearchInfinite,
  useTrending,
  useTrendingSearches,
} from "@/lib/api-hooks";
import { useRecentSearches } from "@/hooks";
import type { MarketplaceProduct } from "@/data/marketplace-home";
import type { SearchFilters as ApiSearchFilters } from "@/lib/api";
import {
  SearchFilters as SearchFiltersPanel,
  SearchFilterDrawer,
  SortDropdown,
  ActiveFilters,
  NoResultsState,
  SearchErrorState,
  type SearchFiltersState,
  type SortValue,
} from "@/components/search";

// Dynamic import for QuickViewModal to reduce initial bundle
const QuickViewModal = dynamic(
  () => import("@/components/landing/quick-view-modal").then((mod) => mod.QuickViewModal),
  { ssr: false },
);

// ─── Helpers ────────────────────────────────────────────────────────────

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

// ─── URL state helpers ──────────────────────────────────────────────────
// All filters live in the URL search params so the page is shareable,
// bookmarkable, and survives refresh + browser back/forward.

const PAGE_SIZE = 20;

function isEmptyFilterValue(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === "number" && Number.isNaN(value))
  );
}

function isFiltersEmpty(f: SearchFiltersState): boolean {
  return Object.values(f).every(isEmptyFilterValue);
}

function parseFiltersFromParams(
  params: URLSearchParams,
): { query: string; filters: SearchFiltersState; sort: SortValue } {
  const query = (params.get("q") ?? "").trim();
  const filters: SearchFiltersState = {
    minPrice: params.get("minPrice") ? Number(params.get("minPrice")) : undefined,
    maxPrice: params.get("maxPrice") ? Number(params.get("maxPrice")) : undefined,
    rating: params.get("rating") ? Number(params.get("rating")) : undefined,
    category: params.get("category") ?? undefined,
    categoryIds: params.get("categoryIds")?.split(",").filter(Boolean) ?? undefined,
    brandId: params.get("brandId") ?? undefined,
    brandIds: params.get("brandIds")?.split(",").filter(Boolean) ?? undefined,
    storeId: params.get("storeId") ?? undefined,
    storeIds: params.get("storeIds")?.split(",").filter(Boolean) ?? undefined,
    state: params.get("state") ?? undefined,
    states: params.get("states")?.split(",").filter(Boolean) ?? undefined,
  };
  // Strip NaN / undefined
  for (const k of Object.keys(filters) as (keyof SearchFiltersState)[]) {
    const v = filters[k];
    if (isEmptyFilterValue(v)) {
      delete filters[k];
    }
  }
  const sort = (params.get("sort") as SortValue) || "relevance";
  return { query, filters, sort };
}

function buildSearchParams(
  query: string,
  filters: SearchFiltersState,
  sort: SortValue,
): URLSearchParams {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (filters.minPrice !== undefined && !Number.isNaN(filters.minPrice)) {
    params.set("minPrice", String(filters.minPrice));
  }
  if (filters.maxPrice !== undefined && !Number.isNaN(filters.maxPrice)) {
    params.set("maxPrice", String(filters.maxPrice));
  }
  if (filters.rating !== undefined && !Number.isNaN(filters.rating)) {
    params.set("rating", String(filters.rating));
  }
  if (filters.category) params.set("category", filters.category);
  if (filters.categoryIds?.length) params.set("categoryIds", filters.categoryIds.join(","));
  if (filters.brandId) params.set("brandId", filters.brandId);
  if (filters.brandIds?.length) params.set("brandIds", filters.brandIds.join(","));
  if (filters.storeId) params.set("storeId", filters.storeId);
  if (filters.storeIds?.length) params.set("storeIds", filters.storeIds.join(","));
  if (filters.state) params.set("state", filters.state);
  if (filters.states?.length) params.set("states", filters.states.join(","));
  if (sort !== "relevance") params.set("sort", sort);
  return params;
}

// ─── Search Page Content ────────────────────────────────────────────────

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read state from URL — single source of truth.
  const { query, filters: urlFilters, sort: urlSort } = useMemo(
    () => parseFiltersFromParams(searchParams),
    [searchParams],
  );

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<MarketplaceProduct | null>(null);

  // Build the API filters object. react-query's queryKey includes this
  // object, so any change automatically resets to page 1.
  const apiFilters: ApiSearchFilters = useMemo(
    () => ({
      q: query,
      ...urlFilters,
      sort: urlSort,
      limit: PAGE_SIZE,
    }),
    [query, urlFilters, urlSort],
  );

  const hasQuery = query.length > 0 || !isFiltersEmpty(urlFilters);
  const {
    products,
    meta,
    isLoading,
    isError,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    refetch,
    fetchNextPage,
  } = useSearchInfinite(apiFilters, hasQuery);

  // Update URL when filters/sort change.
  const pushUrl = useCallback(
    (next: { query?: string; filters?: SearchFiltersState; sort?: SortValue }) => {
      const nextQuery = next.query ?? query;
      const nextFilters = next.filters ?? urlFilters;
      const nextSort = next.sort ?? urlSort;
      const params = buildSearchParams(nextQuery, nextFilters, nextSort);
      const search = params.toString();
      router.push(search ? `/search?${search}` : "/search", { scroll: false });
    },
    [query, urlFilters, urlSort, router],
  );

  const handleFilterChange = useCallback(
    (next: Partial<SearchFiltersState>) => {
      const merged = { ...urlFilters, ...next };
      // Remove empty values so cleared multi-select filters disappear from the URL.
      for (const k of Object.keys(merged) as (keyof SearchFiltersState)[]) {
        if (isEmptyFilterValue(merged[k])) {
          delete merged[k];
        }
      }
      pushUrl({ filters: merged });
    },
    [urlFilters, pushUrl],
  );

  const handleSortChange = useCallback(
    (next: SortValue) => {
      pushUrl({ sort: next });
    },
    [pushUrl],
  );

  const handleResetFilters = useCallback(() => {
    pushUrl({ filters: {} });
  }, [pushUrl]);

  const [toolbarQuery, setToolbarQuery] = useState(query);

  useEffect(() => {
    setToolbarQuery(query);
  }, [query]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const nextQuery = toolbarQuery.trim();
      if (nextQuery !== query) {
        pushUrl({ query: nextQuery });
      }
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [pushUrl, query, toolbarQuery]);

  const handleLoadMore = useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  const handleQuickView = useCallback((p: MarketplaceProduct) => {
    setQuickViewProduct(p);
  }, []);

  // Run a search from a recent/trending term.
  const runSearch = useCallback(
    (term: string) => {
      const params = new URLSearchParams({ q: term });
      router.push(`/search?${params.toString()}`);
    },
    [router],
  );

  // Active filter chips — derived from URL state.
  const activeChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; onRemove: () => void }> = [];
    if (urlFilters.minPrice !== undefined && urlFilters.minPrice > 0) {
      chips.push({
        key: "minPrice",
        label: `Min ₦${urlFilters.minPrice.toLocaleString()}`,
        onRemove: () => handleFilterChange({ minPrice: undefined }),
      });
    }
    if (urlFilters.maxPrice !== undefined && urlFilters.maxPrice > 0) {
      chips.push({
        key: "maxPrice",
        label: `Max ₦${urlFilters.maxPrice.toLocaleString()}`,
        onRemove: () => handleFilterChange({ maxPrice: undefined }),
      });
    }
    if (urlFilters.rating !== undefined) {
      chips.push({
        key: "rating",
        label: `${urlFilters.rating}★ & above`,
        onRemove: () => handleFilterChange({ rating: undefined }),
      });
    }
    if (urlFilters.category) {
      const cat = meta?.categories?.find((c) => c.slug === urlFilters.category || c.id === urlFilters.category);
      chips.push({
        key: "category",
        label: cat?.name ?? urlFilters.category,
        onRemove: () => handleFilterChange({ category: undefined }),
      });
    }
    for (const categoryId of urlFilters.categoryIds ?? []) {
      const cat = meta?.categories?.find((c) => c.slug === categoryId || c.id === categoryId);
      chips.push({
        key: `category-${categoryId}`,
        label: cat?.name ?? categoryId,
        onRemove: () => handleFilterChange({ categoryIds: urlFilters.categoryIds?.filter((id) => id !== categoryId) }),
      });
    }
    if (urlFilters.storeId) {
      const store = meta?.stores?.find((s) => s.id === urlFilters.storeId || s.slug === urlFilters.storeId);
      chips.push({
        key: "storeId",
        label: store?.name ?? urlFilters.storeId,
        onRemove: () => handleFilterChange({ storeId: undefined }),
      });
    }
    for (const storeId of urlFilters.storeIds ?? []) {
      const store = meta?.stores?.find((s) => s.id === storeId || s.slug === storeId);
      chips.push({
        key: `store-${storeId}`,
        label: store?.name ?? storeId,
        onRemove: () => handleFilterChange({ storeIds: urlFilters.storeIds?.filter((id) => id !== storeId) }),
      });
    }
    if (urlFilters.brandId) {
      const brand = meta?.brands?.find((b) => b.id === urlFilters.brandId || b.slug === urlFilters.brandId);
      chips.push({
        key: "brandId",
        label: brand?.name ?? urlFilters.brandId,
        onRemove: () => handleFilterChange({ brandId: undefined }),
      });
    }
    for (const brandId of urlFilters.brandIds ?? []) {
      const brand = meta?.brands?.find((b) => b.id === brandId || b.slug === brandId);
      chips.push({
        key: `brand-${brandId}`,
        label: brand?.name ?? brandId,
        onRemove: () => handleFilterChange({ brandIds: urlFilters.brandIds?.filter((id) => id !== brandId) }),
      });
    }
    if (urlFilters.state) {
      const st = meta?.states?.find((s) => s.name === urlFilters.state || s.code === urlFilters.state);
      chips.push({
        key: "state",
        label: st?.name ?? urlFilters.state,
        onRemove: () => handleFilterChange({ state: undefined }),
      });
    }
    for (const state of urlFilters.states ?? []) {
      const st = meta?.states?.find((s) => s.name === state || s.code === state || s.id === state);
      chips.push({
        key: `state-${state}`,
        label: st?.name ?? state,
        onRemove: () => handleFilterChange({ states: urlFilters.states?.filter((value) => value !== state) }),
      });
    }
    return chips;
  }, [urlFilters, meta, handleFilterChange]);

  const headerSearchConfig = useMemo(
    () => ({
      value: toolbarQuery,
      onChange: setToolbarQuery,
      placeholder: "Search products, stores, brands, and categories...",
      onToggleFilters: () => setDrawerOpen(true),
      showFilters: drawerOpen,
      activeFilterCount: activeChips.length,
    }),
    [activeChips.length, drawerOpen, toolbarQuery],
  );

  useHeaderSearch(headerSearchConfig);

  const trendingQuery = useTrending(5);
  const trendingSearchesQuery = useTrendingSearches(12);
  const { items: recentSearches, addSearch, removeSearch, clearSearches } = useRecentSearches();

  // Persist every successful query into recent searches (max once per query change).
  useEffect(() => {
    if (query && !isFetching && !isLoading) {
      addSearch(query);
    }
  }, [query, isFetching, isLoading, addSearch]);

  const popularSearches = useMemo(
    () => (trendingQuery.data ?? []).slice(0, 5),
    [trendingQuery.data],
  );
  const trendingSearches = useMemo(
    () => trendingSearchesQuery.data ?? [],
    [trendingSearchesQuery.data],
  );

  // Suggested alternative queries when no results are returned.
  const noResultSuggestions = useMemo(() => {
    if (!query || (meta?.total ?? 0) > 0) return [];
    const q = query.toLowerCase();
    return trendingSearches
      .filter((t) => !t.query.toLowerCase().includes(q) && !q.includes(t.query.toLowerCase()))
      .slice(0, 4);
  }, [query, meta?.total, trendingSearches]);

  const totalResults = meta?.total ?? 0;
  const hasResults = products.length > 0;

  // ─── Render ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <ProductListingToolbar
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Search" },
        ]}
        sortControl={<SortDropdown value={urlSort} onChange={handleSortChange} />}
      >
        {activeChips.length > 0 ? (
          <ActiveFilters
            chips={activeChips}
            onClearAll={handleResetFilters}
            className="pb-3"
          />
        ) : null}
      </ProductListingToolbar>

      {/* Results area */}
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* No query state — show recent + trending searches & popular products */}
        {!hasQuery ? (
          <NoQueryState
            recentSearches={recentSearches}
            trendingSearches={trendingSearches}
            trendingSearchesLoading={trendingSearchesQuery.isLoading}
            onPickSearch={runSearch}
            onRemoveSearch={removeSearch}
            onClearSearches={clearSearches}
            popularSearches={popularSearches}
            onQuickView={handleQuickView}
          />
        ) : (
          <div className="flex gap-6">
            {/* Desktop filter sidebar */}
            <aside className="hidden lg:block w-56 shrink-0">
              <div className="sticky top-[calc(var(--header-height)+1rem)] rounded-2xl border border-kwik-border bg-background p-4 dark:bg-white/[0.02] dark:border-white/10">
                <SearchFiltersPanel
                  state={urlFilters}
                  meta={meta}
                  onChange={handleFilterChange}
                  onReset={handleResetFilters}
                />
              </div>
            </aside>

            {/* Product results */}
            <div className="flex-1 min-w-0">
              {/* Loading — first page */}
              {isLoading && !hasResults ? (
                <ProductGridSkeleton count={10} columns={5} />
              ) : isError ? (
                <SearchErrorState onRetry={() => refetch()} />
              ) : !hasResults && !isFetching ? (
                <div className="space-y-8">
                  <NoResultsState
                    query={query}
                    onClearFilters={handleResetFilters}
                    onBrowseAll={() => router.push("/products")}
                  />
                  {noResultSuggestions.length > 0 ? (
                    <section className="rounded-2xl border border-kwik-border bg-kwik-bg-surface p-5 dark:bg-white/[0.02] dark:border-white/10">
                      <div className="mb-3 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-kwik-orange" />
                        <h3 className="text-sm font-semibold text-kwik-dark dark:text-white">
                          Try one of these trending searches
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {noResultSuggestions.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => runSearch(t.query)}
                            className="group inline-flex items-center gap-2 rounded-full border border-kwik-border bg-background px-4 py-2 text-xs font-medium text-kwik-dark transition-all hover:border-kwik-orange/50 hover:bg-kwik-orange-tint hover:text-kwik-orange dark:bg-white/5 dark:text-white/80 dark:border-white/10 dark:hover:bg-white/10"
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
                  ) : null}
                </div>
              ) : (
                <>
                  {/* Product grid */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5">
                    {products.map((product) => (
                      <MarketplaceProductCard
                        key={product.id}
                        product={product}
                        onQuickView={() => handleQuickView(product)}
                      />
                    ))}
                    {/* Loading skeletons when fetching next page */}
                    {isFetchingNextPage
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={`skeleton-${i}`}
                            className="aspect-[3/4] animate-pulse rounded-xl bg-kwik-bg-light dark:bg-white/5"
                          />
                        ))
                      : null}
                  </div>

                  {/* Load More */}
                  {hasNextPage ? (
                    <div className="mt-8 flex justify-center">
                      <button
                        type="button"
                        onClick={handleLoadMore}
                        disabled={isFetchingNextPage}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-kwik-border bg-background px-6 text-sm font-semibold text-kwik-dark transition hover:border-kwik-orange/50 hover:bg-kwik-bg-light disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white/5 dark:text-white dark:border-white/10 dark:hover:bg-white/10"
                      >
                        {isFetchingNextPage ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-kwik-orange border-t-transparent" />
                            Loading…
                          </>
                        ) : (
                          "Load more"
                        )}
                      </button>
                    </div>
                  ) : hasResults ? (
                    <p className="mt-8 text-center text-xs text-kwik-muted">
                      You&rsquo;re at the end of the results.
                    </p>
                  ) : null}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile filter drawer */}
      <SearchFilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        state={urlFilters}
        meta={meta}
        onChange={(next) => handleFilterChange(next)}
        onReset={handleResetFilters}
      />

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}

// ─── No-query state: recent + trending + popular products ───────────────

function NoQueryState({
  recentSearches,
  trendingSearches,
  trendingSearchesLoading,
  onPickSearch,
  onRemoveSearch,
  onClearSearches,
  popularSearches,
  onQuickView,
}: {
  recentSearches: { query: string; timestamp: number }[];
  trendingSearches: { id: string; label: string; query: string; category: string; count: number }[];
  trendingSearchesLoading: boolean;
  onPickSearch: (q: string) => void;
  onRemoveSearch: (q: string) => void;
  onClearSearches: () => void;
  popularSearches: MarketplaceProduct[];
  onQuickView: (p: MarketplaceProduct) => void;
}) {
  const router = useRouter();
  return (
    <div className="space-y-10">
      <div className="flex flex-col items-center justify-center py-10 px-4">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-kwik-orange-tint ring-1 ring-kwik-orange/20">
          <SearchIcon className="h-10 w-10 text-kwik-orange" />
        </div>
        <h3 className="text-xl font-semibold text-kwik-dark dark:text-white">Search Kwikseller</h3>
        <p className="mt-2 max-w-sm text-center text-sm text-kwik-gray-light dark:text-white/60">
          Find products, stores, brands, and categories. Start typing to see live results.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent searches */}
        <section className="rounded-2xl border border-kwik-border bg-kwik-bg-surface p-5 dark:bg-white/[0.02] dark:border-white/10">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-kwik-orange-tint text-kwik-orange">
                <History className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-kwik-dark dark:text-white">Recent searches</h2>
                <p className="text-[11px] text-kwik-muted">Pick up where you left off</p>
              </div>
            </div>
            {recentSearches.length > 0 ? (
              <button
                type="button"
                onClick={onClearSearches}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium text-kwik-muted transition hover:bg-kwik-red/5 hover:text-kwik-red"
              >
                <Trash2 className="h-3 w-3" /> Clear all
              </button>
            ) : null}
          </div>

          {recentSearches.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-kwik-border-light py-8 text-center dark:border-white/10">
              <Clock className="h-7 w-7 text-kwik-muted/60" />
              <p className="mt-2 text-xs font-medium text-kwik-muted">No recent searches yet</p>
              <p className="text-[11px] text-kwik-muted/70">Your search history will appear here.</p>
            </div>
          ) : (
            <ul className="space-y-1.5">
              <AnimatePresence initial={false}>
                {recentSearches.map((s) => (
                  <motion.li
                    key={`${s.query}-${s.timestamp}`}
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8, height: 0 }}
                    className="group flex items-center gap-2 rounded-xl border border-transparent bg-background px-3 py-2 transition-colors hover:border-kwik-border-light hover:bg-kwik-bg-surface dark:hover:border-white/10 dark:hover:bg-white/5"
                  >
                    <button
                      type="button"
                      onClick={() => onPickSearch(s.query)}
                      className="flex flex-1 items-center gap-2.5 text-left"
                    >
                      <Clock className="h-3.5 w-3.5 text-kwik-muted transition group-hover:text-kwik-orange" />
                      <span className="truncate text-sm font-medium text-kwik-dark dark:text-white">{s.query}</span>
                      <span className="ml-auto shrink-0 text-[10px] text-kwik-muted">
                        {timeAgo(s.timestamp)}
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Remove ${s.query}`}
                      onClick={() => onRemoveSearch(s.query)}
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

        {/* Trending searches */}
        <section className="rounded-2xl border border-kwik-border bg-kwik-bg-surface p-5 dark:bg-white/[0.02] dark:border-white/10">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-kwik-orange-tint text-kwik-orange">
              <Flame className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-kwik-dark dark:text-white">Trending searches</h2>
              <p className="text-[11px] text-kwik-muted">What other buyers are looking for</p>
            </div>
          </div>

          {trendingSearchesLoading ? (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-8 animate-pulse rounded-full bg-kwik-orange/10"
                  style={{ width: `${60 + (i % 4) * 22}px` }}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {trendingSearches.map((t, i) => (
                <motion.button
                  key={t.id}
                  type="button"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.3) }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onPickSearch(t.query)}
                  className="group inline-flex items-center gap-1.5 rounded-full border border-kwik-border bg-background px-3 py-1.5 text-xs font-medium text-kwik-dark shadow-sm transition-all hover:border-kwik-orange/50 hover:bg-kwik-orange-tint hover:text-kwik-orange dark:bg-white/5 dark:text-white/80 dark:border-white/10 dark:hover:bg-white/10"
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
      </div>

      {/* Quick picks */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-kwik-orange" />
          <h2 className="text-sm font-semibold text-kwik-dark dark:text-white">Quick picks</h2>
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
              className="rounded-full border border-kwik-border bg-kwik-bg-surface px-4 py-2 text-xs font-medium text-kwik-gray transition-all hover:border-kwik-orange/50 hover:bg-kwik-orange-tint hover:text-kwik-orange dark:bg-white/5 dark:text-white/80 dark:border-white/10 dark:hover:bg-white/10"
            >
              {term}
            </button>
          ))}
        </div>
      </section>

      {/* Popular products */}
      {popularSearches.length > 0 ? (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-kwik-orange" />
            <h2 className="text-base font-semibold text-kwik-dark dark:text-white">Popular right now</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-5">
            {popularSearches.map((product) => (
              <MarketplaceProductCard
                key={product.id}
                product={product}
                onQuickView={() => onQuickView(product)}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

// ─── Default export with Suspense ────────────────────────────────────────

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
