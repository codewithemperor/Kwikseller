"use client";

import { useState, useEffect, Suspense, useMemo, useCallback, useRef, type ReactNode } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Checkbox, Drawer } from "@heroui/react";
import {
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
import { ProductListingToolbar } from "@/components/product/product-listing-toolbar";
import { useHeaderSearch } from "@/components/layout/marketplace-shell-context";
import type { MarketplaceProduct } from "@/data/marketplace-home";
import { productMatchesQuery } from "@/lib/product-search";

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
  const initialCategories = searchParams.get("categoryIds")?.split(",").filter(Boolean) ?? [];
  const initialVendors = searchParams.get("storeIds")?.split(",").filter(Boolean) ?? [];

  const [query, setQuery] = useState(initialQuery);
  const [categoryIds, setCategoryIds] = useState<string[]>(initialCategories);
  const [storeIds, setStoreIds] = useState<string[]>(initialVendors);
  const [sort, setSort] = useState<SortOption>("popular");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [priceMax, setPriceMax] = useState<number>(50000);
  const [onlyDiscounted, setOnlyDiscounted] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [serverQuery, setServerQuery] = useState(initialQuery);
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
    if (categoryIds.length) params.set("categoryIds", categoryIds.join(","));
    if (storeIds.length) params.set("storeIds", storeIds.join(","));
    const qs = params.toString();
    router.replace(qs ? `/products?${qs}` : "/products", { scroll: false });
  }, [query, categoryIds, storeIds, router]);

  const [quickViewProduct, setQuickViewProduct] = useState<MarketplaceProduct | null>(null);

  // ── Filter option lists from the API ───────────────────────────────────
  const categoriesQuery = useCategories(shouldLoadFilters);
  const storesQuery = useStores(undefined, shouldLoadFilters);

  const categoryOptions = useMemo(() => {
    const cats = categoriesQuery.data ?? [];
    return [
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
    search: serverQuery.trim() || undefined,
    categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
    storeIds: storeIds.length > 0 ? storeIds : undefined,
    sortBy: sortByParam,
    sortOrder: sortOrderParam,
    limit: PAGE_SIZE,
  });

  const apiProducts: MarketplaceProduct[] = productsQuery.products;

  // Apply client-side filters the API doesn't support (price ceiling,
  // "on sale" toggle, "in stock" toggle) to the page's products.
  const filtered = useMemo(() => {
    let list = apiProducts.slice();
    const term = debouncedQuery.trim();
    if (term) {
      list = list.filter((p) => productMatchesQuery(p, term));
    }
    list = list.filter((p) => p.price <= priceMax);
    if (onlyDiscounted) {
      list = list.filter((p) => p.comparePrice && p.comparePrice > p.price);
    }
    if (onlyInStock) {
      list = list.filter((p) => (p.stock ?? 0) > 0);
    }
    return list;
  }, [apiProducts, debouncedQuery, priceMax, onlyDiscounted, onlyInStock]);

  useEffect(() => {
    const term = debouncedQuery.trim();
    if (!term) {
      if (serverQuery) setServerQuery("");
      return;
    }

    if (serverQuery === term || productsQuery.isLoading) return;

    const hasLoadedMatch = apiProducts.some((product) =>
      productMatchesQuery(product, term),
    );

    if (!hasLoadedMatch) {
      setServerQuery(term);
    }
  }, [apiProducts, debouncedQuery, productsQuery.isLoading, serverQuery]);

  const activeFilterCount =
    categoryIds.length +
    storeIds.length +
    (onlyDiscounted ? 1 : 0) +
    (onlyInStock ? 1 : 0) +
    (priceMax < 50000 ? 1 : 0);

  function clearFilters() {
    setCategoryIds([]);
    setStoreIds([]);
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
  const headerSearchConfig = useMemo(
    () => ({
      value: query,
      onChange: setQuery,
      placeholder: "Search loaded products, then the full catalog...",
      onToggleFilters: () => setShowFilters(true),
      showFilters,
      activeFilterCount,
    }),
    [activeFilterCount, query, showFilters],
  );

  useHeaderSearch(headerSearchConfig);

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
      <ProductListingToolbar
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Products" },
        ]}
        sortControl={
          <div className="flex items-center gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              aria-label="Sort products"
              className="h-8 rounded-lg border border-border bg-surface px-2.5 text-xs font-medium text-foreground focus:border-kwik-orange focus:outline-none focus:ring-2 focus:ring-kwik-orange/15"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

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
        }
      />

      {/* ── Body: sidebar filters + product grid ── */}
      <section className="container mx-auto max-w-7xl px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar filters (desktop) */}
          <aside className="hidden w-56 shrink-0 lg:block">
            <FilterPanel
              categoryIds={categoryIds}
              setCategoryIds={updateFilter(setCategoryIds)}
              storeIds={storeIds}
              setStoreIds={updateFilter(setStoreIds)}
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
          <ProductFilterDrawer
            open={showFilters}
            onClose={() => setShowFilters(false)}
            filters={{
              categoryIds,
              storeIds,
              priceMax,
              onlyDiscounted,
              onlyInStock,
            }}
            activeFilterCount={activeFilterCount}
            categoryOptions={categoryOptions}
            vendorOptions={vendorOptions}
            onApply={(next) => {
              setCategoryIds(next.categoryIds);
              setStoreIds(next.storeIds);
              setPriceMax(next.priceMax);
              setOnlyDiscounted(next.onlyDiscounted);
              setOnlyInStock(next.onlyInStock);
            }}
            onClear={clearFilters}
          />

          {/* Results */}
          <div className="min-w-0 flex-1">
            <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
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
                {categoryIds.map((categoryId) => (
                  <FilterChip
                    key={categoryId}
                    label={
                      categoryOptions.find((c) => c.value === categoryId)?.label ??
                      categoryId
                    }
                    onRemove={() => {
                      setCategoryIds((current) => current.filter((id) => id !== categoryId));
                    }}
                  />
                ))}
                {storeIds.map((storeId) => (
                  <FilterChip
                    key={storeId}
                    label={
                      vendorOptions.find((v) => v.value === storeId)?.label ??
                      storeId
                    }
                    onRemove={() => {
                      setStoreIds((current) => current.filter((id) => id !== storeId));
                    }}
                  />
                ))}
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
                <div className="text-sm text-muted-foreground">You&apos;re at the end of the catalog.</div>
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
            className="fixed bottom-24 left-5 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full bg-kwik-orange text-white shadow-lg shadow-kwik-orange/20 transition hover:bg-kwik-orange-hover md:bottom-5"
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
  categoryIds: string[];
  setCategoryIds: (v: string[]) => void;
  storeIds: string[];
  setStoreIds: (v: string[]) => void;
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
  showHeader?: boolean;
}

