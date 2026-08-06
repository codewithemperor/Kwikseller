/**
 * Shared marketplace API hooks (React Query).
 *
 * Centralizes ALL data fetching for the marketplace so pages stop
 * re-implementing fetch logic, converters, and loading states. Every
 * catalog/browse page should import from here instead of calling
 * `@/lib/api` or `@kwikseller/api-client` directly.
 *
 * Backed by the dummy-data API when NEXT_PUBLIC_USE_DUMMY_DATA=true,
 * and by the real NestJS backend otherwise — pages don't care which.
 */

"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  fetchProducts,
  fetchProduct,
  searchProducts,
  fetchTrendingProducts,
  fetchTopProducts,
  fetchDealProducts,
  fetchCategories,
  fetchCategoryBySlug,
  fetchBrands,
  fetchBanners,
  fetchDeals,
  fetchFlashDeals,
  fetchFeaturedDeals,
  type Product,
  type Category,
  type Brand,
  type Banner,
  type Deal,
  type PaginatedResponse,
} from "@/lib/api";
import { api } from "@kwikseller/api-client";
import type { MarketplaceProduct } from "@/data/marketplace-home";
import type { SearchableProduct } from "@/data/products";

// ─── Mappers (single source of truth — no per-page duplication) ────────────

function sanitizeImageUrl(url: unknown): string {
  if (!url || typeof url !== "string" || url === "undefined" || url === "null") return "";
  return url;
}

/** API Product → flat MarketplaceProduct (for cards/carousels). */
export function toMarketplaceProduct(p: Product): MarketplaceProduct {
  const mainImage = p.images?.find((i) => i.isMain) || p.images?.[0];
  const tags = p.tags?.map((t) => t.tag?.name || "").filter(Boolean) ?? [];
  return {
    id: String(p.id),
    slug: p.slug,
    name: p.name,
    price: p.price,
    comparePrice: p.comparePrice || undefined,
    image: sanitizeImageUrl(mainImage?.url),
    rating: p.rating,
    reviewCount: p.reviewCount,
    store: p.store?.name || "Kwikseller",
    storeId: p.storeId,
    storeSlug: p.store?.slug,
    category: p.category?.name || "",
    productType: "PHYSICAL",
    productSource: "VENDOR_STOCK",
    requiresShipping: true,
    trackInventory: true,
    lowStock: p.stock <= 5 ? p.stock : undefined,
    isNew: tags.includes("New"),
    tag: tags[0],
    description: p.description,
    images: p.images?.map((i) => i.url),
    stock: p.stock,
    variants: p.variants?.map((v) => ({
      id: v.id,
      name: v.name,
      options: v.options,
      price: v.price,
      stock: v.stock,
    })),
  };
}

/** API Product → SearchableProduct (for search results / quick view). */
export function toSearchableProduct(p: Product): SearchableProduct {
  const mainImage = p.images?.find((i) => i.isMain) || p.images?.[0];
  return {
    id: String(p.id),
    name: p.name,
    slug: p.slug,
    price: p.price,
    comparePrice: p.comparePrice || undefined,
    image: sanitizeImageUrl(mainImage?.url),
    rating: p.rating,
    reviewCount: p.reviewCount,
    store: p.store?.name || "Kwikseller",
    storeId: p.storeId,
    storeSlug: p.store?.slug,
    category: p.category?.name || "",
    categorySlug: p.category?.slug || "",
    description: p.description || "",
    tags: p.tags?.map((t) => t.tag?.name || "").filter(Boolean) || [],
    inStock: p.stock > 0,
    isNew: (p.tags?.map((t) => t.tag?.name).filter(Boolean) ?? []).includes("New"),
    isFeatured: p.isFeatured,
  };
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  brandId?: string;
  storeId?: string;
  isFeatured?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/** Paginated product list with filters + sorting. */
export function useProducts(params: ProductListParams = {}) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: async () => {
      const res = await fetchProducts(params);
      return {
        products: (res.data || []).map(toMarketplaceProduct),
        meta: res.meta,
      };
    },
    placeholderData: keepPreviousData,
  });
}

