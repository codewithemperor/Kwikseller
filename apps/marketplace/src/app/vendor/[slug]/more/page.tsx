"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, ClipboardList, Info, Store } from "lucide-react";
import { tokenManager } from "@kwikseller/api-client";
import {
  StorefrontLoading,
  VendorStorefrontShell,
  useVendorStorefront,
} from "@/components/vendor/vendor-storefront";

export default function VendorMorePage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params.slug;
  const { store, isLoading } = useVendorStorefront(slug, { loadProducts: false });

  React.useEffect(() => {
    if (!tokenManager.isAuthenticated()) {
      router.replace(`/login?redirect=/vendor/${slug}/more`);
    }
  }, [router, slug]);

  if (isLoading || !store) return <StorefrontLoading slug={slug} />;

  return (
    <VendorStorefrontShell store={store} active="more">
      <section className="border-b border-black/10 dark:border-white/10">
        <div className="mx-auto max-w-5xl px-4 py-6 lg:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--store-accent)]">Store account</p>
          <h1 className="mt-2 text-2xl font-semibold">More</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-kwik-muted dark:text-white/60">
            Track purchases, review store details, or keep shopping this storefront.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-4 py-6 sm:grid-cols-3 lg:px-6">
        {[
          { href: `/vendor/${store.slug}/orders`, label: "Orders", text: "Purchases you made from this store.", icon: ClipboardList },
          { href: `/vendor/${store.slug}/details`, label: "Vendor details", text: "Store identity and fulfillment notes.", icon: Info },
          { href: `/vendor/${store.slug}/products`, label: "All products", text: "Search and filter this store catalog.", icon: Store },
        ].map((item) => (
          <Link key={item.label} href={item.href} className="border border-black/10 p-4 transition hover:border-[var(--store-accent)] dark:border-white/10">
            <item.icon className="h-5 w-5 text-[var(--store-accent)]" />
            <div className="mt-4 flex items-center justify-between gap-2">
              <h2 className="font-semibold">{item.label}</h2>
              <ArrowRight className="h-4 w-4" />
            </div>
            <p className="mt-2 text-xs leading-5 text-kwik-muted dark:text-white/60">{item.text}</p>
          </Link>
        ))}
      </section>
    </VendorStorefrontShell>
  );
}
