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
import {
  VendorPageHeader,
  VendorSoftPanel,
} from "@/components/dashboard/vendor-dashboard-ui";
import { KwiksellerLoader } from "@/components/kwikseller-loader";
import { VendorEmptyState } from "@/components/vendor-empty-state";
import { PoolCatalogItem, poolItemRouteKey, poolSourceName } from "@/lib/pool";
import { formatCurrency, unwrapApiData } from "@/lib/vendor-format";
import { vendorCommerceApi } from "@kwikseller/api-client";
import type { Order, Product } from "@kwikseller/types";
import { AppButton, FieldInput } from "@kwikseller/ui";
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
    <div className="space-y-6">
      <VendorPageHeader
        title="Search"
        description="Search your products, order queue, and Pool catalog when you need a specific item."
      />

      <VendorSoftPanel>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <FieldInput
            aria-label="Search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") runSearch();
            }}
            placeholder="Search products, Pool, or orders"
            className="h-14 rounded-2xl bg-white text-base dark:bg-white/5"
          />
          <AppButton type="button" size="lg" onClick={() => runSearch()} disabled={isLoading}>
            <Search className="h-4 w-4" />
            Search
          </AppButton>
        </div>
      </VendorSoftPanel>

      {isLoading ? (
        <KwiksellerLoader />
      ) : !results ? (
        <VendorSoftPanel
          title="Recents"
          action={
            recents.length ? (
              <button type="button" onClick={clearRecents} className="text-sm font-semibold text-accent">
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
                  className="grid grid-cols-[40px_1fr_auto] items-center gap-3 rounded-2xl bg-surface p-3 text-left"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-background text-accent">
                    <Clock className="h-4 w-4" />
                  </span>
                  <span className="font-semibold text-foreground">{item}</span>
                  <Search className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          ) : (
            <VendorEmptyState title="No recent searches" text="Search once and your recent terms will appear here." />
          )}
        </VendorSoftPanel>
      ) : hasResults ? (
        <section className="grid gap-5 xl:grid-cols-3">
          <VendorSoftPanel title="Products">
            <div className="space-y-3">
              {results.products.slice(0, 6).map((product) => (
                <Link key={product.id} href="/dashboard/products" className="grid grid-cols-[54px_1fr_auto] items-center gap-3 rounded-2xl bg-surface p-3">
                  <span className="h-14 w-14 overflow-hidden rounded-2xl bg-background">
                    {productImage(product) ? <img src={productImage(product)} alt="" className="h-full w-full object-cover" /> : null}
                  </span>
                  <span className="min-w-0">
                    <span className="line-clamp-1 font-semibold text-foreground">{product.name}</span>
                    <span className="text-sm text-muted-foreground">{formatCurrency(product.price)}</span>
                  </span>
                  <Store className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </VendorSoftPanel>

          <VendorSoftPanel title="Pool">
            <div className="space-y-3">
              {results.pool.slice(0, 6).map((item) => (
                <Link key={`${item.sourceType}-${item.id}`} href={`/dashboard/pool/product/${poolItemRouteKey(item)}`} className="grid grid-cols-[40px_1fr_auto] items-center gap-3 rounded-2xl bg-surface p-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-background text-accent">
                    <PackageSearch className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="line-clamp-1 font-semibold text-foreground">{item.name}</span>
                    <span className="text-sm text-muted-foreground">{poolSourceName(item)}</span>
                  </span>
                  <Search className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </VendorSoftPanel>

          <VendorSoftPanel title="Orders">
            <div className="space-y-3">
              {results.orders.slice(0, 6).map((order) => (
                <Link key={order.id} href="/dashboard/orders" className="grid grid-cols-[40px_1fr_auto] items-center gap-3 rounded-2xl bg-surface p-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-background text-accent">
                    <ShoppingBag className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="line-clamp-1 font-semibold text-foreground">{order.checkoutReference ?? order.id}</span>
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
          <VendorEmptyState title="No matches" text="Try another term or search Pool directly from the Pool tab." />
        </VendorSoftPanel>
      )}
    </div>
  );
}
