/**
 * Dummy-data search engine.
 *
 * Mirrors the production NestJS `products.service.search()` so the dev
 * experience matches production. Implements:
 *   - Query normalization (trim, collapse whitespace, strip leading/trailing punctuation)
 *   - Relevance ranking (exact name → phrase in name → all tokens in name →
 *     partial name → category → store → brand → description → sku → tags)
 *   - Server-side filters (category, brand, store, price range, rating, state)
 *   - Facets (categories, brands, stores, states, priceRange) computed from
 *     the filtered result set, excluding the active facet value so users can
 *     see other options.
 *   - Pagination (page/limit OR cursor-based)
 *
 * Used ONLY by the dummy-data gateway when NEXT_PUBLIC_USE_DUMMY_DATA=true.
 */

import type { DummyProduct } from "./catalog";

// ─── Types ────────────────────────────────────────────────────────────────

export interface SearchFilters {
  q?: string;
  search?: string;
  category?: string; // slug or id
  categoryId?: string;
  brandId?: string;
  storeId?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number; // minimum rating, e.g. 4 = "4 stars & above"
  state?: string; // state name (e.g. "Lagos")
  sort?: string; // relevance | price-low | price-high | rating | newest | popular
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

export interface SearchResult {
  data: DummyProduct[];
  meta: SearchMeta;
}

// ─── Query normalization ─────────────────────────────────────────────────

export function normalizeQuery(input: string | undefined | null): string {
  if (!input) return "";
  return input
    .trim()
    .replace(/[^\w\s-]/g, " ") // strip punctuation except hyphens
    .replace(/\s+/g, " ") // collapse whitespace
    .trim();
}

// ─── Tokenization (for relevance scoring) ────────────────────────────────

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "for", "with", "of", "to", "in", "on", "at", "by",
]);

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

// ─── State extraction from store location ────────────────────────────────
// Dummy stores have `location: "Lagos, Nigeria"` — extract the state name.

const STATE_CODE_MAP: Record<string, string> = {
  lagos: "LA",
  abuja: "FCT",
  rivers: "RV",
  oyo: "OY",
  kano: "KN",
  enugu: "EN",
  edo: "ED",
  delta: "DT",
};

export function extractState(location: string | undefined): { name: string; code: string } | null {
  if (!location) return null;
  // Take the first comma-separated segment as the state.
  const first = location.split(",")[0]?.trim();
  if (!first) return null;
  const name = first;
  const code = STATE_CODE_MAP[name.toLowerCase()] ?? name.slice(0, 2).toUpperCase();
  return { name, code };
}

// ─── Relevance scoring ───────────────────────────────────────────────────

interface ScoreContext {
  query: string;
  tokens: string[];
  exactQuery: string; // lowercased original query
}

function scoreProduct(product: DummyProduct, ctx: ScoreContext): number {
  if (!ctx.query) return 0;

  const name = product.name.toLowerCase();
  const nameTokens = tokenize(product.name);
  const shortDesc = (product.shortDescription ?? "").toLowerCase();
  const description = product.description.toLowerCase();
  const categoryName = product.category.name.toLowerCase();
  const categorySlug = product.category.slug.toLowerCase();
  const storeName = product.store.name.toLowerCase();
  const brandName = product.brand.name.toLowerCase();
  const sku = (product.sku ?? "").toLowerCase();
  const tagNames = product.tags.map((t) => t.tag?.name.toLowerCase() ?? "").filter(Boolean);

  let score = 0;

  // 1. Exact name match (case-insensitive)
  if (name === ctx.exactQuery) score += 1000;
  // 2. Exact phrase in name
  else if (name.includes(ctx.exactQuery)) score += 500;
  // 3. All query tokens in name
  else if (ctx.tokens.length > 0 && ctx.tokens.every((t) => nameTokens.includes(t))) {
    score += 200;
  }

  // 4. Partial name match — per matched token
  for (const token of ctx.tokens) {
    if (nameTokens.includes(token)) score += 50;
    else if (name.includes(token)) score += 30;
  }

  // 5. Category name/slug match
  for (const token of ctx.tokens) {
    if (categoryName.includes(token)) score += 30;
    if (categorySlug.includes(token)) score += 20;
  }

  // 6. Store name match
  for (const token of ctx.tokens) {
    if (storeName.includes(token)) score += 40;
  }

  // 7. Brand name match
  for (const token of ctx.tokens) {
    if (brandName.includes(token)) score += 30;
  }

  // 8. Short description match
  for (const token of ctx.tokens) {
    if (shortDesc.includes(token)) score += 20;
  }

  // 9. Description match
  for (const token of ctx.tokens) {
    if (description.includes(token)) score += 10;
  }

  // 10. SKU match
  if (sku && ctx.tokens.some((t) => sku.includes(t))) score += 25;

  // 11. Tag match
  for (const tag of tagNames) {
    for (const token of ctx.tokens) {
      if (tag.includes(token)) {
        score += 15;
        break;
      }
    }
  }

  return score;
}

