"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Package } from "lucide-react";
import { ordersApi } from "@kwikseller/api-client";
import type { Order } from "@kwikseller/types";
import { EmptyState, OrderCard, Skeleton } from "@kwikseller/ui";
import { kwikToast, useAuth } from "@kwikseller/utils";

/* ─── Helpers ─── */

type TabKey = "all" | "active" | "completed" | "cancelled";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const ACTIVE_STATUSES = [
  "PENDING",
  "PENDING_PAYMENT",
  "PAID",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "FULFILLED",
];
const COMPLETED_STATUSES = ["DELIVERED"];
const CANCELLED_STATUSES = ["CANCELLED", "REFUNDED"];

/**
 * The api-client wraps responses in ApiResponse<T> = { success, data, ... }.
 * The backend response interceptor also wraps. This helper handles every
 * shape we've seen (data array nested 1 or 2 levels deep).
 */
function unwrapOrders(value: unknown): Order[] {
  const payload = value as { data?: unknown } | undefined;
  const nested = payload?.data as { data?: unknown; orders?: unknown } | undefined;
  const data = nested?.data ?? nested?.orders ?? payload?.data ?? value;
  if (Array.isArray(data)) return data as Order[];
  const objectData = data as { orders?: unknown; data?: unknown } | undefined;
  if (Array.isArray(objectData?.orders)) return objectData.orders as Order[];
  if (Array.isArray(objectData?.data)) return objectData.data as Order[];
  return [];
}

function filterByTab(orders: Order[], tab: TabKey): Order[] {
  if (tab === "all") return orders;
  const allowed =
    tab === "active"
      ? ACTIVE_STATUSES
      : tab === "completed"
        ? COMPLETED_STATUSES
        : CANCELLED_STATUSES;
  return orders.filter((order) => allowed.includes(order.status));
}

function getOrderRef(order: Order): string {
  return (
    order.checkoutReference ||
    order.id.slice(-8).toUpperCase()
  );
}

function getItemNames(order: Order): string[] {
  return (order.items ?? [])
    .map((item) => item.product?.name ?? `Item ${item.id.slice(-4)}`)
    .filter(Boolean);
}

function getItemCount(order: Order): number {
  return (order.items ?? []).reduce(
    (sum, item) => sum + (item.quantity ?? 0),
    0,
  );
}

function getDeliveryAddress(order: Order): string | undefined {
  if (order.delivery?.deliveryAddress) return order.delivery.deliveryAddress;
  const address = order.address;
  if (address) {
    return [address.line1, address.city, address.state]
      .filter(Boolean)
      .join(", ");
  }
  if (order.deliveryLocalGovernment && order.deliveryState) {
    return `${order.deliveryLocalGovernment}, ${order.deliveryState}`;
  }
  return undefined;
}

function getStoreName(order: Order): string | undefined {
  return order.store?.name;
}

/* ─── Skeleton ─── */

function OrderListSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-kwik-border bg-surface p-4"
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
          <div className="mt-4 flex items-center justify-between border-t border-kwik-border pt-3">
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

/* ─── Page ─── */

export default function BuyerOrdersPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  // Redirect to login if not authenticated (after auth check completes)
  React.useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace("/login?redirect=/orders");
    }
  }, [isAuthLoading, isAuthenticated, router]);

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["buyer-orders"],
    enabled: !isAuthLoading && isAuthenticated,
    queryFn: async () => {
      try {
        const response = await ordersApi.list({ limit: 50 });
        return unwrapOrders(response);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load orders.";
        kwikToast.error("Couldn't load your orders", message);
        throw err;
      }
    },
    staleTime: 30 * 1000,
  });

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

  // Show nothing while auth is still resolving (avoid flash of login redirect)
  if (isAuthLoading || (!isAuthLoading && !isAuthenticated)) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <OrderListSkeleton />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-4xl px-4 py-8"
    >
      {/* Back link */}
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to marketplace
      </Link>

      {/* Page header */}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
            My Orders
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track, confirm, and manage all your marketplace purchases.
          </p>
        </div>
      </header>

      {/* Filter tabs */}
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
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-kwik-border bg-surface text-muted-foreground hover:border-accent/40 hover:text-foreground")
              }
            >
              {tab.label}
              <span
                className={
                  "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] tabular-nums " +
                  (isActive
                    ? "bg-accent-foreground/15 text-accent-foreground"
                    : "bg-default-100 text-muted-foreground")
                }
              >
                {counts[tab.key]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <OrderListSkeleton />
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          variant="orders"
          title={
            activeTab === "all"
              ? "You haven't placed any orders yet"
              : activeTab === "active"
                ? "No active orders"
                : activeTab === "completed"
                  ? "No completed orders yet"
                  : "No cancelled orders"
          }
          description={
            activeTab === "all"
              ? "When you make a purchase, your orders will appear here so you can track delivery, confirm receipt, or open a dispute."
              : "Try switching tabs to see orders in other states."
          }
          action={{
            label: "Start shopping",
            onClick: () => router.push("/"),
          }}
          className="rounded-2xl border border-kwik-border bg-surface"
        />
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              orderRef={getOrderRef(order)}
              status={order.status}
              paymentStatus={order.paymentStatus}
              storeName={getStoreName(order)}
              itemNames={getItemNames(order)}
              itemCount={getItemCount(order)}
              totalAmount={Number(order.totalAmount ?? 0)}
              date={order.createdAt}
              deliveryAddress={getDeliveryAddress(order)}
              onClick={() => router.push(`/orders/${order.id}`)}
            />
          ))}
        </div>
      )}

      {/* Reorder hint footer (only shown when there are orders) */}
      {filteredOrders.length > 0 && (
        <p className="mt-8 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <Package className="h-3.5 w-3.5" />
          Tap an order to view full details, track delivery, or open a dispute.
        </p>
      )}
    </motion.div>
  );
}
