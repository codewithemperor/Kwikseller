"use client";

import React from "react";
import { useParams } from "next/navigation";
import { Filter, Search, SlidersHorizontal } from "lucide-react";
import { marketplaceStoresApi } from "@kwikseller/api-client";
import { kwikToast } from "@kwikseller/utils";
import {
  StorefrontLoading,
  VendorEmptyProducts,
  VendorProductCard,
  VendorStorefrontShell,
  normalizeDesign,
  toMarketplaceProduct,
  useVendorStorefront,
} from "@/components/vendor/vendor-storefront";

type SortValue = "newest" | "price-low" | "price-high" | "name";
type SourceValue = "all" | "VENDOR_STOCK" | "POOL_RESALE" | "DIGITAL";

export default function VendorProductsPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { store, products, isLoading } = useVendorStorefront(slug, { productLimit: 500 });
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState("all");
  const [source, setSource] = React.useState<SourceValue>("all");
  const [sort, setSort] = React.useState<SortValue>("newest");
  const [showFilters, setShowFilters] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [serverProducts, setServerProducts] = React.useState<typeof products>([]);
  const [serverQuery, setServerQuery] = React.useState("");
  const [isServerSearching, setIsServerSearching] = React.useState(false);

  const marketplaceProducts = React.useMemo(
    () => {
      const sourceProducts = serverQuery && query.trim().toLowerCase() === serverQuery ? serverProducts : products;
      return sourceProducts.map((product) => toMarketplaceProduct(product, store));
    },
    [products, query, serverProducts, serverQuery, store],
  );

  const categories = React.useMemo(() => {
    const names = marketplaceProducts
      .map((product) => product.category)
      .filter(Boolean);
    return ["all", ...Array.from(new Set(names))];
  }, [marketplaceProducts]);

  const filteredProducts = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return marketplaceProducts
      .filter((product) => {
        const matchesQuery =
          !normalizedQuery ||
          product.name.toLowerCase().includes(normalizedQuery) ||
          product.category.toLowerCase().includes(normalizedQuery);
        const matchesCategory = category === "all" || product.category === category;
        const matchesSource =
          source === "all" ||
          (source === "DIGITAL"
            ? product.productType === "DIGITAL"
            : product.productSource === source);
        return matchesQuery && matchesCategory && matchesSource;
      })
      .sort((a, b) => {
        if (sort === "price-low") return a.price - b.price;
        if (sort === "price-high") return b.price - a.price;
        if (sort === "name") return a.name.localeCompare(b.name);
        return 0;
      });
  }, [category, marketplaceProducts, query, sort, source]);

  const localQueryMatches = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return products.length;
    return products.filter((product) => {
      const categoryName = product.category?.name ?? "";
      return (
        product.name.toLowerCase().includes(normalizedQuery) ||
        (product.description ?? "").toLowerCase().includes(normalizedQuery) ||
        categoryName.toLowerCase().includes(normalizedQuery)
      );
    }).length;
  }, [products, query]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / 50));
  const pagedProducts = filteredProducts.slice((page - 1) * 50, page * 50);

  const goToPage = (nextPage: number) => {
    setPage(nextPage);
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const searchServer = React.useCallback(async (mode: "intent" | "debounced") => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 3 || !store) return;
    if (serverQuery === trimmed.toLowerCase() && serverProducts.length) return;

    setIsServerSearching(true);
    try {
      const response = await marketplaceStoresApi.getProducts(store.slug, {
        limit: 500,
        search: trimmed,
        category,
        source,
      });
      const payload = response.data as unknown;
      const data = (payload as { data?: unknown })?.data ?? payload;
      setServerProducts(Array.isArray(data) ? data as typeof products : []);
      setServerQuery(trimmed.toLowerCase());
      if (mode === "intent") setPage(1);
    } catch {
      kwikToast.error("Server search could not run right now.");
    } finally {
      setIsServerSearching(false);
    }
  }, [category, products, query, serverProducts.length, serverQuery, source, store]);

  React.useEffect(() => {
    setPage(1);
  }, [category, query, sort, source]);

  React.useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3 || localQueryMatches > 0) return undefined;
    const timeout = window.setTimeout(() => {
      void searchServer("debounced");
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [localQueryMatches, query, searchServer]);

  if (isLoading || !store) return <StorefrontLoading slug={slug} />;

  const design = normalizeDesign(store.storefrontDesign);
  const gridClass =
    design.layoutTemplate === "DENSE_GRID"
      ? "grid grid-cols-2 gap-3 lg:grid-cols-5"
      : "grid grid-cols-2 gap-4 lg:grid-cols-4";

  return (
    <VendorStorefrontShell store={store} active="products">
      <section className="sticky top-16 z-30 border-b border-black/10 bg-white/95 backdrop-blur dark:border-white/10 dark:bg-[#07111f]/95">
        <div className="mx-auto max-w-7xl px-4 py-3 lg:px-6">
          <form
            className="flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void searchServer("intent");
            }}
          >
            <label className="relative block min-w-0 flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--store-accent)]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search this store"
                className="h-12 w-full rounded-full border-0 bg-[var(--store-primary)]/5 pl-11 pr-4 text-sm text-kwik-dark outline-none ring-0 placeholder:text-kwik-muted focus:outline-none focus:ring-0 dark:bg-white/10 dark:text-white"
              />
            </label>
            <button
              type="submit"
              className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-[var(--store-primary)] px-4 text-sm font-semibold text-white disabled:opacity-60"
              disabled={isServerSearching}
            >
              {isServerSearching ? "..." : "Search"}
            </button>
            <button
              type="button"
              onClick={() => setShowFilters((value) => !value)}
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--store-accent)] text-white"
              aria-label="Open product filters"
            >
              <SlidersHorizontal className="h-5 w-5" />
            </button>
          </form>
          {showFilters && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 text-sm">
              <label className="inline-flex h-10 shrink-0 items-center gap-2 border border-black/10 bg-white px-3 dark:border-white/10 dark:bg-white/5">
                <SlidersHorizontal className="h-4 w-4 text-[var(--store-accent)]" />
                <select value={sort} onChange={(event) => setSort(event.target.value as SortValue)} className="bg-transparent outline-none">
                  <option value="newest">Newest</option>
                  <option value="price-low">Price low</option>
                  <option value="price-high">Price high</option>
                  <option value="name">A-Z</option>
                </select>
              </label>
              <label className="inline-flex h-10 shrink-0 items-center gap-2 border border-black/10 bg-white px-3 dark:border-white/10 dark:bg-white/5">
                <Filter className="h-4 w-4 text-[var(--store-accent)]" />
                <select value={category} onChange={(event) => setCategory(event.target.value)} className="bg-transparent outline-none">
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item === "all" ? "All categories" : item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="inline-flex h-10 shrink-0 items-center border border-black/10 bg-white px-3 dark:border-white/10 dark:bg-white/5">
                <select value={source} onChange={(event) => setSource(event.target.value as SourceValue)} className="bg-transparent outline-none">
                  <option value="all">All stock</option>
                  <option value="VENDOR_STOCK">Vendor stock</option>
                  <option value="POOL_RESALE">Pool resale</option>
                  <option value="DIGITAL">Digital</option>
                </select>
              </label>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <div className={gridClass}>
          {pagedProducts.length > 0 ? (
            pagedProducts.map((product) => (
              <VendorProductCard key={product.id} product={product} store={store} design={design} />
            ))
          ) : (
            <VendorEmptyProducts store={store} />
          )}
        </div>
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between gap-3 border-t border-black/10 pt-4 text-sm dark:border-white/10">
            <button
              type="button"
              onClick={() => goToPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="h-10 border border-black/10 px-4 font-semibold disabled:opacity-40 dark:border-white/10"
            >
              Previous
            </button>
            <span className="text-kwik-muted dark:text-white/60">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => goToPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="h-10 border border-black/10 px-4 font-semibold disabled:opacity-40 dark:border-white/10"
            >
              Next
            </button>
          </div>
        )}
      </section>
    </VendorStorefrontShell>
  );
}