function FilterPanel(props: FilterPanelProps) {
  const toggleValue = (values: string[], value: string) =>
    values.includes(value)
      ? values.filter((item) => item !== value)
      : [...values, value];

  return (
    <div className="flex flex-col">
      {props.showHeader !== false ? (
        <div className="flex items-center justify-between border-b border-border pb-3">
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
      ) : null}

      <ProductFilterSection title="Category">
        <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
          {props.categoryOptions.map((c) => (
            <Checkbox
              key={c.value}
              isSelected={props.categoryIds.includes(c.value)}
              onChange={() => props.setCategoryIds(toggleValue(props.categoryIds, c.value))}
              className={cn(
                "group flex w-full rounded-lg px-2.5 py-2 text-sm transition-colors",
                props.categoryIds.includes(c.value)
                  ? "bg-kwik-orange-tint font-medium text-kwik-orange"
                  : "text-foreground hover:bg-muted",
              )}
            >
              <Checkbox.Content className="!flex !flex-row !items-center !gap-2">
                <Checkbox.Control className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-border bg-background text-accent-foreground shadow-none transition-colors group-data-[selected=true]:border-accent group-data-[selected=true]:bg-accent dark:border-white/20">
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <span className="min-w-0 flex-1 truncate">{c.label}</span>
              </Checkbox.Content>
            </Checkbox>
          ))}
        </div>
      </ProductFilterSection>

      <ProductFilterSection title="Vendor">
        <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
          {props.vendorOptions.map((v) => (
            <Checkbox
              key={v.value}
              isSelected={props.storeIds.includes(v.value)}
              onChange={() => props.setStoreIds(toggleValue(props.storeIds, v.value))}
              className={cn(
                "group flex w-full rounded-lg px-2.5 py-2 text-sm transition-colors",
                props.storeIds.includes(v.value)
                  ? "bg-kwik-orange-tint font-medium text-kwik-orange"
                  : "text-foreground hover:bg-muted",
              )}
            >
              <Checkbox.Content className="!flex !flex-row !items-center !gap-2">
                <Checkbox.Control className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-border bg-background text-accent-foreground shadow-none transition-colors group-data-[selected=true]:border-accent group-data-[selected=true]:bg-accent dark:border-white/20">
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <span className="min-w-0 flex-1 truncate">{v.label}</span>
              </Checkbox.Content>
            </Checkbox>
          ))}
        </div>
      </ProductFilterSection>

      <ProductFilterSection title="Max Price">
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
      </ProductFilterSection>

      <ProductFilterSection title="Availability">
        <div className="space-y-2">
          <Checkbox
            isSelected={props.onlyDiscounted}
            onChange={() => props.setOnlyDiscounted(!props.onlyDiscounted)}
            className={cn(
              "group flex w-full rounded-lg px-2.5 py-2 text-sm transition-colors",
              props.onlyDiscounted
                ? "bg-kwik-orange-tint font-medium text-kwik-orange"
                : "text-foreground hover:bg-muted",
            )}
          >
            <Checkbox.Content className="!flex !flex-row !items-center !gap-2">
              <Checkbox.Control className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-border bg-background text-accent-foreground shadow-none transition-colors group-data-[selected=true]:border-accent group-data-[selected=true]:bg-accent dark:border-white/20">
                <Checkbox.Indicator />
              </Checkbox.Control>
              <span className="min-w-0 flex-1 truncate">On sale only</span>
            </Checkbox.Content>
          </Checkbox>
          <Checkbox
            isSelected={props.onlyInStock}
            onChange={() => props.setOnlyInStock(!props.onlyInStock)}
            className={cn(
              "group flex w-full rounded-lg px-2.5 py-2 text-sm transition-colors",
              props.onlyInStock
                ? "bg-kwik-orange-tint font-medium text-kwik-orange"
                : "text-foreground hover:bg-muted",
            )}
          >
            <Checkbox.Content className="!flex !flex-row !items-center !gap-2">
              <Checkbox.Control className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-border bg-background text-accent-foreground shadow-none transition-colors group-data-[selected=true]:border-accent group-data-[selected=true]:bg-accent dark:border-white/20">
                <Checkbox.Indicator />
              </Checkbox.Control>
              <span className="min-w-0 flex-1 truncate">In stock only</span>
            </Checkbox.Content>
          </Checkbox>
        </div>
      </ProductFilterSection>
    </div>
  );
}

