"use client";

/**
 * /products/trending
 * ------------------
 * Curated collection of trending products (ranked by sales). Thin wrapper
 * around the shared ProductCollectionPage component — the infinite grid,
 * sort dropdown, quick-view modal, and loading / empty states all live
 * in the shared component.
 */

import { TrendingUp } from "lucide-react";
import { useProductsInfinite } from "@/lib/api-hooks";
import { ProductCollectionPage } from "@/components/product/product-collection-page";

export default function TrendingProductsPage() {
  const query = useProductsInfinite({
    sortBy: "totalSales",
    sortOrder: "desc",
    limit: 24,
  });

  return (
    <ProductCollectionPage
      title="Trending Products"
      description="Hot products right now, ranked by sales"
      icon={TrendingUp}
      breadcrumbLabel="Trending"
      queryResult={{
        data: query.products,
        isLoading: query.isLoading,
        isError: query.isError,
        isFetchingNextPage: query.isFetchingNextPage,
        hasNextPage: query.hasNextPage,
        fetchNextPage: query.fetchNextPage,
      }}
    />
  );
}
