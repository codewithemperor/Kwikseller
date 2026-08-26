"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button, Checkbox, Drawer } from "@heroui/react";
import {
  ArrowLeft,
  PackageOpen,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MarketplaceProductCard } from "@/components/landing/shared/marketplace-product-card";
import { ProductListingToolbar } from "@/components/product/product-listing-toolbar";
import {
  useBrands,
  useCategoryBySlug,
  useProducts,
  toMarketplaceProduct,
  type Category,
} from "@/lib/api-hooks";
import type { MarketplaceProduct } from "@/data/marketplace-home";
import { productMatchesQuery } from "@/lib/product-search";
import { useHeaderSearch } from "@/components/layout/marketplace-shell-context";

const QuickViewModal = dynamic(
  () =>
    import("@/components/landing/quick-view-modal").then(
      (mod) => mod.QuickViewModal,
    ),
  { ssr: false },
);

// ─── Sort options ───────────────────────────────────────────────────────────

type SortValue =
  | "relevance"
  | "price-asc"
  | "price-desc"
  | "rating"
  | "newest"
  | "best-selling";

const SORT_OPTIONS: { value: SortValue; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "newest", label: "Newest" },
  { value: "best-selling", label: "Best Selling" },
];

const PAGE_SIZE = 12;

/**
 * Normalize the category response shape.
 *
 * The dummy route returns a flat `{ ...category, products }` while the real
 * NestJS backend returns `{ category, products }`. This helper accepts either
 * and returns the category object (without products — those come from the
 * dedicated products query).
 */
function normalizeCategory(raw: unknown): Category | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  // Real backend shape: { category: {...}, products: [...] }
  if (obj.category && typeof obj.category === "object") {
    return obj.category as Category;
  }
  // Dummy shape: { ...categoryFields, products: [...] }
  if ("id" in obj || "name" in obj) {
    return obj as unknown as Category;
  }
  return null;
}

// ─── Checkbox row ───────────────────────────────────────────────────────────

function FilterCheckbox({
  checked,
  onChange,
  label,
  count,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: React.ReactNode;
  count?: number;
}) {
  return (
    <Checkbox
      isSelected={checked}
      onChange={() => onChange(!checked)}
      className={cn(
        "group flex w-full rounded-lg px-2.5 py-2 text-sm transition-colors",
        checked
          ? "bg-kwik-orange-tint font-medium text-kwik-orange"
          : "text-foreground hover:bg-muted",
      )}
    >
      <Checkbox.Content className="!flex !flex-row !items-center !gap-2">
        <Checkbox.Control className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-border bg-background text-accent-foreground shadow-none transition-colors group-data-[selected=true]:border-accent group-data-[selected=true]:bg-accent dark:border-white/20">
          <Checkbox.Indicator />
        </Checkbox.Control>
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {typeof count === "number" ? (
          <span
            className={cn(
              "shrink-0 text-xs",
              checked ? "text-kwik-orange" : "text-muted-foreground",
            )}
          >
            {count}
          </span>
        ) : null}
      </Checkbox.Content>
    </Checkbox>
  );
}

// ─── Filter panel (shared by desktop sidebar + mobile drawer) ───────────────

interface FilterState {
  brandIds: string[];
  minPrice: string;
  maxPrice: string;
  minRating: number;
  inStockOnly: boolean;
}

const EMPTY_FILTERS: FilterState = {
  brandIds: [],
  minPrice: "",
  maxPrice: "",
  minRating: 0,
  inStockOnly: false,
};

