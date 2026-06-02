"use client";

import { create } from "zustand";
import { vendorCommerceApi } from "@kwikseller/api-client";
import type { PoolSourceType } from "@kwikseller/types";
import type { PoolCatalogItem } from "@/lib/pool";
import { matchesPoolRouteKey } from "@/lib/pool";
import { unwrapApiData } from "@/lib/vendor-format";

const POOL_PAGE_SIZE = 100;
const POOL_CACHE_MS = 30_000;

export type VendorPoolSourceFilter = "ALL" | PoolSourceType;

type FetchPoolArgs = {
  search?: string;
  categoryId?: string;
  sourceType?: VendorPoolSourceFilter;
  reset?: boolean;
  force?: boolean;
};

type VendorPoolState = {
  catalog: PoolCatalogItem[];
  categories: Array<{ id: string; name: string }>;
  search: string;
  categoryId: string;
  sourceType: VendorPoolSourceFilter;
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  lastFetchedAt: number;
  fetchPool: (args?: FetchPoolArgs) => Promise<void>;
  refreshPool: (args?: FetchPoolArgs) => Promise<void>;
  loadMore: () => Promise<void>;
  findByRouteKey: (key: string) => PoolCatalogItem | undefined;
  markSelected: (itemId: string, updates: Partial<PoolCatalogItem>) => void;
};

function poolKey(item: PoolCatalogItem) {
  const sourceType = item.sourceType ?? "ADMIN_POOL";
  const id = sourceType === "VENDOR_PRODUCT" ? item.sourceProductId ?? item.id : item.id;
  return `${sourceType}:${id}`;
}

function mergeCatalog(current: PoolCatalogItem[], next: PoolCatalogItem[]) {
  const map = new Map<string, PoolCatalogItem>();
  current.forEach((item) => map.set(poolKey(item), item));
  next.forEach((item) => map.set(poolKey(item), item));
  return Array.from(map.values());
}

function catalogCategories(items: PoolCatalogItem[]) {
  const categoryMap = new Map<string, string>();
  items.forEach((item) => {
    const id = item.categoryId || item.category || "";
    if (id) categoryMap.set(id, item.category || "Uncategorized");
  });
  return Array.from(categoryMap.entries()).map(([id, name]) => ({ id, name }));
}

function matchesSourceFilter(item: PoolCatalogItem, sourceType: VendorPoolSourceFilter) {
  return sourceType === "ALL" || item.sourceType === sourceType;
}

function apiMessage(error: unknown) {
  return error instanceof Error ? error.message : "Pool catalog is not available yet";
}

export const useVendorPoolStore = create<VendorPoolState>((set, get) => ({
  catalog: [],
  categories: [],
  search: "",
  categoryId: "ALL",
  sourceType: "ALL",
  page: 0,
  hasMore: true,
  isLoading: false,
  isLoadingMore: false,
  error: null,
  lastFetchedAt: 0,

  fetchPool: async (args = {}) => {
    const state = get();
    const nextSearch = args.search ?? state.search;
    const nextCategory = args.categoryId ?? state.categoryId;
    const nextSource = args.sourceType ?? state.sourceType;
    const reset = Boolean(args.reset);
    const sameQuery =
      nextSearch === state.search &&
      nextCategory === state.categoryId &&
      nextSource === state.sourceType;
    const fresh = Date.now() - state.lastFetchedAt < POOL_CACHE_MS;

    if (!args.force && sameQuery && fresh && state.catalog.length && !reset) return;

    const nextPage = reset || !sameQuery ? 1 : Math.max(state.page, 1);
    set({
      isLoading: true,
      error: null,
      search: nextSearch,
      categoryId: nextCategory,
      sourceType: nextSource,
      page: reset || !sameQuery ? 0 : state.page,
    });

    try {
      const response = await vendorCommerceApi.listPoolCatalog({
        search: nextSearch.trim() || undefined,
        categoryId: nextCategory === "ALL" ? undefined : nextCategory,
        page: nextPage,
        limit: POOL_PAGE_SIZE,
      });
      const items = unwrapApiData<PoolCatalogItem[]>(response.data);
      const fetched = (Array.isArray(items) ? items : []).slice(0, POOL_PAGE_SIZE);
      const filtered = fetched.filter((item) => matchesSourceFilter(item, nextSource));
      const catalog = reset || !sameQuery ? filtered : mergeCatalog(state.catalog, filtered);
      set({
        catalog,
        categories: catalogCategories(catalog),
        page: nextPage,
        hasMore: fetched.length >= POOL_PAGE_SIZE,
        isLoading: false,
        lastFetchedAt: Date.now(),
      });
    } catch (error) {
      set({ catalog: reset ? [] : state.catalog, error: apiMessage(error), isLoading: false });
      throw error;
    }
  },

  refreshPool: async (args = {}) => {
    await get().fetchPool({ ...args, reset: true, force: true });
  },

  loadMore: async () => {
    const state = get();
    if (state.isLoadingMore || !state.hasMore) return;
    set({ isLoadingMore: true, error: null });
    try {
      const nextPage = state.page + 1;
      const response = await vendorCommerceApi.listPoolCatalog({
        search: state.search.trim() || undefined,
        categoryId: state.categoryId === "ALL" ? undefined : state.categoryId,
        page: nextPage,
        limit: POOL_PAGE_SIZE,
      });
      const items = unwrapApiData<PoolCatalogItem[]>(response.data);
      const fetched = (Array.isArray(items) ? items : []).slice(0, POOL_PAGE_SIZE);
      const filtered = fetched.filter((item) => matchesSourceFilter(item, state.sourceType));
      const catalog = mergeCatalog(state.catalog, filtered);
      set({
        catalog,
        categories: catalogCategories(catalog),
        page: nextPage,
        hasMore: fetched.length >= POOL_PAGE_SIZE && catalog.length > state.catalog.length,
        isLoadingMore: false,
        lastFetchedAt: Date.now(),
      });
    } catch (error) {
      set({ error: apiMessage(error), isLoadingMore: false });
      throw error;
    }
  },

  findByRouteKey: (key: string) => get().catalog.find((item) => matchesPoolRouteKey(item, key)),

  markSelected: (itemId: string, updates: Partial<PoolCatalogItem>) => {
    const catalog = get().catalog.map((item) => (item.id === itemId ? { ...item, ...updates } : item));
    set({ catalog });
  },
}));
