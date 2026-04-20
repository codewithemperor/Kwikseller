"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  Search,
  Loader2,
  ShoppingBag,
  Heart,
  Eye,
  Star,
} from "lucide-react";
import { kwikToast } from "@kwikseller/utils";
import { productsApi } from "@kwikseller/api-client";
import { useCartStore, useWishlistStore } from "@/stores";
import { useMarketplaceShell } from "@/components/layout/marketplace-shell-context";
import type { SearchableProduct } from "@/data/products";
import type { MarketplaceProduct } from "@/data/marketplace-home";

// Dynamic import for QuickViewModal to reduce initial bundle
const QuickViewModal = dynamic(
  () => import("@/components/landing/quick-view-modal").then((mod) => mod.QuickViewModal),
  { ssr: false },
);

/* ─── Helpers ──────────────────────────────────────────────── */

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(n);
}

function discountPct(price: number, compare?: number) {
  if (!compare) return 0;
  return Math.round(((compare - price) / compare) * 100);
}

/* ─── Lightweight Product Card ─────────────────────────────── */

function SearchProductCard({
  product,
  onQuickView,
}: {
  product: SearchableProduct;
  onQuickView?: (p: SearchableProduct) => void;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const { toggleItem, isInWishlist } = useWishlistStore();
  const isWished = isInWishlist(product.id);
  const discount = discountPct(product.price, product.comparePrice);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      comparePrice: product.comparePrice,
      image: product.image,
      store: product.store,
    });
    kwikToast.success(`${product.name} added to cart`);
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleItem({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.comparePrice,
      image: product.image,
      rating: product.rating,
      category: product.categorySlug,
    });
    kwikToast.success(isWished ? "Removed from wishlist" : "Added to wishlist");
  };

  return (
    <article
      className="group relative flex w-full flex-col overflow-hidden rounded-[22px] bg-background shadow-sm ring-1 ring-border transition-shadow hover:shadow-md cursor-pointer"
      onClick={() => onQuickView?.(product)}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden rounded-[18px] m-2 bg-kwik-bg-light">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, 25vw"
          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />

        {/* Badges */}
        <div className="absolute left-3 top-3 flex gap-1.5">
          {discount > 0 && (
            <span className="rounded-lg bg-kwik-badge-dark px-2 py-0.5 text-[11px] font-semibold text-white">
              -{discount}%
            </span>
          )}
          {product.isNew && (
            <span className="rounded-lg bg-background/90 px-2 py-0.5 text-[11px] font-semibold text-kwik-dark">
              New
            </span>
          )}
        </div>

        {/* Wishlist button */}
        <button
          type="button"
          onClick={handleWishlistToggle}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 shadow-sm backdrop-blur-sm transition-colors hover:bg-background"
          aria-label={isWished ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            className={`h-4 w-4 transition-colors ${
              isWished ? "fill-kwik-orange text-kwik-orange" : "text-kwik-muted"
            }`}
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2 px-3 pb-3 pt-2">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-kwik-dark">
          {product.name}
        </p>

        {/* Footer */}
        <div className="flex items-end justify-between pb-3 pt-0.5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-kwik-muted">
              {product.store}
            </p>
            <div className="flex items-center gap-1 rounded-xl text-[11px]">
              <Star className="h-3 w-3 fill-kwik-star text-kwik-star" />
              <span className="font-semibold text-kwik-dark-medium">
                {product.rating.toFixed(1)}
              </span>
            </div>
          </div>
          <div className="text-right">
            {product.comparePrice && (
              <p className="text-[10px] text-kwik-muted line-through">
                {formatPrice(product.comparePrice)}
              </p>
            )}
            <p className="text-xs font-bold text-kwik-dark">
              {formatPrice(product.price)}
            </p>
          </div>
        </div>

        {/* Add to Cart + Eye */}
        <div className="flex items-center gap-2 mt-auto">
          <button
            onClick={handleAddToCart}
            className="flex h-7 flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent-soft-hover hover text-[10px] font-medium text-kwik-dark-medium transition-colors"
          >
            <ShoppingBag className="h-3 w-3" />
            Add to Cart
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickView?.(product);
            }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-kwik-bg-light transition-colors hover:bg-kwik-orange-tint hover:text-kwik-orange"
            aria-label="Quick view"
          >
            <Eye className="h-3.5 w-3.5 text-kwik-gray-light" />
          </button>
        </div>
      </div>
    </article>
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
    name: p.name,
    price: p.price,
    comparePrice: p.comparePrice,
    image: p.image,
    rating: p.rating,
    reviewCount: p.reviewCount,
    store: p.store,
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
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState(categoryParam);
  const [sortBy, setSortBy] = useState<SortValue>("relevance");
  const [quickViewProduct, setQuickViewProduct] = useState<MarketplaceProduct | null>(null);

  // Read showFilters from layout shell context
  const showFilters = shell?.showFilters ?? filtersParam;

  // Fetch search results from NestJS API via api-client
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const response = await productsApi.search({
          q: query,
          category: activeCategory || undefined,
          limit: 50,
        });

        if (response.success && response.data) {
          setResults(response.data as unknown as SearchableProduct[]);
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchResults, 200);
    return () => clearTimeout(timer);
  }, [query, activeCategory]);

  // Sync category with URL param
  useEffect(() => {
    setActiveCategory(categoryParam);
  }, [categoryParam]);

  // Sort results
  const sortedResults = React.useMemo(() => {
    let sorted = [...results];

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
    <div className="min-h-screen bg-kwik-bg-page">
      {/* Category tabs - sticky below the header */}
      <div className="sticky top-[53px] md:top-[64px] z-20 bg-background border-b border-kwik-border">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide -mx-4 px-4">
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat.slug || "all"}
                type="button"
                onClick={() => handleCategoryChange(cat.slug)}
                className={`flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                  activeCategory === cat.slug
                    ? "bg-kwik-orange text-white"
                    : "bg-kwik-bg-light text-kwik-gray-light hover:bg-kwik-border"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Filters panel - controlled by layout header */}
        {showFilters && (
          <div className="border-t border-kwik-border">
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
                        : "bg-kwik-bg-light text-kwik-gray-light hover:bg-kwik-border"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results area */}
      <div className="container mx-auto px-4 py-4">
        {/* Results count */}
        {query && (
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-kwik-gray-light">
              {isLoading ? (
                "Searching..."
              ) : (
                <>
                  <span className="font-semibold text-kwik-dark">{results.length}</span>{" "}
                  result{results.length !== 1 ? "s" : ""} for{" "}
                  <span className="font-semibold text-kwik-orange">&ldquo;{query}&rdquo;</span>
                </>
              )}
            </p>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-kwik-orange" />
            <p className="mt-3 text-sm text-kwik-gray-light">Searching...</p>
          </div>
        )}

        {/* No query state */}
        {!query && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-full bg-kwik-bg-light flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-kwik-muted" />
            </div>
            <h2 className="text-lg font-semibold text-kwik-dark mb-2">
              Search Kwikseller
            </h2>
            <p className="text-sm text-kwik-gray-light text-center max-w-sm">
              Find products, stores, and categories. Start typing to see results.
            </p>
          </div>
        )}

        {/* No results state */}
        {query && !isLoading && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-full bg-kwik-bg-light flex items-center justify-center mb-4">
              <ShoppingBag className="h-8 w-8 text-kwik-muted" />
            </div>
            <h2 className="text-lg font-semibold text-kwik-dark mb-2">
              No results found
            </h2>
            <p className="text-sm text-kwik-gray-light text-center max-w-sm">
              We couldn&apos;t find anything for &ldquo;{query}&rdquo;. Try a different search term or browse categories.
            </p>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-4 rounded-xl bg-kwik-orange px-6 py-2.5 text-sm font-semibold text-white hover:bg-kwik-orange-hover transition-colors"
            >
              Browse Marketplace
            </button>
          </div>
        )}

        {/* Results grid */}
        {query && !isLoading && results.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
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