function FilterPanel({
  filters,
  setFilters,
  brands,
  brandCounts,
  subCategories,
  activeSubCategoryId,
  onSubCategoryChange,
  onClear,
  priceBounds,
  showHeader = true,
}: {
  filters: FilterState;
  setFilters: (next: FilterState) => void;
  brands: { id: string; name: string }[];
  brandCounts: Record<string, number>;
  subCategories: Category[];
  activeSubCategoryId: string | null;
  onSubCategoryChange: (id: string | null) => void;
  onClear: () => void;
  priceBounds: { min: number; max: number };
  showHeader?: boolean;
}) {
  const toggleBrand = (id: string) => {
    setFilters({
      ...filters,
      brandIds: filters.brandIds.includes(id)
        ? filters.brandIds.filter((b) => b !== id)
        : [...filters.brandIds, id],
    });
  };

  return (
    <div className="flex flex-col">
      {/* Active filters / clear */}
      {showHeader ? (
        <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="text-sm font-semibold text-foreground">Filters</h3>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-medium text-kwik-orange hover:underline"
        >
          Clear all
        </button>
      </div>
      ) : null}

      {/* Sub-categories */}
      {subCategories.length > 0 && (
        <CategoryFilterSection title="Sub-categories">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => onSubCategoryChange(null)}
              className={cn(
                "block w-full truncate rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                activeSubCategoryId === null
                  ? "bg-kwik-orange-tint font-medium text-kwik-orange"
                  : "text-foreground hover:bg-muted",
              )}
            >
              All
            </button>
            {subCategories.map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => onSubCategoryChange(sub.id)}
                className={cn(
                  "block w-full truncate rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                  activeSubCategoryId === sub.id
                    ? "bg-kwik-orange-tint font-medium text-kwik-orange"
                    : "text-foreground hover:bg-muted",
                )}
              >
                {sub.name}
              </button>
            ))}
          </div>
        </CategoryFilterSection>
      )}

      {/* Price range */}
      <CategoryFilterSection title="Price range">
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            placeholder={String(priceBounds.min)}
            value={filters.minPrice}
            onChange={(e) =>
              setFilters({ ...filters, minPrice: e.target.value })
            }
            className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus:border-kwik-orange"
          />
          <span className="text-muted-foreground">—</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder={String(priceBounds.max)}
            value={filters.maxPrice}
            onChange={(e) =>
              setFilters({ ...filters, maxPrice: e.target.value })
            }
            className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus:border-kwik-orange"
          />
        </div>
      </CategoryFilterSection>

      {/* Brands */}
      {brands.length > 0 && (
        <CategoryFilterSection title="Brands">
          <div className="max-h-48 space-y-0.5 overflow-y-auto pr-1">
            {brands.map((brand) => (
              <FilterCheckbox
                key={brand.id}
                checked={filters.brandIds.includes(brand.id)}
                onChange={() => toggleBrand(brand.id)}
                label={brand.name}
                count={brandCounts[brand.id]}
              />
            ))}
          </div>
        </CategoryFilterSection>
      )}

      {/* Rating */}
      <CategoryFilterSection title="Customer rating">
        <div className="space-y-1">
          {[4, 3, 2, 1].map((r) => {
            const isActive = filters.minRating === r;
            return (
              <FilterCheckbox
                key={r}
                checked={isActive}
                onChange={() =>
                  setFilters({
                    ...filters,
                    minRating: isActive ? 0 : r,
                  })
                }
                label={
                  <span className="flex items-center gap-1">
                    <span className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-3.5 w-3.5",
                            i < r
                              ? "fill-kwik-orange text-kwik-orange"
                              : "text-muted-foreground/40",
                          )}
                        />
                      ))}
                    </span>
                    <span className="text-xs">&amp; up</span>
                  </span>
                }
              />
            );
          })}
        </div>
      </CategoryFilterSection>

      {/* Availability */}
      <CategoryFilterSection title="Availability">
        <FilterCheckbox
          checked={filters.inStockOnly}
          onChange={(next) => setFilters({ ...filters, inStockOnly: next })}
          label="In stock only"
        />
      </CategoryFilterSection>
    </div>
  );
}

