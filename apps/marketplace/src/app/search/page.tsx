"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Search,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { productsApi } from "@kwikseller/api-client";
import { useMarketplaceShell } from "@/components/layout/marketplace-shell-context";
import { MarketplaceProductCard } from "@/components/landing/shared/marketplace-product-card";
import { toSearchableProduct, type SearchableProduct } from "@/data/products";
import type { MarketplaceProduct } from "@/data/marketplace-home";
import { getSimilarSuggestions } from "@/lib/search-similarity";

// Dynamic import for QuickViewModal to reduce initial bundle
const QuickViewModal = dynamic(
  () => import("@/components/landing/quick-view-modal").then((mod) => mod.QuickViewModal),
  { ssr: false },
);

/* ─── Helpers ──────────────────────────────────────────────── */

/* ─── Lightweight Product Card ─────────────────────────────── */

function SearchProductCard({
  product,
  onQuickView,
}: {
  product: SearchableProduct;
  onQuickView?: (p: SearchableProduct) => void;
}) {
  return (
    <MarketplaceProductCard product={toMarketplaceProduct(product)} onQuickView={() => onQuickView?.(product)} />
  );
}

/* ─── Category Filter ──────────────────────────────────────── */

const ALL_CATEGORIES = [
  { slug: "", name: "All" },
  { slug: "fashion", name: "Fashion" },
  { slug: "electronics", name: "Electronics" },
  { slug: "phones", name: "Phones" },
  { slug: "beauty", name: "Beauty" },
  { slug: "home", name: "Home & Garden" },
  { slug: "food", name: "Food & Drinks" },
  { slug: "automobile", name: "Automobile" },
];

const FALLBACK_SEARCH_PRODUCTS: SearchableProduct[] = [
  {
    id: "fallback-ankara-dress",
    name: "Ankara Maxi Dress",
    slug: "ankara-maxi-dress",
    price: 8500,
    comparePrice: 12000,
    image: "",
    rating: 4.6,
    reviewCount: 128,
    store: "Kwikseller Picks",
    category: "Fashion",
    categorySlug: "fashion",
    tags: ["fashion", "ankara", "dress"],
    description: "Popular fashion pick from the marketplace catalog.",
    inStock: true,
    isNew: false,
  },
  {
    id: "fallback-earbuds",
    name: "Wireless Bluetooth Earbuds",
    slug: "wireless-bluetooth-earbuds",
    price: 18000,
    comparePrice: 25000,
    image: "",
    rating: 4.5,
    reviewCount: 92,
    store: "Kwikseller Picks",
    category: "Electronics",
    categorySlug: "electronics",
    tags: ["electronics", "audio", "wireless"],
    description: "Similar electronics pick while live results are unavailable.",
    inStock: true,
    isNew: true,
  },
  {
    id: "fallback-phone",
    name: "Samsung Galaxy Phone",
    slug: "samsung-galaxy-phone",
    price: 650000,
    image: "",
    rating: 4.7,
    reviewCount: 76,
    store: "Kwikseller Picks",
    category: "Phones",
    categorySlug: "phones",
    tags: ["phone", "samsung", "mobile"],
    description: "Popular phone search fallback.",
    inStock: true,
    isNew: false,
  },
  {
    id: "fallback-beauty",
    name: "Brazilian Body Wave Hair",
    slug: "brazilian-body-wave-hair",
    price: 45000,
    image: "",
    rating: 4.4,
    reviewCount: 61,
    store: "Kwikseller Picks",
    category: "Beauty",
    categorySlug: "beauty",
    tags: ["beauty", "hair"],
    description: "Popular beauty pick from related searches.",
    inStock: true,
    isNew: false,
  },
];

