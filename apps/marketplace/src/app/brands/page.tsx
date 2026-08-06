"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, Search, Tags } from "lucide-react";
import { useBrands } from "@/lib/api-hooks";
import { AppImage } from "@/components/ui/app-image";
import { ProductGridSkeleton } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";

export default function BrandsPage() {
  const [query, setQuery] = React.useState("");
  const brandsQuery = useBrands();

  const isLoading = brandsQuery.isLoading;
  const brands = brandsQuery.data ?? [];

  const filteredBrands = useMemo(
    () =>
      brands.filter((brand) =>
        brand.name.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [brands, query],
  );

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-border bg-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
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
                className="h-12 w-full rounded-md border border-kwik-border bg-white pl-10 pr-3 text-sm text-kwik-dark outline-none focus:border-kwik-orange dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </label>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-36 animate-pulse border border-kwik-border bg-muted/40 dark:border-white/10 dark:bg-white/5"
              />
            ))}
          </div>
        ) : filteredBrands.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filteredBrands.map((brand, i) => (
              <motion.div
                key={brand.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.3) }}
                whileHover={{ scale: 1.02 }}
              >
                <Link
                  href={`/products?brandId=${encodeURIComponent(brand.id)}`}
                  className="group relative block overflow-hidden rounded-xl border border-kwik-border bg-white p-4 transition-colors hover:border-kwik-orange/40 hover:shadow-md hover:shadow-kwik-orange/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-kwik-orange/40 focus-visible:ring-offset-2 dark:border-white/10 dark:bg-white/5"
                >
                  {/* Subtle gradient overlay on hover (top-edge accent) */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-kwik-orange/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  />
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 overflow-hidden bg-muted transition-transform duration-300 group-hover:scale-105 dark:bg-white/10">
                      <AppImage
                        src={brand.image}
                        alt={brand.name}
                        className="h-full w-full object-cover"
                        fallbackVariant="product"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-sm font-semibold text-kwik-dark dark:text-white">
                        {brand.name}
                      </h2>
                      <p className="mt-1 text-xs text-kwik-muted dark:text-white/55">
                        {brand._count?.products ?? 0} product
                        {brand._count?.products === 1 ? "" : "s"}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-kwik-muted transition group-hover:translate-x-1 group-hover:text-kwik-orange" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState
            variant="search"
            icon={<BadgeCheck className="h-12 w-12" />}
            title={query ? "No brands match your search" : "No brands yet"}
            description={
              query
                ? `No brands match "${query}". Try a different search term or explore the full marketplace catalog.`
                : "Brands will appear here once sellers start publishing products."
            }
            action={
              <Link
                href="/products"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-kwik-orange px-5 text-sm font-semibold text-white hover:bg-kwik-orange-hover"
              >
                Browse products
              </Link>
            }
          />
        )}
      </section>
    </main>
  );
}
