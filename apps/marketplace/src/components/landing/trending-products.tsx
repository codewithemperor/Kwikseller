"use client";

import React from "react";
import { ArrowRight, SlidersHorizontal } from "lucide-react";
import { Button } from "@heroui/react";
import {
  marketplaceTrendingProducts,
  type MarketplaceProduct,
} from "@/data/marketplace-home";
import { QuickViewModal } from "@/components/landing/quick-view-modal";
import { ProductFilterChips } from "@/components/landing/product-filter-chips";
import { MarketplaceProductCard } from "@/components/landing/shared/marketplace-product-card";

export function TrendingProducts() {
  const [activeFilter, setActiveFilter] = React.useState("all");
  const [quickViewProduct, setQuickViewProduct] =
    React.useState<MarketplaceProduct | null>(null);

  const filteredProducts =
    activeFilter === "all"
      ? marketplaceTrendingProducts
      : marketplaceTrendingProducts.filter(
          (product) => product.category === activeFilter,
        );

  return (
    <>
      <section className="bg-kwik-bg-page py-8 sm:py-10">
        <div className="container mx-auto px-0 md:px-4 ">
          <div className="rounded-[32px] border border-kwik-border bg-background p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex flex-col gap-4 border-b border-kwik-border pb-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-kwik-dark">
                  Trending products
                </h2>
                <p className="mt-1 text-sm text-kwik-gray-light">
                  Popular items shoppers are adding to cart right now.
                </p>
              </div>

              <div className="min-w-0 flex-1 lg:max-w-2xl">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-kwik-dark-medium">
                  <SlidersHorizontal className="h-4 w-4 text-kwik-gray-light" />
                  Filter products
                </div>
                <ProductFilterChips
                  activeFilter={activeFilter}
                  onFilterChange={setActiveFilter}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {filteredProducts.map((product, index) => (
                <MarketplaceProductCard
                  key={product.id}
                  product={product}
                  priority={index < 2}
                  onQuickView={setQuickViewProduct}
                />
              ))}
            </div>

            <div className="mt-6 flex justify-center">
              <Button
                variant="outline"
                className="rounded-xl border-kwik-border bg-background font-semibold text-kwik-dark"
              >
                View more products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </>
  );
}
