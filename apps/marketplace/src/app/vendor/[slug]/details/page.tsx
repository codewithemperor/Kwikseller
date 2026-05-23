"use client";

import React from "react";
import { useParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import {
  StorefrontLoading,
  VendorStorefrontShell,
  useVendorStorefront,
} from "@/components/vendor/vendor-storefront";

export default function VendorDetailsPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { store, isLoading } = useVendorStorefront(slug, { loadProducts: false });

  if (isLoading || !store) return <StorefrontLoading slug={slug} />;

  return (
    <VendorStorefrontShell store={store} active="more">
      <section className="mx-auto max-w-5xl px-4 py-6 lg:px-6">
        <div className="border border-black/10 p-5 dark:border-white/10">
          <ShieldCheck className="h-5 w-5 text-[var(--store-accent)]" />
          <h1 className="mt-4 text-2xl font-semibold">Store information</h1>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-kwik-muted dark:text-white/60">Store name</dt>
              <dd className="mt-1 font-semibold">{store.name}</dd>
            </div>
            <div>
              <dt className="text-kwik-muted dark:text-white/60">Store username</dt>
              <dd className="mt-1 font-semibold">{store.slug}</dd>
            </div>
            <div>
              <dt className="text-kwik-muted dark:text-white/60">Category</dt>
              <dd className="mt-1 font-semibold">{store.category ?? "Marketplace vendor"}</dd>
            </div>
            <div>
              <dt className="text-kwik-muted dark:text-white/60">Verification</dt>
              <dd className="mt-1 font-semibold">{store.isVerified ? "Verified" : "Pending verification"}</dd>
            </div>
          </dl>
          {store.description && <p className="mt-5 text-sm leading-6 text-kwik-muted dark:text-white/60">{store.description}</p>}
        </div>
      </section>
    </VendorStorefrontShell>
  );
}
