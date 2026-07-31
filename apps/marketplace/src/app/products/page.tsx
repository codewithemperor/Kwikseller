"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, X, LayoutGrid, List, PackageOpen, Star } from "lucide-react";
import {
  browseProducts,
  browseCategories,
  browseStores,
  sortOptions,
  type SortOption,
} from "@/data/browse-products";
import { GenericProductCard as ProductCard } from "@kwikseller/ui";
import { useWishlistStore } from "@/stores";
import { useCartStore } from "@/stores";
import { kwikToast } from "@kwikseller/utils";
import { cn } from "@/lib/utils";

function formatNGN(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}

function ProductsBrowseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("q") ?? "";
  const initialCategory = searchParams.get("category") ?? "all";
  const initialVendor = searchParams.get("vendor") ?? "all";

  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<string>(initialCategory);
  const [vendor, setVendor] = useState<string>(initialVendor);
  const [sort, setSort] = useState<SortOption>("popular");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [priceMax, setPriceMax] = useState<number>(50000);
  const [onlyDiscounted, setOnlyDiscounted] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);

  // Sync query to URL (shallow) so the page is shareable/bookmarkable.
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (category !== "all") params.set("category", category);
    if (vendor !== "all") params.set("vendor", vendor);
    const qs = params.toString();
    router.replace(qs ? `/products?${qs}` : "/products", { scroll: false });
  }, [query, category, vendor, router]);

  const wishlistItems = useWishlistStore((s) => s.items);
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);
  const addToCart = useCartStore((s) => s.addItem);

  const filtered = useMemo(() => {
    let list = browseProducts.slice();

    // Text search (name, store, category).
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.store.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q),
      );
    }

    // Category filter.
    if (category !== "all") {
      list = list.filter(
        (p) => p.category.toLowerCase().replace(/[^a-z0-9]+/g, "-") === category,
      );
    }

    // Vendor filter.
    if (vendor !== "all") {
      list = list.filter((p) => (p.storeSlug ?? p.store) === vendor);
    }

    // Price ceiling.
    list = list.filter((p) => p.price <= priceMax);

    // Discounted only.
    if (onlyDiscounted) {
      list = list.filter((p) => p.comparePrice && p.comparePrice > p.price);
    }

    // In-stock only.
    if (onlyInStock) {
      list = list.filter((p) => p.stock > 0);
    }

    // Sort.
    switch (sort) {
      case "newest":
        list.sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
        break;
      case "price-asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        list.sort((a, b) => b.rating - a.rating);
        break;
      case "popular":
      default:
        list.sort((a, b) => b.salesCount - a.salesCount);
        break;
    }

    return list;
  }, [query, category, vendor, sort, priceMax, onlyDiscounted, onlyInStock]);

  const activeFilterCount =
    (category !== "all" ? 1 : 0) +
    (vendor !== "all" ? 1 : 0) +
    (onlyDiscounted ? 1 : 0) +
    (onlyInStock ? 1 : 0) +
    (priceMax < 50000 ? 1 : 0);

  function clearFilters() {
    setCategory("all");
    setVendor("all");
    setPriceMax(50000);
    setOnlyDiscounted(false);
    setOnlyInStock(false);
  }

  function handleAddToCart(product: (typeof browseProducts)[number]) {
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      comparePrice: product.comparePrice,
      image: product.image,
      store: product.store,
      storeSlug: product.storeSlug,
      storeName: product.store,
      productType: product.productType,
      productSource: product.productSource,
      requiresShipping: product.requiresShipping,
    });
    kwikToast.success("Added to cart", `${product.name} is in your cart.`);
  }

  function handleWishlist(product: (typeof browseProducts)[number]) {
    toggleWishlist({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      store: product.store,
      storeSlug: product.storeSlug,
    });
  }

  return (
    <div className="bg-background min-h-screen">
      {/* ── Page header ── */}
      <section className="kwik-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_55%)]" />
        <div className="container mx-auto max-w-7xl px-4 py-10 md:py-14 relative">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">
              Browse the marketplace
            </p>
            <h1 className="mt-2 font-heading text-3xl font-bold text-white md:text-4xl">
              All Products
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85 md:text-base">
              Discover thousands of products from verified vendors across Africa.
              Every purchase is protected by KwisCrow escrow.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Search + sort bar ── */}
      <section className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="container mx-auto max-w-7xl px-4 py-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products, vendors, categories..."
                aria-label="Search products"
                className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-9 text-sm text-foreground placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortOption)}
                  aria-label="Sort products"
                  className="h-11 appearance-none rounded-xl border border-border bg-surface pl-9 pr-8 text-sm font-medium text-foreground focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>

              {/* Filter toggle (mobile) */}
              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                className="relative inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-medium text-foreground hover:bg-gray-100 md:hidden"
                aria-label="Toggle filters"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary-500 px-1 text-[10px] font-bold text-white">
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
                      ? "bg-primary-500 text-white"
                      : "text-gray-500 hover:text-foreground",
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
                      ? "bg-primary-500 text-white"
                      : "text-gray-500 hover:text-foreground",
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
          <aside className="hidden w-64 shrink-0 md:block">
            <FilterPanel
              category={category}
              setCategory={setCategory}
              vendor={vendor}
              setVendor={setVendor}
              priceMax={priceMax}
              setPriceMax={setPriceMax}
              onlyDiscounted={onlyDiscounted}
              setOnlyDiscounted={setOnlyDiscounted}
              onlyInStock={onlyInStock}
              setOnlyInStock={setOnlyInStock}
              activeFilterCount={activeFilterCount}
              onClear={clearFilters}
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
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-foreground"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <FilterPanel
                    category={category}
                    setCategory={setCategory}
                    vendor={vendor}
                    setVendor={setVendor}
                    priceMax={priceMax}
                    setPriceMax={setPriceMax}
                    onlyDiscounted={onlyDiscounted}
                    setOnlyDiscounted={setOnlyDiscounted}
                    onlyInStock={onlyInStock}
                    setOnlyInStock={setOnlyInStock}
                    activeFilterCount={activeFilterCount}
                    onClear={clearFilters}
                  />
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Results */}
          <div className="min-w-0 flex-1">
            {/* Result count + active chips */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-gray-500">
                Showing{" "}
                <span className="font-semibold text-foreground">
                  {filtered.length}
                </span>{" "}
                of {browseProducts.length} products
              </p>
              {activeFilterCount > 0 ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
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
                    label={browseCategories.find((c) => c.value === category)?.label ?? category}
                    onRemove={() => setCategory("all")}
                  />
                ) : null}
                {vendor !== "all" ? (
                  <FilterChip
                    label={browseStores.find((v) => v.value === vendor)?.label ?? vendor}
                    onRemove={() => setVendor("all")}
                  />
                ) : null}
                {onlyDiscounted ? (
                  <FilterChip label="On sale" onRemove={() => setOnlyDiscounted(false)} />
                ) : null}
                {onlyInStock ? (
                  <FilterChip label="In stock" onRemove={() => setOnlyInStock(false)} />
                ) : null}
                {priceMax < 50000 ? (
                  <FilterChip label={`Under ${formatNGN(priceMax)}`} onRemove={() => setPriceMax(50000)} />
                ) : null}
              </div>
            ) : null}

            {/* Product grid */}
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface py-20 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <PackageOpen className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="mt-4 font-heading text-lg font-semibold text-foreground">
                  No products found
                </h3>
                <p className="mt-1 max-w-sm text-sm text-gray-500">
                  Try adjusting your search or filters to find what you&rsquo;re looking for.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    clearFilters();
                  }}
                  className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-secondary-500 px-5 text-sm font-semibold text-white hover:bg-secondary-600"
                >
                  Reset all
                </button>
              </div>
            ) : view === "grid" ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((product, idx) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(idx * 0.03, 0.3) }}
                  >
                    <ProductCard
                      image={product.image}
                      imageAlt={product.name}
                      name={product.name}
                      price={product.price}
                      comparePrice={product.comparePrice}
                      rating={product.rating}
                      reviewCount={product.reviewCount}
                      storeName={product.store}
                      category={product.category}
                      tag={product.tag}
                      isNew={product.isNew}
                      href={`/products/${product.id}`}
                      onAddToCart={() => handleAddToCart(product)}
                      onWishlist={() => handleWishlist(product)}
                      isWishlisted={wishlistItems.some((w) => w.productId === product.id)}
                      variant="default"
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filtered.map((product, idx) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(idx * 0.02, 0.2) }}
                  >
                    <ProductCard
                      image={product.image}
                      imageAlt={product.name}
                      name={product.name}
                      price={product.price}
                      comparePrice={product.comparePrice}
                      rating={product.rating}
                      reviewCount={product.reviewCount}
                      storeName={product.store}
                      category={product.category}
                      tag={product.tag}
                      isNew={product.isNew}
                      href={`/products/${product.id}`}
                      onAddToCart={() => handleAddToCart(product)}
                      onWishlist={() => handleWishlist(product)}
                      isWishlisted={wishlistItems.some((w) => w.productId === product.id)}
                      variant="horizontal"
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
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
            className="text-xs font-medium text-primary-600 hover:text-primary-700"
          >
            Clear ({props.activeFilterCount})
          </button>
        ) : null}
      </div>

      {/* Category */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Category
        </h3>
        <div className="space-y-1">
          {browseCategories.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => props.setCategory(c.value)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition",
                props.category === c.value
                  ? "bg-primary-50 font-medium text-primary-700"
                  : "text-foreground hover:bg-gray-100",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Vendor */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Vendor
        </h3>
        <div className="space-y-1">
          {browseStores.map((v) => (
            <button
              key={v.value}
              type="button"
              onClick={() => props.setVendor(v.value)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition",
                props.vendor === v.value
                  ? "bg-primary-50 font-medium text-primary-700"
                  : "text-foreground hover:bg-gray-100",
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Max Price
        </h3>
        <input
          type="range"
          min={2000}
          max={50000}
          step={1000}
          value={props.priceMax}
          onChange={(e) => props.setPriceMax(Number(e.target.value))}
          className="w-full accent-secondary-500"
          aria-label="Maximum price"
        />
        <div className="mt-1 flex justify-between text-xs text-gray-500">
          <span>{formatNGN(2000)}</span>
          <span className="font-semibold text-foreground">{formatNGN(props.priceMax)}</span>
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-2">
        <label className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 hover:bg-gray-100">
          <span className="text-sm text-foreground">On sale only</span>
          <input
            type="checkbox"
            checked={props.onlyDiscounted}
            onChange={(e) => props.setOnlyDiscounted(e.target.checked)}
            className="h-4 w-4 accent-secondary-500"
          />
        </label>
        <label className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 hover:bg-gray-100">
          <span className="text-sm text-foreground">In stock only</span>
          <input
            type="checkbox"
            checked={props.onlyInStock}
            onChange={(e) => props.setOnlyInStock(e.target.checked)}
            className="h-4 w-4 accent-secondary-500"
          />
        </label>
      </div>
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 py-1 pl-3 pr-2 text-xs font-medium text-primary-700">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="rounded-full p-0.5 hover:bg-primary-100"
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
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        </div>
      }
    >
      <ProductsBrowseContent />
    </Suspense>
  );
}