function CategoryFilterDrawer({
  open,
  onClose,
  filters,
  activeSubCategoryId,
  brands,
  brandCounts,
  subCategories,
  priceBounds,
  onApply,
  onClear,
}: {
  open: boolean;
  onClose: () => void;
  filters: FilterState;
  activeSubCategoryId: string | null;
  brands: { id: string; name: string }[];
  brandCounts: Record<string, number>;
  subCategories: Category[];
  priceBounds: { min: number; max: number };
  onApply: (filters: FilterState, subCategoryId: string | null) => void;
  onClear: () => void;
}) {
  const [draftFilters, setDraftFilters] = useState<FilterState>(filters);
  const [draftSubCategoryId, setDraftSubCategoryId] = useState<string | null>(
    activeSubCategoryId,
  );

  React.useEffect(() => {
    if (!open) return;
    setDraftFilters(filters);
    setDraftSubCategoryId(activeSubCategoryId);
  }, [activeSubCategoryId, filters, open]);

  const handleClear = () => {
    setDraftFilters(EMPTY_FILTERS);
    setDraftSubCategoryId(null);
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
              filters={draftFilters}
              setFilters={setDraftFilters}
              brands={brands}
              brandCounts={brandCounts}
              subCategories={subCategories}
              activeSubCategoryId={draftSubCategoryId}
              onSubCategoryChange={setDraftSubCategoryId}
              onClear={handleClear}
              priceBounds={priceBounds}
              showHeader={false}
            />
          </Drawer.Body>
          <Drawer.Footer className="shrink-0 gap-2 border-t border-border bg-background">
            <Button slot="close" variant="secondary" onPress={handleClear}>
              Clear all
            </Button>
            <Button
              slot="close"
              variant="primary"
              onPress={() => {
                onApply(draftFilters, draftSubCategoryId);
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

function CategoryFilterSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
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

// ─── Main page component ────────────────────────────────────────────────────

export default function CategoryDetailPage() {
  const params = useParams<{ id: string }>();
  const idParam = params?.id ?? "";

  // Category metadata (param is treated as a slug — CategoryCard links to
  // /categories/[slug], falling back to id when no slug exists).
  const categoryQuery = useCategoryBySlug(idParam);
  const rawCategoryData = categoryQuery.data;
  const category = useMemo(
    () => normalizeCategory(rawCategoryData),
    [rawCategoryData],
  );
  const [serverSearchQuery, setServerSearchQuery] = useState("");

  // Products — fetch a generous batch for the resolved category, then filter,
  // sort and paginate client-side for an instant, consistent UX.
  const productsQuery = useProducts({
    categoryId: category?.id,
    search: serverSearchQuery || undefined,
    limit: 100,
  });

  // Brands (for the brand filter).
  const brandsQuery = useBrands();
  const brands = useMemo(
    () =>
      (brandsQuery.data ?? []).map((b: { id: string; name: string }) => ({
        id: b.id,
        name: b.name,
      })),
    [brandsQuery.data],
  );

  // ── UI state ──
  const [sortBy, setSortBy] = useState<SortValue>("relevance");
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [activeSubCategoryId, setActiveSubCategoryId] = useState<string | null>(
    null,
  );
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] =
    useState<MarketplaceProduct | null>(null);

  React.useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedSearchQuery(searchQuery.trim()),
      300,
    );
    return () => window.clearTimeout(timeout);
  }, [searchQuery]);

  // Reset visible count when filters/search/sort change. Using the
  // "adjust state during render" pattern (instead of useEffect) avoids
  // cascading renders — see https://react.dev/reference/react/useState#storing-information-from-previous-renders
  const [resetKey, setResetKey] = useState("");
  const currentResetKey = `${sortBy}|${JSON.stringify(filters)}|${activeSubCategoryId}|${debouncedSearchQuery}`;
  if (currentResetKey !== resetKey) {
    setResetKey(currentResetKey);
    setVisibleCount(PAGE_SIZE);
  }

  // All products for this category (mapped to marketplace shape).
  const allProducts: MarketplaceProduct[] = useMemo(() => {
    const raw = productsQuery.data?.products ?? [];
    // Also include products that came embedded in the category response (the
    // dummy route attaches them). We prefer the dedicated products query.
    if (raw.length > 0) return raw;
    if (rawCategoryData && typeof rawCategoryData === "object") {
      const obj = rawCategoryData as unknown as Record<string, unknown>;
      const embedded = obj.products;
      if (Array.isArray(embedded)) {
        return (embedded as unknown[]).map((p) =>
          toMarketplaceProduct(p as Parameters<typeof toMarketplaceProduct>[0]),
        );
      }
    }
    return [];
  }, [productsQuery.data, rawCategoryData]);

  React.useEffect(() => {
    const term = debouncedSearchQuery.trim();
    if (!term) {
      if (serverSearchQuery) setServerSearchQuery("");
      return;
    }

    if (serverSearchQuery === term || productsQuery.isLoading) return;

    const hasLoadedMatch = allProducts.some((product) =>
      productMatchesQuery(product, term),
    );

    if (!hasLoadedMatch) {
      setServerSearchQuery(term);
    }
  }, [
    allProducts,
    debouncedSearchQuery,
    productsQuery.isLoading,
    serverSearchQuery,
  ]);

  // Price bounds (for the placeholder hints in the price filter).
  const priceBounds = useMemo(() => {
    if (allProducts.length === 0) return { min: 0, max: 100000 };
    let min = Infinity;
    let max = 0;
    for (const p of allProducts) {
      if (p.price < min) min = p.price;
      if (p.price > max) max = p.price;
    }
    return { min: Math.floor(min), max: Math.ceil(max) };
  }, [allProducts]);

  // Brand product counts (within this category's product set).
  const brandCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of allProducts) {
      if (p.brandId) {
        counts[p.brandId] = (counts[p.brandId] ?? 0) + 1;
      }
    }
    return counts;
  }, [allProducts]);

  // Only show brands that actually have products in this category.
  const relevantBrands = useMemo(
    () => brands.filter((b) => brandCounts[b.id] > 0),
    [brands, brandCounts],
  );

  // Apply filters + sort.
  const filteredProducts = useMemo(() => {
    let list = allProducts;

    // Sub-category filter — narrows to products whose categoryId matches the
    // selected child category.
    if (activeSubCategoryId) {
      list = list.filter((p) => p.categoryId === activeSubCategoryId);
    }

    if (debouncedSearchQuery) {
      list = list.filter((p) =>
        productMatchesQuery(p, debouncedSearchQuery),
      );
    }

    // Price range
    const minP = filters.minPrice ? Number(filters.minPrice) : -Infinity;
    const maxP = filters.maxPrice ? Number(filters.maxPrice) : Infinity;
    if (filters.minPrice || filters.maxPrice) {
      list = list.filter((p) => p.price >= minP && p.price <= maxP);
    }

    // Brands
    if (filters.brandIds.length > 0) {
      list = list.filter(
        (p) => p.brandId != null && filters.brandIds.includes(p.brandId),
      );
    }

    // Rating
    if (filters.minRating > 0) {
      list = list.filter((p) => p.rating >= filters.minRating);
    }

    // In stock
    if (filters.inStockOnly) {
      list = list.filter(
        (p) => p.stock === undefined || p.stock > 0 || !p.trackInventory,
      );
    }

    // Sort
    const sorted = [...list];
    switch (sortBy) {
      case "price-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        sorted.sort(
          (a, b) => Number(b.isNew ?? false) - Number(a.isNew ?? false),
        );
        break;
      case "best-selling":
        sorted.sort(
          (a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0),
        );
        break;
      default:
        break;
    }
    return sorted;
  }, [allProducts, debouncedSearchQuery, filters, sortBy, activeSubCategoryId]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  const subCategories = useMemo(
    () => category?.children ?? [],
    [category],
  );

  const handleClearFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setActiveSubCategoryId(null);
  }, []);

  const filteredCount = filteredProducts.length;
  const categoryName = category?.name ?? "Category";
  const activeFilterCount =
    filters.brandIds.length +
    (filters.minRating ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0) +
    (filters.minPrice ? 1 : 0) +
    (filters.maxPrice ? 1 : 0) +
    (activeSubCategoryId ? 1 : 0);
  const headerSearchConfig = useMemo(
    () => ({
      value: searchQuery,
      onChange: setSearchQuery,
      placeholder: `Search in ${categoryName}...`,
      onToggleFilters: () => setMobileFiltersOpen(true),
      showFilters: mobileFiltersOpen,
      activeFilterCount,
    }),
    [activeFilterCount, categoryName, mobileFiltersOpen, searchQuery],
  );

  useHeaderSearch(category ? headerSearchConfig : null);

  // ── Loading ──
  if (categoryQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-background">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="py-3">
              <div className="h-3 w-48 animate-pulse rounded bg-muted" />
            </div>
            <div className="flex items-center gap-4 pb-5">
              <div className="h-14 w-14 animate-pulse rounded-xl bg-muted" />
              <div className="space-y-2">
                <div className="h-6 w-40 animate-pulse rounded bg-muted" />
                <div className="h-3 w-56 animate-pulse rounded bg-muted" />
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="space-y-3 border border-border bg-background p-3"
              >
                <div className="aspect-square animate-pulse bg-muted" />
                <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Not found ──
  if (!category) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-muted">
              <PackageOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-foreground">
              Category not found
            </h1>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              We couldn&apos;t find the category you&apos;re looking for. It may
              have been moved or is no longer available.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/categories"
                className="inline-flex h-11 items-center justify-center rounded-md bg-kwik-orange px-5 text-sm font-semibold text-white transition-colors hover:bg-kwik-orange-hover"
              >
                Browse all categories
              </Link>
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <ArrowLeft className="h-4 w-4" /> Back home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ProductListingToolbar
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Categories", href: "/categories" },
          { label: category.name },
        ]}
        sortControl={
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortValue)}
            aria-label="Sort products"
            className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground outline-none transition-colors hover:border-kwik-orange/50 focus:border-kwik-orange focus:ring-2 focus:ring-kwik-orange/15"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        }
      />

      {/* ── Body: sidebar + product grid ── */}
      <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-lg border border-border bg-background p-4">
              <FilterPanel
                filters={filters}
                setFilters={setFilters}
                brands={relevantBrands}
                brandCounts={brandCounts}
                subCategories={subCategories}
                activeSubCategoryId={activeSubCategoryId}
                onSubCategoryChange={setActiveSubCategoryId}
                onClear={handleClearFilters}
                priceBounds={priceBounds}
              />
            </div>
          </aside>

          {/* Product area */}
          <div className="min-w-0 flex-1">
            {/* Loading */}
            {productsQuery.isLoading && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="space-y-3 border border-border bg-background p-3"
                  >
                    <div className="aspect-square animate-pulse bg-muted" />
                    <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty */}
            {!productsQuery.isLoading && filteredCount === 0 && (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background py-20 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <PackageOpen className="h-7 w-7 text-muted-foreground" />
                </div>
                <h2 className="mt-5 text-lg font-semibold text-foreground">
                  {filters.brandIds.length || filters.minRating || filters.inStockOnly || filters.minPrice || filters.maxPrice
                    ? "No matching products"
                    : "No products yet"}
                </h2>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  {filters.brandIds.length || filters.minRating || filters.inStockOnly || filters.minPrice || filters.maxPrice
                    ? "Try adjusting your filters to find what you're looking for."
                    : `Products in ${category.name} will appear here once sellers list them.`}
                </p>
                {(filters.brandIds.length ||
                  filters.minRating ||
                  filters.inStockOnly ||
                  filters.minPrice ||
                  filters.maxPrice) && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="mt-5 inline-flex h-10 items-center justify-center rounded-md border border-kwik-orange px-5 text-sm font-semibold text-kwik-orange transition-colors hover:bg-kwik-orange-tint"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}

            {/* Product grid */}
            {!productsQuery.isLoading && filteredCount > 0 && (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {visibleProducts.map((product, index) => (
                    <MarketplaceProductCard
                      key={`${product.id}-${index}`}
                      product={product}
                      onQuickView={() => setQuickViewProduct(product)}
                    />
                  ))}
                </div>

                {/* Load more */}
                {hasMore && (
                  <div className="mt-8 flex flex-col items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleCount((c) => c + PAGE_SIZE)
                      }
                      className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-8 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                    >
                      Load more
                    </button>
                  </div>
                )}

                {!hasMore && filteredCount > PAGE_SIZE && (
                  <p className="mt-8 text-center text-sm text-muted-foreground">
                    You&apos;ve seen all {category.name}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <CategoryFilterDrawer
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        filters={filters}
        activeSubCategoryId={activeSubCategoryId}
        brands={relevantBrands}
        brandCounts={brandCounts}
        subCategories={subCategories}
        priceBounds={priceBounds}
        onApply={(nextFilters, nextSubCategoryId) => {
          setFilters(nextFilters);
          setActiveSubCategoryId(nextSubCategoryId);
        }}
        onClear={handleClearFilters}
      />

      {/* ── Quick view ── */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}
