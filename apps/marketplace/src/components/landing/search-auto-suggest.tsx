"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  SearchAutoSuggest as SharedSearchAutoSuggest,
  type SearchAutoSuggestItem,
} from "@kwikseller/ui";
import { productsApi } from "@kwikseller/api-client";
import { getSimilarSuggestions } from "@/lib/search-similarity";

const TRENDING_CATEGORIES: SearchAutoSuggestItem[] = [
  { type: "category", text: "Fashion", subtext: "12K+ items" },
  { type: "category", text: "Electronics", subtext: "8K+ items" },
  { type: "category", text: "Phones", subtext: "10K+ items" },
  { type: "category", text: "Beauty", subtext: "6K+ items" },
  { type: "category", text: "Home & Garden", subtext: "9K+ items" },
  { type: "category", text: "Food & Drinks", subtext: "15K+ items" },
];

const FALLBACK_SUGGESTIONS = [
  { name: "Ankara dresses", category: "Fashion", meta: "Popular" },
  { name: "Wireless earbuds", category: "Electronics", meta: "Trending" },
  { name: "iPhone 15", category: "Phones", meta: "Popular" },
  { name: "Brazilian hair", category: "Beauty", meta: "Trending" },
  { name: "Samsung TV", category: "Electronics", meta: "Popular" },
  { name: "Jordans", category: "Fashion", meta: "Popular" },
  { name: "Power bank", category: "Electronics", meta: "Trending" },
  { name: "Home furniture", category: "Home & Garden", meta: "Popular" },
];

interface SearchAutoSuggestProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}

export function SearchAutoSuggest({ isOpen, onClose, anchorRef }: SearchAutoSuggestProps) {
  const router = useRouter();

  const loadSuggestions = React.useCallback(async (query: string): Promise<SearchAutoSuggestItem[]> => {
    try {
      const response = await productsApi.search({ q: query, limit: 6 });
      const data = response.data as any;
      const list = Array.isArray(data) ? data : data?.products || [];
      if (list.length) {
        return list.slice(0, 6).map((product: any) => ({
          id: String(product.id),
          type: "product",
          text: product.name,
          subtext: `${product.category?.name || product.categoryName || "Product"} · NGN ${Number(product.price ?? 0).toLocaleString()}`,
          href: `/products/${product.slug || product.id}`,
        }));
      }
    } catch {
      // Fall back to local similarity suggestions below.
    }

    return getSimilarSuggestions(query, FALLBACK_SUGGESTIONS, 6).map((item) => ({
      type: "product",
      text: item.name,
      subtext: `${item.category} · ${item.meta}`,
    }));
  }, []);

  return (
    <SharedSearchAutoSuggest
      isOpen={isOpen}
      onClose={onClose}
      anchorRef={anchorRef}
      placeholder="Search products, brands, categories..."
      historyKey="kwikseller-search-history"
      trendingItems={TRENDING_CATEGORIES}
      loadSuggestions={loadSuggestions}
      onSearch={(query) => router.push(`/search?q=${encodeURIComponent(query)}`)}
      onSelect={(item) => {
        if (item.href) {
          router.push(item.href);
          return;
        }
        router.push(`/search?q=${encodeURIComponent(item.text)}`);
      }}
    />
  );
}
