"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Users,
  Package,
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";
import { AppButton, Skeleton, VendorMetricCard, VendorPageHeader } from "@kwikseller/ui";
import { formatCurrency, formatDate, unwrapApiData } from "@/lib/vendor-format";
import { vendorCommerceApi } from "@kwikseller/api-client";

// ==================== Types ====================

type DateRange = "today" | "7d" | "30d" | "90d" | "year" | "custom";

type AnalyticsOverview = {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  conversionRate: number;
  returningCustomers: number;
  topProduct: { name: string; unitsSold: number } | null;
  revenueOverTime: { date: string; revenue: number }[];
  ordersOverTime: { date: string; orders: number }[];
  salesByCategory: { category: string; amount: number; percentage: number }[];
  trafficSources: { source: string; visits: number; percentage: number }[];
  topProducts: {
    rank: number;
    name: string;
    unitsSold: number;
    revenue: number;
    views: number;
    conversion: number;
  }[];
  recentOrders: {
    id: string;
    customer: string;
    amount: number;
    status: string;
    date: string;
  }[];
};

type VendorDashboardLive = {
  revenue?: number;
  ordersCount?: number;
  productsCount?: number;
  recentOrders?: Array<{
    id?: string;
    checkoutReference?: string;
    totalAmount?: number | string;
    status?: string;
    createdAt?: string;
    customer?: { name?: string; email?: string };
    user?: { name?: string; email?: string };
  }>;
};

// ==================== Demo Data ====================

const DEMO_DATA: AnalyticsOverview = {
  totalRevenue: 4850000,
  totalOrders: 342,
  averageOrderValue: 14181,
  conversionRate: 4.7,
  returningCustomers: 28,
  topProduct: { name: "Wireless Earbuds Pro", unitsSold: 87 },
  revenueOverTime: [
    { date: "2025-01-01", revenue: 320000 },
    { date: "2025-01-08", revenue: 410000 },
    { date: "2025-01-15", revenue: 380000 },
    { date: "2025-01-22", revenue: 520000 },
    { date: "2025-01-29", revenue: 490000 },
    { date: "2025-02-05", revenue: 450000 },
    { date: "2025-02-12", revenue: 610000 },
    { date: "2025-02-19", revenue: 580000 },
    { date: "2025-02-26", revenue: 540000 },
    { date: "2025-03-05", revenue: 670000 },
    { date: "2025-03-12", revenue: 710000 },
    { date: "2025-03-19", revenue: 650000 },
  ],
  ordersOverTime: [
    { date: "2025-01-01", orders: 22 },
    { date: "2025-01-08", orders: 28 },
    { date: "2025-01-15", orders: 25 },
    { date: "2025-01-22", orders: 35 },
    { date: "2025-01-29", orders: 31 },
    { date: "2025-02-05", orders: 29 },
    { date: "2025-02-12", orders: 40 },
    { date: "2025-02-19", orders: 38 },
    { date: "2025-02-26", orders: 35 },
    { date: "2025-02-26", orders: 35 },
    { date: "2025-03-05", orders: 44 },
    { date: "2025-03-12", orders: 47 },
    { date: "2025-03-19", orders: 43 },
  ],
  salesByCategory: [
    { category: "Electronics", amount: 2100000, percentage: 43 },
    { category: "Fashion", amount: 1350000, percentage: 28 },
    { category: "Home & Living", amount: 780000, percentage: 16 },
    { category: "Health & Beauty", amount: 420000, percentage: 9 },
    { category: "Others", amount: 200000, percentage: 4 },
  ],
  trafficSources: [
    { source: "Direct", visits: 12400, percentage: 38 },
    { source: "Marketplace", visits: 8700, percentage: 27 },
    { source: "Social Media", visits: 6100, percentage: 19 },
    { source: "Search", visits: 3800, percentage: 12 },
    { source: "Referral", visits: 1500, percentage: 4 },
  ],
  topProducts: [
    { rank: 1, name: "Wireless Earbuds Pro", unitsSold: 87, revenue: 2610000, views: 3420, conversion: 2.54 },
    { rank: 2, name: "Phone Case Premium", unitsSold: 64, revenue: 384000, views: 2810, conversion: 2.28 },
    { rank: 3, name: "Laptop Stand Adjustable", unitsSold: 45, revenue: 675000, views: 1950, conversion: 2.31 },
    { rank: 4, name: "USB-C Hub 7-in-1", unitsSold: 38, revenue: 494000, views: 1670, conversion: 2.28 },
    { rank: 5, name: "Bluetooth Speaker Mini", unitsSold: 32, revenue: 448000, views: 1520, conversion: 2.11 },
  ],
  recentOrders: [
    { id: "ORD-90421", customer: "Adebayo T.", amount: 45000, status: "COMPLETED", date: "2025-03-19T14:30:00Z" },
    { id: "ORD-90420", customer: "Chioma N.", amount: 12800, status: "PROCESSING", date: "2025-03-19T13:15:00Z" },
    { id: "ORD-90419", customer: "Emeka O.", amount: 27500, status: "COMPLETED", date: "2025-03-19T12:40:00Z" },
    { id: "ORD-90418", customer: "Fatima B.", amount: 8900, status: "PENDING", date: "2025-03-19T11:20:00Z" },
    { id: "ORD-90417", customer: "Ibrahim K.", amount: 63200, status: "COMPLETED", date: "2025-03-19T10:05:00Z" },
    { id: "ORD-90416", customer: "Blessing A.", amount: 15700, status: "PROCESSING", date: "2025-03-19T09:30:00Z" },
    { id: "ORD-90415", customer: "Yusuf M.", amount: 21000, status: "COMPLETED", date: "2025-03-18T17:45:00Z" },
    { id: "ORD-90414", customer: "Ngozi E.", amount: 34800, status: "CANCELLED", date: "2025-03-18T16:20:00Z" },
    { id: "ORD-90413", customer: "Tunde S.", amount: 19200, status: "COMPLETED", date: "2025-03-18T15:10:00Z" },
    { id: "ORD-90412", customer: "Amina D.", amount: 5600, status: "PENDING", date: "2025-03-18T14:00:00Z" },
  ],
};

