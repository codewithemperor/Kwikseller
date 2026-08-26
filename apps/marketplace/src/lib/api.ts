/**
 * Marketplace API client.
 *
 * IMPORTANT: This file NO LONGER creates its own axios instance.
 * It re-uses the single canonical client from `@kwikseller/api-client`,
 * which:
 *   - reads the token from `kwikseller_access_token` (NOT `token`)
 *   - runs the shared refresh-token queue on 401
 *   - redirects to the correct login page per host/path
 *
 * Previously this file created a second axios instance that read
 * `localStorage.getItem('token')` — a key nobody else writes — so every
 * authenticated call ran without an Authorization header. That bug is
 * fixed by delegating to the shared client.
 */
"use client";

import { api } from "@/services/api-client";
import type { ApiResponse } from "@/services/api-client";

// Re-export the canonical client for direct use where needed.
export { api };

// ==================== Types ====================
// Kept local for backward compatibility with existing importers
// (`@/lib/api` consumers expect these named exports).

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  comparePrice?: number;
  sku?: string;
  stock: number;
  status: string;
  isFeatured: boolean;
  rating: number;
  reviewCount: number;
  totalSales: number;
  categoryId?: string;
  brandId?: string;
  storeId: string;
  store?: { id: string; name: string; slug: string; logoUrl?: string };
  category?: { id: string; name: string; slug: string };
  brand?: { id: string; name: string; slug: string; image?: string };
  images: { id: string; url: string; alt?: string; isMain: boolean; position: number }[];
  variants: { id: string; name: string; options: string; price: number; stock: number }[];
  tags: { productId: string; tagId: string; tag?: { id: string; name: string } }[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  imageUrl?: string;
  icon?: string;
  isActive: boolean;
  position: number;
  children?: Category[];
  _count?: { products: number };
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  image?: string;
  status: boolean;
  _count?: { products: number };
  // ── Enrichment (cycle 7) ────────────────────────────────────────────────
  story?: string;
  tagline?: string;
  foundedYear?: number;
  country?: string;
  headquarters?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  totalSales?: number;
  followCount?: number;
  verified?: boolean;
  badges?: string[];
  categories?: string[];
  socialLinks?: { type: string; url: string }[];
  coverImage?: string;
}

export interface Banner {
  id: string;
  title?: string;
  subTitle?: string;
  image: string;
  url?: string;
  bannerType: string;
  resourceType?: string;
  resourceId?: string;
  backgroundColor?: string;
  buttonText?: string;
  position: number;
  isActive: boolean;
}

export interface Deal {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  dealType: string;
  discountType: string;
  discountValue: number;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  products?: { id: string; dealPrice: number; product: Product }[];
}

// ==================== API Functions ====================
// All calls go through the shared `api` client → correct token +
// automatic refresh on 401.

export const fetchProducts = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  brandId?: string;
  status?: string;
  isFeatured?: boolean;
}): Promise<PaginatedResponse<Product>> =>
  api.get<Product[]>("/products", { params }) as Promise<PaginatedResponse<Product>>;

export const fetchProduct = async (
  id: string
): Promise<{ success: boolean; data: Product }> =>
  api.get<Product>(`/products/${id}`) as Promise<{ success: boolean; data: Product }>;

// ==================== Search ====================
// Full-featured search params — sent to /products/search as query string.
// The backend (NestJS or dummy gateway) applies server-side filters,
// relevance ranking, and returns facets in `meta`.

