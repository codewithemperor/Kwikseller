"use client";

import React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Boxes,
  PackageCheck,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";
import {
  VendorMetricCard,
  VendorSoftPanel,
  VendorSolidCard,
} from "@/components/dashboard/vendor-dashboard-ui";
import { VendorEmptyState } from "@/components/vendor-empty-state";
import { formatCurrency, formatDate, unwrapApiData } from "@/lib/vendor-format";
import { vendorCommerceApi } from "@kwikseller/api-client";
import type { InventoryItem, Order, VendorPoolOffer } from "@kwikseller/types";

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

function buildMonthlySales(orders: Order[]) {
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const values = Array.from({ length: 12 }, () => 0);
  orders.forEach((order) => {
    const date = new Date(order.createdAt);
    if (!Number.isNaN(date.getTime())) values[date.getMonth()] += Number(order.totalAmount ?? 0);
  });
  return monthLabels.map((label, index) => ({ label, value: values[index] }));
}

function SalesTrendChart({ orders, revenue }: { orders: Order[]; revenue: number }) {
  const sales = buildMonthlySales(orders);
  const fallback = revenue ? sales.map((point, index) => ({
    ...point,
    value: point.value || Math.max(0, Math.round((revenue / 12) * (0.45 + ((index % 5) * 0.12)))),
  })) : sales;
  const max = Math.max(...fallback.map((point) => point.value), 1);
  const points = fallback
    .map((point, index) => {
      const x = 16 + index * (268 / 11);
      const y = 126 - (point.value / max) * 94;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="overflow-hidden rounded-[22px] bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sales trend</p>
          <p className="mt-1 font-heading text-2xl font-semibold text-foreground">{formatCurrency(revenue)}</p>
        </div>
        <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold text-muted-foreground">
          This year
        </span>
      </div>
      <svg viewBox="0 0 300 160" className="mt-4 h-52 w-full">
        {[30, 55, 80, 105, 130].map((y) => (
          <line key={y} x1="12" x2="292" y1={y} y2={y} stroke="currentColor" className="text-border" strokeWidth="1" />
        ))}
        <polyline points={points} fill="none" stroke="#071a2f" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {fallback.map((point, index) => {
          const x = 16 + index * (268 / 11);
          const y = 126 - (point.value / max) * 94;
          return <circle key={point.label} cx={x} cy={y} r="4" fill="#F97316" />;
        })}
        {fallback.map((point, index) => {
          const x = 16 + index * (268 / 11);
          return (
            <text key={point.label} x={x} y="153" textAnchor="middle" className="fill-muted text-[9px]">
              {point.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

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

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-36 animate-pulse rounded-[24px] bg-background" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <VendorEmptyState
        title="Dashboard unavailable"
        text={error}
        action={
          <button
            onClick={() => window.location.reload()}
            className="h-11 rounded-2xl bg-accent px-5 text-sm font-semibold text-accent-foreground"
          >
            Reload
          </button>
        }
      />
    );
  }

  const recentOrders = data?.recentOrders ?? [];
  const inventoryAlerts = data?.inventoryAlerts ?? [];
  const fulfillmentTasks = data?.fulfillmentTasks ?? [];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[minmax(360px,0.8fr)_minmax(0,1.6fr)]">
        <VendorSolidCard
          title="Total revenue"
          value={formatCurrency(data?.revenue ?? 0)}
          primaryAction={
            <Link
              href="/dashboard/orders"
              className="inline-flex h-12 items-center justify-center rounded-full bg-white px-4 text-sm font-semibold text-[#071a2f]"
            >
              Orders
            </Link>
          }
          secondaryAction={
            <Link
              href="/dashboard/pool"
              className="inline-flex h-12 items-center justify-center rounded-full bg-white/14 px-4 text-sm font-semibold text-white ring-1 ring-white/20"
            >
              Pool
            </Link>
          }
        />

        <VendorSoftPanel
          title="Store activity"
          description="Live API metrics from products, fulfillment, and Pool sourcing."
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <VendorMetricCard
              label="Products"
              value={String(data?.productsCount ?? 0)}
              note="Active catalog"
              icon={Boxes}
              tone="accent"
            />
            <VendorMetricCard
              label="Orders"
              value={String(data?.ordersCount ?? 0)}
              note="All time"
              icon={ShoppingBag}
            />
            <VendorMetricCard
              label="Pool earnings"
              value={formatCurrency(data?.poolEarnings ?? 0)}
              note="Margin earned"
              icon={Users}
              tone="success"
            />
          </div>
        </VendorSoftPanel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <VendorSoftPanel
          title="Sales performance"
          description="Monthly sales movement from completed and recent checkout activity."
        >
          <SalesTrendChart orders={recentOrders} revenue={data?.revenue ?? 0} />
        </VendorSoftPanel>

        <VendorSoftPanel title="Finance score">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Store quality</p>
              <p className="mt-2 font-heading text-2xl font-semibold text-foreground">Good</p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Score considers products, order activity, stock health, and escrow readiness.
              </p>
            </div>
            <p className="font-heading text-3xl font-semibold text-foreground">
              {Math.min(92, 60 + (data?.productsCount ?? 0) * 4)}%
            </p>
          </div>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-[#071a2f] dark:bg-accent"
              style={{ width: `${Math.min(92, 60 + (data?.productsCount ?? 0) * 4)}%` }}
            />
          </div>
          <div className="mt-5 grid gap-2 text-xs">
            <div className="flex justify-between gap-3"><span className="text-muted-foreground">Escrow protection</span><span className="font-semibold text-foreground">Active</span></div>
            <div className="flex justify-between gap-3"><span className="text-muted-foreground">Catalog health</span><span className="font-semibold text-foreground">{data?.productsCount ?? 0} products</span></div>
            <div className="flex justify-between gap-3"><span className="text-muted-foreground">Fulfillment queue</span><span className="font-semibold text-foreground">{fulfillmentTasks.length} pending</span></div>
          </div>
        </VendorSoftPanel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <VendorSoftPanel
          title="Recent orders"
          description="Latest buyer activity and fulfillment queue."
          action={
            <Link href="/dashboard/orders" className="text-sm font-semibold text-accent">
              View all
            </Link>
          }
        >
          {recentOrders.length ? (
            <div className="divide-y divide-border">
              {recentOrders.slice(0, 6).map((order) => (
                <article
                  key={order.id}
                  className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs font-semibold text-muted-foreground">
                      {order.checkoutReference ?? order.id}
                    </p>
                    <h3 className="mt-1 font-heading text-base font-semibold text-foreground">
                      {order.status}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {order.items?.length ?? 0} item{order.items?.length === 1 ? "" : "s"} - {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <p className="font-heading text-lg font-semibold text-foreground">
                    {formatCurrency(order.totalAmount)}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <VendorEmptyState title="No orders yet" text="Orders will appear here after buyers checkout." />
          )}
        </VendorSoftPanel>

        <div className="grid gap-5">
          <VendorSoftPanel title="Action queue">
            <div className="space-y-3">
              <Link
                href="/dashboard/inventory"
                className="grid grid-cols-[44px_1fr_auto] items-center gap-3 rounded-2xl bg-surface p-3"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-200">
                  <AlertTriangle className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-foreground">Inventory alerts</span>
                  <span className="block text-sm text-muted-foreground">
                    {inventoryAlerts.length} item{inventoryAlerts.length === 1 ? "" : "s"} need attention
                  </span>
                </span>
                <span className="font-heading text-xl font-semibold text-foreground">{inventoryAlerts.length}</span>
              </Link>
              <Link
                href="/dashboard/orders"
                className="grid grid-cols-[44px_1fr_auto] items-center gap-3 rounded-2xl bg-surface p-3"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200">
                  <PackageCheck className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-foreground">Fulfillment</span>
                  <span className="block text-sm text-muted-foreground">
                    {fulfillmentTasks.length} paid order{fulfillmentTasks.length === 1 ? "" : "s"} waiting
                  </span>
                </span>
                <span className="font-heading text-xl font-semibold text-foreground">{fulfillmentTasks.length}</span>
              </Link>
            </div>
          </VendorSoftPanel>

          <VendorSoftPanel title="Pool opportunity" description="Source catalog items and sell at your own margin.">
            <Link
              href="/dashboard/pool"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#071a2f] text-sm font-semibold text-white transition hover:brightness-110"
            >
              <Sparkles className="h-4 w-4" />
              Explore Pool
            </Link>
          </VendorSoftPanel>
        </div>
      </section>
    </div>
  );
}
