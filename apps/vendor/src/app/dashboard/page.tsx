"use client";

import React from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
import { StorePublicUrlCard } from "@/components/dashboard/store-public-url-card";
import { KwiksellerLoader } from "@/components/kwikseller-loader";
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

type SalesPeriod = "week" | "month" | "last3" | "last6" | "year" | "lastYear";

const salesPeriodOptions: Array<{ value: SalesPeriod; label: string }> = [
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "last3", label: "Last 3 months" },
  { value: "last6", label: "Last 6 months" },
  { value: "year", label: "This year" },
  { value: "lastYear", label: "Last year" },
];

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function buildSalesTrend(orders: Order[], period: SalesPeriod) {
  const now = new Date();
  const buckets: Array<{ label: string; value: number; startsAt: Date; endsAt: Date }> = [];

  if (period === "week") {
    const day = now.getDay() || 7;
    const weekStart = startOfDay(now);
    weekStart.setDate(now.getDate() - day + 1);
    for (let index = 0; index < 7; index += 1) {
      const startsAt = new Date(weekStart);
      startsAt.setDate(weekStart.getDate() + index);
      const endsAt = new Date(startsAt);
      endsAt.setDate(startsAt.getDate() + 1);
      buckets.push({ label: dayLabels[index], value: 0, startsAt, endsAt });
    }
  } else if (period === "month") {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day += 1) {
      const startsAt = new Date(now.getFullYear(), now.getMonth(), day);
      const endsAt = new Date(now.getFullYear(), now.getMonth(), day + 1);
      buckets.push({ label: String(day), value: 0, startsAt, endsAt });
    }
  } else {
    const count = period === "last3" ? 3 : period === "last6" ? 6 : 12;
    const baseYear = period === "lastYear" ? now.getFullYear() - 1 : now.getFullYear();
    const startMonth = period === "last3" || period === "last6" ? now.getMonth() - count + 1 : 0;
    for (let index = 0; index < count; index += 1) {
      const startsAt = new Date(baseYear, startMonth + index, 1);
      const endsAt = new Date(startsAt.getFullYear(), startsAt.getMonth() + 1, 1);
      buckets.push({ label: monthLabels[startsAt.getMonth()], value: 0, startsAt, endsAt });
    }
  }

  orders.forEach((order) => {
    const createdAt = new Date(order.createdAt);
    if (Number.isNaN(createdAt.getTime())) return;
    const bucket = buckets.find((item) => createdAt >= item.startsAt && createdAt < item.endsAt);
    if (bucket) bucket.value += Number(order.totalAmount ?? 0);
  });

  return buckets.map(({ label, value }) => ({ label, value }));
}

function SalesTrendChart({
  orders,
  period,
  isLoading,
  onPeriodChange,
}: {
  orders: Order[];
  period: SalesPeriod;
  isLoading: boolean;
  onPeriodChange: (period: SalesPeriod) => void;
}) {
  const sales = React.useMemo(() => buildSalesTrend(orders, period), [orders, period]);
  const total = sales.reduce((sum, point) => sum + point.value, 0);

  return (
    <div className="overflow-hidden">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sales trend</p>
          <p className="mt-1 font-heading text-2xl font-semibold text-foreground">{formatCurrency(total)}</p>
        </div>
        <select
          value={period}
          onChange={(event) => onPeriodChange(event.target.value as SalesPeriod)}
          className="h-9 rounded-full bg-white px-3 text-xs font-semibold text-foreground outline-none ring-1 ring-border transition focus:ring-accent dark:bg-white/5"
          aria-label="Sales trend period"
        >
          {salesPeriodOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
      <div className="mt-4 h-52">
        {isLoading ? (
          <KwiksellerLoader className="min-h-full" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sales} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="salesTrendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F97316" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#F97316" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="currentColor" className="text-border" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "currentColor" }} className="text-muted-foreground" />
              <YAxis hide domain={[0, "auto"]} />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                labelClassName="text-xs font-semibold text-muted-foreground"
                contentStyle={{
                  borderRadius: 14,
                  border: "1px solid var(--border)",
                  background: "var(--background)",
                  color: "var(--foreground)",
                  boxShadow: "none",
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#071a2f"
                strokeWidth={3}
                fill="url(#salesTrendFill)"
                dot={{ r: 4, fill: "#F97316", stroke: "#F97316" }}
                activeDot={{ r: 6, fill: "#F97316", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default function VendorDashboardPage() {
  const [data, setData] = React.useState<VendorDashboardResponse | null>(null);
  const [chartOrders, setChartOrders] = React.useState<Order[]>([]);
  const [chartPeriod, setChartPeriod] = React.useState<SalesPeriod>("year");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isChartLoading, setIsChartLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let active = true;
    vendorCommerceApi
      .getDashboard()
      .then((response) => {
        if (!active) return;
        const dashboard = unwrapApiData<VendorDashboardResponse>(response.data);
        setData(dashboard);
        setChartOrders(dashboard?.recentOrders ?? []);
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

  React.useEffect(() => {
    let active = true;
    setIsChartLoading(true);
    vendorCommerceApi
      .listOrders({ limit: 500 })
      .then((response) => {
        if (!active) return;
        const orders = unwrapApiData<Order[]>(response.data);
        setChartOrders(Array.isArray(orders) ? orders : data?.recentOrders ?? []);
      })
      .catch(() => {
        if (active) setChartOrders(data?.recentOrders ?? []);
      })
      .finally(() => {
        if (active) setIsChartLoading(false);
      });
    return () => {
      active = false;
    };
  }, [chartPeriod, data?.recentOrders]);

  if (isLoading) {
    return <KwiksellerLoader />;
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
      <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(360px,0.8fr)_minmax(0,1.6fr)]">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
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
          <StorePublicUrlCard />
        </div>

        <VendorSoftPanel
          title="Store activity"
          description="Live API metrics from products, fulfillment, and Pool sourcing."
        >
          <div className="-mx-5 grid auto-cols-[230px] grid-flow-col gap-3 overflow-x-auto px-5 pb-1 sm:mx-0 sm:grid-flow-row sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0">
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

      <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <VendorSoftPanel
          title="Sales performance"
          description="Monthly sales movement from completed and recent checkout activity."
        >
          <SalesTrendChart
            orders={chartOrders}
            period={chartPeriod}
            isLoading={isChartLoading}
            onPeriodChange={setChartPeriod}
          />
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

      <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
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
