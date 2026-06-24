"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Search, Tags } from "lucide-react";
import { fetchBrands, type Brand } from "@/lib/api";
import { AppImage } from "@/components/ui/app-image";

export default function BrandsPage() {
  const [brands, setBrands] = React.useState<Brand[]>([]);
  const [query, setQuery] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    fetchBrands()
      .then((response) => {
        if (active) setBrands(response.data ?? []);
      })
      .catch(() => {
        if (active) setBrands([]);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredBrands = brands.filter((brand) =>
    brand.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-border bg-background">
        <div className="container mx-auto px-4 py-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center bg-foreground text-background">
                <Tags className="h-6 w-6" />
              </div>
              <h1 className="font-heading text-4xl font-semibold tracking-tight text-kwik-dark dark:text-white">
                Popular brands
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-kwik-muted dark:text-white/60">
                Browse trusted brands across vendor stock, Pool resale, and digital product categories.
              </p>
            </div>
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-kwik-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search brands"
                className="h-12 w-full rounded-md border border-neutral-200 bg-white pl-10 pr-3 text-sm text-kwik-dark outline-none focus:border-kwik-dark dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </label>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-36 animate-pulse border border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-white/5" />
            ))}
          </div>
        ) : filteredBrands.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filteredBrands.map((brand) => (
              <Link
                key={brand.id}
                href={`/search?q=${encodeURIComponent(brand.name)}`}
                className="group border border-neutral-200 bg-white p-4 transition hover:border-kwik-orange dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 overflow-hidden bg-neutral-100 dark:bg-white/10">
                    <AppImage src={brand.image} alt={brand.name} className="h-full w-full object-cover" fallbackVariant="product" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-sm font-semibold text-kwik-dark dark:text-white">{brand.name}</h2>
                    <p className="mt-1 text-xs text-kwik-muted dark:text-white/55">
                      {brand._count?.products ?? 0} product{brand._count?.products === 1 ? "" : "s"}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-kwik-muted transition group-hover:translate-x-1 group-hover:text-kwik-orange" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-neutral-300 p-12 text-center dark:border-white/15">
            <BadgeCheck className="mx-auto h-10 w-10 text-kwik-muted" />
            <h2 className="mt-4 text-lg font-semibold text-kwik-dark dark:text-white">No brands found</h2>
            <p className="mt-2 text-sm text-kwik-muted dark:text-white/60">
              Try another search term or explore the full marketplace catalog.
            </p>
            <Link href="/search" className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-kwik-dark px-4 text-sm font-semibold text-white">
              Browse products
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
