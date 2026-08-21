"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PackageOpen } from "lucide-react";
import { ordersApi, tokenManager } from "@/services/api-client";
import type { Order } from "@/types";
import {
  StorefrontLoading,
  VendorStorefrontShell,
  formatStoreCurrency,
  useVendorStorefront,
} from "@/components/vendor/vendor-storefront";

function unwrapOrders(value: unknown): Order[] {
  const payload = value as { data?: unknown };
  const nested = payload?.data as { data?: unknown; orders?: unknown } | undefined;
  const data = nested?.data ?? nested?.orders ?? payload?.data ?? value;
  if (Array.isArray(data)) return data as Order[];
  const objectData = data as { orders?: unknown; data?: unknown } | undefined;
  if (Array.isArray(objectData?.orders)) return objectData.orders as Order[];
  if (Array.isArray(objectData?.data)) return objectData.data as Order[];
  return [];
}

function formatDate(value?: string) {
  if (!value) return "Pending";
  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function VendorOrdersPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params.slug;
  const { store, isLoading } = useVendorStorefront(slug, { loadProducts: false });
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = React.useState(false);
  const [orderError, setOrderError] = React.useState("");

  React.useEffect(() => {
    if (!tokenManager.isAuthenticated()) {
      router.replace(`/login?redirect=/vendor/${slug}/orders`);
    }
  }, [router, slug]);

  React.useEffect(() => {
    if (!store || !tokenManager.isAuthenticated()) return undefined;
    let active = true;
    setIsLoadingOrders(true);
    setOrderError("");

    ordersApi.list({ storeId: store.id, limit: 20 })
      .then((response) => {
        if (!active) return;
        const list = unwrapOrders(response).filter((order) => !order.storeId || order.storeId === store.id);
        setOrders(list);
      })
      .catch(() => {
        if (active) {
          setOrders([]);
          setOrderError("Orders could not be loaded right now.");
        }
      })
      .finally(() => {
        if (active) setIsLoadingOrders(false);
      });

    return () => {
      active = false;
    };
  }, [store]);

  if (isLoading || !store) return <StorefrontLoading slug={slug} />;

  return (
    <VendorStorefrontShell store={store} active="more">
      <section className="mx-auto max-w-5xl px-4 py-6 lg:px-6">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Orders</h1>
            <p className="mt-1 text-sm text-kwik-muted dark:text-white/60">Only purchases from this store show here.</p>
          </div>
          <Link href={`/vendor/${store.slug}`} className="text-sm font-semibold text-[var(--store-primary)]">
            Shop store
          </Link>
        </div>

        {isLoadingOrders ? (
          <div className="border border-black/10 p-6 text-sm text-kwik-muted dark:border-white/10 dark:text-white/60">Loading orders...</div>
        ) : orderError ? (
          <div className="border border-red-200 bg-red-50 p-6 text-sm text-red-700">{orderError}</div>
        ) : orders.length ? (
          <div className="divide-y divide-black/10 border border-black/10 dark:divide-white/10 dark:border-white/10">
            {orders.map((order) => (
              <article key={order.id} className="grid gap-3 p-4 sm:grid-cols-[1fr_auto]">
                <div className="min-w-0">
                  <p className="truncate font-semibold">Order #{order.id.slice(-8).toUpperCase()}</p>
                  <p className="mt-1 text-xs text-kwik-muted dark:text-white/60">
                    {formatDate(order.createdAt)} - {order.status.replace(/_/g, " ")}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="font-bold">{formatStoreCurrency(Number(order.totalAmount ?? 0))}</p>
                  <p className="mt-1 text-xs text-kwik-muted dark:text-white/60">{order.items?.length ?? 0} items</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="border border-black/10 p-8 text-center dark:border-white/10">
            <PackageOpen className="mx-auto h-10 w-10 text-[var(--store-accent)]" />
            <h2 className="mt-4 text-lg font-semibold">No orders from this store yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-kwik-muted dark:text-white/60">
              When you buy from this store, your order history will appear here.
            </p>
          </div>
        )}
      </section>
    </VendorStorefrontShell>
  );
}
