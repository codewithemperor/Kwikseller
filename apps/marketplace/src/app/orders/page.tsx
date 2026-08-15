"use client";

/**
 * Customer Orders List Page — driven by the REAL backend order lifecycle.
 *
 * Lists the buyer's orders with: reference, date, status badges, total, vendor.
 * Links to `/orders/[id]` for full detail. Handles loading + empty states.
 *
 * Filter tabs: All / Active / Completed / Cancelled (uses the new
 * `MarketplaceOrderStatus` enum from `@/lib/order-api`).
 *
 * Styling: Tailwind + existing kwik-* semantic tokens. NO blue/indigo.
 */

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Package,
  ShieldCheck,
  Store,
  Wallet,
} from "lucide-react";
import { EmptyState, Skeleton } from "@kwikseller/ui";
import { useAuth } from "@kwikseller/utils";
import {
  useMyOrders,
  type MarketplaceOrder,
  type MarketplaceOrderStatus,
} from "@/lib/order-api";
import { KwisCrow } from "@/constants/order-workflow";
import { AccountLayout } from "@/components/layout/account-layout";

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatCurrency(amount: number | null | undefined): string {
  const value = Number(amount ?? 0);
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | Date): string {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function orderReference(order: MarketplaceOrder): string {
  return order.checkoutReference || order.id.slice(-8).toUpperCase();
}

function getItemNames(order: MarketplaceOrder): string[] {
  return (order.items ?? [])
    .map((item) => item.productNameSnapshot || item.product?.name || "")
    .filter(Boolean);
}

function getItemCount(order: MarketplaceOrder): number {
  return (order.items ?? []).reduce((sum, item) => sum + (item.quantity ?? 0), 0);
}

// ─── Status badge styling (NO blue/indigo — kwik-orange/green/red/gray) ────

const STATUS_BADGE_STYLES: Record<string, string> = {
  PENDING: "bg-kwik-orange/10 text-kwik-orange ring-kwik-orange/20",
  PENDING_PAYMENT: "bg-kwik-orange/10 text-kwik-orange ring-kwik-orange/20",
  PAID: "bg-kwik-green/10 text-kwik-green ring-kwik-green/20",
  CONFIRMED: "bg-kwik-green/10 text-kwik-green ring-kwik-green/20",
  PROCESSING: "bg-kwik-orange/10 text-kwik-orange ring-kwik-orange/20",
  FULFILLED: "bg-kwik-green/10 text-kwik-green ring-kwik-green/20",
  SHIPPED: "bg-kwik-green/10 text-kwik-green ring-kwik-green/20",
  DELIVERED: "bg-kwik-green/10 text-kwik-green ring-kwik-green/20",
  COMPLETED: "bg-kwik-green/15 text-kwik-green ring-kwik-green/30",
  CANCELLED: "bg-kwik-red/10 text-kwik-red ring-kwik-red/20",
  REFUNDED: "bg-kwik-red/10 text-kwik-red ring-kwik-red/20",
};

function StatusBadge({ status }: { status: string }) {
  const normalized = status.replace(/_/g, " ");
  const style = STATUS_BADGE_STYLES[status] ?? "bg-gray-100 text-gray-600 ring-gray-200";
  return (
    <span
      className={
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 " +
        style
      }
    >
      {normalized}
    </span>
  );
}

function paymentBadgeClass(paymentStatus: string): string {
  switch (paymentStatus) {
    case "PAID":
      return "bg-kwik-green/10 text-kwik-green ring-kwik-green/20";
    case "REFUNDED":
    case "FAILED":
      return "bg-kwik-red/10 text-kwik-red ring-kwik-red/20";
    default:
      return "bg-kwik-orange/10 text-kwik-orange ring-kwik-orange/20";
  }
}

// ─── Filter tabs ───────────────────────────────────────────────────────────

type TabKey = "all" | "active" | "completed" | "cancelled";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const ACTIVE_STATUSES: MarketplaceOrderStatus[] = [
  "PENDING",
  "PENDING_PAYMENT",
  "PAID",
  "CONFIRMED",
  "PROCESSING",
  "FULFILLED",
  "SHIPPED",
  "DELIVERED",
];

const COMPLETED_STATUSES: MarketplaceOrderStatus[] = ["COMPLETED"];

const CANCELLED_STATUSES: MarketplaceOrderStatus[] = ["CANCELLED", "REFUNDED"];

function filterByTab(orders: MarketplaceOrder[], tab: TabKey): MarketplaceOrder[] {
  if (tab === "all") return orders;
  const allowed =
    tab === "active"
      ? ACTIVE_STATUSES
      : tab === "completed"
        ? COMPLETED_STATUSES
        : CANCELLED_STATUSES;
  return orders.filter((order) => allowed.includes(order.status));
}

// ─── Order card ────────────────────────────────────────────────────────────

function BuyerOrderCard({
  order,
  onClick,
  index = 0,
}: {
  order: MarketplaceOrder;
  onClick: () => void;
  index?: number;
}) {
  const itemNames = getItemNames(order);
  const itemCount = getItemCount(order);
  const isPickup = order.deliveryMethod === "PICKUP";
  const quotePending =
    order.deliveryMethod === "STANDARD_DELIVERY" &&
    order.paymentStatus === "PENDING" &&
    order.quoteStatus !== "AGREED";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.06, 0.5) }}
      whileHover={{ y: -3 }}
      className="w-full overflow-hidden rounded-2xl border border-kwik-border bg-kwik-bg-surface text-left shadow-sm transition-colors hover:border-kwik-orange/40 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-kwik-orange/40 focus-visible:ring-offset-2"
    >
      {/* Gradient header strip */}
      <div className="kwik-gradient px-5 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/80">
              Order {orderReference(order)}
            </p>
            <p className="mt-0.5 text-xs text-white/85">
              {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {order.paymentStatus === "PAID" && order.escrow?.status === "HELD" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
                <ShieldCheck className="h-3 w-3" />
                {KwisCrow.NAME}
              </span>
            )}
            <StatusBadge status={order.status} />
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        {/* Vendor + items */}
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-kwik-orange/10 text-kwik-orange">
            <Store className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground">
              {order.store?.name ?? "Vendor store"}
            </p>
            <p className="mt-1 line-clamp-2 text-sm text-kwik-muted">
              {itemNames.length
                ? itemNames.join(", ")
                : `${itemCount} item${itemCount === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>

        {/* Status strip */}
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-[11px]">
          <span className="font-semibold uppercase tracking-wide text-kwik-muted">
            {isPickup ? "Pickup" : order.deliveryMethod === "STANDARD_DELIVERY" ? "Delivery" : "—"}
          </span>
          <span className="text-kwik-muted">·</span>
          <span
            className={
              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 " +
              paymentBadgeClass(order.paymentStatus)
            }
          >
            Payment: {order.paymentStatus}
          </span>
          {quotePending && (
            <>
              <span className="text-kwik-muted">·</span>
              <span className="inline-flex items-center rounded-full bg-kwik-orange/10 px-2 py-0.5 text-[10px] font-semibold text-kwik-orange ring-1 ring-kwik-orange/20">
                Quote pending
              </span>
            </>
          )}
        </div>

        {/* Footer: amount + view details */}
        <div className="mt-4 flex items-center justify-between border-t border-kwik-border-light pt-3">
          <div>
            <p className="font-heading text-lg font-bold text-foreground tabular-nums">
              {formatCurrency(order.totalAmount)}
            </p>
            <p className="text-xs text-kwik-muted">
              {order.paymentStatus === "PAID"
                ? "Paid · escrow held"
                : order.paymentStatus === "REFUNDED"
                  ? "Refunded"
                  : "Payment pending"}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-kwik-orange">
            View details <ChevronRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </motion.button>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────

function OrderListSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-kwik-border bg-kwik-bg-surface p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="mt-4 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-kwik-border-light pt-3">
            <div className="space-y-1">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page body ─────────────────────────────────────────────────────────────

function BuyerOrdersPageInner() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  // Real backend orders — `GET /api/v1/orders`.
  const { data: orders = [], isLoading } = useMyOrders();

  const filteredOrders = useMemo(
    () => filterByTab(orders, activeTab),
    [orders, activeTab],
  );

  const counts = useMemo(
    () => ({
      all: orders.length,
      active: filterByTab(orders, "active").length,
      completed: filterByTab(orders, "completed").length,
      cancelled: filterByTab(orders, "cancelled").length,
    }),
    [orders],
  );

  const totalValue = useMemo(
    () =>
      orders.reduce((sum, o) => sum + Number(o.totalAmount ?? 0), 0),
    [orders],
  );

  // Loading state — show skeleton briefly while auth resolves OR the
  // initial fetch is in flight.
  if (isAuthLoading || (isLoading && orders.length === 0)) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <OrderListSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero header (matches order detail page design) */}
      <section className="kwik-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_55%)]" />
        <div className="container mx-auto max-w-6xl px-4 py-8 relative">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-white/85 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to marketplace
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/80">
              Your purchases
            </p>
            <h1 className="mt-1 font-heading text-3xl font-bold text-white sm:text-4xl">
              My Orders
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85">
              Track, confirm, and manage all your marketplace purchases. Every
              paid order is protected by {KwisCrow.NAME} escrow.
            </p>
          </motion.div>
        </div>
      </section>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mx-auto max-w-6xl px-4 py-6"
      >
        {/* Stats summary bar */}
        {orders.length > 0 ? (
          <div className="mb-6 grid grid-cols-2 gap-3 rounded-2xl border border-kwik-border bg-kwik-bg-surface p-4 sm:grid-cols-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-kwik-orange/10 text-kwik-orange">
                <Package className="h-4 w-4" />
              </div>
              <div>
                <p className="font-heading text-lg font-bold text-foreground">
                  {orders.length}
                </p>
                <p className="text-[11px] text-kwik-muted">Total orders</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-kwik-orange/10 text-kwik-orange">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="font-heading text-lg font-bold text-foreground">
                  {counts.active}
                </p>
                <p className="text-[11px] text-kwik-muted">Active</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-kwik-green/10 text-kwik-green">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="font-heading text-lg font-bold text-foreground">
                  {counts.completed}
                </p>
                <p className="text-[11px] text-kwik-muted">Completed</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-kwik-green/10 text-kwik-green">
                <Wallet className="h-4 w-4" />
              </div>
              <div>
                <p className="font-heading text-lg font-bold text-foreground tabular-nums">
                  {formatCurrency(totalValue)}
                </p>
                <p className="text-[11px] text-kwik-muted">Total value</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Filter tabs */}
        {orders.length > 0 ? (
          <div
            role="tablist"
            aria-label="Filter orders by status"
            className="mb-6 flex flex-wrap gap-2"
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={isActive}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors " +
                    (isActive
                      ? "border-kwik-orange bg-kwik-orange text-white"
                      : "border-kwik-border bg-kwik-bg-surface text-kwik-muted hover:border-kwik-orange/40 hover:text-foreground")
                  }
                >
                  {tab.label}
                  <span
                    className={
                      "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] tabular-nums " +
                      (isActive
                        ? "bg-white/20 text-white"
                        : "bg-gray-100 text-kwik-muted")
                    }
                  >
                    {counts[tab.key]}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}

        {/* Content */}
        {isLoading && orders.length > 0 ? (
          <OrderListSkeleton />
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            variant="orders"
            title={
              orders.length === 0
                ? "You haven't placed any orders yet"
                : activeTab === "active"
                  ? "No active orders"
                  : activeTab === "completed"
                    ? "No completed orders yet"
                    : "No cancelled orders"
            }
            description={
              orders.length === 0
                ? "When you make a purchase, your orders will appear here so you can track delivery, confirm receipt, or open a dispute."
                : "Try switching tabs to see orders in other states."
            }
            action={{
              label: "Start shopping",
              onClick: () => router.push("/"),
            }}
            className="rounded-2xl border border-kwik-border bg-kwik-bg-surface"
          />
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order, i) => (
              <BuyerOrderCard
                key={order.id}
                order={order}
                index={i}
                onClick={() => router.push(`/orders/${order.id}`)}
              />
            ))}
          </div>
        )}

        {/* Reorder hint footer (only shown when there are orders) */}
        {filteredOrders.length > 0 && (
          <p className="mt-8 flex items-center justify-center gap-1.5 text-center text-xs text-kwik-muted">
            <Package className="h-3.5 w-3.5" />
            Tap an order to view full details, track delivery, or confirm receipt.
          </p>
        )}
      </motion.div>
    </div>
  );
}

export default function BuyerOrdersPage() {
  return (
    <AccountLayout>
      <BuyerOrdersPageInner />
    </AccountLayout>
  );
}
