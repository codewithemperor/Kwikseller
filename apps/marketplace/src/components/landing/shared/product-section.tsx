"use client";

import Link from "next/link";
import React from "react";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { MarketplaceProductCard } from "./marketplace-product-card";
import type { MarketplaceProduct } from "@/data/marketplace-home";

export interface ProductSectionProps {
  /** Section title shown in the header bar */
  title: string;
  /** Optional subtitle/description shown under the title */
  description?: string;
  /** The product dataset for this section. The section renders ONLY when this is non-empty. */
  products: MarketplaceProduct[];
  /** Optional "View more" link destination */
  viewAllHref?: string;
  /** Optional lucide icon shown to the left of the title */
  icon?: LucideIcon;
  /** Quick-view callback passed through to each card */
  onQuickView?: (product: MarketplaceProduct) => void;
  /** Tailwind grid classes. Defaults to a responsive 2 / 4 / 5 column grid. */
  gridClassName?: string;
  /** Header accent color. "blue" matches the existing design; "orange" for emphasis sections. */
  accent?: "blue" | "orange";
  /** Optional badge node shown next to the title (e.g., a countdown timer for flash deals) */
  badge?: React.ReactNode;
  /** Optional children rendered after the product grid (e.g., a "Load more" sentinel div) */
  children?: React.ReactNode;
}

/**
 * Reusable product section component for the marketplace homepage.
 *
 * Every product shelf on the index page (Featured, Flash Deals, New Arrivals,
 * Trending, Vendor Stock, Digital Delivery, Browse All) reuses this component.
 * It receives only the title, description, dataset, and optional configuration
 * as props — no internal data fetching.
 *
 * Design contract:
 *   - Renders null when `products` is empty (the section silently disappears).
 *   - Uses `bg-background` (not `bg-white`) so dark mode works correctly.
 *   - Header bar matches the existing kwik-blue/kwik-orange design language.
 *   - No gradients, no hardcoded light-mode colors.
 */
export function ProductSection({
  title,
  description,
  products,
  viewAllHref,
  icon: Icon,
  onQuickView,
  gridClassName = "grid grid-cols-2 gap-x-4 gap-y-7 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6",
  accent = "blue",
  badge,
  children,
}: ProductSectionProps) {
  // Don't render the section if there are no products — keeps the page clean
  // and ensures each shelf only appears when it has real backend data.
  if (!products || products.length === 0) return null;

  const headerBg = accent === "orange" ? "bg-kwik-orange" : "bg-kwik-blue";

  return (
    <section>
      {/* Section header — full-width accent bar, matches existing design */}
      <div className={`-mx-4 flex items-center justify-between gap-3 ${headerBg} px-4 py-3 text-white md:mx-0`}>
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
              <Icon className="h-4 w-4" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white md:text-xl">{title}</h2>
              {badge}
            </div>
            {description && (
              <p className="mt-0.5 max-w-2xl text-xs leading-5 text-white/70 md:text-sm">{description}</p>
            )}
          </div>
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="inline-flex shrink-0 items-center gap-1 bg-kwik-orange px-3 py-2 text-xs font-semibold text-white transition hover:bg-kwik-orange-hover"
          >
            View more <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* Product grid — bg-background for dark mode compliance */}
      <div className="container-px bg-background py-4">
        <div className={gridClassName}>
          {products.map((product, index) => (
            <MarketplaceProductCard
              key={`${product.id}-${index}`}
              product={product}
              onQuickView={onQuickView}
            />
          ))}
        </div>
        {children}
      </div>
    </section>
  );
}