// ==================== Date Range Options ====================

const DATE_RANGES: { id: DateRange; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 Days" },
  { id: "30d", label: "Last 30 Days" },
  { id: "90d", label: "Last 90 Days" },
  { id: "year", label: "This Year" },
  { id: "custom", label: "Custom" },
];

function getDateParams(range: DateRange, customFrom?: string, customTo?: string) {
  const now = new Date();
  const from = new Date();
  switch (range) {
    case "today":
      from.setHours(0, 0, 0, 0);
      return { from: from.toISOString(), to: now.toISOString() };
    case "7d":
      from.setDate(from.getDate() - 7);
      return { from: from.toISOString(), to: now.toISOString() };
    case "30d":
      from.setDate(from.getDate() - 30);
      return { from: from.toISOString(), to: now.toISOString() };
    case "90d":
      from.setDate(from.getDate() - 90);
      return { from: from.toISOString(), to: now.toISOString() };
    case "year":
      from.setMonth(0, 1);
      from.setHours(0, 0, 0, 0);
      return { from: from.toISOString(), to: now.toISOString() };
    case "custom":
      return {
        from: customFrom ? new Date(customFrom).toISOString() : now.toISOString(),
        to: customTo ? new Date(customTo).toISOString() : now.toISOString(),
      };
  }
}

// ==================== Helpers ====================

const ANALYTICS_DEMO_KEY = "kwikseller_analytics_demo";

function loadDemoData(): AnalyticsOverview | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ANALYTICS_DEMO_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveDemoData(data: AnalyticsOverview) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ANALYTICS_DEMO_KEY, JSON.stringify(data));
}

