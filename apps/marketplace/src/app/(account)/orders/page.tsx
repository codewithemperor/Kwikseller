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
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronRight, Package, ShieldCheck, Store } from "lucide-react";
import { EmptyState } from "@/components/ui/feedback-empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import {
  useMyOrders,
  type MarketplaceOrder,
  type MarketplaceOrderStatus,
} from "@/lib/order-api";
import { KwisCrow } from "@/constants/order-workflow";

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

const CANCELLED_STATUSES: MarketplaceOrderStatus[] = ["CANCELLED", "REFUNDED"];

function filterByTab(orders: MarketplaceOrder[], tab: TabKey): MarketplaceOrder[] {
  if (tab === "all") return orders;
  if (tab === "active") {
    return orders.filter((order) => ACTIVE_STATUSES.includes(order.status));
  }
  if (tab === "completed") {
    return orders.filter(
      (order) => order.status === "COMPLETED" || order.escrow?.status === "RELEASED",
    );
  }
  return orders.filter((order) => CANCELLED_STATUSES.includes(order.status));
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
  const itemPreview = (order.items ?? []).slice(0, 2);
  const quotePending =
    order.deliveryMethod === "STANDARD_DELIVERY" &&
    order.paymentStatus === "PENDING" &&
    order.quoteStatus !== "AGREED";
  const routeLabel =
    order.status === "COMPLETED" || order.escrow?.status === "RELEASED"
      ? "Completed"
      : order.status === "CANCELLED" || order.status === "REFUNDED"
        ? "Cancelled"
        : order.status === "DELIVERED"
          ? "Delivered"
          : order.status === "SHIPPED"
            ? "On delivery"
            : order.status === "PROCESSING"
              ? "Processing"
              : isPickup
                ? "Pickup pending"
                : "Awaiting dispatch";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.06, 0.5) }}
      whileHover={{ y: -2 }}
      className="w-full overflow-hidden rounded-[10px] border border-[#e3e5e8] bg-white text-left transition hover:border-[#cfd3d8] hover:shadow-[0_8px_20px_rgba(15,23,42,0.05)] focus:outline-none focus-visible:ring-2 focus-visible:ring-kwik-orange/40 focus-visible:ring-offset-2"
    >
      <div className="p-3.5 sm:p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-[#8d877f]">
              Order ID
            </p>
            <p className="text-lg font-semibold leading-tight text-[#151515]">
              #{orderReference(order)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#f5f3ef] px-3 py-1 text-[11px] font-medium text-[#6c675f]">
              {routeLabel}
            </span>
            {order.paymentStatus === "PAID" && order.escrow?.status === "HELD" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-kwik-orange/10 px-2.5 py-1 text-[11px] font-semibold text-kwik-orange ring-1 ring-kwik-orange/20">
                <ShieldCheck className="h-3 w-3" />
                {KwisCrow.NAME}
              </span>
            )}
            <StatusBadge status={order.status} />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[12px] text-[#8d877f]">
          <span>{formatDate(order.createdAt)}</span>
          <span className="text-[#d3ccc1]">•</span>
          <span>{isPickup ? "Pickup order" : "Standard delivery"}</span>
          <span className="text-[#d3ccc1]">•</span>
          <span>{itemCount} item{itemCount === 1 ? "" : "s"}</span>
        </div>

        <div className="mt-3 rounded-lg border border-[#eceef0] bg-[#fafafa] p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-[#8d877f]">Vendor</p>
              <p className="mt-1 truncate text-sm font-semibold text-[#1e1e1e]">
                {order.store?.name ?? "Vendor store"}
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#6c675f]">
              <Store className="h-3.5 w-3.5" />
              <span>{routeLabel}</span>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-0.5">
            {itemPreview.map((item) => {
              const image =
                item.productImageSnapshot ||
                item.product?.images?.find?.((img: { isMain?: boolean }) => img.isMain)?.url ||
                item.product?.images?.[0]?.url ||
                null;
              return (
                <div
                  key={item.id}
                  className="flex min-w-[156px] flex-1 items-center gap-2.5 rounded-md border border-[#eceef0] bg-white p-2"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#f1f2f3]">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image} alt={item.productNameSnapshot || item.product?.name || "Product"} className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-4 w-4 text-[#8d877f]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-[#1e1e1e]">
                      {item.productNameSnapshot || item.product?.name || "Item"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#8d877f]">
                      Qty {item.quantity} · {formatCurrency(item.totalPrice)}
                    </p>
                  </div>
                </div>
              );
            })}
            {itemCount > itemPreview.length ? (
              <div className="flex h-[62px] min-w-[82px] items-center justify-center rounded-md border border-dashed border-[#d7d9dc] bg-white px-3 text-center text-[11px] font-medium text-[#6c675f]">
                +{itemCount - itemPreview.length} more
              </div>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px]">
            <span
              className={
                "inline-flex items-center rounded-full px-2.5 py-1 font-semibold ring-1 " +
                paymentBadgeClass(order.paymentStatus)
              }
            >
              Payment {order.paymentStatus}
            </span>
            {quotePending ? (
              <span className="inline-flex items-center rounded-full bg-kwik-orange/10 px-2.5 py-1 font-semibold text-kwik-orange ring-1 ring-kwik-orange/20">
                Quote pending
              </span>
            ) : null}
            <span className="rounded-full bg-[#f5f3ef] px-2.5 py-1 font-medium text-[#6c675f]">
              {isPickup ? "Show order ID at store" : "Track in detail view"}
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-[#eceef0] pt-3">
          <div>
            <p className="text-lg font-semibold text-[#1e1e1e] tabular-nums">
              {formatCurrency(order.totalAmount)}
            </p>
            <p className="text-[12px] text-[#8d877f]">
              {order.paymentStatus === "PAID"
                ? "Paid · escrow held"
                : order.paymentStatus === "REFUNDED"
                  ? "Refunded"
                  : "Payment pending"}
            </p>
          </div>
          <span className="inline-flex h-8 items-center gap-1 rounded-md bg-[#171717] px-3 text-xs font-medium text-white">
            Details <ChevronRight className="h-4 w-4" />
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
          className="rounded-[10px] border border-kwik-border bg-white p-4"
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
  const { isLoading: isAuthLoading } = useAuth();
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
    <div className="min-h-screen bg-[#f6f7f8]">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8"
      >
        <header className="mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#141414]">
              My Orders
            </h1>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-[#73777d] sm:text-sm">
              Follow delivery, payment, and escrow progress in one clean workspace.
            </p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            <div className="rounded-lg border border-[#e3e5e8] bg-white px-3.5 py-3">
              <p className="text-[11px] text-[#73777d]">All orders</p>
              <p className="mt-0.5 text-xl font-semibold text-[#181818]">{counts.all}</p>
            </div>
            <div className="rounded-lg border border-[#e3e5e8] bg-white px-3.5 py-3">
              <p className="text-[11px] text-[#73777d]">Active</p>
              <p className="mt-0.5 text-xl font-semibold text-[#181818]">{counts.active}</p>
            </div>
            <div className="rounded-lg border border-[#e3e5e8] bg-white px-3.5 py-3">
              <p className="text-[11px] text-[#73777d]">Completed</p>
              <p className="mt-0.5 text-xl font-semibold text-[#181818]">{counts.completed}</p>
            </div>
            <div className="rounded-lg border border-[#e3e5e8] bg-white px-3.5 py-3">
              <p className="text-[11px] text-[#73777d]">Total value</p>
              <p className="mt-0.5 truncate text-lg font-semibold text-[#181818] tabular-nums">{formatCurrency(totalValue)}</p>
            </div>
          </div>
        </header>

        {/* Filter tabs */}
        {orders.length > 0 ? (
          <div
            role="tablist"
            aria-label="Filter orders by status"
            className="mb-4 flex w-full gap-1 overflow-x-auto rounded-lg border border-[#e3e5e8] bg-white p-1"
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
                    "inline-flex min-w-max flex-1 items-center justify-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors " +
                    (isActive
                      ? "bg-[#171717] text-white"
                      : "text-[#736d65] hover:text-[#171717]")
                  }
                >
                  {tab.label}
                  <span
                    className={
                      "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] tabular-nums " +
                      (isActive
                        ? "bg-white/15 text-white"
                        : "bg-[#f1f2f3] text-[#736d65]")
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
            className="rounded-lg border border-kwik-border bg-white"
          />
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
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
          <p className="mt-8 flex items-center justify-center gap-1.5 text-center text-xs text-[#8d877f]">
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
      <BuyerOrdersPageInner />
  );
}
