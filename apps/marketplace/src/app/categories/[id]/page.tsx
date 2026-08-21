"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ChevronRight,
  Filter,
  PackageOpen,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CATEGORY_CARD_ACCENT_COLORS,
  CATEGORY_STYLES,
  DEFAULT_CATEGORY_STYLE,
  type CategoryStyle,
} from "@/constants/marketplace";
import { MarketplaceProductCard } from "@/components/landing/shared/marketplace-product-card";
import {
  useBrands,
  useCategoryBySlug,
  useProducts,
  toMarketplaceProduct,
  type Category,
} from "@/lib/api-hooks";
import type { MarketplaceProduct } from "@/data/marketplace-home";

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

// ─── Helpers ────────────────────────────────────────────────────────────────

function resolveCategoryStyle(
  name: string,
  slug: string,
  index: number,
): CategoryStyle {
  const key = (slug || "").toLowerCase();
  if (CATEGORY_STYLES[key]) return CATEGORY_STYLES[key];
  for (const [k, v] of Object.entries(CATEGORY_STYLES)) {
    if (name.toLowerCase().includes(k) || key.includes(k)) return v;
  }
  const colorIdx = index % CATEGORY_CARD_ACCENT_COLORS.length;
  return {
    color: CATEGORY_CARD_ACCENT_COLORS[colorIdx],
    textColor: CATEGORY_CARD_ACCENT_COLORS[colorIdx],
    Icon: DEFAULT_CATEGORY_STYLE.Icon,
  };
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}

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
  label: string;
  count?: number;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1.5 text-sm text-foreground group">
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
          checked
            ? "border-kwik-orange bg-kwik-orange text-white"
            : "border-border bg-background group-hover:border-kwik-orange",
        )}
      >
        {checked && (
          <svg
            className="h-3 w-3"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2.5 6L5 8.5L9.5 3.5"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span className="flex-1 truncate">{label}</span>
      {typeof count === "number" && (
        <span className="text-xs text-muted-foreground">{count}</span>
      )}
    </label>
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
    <div className="space-y-6">
      {/* Active filters / clear */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Filters</h3>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-medium text-kwik-orange hover:underline"
        >
          Clear all
        </button>
      </div>

      {/* Sub-categories */}
      {subCategories.length > 0 && (
        <div className="border-t border-border pt-4">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Sub-categories
          </h4>
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
        </div>
      )}

      {/* Price range */}
      <div className="border-t border-border pt-4">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Price range
        </h4>
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
      </div>

      {/* Brands */}
      {brands.length > 0 && (
        <div className="border-t border-border pt-4">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Brands
          </h4>
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
        </div>
      )}

      {/* Rating */}
      <div className="border-t border-border pt-4">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Customer rating
        </h4>
        <div className="space-y-1">
          {[4, 3, 2, 1].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() =>
                setFilters({
                  ...filters,
                  minRating: filters.minRating === r ? 0 : r,
                })
              }
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                filters.minRating === r
                  ? "bg-kwik-orange-tint font-medium text-kwik-orange"
                  : "text-foreground hover:bg-muted",
              )}
            >
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
            </button>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div className="border-t border-border pt-4">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Availability
        </h4>
        <FilterCheckbox
          checked={filters.inStockOnly}
          onChange={(next) => setFilters({ ...filters, inStockOnly: next })}
          label="In stock only"
        />
      </div>
    </div>
  );
}

// ─── Main page component ────────────────────────────────────────────────────

export default function CategoryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const idParam = params?.id ?? "";

  // Category metadata (param is treated as a slug — CategoryCard links to
  // /categories/[slug], falling back to id when no slug exists).
  const categoryQuery = useCategoryBySlug(idParam);
  const rawCategoryData = categoryQuery.data;
  const category = useMemo(
    () => normalizeCategory(rawCategoryData),
    [rawCategoryData],
  );

  // Products — fetch a generous batch for the resolved category, then filter,
  // sort and paginate client-side for an instant, consistent UX.
  const productsQuery = useProducts({
    categoryId: category?.id,
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
  const [sortOpen, setSortOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [activeSubCategoryId, setActiveSubCategoryId] = useState<string | null>(
    null,
  );
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] =
    useState<MarketplaceProduct | null>(null);

  // Reset visible count when filters/search/sort change. Using the
  // "adjust state during render" pattern (instead of useEffect) avoids
  // cascading renders — see https://react.dev/reference/react/useState#storing-information-from-previous-renders
  const [resetKey, setResetKey] = useState("");
  const currentResetKey = `${sortBy}|${JSON.stringify(filters)}|${activeSubCategoryId}`;
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
  }, [allProducts, filters, sortBy, activeSubCategoryId]);

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

  const categoryStyle = category
    ? resolveCategoryStyle(category.name, category.slug, 0)
    : null;
  const CategoryIcon = categoryStyle?.Icon ?? DEFAULT_CATEGORY_STYLE.Icon;

  const productCount = allProducts.length;
  const filteredCount = filteredProducts.length;

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
      {/* ── Header ── */}
      <div className="border-b border-border bg-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 py-3 text-xs text-muted-foreground">
            <Link
              href="/"
              className="transition-colors hover:text-kwik-orange"
            >
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link
              href="/categories"
              className="transition-colors hover:text-kwik-orange"
            >
              Categories
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-foreground">{category.name}</span>
          </nav>

          {/* Category info */}
          <div className="flex items-center gap-4 pb-5">
            <div
              className={cn(
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-md",
                categoryStyle?.color,
              )}
            >
              <CategoryIcon className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">
                {category.name}
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {productCount > 0
                  ? `${productCount} product${productCount !== 1 ? "s" : ""} available`
                  : "Browse products in this category"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="sticky top-[var(--header-height)] z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 py-3">
            {/* Sort dropdown */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setSortOpen((v) => !v)}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                aria-expanded={sortOpen}
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
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-lg border border-border bg-background shadow-lg"
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
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

            {/* Mobile filter toggle */}
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted lg:hidden"
            >
              <Filter className="h-4 w-4 text-kwik-orange" />
              <span className="hidden xs:inline">Filters</span>
            </button>
          </div>
        </div>
      </div>

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
            {/* Results meta */}
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {productsQuery.isLoading ? (
                  "Loading products…"
                ) : (
                  <>
                    <span className="font-semibold text-foreground">
                      {filteredCount}
                    </span>{" "}
                    product{filteredCount !== 1 ? "s" : ""}
                  </>
                )}
              </p>
            </div>

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
                      Load more products
                      <span className="ml-2 text-muted-foreground">
                        ({filteredCount - visibleCount} remaining)
                      </span>
                    </button>
                  </div>
                )}

                {!hasMore && filteredCount > PAGE_SIZE && (
                  <p className="mt-8 text-center text-sm text-muted-foreground">
                    You&apos;ve seen all {filteredCount} products in{" "}
                    {category.name}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile filter drawer ── */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/50 lg:hidden"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 right-0 top-0 z-50 flex w-[85%] max-w-sm flex-col bg-background shadow-xl lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h2 className="text-base font-semibold text-foreground">
                  Filters
                </h2>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Close filters"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
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
              <div className="border-t border-border p-4">
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="inline-flex h-11 w-full items-center justify-center rounded-md bg-kwik-orange px-5 text-sm font-semibold text-white transition-colors hover:bg-kwik-orange-hover"
                >
                  Show {filteredCount} result{filteredCount !== 1 ? "s" : ""}
                </button>
              </div>
            </motion.div>
          </>
        )}
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
