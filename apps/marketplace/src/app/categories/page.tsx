"use client";

import React, { Suspense, useCallback, useEffect, useState, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ChevronRight,
  ShoppingBag,
  Loader2,
  SlidersHorizontal,
  Search,
  PackageOpen,
  Package,
  Smartphone,
  Laptop,
  Shirt,
  Sparkles,
  Home as HomeIcon,
  UtensilsCrossed,
  Car,
  Trophy,
  HeartPulse,
  BookOpen,
  Gamepad2,
  Baby,
  Gem,
  ShoppingCart,
  Dumbbell,
  Music,
  Camera,
  Headphones,
  Watch,
  Palette,
  Dog,
  Clapperboard,
  type LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { productsApi, marketplaceApi } from "@kwikseller/api-client";
import { cn } from "@kwikseller/ui";
import { EmptyState } from "@/components/ui/empty-state";
import { MarketplaceProductCard } from "@/components/landing/shared/marketplace-product-card";
import type { SearchableProduct } from "@/data/products";
import type { MarketplaceProduct } from "@/data/marketplace-home";
import dynamic from "next/dynamic";

const QuickViewModal = dynamic(
  () =>
    import("@/components/landing/quick-view-modal").then(
      (mod) => mod.QuickViewModal,
    ),
  { ssr: false },
);

/* ─── Category Color & Icon Mapping ────────────────────────── */

interface CategoryStyle {
  color: string;
  textColor: string;
  Icon: LucideIcon;
}

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  fashion: { color: "bg-pink-500", textColor: "text-pink-600", Icon: Shirt },
  electronics: { color: "bg-blue-500", textColor: "text-blue-600", Icon: Smartphone },
  phones: { color: "bg-cyan-500", textColor: "text-cyan-600", Icon: Smartphone },
  beauty: { color: "bg-rose-500", textColor: "text-rose-600", Icon: Sparkles },
  home: { color: "bg-amber-500", textColor: "text-amber-600", Icon: HomeIcon },
  food: { color: "bg-orange-500", textColor: "text-orange-600", Icon: UtensilsCrossed },
  automobile: { color: "bg-red-500", textColor: "text-red-600", Icon: Car },
  sports: { color: "bg-green-500", textColor: "text-green-600", Icon: Trophy },
  health: { color: "bg-emerald-500", textColor: "text-emerald-600", Icon: HeartPulse },
  books: { color: "bg-indigo-500", textColor: "text-indigo-600", Icon: BookOpen },
  gaming: { color: "bg-violet-500", textColor: "text-violet-600", Icon: Gamepad2 },
  kids: { color: "bg-yellow-500", textColor: "text-yellow-600", Icon: Baby },
  jewelry: { color: "bg-fuchsia-500", textColor: "text-fuchsia-600", Icon: Gem },
  groceries: { color: "bg-lime-500", textColor: "text-lime-600", Icon: ShoppingCart },
  computers: { color: "bg-sky-500", textColor: "text-sky-600", Icon: Laptop },
  fitness: { color: "bg-teal-500", textColor: "text-teal-600", Icon: Dumbbell },
  music: { color: "bg-purple-500", textColor: "text-purple-600", Icon: Music },
  cameras: { color: "bg-slate-500", textColor: "text-slate-600", Icon: Camera },
  accessories: { color: "bg-stone-500", textColor: "text-stone-600", Icon: Watch },
  art: { color: "bg-pink-600", textColor: "text-pink-700", Icon: Palette },
  pets: { color: "bg-orange-600", textColor: "text-orange-700", Icon: Dog },
  movies: { color: "bg-red-600", textColor: "text-red-700", Icon: Clapperboard },
  audio: { color: "bg-violet-600", textColor: "text-violet-700", Icon: Headphones },
};

const DEFAULT_STYLE: CategoryStyle = {
  color: "bg-gray-500",
  textColor: "text-gray-600",
  Icon: Package,
};