/** Raw API products (when you need the full Product shape, e.g. detail page). */
export function useProduct(idOrSlug: string | undefined) {
  return useQuery({
    queryKey: ["product", idOrSlug],
    queryFn: async () => {
      if (!idOrSlug) return null;
      const res = await fetchProduct(idOrSlug);
      return res.data;
    },
    enabled: !!idOrSlug,
  });
}

export function useTrending(limit = 10) {
  return useQuery({
    queryKey: ["products", "trending", limit],
    queryFn: async () => {
      const res = await fetchTrendingProducts(limit);
      return (res.data || []).map(toMarketplaceProduct);
    },
  });
}

export function useTopProducts(limit = 10) {
  return useQuery({
    queryKey: ["products", "top", limit],
    queryFn: async () => {
      const res = await fetchTopProducts(limit);
      return (res.data || []).map(toMarketplaceProduct);
    },
  });
}

export function useDealProducts(limit = 10) {
  return useQuery({
    queryKey: ["products", "deals", limit],
    queryFn: async () => {
      const res = await fetchDealProducts(limit);
      return (res.data || []).map(toMarketplaceProduct);
    },
  });
}

export function useSearch(query: string, limit = 20, enabled = true) {
  return useQuery({
    queryKey: ["products", "search", query, limit],
    queryFn: async () => {
      if (!query.trim()) return [];
      const res = await searchProducts(query, limit);
      return (res.data || []).map(toMarketplaceProduct);
    },
    enabled: enabled && query.trim().length > 0,
  });
}

export interface TrendingSearch {
  id: string;
  label: string;
  query: string;
  category: string;
  count: number;
  trending: boolean;
}