interface ProductFilterDraft {
  categoryIds: string[];
  storeIds: string[];
  priceMax: number;
  onlyDiscounted: boolean;
  onlyInStock: boolean;
}

function ProductFilterDrawer({
  open,
  onClose,
  filters,
  activeFilterCount,
  categoryOptions,
  vendorOptions,
  onApply,
  onClear,
}: {
  open: boolean;
  onClose: () => void;
  filters: ProductFilterDraft;
  activeFilterCount: number;
  categoryOptions: { label: string; value: string }[];
  vendorOptions: { label: string; value: string }[];
  onApply: (next: ProductFilterDraft) => void;
  onClear: () => void;
}) {
  const [draft, setDraft] = useState<ProductFilterDraft>(filters);

  useEffect(() => {
    if (open) setDraft(filters);
  }, [filters, open]);

  const clearDraft = () => {
    const next = {
      categoryIds: [],
      storeIds: [],
      priceMax: 50000,
      onlyDiscounted: false,
      onlyInStock: false,
    };
    setDraft(next);
    onClear();
    onClose();
  };

  return (
    <Drawer.Backdrop isOpen={open} onOpenChange={(next) => !next && onClose()} variant="blur">
      <Drawer.Content placement="right" className="lg:hidden">
        <Drawer.Dialog className="flex h-full flex-col border-l border-border bg-background">
          <Drawer.CloseTrigger />
          <Drawer.Header>
            <Drawer.Heading>Filters</Drawer.Heading>
          </Drawer.Header>
          <Drawer.Body className="flex-1 overflow-y-auto">
            <FilterPanel
              categoryIds={draft.categoryIds}
              setCategoryIds={(value) => setDraft((current) => ({ ...current, categoryIds: value }))}
              storeIds={draft.storeIds}
              setStoreIds={(value) => setDraft((current) => ({ ...current, storeIds: value }))}
              priceMax={draft.priceMax}
              setPriceMax={(value) => setDraft((current) => ({ ...current, priceMax: value }))}
              onlyDiscounted={draft.onlyDiscounted}
              setOnlyDiscounted={(value) => setDraft((current) => ({ ...current, onlyDiscounted: value }))}
              onlyInStock={draft.onlyInStock}
              setOnlyInStock={(value) => setDraft((current) => ({ ...current, onlyInStock: value }))}
              activeFilterCount={activeFilterCount}
              onClear={clearDraft}
              categoryOptions={categoryOptions}
              vendorOptions={vendorOptions}
              showHeader={false}
            />
          </Drawer.Body>
          <Drawer.Footer className="shrink-0 gap-2 border-t border-border bg-background">
            <Button slot="close" variant="secondary" onPress={clearDraft}>
              Clear all
            </Button>
            <Button
              slot="close"
              variant="primary"
              onPress={() => {
                onApply(draft);
                onClose();
              }}
            >
              Apply filters
            </Button>
          </Drawer.Footer>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}

function ProductFilterSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border py-4">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <span
          className={cn(
            "text-xs text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        >
          v
        </span>
      </button>
      {open ? <div className="mt-3">{children}</div> : null}
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
