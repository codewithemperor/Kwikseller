"use client";

import React, { Suspense, useCallback, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ChevronRight,
  ShoppingBag,
  SlidersHorizontal,
  PackageOpen,
} from "lucide-react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { cn } from "@kwikseller/ui";
import {
  CATEGORY_CARD_ACCENT_COLORS as CARD_ACCENT_COLORS,
  CATEGORY_CARD_TEXT_COLORS as CARD_TEXT_COLORS,
  CATEGORY_STYLES,
  DEFAULT_CATEGORY_STYLE as DEFAULT_STYLE,
  SORT_OPTIONS,
  type CategoryStyle,
  type SortValue,
} from "@/constants/marketplace";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductGridSkeleton } from "@/components/ui/loading-state";
import { MarketplaceProductCard } from "@/components/landing/shared/marketplace-product-card";
import {
  useCategories,
  useProducts,
  toMarketplaceProduct,
  type Category,
} from "@/lib/api-hooks";
import type { MarketplaceProduct } from "@/data/marketplace-home";
import dynamic from "next/dynamic";

const QuickViewModal = dynamic(
  () =>
    import("@/components/landing/quick-view-modal").then(
      (mod) => mod.QuickViewModal,
    ),
  { ssr: false },
);

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
function StaggerChild({ children }: { children: React.ReactNode }) {
  return <motion.div variants={staggerChildVariants}>{children}</motion.div>;
}

/* ─── Category Detail View ────────────────────────────────── */

