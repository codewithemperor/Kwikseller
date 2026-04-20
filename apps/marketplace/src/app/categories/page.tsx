"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  ChevronRight,
  Heart,
  Eye,
  Star,
  ShoppingBag,
  Loader2,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { kwikToast } from "@kwikseller/utils";
import { productsApi } from "@kwikseller/api-client";
import { useCartStore, useWishlistStore } from "@/stores";
import { marketplaceCategories } from "@/data/marketplace-home";
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

/* ─── Product Card ─────────────────────────────────────────── */

function CategoryProductCard({
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
      <div className="relative aspect-square overflow-hidden rounded-[18px] m-2 bg-kwik-bg-light">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, 25vw"
          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
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

/* ─── Category Card (for all-categories view) ──────────────── */

function CategoryGridCard({
  category,
}: {
  category: (typeof marketplaceCategories)[number];
}) {
  const router = useRouter();
  const Icon = category.icon;

  return (
    <button
      type="button"
      onClick={() => router.push(`/categories?${category.id}`)}
      className="group relative flex flex-col overflow-hidden rounded-[22px] bg-background shadow-sm ring-1 ring-border transition-shadow hover:shadow-md text-left"
    >
      <div className="relative h-40 sm:h-48 overflow-hidden">
        <Image
          src={category.image}
          alt={category.name}
          fill
          sizes="(max-width: 640px) 50vw, 33vw"
          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-background/20 backdrop-blur-sm">
              <Icon className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white">{category.name}</h3>
          </div>
          <p className="text-xs text-white/80">{category.itemCount}</p>
        </div>
      </div>
      <div className="px-4 py-3">
        <p className="text-xs text-kwik-gray-light line-clamp-2">{category.description}</p>
        <div className="mt-2 flex items-center gap-1 text-xs font-medium text-kwik-orange">
          Shop now
          <ChevronRight className="h-3 w-3" />
        </div>
      </div>
    </button>
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

/* ─── Convert for QuickViewModal ──────────────────────────── */

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

/* ─── Category Detail View ────────────────────────────────── */

function CategoryDetailView({ slug }: { slug: string }) {
  const router = useRouter();
  const categoryInfo = marketplaceCategories.find((c) => c.id === slug);
  const CategoryIcon = categoryInfo?.icon;

  const [products, setProducts] = useState<SearchableProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortValue>("relevance");
  const [showFilters, setShowFilters] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<MarketplaceProduct | null>(null);

  // Fetch products from the NestJS API
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const response = await productsApi.getCategoryBySlug(slug, { limit: 50 });
        if (response.success && response.data) {
          const respData = response.data as any;
          // API returns { category, products, total } shape
          if (Array.isArray(respData)) {
            setProducts(respData);
          } else if (respData.products && Array.isArray(respData.products)) {
            setProducts(respData.products);
          } else {
            setProducts([]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch category products:", err);
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
    <div className="min-h-screen bg-kwik-bg-page">
      {/* Category Header */}
      <div className="bg-background border-b border-kwik-border">
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
            <span className="font-medium text-kwik-dark">
              {categoryInfo?.name || slug}
            </span>
          </div>

          {/* Category info row */}
          <div className="flex items-center gap-4 pb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-kwik-orange-tint text-kwik-orange">
              {CategoryIcon && <CategoryIcon className="h-6 w-6" />}
            </div>
            <div>
              <h1 className="text-xl font-bold text-kwik-dark">
                {categoryInfo?.name || slug}
              </h1>
              <p className="text-sm text-kwik-gray-light">
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
                  : "bg-kwik-bg-light text-kwik-gray-light hover:bg-kwik-border"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Sort
            </button>
          </div>

          {/* Category quick-nav tabs */}
          <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {marketplaceCategories.map((cat) => {
              const Icon = cat.icon;
              const isActive = cat.id === slug;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => router.push(`/categories?${cat.id}`)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-kwik-orange text-white"
                      : "bg-kwik-bg-light text-kwik-gray-light hover:bg-kwik-border"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sort filters */}
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

      {/* Products area */}
      <div className="container mx-auto px-4 py-4">
        {/* Results count */}
        <div className="mb-4">
          <p className="text-sm text-kwik-gray-light">
            {isLoading ? (
              "Loading..."
            ) : (
              <>
                <span className="font-semibold text-kwik-dark">{sortedProducts.length}</span>{" "}
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
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-full bg-kwik-bg-light flex items-center justify-center mb-4">
              <ShoppingBag className="h-8 w-8 text-kwik-muted" />
            </div>
            <h2 className="text-lg font-semibold text-kwik-dark mb-2">
              No products found
            </h2>
            <p className="text-sm text-kwik-gray-light text-center max-w-sm">
              No products available in this category yet. Check back later or browse other categories.
            </p>
            <button
              type="button"
              onClick={() => router.push("/categories")}
              className="mt-4 rounded-xl bg-kwik-orange px-6 py-2.5 text-sm font-semibold text-white hover:bg-kwik-orange-hover transition-colors"
            >
              Browse Categories
            </button>
          </div>
        )}

        {/* Product grid */}
        {!isLoading && sortedProducts.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {sortedProducts.map((product) => (
              <CategoryProductCard
                key={product.id}
                product={product}
                onQuickView={handleQuickView}
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

/* ─── All Categories View ─────────────────────────────────── */

function AllCategoriesView() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-kwik-bg-page">
      {/* Header */}
      <div className="bg-background border-b border-kwik-border">
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
            <span className="font-medium text-kwik-dark">Categories</span>
          </div>

          <div className="pb-4">
            <h1 className="text-2xl font-bold text-kwik-dark">All Categories</h1>
            <p className="mt-1 text-sm text-kwik-gray-light">
              Browse products by category
            </p>
          </div>
        </div>
      </div>

      {/* Category grid */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {marketplaceCategories.map((category) => (
            <CategoryGridCard key={category.id} category={category} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page Component ─────────────────────────────────── */

function CategoriesPageContent() {
  const searchParams = useSearchParams();
  // URL format: /categories?electronics → the category slug is the first search param key
  const allKeys = Array.from(searchParams.keys());
  const slug = allKeys.length > 0 ? allKeys[0] : "";

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