/* Stagger children colors for unstyled categories */
const CARD_ACCENT_COLORS = [
  "bg-kwik-orange",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-pink-500",
  "bg-amber-500",
  "bg-cyan-500",
  "bg-rose-500",
  "bg-indigo-500",
  "bg-teal-500",
];

const CARD_TEXT_COLORS = [
  "text-kwik-orange",
  "text-blue-600",
  "text-emerald-600",
  "text-violet-600",
  "text-pink-600",
  "text-amber-600",
  "text-cyan-600",
  "text-rose-600",
  "text-indigo-600",
  "text-teal-600",
];

function getCategoryStyle(name: string, slug: string, index: number): CategoryStyle {
  const key = (slug || "").toLowerCase();
  if (CATEGORY_STYLES[key]) return CATEGORY_STYLES[key];
  for (const [k, v] of Object.entries(CATEGORY_STYLES)) {
    if (name.toLowerCase().includes(k) || key.includes(k)) return v;
  }
  const colorIdx = index % CARD_ACCENT_COLORS.length;
  return {
    color: CARD_ACCENT_COLORS[colorIdx],
    textColor: CARD_TEXT_COLORS[colorIdx],
    Icon: DEFAULT_STYLE.Icon,
  };
}

/* ─── Stagger Animation ────────────────────────────────────── */

const staggerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const staggerChildVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