export function useTrendingSearches(limit = 12) {
  return useQuery<TrendingSearch[]>({
    queryKey: ["search", "trending", limit],
    queryFn: async () => {
      const res = await api.get<TrendingSearch[]>(`search/trending?limit=${limit}`);
      return res.data || [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useSearchSuggestions(term: string, enabled = true) {
  return useQuery<string[]>({
    queryKey: ["search", "suggestions", term],
    queryFn: async () => {
      const res = await api.get<string[]>(
        `search/suggestions?q=${encodeURIComponent(term)}`,
      );
      return res.data || [];
    },
    enabled: enabled && term.trim().length > 0,
    staleTime: 60 * 1000,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetchCategories();
      return res.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategoryBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["category", slug],
    queryFn: async () => {
      if (!slug) return null;
      const res = await fetchCategoryBySlug(slug);
      return res.data;
    },
    enabled: !!slug,
  });
}

export function useBrands() {
  return useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const res = await fetchBrands();
      return res.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useBanners(type?: string) {
  return useQuery({
    queryKey: ["banners", type],
    queryFn: async () => {
      const res = await fetchBanners(type);
      return res.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useDeals(dealType?: string) {
  return useQuery({
    queryKey: ["deals", dealType],
    queryFn: async () => {
      const res = await fetchDeals(dealType);
      return res.data || [];
    },
  });
}

export function useFlashDeals() {
  return useQuery({
    queryKey: ["deals", "flash"],
    queryFn: async () => {
      const res = await fetchFlashDeals();
      return res.data || [];
    },
  });
}

export function useFeaturedDeals() {
  return useQuery({
    queryKey: ["deals", "featured"],
    queryFn: async () => {
      const res = await fetchFeaturedDeals();
      return res.data || [];
    },
  });
}

export function useHomeFeed() {
  return useQuery({
    queryKey: ["home-feed"],
    queryFn: async () => {
      const res = await api.get<{
        heroBanners: Banner[];
        promoBanners: Banner[];
        categories: Array<{ id: string; name: string; slug: string; image: string; itemCount: number }>;
        trendingProducts: Product[];
        topProducts: Product[];
        flashDeals: Deal[];
        featuredDeals: Deal[];
        topSellers: unknown[];
      }>("products/home-feed");
      return res.data;
    },
  });
}

export function useStores() {
  return useQuery({
    queryKey: ["stores"],
    queryFn: async () => {
      const res = await api.get<unknown[]>("stores");
      return res.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useStore(slug: string | undefined) {
  return useQuery({
    queryKey: ["store", slug],
    queryFn: async () => {
      if (!slug) return null;
      const res = await api.get<unknown>(`stores/${encodeURIComponent(slug)}`);
      return res.data;
    },
    enabled: !!slug,
  });
}

export function useStoreProducts(slug: string | undefined) {
  return useQuery({
    queryKey: ["store-products", slug],
    queryFn: async () => {
      if (!slug) return [];
      const res = await api.get<Product[]>(`stores/${encodeURIComponent(slug)}/products`);
      return (res.data || []).map(toMarketplaceProduct);
    },
    enabled: !!slug,
  });
}

// ─── Reviews ────────────────────────────────────────────────────────────────

export interface ProductReview {
  id: string;
  productId: string;
  name: string;
  location: string;
  rating: number;
  text: string;
  createdAt: string;
  title?: string;
  verified?: boolean;
  helpful?: number;
  images?: string[];
  vendorReply?: {
    id: string;
    authorName: string;
    text: string;
    createdAt: string;
  };
}

/** Reviews for a single product (keyed on productId so it refetches on navigation). */
export function useReviews(productId: string | undefined) {
  return useQuery({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      if (!productId) return [];
      const res = await api.get<ProductReview[]>(`reviews/${productId}`);
      return res.data || [];
    },
    enabled: !!productId,
    staleTime: 60_000,
  });
}

// ─── Coupons ──────────────────────────────────────────────────────────────

export type CouponCategory = "WELCOME" | "FLASH" | "FESTIVE" | "VENDOR" | "LOYALTY" | "SEASONAL";
export type CouponDiscountType = "PERCENT" | "AMOUNT" | "FREE_DELIVERY";
export type CouponAccentColor = "orange" | "amber" | "rose" | "emerald" | "violet";

export interface Coupon {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minOrder: number;
  maxDiscount?: number;
  category: CouponCategory;
  storeName?: string;
  storeId?: string;
  badgeText?: string;
  accentColor?: CouponAccentColor;
  expiresAt: string;
  isActive: boolean;
  totalRedeemed: number;
  totalBudget: number;
}

/**
 * Fetches the list of active coupons. Pass `category` to filter
 * (e.g. "FLASH"); pass "ALL" or omit to list everything.
 */
export function useCoupons(category: CouponCategory | "ALL" = "ALL") {
  return useQuery({
    queryKey: ["coupons", category],
    queryFn: async () => {
      const res = await api.get<Coupon[]>("coupons", { params: { category } });
      return res.data || [];
    },
    staleTime: 60_000,
  });
}

// ─── FAQ + Support tickets ────────────────────────────────────────────────

export type FAQCategory = "ORDERS" | "PAYMENTS" | "DELIVERY" | "RETURNS" | "ACCOUNT" | "VENDOR";

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: FAQCategory;
}

export interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  message: string;
  orderId?: string;
  email?: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  createdAt: string;
}

/** Fetches the FAQ list, optionally filtered by category. */
export function useFAQ(category: FAQCategory | "ALL" = "ALL") {
  return useQuery({
    queryKey: ["faq", category],
    queryFn: async () => {
      const res = await api.get<FAQItem[]>("faq", { params: { category } });
      return res.data || [];
    },
    staleTime: 5 * 60_000,
  });
}

// ─── Re-exports for convenience ────────────────────────────────────────────

export type { Product, Category, Brand, Banner, Deal, PaginatedResponse };
