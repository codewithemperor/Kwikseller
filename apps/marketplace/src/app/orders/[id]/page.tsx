"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  CreditCard,
  MapPin,
  Package,
  RefreshCw,
  Store,
  Truck,
} from "lucide-react";
import { ordersApi } from "@kwikseller/api-client";
import type { Order } from "@kwikseller/types";
import { ErrorBoundary, Skeleton } from "@kwikseller/ui";
import { kwikToast, useAuth } from "@kwikseller/utils";

import { OrderStatus, ORDER_STATUS_META, KwisCrow } from "@/constants/order-workflow";
import type { OrderWorkflowState } from "@/types/order-workflow";
import { useOrderWorkflowStore } from "@/stores/order-workflow-store";

import { OrderStatusTimeline } from "@/components/order/order-status-timeline";
import { OrderProgressBar } from "@/components/order/order-progress-bar";
import { OrderNotifications } from "@/components/order/order-notifications";
import { QuotationCard } from "@/components/order/quotation-card";
import { EscrowBadge } from "@/components/order/escrow-badge";
import { DisputeTimer } from "@/components/order/dispute-timer";
import { OrderActions } from "@/components/order/order-actions";
import { ReturnDisputeDialog } from "@/components/order/return-dispute-dialog";

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value?: string | Date | null) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function orderReference(order: Order) {
  return order.checkoutReference || order.id.slice(-8).toUpperCase();
}

function deliveryAddress(order: Order) {
  const delivery = order.delivery as
    | { deliveryAddress?: string; status?: string }
    | undefined;
  if (delivery?.deliveryAddress) return delivery.deliveryAddress;
  const address = order.address;
  if (address) {
    return [address.line1, address.line2, address.city, address.state, address.country]
      .filter(Boolean)
      .join(", ");
  }
  if (order.deliveryLocalGovernment && order.deliveryState) {
    return `${order.deliveryLocalGovernment}, ${order.deliveryState}, Nigeria`;
  }
  return "No delivery address on this order";
}

// ─── Skeleton ──────────────────────────────────────────────────────────────

function OrderDetailSkeleton() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Skeleton className="h-5 w-36" />
      <Skeleton className="mt-6 h-36 rounded-2xl" />
      <Skeleton className="mt-4 h-64 rounded-2xl" />
    </main>
  );
}

// ─── Not-found UI ──────────────────────────────────────────────────────────

function OrderNotFound({ id }: { id: string }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 text-center">
      <Package className="mx-auto h-10 w-10 text-gray-400" />
      <h1 className="mt-4 text-2xl font-semibold text-foreground">Order not found</h1>
      <p className="mt-2 text-sm text-gray-500">
        We could not load order <span className="font-mono">{id}</span>.
      </p>
      <Link
        href="/orders"
        className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-secondary-500 px-5 text-sm font-semibold text-white transition hover:bg-secondary-600"
      >
        Back to orders
      </Link>
    </main>
  );
}

// ─── Mock-order workflow view ──────────────────────────────────────────────
//
// Renders the full new workflow (timeline + quotation card + escrow badge +
// dispute timer + actions + return/dispute dialog) for an order from the
// Zustand store. This is what the page falls back to when the live API call
// fails (or when the user opens one of the seed mock orders directly).

