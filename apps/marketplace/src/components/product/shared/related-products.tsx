"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Store, Heart } from "lucide-react";
import { MarketplaceProductCard } from "@/components/landing/shared/marketplace-product-card";
import { cn } from "@/lib/utils";
import type { MarketplaceProduct } from "@/data/marketplace-home";

interface RelatedProductsProps {
  title: string;
  description?: string;
  products: MarketplaceProduct[];
  isLoading?: boolean;
  /** Icon variant for the header. */
  variant?: "related" | "vendor" | "recommended";
  className?: string;
  onQuickView?: (p: MarketplaceProduct) => void;
}

const variantConfig = {
  related: { icon: Sparkles, label: "Related Products" },
  vendor: { icon: Store, label: "More From This Vendor" },
  recommended: { icon: Heart, label: "You May Also Like" },
};

/**
 * Reusable product discovery section.
 * Uses the same MarketplaceProductCard component used throughout the Marketplace.
 * Shows a loading skeleton when isLoading, and an empty state when no products.
 */
export function RelatedProducts({
  title,
  description,
  products,
  isLoading = false,
  variant = "related",
  className,
  onQuickView,
}: RelatedProductsProps) {
  const { icon: Icon } = variantConfig[variant];

  return (
    <section className={cn("border border-border bg-white p-5 dark:border-white/10 dark:bg-white/5 sm:p-6", className)}>
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-kwik-orange/10">
          <Icon className="h-4 w-4 text-kwik-orange" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-kwik-dark dark:text-white sm:text-xl">{title}</h2>
          {description && (
            <p className="text-xs text-kwik-muted dark:text-white/55">{description}</p>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 2xl:grid-cols-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[4/5] rounded-lg bg-kwik-bg-surface dark:bg-white/5" />
              <div className="mt-3 h-3 w-3/4 rounded bg-kwik-bg-surface dark:bg-white/5" />
              <div className="mt-2 h-3 w-1/2 rounded bg-kwik-bg-surface dark:bg-white/5" />
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 2xl:grid-cols-5">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
            >
              <MarketplaceProductCard product={product} onQuickView={onQuickView} />
            </motion.div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