// ─── Filter application ──────────────────────────────────────────────────

function applyFilters(list: DummyProduct[], filters: SearchFilters): DummyProduct[] {
  let out = list;

  if (filters.categoryId) {
    out = out.filter((p) => p.categoryId === filters.categoryId);
  } else if (filters.category) {
    out = out.filter(
      (p) => p.category.slug === filters.category || p.categoryId === filters.category,
    );
  }

  if (filters.brandId) {
    out = out.filter(
      (p) => p.brandId === filters.brandId || p.brand.slug === filters.brandId,
    );
  }

  if (filters.storeId) {
    out = out.filter(
      (p) => p.storeId === filters.storeId || p.store.slug === filters.storeId,
    );
  }

  if (typeof filters.minPrice === "number" && !Number.isNaN(filters.minPrice)) {
    out = out.filter((p) => p.price >= filters.minPrice!);
  }

  if (typeof filters.maxPrice === "number" && !Number.isNaN(filters.maxPrice)) {
    out = out.filter((p) => p.price <= filters.maxPrice!);
  }

  if (typeof filters.rating === "number" && !Number.isNaN(filters.rating)) {
    out = out.filter((p) => p.rating >= filters.rating!);
  }

  if (filters.state) {
    const wanted = filters.state.toLowerCase();
    out = out.filter((p) => {
      const st = extractState(p.store?.location);
      if (!st) return false;
      return (
        st.name.toLowerCase() === wanted ||
        st.code.toLowerCase() === wanted ||
        st.name.toLowerCase().includes(wanted)
      );
    });
  }

  return out;
}

// ─── Sorting ─────────────────────────────────────────────────────────────

