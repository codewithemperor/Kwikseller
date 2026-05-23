"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BadgeCheck, PackageCheck, ShieldCheck, Truck, Users } from "lucide-react";
import {
  StorefrontActionLink,
  StorefrontLoading,
  StorefrontSectionTitle,
  VendorEmptyProducts,
  VendorProductCard,
  VendorStorefrontShell,
  normalizeDesign,
  toMarketplaceProduct,
  useVendorStorefront,
} from "@/components/vendor/vendor-storefront";

export default function VendorPublicStorePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { store, products, isLoading } = useVendorStorefront(slug);

  if (isLoading || !store) return <StorefrontLoading slug={slug} />;

  const design = normalizeDesign(store.storefrontDesign);
  const sections = design.sections;
  const marketplaceProducts = products.map((product) => toMarketplaceProduct(product, store));
  const poolProducts = marketplaceProducts.filter((product) => product.productSource === "POOL_RESALE");
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
              {store.bannerUrl ? <img src={store.bannerUrl} alt={store.name} className="absolute inset-0 h-full w-full object-cover opacity-80" /> : null}
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/25 to-transparent" />
              <div className="relative flex min-h-[300px] max-w-2xl flex-col justify-end p-6 sm:p-8">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/70">{store.category ?? "Vendor store"}</p>
                <h1 className="text-3xl font-semibold sm:text-4xl">{design.heroTitle || store.name}</h1>
                <p className="mt-4 max-w-xl text-sm leading-6 text-white/85">
                  {design.heroSubtitle || store.description || "Shop verified vendor stock, digital products, and Pool resale offers from this store."}
                </p>
                <div className="mt-6">
                  <StorefrontActionLink href={`/vendor/${store.slug}/cart`}>Open store cart</StorefrontActionLink>
                </div>
              </div>
            </div>

            <aside className="grid content-between gap-4 border border-black/10 p-5 dark:border-white/10">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Verified store", icon: BadgeCheck },
                  { label: "Manual dispatch", icon: Truck },
                  { label: "Pool resale ready", icon: Users },
                  { label: "Buyer protected", icon: ShieldCheck },
                ].map((item) => (
                  <div key={item.label} className="border border-black/10 p-4 dark:border-white/10">
                    <item.icon className="h-5 w-5 text-[var(--store-accent)]" />
                    <p className="mt-3 text-xs font-semibold">{item.label}</p>
                  </div>
                ))}
              </div>
              <Link href="#products" className="inline-flex h-11 items-center justify-center bg-[var(--store-primary)] px-4 text-sm font-semibold text-white">
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
            action={<span className="text-sm font-semibold text-[var(--store-primary)]">{marketplaceProducts.length} items</span>}
          />
          <div className={gridClass}>
            {marketplaceProducts.length > 0 ? (
              marketplaceProducts.map((product) => (
                <VendorProductCard key={product.id} product={product} store={store} design={design} />
              ))
            ) : (
              <VendorEmptyProducts store={store} />
            )}
          </div>
        </section>
      )}

      {sections.includes("pool") && poolProducts.length > 0 && (
        <section className="border-y border-black/10 bg-[var(--store-primary)] text-white dark:border-white/10">
          <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
            <StorefrontSectionTitle title="Pool resale shelf" text="Admin Pool Catalog products resold by this vendor." />
            <div className={gridClass}>
              {poolProducts.map((product) => (
                <VendorProductCard key={product.id} product={product} store={store} design={design} />
              ))}
            </div>
          </div>
        </section>
      )}

      {sections.includes("policies") && (
        <section className="mx-auto grid max-w-7xl gap-4 px-4 py-8 md:grid-cols-3 lg:px-6">
          {[
            ["Fulfillment", "Physical orders use Kwikseller manual dispatch while Rider remains paused."],
            ["Digital delivery", "Digital products are delivered from vendor-managed digital assets after payment."],
            ["Inventory", "Checkout validates live inventory and Pool availability before payment."],
          ].map(([title, text]) => (
            <div key={title} className="border border-black/10 p-5 dark:border-white/10">
              <PackageCheck className="h-5 w-5 text-[var(--store-accent)]" />
              <h3 className="mt-4 text-base font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-kwik-muted dark:text-white/60">{text}</p>
            </div>
          ))}
        </section>
      )}
    </VendorStorefrontShell>
  );
}
