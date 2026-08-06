"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useProduct, useProducts, useReviews, toMarketplaceProduct } from "@/lib/api-hooks";
import { ProductDetailPage } from "@/components/product/product-detail-page";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLoading } from "@/components/ui/loading-state";
import type { MarketplaceProduct, MarketplaceReview } from "@/data/marketplace-home";
import type { Product } from "@/lib/api";

/**
 * Augment the shared `toMarketplaceProduct` output with the extra fields the
 * detail page component needs (features, specifications, reviews). These are
 * NOT part of the API `Product` shape today, so we derive sensible defaults
 * from the raw product when they're missing.
 */
function toDetailMarketplaceProduct(p: Product): MarketplaceProduct {
  const base = toMarketplaceProduct(p);
  const features =
    (p as Product & { features?: string[] }).features ??
    [
      "Premium quality materials",
      "Verified vendor",
      "KwisCrow escrow protected",
      "Fast nationwide delivery",
    ];
  const specifications = [
    { label: "Category", value: p.category?.name ?? "" },
    { label: "Vendor", value: p.store?.name ?? "Kwikseller vendor" },
    { label: "Brand", value: p.brand?.name ?? "—" },
    { label: "SKU", value: p.sku ?? "—" },
    { label: "Stock", value: p.stock > 0 ? `${p.stock} available` : "Out of stock" },
  ];
  const reviews =
    (p as Product & { reviews?: MarketplaceProduct["reviews"] }).reviews ?? [];
  return {
    ...base,
    features,
    specifications,
    reviews,
    dimensions: (p as Product & { dimensions?: string }).dimensions ?? "",
  };
}

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const id = String(params.id);
  const isInvalidId =
    !id ||
    id === "undefined" ||
    id === "[object]" ||
    id.includes(" ") ||
    id.includes("Object");

  const productQuery = useProduct(isInvalidId ? undefined : id);
  const rawProduct = productQuery.data;

  // Fetch reviews for this product (keyed on productId so it auto-refetches
  // when the user navigates to a different product). The dummy / real API
  // exposes `GET /reviews/:productId` returning objects with the exact fields
  // `MarketplaceReview` expects (`id`, `rating`, `text`, `name`, `location`).
  // The hook is called unconditionally (Hooks rule) and the query is enabled
  // only when we have a real productId.
  const reviewsQuery = useReviews(rawProduct?.id);
  const productReviews = useMemo<MarketplaceReview[]>(
    () =>
      (reviewsQuery.data ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        location: r.location,
        rating: r.rating,
        text: r.text,
        createdAt: r.createdAt,
        title: r.title,
        verified: r.verified,
        helpful: r.helpful,
        images: r.images,
        vendorReply: r.vendorReply,
      })),
    [reviewsQuery.data],
  );

  // Fetch related products via the shared hook using the category SLUG so
  // the dummy API's `categoryId` filter matches.
  const categorySlug = rawProduct?.category?.slug;
  const relatedQuery = useProducts({
    categoryId: categorySlug,
    limit: 6,
  });
  // Memoize so the array reference is stable across renders (the
  // ProductDetailPage useEffect depends on `relatedProductsProp`).
  const relatedProducts = useMemo<MarketplaceProduct[]>(
    () =>
      (relatedQuery.data?.products ?? [])
        .filter((p) => p.id !== id)
        .slice(0, 5),
    [relatedQuery.data, id],
  );

  if (isInvalidId || (!productQuery.isLoading && !rawProduct)) {
    return (
      <div className="min-h-screen bg-background px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <EmptyState
            title="Product not found"
            description="The product you're looking for doesn't exist or has been removed."
            className="min-h-[42vh]"
          />
          <div className="mt-6 text-center">
            <Link
              href="/products"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-kwik-orange px-5 text-sm font-semibold text-white hover:bg-kwik-orange-hover"
            >
              Back to all products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (productQuery.isLoading || !rawProduct) {
    return <PageLoading label="Loading product..." />;
  }

  const product = toDetailMarketplaceProduct(rawProduct);

  return (
    <ProductDetailPage
      product={{ ...product, reviews: productReviews }}
      relatedProducts={relatedProducts}
    />
  );
}

