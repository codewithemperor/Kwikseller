"use client";

/**
 * /products/trending
 * ------------------
 * Curated collection of trending products (ranked by sales). Thin wrapper
 * around the shared ProductCollectionPage component — the layout, sort
 * dropdown, grid, quick-view modal, and loading / empty states all live
 * in the shared component.
 */

import { TrendingUp } from "lucide-react";
import { useTrending } from "@/lib/api-hooks";
import { ProductCollectionPage } from "@/components/product/product-collection-page";

export default function TrendingProductsPage() {
  // Fetch a generous batch up-front (the endpoint returns a flat array
  // capped by `limit` — no pagination meta). Sort + pagination happen
  // client-side in the shared component.
  const query = useTrending(24);

  return (
    <ProductCollectionPage
      title="Trending Products"
      description="Hot products right now, ranked by sales"
      icon={TrendingUp}
      breadcrumbLabel="Trending"
      queryResult={query}
    />
  );
}
