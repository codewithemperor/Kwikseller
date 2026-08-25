"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BarChart3,
  Clock,
  Receipt,
  ShoppingBag,
  Store,
  TrendingUp,
  Trophy,
  PackageOpen,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
} from "lucide-react";
import {
  useVendorAnalytics,
  type AnalyticsPeriod,
  type VendorAnalytics,
  type RevenueTrendPoint,
  type TopProductStat,
  type CategoryBreakdownStat,
} from "@/lib/order-api";
import { PageLoading } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatNGN(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatCompact(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(1)}K`;
  return `₦${n}`;
}

const PERIODS: { value: AnalyticsPeriod; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

// ─── KPI card ──────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  index: number;
  caption?: string;
  /** Period-over-period delta in percent (e.g. +12.5 or -3.2). Shows a trend chip. */
  deltaPct?: number;
}

function KpiCard({ label, value, icon: Icon, iconBg, iconColor, index, caption, deltaPct }: KpiCardProps) {
  const isPositiveDelta = typeof deltaPct === "number" && deltaPct >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="rounded-2xl border border-kwik-border-light bg-kwik-bg-surface p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-kwik-gray-light">
            {label}
          </p>
          <p className="mt-2 truncate text-2xl font-bold text-kwik-dark">{value}</p>
          <div className="mt-1 flex items-center gap-2">
            {caption && <p className="text-xs text-kwik-muted">{caption}</p>}
            {typeof deltaPct === "number" && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  isPositiveDelta
                    ? "bg-kwik-green/10 text-kwik-green"
                    : "bg-kwik-red/10 text-kwik-red",
                )}
                title={`vs. previous ${label.toLowerCase()}`}
              >
                {isPositiveDelta ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(deltaPct).toFixed(1)}%
              </span>
            )}
          </div>
        </div>
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            iconBg,
            iconColor,
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </motion.div>
  );
}

// ─── Revenue trend bar chart ───────────────────────────────────────────────

function RevenueTrendChart({ trend }: { trend: RevenueTrendPoint[] }) {
  const maxRevenue = Math.max(1, ...trend.map((t) => t.revenue));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2 }}
      className="rounded-2xl border border-kwik-border-light bg-kwik-bg-surface p-5 sm:p-6"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-kwik-orange/10 text-kwik-orange">
          <BarChart3 className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-foreground">Revenue Trend</h2>
          <p className="text-xs text-kwik-muted">Last 7 days</p>
        </div>
      </div>

      <div className="mt-6 flex h-48 items-end justify-between gap-2 sm:gap-3">
        {trend.map((point, i) => {
          const heightPct = Math.max(6, Math.round((point.revenue / maxRevenue) * 100));
          return (
            <div
              key={point.day}
              className="group flex h-full flex-1 flex-col items-center justify-end gap-2"
            >
              <span className="text-[10px] font-semibold text-kwik-dark opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:text-xs">
                {formatCompact(point.revenue)}
              </span>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${heightPct}%` }}
                transition={{ duration: 0.6, delay: 0.3 + i * 0.05, ease: "easeOut" }}
                className="w-full max-w-[42px] rounded-t-md bg-gradient-to-t from-kwik-orange to-kwik-amber transition-opacity group-hover:opacity-90"
                title={`${point.label}: ${formatNGN(point.revenue)} · ${point.orders} order${point.orders === 1 ? "" : "s"}`}
              />
              <span className="text-[11px] font-medium text-kwik-muted">{point.label}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Top products ──────────────────────────────────────────────────────────

function rankBadgeClass(rank: number): string {
  switch (rank) {
    case 1:
      return "bg-kwik-amber/20 text-kwik-amber";
    case 2:
      return "bg-kwik-gray/20 text-kwik-dark";
    case 3:
      return "bg-kwik-orange/15 text-kwik-orange";
    default:
      return "bg-kwik-bg-page text-kwik-muted";
  }
}

