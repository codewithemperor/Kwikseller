"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BadgeCheck, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import {
  StorefrontActionLink,
  StorefrontLoading,
  StorefrontSectionTitle,
  VendorEmptyProducts,
  VendorProductCard,
  VendorStorefrontShell,
  normalizeDesign,
  type PublicStoreView,
} from "@/components/vendor/vendor-storefront";
import { StoreInfoCard, type StoreEnrichment } from "@/components/vendor/store-info-card";
import { useStore, useStoreProducts } from "@/lib/api-hooks";
import { AppImage } from "@/components/ui/app-image";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductGridSkeleton } from "@/components/ui/loading-state";

/**
 * Adapt the raw store object returned by `useStore` (the dummy API shape —
 * `{ id, name, slug, description, logoUrl, bannerUrl, location, ... }`) to the
 * `PublicStoreView` shape the storefront shell expects. When the real backend
 * returns a richer Store shape (with `storefrontDesign`, `category`, etc.),
 * those fields are preserved.
 */
function toPublicStoreView(raw: unknown): PublicStoreView | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Record<string, unknown>;
  return {
    id: String(s.id ?? s.slug ?? ""),
    name: String(s.name ?? s.storeName ?? "Vendor Store"),
    slug: String(s.slug ?? s.id ?? ""),
    description: (s.description ?? s.tagline ?? null) as string | null,
    category: (s.category ?? null) as string | null,
    logoUrl: (s.logoUrl ?? s.logo ?? null) as string | null,
    bannerUrl: (s.bannerUrl ?? null) as string | null,
    storefrontDesign:
      (s.storefrontDesign as PublicStoreView["storefrontDesign"]) ?? null,
  };
}

/**
 * Pull the cycle-6 enrichment fields (storeHours, responseTime, returnPolicy,
 * socialLinks, badges, contact) off the raw API response so the
 * `StoreInfoCard` can render them. Falls back to sensible defaults when the
 * real backend hasn't shipped these fields yet.
 */
function toStoreEnrichment(raw: unknown, fallback: PublicStoreView): StoreEnrichment {
  if (!raw || typeof raw !== "object") {
    return { id: fallback.id, name: fallback.name, slug: fallback.slug };
  }
  const s = raw as Record<string, unknown>;
  return {
    id: fallback.id,
    name: fallback.name,
    slug: fallback.slug,
    location: (s.location as string) ?? undefined,
    createdAt: (s.createdAt as string) ?? undefined,
    rating: typeof s.rating === "number" ? s.rating : undefined,
    reviewCount: typeof s.reviewCount === "number" ? s.reviewCount : undefined,
    productCount: typeof s.productCount === "number" ? s.productCount : undefined,
    totalSales: typeof s.totalSales === "number" ? s.totalSales : undefined,
    responseTimeHours: typeof s.responseTimeHours === "number" ? s.responseTimeHours : undefined,
    fulfillmentHours: typeof s.fulfillmentHours === "number" ? s.fulfillmentHours : undefined,
    responseRatePct: typeof s.responseRatePct === "number" ? s.responseRatePct : undefined,
    returnPolicyDays: typeof s.returnPolicyDays === "number" ? s.returnPolicyDays : undefined,
    storeHours: Array.isArray(s.storeHours) ? (s.storeHours as StoreEnrichment["storeHours"]) : undefined,
    socialLinks: Array.isArray(s.socialLinks) ? (s.socialLinks as StoreEnrichment["socialLinks"]) : undefined,
    badges: Array.isArray(s.badges) ? (s.badges as string[]) : undefined,
    contactEmail: (s.contactEmail as string) ?? undefined,
    phone: (s.phone as string) ?? undefined,
  };
}

