"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  useProduct,
  useProducts,
  toMarketplaceProduct,
  useTopProducts,
} from "@/lib/api-hooks";
import { ProductDetailPage } from "@/components/product/product-detail-page";
import type { MarketplaceProduct } from "@/data/marketplace-home";
import type { Product } from "@/lib/api";

/**
 * Derive structured specifications from the real product data.
 * No dummy data — only fields that actually exist on the product.
 */
function toDetailMarketplaceProduct(p: Product): MarketplaceProduct {
  const base = toMarketplaceProduct(p);
  const specifications: Array<{ label: string; value: string }> = [];
  if (p.category?.name) specifications.push({ label: "Category", value: p.category.name });
  if (p.store?.name) specifications.push({ label: "Vendor", value: p.store.name });
  if (p.brand?.name) specifications.push({ label: "Brand", value: p.brand.name });
  if (p.sku) specifications.push({ label: "SKU", value: p.sku });
  if (p.stock !== undefined) {
    specifications.push({
      label: "Availability",
      value: p.stock > 0 ? `${p.stock} in stock` : "Out of stock",
    });
  }
  return {
    ...base,
    specifications,
  };
}

/** Product page skeleton — spec #22 (proper loading state, not just a spinner). */
function ProductSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-4 pt-6">
      <div className="container mx-auto space-y-6 px-4">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-16 animate-pulse rounded bg-kwik-bg-surface dark:bg-white/5" />
          <div className="h-4 w-4 animate-pulse rounded bg-kwik-bg-surface dark:bg-white/5" />
          <div className="h-4 w-24 animate-pulse rounded bg-kwik-bg-surface dark:bg-white/5" />
          <div className="h-4 w-4 animate-pulse rounded bg-kwik-bg-surface dark:bg-white/5" />
          <div className="h-4 w-32 animate-pulse rounded bg-kwik-bg-surface dark:bg-white/5" />
        </div>

        {/* Two-column skeleton */}
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Gallery skeleton */}
          <div className="space-y-3">
            <div className="aspect-[1.05/1] animate-pulse rounded-lg bg-kwik-bg-surface dark:bg-white/5" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 w-16 animate-pulse rounded-lg bg-kwik-bg-surface dark:bg-white/5" />
              ))}
            </div>
          </div>

          {/* Info skeleton */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="h-3 w-20 animate-pulse rounded bg-kwik-bg-surface dark:bg-white/5" />
              <div className="h-7 w-3/4 animate-pulse rounded bg-kwik-bg-surface dark:bg-white/5" />
              <div className="h-4 w-32 animate-pulse rounded bg-kwik-bg-surface dark:bg-white/5" />
            </div>
            <div className="rounded-xl border border-border p-5 dark:border-white/10">
              <div className="h-8 w-40 animate-pulse rounded bg-kwik-bg-surface dark:bg-white/5" />
              <div className="mt-4 h-10 w-full animate-pulse rounded bg-kwik-bg-surface dark:bg-white/5" />
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="h-12 animate-pulse rounded-xl bg-kwik-bg-surface dark:bg-white/5" />
                <div className="h-12 animate-pulse rounded-xl bg-kwik-bg-surface dark:bg-white/5" />
              </div>
            </div>
            <div className="h-32 animate-pulse rounded-xl bg-kwik-bg-surface dark:bg-white/5" />
          </div>
        </div>
      </div>
    </div>
  );
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

  // Reviews are fetched inside ProductDetailPage via useReviews(productId),
  // so the route page no longer needs to pass them separately.

  // Related products (by category)
  const categorySlug = rawProduct?.category?.slug;
  const relatedQuery = useProducts({
    categoryId: categorySlug,
    limit: 6,
  });
  const relatedProducts = useMemo<MarketplaceProduct[]>(
    () =>
      (relatedQuery.data?.products ?? [])
        .filter((p) => p.id !== id)
        .slice(0, 5),
    [relatedQuery.data, id],
  );

  // More From This Vendor (same store)
  const storeId = rawProduct?.storeId;
  const vendorQuery = useProducts({
    storeId,
    limit: 6,
  });
  const vendorProducts = useMemo<MarketplaceProduct[]>(
    () =>
      (vendorQuery.data?.products ?? [])
        .filter((p) => p.id !== id)
        .slice(0, 5),
    [vendorQuery.data, id],
  );

  // You May Also Like (top rated)
  const recommendedQuery = useTopProducts(6);
  const recommendedProducts = useMemo<MarketplaceProduct[]>(
    () =>
      (recommendedQuery.data ?? [])
        .filter((p) => p.id !== id)
        .slice(0, 5),
    [recommendedQuery.data, id],
  );

  // ── Not found / invalid ──
  if (isInvalidId || (!productQuery.isLoading && !rawProduct)) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-background px-4 py-10 text-center">
        <div className="max-w-md">
          <h1 className="text-2xl font-bold text-kwik-dark dark:text-white">Product not found</h1>
          <p className="mt-2 text-sm text-kwik-muted dark:text-white/55">
            The product you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-kwik-orange px-5 text-sm font-semibold text-white hover:bg-kwik-orange-hover"
          >
            Back to all products
          </Link>
        </div>
      </div>
    );
  }

  // ── Loading ──
  if (productQuery.isLoading || !rawProduct) {
    return <ProductSkeleton />;
  }

  const product = toDetailMarketplaceProduct(rawProduct);

  return (
    <ProductDetailPage
      product={product}
      relatedProducts={relatedProducts}
      vendorProducts={vendorProducts}
      recommendedProducts={recommendedProducts}
    />
  );
}