function TopProductsList({ products }: { products: TopProductStat[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.3 }}
      className="rounded-2xl border border-kwik-border-light bg-kwik-bg-surface p-5 sm:p-6"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-kwik-amber/15 text-kwik-amber">
          <Trophy className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-foreground">Top Products</h2>
          <p className="text-xs text-kwik-muted">Best sellers by revenue</p>
        </div>
      </div>

      <div className="mt-5 overflow-hidden">
        {/* Header row (hidden on mobile) */}
        <div className="hidden grid-cols-12 gap-3 border-b border-kwik-border-light pb-2 text-[11px] font-semibold uppercase tracking-wide text-kwik-gray-light sm:grid">
          <span className="col-span-6">Product</span>
          <span className="col-span-2 text-right">Sales</span>
          <span className="col-span-4 text-right">Revenue</span>
        </div>
        <ul className="divide-y divide-kwik-border-light">
          {products.map((product, i) => {
            const rank = i + 1;
            return (
              <li
                key={product.id}
                className="grid grid-cols-12 items-center gap-3 py-3 text-sm"
              >
                <div className="col-span-12 flex items-center gap-3 sm:col-span-6">
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      rankBadgeClass(rank),
                    )}
                  >
                    #{rank}
                  </span>
                  <span className="min-w-0 truncate font-medium text-foreground">
                    {product.name}
                  </span>
                </div>
                <div className="col-span-6 text-left text-kwik-muted sm:col-span-2 sm:text-right">
                  <span className="text-[11px] uppercase tracking-wide text-kwik-gray-light sm:hidden">
                    Sales ·{" "}
                  </span>
                  <span className="font-semibold text-foreground">{product.sales}</span>
                </div>
                <div className="col-span-6 text-right font-semibold text-kwik-dark sm:col-span-4">
                  {formatNGN(product.revenue)}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </motion.div>
  );
}

// ─── Category breakdown (donut alternative — bar list) ─────────────────────

const CATEGORY_BAR_TONES = [
  "bg-kwik-orange",
  "bg-kwik-amber",
  "bg-kwik-green",
  "bg-kwik-violet",
  "bg-kwik-rose",
  "bg-kwik-emerald",
];

function CategoryBreakdownList({ categories }: { categories: CategoryBreakdownStat[] }) {
  const maxRevenue = Math.max(1, ...categories.map((c) => c.revenue));
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.35 }}
      className="rounded-2xl border border-kwik-border-light bg-kwik-bg-surface p-5 sm:p-6"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-kwik-violet/15 text-kwik-violet">
          <PieChart className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-foreground">Revenue by category</h2>
          <p className="text-xs text-kwik-muted">Top categories in this period</p>
        </div>
      </div>

      {categories.length === 0 ? (
        <p className="mt-6 text-sm text-kwik-muted">No category data yet.</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {categories.map((cat, i) => {
            const pctOfMax = Math.round((cat.revenue / maxRevenue) * 100);
            const tone = CATEGORY_BAR_TONES[i % CATEGORY_BAR_TONES.length];
            return (
              <li key={cat.id}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{cat.name}</span>
                  <span className="text-kwik-muted">
                    {formatNGN(cat.revenue)} ·{" "}
                    <span className="font-semibold text-kwik-dark">{cat.share}%</span>
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-kwik-bg-page">
                  <div
                    className={cn("h-full rounded-full transition-all", tone)}
                    style={{ width: `${pctOfMax}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-kwik-gray-light">{cat.products} products</p>
              </li>
            );
          })}
        </ul>
      )}
    </motion.div>
  );
}

// ─── Order status breakdown bar ────────────────────────────────────────────

function StatusBreakdown({ analytics }: { analytics: VendorAnalytics }) {
  const total = analytics.ordersCount || 1;
  const pendingPct = Math.round((analytics.pendingCount / total) * 100);
  const deliveredPct = Math.round((analytics.deliveredCount / total) * 100);
  const otherPct = Math.max(0, 100 - pendingPct - deliveredPct);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.35 }}
      className="rounded-2xl border border-kwik-border-light bg-kwik-bg-surface p-5 sm:p-6"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-kwik-green/10 text-kwik-green">
          <ShoppingBag className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-foreground">Order Status</h2>
          <p className="text-xs text-kwik-muted">Pending vs delivered</p>
        </div>
      </div>

      {/* Horizontal bar */}
      <div className="mt-5 flex h-3 w-full overflow-hidden rounded-full bg-kwik-bg-page">
        {pendingPct > 0 && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pendingPct}%` }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            className="bg-kwik-amber"
            title={`Pending: ${analytics.pendingCount}`}
          />
        )}
        {deliveredPct > 0 && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${deliveredPct}%` }}
            transition={{ duration: 0.6, delay: 0.45, ease: "easeOut" }}
            className="bg-kwik-green"
            title={`Delivered: ${analytics.deliveredCount}`}
          />
        )}
        {otherPct > 0 && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${otherPct}%` }}
            transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
            className="bg-kwik-border-light"
            title="Other"
          />
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-kwik-amber" />
          <span className="text-kwik-muted">Pending</span>
          <span className="font-semibold text-foreground">{analytics.pendingCount}</span>
          <span className="text-xs text-kwik-gray-light">({pendingPct}%)</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-kwik-green" />
          <span className="text-kwik-muted">Delivered</span>
          <span className="font-semibold text-foreground">{analytics.deliveredCount}</span>
          <span className="text-xs text-kwik-gray-light">({deliveredPct}%)</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-kwik-border-light" />
          <span className="text-kwik-muted">Total</span>
          <span className="font-semibold text-foreground">{analytics.ordersCount}</span>
        </span>
      </div>
    </motion.div>
  );
}

// ─── Dashboard content ─────────────────────────────────────────────────────

function VendorAnalyticsContent() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");
  const { data: analytics, isLoading, isError, refetch, isFetching } = useVendorAnalytics(period);

  if (isLoading) {
    return <PageLoading label="Loading analytics…" />;
  }

  if (isError || !analytics) {
    return (
      <EmptyState
        variant="error"
        title="Couldn't load analytics"
        description="Something went wrong fetching your store data. Please try again."
        action={
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex h-10 items-center rounded-lg bg-kwik-orange px-4 text-sm font-semibold text-white transition hover:bg-kwik-orange-hover"
          >
            Retry
          </button>
        }
      />
    );
  }

  if (analytics.ordersCount === 0) {
    return (
      <EmptyState
        variant="default"
        icon={<PackageOpen className="h-12 w-12" />}
        title="No sales data yet"
        description="Your analytics will appear here once orders start coming in."
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-foreground">
            <BarChart3 className="h-6 w-6 text-kwik-orange" />
            Vendor Analytics
          </h1>
          <p className="mt-1 text-sm text-kwik-muted">
            Track your store performance, revenue trends, and top-selling products.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-lg border border-kwik-border-light px-4 text-sm font-semibold text-kwik-muted transition hover:bg-kwik-bg-surface"
        >
          Back to shop
        </Link>
      </div>

      {/* Period selector */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPeriod(p.value)}
            disabled={isFetching}
            aria-pressed={period === p.value}
            className={cn(
              "inline-flex h-9 items-center rounded-full px-4 text-sm font-medium transition disabled:opacity-60",
              period === p.value
                ? "bg-kwik-orange text-white"
                : "border border-kwik-border-light bg-kwik-bg-surface text-kwik-gray hover:text-kwik-dark",
            )}
          >
            {p.label}
          </button>
        ))}
        {isFetching && (
          <span className="text-xs text-kwik-muted">Updating…</span>
        )}
      </div>

      {/* KPI cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          index={0}
          label="Total Revenue"
          value={formatNGN(analytics.revenue)}
          icon={TrendingUp}
          iconBg="bg-kwik-green/10"
          iconColor="text-kwik-green"
          caption={`${analytics.productsCount} products live`}
          deltaPct={analytics.revenueDeltaPct}
        />
        <KpiCard
          index={1}
          label="Orders"
          value={String(analytics.ordersCount)}
          icon={ShoppingBag}
          iconBg="bg-kwik-orange/10"
          iconColor="text-kwik-orange"
          caption={`${analytics.deliveredCount} delivered`}
          deltaPct={analytics.ordersDeltaPct}
        />
        <KpiCard
          index={2}
          label="Avg Order Value"
          value={formatNGN(analytics.avgOrderValue)}
          icon={Receipt}
          iconBg="bg-kwik-amber/10"
          iconColor="text-kwik-amber"
          caption="Per order"
        />
        <KpiCard
          index={3}
          label="Pending Orders"
          value={String(analytics.pendingCount)}
          icon={Clock}
          iconBg={analytics.pendingCount > 0 ? "bg-kwik-red/10" : "bg-kwik-bg-page"}
          iconColor={analytics.pendingCount > 0 ? "text-kwik-red" : "text-kwik-gray"}
          caption={analytics.pendingCount > 0 ? "Needs attention" : "All caught up"}
        />
      </div>

      {/* Revenue trend chart */}
      <div className="mt-6">
        <RevenueTrendChart trend={analytics.revenueTrend} />
      </div>

      {/* Status breakdown + top products */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <StatusBreakdown analytics={analytics} />
        <TopProductsList products={analytics.topProducts} />
      </div>

      {/* Category breakdown (full-width) */}
      {analytics.categoryBreakdown && analytics.categoryBreakdown.length > 0 && (
        <div className="mt-6">
          <CategoryBreakdownList categories={analytics.categoryBreakdown} />
        </div>
      )}

      {/* Footer note */}
      <p className="mt-6 flex items-center gap-1.5 text-xs text-kwik-gray-light">
        <Store className="h-3.5 w-3.5" />
        Data for the last {period}. Updates every minute.
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function VendorAnalyticsPage() {
  return (
      <VendorAnalyticsContent />
  );
}