function CategoryDetailView({ slug }: { slug: string }) {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<SortValue>("relevance");
  const [showFilters, setShowFilters] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<MarketplaceProduct | null>(null);

  // Fetch the category info (and its products) via the shared hook.
  const categoryInfoQuery = useCategories();
  const productsQuery = useProducts({ categoryId: slug, limit: 50 });

  const category = useMemo(
    () =>
      (categoryInfoQuery.data ?? []).find(
        (c: Category) => c.slug === slug || c.id === slug,
      ),
    [categoryInfoQuery.data, slug],
  );

  const products: MarketplaceProduct[] = useMemo(
    () => productsQuery.data?.products ?? [],
    [productsQuery.data],
  );

  const sortedProducts = useMemo(() => {
    const sorted = [...products];
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
  }, [products, sortBy]);

  const handleQuickView = useCallback((p: MarketplaceProduct) => {
    setQuickViewProduct(p);
  }, []);

  const isLoading = productsQuery.isLoading;
  const categoryName = category?.name ?? slug;

  return (
    <div className="min-h-screen bg-background">
      {/* Category Header */}
      <div className="border-b border-border bg-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
              {categoryName}
            </span>
          </div>

          {/* Category info row */}
          <div className="flex items-center gap-4 pb-4">
            <div>
              <h1 className="text-xl font-bold text-kwik-dark dark:text-white">
                {categoryName}
              </h1>
              <p className="text-sm text-kwik-gray-light dark:text-white/60">
                {category?.description || `Browse ${categoryName} products`}
                {category?._count?.products ? (
                  <span className="ml-2 text-kwik-orange font-medium">
                    {category._count.products}+ items
                  </span>
                ) : null}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "ml-auto flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-medium transition-colors",
                showFilters
                  ? "bg-kwik-orange-tint text-kwik-orange"
                  : "bg-white text-kwik-gray-light ring-1 ring-kwik-border hover:bg-neutral-50 dark:bg-white/5 dark:text-white/65 dark:ring-white/10 dark:hover:bg-white/10",
              )}
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
              <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-semibold text-kwik-gray-light uppercase tracking-wider">
                    Sort by:
                  </span>
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSortBy(opt.value)}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                        sortBy === opt.value
                          ? "bg-kwik-dark text-white"
                          : "bg-white text-kwik-gray-light ring-1 ring-kwik-border hover:bg-neutral-50 dark:bg-white/5 dark:text-white/65 dark:ring-white/10 dark:hover:bg-white/10",
                      )}
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
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Results count */}
        <div className="mb-4">
          <p className="text-sm text-kwik-gray-light">
            {isLoading ? (
              "Loading products..."
            ) : (
              <>
                <span className="font-semibold text-kwik-dark dark:text-white">{sortedProducts.length}</span>{" "}
                product{sortedProducts.length !== 1 ? "s" : ""} in{" "}
                <span className="font-semibold text-kwik-orange">{categoryName}</span>
              </>
            )}
          </p>
        </div>

        {/* Loading */}
        {isLoading && <ProductGridSkeleton count={10} columns={5} />}

        {/* Empty */}
        {!isLoading && sortedProducts.length === 0 ? (
          <EmptyState
            variant="search"
            icon={<ShoppingBag className="h-10 w-10" />}
            title="No products found"
            description={`No products available in ${categoryName} yet. Check back later or browse other categories.`}
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
        ) : null}

        {/* Product grid */}
        {!isLoading && sortedProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {sortedProducts.map((product, index) => (
              <MarketplaceProductCard
                key={`${product.id}-${index}`}
                product={product}
                onQuickView={() => handleQuickView(product)}
              />
            ))}
          </div>
        ) : null}
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
  const categoriesQuery = useCategories();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<CategorySortValue>("popular");
  const [isSortOpen, setIsSortOpen] = useState(false);

  const categories = useMemo(
    () =>
      (categoriesQuery.data ?? []).map((c: Category) => ({
        id: c.id,
        name: c.name,
        description: "",
        image: c.imageUrl ?? null,
        itemCount: c._count?.products ? `${c._count.products}+ items` : "",
        productCount: c._count?.products ?? 0,
        slug: c.slug || c.id,
      })),
    [categoriesQuery.data],
  );

  // Filter and sort categories
  const filteredCategories = useMemo(() => {
    let result = [...categories];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query),
      );
    }

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

  const isLoading = categoriesQuery.isLoading;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
                <div className="absolute right-0 top-11 z-20 w-40 overflow-hidden rounded-md border border-kwik-border bg-background shadow-xl">
                  {CATEGORY_SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSortBy(opt.value);
                        setIsSortOpen(false);
                      }}
                      className={cn(
                        "block w-full px-3 py-2 text-left text-xs font-medium transition",
                        sortBy === opt.value
                          ? "bg-kwik-orange text-white"
                          : "text-kwik-gray-light hover:bg-neutral-50 hover:text-kwik-dark dark:text-white/65 dark:hover:bg-white/10 dark:hover:text-white",
                      )}
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

      {/* Category grid */}
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse border border-kwik-border bg-muted/40 dark:border-white/10 dark:bg-white/5"
              />
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <EmptyState
            variant="search"
            icon={<PackageOpen className="h-10 w-10" />}
            title={searchQuery ? "No matching categories" : "No categories yet"}
            description={
              searchQuery
                ? `No categories match "${searchQuery}". Try a different search term.`
                : "Categories will appear here once sellers start listing products."
            }
            action={
              searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="rounded-xl px-5 py-2.5 text-sm font-medium text-kwik-orange border border-kwik-orange hover:bg-kwik-orange-tint transition-colors"
                >
                  Clear search
                </button>
              ) : undefined
            }
          />
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
                for &ldquo;<span className="text-kwik-orange">{searchQuery}</span>&rdquo;
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
                    <StaggerChild key={`${category.id}-${index}`}>
                      <motion.button
                        type="button"
                        onClick={() => router.push(`/categories?name=${category.slug || category.id}`)}
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        className="group h-full w-full cursor-pointer border border-kwik-border bg-white p-4 text-left transition-all duration-300 hover:border-kwik-dark dark:border-white/10 dark:bg-white/5 dark:hover:border-white/50"
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
                            {category.itemCount ? (
                              <p className="text-xs text-kwik-gray-light mt-0.5">
                                {category.itemCount}
                              </p>
                            ) : null}
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
  const slug = searchParams.get("name") || "";

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
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <ProductGridSkeleton count={8} columns={4} />
        </div>
      }
    >
      <CategoriesPageContent />
    </Suspense>
  );
}

// Re-export the shared mapper for any consumer that imported it from this
// module historically — keeps the public API stable.
export { toMarketplaceProduct };
