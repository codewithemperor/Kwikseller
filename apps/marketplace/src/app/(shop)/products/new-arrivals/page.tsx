"use client";

/**
 * /products/new-arrivals
 * ----------------------
 * Curated collection of the newest products added to the marketplace.
 * Thin wrapper around the shared infinite ProductCollectionPage.
 */

import { Sparkles } from "lucide-react";
import { useProductsInfinite } from "@/lib/api-hooks";
import { ProductCollectionPage } from "@/components/product/product-collection-page";

export default function NewArrivalsPage() {
  const query = useProductsInfinite({
    sortBy: "createdAt",
    sortOrder: "desc",
    limit: 24,
  });

  return (
    <ProductCollectionPage
      title="New Arrivals"
      description="The latest products added to the marketplace"
      icon={Sparkles}
      breadcrumbLabel="New Arrivals"
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
