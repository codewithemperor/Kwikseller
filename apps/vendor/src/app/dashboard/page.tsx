"use client";

import React from "react";
import Link from "next/link";
import {
  ExternalLink,
  Package,
  ShoppingBag,
  DollarSign,
  Truck,
  Plus,
  PackageCheck,
  Store,
  MessageSquare,
  ArrowRight,
  Clock,
  ChevronRight,
  PackageSearch,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AppButton,
  VendorMetricCard,
  VendorPageHeader,
  VendorStatusBadge,
} from "@kwikseller/ui";
import { formatCurrency, formatDate, unwrapApiData } from "@/lib/vendor-format";
import { vendorCommerceApi } from "@kwikseller/api-client";
import type { InventoryItem, Order, VendorPoolOffer } from "@kwikseller/types";
import { useAuthStore } from "@kwikseller/utils";
import { cn } from "@/lib/utils";

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

function statusColor(status: string) {
  const map: Record<string, string> = {
    PAID: "text-emerald-600 dark:text-emerald-400",
    CONFIRMED: "text-emerald-600 dark:text-emerald-400",
    PROCESSING: "text-amber-600 dark:text-amber-400",
    FULFILLED: "text-blue-600 dark:text-blue-400",
    SHIPPED: "text-blue-600 dark:text-blue-400",
    DELIVERED: "text-emerald-600 dark:text-emerald-400",
    CANCELLED: "text-red-500 dark:text-red-400",
    REFUNDED: "text-red-500 dark:text-red-400",
    PENDING: "text-gray-500 dark:text-gray-400",
    DRAFT: "text-gray-500 dark:text-gray-400",
    PENDING_PAYMENT: "text-amber-600 dark:text-amber-400",
  };
  return map[status] ?? "text-gray-500 dark:text-gray-400";
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

/* ── Loading Skeleton ──────────────────────────────── */

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Welcome bar */}
      <div className="space-y-2">
        <div className="h-7 w-48 animate-pulse rounded bg-default-100" />
        <div className="h-4 w-72 animate-pulse rounded bg-default-100" />
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-1 gap-6 border-b border-kwik-border pb-6 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-5 w-5 animate-pulse rounded bg-default-100" />
            <div className="h-8 w-24 animate-pulse rounded bg-default-100" />
            <div className="h-4 w-32 animate-pulse rounded bg-default-100" />
          </div>
        ))}
      </div>

      {/* Two-column */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-3">
          <div className="h-6 w-32 animate-pulse rounded bg-default-100" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-default-100" />
          ))}
        </div>
        <div className="space-y-6">
          <div className="h-40 animate-pulse rounded bg-default-100" />
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded bg-default-100" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Dashboard Page ──────────────────────────── */

