"use client";

import { create } from "zustand";
import { vendorCommerceApi } from "@/lib/api-client";
import type { Product } from "@/lib/types";
import { unwrapApiData } from "@/lib/vendor-format";

const PRODUCTS_CACHE_MS = 30_000;

type VendorProductsState = {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  lastFetchedAt: number;
  fetchProducts: (force?: boolean) => Promise<void>;
  refreshProducts: () => Promise<void>;
};

export const useVendorProductsStore = create<VendorProductsState>((set, get) => ({
  products: [],
  isLoading: false,
  error: null,
  lastFetchedAt: 0,

  fetchProducts: async (force = false) => {
    const state = get();
    const fresh = Date.now() - state.lastFetchedAt < PRODUCTS_CACHE_MS;
    if (!force && fresh && state.products.length) return;

    set({ isLoading: true, error: null });
    try {
      const response = await vendorCommerceApi.listProducts();
      const products = unwrapApiData<Product[]>(response.data);
      set({
        products: Array.isArray(products) ? products : [],
        isLoading: false,
        lastFetchedAt: Date.now(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load vendor products";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  refreshProducts: async () => {
    await get().fetchProducts(true);
  },
}));
