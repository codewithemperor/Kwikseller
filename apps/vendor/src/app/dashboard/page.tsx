"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, Boxes, PackageCheck, ShoppingCart, Users, Wallet } from "lucide-react";
import { vendorCommerceApi } from "@kwikseller/api-client";
import type { Order, VendorPoolOffer, InventoryItem } from "@kwikseller/types";
import { formatCurrency, formatDate, unwrapApiData } from "@/lib/vendor-format";
import { VendorEmptyState } from "@/components/vendor-empty-state";

type VendorDashboardResponse = {
  revenue: number;
  ordersCount: number;
  productsCount: number;
  inventoryAlerts: InventoryItem[];
  fulfillmentTasks: Order[];
  poolEarnings: number;
  recentOrders: Order[];
  poolOffers: VendorPoolOffer[];
};

export default function VendorDashboardPage() {
  const [data, setData] = React.useState<VendorDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let active = true;
    vendorCommerceApi
      .getDashboard()
      .then((response) => {
        if (active) setData(unwrapApiData<VendorDashboardResponse>(response.data));
      })
      .catch(() => {
        if (active) setError("Could not load vendor dashboard.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const stats = [
    { title: "Revenue", value: formatCurrency(data?.revenue ?? 0), icon: Wallet },
    { title: "Orders", value: String(data?.ordersCount ?? 0), icon: ShoppingCart },
    { title: "Products", value: String(data?.productsCount ?? 0), icon: Boxes },
    { title: "Pool earnings", value: formatCurrency(data?.poolEarnings ?? 0), icon: Users },
  ];

  if (isLoading) {
    return <div className="grid gap-4 md:grid-cols-4">{stats.map((item) => <div key={item.title} className="h-28 animate-pulse border border-border bg-surface" />)}</div>;
  }

  if (error) {
    return (
      <VendorEmptyState
        title="Dashboard unavailable"
        text={error}
        action={<button onClick={() => window.location.reload()} className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">Reload</button>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Operations overview</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Live store metrics from products, orders, inventory alerts, fulfillment, and Pool offers.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article key={stat.title} className="border border-border bg-background p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-muted-foreground">{stat.title}</p>
              <stat.icon className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-4 font-heading text-2xl font-semibold text-foreground">{stat.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <article className="border border-border bg-background">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div>
              <h2 className="font-heading text-base font-semibold text-foreground">Recent orders</h2>
              <p className="text-sm text-muted-foreground">Latest paid or pending customer work.</p>
            </div>
            <Link href="/dashboard/orders" className="text-sm font-semibold text-primary">View all</Link>
          </div>
          <div className="divide-y divide-border">
            {(data?.recentOrders ?? []).slice(0, 6).map((order) => (
              <div key={order.id} className="grid gap-2 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="font-mono text-xs font-semibold text-muted-foreground">{order.checkoutReference ?? order.id}</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{order.status}</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-sm font-bold text-foreground">{formatCurrency(order.totalAmount)}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                </div>
              </div>
            ))}
            {!data?.recentOrders?.length && (
              <div className="p-6 text-sm text-muted-foreground">No orders yet.</div>
            )}
          </div>
        </article>

        <div className="grid gap-6">
          <article className="border border-border bg-background p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-500" />
              <div>
                <h2 className="font-heading text-base font-semibold text-foreground">Inventory alerts</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {(data?.inventoryAlerts ?? []).length} item{(data?.inventoryAlerts ?? []).length === 1 ? "" : "s"} at or below threshold.
                </p>
                <Link href="/dashboard/inventory" className="mt-3 inline-flex text-sm font-semibold text-primary">Adjust stock</Link>
              </div>
            </div>
          </article>
          <article className="border border-border bg-background p-5">
            <div className="flex items-start gap-3">
              <PackageCheck className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <h2 className="font-heading text-base font-semibold text-foreground">Fulfillment tasks</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {(data?.fulfillmentTasks ?? []).length} paid order{(data?.fulfillmentTasks ?? []).length === 1 ? "" : "s"} waiting for handling.
                </p>
                <Link href="/dashboard/orders" className="mt-3 inline-flex text-sm font-semibold text-primary">Handle orders</Link>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