export default function VendorDashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [data, setData] = React.useState<VendorDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let active = true;
    vendorCommerceApi
      .getDashboard()
      .then((response) => {
        if (!active) return;
        const dashboard = unwrapApiData<VendorDashboardResponse>(response.data);
        setData(dashboard);
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

  /* ── Derived data ────────────────────────────────── */

  const recentOrders = data?.recentOrders ?? [];
  const inventoryAlerts = data?.inventoryAlerts ?? [];
  const fulfillmentTasks = data?.fulfillmentTasks ?? [];
  const todaysOrders = recentOrders.filter((o) => isToday(o.createdAt));
  const lowStockItems = inventoryAlerts.filter(
    (item) => item.available <= item.lowStockThreshold
  );

  const store = user?.store;
  const vendorName =
    user?.profile?.firstName ||
    store?.name ||
    user?.email?.split("@")[0] ||
    "Vendor";
  const storeName = store?.name || "My Store";
  const storeStatus = store?.isVerified ? "Verified" : "Unverified";
  const slug = storeSlug(store?.name, store?.slug);
  const storeUrl = `${marketplaceBaseUrl()}/vendor/${slug}`;

  const avgOrderAmount =
    recentOrders.length > 0
      ? recentOrders.reduce((sum, o) => sum + Number(o.totalAmount ?? 0), 0) /
        recentOrders.length
      : 0;

  /* ── Activity feed from recent orders ─────────────── */
  const activityItems = recentOrders.slice(0, 6).map((order) => ({
    id: order.id,
    ref: order.checkoutReference ?? order.id.slice(0, 8),
    status: order.status,
    timestamp: order.createdAt,
    icon:
      order.status === "DELIVERED"
        ? PackageCheck
        : order.status === "CANCELLED"
          ? PackageSearch
          : ShoppingBag,
  }));

  /* ── Loading state ─────────────────────────────────── */

  if (isLoading) return <DashboardSkeleton />;

  /* ── Error state ──────────────────────────────────── */

  if (error) {
    return (
      <div className="space-y-6">
        <VendorPageHeader
          title="Dashboard"
          description="Overview of your store performance and activity."
        />
        <div className="flex flex-col items-center justify-center py-20">
          <PackageSearch
            className="h-12 w-12 text-muted-foreground/50"
            strokeWidth={1.5}
          />
          <h2 className="mt-4 text-lg font-medium text-foreground">
            Dashboard unavailable
          </h2>
          <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex h-10 items-center rounded-md bg-foreground px-5 text-sm font-medium text-background transition hover:bg-foreground/90"
          >
            <RefreshCw className="mr-2 h-4 w-4" strokeWidth={1.5} />
            Reload
          </button>
        </div>
      </div>
    );
  }

  /* ── Render ───────────────────────────────────────── */

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* ─── Section 1: Welcome Bar ─────────────────── */}
      <VendorPageHeader
        title={`${getGreeting()}, ${vendorName}`}
        description={`${storeName} · ${storeStatus}`}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              aria-label="Refresh dashboard"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-kwik-border text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
            >
              <RefreshCw className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <a
              href={storeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              View Public Store
              <ExternalLink className="h-4 w-4" strokeWidth={1.5} />
            </a>
          </div>
        }
      />

      {/* ─── Section 2: Metrics Row ──────────────────── */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Link href="/dashboard/orders" className="block">
          <VendorMetricCard
            title="Today's Orders"
            value={String(todaysOrders.length)}
            icon={ShoppingBag}
            description="Orders created today from buyer checkout activity."
          />
        </Link>
        <Link href="/dashboard/wallet" className="block">
          <VendorMetricCard
            title="Revenue"
            value={formatCurrency(data?.revenue ?? 0)}
            icon={DollarSign}
            description="Live paid order value for your current month."
          />
        </Link>
        <Link href="/dashboard/products" className="block">
          <VendorMetricCard
            title="Active Products"
            value={String(data?.productsCount ?? 0)}
            icon={Package}
            description={lowStockItems.length > 0 ? `${lowStockItems.length} products need stock attention.` : "Products currently visible in your catalog."}
          />
        </Link>
        <Link href="/dashboard/deliveries" className="block">
          <VendorMetricCard
            title="Pending Deliveries"
            value={String(fulfillmentTasks.length)}
            icon={Truck}
            description="Paid orders waiting for fulfillment action."
          />
        </Link>
      </section>

      {/* ─── Section 2.5: Quick Actions ─────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
        <motion.div
          variants={{ show: { transition: { staggerChildren: 0.05 } } }}
          initial="hidden"
          animate="show"
          className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          <motion.div variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }}>
            <AppButton variant="secondary" fullWidth onClick={() => router.push("/dashboard/products")}>
              <Plus className="h-4 w-4" />
              Add Product
            </AppButton>
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }}>
            <AppButton variant="secondary" fullWidth onClick={() => router.push("/dashboard/orders")}>
              <ShoppingBag className="h-4 w-4" />
              View Orders
            </AppButton>
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }}>
            <AppButton variant="secondary" fullWidth onClick={() => router.push("/dashboard/wallet")}>
              <DollarSign className="h-4 w-4" />
              Check Wallet
            </AppButton>
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }}>
            <AppButton variant="secondary" fullWidth onClick={() => router.push("/dashboard/pool")}>
              <Package className="h-4 w-4" />
              Pool Sourcing
            </AppButton>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Section 3: Two-Column Layout ────────────── */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-[3fr_2fr]">
        {/* ─── Left Column ──────────────────────────── */}
        <div className="space-y-8">
          {/* Recent Orders */}
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Recent Orders
              </h2>
              <Link
                href="/dashboard/orders"
                className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition hover:text-gray-900 dark:hover:text-white"
              >
                View all
                <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
              </Link>
            </div>

            {recentOrders.length > 0 ? (
              <div className="mt-4 divide-y divide-kwik-border">
                {recentOrders.slice(0, 8).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between gap-4 py-3 first:pt-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-muted-foreground">
                        {order.checkoutReference ?? order.id.slice(0, 12)}
                      </p>
                      <div className="mt-0.5 flex items-center gap-3">
                        <p className="text-sm font-medium text-foreground">
                          {formatCurrency(order.totalAmount)}
                        </p>
                        <p
                          className={cn(
                            "text-xs font-medium",
                            statusColor(order.status)
                          )}
                        >
                          {formatStatus(order.status)}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </span>
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="text-xs font-medium text-gray-400 transition hover:text-gray-900 dark:hover:text-white"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 py-8 text-center">
                <ShoppingBag
                  className="mx-auto h-10 w-10 text-muted-foreground/40"
                  strokeWidth={1.5}
                />
                <p className="mt-3 text-sm text-muted-foreground">
                  No orders yet. Orders will appear here after buyers checkout.
                </p>
              </div>
            )}
          </div>

          {/* Low Stock Alerts */}
          {lowStockItems.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Low Stock Alerts
              </h2>
              <div className="mt-4 divide-y divide-kwik-border">
                {lowStockItems.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 py-3 first:pt-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        SKU: {item.sku ?? item.productId.slice(0, 8)}
                      </p>
                      <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
                        {item.available} left
                      </p>
                    </div>
                    <Link
                      href="/dashboard/inventory"
                      className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-gray-400 hover:text-gray-900 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-white"
                    >
                      Restock
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─── Right Column ─────────────────────────── */}
        <div className="space-y-8">
          {/* Escrow / Wallet Summary */}
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Wallet Summary
            </h2>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Total Revenue
                </p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {formatCurrency(data?.revenue ?? 0)}
                </p>
              </div>
              <div className="border-t border-kwik-border pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Pool Earnings
                    </p>
                    <p className="mt-1 text-base font-semibold text-foreground">
                      {formatCurrency(data?.poolEarnings ?? 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Pending Orders
                    </p>
                    <p className="mt-1 text-base font-semibold text-foreground">
                      {fulfillmentTasks.length}
                      {fulfillmentTasks.length > 0 && (
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                          (~{formatCurrency(fulfillmentTasks.length * avgOrderAmount)})
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <Link
                href="/dashboard/wallet"
                className="inline-flex w-full items-center justify-center rounded-md bg-foreground px-4 py-2.5 text-sm font-medium text-background transition hover:bg-foreground/90"
              >
                Go to Wallet
                <ChevronRight className="ml-1 h-4 w-4" strokeWidth={1.5} />
              </Link>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Quick Actions
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link
                href="/dashboard/products?action=add"
                className="flex flex-col items-center gap-2 rounded-md border border-gray-200 px-4 py-5 text-center transition hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
              >
                <Plus
                  className="h-5 w-5 text-muted-foreground"
                  strokeWidth={1.5}
                />
                <span className="text-sm font-medium text-foreground">
                  Add Product
                </span>
              </Link>
              <Link
                href="/dashboard/orders"
                className="flex flex-col items-center gap-2 rounded-md border border-gray-200 px-4 py-5 text-center transition hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
              >
                <ShoppingBag
                  className="h-5 w-5 text-muted-foreground"
                  strokeWidth={1.5}
                />
                <span className="text-sm font-medium text-foreground">
                  View Orders
                </span>
              </Link>
              <Link
                href="/dashboard/storefront"
                className="flex flex-col items-center gap-2 rounded-md border border-gray-200 px-4 py-5 text-center transition hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
              >
                <Store
                  className="h-5 w-5 text-muted-foreground"
                  strokeWidth={1.5}
                />
                <span className="text-sm font-medium text-foreground">
                  Edit Store
                </span>
              </Link>
              <Link
                href="/dashboard/messages"
                className="flex flex-col items-center gap-2 rounded-md border border-gray-200 px-4 py-5 text-center transition hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
              >
                <MessageSquare
                  className="h-5 w-5 text-muted-foreground"
                  strokeWidth={1.5}
                />
                <span className="text-sm font-medium text-foreground">
                  Messages
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 4: Activity Feed ───────────────── */}
      {activityItems.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-foreground">
            Recent Activity
          </h2>
          <div className="mt-4 space-y-0">
            {activityItems.map((item, index) => (
              <div
                key={item.id}
                className="relative flex gap-4 pb-6 last:pb-0"
              >
                {/* Vertical line */}
                {index < activityItems.length - 1 && (
                  <div className="absolute bottom-0 left-[11px] top-6 w-px bg-kwik-border" />
                )}
                {/* Icon dot */}
                <div className="relative mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center">
                  <item.icon
                    className="h-4 w-4 text-muted-foreground"
                    strokeWidth={1.5}
                  />
                </div>
                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm text-foreground">
                      Order <span className="font-mono">{item.ref}</span>
                    </p>
                    <VendorStatusBadge status={item.status} size="sm" />
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" strokeWidth={1.5} />
                    {formatRelativeTime(item.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
}
