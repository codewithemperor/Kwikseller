"use client";

/**
 * /products/new-arrivals
 * ----------------------
 * Curated collection of the newest products added to the marketplace.
 * Thin wrapper around the shared ProductCollectionPage component.
 */

import { Sparkles } from "lucide-react";
import { useNewArrivals } from "@/lib/api-hooks";
import { ProductCollectionPage } from "@/components/product/product-collection-page";

export default function NewArrivalsPage() {
  // Fetch a generous batch up-front (the endpoint returns a flat array
  // capped by `limit` — no pagination meta). Sort + pagination happen
  // client-side in the shared component.
  const query = useNewArrivals(24);

  return (
    <ProductCollectionPage
      title="New Arrivals"
      description="The latest products added to the marketplace"
      icon={Sparkles}
      breadcrumbLabel="New Arrivals"
      queryResult={query}
    />
  );
}
