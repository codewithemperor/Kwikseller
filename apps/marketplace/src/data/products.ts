/**
 * products.ts - Real API-based product functions for the marketplace.
 * All data is fetched from the NestJS API. No mock/dummy data.
 */

import {
  api,
  type Product,
  type PaginatedResponse,
  fetchProducts,
  fetchTrendingProducts,
  fetchDealProducts,
  fetchTopProducts,
  searchProducts,
  fetchCategoryBySlug,
  fetchFeaturedDeals,
  fetchFlashDeals,
  fetchCategories,
  fetchBrands,
  type Deal,
  type Category,
  type Brand,
} from '@/lib/api';

export type { Product, PaginatedResponse, Deal, Category, Brand };

/**
 * SearchableProduct - compatibility type used by marketplace components.
 * Maps to the API Product type with simplified fields.
 */
export interface SearchableProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  store: string;
  category: string;
  categorySlug: string;
  description: string;
  tags: string[];
  inStock: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
}

/**
 * Sanitize an image URL — returns null for undefined, empty, or "undefined" strings.
 */
function sanitizeImageUrl(url: unknown): string {
  if (!url || typeof url !== 'string' || url === 'undefined' || url === 'null') return '';
  return url;
}

/**
 * Convert API Product to SearchableProduct format
 */
export function toSearchableProduct(p: Product): SearchableProduct {
  const mainImage = p.images?.find(i => i.isMain) || p.images?.[0];
  return {
    id: String(p.id),
    name: p.name,
    slug: p.slug,
    price: p.price,
    comparePrice: p.comparePrice || undefined,
    image: sanitizeImageUrl(mainImage?.url),
    rating: p.rating,
    reviewCount: p.reviewCount,
    store: p.store?.name || 'Kwikseller',
    category: p.category?.name || '',
    categorySlug: p.category?.slug || '',
    description: p.description || '',
    tags: p.tags?.map(t => t.tag?.name || '').filter(Boolean) || [],
    inStock: p.stock > 0,
    isNew: false,
    isFeatured: p.isFeatured,
  };
}

/**
 * Search products by query string via API
 */
export async function search(query: string, limit = 20): Promise<Product[]> {
  if (!query.trim()) return [];
  try {
    const result = await searchProducts(query, limit);
    return result.data || [];
  } catch {
    return [];
  }
}

/**
 * Get products by category slug via API
 */
export async function getByCategory(categorySlug: string, limit = 20): Promise<Product[]> {
  try {
    const result = await fetchCategoryBySlug(categorySlug);
    return (result.data?.products as Product[]) || [];
  } catch {
    return [];
  }
}

/**
 * Get a single product by ID via API
 */
export async function getById(id: string): Promise<Product | undefined> {
  try {
    const result = await api.get(`/products/${id}`);
    return result.data?.data;
  } catch {
    return undefined;
  }
}

/**
 * Get featured products via API
 */
export async function getFeatured(limit = 8): Promise<Product[]> {
  try {
    const result = await fetchTrendingProducts(limit);
    return result.data || [];
  } catch {
    return [];
  }
}

/**
 * Get trending products via API
 */
export async function getTrending(limit = 10): Promise<Product[]> {
  try {
    const result = await fetchTrendingProducts(limit);
    return result.data || [];
  } catch {
    return [];
  }
}

/**
 * Get top-rated products via API
 */
export async function getTopRated(limit = 10): Promise<Product[]> {
  try {
    const result = await fetchTopProducts(limit);
    return result.data || [];
  } catch {
    return [];
  }
}

/**
 * Get deal products via API
 */
export async function getDeals(limit = 10): Promise<Product[]> {
  try {
    const result = await fetchDealProducts(limit);
    return result.data || [];
  } catch {
    return [];
  }
}

/**
 * Get all active deals
 */
export async function getAllDeals(): Promise<Deal[]> {
  try {
    const result = await fetchFeaturedDeals();
    return result.data || [];
  } catch {
    return [];
  }
}

/**
 * Get flash deals
 */
export async function getFlashDeals(): Promise<Deal[]> {
  try {
    const result = await fetchFlashDeals();
    return result.data || [];
  } catch {
    return [];
  }
}

/**
 * Get featured deals
 */
export async function getFeaturedDeals(): Promise<Deal[]> {
  try {
    const result = await fetchFeaturedDeals();
    return result.data || [];
  } catch {
    return [];
  }
}

/**
 * Get all products with pagination
 */
export async function getAll(params?: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  brandId?: string;
}): Promise<PaginatedResponse<Product>> {
  try {
    return await fetchProducts(params);
  } catch {
    return { success: false, data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  }
}

/**
 * Get main product image URL
 */
export function getProductImage(product: Product): string | null {
  if (product.images && product.images.length > 0) {
    const mainImage = product.images.find(img => img.isMain) || product.images[0];
    return mainImage?.url ?? null;
  }
  return null;
}