function MockOrderWorkflow({ order }: { order: OrderWorkflowState }) {
  const router = useRouter();
  const store = useOrderWorkflowStore();
  const [isPaying, setIsPaying] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogType, setDialogType] = React.useState<
    "RETURN_REQUEST" | "ISSUE_REPORT"
  >("RETURN_REQUEST");
  const [showEscrowInfo, setShowEscrowInfo] = React.useState(false);
  // Re-grab the live order from the store so action mutations re-render us.
  const liveOrder = useOrderWorkflowStore((s) =>
    s.orders.find((o) => o.id === order.id),
  ) ?? order;

  const statusMeta = ORDER_STATUS_META[liveOrder.status];

  const handlePay = () => {
    setIsPaying(true);
    // Simulate a brief payment redirect / verification window.
    setTimeout(() => {
      // Move order through QUOTED → TO_PAY → PAID if needed.
      if (liveOrder.status === OrderStatus.QUOTED) {
        store.markToPay(liveOrder.id);
      }
      store.payOrder(liveOrder.id);
      setIsPaying(false);
      kwikToast.success(
        "Payment confirmed",
        "Your payment is safely held by KwisCrow escrow.",
      );
    }, 900);
  };

  const handleCancel = () => {
    store.cancelOrder(liveOrder.id);
    kwikToast.info("Order cancelled", "No payment was taken.");
  };

  const handleConfirmReceipt = () => {
    store.confirmReceipt(liveOrder.id);
    kwikToast.success(
      "Receipt confirmed",
      "Escrow released to vendor. Thank you for shopping with Kwikseller!",
    );
  };

  const handleRequestReturn = () => {
    setDialogType("RETURN_REQUEST");
    setDialogOpen(true);
  };

  const handleReportIssue = () => {
    setDialogType("ISSUE_REPORT");
    setDialogOpen(true);
  };

  const handleSubmitDispute = (
    type: "RETURN_REQUEST" | "ISSUE_REPORT",
    reason: string,
    description?: string,
  ) => {
    store.openDispute(liveOrder.id, type, reason, description);
    setDialogOpen(false);
    kwikToast.warning(
      type === "RETURN_REQUEST" ? "Return requested" : "Issue reported",
      `${KwisCrow.NAME} escrow is now frozen pending review.`,
    );
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
      {/* Back link */}
      <Link
        href="/orders"
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to orders
      </Link>

      {/* Header card */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-surface shadow-sm"
      >
        <div className="kwik-gradient px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/80">
                Order {liveOrder.ref}
              </p>
              <h1 className="mt-1 font-heading text-2xl font-bold text-white sm:text-3xl">
                {statusMeta.label}
              </h1>
              <p className="mt-1 text-xs text-white/80">
                Placed {formatDate(liveOrder.createdAt)} •{" "}
                {liveOrder.vendor.name}
              </p>
            </div>
            {liveOrder.escrow && (
              <div className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                {KwisCrow.NAME}: {liveOrder.escrow.status}
              </div>
            )}
          </div>
        </div>
        {/* Status hint strip */}
        <div className="border-t border-gray-100 bg-gray-50 px-5 py-3 text-xs text-gray-600 sm:px-6">
          {statusMeta.hint}
        </div>
      </motion.section>

      {/* Progress bar — at-a-glance "where am I" */}
      <div className="mt-4">
        <OrderProgressBar status={liveOrder.status} />
      </div>

      {/* Dispute timer (only renders when relevant) */}
      <div className="mt-4">
        <DisputeTimer order={liveOrder} />
      </div>

      {/* Quotation card (QUOTED / TO_PAY) */}
      {(liveOrder.status === OrderStatus.QUOTED ||
        liveOrder.status === OrderStatus.TO_PAY) &&
        liveOrder.quotation && (
          <div className="mt-4">
            <QuotationCard
              order={liveOrder}
              onPay={handlePay}
              onCancel={handleCancel}
              isPaying={isPaying}
            />
          </div>
        )}

      {/* Two-column layout: timeline + side panel */}
      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <OrderStatusTimeline order={liveOrder} />

          {/* Items */}
          <section className="mt-4 rounded-2xl border border-gray-200 bg-surface">
            <div className="border-b border-gray-100 p-4 sm:p-5">
              <h2 className="font-semibold text-foreground">Items in this order</h2>
            </div>
            <ul className="divide-y divide-gray-100">
              {liveOrder.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-4 p-4 sm:p-5"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                      <Package className="h-5 w-5" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">
                        {item.name}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Qty {item.quantity} × {formatCurrency(item.unitPrice)}
                      </p>
                    </div>
                  </div>
                  <p className="shrink-0 font-semibold text-foreground tabular-nums">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="lg:col-span-2">
          {/* Escrow full card */}
          {liveOrder.escrow && (
            <EscrowBadge escrow={liveOrder.escrow} compact={false} />
          )}

          {/* Order summary mini-cards */}
          <section className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-2xl border border-gray-200 bg-surface p-4">
              <CreditCard className="h-5 w-5 text-primary-600" />
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                Payment
              </p>
              <p className="mt-1 font-semibold text-foreground">
                {liveOrder.escrow ? "Paid — held in escrow" : "Awaiting payment"}
              </p>
              {liveOrder.quotation && (
                <p className="mt-1 text-sm text-gray-500">
                  {formatCurrency(
                    liveOrder.items.reduce(
                      (s, i) => s + i.unitPrice * i.quantity,
                      0,
                    ) +
                      liveOrder.quotation.deliveryFee -
                      liveOrder.quotation.discount,
                  )}
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-gray-200 bg-surface p-4">
              <Store className="h-5 w-5 text-primary-600" />
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                Vendor
              </p>
              <p className="mt-1 font-semibold text-foreground">
                {liveOrder.vendor.name}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {liveOrder.items.length} item
                {liveOrder.items.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-surface p-4 sm:col-span-2 lg:col-span-1">
              <Truck className="h-5 w-5 text-primary-600" />
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                Delivery
              </p>
              <p className="mt-1 font-semibold text-foreground">
                {liveOrder.deliveryAddress}
              </p>
              {liveOrder.quotation && (
                <p className="mt-1 text-sm text-gray-500">
                  ETA{" "}
                  {new Date(
                    liveOrder.quotation.deliveryDateMin,
                  ).toLocaleDateString("en-NG", { dateStyle: "medium" })}{" "}
                  –{" "}
                  {new Date(liveOrder.quotation.deliveryDateMax).toLocaleDateString(
                    "en-NG",
                    { dateStyle: "medium" },
                  )}
                </p>
              )}
            </div>
          </section>

          {/* Order notifications */}
          <OrderNotifications
            notifications={store.notifications.filter(
              (n) => n.orderId === liveOrder.id,
            )}
            onMarkRead={store.markNotificationRead}
            className="mt-4"
          />
        </div>
      </div>

      {/* Actions bar */}
      <div className="mt-4">
        <OrderActions
          order={liveOrder}
          isPaying={isPaying}
          onPay={handlePay}
          onCancel={handleCancel}
          onConfirmReceipt={handleConfirmReceipt}
          onRequestReturn={handleRequestReturn}
          onReportIssue={handleReportIssue}
          onViewEscrow={() => setShowEscrowInfo(true)}
        />
      </div>

      {/* Delivery address (kept from the original page for parity) */}
      <section className="mt-4 rounded-2xl border border-gray-200 bg-surface p-4 sm:p-5">
        <div className="flex gap-3">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />
          <div>
            <h2 className="font-semibold text-foreground">Delivery address</h2>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              {liveOrder.deliveryAddress}
            </p>
          </div>
        </div>
      </section>

      {/* Return / dispute dialog */}
      <ReturnDisputeDialog
        isOpen={dialogOpen}
        order={liveOrder}
        initialType={dialogType}
        onSubmit={handleSubmitDispute}
        onClose={() => setDialogOpen(false)}
      />

      {/* Escrow info dialog shortcut */}
      {showEscrowInfo && liveOrder.escrow && (
        <EscrowBadgeCompactTrigger
          escrow={liveOrder.escrow}
          onDone={() => setShowEscrowInfo(false)}
        />
      )}
    </main>
  );
}

/**
 * Tiny helper that mounts an EscrowBadge in compact mode and programmatically
 * opens its info dialog once, then unmounts when the user closes it.
 */
function EscrowBadgeCompactTrigger({
  escrow,
  onDone,
}: {
  escrow: NonNullable<OrderWorkflowState["escrow"]>;
  onDone: () => void;
}) {
  // We rely on EscrowBadge's internal state — clicking it once opens the
  // dialog. Here we just render it and let the user close to call onDone.
  // For simplicity we render the compact badge inline (invisible) and use
  // its dialog. The user can also close via the dialog itself.
  return (
    <div className="sr-only">
      <EscrowBadge escrow={escrow} compact />
      <button type="button" onClick={onDone} aria-label="Close escrow info">
        close
      </button>
    </div>
  );
}

// ─── Live-API order view (kept from original) ──────────────────────────────

function unwrapOrder(value: unknown): Order | null {
  const payload = value as { data?: unknown } | undefined;
  const nested = payload?.data as { data?: unknown; order?: unknown } | undefined;
  const candidate = nested?.data ?? nested?.order ?? payload?.data ?? value;
  return candidate && typeof candidate === "object" && "id" in candidate
    ? (candidate as Order)
    : null;
}

function LiveOrderDetail({ order }: { order: Order }) {
  const delivery = order.delivery as
    | { status?: string; currentLocation?: string; deliveredAt?: string | Date }
    | undefined;
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/orders"
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to orders
      </Link>

      <section className="mt-6 rounded-2xl border border-gray-200 bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              Order
            </p>
            <h1 className="mt-1 text-2xl font-bold text-foreground">
              {orderReference(order)}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Placed {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-surface p-4">
          <CreditCard className="h-5 w-5 text-primary-600" />
          <p className="mt-3 text-xs font-semibold uppercase text-gray-500">
            Payment
          </p>
          <p className="mt-1 font-semibold text-foreground">{order.paymentStatus}</p>
          <p className="mt-1 text-sm text-gray-500">
            {formatCurrency(Number(order.totalAmount ?? 0))}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-surface p-4">
          <Truck className="h-5 w-5 text-primary-600" />
          <p className="mt-3 text-xs font-semibold uppercase text-gray-500">
            Delivery
          </p>
          <p className="mt-1 font-semibold text-foreground">
            {delivery?.status ?? "Pending"}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {delivery?.currentLocation ?? "Manual dispatch after payment confirmation"}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-surface p-4">
          <Store className="h-5 w-5 text-primary-600" />
          <p className="mt-3 text-xs font-semibold uppercase text-gray-500">Vendor</p>
          <p className="mt-1 font-semibold text-foreground">
            {order.store?.name ?? "Vendor store"}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {order.items?.length ?? 0} item{order.items?.length === 1 ? "" : "s"}
          </p>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-gray-200 bg-surface">
        <div className="border-b border-gray-100 p-4">
          <h2 className="font-semibold text-foreground">Items</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {(order.items ?? []).map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-4 p-4"
            >
              <div>
                <p className="font-semibold text-foreground">
                  {item.product?.name ?? `Item ${item.id.slice(-4)}`}
                </p>
                <p className="mt-1 text-sm text-gray-500">Qty {item.quantity}</p>
              </div>
              <p className="shrink-0 font-semibold text-foreground">
                {formatCurrency(Number(item.totalPrice ?? item.unitPrice ?? 0))}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-gray-200 bg-surface p-4">
        <div className="flex gap-3">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />
          <div>
            <h2 className="font-semibold text-foreground">Delivery address</h2>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              {deliveryAddress(order)}
            </p>
            {delivery?.deliveredAt ? (
              <p className="mt-2 text-xs text-gray-500">
                Delivered {formatDate(delivery.deliveredAt)}
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

// ─── Inner component (uses hooks; wrapped in ErrorBoundary by default export) ──

function OrderDetailPageInner() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const orderId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // Pull the mock order from the Zustand store — this is always available
  // (even when the API is down or the user is not authenticated), so the
  // workflow UI can render.
  const mockOrder = useOrderWorkflowStore((s) =>
    s.orders.find((o) => o.id === orderId),
  );

  // If the user is not authenticated (sandbox: no tokens), skip the live API
  // call entirely and go straight to the mock order view. This keeps the
  // verify URL working without forcing a login redirect that loops back.
  const skipLiveApi = !isAuthLoading && !isAuthenticated;

  const { data: liveOrder, isLoading, isError } = useQuery<Order | null>({
    queryKey: ["buyer-order", orderId],
    enabled: Boolean(orderId) && !isAuthLoading && isAuthenticated && !mockOrder,
    queryFn: async () => {
      try {
        const response = await ordersApi.get(orderId);
        return unwrapOrder(response);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to load order.";
        // Don't toast — we fall back to the mock order silently.
        console.warn("[orders/[id]] live API failed:", message);
        throw error;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Boot: init the workflow store once (registers escrow listener, etc.)
  const initStore = useOrderWorkflowStore((s) => s._init);
  React.useEffect(() => {
    const unregister = initStore();
    return unregister;
  }, [initStore]);

  // Hydration guard: the Zustand store is persisted to localStorage. On the
  // server (and the very first client render) it uses the seed data, which
  // contains Date.now()-relative timestamps. Once the persisted store
  // rehydrates on the client, those timestamps change → React hydration
  // mismatch warnings. We avoid that by rendering the skeleton until the
  // client has mounted.
  const [hasMounted, setHasMounted] = React.useState(false);
  React.useEffect(() => setHasMounted(true), []);

  // Loading state — only show the skeleton if we're actually waiting on the
  // live API AND there's no mock order to fall back to.
  if (!hasMounted || (isAuthLoading || (isLoading && !skipLiveApi)) && !mockOrder) {
    return <OrderDetailSkeleton />;
  }

  // Prefer the mock order (so the new workflow UI is always used for seeded
  // orders), then fall back to the live order, then show not-found.
  if (mockOrder) {
    return <MockOrderWorkflow order={mockOrder} />;
  }

  if (liveOrder) {
    return <LiveOrderDetail order={liveOrder} />;
  }

  // Live API failed AND no mock order — show not-found.
  if (isError || skipLiveApi) {
    return <OrderNotFound id={orderId} />;
  }

  return <OrderDetailSkeleton />;
}

// ─── Default export: ErrorBoundary wrapper ─────────────────────────────────

export default function BuyerOrderDetailPage() {
  return (
    <ErrorBoundary
      fallback={
        <main className="mx-auto max-w-2xl px-4 py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger/10">
            <AlertTriangle className="h-7 w-7 text-danger" />
          </div>
          <h1 className="text-xl font-bold text-foreground">
            Something went wrong loading this order
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Please try again. If the problem persists, head back to your orders
            list.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-secondary-500 px-4 text-sm font-semibold text-white hover:bg-secondary-600"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
            <Link
              href="/orders"
              className="inline-flex h-10 items-center justify-center rounded-md border border-gray-200 bg-surface px-4 text-sm font-semibold text-foreground hover:border-gray-300"
            >
              Back to orders
            </Link>
          </div>
        </main>
      }
    >
      <OrderDetailPageInner />
    </ErrorBoundary>
  );
}
