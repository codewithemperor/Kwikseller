"use client";

import { useState, useEffect, Suspense, useMemo, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  SlidersHorizontal,
  X,
  LayoutGrid,
  List,
  ArrowUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useProductsInfinite,
  useCategories,
  useStores,
} from "@/lib/api-hooks";
import { ProductGridSkeleton } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { MarketplaceProductCard } from "@/components/landing/shared/marketplace-product-card";
import type { MarketplaceProduct } from "@/data/marketplace-home";

// Quick-view modal is dynamically imported (client-only) to keep the
// browse bundle small — same pattern as /categories and /search.
const QuickViewModal = dynamic(
  () =>
    import("@/components/landing/quick-view-modal").then(
      (mod) => mod.QuickViewModal,
    ),
  { ssr: false },
);

function formatNGN(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}

type SortOption = "popular" | "newest" | "price-asc" | "price-desc" | "rating";

const sortOptions: { label: string; value: SortOption }[] = [
  { label: "Most Popular", value: "popular" },
  { label: "Newest First", value: "newest" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Top Rated", value: "rating" },
];

const PAGE_SIZE = 12;

function ProductsBrowseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("q") ?? "";
  const initialCategory = searchParams.get("category") ?? "all";
  const initialVendor = searchParams.get("vendor") ?? "all";
  const initialBrandId = searchParams.get("brandId") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<string>(initialCategory);
  const [vendor, setVendor] = useState<string>(initialVendor);
  const [brandId, setBrandId] = useState<string>(initialBrandId);
  const [sort, setSort] = useState<SortOption>("popular");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [priceMax, setPriceMax] = useState<number>(50000);
  const [onlyDiscounted, setOnlyDiscounted] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [shouldLoadFilters, setShouldLoadFilters] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Debounce the search query so we don't fire an API call on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Wrap each filter setter so the call sites stay consistent. React Query
  // resets infinite data automatically when the query key changes.
  const updateFilter = useCallback(
    <T,>(setter: (v: T) => void) =>
      (v: T) => {
        setter(v);
      },
    [],
  );
  // Sync filters to URL (shallow) so the page is shareable/bookmarkable.
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (category !== "all") params.set("category", category);
    if (vendor !== "all") params.set("vendor", vendor);
    if (brandId) params.set("brandId", brandId);
    const qs = params.toString();
    router.replace(qs ? `/products?${qs}` : "/products", { scroll: false });
  }, [query, category, vendor, brandId, router]);

  const [quickViewProduct, setQuickViewProduct] = useState<MarketplaceProduct | null>(null);

  // ── Filter option lists from the API ───────────────────────────────────
  const categoriesQuery = useCategories(shouldLoadFilters);
  const storesQuery = useStores(undefined, shouldLoadFilters);

  const categoryOptions = useMemo(() => {
    const cats = categoriesQuery.data ?? [];
    return [
      { label: "All Categories", value: "all" },
      ...cats.map((c: { name: string; slug: string }) => ({
        label: c.name,
        value: c.slug,
      })),
    ];
  }, [categoriesQuery.data]);

  const vendorOptions = useMemo(() => {
    const stores = (storesQuery.data ?? []) as Array<{
      name: string;
      slug: string;
    }>;
    return [
      { label: "All Vendors", value: "all" },
      ...stores.map((s) => ({ label: s.name, value: s.slug })),
    ];
  }, [storesQuery.data]);

  // ── Build API params from local filter state ───────────────────────────
  const sortByParam =
    sort === "popular"
      ? "totalSales"
      : sort === "newest"
        ? "createdAt"
        : sort === "rating"
          ? "rating"
          : "price";
  const sortOrderParam: "asc" | "desc" =
    sort === "price-asc" ? "asc" : "desc";

  const productsQuery = useProductsInfinite({
    search: debouncedQuery.trim() || undefined,
    categoryId: category !== "all" ? category : undefined,
    storeId: vendor !== "all" ? vendor : undefined,
    brandId: brandId || undefined,
    sortBy: sortByParam,
    sortOrder: sortOrderParam,
    limit: PAGE_SIZE,
  });

  const apiProducts: MarketplaceProduct[] = productsQuery.products;
  const meta = productsQuery.meta;
  const totalCount = meta?.total ?? apiProducts.length;

  // Apply client-side filters the API doesn't support (price ceiling,
  // "on sale" toggle, "in stock" toggle) to the page's products.
  const filtered = useMemo(() => {
    let list = apiProducts.slice();
    list = list.filter((p) => p.price <= priceMax);
    if (onlyDiscounted) {
      list = list.filter((p) => p.comparePrice && p.comparePrice > p.price);
    }
    if (onlyInStock) {
      list = list.filter((p) => (p.stock ?? 0) > 0);
    }
    return list;
  }, [apiProducts, priceMax, onlyDiscounted, onlyInStock]);

  const activeFilterCount =
    (category !== "all" ? 1 : 0) +
    (vendor !== "all" ? 1 : 0) +
    (brandId ? 1 : 0) +
    (onlyDiscounted ? 1 : 0) +
    (onlyInStock ? 1 : 0) +
    (priceMax < 50000 ? 1 : 0);

  function clearFilters() {
    setCategory("all");
    setVendor("all");
    setBrandId("");
    setPriceMax(50000);
    setOnlyDiscounted(false);
    setOnlyInStock(false);
  }

  const handleQuickView = useCallback((p: MarketplaceProduct) => {
    setQuickViewProduct(p);
  }, []);

  const isLoading = productsQuery.isLoading && apiProducts.length === 0;
  const hasMoreProducts = Boolean(productsQuery.hasNextPage);
  const isFetchingNextPage = productsQuery.isFetchingNextPage;
  const fetchNextPage = productsQuery.fetchNextPage;

  useEffect(() => {
    if (!productsQuery.isLoading && !shouldLoadFilters) {
      const timeout = window.setTimeout(() => setShouldLoadFilters(true), 250);
      return () => window.clearTimeout(timeout);
    }
    return undefined;
  }, [productsQuery.isLoading, shouldLoadFilters]);

  useEffect(() => {
    if (showFilters) setShouldLoadFilters(true);
  }, [showFilters]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0]?.isIntersecting &&
          hasMoreProducts &&
          !isFetchingNextPage
        ) {
          fetchNextPage();
        }
      },
      { rootMargin: "420px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasMoreProducts, isFetchingNextPage]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 700);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="bg-background min-h-screen">
      {/* ── Sort + filter bar ── (no in-page search — header search is the
          universal entry point, spec #15. Text filtering still works via
          ?q= URL param; this bar handles sorting and filters.) */}
      <section className="sticky top-[var(--header-height)] z-30 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="container mx-auto max-w-7xl px-4 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            {/* Result count */}
            <div className="flex-1">
              <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
                All Products
              </h1>
              <p className="text-sm text-kwik-gray-light dark:text-white/70">
                {productsQuery.isLoading ? (
                  <span className="text-kwik-muted">Loading…</span>
                ) : (
                  <>
                    <span className="font-semibold text-kwik-dark dark:text-white">{totalCount}</span>{" "}
                    product{totalCount !== 1 ? "s" : ""}
                    {query ? <> · filtering by &ldquo;<span className="font-semibold text-kwik-orange">{query}</span>&rdquo;</> : null}
                  </>
                )}
              </p>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortOption)}
                  aria-label="Sort products"
                  className="h-11 appearance-none rounded-xl border border-border bg-surface pl-9 pr-8 text-sm font-medium text-foreground focus:border-kwik-orange focus:outline-none focus:ring-2 focus:ring-kwik-orange/20"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-kwik-muted" />
              </div>

              {/* Filter toggle (mobile) */}
              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                className="relative inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-medium text-foreground hover:bg-muted md:hidden"
                aria-label="Toggle filters"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-kwik-orange px-1 text-[10px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                ) : null}
              </button>

              {/* View toggle */}
              <div className="hidden items-center rounded-xl border border-border bg-surface p-1 md:flex">
                <button
                  type="button"
                  onClick={() => setView("grid")}
                  aria-label="Grid view"
                  aria-pressed={view === "grid"}
                  className={cn(
                    "rounded-lg p-2 transition",
                    view === "grid"
                      ? "bg-kwik-orange text-white"
                      : "text-kwik-muted hover:text-foreground",
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setView("list")}
                  aria-label="List view"
                  aria-pressed={view === "list"}
                  className={cn(
                    "rounded-lg p-2 transition",
                    view === "list"
                      ? "bg-kwik-orange text-white"
                      : "text-kwik-muted hover:text-foreground",
                  )}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Body: sidebar filters + product grid ── */}
      <section className="container mx-auto max-w-7xl px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar filters (desktop) */}
          <aside className="hidden w-56 shrink-0 lg:block">
            <FilterPanel
              category={category}
              setCategory={updateFilter(setCategory)}
              vendor={vendor}
              setVendor={updateFilter(setVendor)}
              priceMax={priceMax}
              setPriceMax={updateFilter(setPriceMax)}
              onlyDiscounted={onlyDiscounted}
              setOnlyDiscounted={updateFilter(setOnlyDiscounted)}
              onlyInStock={onlyInStock}
              setOnlyInStock={updateFilter(setOnlyInStock)}
              activeFilterCount={activeFilterCount}
              onClear={clearFilters}
              categoryOptions={categoryOptions}
              vendorOptions={vendorOptions}
            />
          </aside>

          {/* Mobile filter drawer */}
          <AnimatePresence>
            {showFilters ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 md:hidden"
              >
                <div
                  className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                  onClick={() => setShowFilters(false)}
                />
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ type: "spring", damping: 28, stiffness: 280 }}
                  className="absolute left-0 top-0 h-full w-80 max-w-[85vw] overflow-y-auto bg-background p-4 shadow-2xl"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-heading text-lg font-semibold text-foreground">
                      Filters
                    </h2>
                    <button
                      type="button"
                      onClick={() => setShowFilters(false)}
                      aria-label="Close filters"
                      className="rounded-lg p-1.5 text-kwik-muted hover:bg-muted hover:text-foreground"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <FilterPanel
                    category={category}
                    setCategory={updateFilter(setCategory)}
                    vendor={vendor}
                    setVendor={updateFilter(setVendor)}
                    priceMax={priceMax}
                    setPriceMax={updateFilter(setPriceMax)}
                    onlyDiscounted={onlyDiscounted}
                    setOnlyDiscounted={updateFilter(setOnlyDiscounted)}
                    onlyInStock={onlyInStock}
                    setOnlyInStock={updateFilter(setOnlyInStock)}
                    activeFilterCount={activeFilterCount}
                    onClear={clearFilters}
                    categoryOptions={categoryOptions}
                    vendorOptions={vendorOptions}
                  />
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Results */}
          <div className="min-w-0 flex-1">
            {/* Result count + active chips */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-kwik-muted">
                Showing{" "}
                <span className="font-semibold text-foreground">
                  {filtered.length}
                </span>{" "}
                {filtered.length !== totalCount ? (
                  <>
                    of{" "}
                    <span className="font-semibold text-foreground">
                      {totalCount}
                    </span>{" "}
                  </>
                ) : null}
                products
              </p>
              {activeFilterCount > 0 ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 text-xs font-medium text-kwik-orange hover:opacity-80"
                >
                  <X className="h-3.5 w-3.5" /> Clear all filters
                </button>
              ) : null}
            </div>

            {/* Active filter chips */}
            {activeFilterCount > 0 ? (
              <div className="mb-4 flex flex-wrap gap-2">
                {category !== "all" ? (
                  <FilterChip
                    label={
                      categoryOptions.find((c) => c.value === category)?.label ??
                      category
                    }
                    onRemove={() => {
                      setCategory("all");
                    }}
                  />
                ) : null}
                {vendor !== "all" ? (
                  <FilterChip
                    label={
                      vendorOptions.find((v) => v.value === vendor)?.label ??
                      vendor
                    }
                    onRemove={() => {
                      setVendor("all");
                    }}
                  />
                ) : null}
                {brandId ? (
                  <FilterChip
                    label="Brand filter"
                    onRemove={() => {
                      setBrandId("");
                    }}
                  />
                ) : null}
                {onlyDiscounted ? (
                  <FilterChip label="On sale" onRemove={() => {
                    setOnlyDiscounted(false);
                  }} />
                ) : null}
                {onlyInStock ? (
                  <FilterChip label="In stock" onRemove={() => {
                    setOnlyInStock(false);
                  }} />
                ) : null}
                {priceMax < 50000 ? (
                  <FilterChip label={`Under ${formatNGN(priceMax)}`} onRemove={() => {
                    setPriceMax(50000);
                  }} />
                ) : null}
              </div>
            ) : null}

            {/* Loading skeleton */}
            {isLoading ? (
              <ProductGridSkeleton count={8} columns={view === "list" ? 2 : 4} />
            ) : filtered.length === 0 ? (
              <EmptyState
                variant="search"
                title="No products found"
                description="Try adjusting your search or filters to find what you're looking for."
                action={
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      clearFilters();
                    }}
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-kwik-orange px-5 text-sm font-semibold text-white hover:bg-kwik-orange-hover"
                  >
                    Reset all
                  </button>
                }
              />
            ) : view === "grid" ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {filtered.map((product, idx) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(idx * 0.03, 0.3) }}
                  >
                    <MarketplaceProductCard
                      product={product}
                      onQuickView={() => handleQuickView(product)}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              // List view: same MarketplaceProductCard (no per-page card
              // variants) in a denser 3-column grid so the grid/list toggle
              // still changes the browsing density without inventing a
              // second card component.
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((product, idx) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(idx * 0.02, 0.2) }}
                  >
                    <MarketplaceProductCard
                      product={product}
                      onQuickView={() => handleQuickView(product)}
                    />
                  </motion.div>
                ))}
              </div>
            )}

            <div ref={sentinelRef} className="flex items-center justify-center py-8">
              {productsQuery.isFetchingNextPage ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-kwik-orange border-t-transparent" />
                  Loading more products...
                </div>
              ) : hasMoreProducts ? (
                <div className="text-sm text-muted-foreground">Scroll to load more</div>
              ) : filtered.length > 0 ? (
                <div className="text-sm text-muted-foreground">You&apos;ve reached the end of the catalog.</div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {showScrollTop ? (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-5 right-5 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full bg-kwik-orange text-white shadow-lg shadow-kwik-orange/20 transition hover:bg-kwik-orange-hover"
            aria-label="Scroll to top"
          >
            <ArrowUp className="h-5 w-5" />
          </motion.button>
        ) : null}
      </AnimatePresence>

      {/* Quick view modal — opened when a product card is clicked. */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}

// ── Filter panel (shared by desktop sidebar + mobile drawer) ──────────────

interface FilterPanelProps {
  category: string;
  setCategory: (v: string) => void;
  vendor: string;
  setVendor: (v: string) => void;
  priceMax: number;
  setPriceMax: (v: number) => void;
  onlyDiscounted: boolean;
  setOnlyDiscounted: (v: boolean) => void;
  onlyInStock: boolean;
  setOnlyInStock: (v: boolean) => void;
  activeFilterCount: number;
  onClear: () => void;
  categoryOptions: { label: string; value: string }[];
  vendorOptions: { label: string; value: string }[];
}

function FilterPanel(props: FilterPanelProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-foreground">
          Filters
        </h2>
        {props.activeFilterCount > 0 ? (
          <button
            type="button"
            onClick={props.onClear}
            className="text-xs font-medium text-kwik-orange hover:opacity-80"
          >
            Clear ({props.activeFilterCount})
          </button>
        ) : null}
      </div>

      {/* Category */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-kwik-muted">
          Category
        </h3>
        <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
          {props.categoryOptions.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => props.setCategory(c.value)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition",
                props.category === c.value
                  ? "bg-kwik-orange-tint font-medium text-kwik-orange"
                  : "text-foreground hover:bg-muted",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Vendor */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-kwik-muted">
          Vendor
        </h3>
        <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
          {props.vendorOptions.map((v) => (
            <button
              key={v.value}
              type="button"
              onClick={() => props.setVendor(v.value)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition",
                props.vendor === v.value
                  ? "bg-kwik-orange-tint font-medium text-kwik-orange"
                  : "text-foreground hover:bg-muted",
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-kwik-muted">
          Max Price
        </h3>
        <input
          type="range"
          min={2000}
          max={50000}
          step={1000}
          value={props.priceMax}
          onChange={(e) => props.setPriceMax(Number(e.target.value))}
          className="w-full accent-kwik-orange"
          aria-label="Maximum price"
        />
        <div className="mt-1 flex justify-between text-xs text-kwik-muted">
          <span>{formatNGN(2000)}</span>
          <span className="font-semibold text-foreground">{formatNGN(props.priceMax)}</span>
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-2">
        <label className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 hover:bg-muted">
          <span className="text-sm text-foreground">On sale only</span>
          <input
            type="checkbox"
            checked={props.onlyDiscounted}
            onChange={(e) => props.setOnlyDiscounted(e.target.checked)}
            className="h-4 w-4 accent-kwik-orange"
          />
        </label>
        <label className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 hover:bg-muted">
          <span className="text-sm text-foreground">In stock only</span>
          <input
            type="checkbox"
            checked={props.onlyInStock}
            onChange={(e) => props.setOnlyInStock(e.target.checked)}
            className="h-4 w-4 accent-kwik-orange"
          />
        </label>
      </div>
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-kwik-orange/30 bg-kwik-orange-tint py-1 pl-3 pr-2 text-xs font-medium text-kwik-orange">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="rounded-full p-0.5 hover:bg-kwik-orange/20"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-7xl px-4 py-10">
          <ProductGridSkeleton count={8} columns={4} />
        </div>
      }
    >
      <ProductsBrowseContent />
    </Suspense>
  );
}