function getOrderStatusColor(status: string) {
  switch (status) {
    case "COMPLETED":
      return "text-green-600";
    case "PROCESSING":
      return "text-yellow-600";
    case "PENDING":
      return "text-muted-foreground";
    case "CANCELLED":
      return "text-red-600";
    case "DELIVERED":
      return "text-green-600";
    default:
      return "text-muted-foreground";
  }
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

function mapDashboardToAnalytics(dashboard: VendorDashboardLive): AnalyticsOverview {
  const orders = dashboard.recentOrders ?? [];
  const totalRevenue =
    Number(dashboard.revenue ?? 0) ||
    orders.reduce((sum, order) => sum + Number(order.totalAmount ?? 0), 0);
  const totalOrders = Number(dashboard.ordersCount ?? orders.length);
  const orderBuckets = new Map<string, { revenue: number; orders: number }>();

  orders.forEach((order) => {
    const key = order.createdAt
      ? new Date(order.createdAt).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);
    const current = orderBuckets.get(key) ?? { revenue: 0, orders: 0 };
    current.revenue += Number(order.totalAmount ?? 0);
    current.orders += 1;
    orderBuckets.set(key, current);
  });

  const timeline = [...orderBuckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12);

  return {
    totalRevenue,
    totalOrders,
    averageOrderValue: totalOrders ? totalRevenue / totalOrders : 0,
    conversionRate: 0,
    returningCustomers: 0,
    topProduct: null,
    revenueOverTime: timeline.map(([date, value]) => ({ date, revenue: value.revenue })),
    ordersOverTime: timeline.map(([date, value]) => ({ date, orders: value.orders })),
    salesByCategory: [],
    trafficSources: [],
    topProducts: [],
    recentOrders: orders.slice(0, 10).map((order) => ({
      id: order.checkoutReference || order.id || "Order",
      customer: order.customer?.name || order.customer?.email || order.user?.name || order.user?.email || "Customer",
      amount: Number(order.totalAmount ?? 0),
      status: order.status || "PENDING",
      date: order.createdAt || new Date().toISOString(),
    })),
  };
}

// ==================== Main Component ====================

