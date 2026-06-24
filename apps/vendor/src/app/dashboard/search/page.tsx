"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Clock,
  PackageSearch,
  Search,
  ShoppingBag,
  Store,
} from "lucide-react";
import { motion } from "framer-motion";
import { VendorSoftPanel } from "@/components/dashboard/vendor-dashboard-ui";
import { PoolCatalogItem, poolItemRouteKey, poolSourceName } from "@/lib/pool";
import { formatCurrency, unwrapApiData } from "@/lib/vendor-format";
import { vendorCommerceApi } from "@kwikseller/api-client";
import type { Order, Product } from "@kwikseller/types";
import { EmptyState, FieldInput, Skeleton, SkeletonCard, VendorPageHeader } from "@kwikseller/ui";
import { kwikToast } from "@kwikseller/utils";

type SearchResults = {
  products: Product[];
  pool: PoolCatalogItem[];
  orders: Order[];
};

const RECENTS_KEY = "kwikseller_vendor_search_recents";

function readRecents() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(RECENTS_KEY) || "[]") as string[];
  } catch {
    return [];
  }
}

function productImage(product: Product) {
  const first = product.images?.[0];
  if (!first) return "";
  return typeof first === "string" ? first : first.url;
}

export default function VendorSearchPage() {
  const searchParams = useSearchParams();
  const [query, setQuery] = React.useState("");
  const [recents, setRecents] = React.useState<string[]>([]);
  const [results, setResults] = React.useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    setRecents(readRecents());
  }, []);

  React.useEffect(() => {
    const initialQuery = searchParams.get("q")?.trim();
    if (initialQuery) {
      setQuery(initialQuery);
      runSearch(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const saveRecent = (value: string) => {
    const next = [value, ...recents.filter((item) => item !== value)].slice(0, 5);
    setRecents(next);
    window.localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  };

  const runSearch = async (value = query) => {
    const nextQuery = value.trim();
    if (!nextQuery) return;
    setQuery(nextQuery);
    setIsLoading(true);
    try {
      const [productsResponse, poolResponse, ordersResponse] = await Promise.all([
        vendorCommerceApi.listProducts({ search: nextQuery, limit: 20 }),
        vendorCommerceApi.listPoolCatalog({ search: nextQuery, limit: 20 }),
        vendorCommerceApi.listOrders({ limit: 20 }),
      ]);
      const products = unwrapApiData<Product[]>(productsResponse.data);
      const pool = unwrapApiData<PoolCatalogItem[]>(poolResponse.data);
      const orders = unwrapApiData<Order[]>(ordersResponse.data);
      const q = nextQuery.toLowerCase();
      setResults({
        products: Array.isArray(products) ? products : [],
        pool: Array.isArray(pool) ? pool : [],
        orders: Array.isArray(orders)
          ? orders.filter((order) => [
              order.checkoutReference,
              order.status,
              order.paymentStatus,
              order.items?.map((item) => item.product?.name).join(" "),
            ].filter(Boolean).some((value) => String(value).toLowerCase().includes(q)))
          : [],
      });
      saveRecent(nextQuery);
    } catch (error) {
      kwikToast.error(error instanceof Error ? error.message : "Search failed");
    } finally {
      setIsLoading(false);
    }
  };

  const clearRecents = () => {
    setRecents([]);
    window.localStorage.removeItem(RECENTS_KEY);
  };

  const hasResults = Boolean(
    results?.products.length || results?.pool.length || results?.orders.length,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="safe-container space-y-5"
    >
      <VendorPageHeader
        title="Search"
        description="Search your products, order queue, and Pool catalog when you need a specific item."
      />

      <VendorSoftPanel>
        <div className="grid grid-cols-[minmax(0,1fr)_40px] items-center gap-2 sm:grid-cols-[1fr_auto]">
          <FieldInput
            aria-label="Search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") runSearch();
            }}
            placeholder="Search products, Pool, or orders"
            className="premium-search px-4 text-sm dark:bg-white/8"
          />
          <button
            type="button"
            onClick={() => runSearch()}
            disabled={isLoading}
            aria-label="Search"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background transition hover:bg-foreground/90 disabled:opacity-60"
          >
            <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </button>
        </div>
      </VendorSoftPanel>

      {isLoading ? (
        <section className="grid gap-5 xl:grid-cols-3" aria-busy="true" aria-live="polite">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="space-y-3 rounded-2xl border border-kwik-border bg-surface p-4 md:p-5">
              <Skeleton className="h-5 w-24" />
              {Array.from({ length: 4 }).map((_, row) => (
                <SkeletonCard key={row} className="h-16 w-full" />
              ))}
            </div>
          ))}
        </section>
      ) : !results ? (
        <VendorSoftPanel
          title="Recents"
          action={
            recents.length ? (
              <button type="button" onClick={clearRecents} className="text-sm font-medium text-foreground dark:text-white">
                Delete all
              </button>
            ) : null
          }
        >
          {recents.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {recents.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => runSearch(item)}
                  className="grid grid-cols-[40px_1fr_auto] items-center gap-3 rounded-lg bg-default-100 p-3 text-left dark:bg-white/5"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface text-foreground dark:bg-white/8 dark:text-white">
                    <Clock className="h-4 w-4" strokeWidth={1.5} />
                  </span>
                  <span className="font-medium text-foreground">{item}</span>
                  <Search className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              variant="search"
              title="No recent searches"
              description="Search once and your recent terms will appear here."
            />
          )}
        </VendorSoftPanel>
      ) : hasResults ? (
        <section className="grid gap-5 xl:grid-cols-3">
          <VendorSoftPanel title="Products">
            <div className="space-y-3">
              {results.products.slice(0, 6).map((product) => (
                <Link key={product.id} href="/dashboard/products" className="grid grid-cols-[52px_1fr_auto] items-center gap-3 rounded-lg bg-default-100 p-3 dark:bg-white/5">
                  <span className="h-[52px] w-[52px] overflow-hidden rounded-lg bg-surface dark:bg-white/8">
                    {productImage(product) ? <img src={productImage(product)} alt="" className="h-full w-full object-cover" /> : null}
                  </span>
                  <span className="min-w-0">
                    <span className="product-title-clamp text-sm font-normal text-foreground">{product.name}</span>
                    <span className="text-sm text-muted-foreground">{formatCurrency(product.price)}</span>
                  </span>
                  <Store className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                </Link>
              ))}
            </div>
          </VendorSoftPanel>

          <VendorSoftPanel title="Pool">
            <div className="space-y-3">
              {results.pool.slice(0, 6).map((item) => (
                <Link key={`${item.sourceType}-${item.id}`} href={`/dashboard/pool/product/${poolItemRouteKey(item)}`} className="grid grid-cols-[40px_1fr_auto] items-center gap-3 rounded-lg bg-default-100 p-3 dark:bg-white/5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface text-foreground dark:bg-white/8 dark:text-white">
                    <PackageSearch className="h-4 w-4" strokeWidth={1.5} />
                  </span>
                  <span className="min-w-0">
                    <span className="product-title-clamp text-sm font-normal text-foreground">{item.name}</span>
                    <span className="text-sm text-muted-foreground">{poolSourceName(item)}</span>
                  </span>
                  <Search className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                </Link>
              ))}
            </div>
          </VendorSoftPanel>

          <VendorSoftPanel title="Orders">
            <div className="space-y-3">
              {results.orders.slice(0, 6).map((order) => (
                <Link key={order.id} href="/dashboard/orders" className="grid grid-cols-[40px_1fr_auto] items-center gap-3 rounded-lg bg-default-100 p-3 dark:bg-white/5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface text-foreground dark:bg-white/8 dark:text-white">
                    <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
                  </span>
                  <span className="min-w-0">
                    <span className="line-clamp-1 font-medium text-foreground">{order.checkoutReference ?? order.id}</span>
                    <span className="text-sm text-muted-foreground">{order.status}</span>
                  </span>
                  <span className="font-semibold text-foreground">{formatCurrency(order.totalAmount)}</span>
                </Link>
              ))}
            </div>
          </VendorSoftPanel>
        </section>
      ) : (
        <VendorSoftPanel>
          <EmptyState
            variant="search"
            title="No matches"
            description="Try another term or search Pool directly from the Pool tab."
          />
        </VendorSoftPanel>
      )}
    </motion.div>
  );
}
