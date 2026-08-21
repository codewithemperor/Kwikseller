"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  SearchAutoSuggest as SharedSearchAutoSuggest,
  type SearchAutoSuggestItem,
} from "@/components/ui/search-auto-suggest";
import { productsApi } from "@/services/api-client";
import { getSimilarSuggestions } from "@/lib/search-similarity";

import {
  FALLBACK_SEARCH_SUGGESTIONS as FALLBACK_SUGGESTIONS,
  SEARCH_HISTORY_KEY,
  TRENDING_SEARCH_CATEGORIES as TRENDING_CATEGORIES,
} from "@/constants/marketplace"

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
      historyKey={SEARCH_HISTORY_KEY}
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
