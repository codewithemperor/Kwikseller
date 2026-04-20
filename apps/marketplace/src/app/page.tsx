"use client";

import React from "react";
import { QuickViewModal } from "@/components/landing/quick-view-modal";
import {
  MarketplaceBrandsSection,
  MarketplaceCategorySection,
  MarketplaceFeaturedDealsSection,
  MarketplaceFeaturedProductsSection,
  MarketplaceHero,
  MarketplaceTopSellersSection,
} from "@/components/landing/home-sections";
import {
  TrendingProductsSection,
  TopProductsSection,
  DealOfTheDaySection,
} from "@/components/landing/api-product-sections";
import type { MarketplaceProduct } from "@/data/marketplace-home";

export default function MarketplacePage() {
  const [quickViewProduct, setQuickViewProduct] =
    React.useState<MarketplaceProduct | null>(null);

  return (
    <>
      <MarketplaceHero />

      {/* API-powered sections: Trending, Top Rated, Deal of the Day */}
      <TrendingProductsSection />
      <DealOfTheDaySection />

      <MarketplaceCategorySection />

      <TopProductsSection />
      <MarketplaceFeaturedProductsSection onQuickView={setQuickViewProduct} />
      <MarketplaceFeaturedDealsSection onQuickView={setQuickViewProduct} />
      <MarketplaceTopSellersSection />
      <MarketplaceBrandsSection />

      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </>
  );
}