function StaggerWrap({ children }: { children: React.ReactNode }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-30px" });
  return (
    <motion.div ref={ref} initial="hidden" animate={inView ? "visible" : "hidden"} variants={staggerVariants}>
      {children}
    </motion.div>
  );
}
function StaggerChild({ children, index, className = "" }: { children: React.ReactNode; index: number; className?: string }) {
  return (
    <motion.div
      variants={staggerChildVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Sort Options ─────────────────────────────────────────── */

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
  { value: "newest", label: "Newest" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

const withTimeout = async <T,>(promise: Promise<T>, ms = 8000): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Request timed out")), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

/* ─── Convert for QuickViewModal ──────────────────────────── */

function toMarketplaceProduct(p: SearchableProduct): MarketplaceProduct {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price,
    comparePrice: p.comparePrice,
    image: p.image,
    rating: p.rating,
    reviewCount: p.reviewCount,
    store: p.store,
    storeId: p.storeId,
    storeSlug: p.storeSlug,
    category: p.categorySlug,
    isNew: p.isNew,
    tag: p.category,
    description: p.description,
    images: [p.image],
    features: p.tags.slice(0, 4),
    specifications: [],
    reviews: [],
  };
}

/* ─── Category Detail View ────────────────────────────────── */

function CategoryDetailView({ slug }: { slug: string }) {
  const router = useRouter();
  const [categoryInfo, setCategoryInfo] = useState<{ name: string; description: string; itemCount: string } | null>(null);

  const [products, setProducts] = useState<SearchableProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortValue>("relevance");
  const [showFilters, setShowFilters] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<MarketplaceProduct | null>(null);

  // Fetch category info and products from API
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        // Fetch category info
        const catRes = await withTimeout(marketplaceApi.getCategories());
        if (catRes.success && catRes.data) {
          const data = catRes.data as any;
          const cats = Array.isArray(data) ? data : data.categories || [];
          const found = cats.find((c: any) => c.id === slug || c.slug === slug);
          if (found) {
            setCategoryInfo({
              name: found.name,
              description: found.description || "",
              itemCount: found.productCount ? `${found.productCount}+ items` : "",
            });
          }
        }

        // Fetch products
        const response = await withTimeout(productsApi.getCategoryBySlug(slug, { limit: 50 }));
        if (response.success && response.data) {
          const respData = response.data as any;
          if (Array.isArray(respData)) {
            setProducts(respData as unknown as SearchableProduct[]);
          } else if (respData.products && Array.isArray(respData.products)) {
            setProducts(respData.products as unknown as SearchableProduct[]);
          } else {
            setProducts([]);
          }
        }
      } catch {
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [slug]);

  // Sort products
  const sortedProducts = React.useMemo(() => {
    let sorted = [...products];
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
        sorted.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      default:
        break;
    }
    return sorted;
  }, [products, sortBy]);

  const handleQuickView = useCallback((p: SearchableProduct) => {
    setQuickViewProduct(toMarketplaceProduct(p));
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-[#07111f]">
      {/* Category Header */}
      <div className="border-b border-kwik-border bg-white dark:border-white/10 dark:bg-[#07111f]">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 py-3 text-xs text-kwik-gray-light">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="hover:text-kwik-orange transition-colors"
            >
              Home
            </button>
            <ChevronRight className="h-3 w-3" />
            <button
              type="button"
              onClick={() => router.push("/categories")}
              className="hover:text-kwik-orange transition-colors"
            >
              Categories
            </button>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-kwik-dark dark:text-white">
              {categoryInfo?.name || slug}
            </span>
          </div>

          {/* Category info row */}
          <div className="flex items-center gap-4 pb-4">
            <div>
              <h1 className="text-xl font-bold text-kwik-dark dark:text-white">
                {categoryInfo?.name || slug}
              </h1>
              <p className="text-sm text-kwik-gray-light dark:text-white/60">
                {categoryInfo?.description || `Browse ${slug} products`}
                {categoryInfo?.itemCount && (
                  <span className="ml-2 text-kwik-orange font-medium">
                    {categoryInfo.itemCount}
                  </span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`ml-auto flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-medium transition-colors ${
                showFilters
                  ? "bg-kwik-orange-tint text-kwik-orange"
                  : "bg-white text-kwik-gray-light ring-1 ring-kwik-border hover:bg-neutral-50 dark:bg-white/5 dark:text-white/65 dark:ring-white/10 dark:hover:bg-white/10"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Sort
            </button>
          </div>
        </div>

        {/* Sort filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-kwik-border dark:border-white/10"
            >
              <div className="container mx-auto px-4 py-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-semibold text-kwik-gray-light uppercase tracking-wider">
                    Sort by:
                  </span>
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSortBy(opt.value)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        sortBy === opt.value
                          ? "bg-kwik-dark text-white"
                          : "bg-white text-kwik-gray-light ring-1 ring-kwik-border hover:bg-neutral-50 dark:bg-white/5 dark:text-white/65 dark:ring-white/10 dark:hover:bg-white/10"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Products area */}
      <div className="container mx-auto px-4 py-4">
        {/* Results count */}
        <div className="mb-4">
          <p className="text-sm text-kwik-gray-light">
            {isLoading ? (
              "Loading..."
            ) : (
              <>
                <span className="font-semibold text-kwik-dark dark:text-white">{sortedProducts.length}</span>{" "}
                product{sortedProducts.length !== 1 ? "s" : ""} in{" "}
                <span className="font-semibold text-kwik-orange">
                  {categoryInfo?.name || slug}
                </span>
              </>
            )}
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-kwik-orange" />
            <p className="mt-3 text-sm text-kwik-gray-light">Loading products...</p>
          </div>
        )}

        {/* Empty */}
        {!isLoading && sortedProducts.length === 0 && (
          <EmptyState
            icon={<ShoppingBag className="h-10 w-10" />}
            title="No products found"
            description="No products available in this category yet. Check back later or browse other categories."
            action={
              <button
                type="button"
                onClick={() => router.push("/categories")}
                className="mt-4 rounded-xl bg-kwik-orange px-6 py-2.5 text-sm font-semibold text-white hover:bg-kwik-orange-hover transition-colors"
              >
                Browse Categories
              </button>
            }
          />
        )}

        {/* Product grid */}
        {!isLoading && sortedProducts.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {sortedProducts.map((product, index) => (
              <MarketplaceProductCard
                key={`${product.id}-${index}`}
                product={toMarketplaceProduct(product)}
                onQuickView={() => handleQuickView(product)}
              />
            ))}
          </div>
        )}
      </div>

      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}

/* ─── Category Sort Options ───────────────────────────────── */

const CATEGORY_SORT_OPTIONS = [
  { value: "az", label: "A-Z" },
  { value: "za", label: "Z-A" },
  { value: "popular", label: "Most Popular" },
] as const;

type CategorySortValue = (typeof CATEGORY_SORT_OPTIONS)[number]["value"];

/* ─── All Categories View ─────────────────────────────────── */

function AllCategoriesView() {
  const router = useRouter();
  const [categories, setCategories] = useState<Array<{ id: string; name: string; description: string; image: string | null; itemCount: string; productCount?: number; slug?: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<CategorySortValue>("popular");
  const [isSortOpen, setIsSortOpen] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await withTimeout(marketplaceApi.getCategories());
        if (response.success && response.data) {
          const data = response.data as any;
          const list = Array.isArray(data) ? data : data.categories || [];
          setCategories(
            list.map((c: any) => ({
              id: c.id,
              name: c.name,
              description: c.description || "",
              image: c.image || c.imageUrl || null,
              itemCount: c.productCount ? `${c.productCount}+ items` : "",
              productCount: c.productCount || 0,
              slug: c.slug || c.id,
            })),
          );
        }
      } catch {
        // Empty state
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  // Filter and sort categories
  const filteredCategories = useMemo(() => {
    let result = [...categories];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case "az":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "za":
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "popular":
        result.sort((a, b) => (b.productCount || 0) - (a.productCount || 0));
        break;
    }

    return result;
  }, [categories, searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#07111f]">
      {/* Header */}
      <div className="border-b border-kwik-border bg-white dark:border-white/10 dark:bg-[#07111f]">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 py-3 text-xs text-kwik-gray-light">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="hover:text-kwik-orange transition-colors"
            >
              Home
            </button>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-kwik-dark dark:text-white">Categories</span>
          </div>

          <div className="flex items-end justify-between gap-3 pb-4">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-kwik-dark dark:text-white sm:text-2xl">All Categories</h1>
            <p className="mt-1 text-sm text-kwik-gray-light dark:text-white/60">
              Browse products by category
            </p>
            </div>
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsSortOpen((value) => !value)}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-kwik-border bg-white px-3 text-xs font-semibold text-kwik-dark transition hover:border-kwik-orange dark:border-white/10 dark:bg-white/5 dark:text-white"
                aria-expanded={isSortOpen}
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-kwik-orange" />
                Sort
              </button>
              {isSortOpen && (
                <div className="absolute right-0 top-11 z-20 w-40 overflow-hidden rounded-md border border-kwik-border bg-white shadow-xl dark:border-white/10 dark:bg-[#07111f]">
                  {CATEGORY_SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setSortBy(opt.value);
                    setIsSortOpen(false);
                  }}
                  className={`block w-full px-3 py-2 text-left text-xs font-medium transition ${
                    sortBy === opt.value
                      ? "bg-kwik-orange text-white"
                      : "text-kwik-gray-light hover:bg-neutral-50 hover:text-kwik-dark dark:text-white/65 dark:hover:bg-white/10 dark:hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {false && (
      <>
      {/* Search & Sort Bar */}
      <div className="hidden border-b border-kwik-border bg-white dark:border-white/10 dark:bg-[#07111f]">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-kwik-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search categories..."
                className="h-10 w-full rounded-md border border-kwik-border bg-white pl-9 pr-9 text-sm text-kwik-dark outline-none transition-colors placeholder:text-kwik-muted focus:border-kwik-orange focus:ring-1 focus:ring-kwik-orange/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-kwik-muted hover:text-kwik-dark-medium transition-colors"
                >
                  <span className="text-xs font-medium">✕</span>
                </button>
              )}
            </div>

            {/* Sort options */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-kwik-gray-light uppercase tracking-wider whitespace-nowrap hidden sm:inline">
                Sort:
              </span>
              <div className="flex items-center gap-1 rounded-md border border-kwik-border bg-white p-1 dark:border-white/10 dark:bg-white/5">
                {CATEGORY_SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSortBy(opt.value)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                      sortBy === opt.value
                        ? "bg-kwik-orange text-white shadow-sm"
                        : "text-kwik-gray-light hover:bg-neutral-50 hover:text-kwik-dark dark:text-white/65 dark:hover:bg-white/10 dark:hover:text-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      </>
      )}

      {/* Category grid */}
      <div className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-kwik-orange" />
          </div>
        ) : filteredCategories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="h-28 w-28 rounded-3xl bg-gradient-to-br from-kwik-orange/10 to-kwik-orange/5 flex items-center justify-center mb-5">
              <PackageOpen className="h-12 w-12 text-kwik-orange/60" />
            </div>
            <h3 className="text-lg font-semibold text-kwik-dark mb-2">
              {searchQuery ? "No matching categories" : "No categories yet"}
            </h3>
            <p className="text-sm text-kwik-gray-light text-center max-w-[320px] mb-4">
              {searchQuery
                ? `No categories match "${searchQuery}". Try a different search term.`
                : "Categories will appear here once sellers start listing products."}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="rounded-xl px-5 py-2.5 text-sm font-medium text-kwik-orange border border-kwik-orange hover:bg-kwik-orange-tint transition-colors"
              >
                Clear search
              </button>
            )}
          </motion.div>
        ) : (
          <>
            {/* Results info */}
            {searchQuery && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-kwik-gray-light mb-4"
              >
                <span className="font-semibold text-kwik-dark">{filteredCategories.length}</span>{" "}
                {filteredCategories.length === 1 ? "category" : "categories"} found
                for "<span className="text-kwik-orange">{searchQuery}</span>"
              </motion.p>
            )}

            <StaggerWrap>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {filteredCategories.map((category, index) => {
                  const style = getCategoryStyle(
                    category.name,
                    category.slug || category.id,
                    index,
                  );
                  const { Icon } = style;

                  return (
                    <StaggerChild key={`${category.id}-${index}`} index={index} className="w-full">
                      <motion.button
                        type="button"
                        onClick={() => router.push(`/categories?name=${category.slug || category.id}`)}
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        className="group h-full w-full cursor-pointer border border-neutral-200 bg-white p-4 text-left transition-all duration-300 hover:border-kwik-dark dark:border-white/10 dark:bg-white/5 dark:hover:border-white/50"
                      >
                        <div className="flex items-center gap-4">
                          {/* Colored icon box */}
                          <div
                            className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white shadow-md group-hover:scale-110 transition-transform",
                              style.color,
                            )}
                          >
                            <Icon className="w-6 h-6" />
                          </div>

                          {/* Category info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base text-kwik-dark dark:text-white">
                              {category.name}
                            </h3>
                          </div>

                          {/* Chevron */}
                          <ChevronRight className="w-4 h-4 text-kwik-muted group-hover:text-kwik-orange group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                        </div>
                      </motion.button>
                    </StaggerChild>
                  );
                })}
              </div>
            </StaggerWrap>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Main Page Component ─────────────────────────────────── */

function CategoriesPageContent() {
  const searchParams = useSearchParams();
  // URL format: /categories?name=electronics
  const slug = searchParams.get('name') || '';

  if (slug) {
    return <CategoryDetailView slug={slug} />;
  }

  return <AllCategoriesView />;
}

/* ─── Default export with Suspense ────────────────────────── */

export default function CategoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-kwik-bg-page">
          <Loader2 className="h-8 w-8 animate-spin text-kwik-orange" />
        </div>
      }
    >
      <CategoriesPageContent />
    </Suspense>
  );
}
