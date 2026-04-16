"use client";

import React from "react";
import { MarketplaceLayout } from "@/components/layout/marketplace-layout";
import { QuickViewModal } from "@/components/landing/quick-view-modal";
import {
  MarketplaceBrandsSection,
  MarketplaceCategorySection,
  MarketplaceFeaturedDealsSection,
  MarketplaceFeaturedProductsSection,
  MarketplaceHero,
  MarketplaceTopSellersSection,
} from "@/components/landing/home-sections";
import type { MarketplaceProduct } from "@/data/marketplace-home";

export default function MarketplacePage() {
  const [quickViewProduct, setQuickViewProduct] =
    React.useState<MarketplaceProduct | null>(null);

  return (
    <MarketplaceLayout>
      <MarketplaceHero />

      {/* Temporarily disabled as requested: escrow-protected to responsive-support card block. */}
      {/* <MarketplaceTrustBar /> */}

      <MarketplaceFeaturedProductsSection onQuickView={setQuickViewProduct} />
      <MarketplaceCategorySection />
      <MarketplaceFeaturedDealsSection onQuickView={setQuickViewProduct} />
      <MarketplaceTopSellersSection />
      <MarketplaceBrandsSection />

      {/* Temporarily hidden to keep the marketplace index tighter and more commerce-focused. */}
      {/* <MarketplaceNewArrivalsSection onQuickView={setQuickViewProduct} /> */}
      {/* <MarketplaceReviewsSection /> */}
      {/* <NewsletterSection /> */}
      {/* <MarketplaceSellerCta /> */}

      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </MarketplaceLayout>
  );
}