/* ─── Sort Options ──────────────────────────────────────────── */

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
  { value: "newest", label: "Newest" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

/* ─── Convert for QuickViewModal ─────────────────────────────── */

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

/* ─── Search Page Component ────────────────────────────────── */

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const shell = useMarketplaceShell();
  const query = searchParams.get("q") || "";
  const categoryParam = searchParams.get("category") || "";
  const filtersParam = searchParams.get("filters") === "true";

  const [results, setResults] = useState<SearchableProduct[]>([]);
  const [showingFallback, setShowingFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState(categoryParam);
  const [sortBy, setSortBy] = useState<SortValue>("relevance");
  const [quickViewProduct, setQuickViewProduct] = useState<MarketplaceProduct | null>(null);

  // Read showFilters from layout shell context
  const showFilters = shell?.showFilters ?? filtersParam;

  // Fetch search results from API
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setShowingFallback(false);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const response = await productsApi.search({
          q: query,
          category: activeCategory || undefined,
          limit: 20,
        });

        if (response.success && response.data) {
          const data = response.data as any;
          let items: any[] = [];
          if (Array.isArray(data)) {
            items = data;
          } else if (data.products && Array.isArray(data.products)) {
            items = data.products;
          }
          // Properly convert API Product objects to SearchableProduct format
          const mapped = items.map(toSearchableProduct);
          setResults(mapped.length ? mapped : getSimilarSuggestions(query, FALLBACK_SEARCH_PRODUCTS, 12));
          setShowingFallback(mapped.length === 0);
        }
      } catch {
        setResults(getSimilarSuggestions(query, FALLBACK_SEARCH_PRODUCTS, 12));
        setShowingFallback(true);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchResults, 300);
    return () => clearTimeout(timer);
  }, [query, activeCategory]);

  // Sync category with URL param
  useEffect(() => {
    setActiveCategory(categoryParam);
  }, [categoryParam]);

  // Sort results
  const sortedResults = React.useMemo(() => {
    const sorted = [...results];

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
  }, [results, sortBy]);

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

  // Quick view handler
  const handleQuickView = useCallback((p: SearchableProduct) => {
    setQuickViewProduct(toMarketplaceProduct(p));
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-[#07111f]">
      {/* Category tabs - sticky below the header */}
      <div className="sticky top-[53px] z-20 border-b border-kwik-border bg-white dark:border-white/10 dark:bg-[#07111f] md:top-[64px]">
        <div className="container mx-auto px-4">
          <div className="flex gap-1.5 overflow-x-auto py-2.5 scrollbar-hide -mx-4 px-4">
            {ALL_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.slug;
              return (
                <motion.button
                  key={cat.slug || "all"}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCategoryChange(cat.slug)}
                  className={`flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-kwik-orange to-[#d97706] text-white shadow-md shadow-kwik-orange/20"
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
            <div className="container mx-auto px-4 py-3">
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
                            ? "bg-gradient-to-r from-kwik-orange to-[#d97706] text-white shadow-sm"
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
      <div className="container mx-auto px-4 py-4">
        {/* Results count with animated counter */}
        {query && (
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-kwik-gray-light">
              {isLoading ? (
                "Searching..."
              ) : (
                <>
                  <span className="font-semibold text-kwik-dark">{results.length}</span>{" "}
                  {showingFallback ? "similar pick" : "result"}{results.length !== 1 ? "s" : ""} for{" "}
                  <span className="font-semibold text-kwik-orange">&ldquo;{query}&rdquo;</span>
                </>
              )}
            </p>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col overflow-hidden border border-neutral-200 bg-white dark:border-white/10 dark:bg-white/5"
              >
                {/* Image skeleton with shimmer sweep */}
                <div className="relative aspect-square m-2 overflow-hidden rounded-[18px] bg-kwik-bg-light">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer-sweep_2s_ease-in-out_infinite]" />
                </div>
                {/* Text skeleton with shimmer sweep */}
                <div className="flex flex-col gap-2 px-3 pb-3 pt-2">
                  <div className="relative h-4 w-3/4 rounded-lg bg-kwik-bg-light overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer-sweep_2s_ease-in-out_infinite]" />
                  </div>
                  <div className="relative h-3 w-1/2 rounded-lg bg-kwik-bg-light overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer-sweep_2s_ease-in-out_infinite]" style={{ animationDelay: `${i * 100}ms` }} />
                  </div>
                  <div className="flex items-end justify-between pt-1">
                    <div className="flex flex-col gap-1">
                      <div className="relative h-2.5 w-12 rounded bg-kwik-bg-light overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer-sweep_2s_ease-in-out_infinite]" style={{ animationDelay: `${i * 150}ms` }} />
                      </div>
                      <div className="relative h-3 w-8 rounded bg-kwik-bg-light overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer-sweep_2s_ease-in-out_infinite]" style={{ animationDelay: `${i * 200}ms` }} />
                      </div>
                    </div>
                    <div className="relative h-4 w-16 rounded-lg bg-kwik-bg-light overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer-sweep_2s_ease-in-out_infinite]" style={{ animationDelay: `${i * 250}ms` }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-auto pt-1">
                    <div className="relative h-7 flex-1 rounded-xl bg-kwik-bg-light overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer-sweep_2s_ease-in-out_infinite]" style={{ animationDelay: `${i * 300}ms` }} />
                    </div>
                    <div className="relative h-7 w-7 rounded-xl bg-kwik-bg-light overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer-sweep_2s_ease-in-out_infinite]" style={{ animationDelay: `${i * 350}ms` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No query state - enhanced with illustration area */}
        {!query && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="relative mb-6">
              {/* Decorative background */}
              <div className="absolute -inset-8 rounded-full bg-kwik-orange/5 blur-2xl" />
              <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-kwik-orange/10 to-kwik-orange/5 ring-1 ring-kwik-orange/20">
                <Search className="h-12 w-12 text-kwik-orange" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-kwik-dark">Search Kwikseller</h3>
            <p className="mt-2 max-w-sm text-center text-sm text-kwik-gray-light">
              Find products, stores, and categories. Start typing to see results.
            </p>
            <div className="mt-4 flex gap-2">
              {["Electronics", "Fashion", "Phones"].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => {
                    const params = new URLSearchParams({ q: term });
                    router.push(`/search?${params.toString()}`);
                  }}
                  className="rounded-full border border-kwik-border bg-kwik-bg-surface px-4 py-2 text-xs font-medium text-kwik-gray transition-all duration-200 hover:border-kwik-orange/50 hover:bg-kwik-orange-tint hover:text-kwik-orange"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results grid */}
        {query && !isLoading && results.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {sortedResults.map((product) => (
              <SearchProductCard
                key={product.id}
                product={product}
                onQuickView={handleQuickView}
              />
            ))}
          </div>
        )}
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

/* ─── Default export with Suspense ──────────────────────────── */

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-kwik-bg-page">
          <Loader2 className="h-8 w-8 animate-spin text-kwik-orange" />
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
