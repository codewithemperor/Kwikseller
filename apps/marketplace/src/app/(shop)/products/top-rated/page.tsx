"use client";

/**
 * /products/top-rated
 * -------------------
 * Curated collection of the highest-rated products from marketplace
 * vendors. Thin wrapper around the shared infinite ProductCollectionPage.
 */

import { Star } from "lucide-react";
import { useProductsInfinite } from "@/lib/api-hooks";
import { ProductCollectionPage } from "@/components/product/product-collection-page";

export default function TopRatedProductsPage() {
  const query = useProductsInfinite({
    sortBy: "rating",
    sortOrder: "desc",
    limit: 24,
  });

  return (
    <ProductCollectionPage
      title="Top Rated Products"
      description="Highest-rated products from our vendors"
      icon={Star}
      breadcrumbLabel="Top Rated"
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
