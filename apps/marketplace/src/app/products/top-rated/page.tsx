"use client";

/**
 * /products/top-rated
 * -------------------
 * Curated collection of the highest-rated products from marketplace
 * vendors. Thin wrapper around the shared ProductCollectionPage component.
 */

import { Star } from "lucide-react";
import { useTopProducts } from "@/lib/api-hooks";
import { ProductCollectionPage } from "@/components/product/product-collection-page";

export default function TopRatedProductsPage() {
  // Fetch a generous batch up-front (the endpoint returns a flat array
  // capped by `limit` — no pagination meta). Sort + pagination happen
  // client-side in the shared component.
  const query = useTopProducts(24);

  return (
    <ProductCollectionPage
      title="Top Rated Products"
      description="Highest-rated products from our vendors"
      icon={Star}
      breadcrumbLabel="Top Rated"
      queryResult={query}
    />
  );
}