export interface SearchFilters {
  q?: string;
  category?: string; // slug or id
  categoryId?: string;
  categoryIds?: string[];
  brandId?: string;
  brandIds?: string[];
  storeId?: string;
  storeIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  rating?: number; // minimum rating (e.g. 4 = "4 stars & above")
  state?: string; // state name/code
  states?: string[];
  sort?: "relevance" | "price-low" | "price-high" | "rating" | "newest" | "popular";
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface SearchFacet {
  id: string;
  slug: string;
  name: string;
  count: number;
}

export interface StateFacet {
  id: string;
  name: string;
  code: string;
  count: number;
}

export interface SearchMeta {
  query: string;
  total: number;
  page: number;
  limit: number;
  pages: number;
  categories: SearchFacet[];
  brands: SearchFacet[];
  stores: SearchFacet[];
  states: StateFacet[];
  priceRange: { min: number; max: number };
  nextCursor: string | null;
}

export interface SearchResponse {
  success: boolean;
  data: Product[];
  meta: SearchMeta;
}

export const searchProducts = async (
  query: string,
  limit = 20,
): Promise<PaginatedResponse<Product>> =>
  api.get<Product[]>("/products/search", {
    params: { q: query, limit },
  }) as Promise<PaginatedResponse<Product>>;

/**
 * Full-featured search — accepts all filters + sort + pagination in one
 * consolidated request. Returns products + facets in `meta`.
 */
export const searchProductsWithFilters = async (
  filters: SearchFilters,
): Promise<SearchResponse> => {
  // Drop undefined values so axios doesn't serialize them as "undefined".
  const params: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(filters)) {
    if (Array.isArray(v) && v.length === 0) continue;
    if (v !== undefined && v !== null && v !== "") {
      params[k] = Array.isArray(v)
        ? v.join(",")
        : typeof v === "number"
          ? String(v)
          : v;
    }
  }
  return api.get<Product[]>("/products/search", { params }) as Promise<SearchResponse>;
};

export const fetchTrendingProducts = async (
  limit = 10
): Promise<PaginatedResponse<Product>> =>
  api.get<Product[]>("/products/trending", {
    params: { limit },
  }) as Promise<PaginatedResponse<Product>>;

export const fetchTopProducts = async (
  limit = 10
): Promise<PaginatedResponse<Product>> =>
  api.get<Product[]>("/products/top", {
    params: { limit },
  }) as Promise<PaginatedResponse<Product>>;

export const fetchDealProducts = async (
  limit = 10
): Promise<PaginatedResponse<Product>> =>
  api.get<Product[]>("/products/deals", {
    params: { limit },
  }) as Promise<PaginatedResponse<Product>>;

export const fetchNewArrivals = async (
  limit = 10
): Promise<PaginatedResponse<Product>> =>
  api.get<Product[]>("/products/new", {
    params: { limit },
  }) as Promise<PaginatedResponse<Product>>;

export const fetchCategories = async (): Promise<{
  success: boolean;
  data: Category[];
}> =>
  api.get<Category[]>("/categories") as Promise<{
    success: boolean;
    data: Category[];
  }>;

export const fetchCategoryBySlug = async (
  slug: string
): Promise<{ success: boolean; data: Category & { products?: Product[] } }> =>
  api.get<Category & { products?: Product[] }>(
    `/categories/slug/${slug}`
  ) as Promise<{ success: boolean; data: Category & { products?: Product[] } }>;

export const fetchBrands = async (): Promise<{
  success: boolean;
  data: Brand[];
}> =>
  api.get<Brand[]>("/brands") as Promise<{ success: boolean; data: Brand[] }>;

export const fetchBanners = async (
  type?: string
): Promise<{ success: boolean; data: Banner[] }> =>
  api.get<Banner[]>("/banners", {
    params: { type },
  }) as Promise<{ success: boolean; data: Banner[] }>;

export const fetchDeals = async (
  dealType?: string
): Promise<{ success: boolean; data: Deal[] }> =>
  api.get<Deal[]>("/deals", {
    params: { dealType },
  }) as Promise<{ success: boolean; data: Deal[] }>;

export const fetchFlashDeals = async (): Promise<{
  success: boolean;
  data: Deal[];
}> => api.get<Deal[]>("/deals/flash") as Promise<{ success: boolean; data: Deal[] }>;

export const fetchFeaturedDeals = async (): Promise<{
  success: boolean;
  data: Deal[];
}> =>
  api.get<Deal[]>("/deals/featured") as Promise<{ success: boolean; data: Deal[] }>;

export const fetchDeal = async (
  id: string
): Promise<{ success: boolean; data: Deal }> =>
  api.get<Deal>(`/deals/${id}`) as Promise<{ success: boolean; data: Deal }>;

export const fetchDashboardStats = async (): Promise<{
  success: boolean;
  data: {
    totalProducts: number;
    totalOrders: number;
    totalUsers: number;
    totalRevenue: number;
  };
}> =>
  api.get<{
    totalProducts: number;
    totalOrders: number;
    totalUsers: number;
    totalRevenue: number;
  }>("/dashboard/stats") as Promise<{
    success: boolean;
    data: {
      totalProducts: number;
      totalOrders: number;
      totalUsers: number;
      totalRevenue: number;
    };
  }>;
