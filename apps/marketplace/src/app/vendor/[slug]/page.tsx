"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, BadgeCheck, PackageCheck, ShieldCheck, Store, Truck, Users } from "lucide-react";
import { marketplaceStoresApi } from "@kwikseller/api-client";
import type { Product, Store as StoreType, StorefrontDesignConfig } from "@kwikseller/types";
import { MarketplaceProductCard } from "@/components/landing/shared/marketplace-product-card";
import type { MarketplaceProduct } from "@/data/marketplace-home";

function unwrap<T>(value: any): T {
  return (value?.data?.data ?? value?.data ?? value) as T;
}

function productImage(product: Product) {
  return product.images?.find((image) => image.isMain)?.url ?? product.images?.[0]?.url ?? "";
}

function toMarketplaceProduct(product: Product): MarketplaceProduct {
  const scoredProduct = product as Product & { rating?: number; reviewCount?: number };
  return {
    id: product.id,
    name: product.name,
    price: Number(product.price ?? 0),
    comparePrice: product.comparePrice,
    image: productImage(product),
    rating: Number(scoredProduct.rating ?? 0),
    reviewCount: Number(scoredProduct.reviewCount ?? 0),
    store: product.store?.name ?? "Vendor store",
    storeId: product.storeId,
    storeSlug: product.store?.slug,
    category: product.category?.name ?? "Marketplace",
    productType: product.productType,
    productSource: product.productSource,
    requiresShipping: product.requiresShipping,
    description: product.description,
    stock: product.inventoryItems?.reduce((sum, item) => sum + Math.max(0, Number(item.available ?? 0)), 0),
  };
}

function themeStyle(design?: StorefrontDesignConfig) {
  return {
    "--store-primary": design?.primaryColor ?? "#071A2F",
    "--store-accent": design?.accentColor ?? "#F97316",
  } as React.CSSProperties;
}

export default function VendorPublicStorePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [store, setStore] = React.useState<StoreType | null>(null);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!slug) return;
    let active = true;
    setIsLoading(true);
    Promise.all([marketplaceStoresApi.getBySlug(slug), marketplaceStoresApi.getProducts(slug)])
      .then(([storeResponse, productsResponse]) => {
        if (!active) return;
        setStore(unwrap<StoreType>(storeResponse));
        setProducts(unwrap<Product[]>(productsResponse));
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message ?? "This store could not be loaded");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-white px-4 py-10 text-kwik-dark">
        <div className="mx-auto max-w-7xl animate-pulse space-y-8">
          <div className="h-72 bg-neutral-100" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="aspect-[3/4] bg-neutral-100" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error || !store) {
    return (
      <main className="min-h-screen bg-white px-4 py-16 text-kwik-dark">
        <section className="mx-auto max-w-2xl border border-neutral-200 p-8 text-center">
          <Store className="mx-auto h-10 w-10 text-kwik-muted" />
          <h1 className="mt-4 font-heading text-2xl font-semibold">Store not found</h1>
          <p className="mt-3 text-sm leading-6 text-kwik-muted">
            This vendor store is unavailable or has not been published yet.
          </p>
          <Link href="/vendors" className="mt-6 inline-flex items-center gap-2 bg-kwik-dark px-4 py-2 text-sm font-semibold text-white">
            Browse vendors <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>
    );
  }

  const design = store.storefrontDesign;
  const sections = design?.sections ?? ["hero", "products", "pool", "policies"];
  const marketplaceProducts = products.map(toMarketplaceProduct);
  const poolProducts = marketplaceProducts.filter((product) => product.productSource === "POOL_RESALE");

  return (
    <main className="min-h-screen bg-white text-kwik-dark" style={themeStyle(design)}>
      {sections.includes("hero") && (
        <section className="border-b border-neutral-200">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1.25fr_0.75fr] lg:px-6">
            <div className="relative min-h-[300px] overflow-hidden bg-[var(--store-primary)] text-white">
              {store.bannerUrl ? (
                <img src={store.bannerUrl} alt={store.name} className="absolute inset-0 h-full w-full object-cover opacity-80" />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/25 to-transparent" />
              <div className="relative flex min-h-[300px] max-w-2xl flex-col justify-end p-6 sm:p-8">
                <div className="mb-5 flex items-center gap-3">
                  {store.logoUrl ? (
                    <img src={store.logoUrl} alt="" className="h-14 w-14 bg-white object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center bg-white text-[var(--store-primary)]">
                      <Store className="h-7 w-7" />
                    </div>
                  )}
                  <div>
                    <h1 className="font-heading text-3xl font-semibold sm:text-4xl">
                      {design?.heroTitle || store.name}
                    </h1>
                    <p className="mt-1 text-sm text-white/80">{store.category || "Kwikseller vendor store"}</p>
                  </div>
                </div>
                <p className="max-w-xl text-sm leading-6 text-white/85">
                  {design?.heroSubtitle || store.description || "Shop verified vendor stock, digital products, and Pool resale offers from this store."}
                </p>
              </div>
            </div>

            <aside className="grid content-between gap-4 border border-neutral-200 p-5">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Verified store", icon: BadgeCheck },
                  { label: "Manual dispatch", icon: Truck },
                  { label: "Pool resale ready", icon: Users },
                  { label: "Buyer protected", icon: ShieldCheck },
                ].map((item) => (
                  <div key={item.label} className="border border-neutral-200 p-4">
                    <item.icon className="h-5 w-5 text-[var(--store-accent)]" />
                    <p className="mt-3 text-xs font-semibold text-kwik-dark">{item.label}</p>
                  </div>
                ))}
              </div>
              <Link href="#products" className="inline-flex h-11 items-center justify-center gap-2 bg-[var(--store-primary)] px-4 text-sm font-semibold text-white">
                Shop this store <ArrowRight className="h-4 w-4" />
              </Link>
            </aside>
          </div>
        </section>
      )}

      {sections.includes("products") && (
        <section id="products" className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-heading text-2xl font-semibold">Vendor stock</h2>
              <p className="mt-1 text-sm text-kwik-muted">Products fulfilled by {store.name}.</p>
            </div>
            <span className="text-sm font-semibold text-[var(--store-primary)]">{marketplaceProducts.length} items</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {marketplaceProducts.map((product) => (
              <MarketplaceProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {sections.includes("pool") && poolProducts.length > 0 && (
        <section className="border-y border-neutral-200 bg-[var(--store-primary)] text-white">
          <div className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="font-heading text-2xl font-semibold">Pool resale shelf</h2>
                <p className="mt-1 text-sm text-white/70">Admin Pool Catalog products resold by this vendor.</p>
              </div>
              <Users className="h-8 w-8 text-[var(--store-accent)]" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {poolProducts.map((product) => (
                <MarketplaceProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {sections.includes("policies") && (
        <section className="mx-auto grid max-w-7xl gap-4 px-4 py-10 md:grid-cols-3 lg:px-6">
          {[
            ["Fulfillment", "Physical orders use Kwikseller manual dispatch while Rider remains paused."],
            ["Digital delivery", "Digital products are delivered from vendor-managed digital assets after payment."],
            ["Inventory", "Checkout validates live inventory and Pool availability before payment."],
          ].map(([title, text]) => (
            <div key={title} className="border border-neutral-200 p-5">
              <PackageCheck className="h-5 w-5 text-[var(--store-accent)]" />
              <h3 className="mt-4 font-heading text-base font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-kwik-muted">{text}</p>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
