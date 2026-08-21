"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  ChevronRight,
  CreditCard,
  ExternalLink,
  Package,
  PackageCheck,
  PackageSearch,
  RefreshCw,
  ShoppingBag,
  Truck,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { vendorCommerceApi } from "@/lib/api-client";
import type { InventoryItem, VendorDashboardMetrics } from "@/lib/types";
import { useAuthStore } from "@/lib/utils";
import { formatCurrency, formatDate, unwrapApiData } from "@/lib/vendor-format";
import { cn } from "@/lib/utils";

type VendorDashboardResponse = VendorDashboardMetrics;

type CardTone = "default" | "blue" | "orange";
type ChartDatum = { label: string; value: number };

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function isToday(dateStr: string) {
  const date = new Date(dateStr);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function storeSlug(name?: string, slug?: string) {
  if (slug?.trim()) return slug.trim();
  return (name || "store")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function marketplaceBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_MARKETPLACE_URL ||
    "https://kwikseller-marketplace.vercel.app/"
  ).replace(/\/+$/, "");
}

function formatRelativeTime(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

function statusTone(status: string) {
  const normalized = status.toUpperCase();
  if (["PAID", "CONFIRMED", "DELIVERED", "FULFILLED"].includes(normalized)) {
    return "text-success";
  }
  if (["PROCESSING", "PENDING", "PENDING_PAYMENT", "DRAFT"].includes(normalized)) {
    return "text-warning";
  }
  if (["CANCELLED", "REFUNDED", "FAILED"].includes(normalized)) {
    return "text-danger";
  }
  return "text-muted-foreground";
}

function productLabel(item: InventoryItem) {
  const product = item as InventoryItem & { product?: { name?: string | null } };
  return product.product?.name || item.sku || `Product ${item.productId.slice(0, 8)}`;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-28 animate-pulse rounded-xl border border-border bg-background" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-36 animate-pulse rounded-xl border border-border bg-background" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <div className="h-96 animate-pulse rounded-xl border border-border bg-background" />
        <div className="h-96 animate-pulse rounded-xl border border-border bg-background" />
      </div>
    </div>
  );
}

function SurfaceCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("min-w-0 overflow-hidden rounded-xl border border-border bg-background p-4 md:p-5", className)}>
      {(title || description || action) ? (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            {title ? <h2 className="text-base font-semibold text-foreground">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

function TrendPill({ trend, tone }: { trend: number; tone?: CardTone }) {
  const isNegative = trend < 0;
  const Icon = isNegative ? ArrowDownRight : ArrowUpRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold",
        tone === "blue" || tone === "orange"
          ? "bg-white/15 text-white"
          : isNegative
            ? "bg-danger/10 text-danger"
            : "bg-success/10 text-success",
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
      {Math.abs(trend).toFixed(1)}%
    </span>
  );
}

function KpiCard({
  title,
  value,
  period,
  trend,
  icon: Icon,
  href,
  tone = "default",
}: {
  title: string;
  value: string;
  period: string;
  trend: number;
  icon: LucideIcon;
  href: string;
  tone?: CardTone;
}) {
  const branded = tone === "blue" || tone === "orange";
  const content = (
    <article
      className={cn(
        "h-full rounded-xl border p-4 transition hover:border-accent/45",
        tone === "blue" && "border-kwik-blue bg-kwik-blue text-white",
        tone === "orange" && "border-kwik-orange bg-kwik-orange text-white",
        tone === "default" && "border-border bg-background text-foreground",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            branded ? "bg-white/15 text-white" : "bg-default text-muted-foreground",
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={1.65} />
        </div>
        <TrendPill trend={trend} tone={tone} />
      </div>
      <p className={cn("mt-4 text-sm font-medium", branded ? "text-white/75" : "text-muted-foreground")}>
        {title}
      </p>
      <p className="mt-2 truncate text-2xl font-semibold leading-tight tracking-tight">{value}</p>
      <p className={cn("mt-2 text-xs", branded ? "text-white/70" : "text-muted-foreground")}>
        Compared with {period}
      </p>
    </article>
  );

  return (
    <Link href={href} className="block h-full">
      {content}
    </Link>
  );
}

function MetricChart({
  data,
  color,
  variant = "bar",
}: {
  data: ChartDatum[];
  color: string;
  variant?: "bar" | "area";
}) {
  const gradientId = React.useId().replace(/:/g, "");

  return (
    <div className="h-56 pt-4">
      <ResponsiveContainer width="100%" height="100%">
        {variant === "area" ? (
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.24} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} width={44} allowDecimals={false} />
            <Tooltip
              cursor={{ stroke: color, strokeOpacity: 0.18 }}
              contentStyle={{
                background: "var(--background)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                color: "var(--foreground)",
              }}
            />
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill={`url(#${gradientId})`} />
          </AreaChart>
        ) : (
          <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} width={44} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: "var(--default)" }}
              contentStyle={{
                background: "var(--background)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                color: "var(--foreground)",
              }}
            />
            <Bar dataKey="value" fill={color} radius={[8, 8, 0, 0]} maxBarSize={46} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

function ChartPanel({
  title,
  value,
  caption,
  data,
  color,
  variant,
}: {
  title: string;
  value: string;
  caption: string;
  data: ChartDatum[];
  color: string;
  variant?: "bar" | "area";
}) {
  return (
    <div className="rounded-xl border border-border bg-transparent p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
        </div>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
      <MetricChart data={data} color={color} variant={variant} />
    </div>
  );
}

function QueueItem({
  icon: Icon,
  title,
  detail,
  meta,
  href,
}: {
  icon: LucideIcon;
  title: string;
  detail: string;
  meta?: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-border bg-background p-3 transition hover:border-accent/45"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-transparent text-muted-foreground">
        <Icon className="h-5 w-5" strokeWidth={1.6} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-foreground">{title}</span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{detail}</span>
      </span>
      {meta ? <span className="text-sm font-semibold text-foreground">{meta}</span> : null}
      <ChevronRight className="h-4 w-4 text-muted-foreground" strokeWidth={1.6} />
    </Link>
  );
}

export default function VendorDashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = React.useState<VendorDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let active = true;
    vendorCommerceApi
      .getDashboard()
      .then((response) => {
        if (!active) return;
        setData(unwrapApiData<VendorDashboardResponse>(response.data));
      })
      .catch(() => {
        if (active) setError("Could not load dashboard data.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (isLoading) return <DashboardSkeleton />;

  const recentOrders = data?.recentOrders ?? [];
  const inventoryAlerts = data?.inventoryAlerts ?? [];
  const fulfillmentTasks = data?.fulfillmentTasks ?? [];
  const lowStockItems = inventoryAlerts.filter((item) => item.available <= item.lowStockThreshold);
  const todaysOrders = recentOrders.filter((order) => isToday(order.createdAt));
  const revenue = Number(data?.kpis?.totalRevenue?.value ?? data?.revenue ?? 0);
  const ordersCount = Number(data?.kpis?.totalOrders?.value ?? data?.ordersCount ?? 0);
  const productsCount = Number(data?.kpis?.activeProducts?.value ?? data?.productsCount ?? 0);
  const walletBalance = Number(data?.wallet?.currentBalance ?? data?.kpis?.walletBalance?.value ?? 0);
  const availableBalance = Number(data?.wallet?.availableBalance ?? data?.kpis?.availableBalance?.value ?? 0);
  const pendingSettlement = Number(data?.wallet?.pendingBalance ?? data?.kpis?.pendingSettlement?.value ?? 0);
  const withdrawnAmount = Number(data?.wallet?.totalWithdrawn ?? 0);

  const store = user?.store;
  const vendorName = user?.profile?.firstName || store?.name || user?.email?.split("@")[0] || "Vendor";
  const storeName = store?.name || "My Store";
  const storeStatus = store?.isVerified ? "Verified" : "Pending verification";
  const slug = storeSlug(store?.name, store?.slug);
  const storeUrl = `${marketplaceBaseUrl()}/vendor/${slug}`;

  const revenueTrend = data?.analytics?.revenueTrend ?? [];
  const orderVolume = data?.analytics?.orderVolume ?? [];
  const settlementHistory = data?.analytics?.settlementHistory ?? [];
  const cashFlow = data?.analytics?.cashFlow ?? [];

  const latestTransactions = recentOrders.slice(0, 5);
  const notifications = [
    `${fulfillmentTasks.length} orders need fulfillment review`,
    lowStockItems.length > 0
      ? `${lowStockItems.length} products are below stock threshold`
      : "Inventory health is stable",
    todaysOrders.length > 0
      ? `${todaysOrders.length} new orders came in today`
      : "No new checkout activity yet today",
  ];

  if (error) {
    return (
      <SurfaceCard>
        <div className="flex min-h-80 flex-col items-center justify-center text-center">
          <PackageSearch className="h-12 w-12 text-muted-foreground" strokeWidth={1.5} />
          <h1 className="mt-4 text-lg font-semibold text-foreground">Dashboard unavailable</h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-kwik-blue px-4 text-sm font-semibold text-white"
          >
            <RefreshCw className="h-4 w-4" strokeWidth={1.6} />
            Reload dashboard
          </button>
        </div>
      </SurfaceCard>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="space-y-5"
    >
      <section className="flex flex-col gap-4 rounded-xl border border-border bg-background p-4 md:flex-row md:items-center md:justify-between md:p-5">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {getGreeting()}, {vendorName}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Vendor business overview
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {storeName} · {storeStatus} · Track finance, orders, settlements, and inventory from one control center.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:border-accent/45"
          >
            <RefreshCw className="h-4 w-4" strokeWidth={1.6} />
            Refresh
          </button>
          <a
            href={storeUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-kwik-blue px-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            View public store
            <ExternalLink className="h-4 w-4" strokeWidth={1.6} />
          </a>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <KpiCard title="Wallet Balance" value={formatCurrency(walletBalance)} period={data?.kpis?.walletBalance?.period ?? "this month"} trend={data?.kpis?.walletBalance?.trend ?? 0} icon={Wallet} href="/dashboard/wallet" tone="blue" />
        <KpiCard title="Available Balance" value={formatCurrency(availableBalance)} period={data?.kpis?.availableBalance?.period ?? "this week"} trend={data?.kpis?.availableBalance?.trend ?? 0} icon={CreditCard} href="/dashboard/wallet" />
        <KpiCard title="Pending Settlement" value={formatCurrency(pendingSettlement)} period={data?.kpis?.pendingSettlement?.period ?? "today"} trend={data?.kpis?.pendingSettlement?.trend ?? 0} icon={CalendarDays} href="/dashboard/wallet" tone="orange" />
        <KpiCard title="Total Revenue" value={formatCurrency(revenue)} period={data?.kpis?.totalRevenue?.period ?? "this month"} trend={data?.kpis?.totalRevenue?.trend ?? 0} icon={BarChart3} href="/dashboard/analytics" />
        <KpiCard title="Total Orders" value={String(ordersCount)} period={data?.kpis?.totalOrders?.period ?? "this month"} trend={data?.kpis?.totalOrders?.trend ?? 0} icon={ShoppingBag} href="/dashboard/orders" />
        <KpiCard title="Active Products" value={String(productsCount)} period={data?.kpis?.activeProducts?.period ?? "this month"} trend={data?.kpis?.activeProducts?.trend ?? 0} icon={Package} href="/dashboard/products" />
      </section>

      <section>
        <SurfaceCard
          title="Wallet Analytics"
          description="Financial position, settlements, withdrawals, and monthly cash flow."
          action={<Link href="/dashboard/wallet" className="text-sm font-semibold text-accent">Open wallet</Link>}
        >
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-transparent p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current Balance</p>
              <p className="mt-2 text-xl font-semibold text-foreground">{formatCurrency(walletBalance)}</p>
            </div>
            <div className="rounded-xl border border-border bg-transparent p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pending Balance</p>
              <p className="mt-2 text-xl font-semibold text-foreground">{formatCurrency(pendingSettlement)}</p>
            </div>
            <div className="rounded-xl border border-border bg-transparent p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Withdrawn Amount</p>
              <p className="mt-2 text-xl font-semibold text-foreground">{formatCurrency(withdrawnAmount)}</p>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-border bg-transparent p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Monthly Cash Flow</p>
              <TrendPill trend={9.6} />
            </div>
            <MetricChart data={cashFlow} color="var(--kwik-orange)" variant="area" />
          </div>
        </SurfaceCard>
      </section>

      <section className="grid min-w-0 max-w-full gap-4 overflow-hidden xl:grid-cols-[1.7fr_1fr]">
        <SurfaceCard
          title="Analytics"
          description="Revenue, order volume, and settlement movement across the active period."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartPanel title="Revenue Trend" value={formatCurrency(revenue)} caption="Monthly paid order value" data={revenueTrend} color="var(--kwik-blue)" />
            <ChartPanel title="Order Volume" value={String(ordersCount)} caption="Completed checkout volume" data={orderVolume} color="var(--success)" />
            <div className="lg:col-span-2">
              <ChartPanel title="Settlement History" value={formatCurrency(pendingSettlement)} caption="Funds awaiting settlement release" data={settlementHistory} color="var(--kwik-orange)" variant="area" />
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard
          title="Operations Queue"
          description="The work that most needs attention right now."
        >
          <div className="space-y-3">
            <QueueItem
              icon={CreditCard}
              title="Recent Transactions"
              detail={latestTransactions.length ? "Latest paid order activity" : "No transactions yet"}
              meta={String(latestTransactions.length)}
              href="/dashboard/wallet"
            />
            <QueueItem
              icon={AlertTriangle}
              title="Low Stock Products"
              detail={lowStockItems.length ? "Products below threshold" : "No low stock alerts"}
              meta={String(lowStockItems.length)}
              href="/dashboard/inventory"
            />
            <QueueItem
              icon={Truck}
              title="Pending Orders"
              detail="Paid orders awaiting fulfillment"
              meta={String(fulfillmentTasks.length)}
              href="/dashboard/orders"
            />
            <QueueItem
              icon={Activity}
              title="Customer Activity"
              detail={todaysOrders.length ? "New buyer checkout activity today" : "No new buyer activity today"}
              meta={String(todaysOrders.length)}
              href="/dashboard/orders"
            />
          </div>
        </SurfaceCard>
      </section>

      <section className="grid min-w-0 max-w-full gap-4 overflow-hidden xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <SurfaceCard
          title="Recent Orders"
          description="Newest buyer checkout activity and fulfillment state."
          action={
            <Link href="/dashboard/orders" className="inline-flex items-center gap-1 text-sm font-semibold text-accent">
              View all
              <ArrowRight className="h-4 w-4" strokeWidth={1.6} />
            </Link>
          }
        >
          {recentOrders.length ? (
            <div className="w-full min-w-0 overflow-hidden">
              <table className="w-full table-fixed text-left">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="w-[58%] py-3 pr-3 font-semibold sm:w-[36%]">Order</th>
                    <th className="w-[42%] py-3 text-right font-semibold sm:w-[18%] sm:pr-3">Amount</th>
                    <th className="hidden py-3 pr-3 font-semibold sm:table-cell sm:w-[18%]">Status</th>
                    <th className="hidden py-3 pr-3 font-semibold md:table-cell md:w-[18%]">Date</th>
                    <th className="hidden py-3 text-right font-semibold md:table-cell md:w-[10%]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentOrders.slice(0, 7).map((order) => (
                    <tr key={order.id} className="text-sm">
                      <td className="min-w-0 py-3 pr-3">
                        <span className="block truncate font-mono text-xs text-muted-foreground">
                          {order.checkoutReference ?? order.id.slice(0, 12)}
                        </span>
                      </td>
                      <td className="py-3 text-right font-semibold text-foreground sm:pr-3">{formatCurrency(order.totalAmount)}</td>
                      <td className="hidden py-3 pr-3 sm:table-cell">
                        <span className={cn("font-medium", statusTone(order.status))}>{formatStatus(order.status)}</span>
                      </td>
                      <td className="hidden py-3 pr-3 text-muted-foreground md:table-cell">{formatDate(order.createdAt)}</td>
                      <td className="hidden py-3 text-right md:table-cell">
                        <Link href={`/dashboard/orders/${order.id}`} className="font-semibold text-accent">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border text-center">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" strokeWidth={1.5} />
              <p className="mt-3 text-sm text-muted-foreground">Orders will appear here after buyers checkout.</p>
            </div>
          )}
        </SurfaceCard>

        <div className="min-w-0 max-w-full space-y-4 overflow-hidden">
          <SurfaceCard title="Latest Transactions">
            <div className="space-y-3">
              {latestTransactions.length ? (
                latestTransactions.map((order) => (
                  <Link
                    href={`/dashboard/orders/${order.id}`}
                    key={order.id}
                    className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 overflow-hidden rounded-xl border border-border p-3 transition hover:border-accent/45"
                  >
                    <span className="flex min-w-0 items-center gap-3 overflow-hidden">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
                        <PackageCheck className="h-4 w-4" strokeWidth={1.6} />
                      </span>
                      <span className="min-w-0 overflow-hidden">
                        <span className="block truncate text-sm font-semibold text-foreground">
                          {order.checkoutReference ?? order.id.slice(0, 10)}
                        </span>
                        <span className="text-xs text-muted-foreground">{formatRelativeTime(order.createdAt)}</span>
                      </span>
                    </span>
                    <span className="shrink-0 text-right text-sm font-semibold text-foreground">{formatCurrency(order.totalAmount)}</span>
                  </Link>
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Transactions will appear when paid orders are confirmed.
                </p>
              )}
            </div>
          </SurfaceCard>

          <SurfaceCard title="Vendor Notifications">
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div key={notification} className="flex min-w-0 items-start gap-3 overflow-hidden rounded-xl border border-border p-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-kwik-orange" />
                  <p className="min-w-0 break-words text-sm text-muted-foreground">{notification}</p>
                </div>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard
            title="Inventory Alerts"
            action={<Link href="/dashboard/inventory" className="text-sm font-semibold text-accent">Manage</Link>}
          >
            <div className="space-y-3">
              {lowStockItems.length ? (
                lowStockItems.slice(0, 4).map((item) => (
                  <div key={item.id} className="flex min-w-0 items-center justify-between gap-3 overflow-hidden rounded-xl border border-border p-3">
                    <span className="min-w-0 overflow-hidden">
                      <span className="block truncate text-sm font-semibold text-foreground">{productLabel(item)}</span>
                      <span className="text-xs text-muted-foreground">Threshold: {item.lowStockThreshold}</span>
                    </span>
                    <span className="shrink-0 rounded-full bg-warning/10 px-2 py-1 text-xs font-semibold text-warning">
                      {item.available} left
                    </span>
                  </div>
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Inventory is healthy. Low stock products will be flagged here.
                </p>
              )}
            </div>
          </SurfaceCard>
        </div>
      </section>
    </motion.div>
  );
}
