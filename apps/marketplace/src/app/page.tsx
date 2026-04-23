"use client";

import React from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { QuickViewModal } from "@/components/landing/quick-view-modal";
import {
  MarketplaceBrandsSection,
  MarketplaceCategorySection,
  MarketplaceFeaturedDealsSection,
  MarketplaceFeaturedProductsSection,
  MarketplaceHero,
  MarketplaceTopSellersSection,
  MarketplaceTrustBar,
  MarketplaceSellerCta,
} from "@/components/landing/home-sections";
import {
  TrendingProductsSection,
  TopProductsSection,
  DealOfTheDaySection,
} from "@/components/landing/api-product-sections";
import type { MarketplaceProduct } from "@/data/marketplace-home";

const RecentlyViewedSection = dynamic(
  () =>
    import(
      "@/components/landing/recently-viewed-section"
    ).then((mod) => mod.RecentlyViewedSection),
  { ssr: false },
);

/* ─── Scroll-triggered fade-in wrappers for homepage sections ─── */

// Shared easing curve
const REVEAL_EASE: [number, number, number, number] = [0.25, 0.4, 0, 1];
const REVEAL_DURATION = 0.6;
const REVEAL_VIEWPORT = { once: true, margin: "-60px" } as const;

// Fade in from bottom (default)
function SectionReveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={REVEAL_VIEWPORT}
      transition={{ duration: REVEAL_DURATION, delay, ease: REVEAL_EASE }}
    >
      {children}
    </motion.div>
  );
}

// Fade in from left
function SectionRevealFromLeft({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -44 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={REVEAL_VIEWPORT}
      transition={{ duration: REVEAL_DURATION, delay, ease: REVEAL_EASE }}
    >
      {children}
    </motion.div>
  );
}

// Fade in from right
function SectionRevealFromRight({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 44 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={REVEAL_VIEWPORT}
      transition={{ duration: REVEAL_DURATION, delay, ease: REVEAL_EASE }}
    >
      {children}
    </motion.div>
  );
}

export default function MarketplacePage() {
  const [quickViewProduct, setQuickViewProduct] =
    React.useState<MarketplaceProduct | null>(null);

  return (
    <div>
      {/* Hero animates immediately */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <MarketplaceHero />
      </motion.div>

      {/* Trust bar animates after hero */}
      <SectionReveal delay={0}>
        <MarketplaceTrustBar />
      </SectionReveal>

      {/* API-powered sections with directional scroll-triggered animations */}
      {/* Trending: fade in from bottom */}
      <SectionReveal delay={0}>
        <TrendingProductsSection />
      </SectionReveal>

      {/* Deal of the Day: fade in from bottom */}
      <SectionReveal delay={0.05}>
        <DealOfTheDaySection />
      </SectionReveal>

      {/* Categories: fade in from right */}
      <SectionRevealFromRight delay={0.1}>
        <MarketplaceCategorySection />
      </SectionRevealFromRight>

      {/* Top Products: fade in from bottom */}
      <SectionReveal delay={0.05}>
        <TopProductsSection />
      </SectionReveal>

      {/* Featured Products: fade in from bottom */}
      <SectionReveal delay={0.1}>
        <MarketplaceFeaturedProductsSection onQuickView={setQuickViewProduct} />
      </SectionReveal>

      {/* Featured Deals: fade in from left */}
      <SectionRevealFromLeft delay={0.05}>
        <MarketplaceFeaturedDealsSection onQuickView={setQuickViewProduct} />
      </SectionRevealFromLeft>

      <SectionReveal delay={0.1}>
        <RecentlyViewedSection />
      </SectionReveal>

      <SectionReveal delay={0.05}>
        <MarketplaceTopSellersSection />
      </SectionReveal>

      <SectionReveal delay={0.1}>
        <MarketplaceBrandsSection />
      </SectionReveal>

      {/* Seller CTA with scroll-triggered animation */}
      <SectionReveal delay={0.05}>
        <MarketplaceSellerCta />
      </SectionReveal>

      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}
