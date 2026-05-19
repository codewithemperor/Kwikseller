import type { MarketplaceProduct } from "@/data/marketplace-home";

export interface MemberSignals {
  searchHistory?: string[];
  cartProductIds?: string[];
  wishlistProductIds?: string[];
  recentlyViewedIds?: string[];
}

function normalize(value?: string | null) {
  return (value ?? "").toLowerCase();
}

function hasHistoryMatch(product: MarketplaceProduct, searchHistory: string[]) {
  const haystack = `${product.name} ${product.category ?? ""} ${product.tag ?? ""}`.toLowerCase();
  return searchHistory.some((term) => {
    const cleaned = normalize(term).trim();
    return cleaned.length > 1 && haystack.includes(cleaned);
  });
}

export function rankProductsForMember(
  products: MarketplaceProduct[],
  signals: MemberSignals,
) {
  const cartIds = new Set(signals.cartProductIds ?? []);
  const wishlistIds = new Set(signals.wishlistProductIds ?? []);
  const recentlyViewedIds = new Set(signals.recentlyViewedIds ?? []);
  const searchHistory = signals.searchHistory ?? [];

  return [...products].sort((a, b) => {
    const score = (product: MarketplaceProduct) => {
      let value = 0;
      if (cartIds.has(product.id)) value += 8;
      if (wishlistIds.has(product.id)) value += 7;
      if (recentlyViewedIds.has(product.id)) value += 5;
      if (hasHistoryMatch(product, searchHistory)) value += 4;
      if (product.isNew) value += 2;
      value += Math.min(2, product.rating ?? 0);
      value += Math.min(1, (product.reviewCount ?? 0) / 100);
      return value;
    };

    return score(b) - score(a);
  });
}