export default function VendorPublicStorePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const storeQuery = useStore(slug);
  const productsQuery = useStoreProducts(slug);

  const store = useMemo(() => toPublicStoreView(storeQuery.data), [storeQuery.data]);
  const products = productsQuery.data ?? [];

  // Cycle-6 enrichment data (store hours, response time, social links, etc.).
  // Computed unconditionally (Hooks rule) — falls back to an empty shape when
  // the store is still loading or missing.
  const storeEnrichment = useMemo(
    () => (store && storeQuery.data ? toStoreEnrichment(storeQuery.data, store) : null),
    [storeQuery.data, store],
  );

  const isLoading = storeQuery.isLoading || (!store && storeQuery.isLoading);
  const isStoreLoading = storeQuery.isLoading && !store;

  if (isStoreLoading) return <StorefrontLoading slug={slug} />;

  if (!store) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <EmptyState
          variant="error"
          title="Store not available"
          description="We couldn't load this storefront. It may have been removed or is temporarily unavailable."
          action={
            <Link
              href="/vendors"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-kwik-orange px-5 text-sm font-semibold text-white hover:bg-kwik-orange-hover"
            >
              Browse all vendors
            </Link>
          }
        />
      </div>
    );
  }

  const design = normalizeDesign(store.storefrontDesign);
  const sections = design.sections;
  // Reuse the products the shared hook already mapped to MarketplaceProduct
  // (via `toMarketplaceProduct`). `VendorProductCard` accepts that shape.
  const previewProducts = products.slice(0, 10);
  const gridClass =
    design.layoutTemplate === "DENSE_GRID"
      ? "grid grid-cols-2 gap-3 lg:grid-cols-5"
      : "grid grid-cols-2 gap-4 lg:grid-cols-4";


  return (
    <VendorStorefrontShell store={store} active="store">
      {sections.includes("hero") && (
        <section className="border-b border-black/10 dark:border-white/10">
          <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-6">
            <div className="relative min-h-[300px] overflow-hidden bg-[var(--store-primary)] text-white">
              {store.bannerUrl ? (
                <AppImage
                  src={store.bannerUrl}
                  alt={store.name}
                  fallbackVariant="product"
                  className="absolute inset-0 h-full w-full object-cover opacity-80"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/25 to-transparent" />
              <div className="relative flex min-h-[300px] max-w-2xl flex-col justify-end p-6 sm:p-8">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
                  {store.category ?? "Vendor store"}
                </p>
                <h1 className="text-3xl font-semibold sm:text-4xl">
                  {design.heroTitle || store.name}
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-6 text-white/85">
                  {design.heroSubtitle ||
                    store.description ||
                    "Shop verified products, digital goods, and partner-fulfilled items from this store."}
                </p>
                <div className="mt-6">
                  <StorefrontActionLink href={`/vendor/${store.slug}/cart`}>
                    Open store cart
                  </StorefrontActionLink>
                </div>
              </div>
            </div>

            <aside className="grid content-between gap-4 border border-black/10 p-5 dark:border-white/10">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Verified store", icon: BadgeCheck },
                  { label: "Manual dispatch", icon: Truck },
                  { label: "Partner network", icon: PackageCheck },
                  { label: "Buyer protected", icon: ShieldCheck },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="border border-black/10 p-4 dark:border-white/10"
                  >
                    <item.icon className="h-5 w-5 text-[var(--store-accent)]" />
                    <p className="mt-3 text-xs font-semibold">{item.label}</p>
                  </div>
                ))}
              </div>
              <Link
                href="#products"
                className="inline-flex h-11 items-center justify-center bg-[var(--store-primary)] px-4 text-sm font-semibold text-white"
              >
                Shop this store
              </Link>
            </aside>
          </div>
        </section>
      )}

      {sections.includes("products") && (
        <section id="products" className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
          <StorefrontSectionTitle
            title="Vendor stock"
            text={`Products fulfilled by ${store.name}.`}
            action={
              <Link
                href={`/vendor/${store.slug}/products`}
                className="inline-flex h-10 items-center justify-center bg-[var(--store-accent)] px-4 text-sm font-semibold text-white"
              >
                Show more
              </Link>
            }
          />
          {productsQuery.isLoading ? (
            <ProductGridSkeleton count={8} columns={4} />
          ) : previewProducts.length > 0 ? (
            <div className={gridClass}>
              {previewProducts.map((product) => (
                <VendorProductCard
                  key={product.id}
                  product={product}
                  store={store}
                  design={design}
                />
              ))}
            </div>
          ) : (
            <VendorEmptyProducts store={store} />
          )}
        </section>
      )}

      {sections.includes("policies") && (
        <>
          {/* Store info card (cycle 6 enrichment) */}
          {storeEnrichment && <StoreInfoCard store={storeEnrichment} />}

          <section className="mx-auto grid max-w-7xl gap-4 px-4 py-8 md:grid-cols-3 lg:px-6">
            {[
              [
                "Fulfillment",
                "Physical orders use Kwikseller manual dispatch while Rider remains paused.",
              ],
              [
                "Digital delivery",
                "Digital products are delivered from vendor-managed digital assets after payment.",
              ],
              [
                "Inventory",
                "Checkout validates live inventory and partner availability before payment.",
              ],
            ].map(([title, text]) => (
              <div
                key={title}
                className="border border-black/10 p-5 dark:border-white/10"
              >
                <PackageCheck className="h-5 w-5 text-[var(--store-accent)]" />
                <h3 className="mt-4 text-base font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-kwik-muted dark:text-white/60">
                  {text}
                </p>
              </div>
            ))}
          </section>
        </>
      )}
    </VendorStorefrontShell>
  );
}