function sortProducts(
  list: DummyProduct[],
  sort: string,
  ctx: ScoreContext | null,
): DummyProduct[] {
  const sorted = [...list];

  switch (sort) {
    case "price-low":
      sorted.sort((a, b) => a.price - b.price);
      break;
    case "price-high":
      sorted.sort((a, b) => b.price - a.price);
      break;
    case "rating":
      sorted.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
      break;
    case "newest":
      sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      break;
    case "popular":
      sorted.sort((a, b) => b.totalSales - a.totalSales || b.rating - a.rating);
      break;
    case "relevance":
    default:
      if (ctx) {
        sorted.sort((a, b) => {
          const sa = scoreProduct(a, ctx);
          const sb = scoreProduct(b, ctx);
          if (sb !== sa) return sb - sa;
          // Tie-breakers
          if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
          if (a.totalSales !== b.totalSales) return b.totalSales - a.totalSales;
          if (a.rating !== b.rating) return b.rating - a.rating;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      } else {
        // No query → featured first, then popular, then newest
        sorted.sort((a, b) => {
          if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
          if (a.totalSales !== b.totalSales) return b.totalSales - a.totalSales;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      }
      break;
  }

  return sorted;
}

// ─── Facets ──────────────────────────────────────────────────────────────

function buildFacets(
  list: DummyProduct[],
  exclude: { categoryId?: string; brandId?: string; storeId?: string; state?: string },
): {
  categories: SearchFacet[];
  brands: SearchFacet[];
  stores: SearchFacet[];
  states: StateFacet[];
  priceRange: { min: number; max: number };
} {
  // Categories
  const catMap = new Map<string, { id: string; slug: string; name: string; count: number }>();
  for (const p of list) {
    if (exclude.categoryId && p.categoryId === exclude.categoryId) continue;
    const key = p.categoryId;
    const existing = catMap.get(key);
    if (existing) existing.count += 1;
    else catMap.set(key, {
      id: p.category.id,
      slug: p.category.slug,
      name: p.category.name,
      count: 1,
    });
  }
  const categories = [...catMap.values()].sort((a, b) => b.count - a.count).slice(0, 10);

  // Brands
  const brandMap = new Map<string, { id: string; slug: string; name: string; count: number }>();
  for (const p of list) {
    if (exclude.brandId && (p.brandId === exclude.brandId || p.brand.slug === exclude.brandId)) continue;
    const key = p.brandId;
    const existing = brandMap.get(key);
    if (existing) existing.count += 1;
    else brandMap.set(key, {
      id: p.brand.id,
      slug: p.brand.slug,
      name: p.brand.name,
      count: 1,
    });
  }
  const brands = [...brandMap.values()].sort((a, b) => b.count - a.count).slice(0, 10);

  // Stores
  const storeMap = new Map<string, { id: string; slug: string; name: string; count: number }>();
  for (const p of list) {
    if (exclude.storeId && (p.storeId === exclude.storeId || p.store.slug === exclude.storeId)) continue;
    const key = p.storeId;
    const existing = storeMap.get(key);
    if (existing) existing.count += 1;
    else storeMap.set(key, {
      id: p.store.id,
      slug: p.store.slug,
      name: p.store.name,
      count: 1,
    });
  }
  const stores = [...storeMap.values()].sort((a, b) => b.count - a.count).slice(0, 10);

  // States (derived from store location)
  const stateMap = new Map<string, { id: string; name: string; code: string; count: number }>();
  for (const p of list) {
    const st = extractState(p.store?.location);
    if (!st) continue;
    if (exclude.state) {
      const wanted = exclude.state.toLowerCase();
      if (
        st.name.toLowerCase() === wanted ||
        st.code.toLowerCase() === wanted
      ) continue;
    }
    const existing = stateMap.get(st.name);
    if (existing) existing.count += 1;
    else stateMap.set(st.name, {
      id: st.code,
      name: st.name,
      code: st.code,
      count: 1,
    });
  }
  const states = [...stateMap.values()].sort((a, b) => b.count - a.count).slice(0, 10);

  // Price range (from the full filtered list, not excluding price filter)
  let min = Infinity;
  let max = -Infinity;
  for (const p of list) {
    if (p.price < min) min = p.price;
    if (p.price > max) max = p.price;
  }
  const priceRange = list.length > 0 ? { min, max } : { min: 0, max: 0 };

  return { categories, brands, stores, states, priceRange };
}

// ─── Main search function ────────────────────────────────────────────────

export function searchProducts(allProducts: DummyProduct[], filters: SearchFilters): SearchResult {
  const rawQuery = filters.q ?? filters.search ?? "";
  const query = normalizeQuery(rawQuery);
  const tokens = tokenize(query);
  const exactQuery = query.toLowerCase();

  const ctx: ScoreContext | null = query ? { query, tokens, exactQuery } : null;

  // 1. Apply filters (server-side, before ranking)
  const filtered = applyFilters(allProducts, filters);

  // 2. If there's a query, filter to products that actually match (basic
  //    contains across all searchable fields). Ranking then orders them.
  let matchSet = filtered;
  if (query) {
    const qLower = query.toLowerCase();
    matchSet = filtered.filter((p) => {
      const haystack = [
        p.name,
        p.shortDescription ?? "",
        p.description,
        p.sku ?? "",
        p.category.name,
        p.category.slug,
        p.store.name,
        p.brand.name,
        ...p.tags.map((t) => t.tag?.name ?? ""),
      ].join(" ").toLowerCase();
      return haystack.includes(qLower) || tokens.some((t) => haystack.includes(t));
    });
  }

  // 3. Sort (relevance ranking applies here when sort=relevance)
  const sort = filters.sort ?? "relevance";
  const sorted = sortProducts(matchSet, sort, ctx);

  // 4. Facets — computed from the filtered+matched set, excluding the
  //    active facet value so the user sees other options.
  const facets = buildFacets(matchSet, {
    categoryId: filters.categoryId ?? filters.category,
    brandId: filters.brandId,
    storeId: filters.storeId,
    state: filters.state,
  });

  // 5. Pagination
  const limit = Math.min(Math.max(Number(filters.limit ?? 20), 1), 50);
  const total = sorted.length;
  const pages = Math.max(1, Math.ceil(total / limit));

  let data: DummyProduct[];
  let nextCursor: string | null = null;
  let page: number;

  if (filters.cursor) {
    // Cursor-based: find index of cursor, take next `limit` items.
    const cursorIdx = sorted.findIndex((p) => p.id === filters.cursor);
    const start = cursorIdx >= 0 ? cursorIdx + 1 : 0;
    data = sorted.slice(start, start + limit);
    page = Math.floor(start / limit) + 1;
    if (start + limit < total) {
      nextCursor = data.length > 0 ? data[data.length - 1].id : null;
    } else {
      nextCursor = null;
    }
  } else {
    page = Math.max(1, Number(filters.page ?? 1));
    const start = (page - 1) * limit;
    data = sorted.slice(start, start + limit);
    if (start + limit < total) {
      nextCursor = data.length > 0 ? data[data.length - 1].id : null;
    }
  }

  return {
    data,
    meta: {
      query,
      total,
      page,
      limit,
      pages,
      categories: facets.categories,
      brands: facets.brands,
      stores: facets.stores,
      states: facets.states,
      priceRange: facets.priceRange,
      nextCursor,
    },
  };
}
