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

import { useQuery, useInfiniteQuery, keepPreviousData, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchProducts,
  fetchProduct,
  searchProducts,
  searchProductsWithFilters,
  fetchTrendingProducts,
  fetchTopProducts,
  fetchDealProducts,
  fetchNewArrivals,
  fetchCategories,
  fetchCategoryBySlug,
  fetchBrands,
  fetchBanners,
  fetchDeals,
  fetchFlashDeals,
  fetchFeaturedDeals,
  fetchDeal,
  type Product,
  type Category,
  type Brand,
  type Banner,
  type Deal,
  type PaginatedResponse,
  type SearchFilters,
  type SearchMeta,
  type SearchResponse,
} from "@/lib/api";
import { api } from "@/services/api-client";
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
    categoryId: p.categoryId,
    brandId: p.brandId,
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
  categoryIds?: string[];
  brandId?: string;
  brandIds?: string[];
  storeId?: string;
  storeIds?: string[];
  isFeatured?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

function toSearchSort(params: ProductListParams): SearchFilters["sort"] {
  if (params.sortBy === "price") {
    return params.sortOrder === "asc" ? "price-low" : "price-high";
  }

  if (params.sortBy === "createdAt") return "newest";
  if (params.sortBy === "rating") return "rating";
  if (params.sortBy === "totalSales") return "popular";
  return "relevance";
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

/** Infinite product list with filters + sorting. */
export function useProductsInfinite(params: ProductListParams = {}) {
  const limit = params.limit ?? 20;
  const query = useInfiniteQuery({
    queryKey: ["products", "infinite", params],
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const res = await searchProductsWithFilters({
        q: params.search,
        categoryId: params.categoryId,
        categoryIds: params.categoryIds,
        brandId: params.brandId,
        brandIds: params.brandIds,
        storeId: params.storeId,
        storeIds: params.storeIds,
        sort: toSearchSort(params),
        page: pageParam,
        limit,
      });
      return {
        products: (res.data || []).map(toMarketplaceProduct),
        meta: res.meta
          ? {
              page: res.meta.page,
              limit: res.meta.limit,
              total: res.meta.total,
              totalPages: res.meta.pages,
            }
          : {
              page: pageParam,
              limit,
              total: res.data?.length ?? 0,
              totalPages: 1,
            },
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const page = lastPage.meta?.page ?? 1;
      const totalPages = lastPage.meta?.totalPages ?? 1;
      return page < totalPages ? page + 1 : null;
    },
    staleTime: 30 * 1000,
  });

  const pages = query.data?.pages ?? [];
  const products = pages.flatMap((page) => page.products);
  const meta = pages[pages.length - 1]?.meta;

  return {
    products,
    meta,
    isLoading: query.isLoading,
    isError: query.isError,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    error: query.error,
    refetch: query.refetch,
    fetchNextPage: query.fetchNextPage,
  };
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

export function useNewArrivals(limit = 10) {
  return useQuery({
    queryKey: ["products", "new", limit],
    queryFn: async () => {
      const res = await fetchNewArrivals(limit);
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

// ─── Full-featured search (filters + sort + pagination + facets) ──────────

export interface SearchResultsState {
  products: MarketplaceProduct[];
  meta: SearchMeta | null;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Full-featured search hook — sends one consolidated request with query,
 * filters, sort, and pagination. Returns products + facets in `meta`.
 *
 * Uses `keepPreviousData` so the UI doesn't flash empty when filters change.
 */
export function useSearchResults(filters: SearchFilters, enabled = true) {
  const query = useQuery({
    queryKey: ["search", "results", filters],
    queryFn: async (): Promise<SearchResponse> => {
      const res = await searchProductsWithFilters(filters);
      // The api-client may return either the raw `{success, data, meta}`
      // shape OR unwrap it. Handle both defensively.
      if (Array.isArray((res as unknown as { data?: unknown }).data)) {
        return res;
      }
      // Defensive: if the api-client unwrapped to just an array, wrap it.
      return {
        success: true,
        data: (res as unknown as Product[]) ?? [],
        meta: {
          query: filters.q ?? "",
          total: 0,
          page: filters.page ?? 1,
          limit: filters.limit ?? 20,
          pages: 0,
          categories: [],
          brands: [],
          stores: [],
          states: [],
          priceRange: { min: 0, max: 0 },
          nextCursor: null,
        },
      };
    },
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000, // 30s — keeps facets stable during rapid filter changes
  });

  const raw = query.data;
  const products: MarketplaceProduct[] = raw?.data
    ? raw.data.map(toMarketplaceProduct)
    : [];
  const meta: SearchMeta | null = raw?.meta ?? null;

  return {
    products,
    meta,
    isLoading: query.isLoading,
    isError: query.isError,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Infinite search hook — uses `useInfiniteQuery` for the "Load More" pattern.
 * Each page fetches `filters.limit` results; `fetchNextPage` loads the next
 * page. Facets come from the LAST fetched page (most accurate for current
 * position in the result set).
 *
 * NOTE: When filters/sort/query change, the query key changes and react-query
 * automatically resets to page 1 — no manual state reset needed.
 */
export function useSearchInfinite(filters: SearchFilters, enabled = true) {
  const query = useInfiniteQuery({
    queryKey: ["search", "infinite", filters],
    queryFn: async ({ pageParam }: { pageParam: number }): Promise<SearchResponse> => {
      const res = await searchProductsWithFilters({ ...filters, page: pageParam });
      if (Array.isArray((res as unknown as { data?: unknown }).data)) {
        return res;
      }
      return {
        success: true,
        data: (res as unknown as Product[]) ?? [],
        meta: {
          query: filters.q ?? "",
          total: 0,
          page: pageParam,
          limit: filters.limit ?? 20,
          pages: 0,
          categories: [],
          brands: [],
          stores: [],
          states: [],
          priceRange: { min: 0, max: 0 },
          nextCursor: null,
        },
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: SearchResponse): number | null => {
      const { page, pages } = lastPage.meta ?? { page: 1, pages: 1 };
      return page < pages ? page + 1 : null;
    },
    enabled,
    staleTime: 30 * 1000,
  });

  // Flatten all pages' products into a single array.
  const pages = query.data?.pages ?? [];
  const products: MarketplaceProduct[] = pages.flatMap((p) =>
    (p.data ?? []).map(toMarketplaceProduct),
  );
  // Use the last page's meta (most accurate for current position).
  const meta: SearchMeta | null = pages[pages.length - 1]?.meta ?? null;

  return {
    products,
    meta,
    isLoading: query.isLoading,
    isError: query.isError,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    error: query.error,
    refetch: query.refetch,
    fetchNextPage: query.fetchNextPage,
  };
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

export function useCategories(enabled = true) {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetchCategories();
      return res.data || [];
    },
    enabled,
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

export function useDeal(id: string | undefined) {
  return useQuery({
    queryKey: ["deal", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await fetchDeal(id);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useStores(
  params?: { page?: number; limit?: number; search?: string; category?: string },
  enabled = true,
) {
  return useQuery({
    queryKey: ["stores", params],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (params?.page) query.set("page", String(params.page));
      if (params?.limit) query.set("limit", String(params.limit));
      if (params?.search) query.set("search", params.search);
      if (params?.category) query.set("category", params.category);
      const qs = query.toString();
      const res = await api.get<{ data: unknown[]; meta: unknown }>(`vendors${qs ? `?${qs}` : ""}`);
      return res.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useStore(slug: string | undefined) {
  return useQuery({
    queryKey: ["store", slug],
    queryFn: async () => {
      if (!slug) return null;
      const res = await api.get<unknown>(`vendors/${encodeURIComponent(slug)}`);
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
      const res = await api.get<Product[]>(`vendors/${encodeURIComponent(slug)}/products`);
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

export interface ReviewSummary {
  average: number;
  total: number;
  distribution: Record<number, number>;
}

/** Rating summary (average + 5-star distribution) for a product. */
export function useReviewSummary(productId: string | undefined) {
  return useQuery({
    queryKey: ["reviews", "summary", productId],
    queryFn: async () => {
      if (!productId) return null;
      const res = await api.get<ReviewSummary>(`reviews/summary/${productId}`);
      return res.data || null;
    },
    enabled: !!productId,
    staleTime: 60_000,
  });
}

export interface ReviewEligibility {
  canReview: boolean;
  hasPurchased: boolean;
  hasReviewed: boolean;
  reason: string | null;
}

/**
 * Whether the current user is eligible to review this product.
 * Pass `enabled` = false when the user is not authenticated to skip the
 * request entirely (avoids a guaranteed 401).
 */
export function useReviewEligibility(productId: string | undefined, isAuthenticated: boolean) {
  return useQuery({
    queryKey: ["reviews", "eligibility", productId],
    queryFn: async () => {
      if (!productId) return null;
      const res = await api.get<ReviewEligibility>(`reviews/eligibility/${productId}`);
      return res.data || null;
    },
    enabled: !!productId && isAuthenticated,
    staleTime: 30_000,
  });
}

export interface CreateReviewPayload {
  productId: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
}

/** Submit a product review (purchase-verified on the backend). */
export function useSubmitReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateReviewPayload) => {
      const res = await api.post<ProductReview>("reviews", payload);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate reviews + summary + eligibility for this product so the
      // UI refetches and shows the new review immediately.
      queryClient.invalidateQueries({ queryKey: ["reviews", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ["reviews", "summary", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ["reviews", "eligibility", variables.productId] });
    },
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