export default function AnalyticsPage() {
  // Date range state
  const [dateRange, setDateRange] = React.useState<DateRange>("30d");
  const [customFrom, setCustomFrom] = React.useState("");
  const [customTo, setCustomTo] = React.useState("");

  // Data state
  const [data, setData] = React.useState<AnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDemo, setIsDemo] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch data
  const fetchAnalytics = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = getDateParams(dateRange, customFrom, customTo);
      const response = await vendorCommerceApi.getDashboard();
      const apiData = unwrapApiData<VendorDashboardLive>(response.data);
      void params;

      if (apiData) {
        setData(mapDashboardToAnalytics(apiData));
        setIsDemo(false);
      } else {
        throw new Error("No analytics data");
      }
    } catch (fetchError) {
      setData(null);
      setIsDemo(false);
      setError(fetchError instanceof Error ? fetchError.message : "Could not load live analytics");
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, customFrom, customTo]);

  // Initial fetch
  React.useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Page Header */}
      <VendorPageHeader
        title="Analytics"
        description="Live store metrics and sales trends."
        actions={
          <AppButton
            variant="secondary"
            size="sm"
            onClick={fetchAnalytics}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </AppButton>
        }
      />

      {/* Date Range Selector */}
      <section>
        <div className="flex flex-wrap items-center gap-2">
          {DATE_RANGES.map((range) => (
            <button
              key={range.id}
              type="button"
              onClick={() => setDateRange(range.id)}
              className={`inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium transition ${
                dateRange === range.id
                  ? "border-foreground bg-foreground text-background"
                  : "border-kwik-border bg-surface text-foreground hover:border-accent hover:bg-default-100"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        {/* Custom Date Range Inputs */}
        {dateRange === "custom" && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="date-from" className="text-xs text-muted-foreground">
                From
              </label>
              <input
                id="date-from"
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="h-9 rounded-md border border-kwik-border px-3 text-sm text-foreground outline-none focus:border-accent"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="date-to" className="text-xs text-muted-foreground">
                To
              </label>
              <input
                id="date-to"
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="h-9 rounded-md border border-kwik-border px-3 text-sm text-foreground outline-none focus:border-accent"
              />
            </div>
          </div>
        )}
      </section>

      {/* Demo Data Notice */}
      {isDemo && !isLoading && (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" strokeWidth={1.5} />
          <p className="text-xs text-amber-700">
            Demo data — connect analytics backend for real metrics.
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !data ? (
        <div className="space-y-8">
          {/* Metrics skeleton */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2 p-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
          {/* Chart skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      ) : error && !data ? (
        <div className="flex flex-col items-center justify-center py-16">
          <BarChart3 className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />
          <p className="mt-3 text-sm font-medium text-muted-foreground">{error}</p>
          <AppButton
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={fetchAnalytics}
          >
            Try Again
          </AppButton>
        </div>
      ) : data ? (
        <div className="space-y-0 divide-y divide-kwik-border">
          {/* ==================== Key Metrics ==================== */}
          <section className="pb-8 pt-2 first:pt-0">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {/* Total Revenue */}
              <MetricBlock
                label="Total Revenue"
                value={formatCurrency(data.totalRevenue)}
                icon={DollarSign}
                subtext="Revenue from live orders in the selected period."
                tone="accent"
              />

              {/* Total Orders */}
              <MetricBlock
                label="Total Orders"
                value={String(data.totalOrders)}
                icon={ShoppingCart}
                subtext="Total orders recorded in the selected period."
                tone="neutral"
              />

              {/* Average Order Value */}
              <MetricBlock
                label="Avg. Order Value"
                value={formatCurrency(data.averageOrderValue)}
                icon={TrendingUp}
                subtext="Average paid value across recent orders."
                tone="success"
              />

              {/* Conversion Rate */}
              <MetricBlock
                label="Conversion Rate"
                value={`${data.conversionRate}%`}
                icon={ArrowUpRight}
                subtext="Visitor-to-purchase rate when available."
                tone="brand"
              />

              {/* Returning Customers */}
              <MetricBlock
                label="Returning Customers"
                value={`${data.returningCustomers}%`}
                icon={Users}
                subtext="Repeat buyer share when customer data exists."
                tone="success"
              />

              {/* Top Product */}
              <VendorMetricCard
                title="Top Selling Product"
                value={data.topProduct ? data.topProduct.name : "None"}
                description={data.topProduct ? `${data.topProduct.unitsSold} units sold in this period.` : "No top product yet from live sales."}
                icon={Package}
              />
            </div>
          </section>

          {/* ==================== Revenue Over Time (Bar Chart) ==================== */}
          <section className="py-8">
            <h2 className="text-base font-semibold text-foreground">
              Revenue Over Time
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Weekly revenue breakdown for the selected period.
            </p>
            <div className="mt-4">
              <BarChart data={data.revenueOverTime} formatValue={formatCurrency} />
            </div>
          </section>

          {/* ==================== Orders Over Time (Horizontal) ==================== */}
          <section className="py-8">
            <h2 className="text-base font-semibold text-foreground">
              Orders Over Time
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Weekly order volume for the selected period.
            </p>
            <div className="mt-4">
              <HorizontalBarChart data={data.ordersOverTime} />
            </div>
          </section>

          {/* ==================== Sales by Category ==================== */}
          <section className="py-8">
            <h2 className="text-base font-semibold text-foreground">
              Sales by Category
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Revenue distribution across product categories.
            </p>
            <div className="mt-4 space-y-3">
              {data.salesByCategory.map((cat) => (
                <div key={cat.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{cat.category}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {formatCurrency(cat.amount)} ({cat.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-default-100">
                    <div
                      className="h-full rounded-full bg-foreground transition-all duration-500"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ==================== Traffic Sources ==================== */}
          <section className="py-8">
            <h2 className="text-base font-semibold text-foreground">
              Traffic Sources
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Where your store visitors are coming from.
            </p>
            <div className="mt-4 space-y-3">
              {data.trafficSources.map((src) => (
                <div key={src.source} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{src.source}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {src.visits.toLocaleString()} visits ({src.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-default-100">
                    <div
                      className="h-full rounded-full bg-muted-foreground transition-all duration-500"
                      style={{ width: `${src.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ==================== Top Products Table ==================== */}
          <section className="py-8">
            <h2 className="text-base font-semibold text-foreground">
              Top Products
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Best performing products by units sold.
            </p>
            <div className="mt-4">
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-kwik-border">
                      <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Rank
                      </th>
                      <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Product
                      </th>
                      <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground text-right">
                        Units Sold
                      </th>
                      <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground text-right">
                        Revenue
                      </th>
                      <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground text-right">
                        Views
                      </th>
                      <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground text-right">
                        Conversion
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topProducts.map((product) => (
                      <tr
                        key={product.rank}
                        className="border-b border-kwik-border transition-colors last:border-b-0 hover:bg-default-100/50"
                      >
                        <td className="px-4 py-4 font-mono text-xs text-muted-foreground">
                          #{product.rank}
                        </td>
                        <td className="px-4 py-4 font-medium text-foreground">
                          {product.name}
                        </td>
                        <td className="px-4 py-4 text-right font-mono text-sm text-foreground">
                          {product.unitsSold}
                        </td>
                        <td className="px-4 py-4 text-right font-mono text-sm text-foreground">
                          {formatCurrency(product.revenue)}
                        </td>
                        <td className="px-4 py-4 text-right font-mono text-sm text-muted-foreground">
                          {product.views.toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-right font-mono text-sm text-foreground">
                          {product.conversion}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="space-y-0 divide-y divide-kwik-border sm:hidden">
                {data.topProducts.map((product) => (
                  <div key={product.rank} className="px-1 py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">#{product.rank}</span>
                        <p className="text-sm font-medium text-foreground">{product.name}</p>
                      </div>
                      <p className="font-mono text-sm font-medium text-foreground">
                        {formatCurrency(product.revenue)}
                      </p>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{product.unitsSold} sold</span>
                      <span className="text-muted-foreground/50">|</span>
                      <span>{product.views.toLocaleString()} views</span>
                      <span className="text-muted-foreground/50">|</span>
                      <span>{product.conversion}% conv.</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ==================== Recent Orders Feed ==================== */}
          <section className="py-8">
            <h2 className="text-base font-semibold text-foreground">
              Recent Orders
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Latest orders across your store.
            </p>
            <div className="mt-4">
              <div className="divide-y divide-kwik-border">
                {data.recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between gap-3 px-1 py-3 transition-colors hover:bg-default-100/50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-default-100">
                        <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-xs text-muted-foreground">{order.id}</p>
                          <p className="text-sm text-foreground">{order.customer}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{formatDate(order.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <p className="font-mono text-sm font-medium text-foreground">
                        {formatCurrency(order.amount)}
                      </p>
                      <span className={`text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </motion.div>
  );
}

// ==================== Sub-Components ====================

function MetricBlock({
  label,
  value,
  icon: Icon,
  subtext,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  subtext?: string;
  tone: "brand" | "accent" | "success" | "warning" | "danger" | "neutral";
}) {
  return (
    <VendorMetricCard
      title={label}
      value={value}
      icon={Icon}
      description={subtext ?? ""}
    />
  );
}

function BarChart({
  data,
  formatValue,
}: {
  data: { date: string; revenue: number }[];
  formatValue: (n: number) => string;
}) {
  const maxRevenue = React.useMemo(
    () => Math.max(...data.map((d) => d.revenue), 1),
    [data]
  );

  return (
    <div className="space-y-3">
      {/* Y-axis labels + bars */}
      <div className="flex items-end gap-1" style={{ height: "180px" }}>
        {data.map((item, i) => {
          const height = (item.revenue / maxRevenue) * 100;
          return (
            <div
              key={i}
              className="group relative flex flex-1 flex-col items-center justify-end"
            >
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden rounded border border-kwik-border bg-surface px-2 py-1 text-xs text-foreground group-hover:block">
                {formatShortDate(item.date)}
                <br />
                <span className="font-mono">{formatValue(item.revenue)}</span>
              </div>
              {/* Bar */}
              <div className="w-full max-w-[48px] rounded-t bg-foreground transition-all duration-500" style={{ height: `${height}%` }} />
            </div>
          );
        })}
      </div>
      {/* X-axis labels */}
      <div className="flex gap-1">
        {data.map((item, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-[10px] text-muted-foreground">{formatShortDate(item.date)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HorizontalBarChart({
  data,
}: {
  data: { date: string; orders: number }[];
}) {
  const maxOrders = React.useMemo(
    () => Math.max(...data.map((d) => d.orders), 1),
    [data]
  );

  return (
    <div className="space-y-2">
      {data.map((item, i) => {
        const width = (item.orders / maxOrders) * 100;
        return (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-xs text-muted-foreground">{formatShortDate(item.date)}</span>
              <span className="font-mono text-xs text-foreground">{item.orders} orders</span>
            </div>
            <div className="h-5 w-full overflow-hidden rounded-sm bg-default-100">
              <div
                className="flex h-full items-center rounded-sm bg-foreground pl-2 transition-all duration-500"
                style={{ width: `${Math.max(width, 2)}%` }}
              >
                <span className="text-[10px] font-medium text-background">
                  {item.orders}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
