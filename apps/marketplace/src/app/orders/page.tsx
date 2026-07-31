"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Package, Store, Sparkles, Clock, CheckCircle2, Wallet, ShieldCheck, ChevronRight, Truck, CreditCard } from "lucide-react";
import { ordersApi } from "@kwikseller/api-client";
import type { Order } from "@kwikseller/types";
import { EmptyState, OrderStatusBadge, Skeleton } from "@kwikseller/ui";
import { kwikToast, useAuth } from "@kwikseller/utils";
import {
  ACTIVE_ORDER_STATUSES as ACTIVE_STATUSES,
  CANCELLED_ORDER_STATUSES as CANCELLED_STATUSES,
  COMPLETED_ORDER_STATUSES as COMPLETED_STATUSES,
  ORDER_LIST_TABS as TABS,
  type OrderListTabKey as TabKey,
} from "@/constants/marketplace";
import { useOrderWorkflowStore } from "@/stores/order-workflow-store";
import type { OrderWorkflowState } from "@/types/order-workflow";
import { ORDER_STATUS_META, OrderStatus, KwisCrow } from "@/constants/order-workflow";
import { cn } from "@/lib/utils";

/* ─── Helpers ─── */

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
  const delivery = order.delivery as { deliveryAddress?: string } | undefined;
  if (delivery?.deliveryAddress) return delivery.deliveryAddress;
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

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

/**
 * Determine which of the 4 macro workflow phases an order is in.
 * Used for the mini progress bar on order cards.
 */
function getWorkflowPhase(status: string): { phase: number; label: string } {
  const s = status as keyof typeof OrderStatus;
  const quoteStatuses = [OrderStatus.PENDING_QUOTE, OrderStatus.QUOTED, OrderStatus.TO_PAY];
  const payStatuses = [OrderStatus.PAID];
  const shipStatuses = [OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED];
  const receiveStatuses = [OrderStatus.RECEIVED, OrderStatus.COMPLETED];

  if (quoteStatuses.includes(s as any)) return { phase: 1, label: "Quotation" };
  if (payStatuses.includes(s as any)) return { phase: 2, label: "Payment" };
  if (shipStatuses.includes(s as any)) return { phase: 3, label: "Shipping" };
  if (receiveStatuses.includes(s as any)) return { phase: 4, label: "Received" };
  return { phase: 0, label: "—" };
}

/**
 * Mini 4-step progress bar for order cards (matches the order detail page's
 * OrderProgressBar but compact).
 */
function MiniProgressBar({ status }: { status: string }) {
  const { phase } = getWorkflowPhase(status);
  const isAbnormal = status === "DISPUTED" || status === "CANCELLED" || status === "RETURNED";
  const steps = ["Quote", "Pay", "Ship", "Receive"];
  const fillWidth = isAbnormal ? 100 : (phase / 4) * 100;

  return (
    <div className="flex items-center gap-1.5">
      {steps.map((step, idx) => {
        const reached = !isAbnormal && phase > idx;
        const isCurrent = !isAbnormal && phase === idx + 1;
        return (
          <div key={step} className="flex items-center gap-1">
            <div
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold transition",
                reached
                  ? "bg-primary-500 text-white"
                  : isCurrent
                    ? "bg-primary-100 text-primary-700 ring-2 ring-primary-500/30"
                    : "bg-gray-100 text-gray-400",
                isAbnormal && "bg-warning text-white",
              )}
            >
              {reached ? "✓" : idx + 1}
            </div>
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-4 rounded-full",
                  reached ? "bg-primary-500" : "bg-gray-200",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function BuyerOrderCard({ order, onClick }: { order: Order; onClick: () => void }) {
  const itemNames = getItemNames(order);
  const deliveryAddress = getDeliveryAddress(order);
  const statusMeta = ORDER_STATUS_META[order.status as keyof typeof ORDER_STATUS_META];
  const phase = getWorkflowPhase(order.status);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-surface text-left shadow-sm transition hover:border-primary-300 hover:shadow-md"
    >
      {/* Gradient header strip (matches order detail page) */}
      <div className="kwik-gradient px-5 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/80">
              Order {getOrderRef(order)}
            </p>
            <p className="mt-0.5 text-xs text-white/85">
              {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {order.paymentStatus === "PAID" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
                <ShieldCheck className="h-3 w-3" />
                {KwisCrow.NAME}
              </span>
            )}
            <OrderStatusBadge status={order.status} size="sm" />
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        {/* Vendor + items */}
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <Store className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground">{getStoreName(order) ?? "Vendor store"}</p>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {itemNames.length ? itemNames.join(", ") : `${getItemCount(order)} item${getItemCount(order) === 1 ? "" : "s"}`}
            </p>
            {deliveryAddress ? (
              <p className="mt-1 truncate text-xs text-muted-foreground">{deliveryAddress}</p>
            ) : null}
          </div>
        </div>

        {/* Mini progress bar */}
        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              Progress
            </span>
            <MiniProgressBar status={order.status} />
          </div>
          <span className="text-[10px] font-medium text-gray-500">
            {phase.label}
          </span>
        </div>

        {/* Footer: amount + view details */}
        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
          <div>
            <p className="font-heading text-lg font-bold text-foreground">
              {formatCurrency(Number(order.totalAmount ?? 0))}
            </p>
            <p className="text-xs text-muted-foreground">
              {order.paymentStatus === "PAID"
                ? "Paid · Escrow held"
                : order.paymentStatus === "REFUNDED"
                  ? "Refunded"
                  : "Payment pending"}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600">
            View details <ChevronRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </motion.button>
  );
}

function getStoreName(order: Order): string | undefined {
  return order.store?.name;
}

/* ─── Mock order adapter ─── */
/**
 * Convert an OrderWorkflowState (from the Zustand mock store) into the Order
 * shape this page expects, so the orders list is useful even when the live API
 * is unreachable / the buyer is not authenticated.
 */
function mockOrderToOrder(state: OrderWorkflowState): Order {
  const itemsTotal = state.items.reduce(
    (sum, i) => sum + i.unitPrice * i.quantity,
    0,
  );
  const deliveryFee = state.escrow?.amount
    ? Math.max(0, state.escrow.amount - itemsTotal)
    : state.quotation?.deliveryFee ?? 0;
  const discount = state.quotation?.discount ?? 0;
  const total = itemsTotal + deliveryFee - discount;

  const paymentStatus =
    state.status === "PAID" ||
    state.status === "PROCESSING" ||
    state.status === "SHIPPED" ||
    state.status === "OUT_FOR_DELIVERY" ||
    state.status === "DELIVERED" ||
    state.status === "RECEIVED" ||
    state.status === "COMPLETED"
      ? "PAID"
      : state.status === "CANCELLED" || state.status === "RETURNED"
        ? "REFUNDED"
        : "PENDING";

  return {
    id: state.id,
    checkoutReference: state.ref,
    status: state.status,
    paymentStatus,
    totalAmount: total,
    createdAt: state.createdAt,
    updatedAt: state.updatedAt,
    store: {
      id: state.vendor.id,
      name: state.vendor.name,
      logoUrl: state.vendor.logo ?? undefined,
    },
    items: state.items.map((item) => ({
      id: item.productId,
      quantity: item.quantity,
      product: {
        id: item.productId,
        name: item.name,
        price: item.unitPrice,
        images: item.image ? [{ url: item.image, isMain: true }] : [],
      },
    })),
    delivery: { deliveryAddress: state.deliveryAddress },
  } as Order;
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

  // Mock orders from the Zustand order-workflow store (always available).
  const mockOrders = useOrderWorkflowStore((s) => s.orders);

  const { data: apiOrders = [], isLoading } = useQuery<Order[]>({
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

  // Use live API orders when authenticated + available; otherwise fall back to
  // the mock workflow orders so the page is always useful (demo / no-backend).
  const orders = useMemo<Order[]>(() => {
    if (isAuthenticated && apiOrders.length > 0) return apiOrders;
    return mockOrders.map(mockOrderToOrder);
  }, [isAuthenticated, apiOrders, mockOrders]);

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

  // While auth is resolving, show the skeleton briefly.
  if (isAuthLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <OrderListSkeleton />
      </div>
    );
  }

  const isDemoMode = !isAuthenticated || apiOrders.length === 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero header (matches order detail page design) */}
      <section className="kwik-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_55%)]" />
        <div className="container mx-auto max-w-4xl px-4 py-8 relative">
          {/* Back link */}
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
              order is protected by {KwisCrow.NAME} escrow.
            </p>
          </motion.div>
        </div>
      </section>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mx-auto max-w-4xl px-4 py-6"
      >

      {/* Demo-mode banner */}
      {isDemoMode ? (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary-200 bg-primary-50 p-4">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />
          <div className="text-sm leading-5 text-primary-800">
            <span className="font-semibold">Demo orders.</span>{" "}
            These sample orders show the full 1688-style workflow — from vendor
            quotation through KwisCrow escrow. Sign in to see your real orders.
          </div>
        </div>
      ) : null}

      {/* Stats summary bar */}
      {orders.length > 0 ? (
        <div className="mb-6 grid grid-cols-2 gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <p className="font-heading text-lg font-bold text-foreground">{orders.length}</p>
              <p className="text-[11px] text-gray-500">Total orders</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary-50 text-secondary-600">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="font-heading text-lg font-bold text-foreground">{counts.active}</p>
              <p className="text-[11px] text-gray-500">Active</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 text-success">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <p className="font-heading text-lg font-bold text-foreground">{counts.completed}</p>
              <p className="text-[11px] text-gray-500">Completed</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10 text-warning">
              <Wallet className="h-4 w-4" />
            </div>
            <div>
              <p className="font-heading text-lg font-bold text-foreground">
                {formatCurrency(
                  orders.reduce((sum, o) => sum + Number(o.totalAmount ?? 0), 0),
                )}
              </p>
              <p className="text-[11px] text-gray-500">Total value</p>
            </div>
          </div>
        </div>
      ) : null}

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
            <BuyerOrderCard
              key={order.id}
              order={order}
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
    </div>
  );
}
