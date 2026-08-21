"use client";

/**
 * Customer Order Detail Page — driven by the REAL backend order lifecycle.
 *
 * Order state dimensions (see `apps/marketplace/src/lib/order-api.ts`):
 *   - `status` (OrderStatus): PENDING → PAID → PROCESSING → FULFILLED → DELIVERED → COMPLETED | CANCELLED
 *   - `paymentStatus`: PENDING → PAID | FAILED | REFUNDED
 *   - `quoteStatus`: PENDING_VENDOR_QUOTE → QUOTED → CUSTOMER_REQUESTED_REDUCTION → VENDOR_REVISED → AGREED | REJECTED | EXPIRED | CANCELLED
 *   - `deliveryMethod`: PICKUP | STANDARD_DELIVERY
 *   - `escrow.status`, `delivery.status`, `fulfillments[].status`
 *
 * Layout: workspace + sticky sidebar (two-column on lg+, single column on mobile)
 *
 * Sections:
 *   1. Header (order ref, date, overall status badge)
 *   2. [Workspace] Visual timeline (9 stages — highlights the current stage)
 *   3. [Workspace] Quote negotiation (STANDARD_DELIVERY only)
 *   4. [Workspace] Products (uses SNAPSHOT fields, never live product data)
 *   5. [Workspace] Payment + Kwikscrow status
 *   6. [Workspace] Delivery section
 *   7. [Sidebar]  Order summary (subtotal, processing fee, delivery fee, total)
 *   8. [Sidebar]  Context-aware customer actions
 *   9. [Sidebar]  Escrow/payment status indicator
 *  10. [Sidebar]  Vendor mini-card
 *
 * Styling: Tailwind + existing kwik-* semantic tokens. NO blue/indigo.
 */

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  MapPin,
  MessageSquareText,
  Package,
  RefreshCw,
  ShieldCheck,
  Store,
  Truck,
  XCircle,
} from "lucide-react";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountLayout } from "@/components/layout/account-layout";
import { kwikToast } from "@/lib/toast";
import { useAuth } from "@/lib/auth-context";
import {
  useAcceptQuote,
  useCancelOrder,
  useConfirmReceipt,
  useInitializePayment,
  useOrder,
  useQuote,
  useRejectQuote,
  useRequestReduction,
  type MarketplaceOrder,
  type MarketplaceOrderItem,
  type OrderQuote,
  type QuoteStatus,
  type QuoteRevision,
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

function formatDate(value?: string | Date | null): string {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function orderReference(order: MarketplaceOrder): string {
  return (
    order.checkoutReference ||
    order.id.slice(-8).toUpperCase()
  );
}

function getAutoReleaseDeadline(order: MarketplaceOrder): Date | null {
  if (order.deliveryMethod !== "STANDARD_DELIVERY") return null;
  const base = order.estimatedDeliveryEnd ?? order.delivery?.deliveredAt ?? order.escrow?.releaseAt;
  if (!base) return null;
  const deadline = new Date(base);
  if (Number.isNaN(deadline.getTime())) return null;
  if (order.estimatedDeliveryEnd || order.delivery?.deliveredAt) {
    deadline.setHours(deadline.getHours() + 24);
  }
  return deadline;
}

/** Display name for an order item — prefers the snapshot, falls back to live product. */
function itemDisplayName(item: MarketplaceOrderItem): string {
  return (
    item.productNameSnapshot ||
    item.product?.name ||
    `Item ${item.id.slice(-4)}`
  );
}

/** Display image for an order item — prefers the snapshot, falls back to live product. */
function itemDisplayImage(item: MarketplaceOrderItem): string | null {
  const snapshot = item.productImageSnapshot;
  if (snapshot && snapshot.trim() !== "") return snapshot;
  const main = item.product?.images?.find((i) => i.isMain) || item.product?.images?.[0];
  return main?.url ?? null;
}

/** Display variant name for an order item — prefers the snapshot. */
function itemDisplayVariant(item: MarketplaceOrderItem): string | null {
  const snapshot = item.variantNameSnapshot;
  if (snapshot && snapshot.trim() !== "") return snapshot;
  return item.variant?.name ?? null;
}

// ─── Status badge styling (NO blue/indigo — kwik-orange/green/red/gray) ────

const STATUS_BADGE_STYLES: Record<string, string> = {
  // Order status
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
  // Payment status
  AUTHORIZED: "bg-kwik-orange/10 text-kwik-orange ring-kwik-orange/20",
  FAILED: "bg-kwik-red/10 text-kwik-red ring-kwik-red/20",
  // Quote status
  PENDING_VENDOR_QUOTE: "bg-kwik-orange/10 text-kwik-orange ring-kwik-orange/20",
  QUOTED: "bg-kwik-orange/10 text-kwik-orange ring-kwik-orange/20",
  CUSTOMER_REQUESTED_REDUCTION: "bg-kwik-orange/10 text-kwik-orange ring-kwik-orange/20",
  VENDOR_REVISED: "bg-kwik-orange/10 text-kwik-orange ring-kwik-orange/20",
  AGREED: "bg-kwik-green/10 text-kwik-green ring-kwik-green/20",
  REJECTED: "bg-kwik-red/10 text-kwik-red ring-kwik-red/20",
  EXPIRED: "bg-kwik-red/10 text-kwik-red ring-kwik-red/20",
  // Escrow status
  HELD: "bg-kwik-orange/15 text-kwik-orange ring-kwik-orange/30",
  PENDING_RELEASE: "bg-kwik-orange/15 text-kwik-orange ring-kwik-orange/30",
  RELEASED: "bg-kwik-green/15 text-kwik-green ring-kwik-green/30",
  DISPUTED: "bg-kwik-red/10 text-kwik-red ring-kwik-red/20",
  PARTIAL: "bg-kwik-orange/15 text-kwik-orange ring-kwik-orange/30",
};

function StatusBadge({ status, className }: { status: string; className?: string }) {
  const normalized = status.replace(/_/g, " ");
  const style = STATUS_BADGE_STYLES[status] ?? "bg-gray-100 text-gray-600 ring-gray-200";
  return (
    <span
      className={
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 " +
        style +
        (className ? " " + className : "")
      }
    >
      {normalized}
    </span>
  );
}

// ─── Timeline stage computation ────────────────────────────────────────────
//
// 9 stages:
//   1. Order Placed
//   2. Vendor Quote
//   3. Quote Agreed
//   4. Payment
//   5. Kwikscrow Holding
//   6. Processing
//   7. Pickup / Delivery
//   8. Confirmed
//   9. Completed
//
// `current` = the stage the order is currently AT (highlighted).
// `reached` = stages the order has already passed (filled green/orange).
// Cancelled orders show all stages greyed with a "Cancelled" label.

interface TimelineStage {
  key: string;
  label: string;
  hint: string;
  reached: boolean;
  current: boolean;
}

function computeTimelineStages(order: MarketplaceOrder): TimelineStage[] {
  const isCancelled = order.status === "CANCELLED" || order.status === "REFUNDED";
  const isPickup = order.deliveryMethod === "PICKUP";
  const paymentPaid = order.paymentStatus === "PAID";
  const quoteAgreed =
    order.quoteStatus === "AGREED" ||
    // PICKUP auto-agrees at checkout, and any paid order implies the quote was agreed.
    (isPickup && order.status !== "PENDING") ||
    paymentPaid;
  const quoteQuoted =
    order.quoteStatus !== "PENDING_VENDOR_QUOTE" || quoteAgreed;
  const escrowHeld =
    order.escrow?.status === "HELD" ||
    order.escrow?.status === "PENDING_RELEASE" ||
    order.escrow?.status === "RELEASED" ||
    order.escrow?.status === "PARTIAL";
  const isProcessing =
    order.status === "PROCESSING" ||
    (order.fulfillments?.some((f) => f.status === "PROCESSING") ?? false);
  const deliveryReady =
    order.delivery?.status === "READY_FOR_PICKUP" ||
    order.delivery?.status === "PICKED_UP" ||
    order.delivery?.status === "IN_TRANSIT" ||
    order.delivery?.status === "ARRIVED" ||
    order.delivery?.status === "DELIVERED" ||
    order.status === "FULFILLED" ||
    order.status === "SHIPPED" ||
    order.status === "DELIVERED";
  const confirmed = order.delivery?.customerConfirmed === true;
  const completed = order.escrow?.status === "RELEASED";

  // Determine the "current" stage.
  let currentKey = "placed";
  if (completed) currentKey = "completed";
  else if (confirmed) currentKey = "confirmed";
  else if (deliveryReady) currentKey = "delivery";
  else if (isProcessing) currentKey = "processing";
  else if (escrowHeld) currentKey = "escrow";
  else if (paymentPaid) currentKey = "payment";
  else if (quoteAgreed) currentKey = "agreed";
  else if (quoteQuoted) currentKey = "quote";

  const stages: Array<[string, string, string, boolean]> = [
    ["placed", "Order Placed", "Your order was placed and sent to the vendor.", true],
    ["quote", "Vendor Quote", "The vendor is preparing a delivery quote.", quoteQuoted],
    ["agreed", "Quote Agreed", "Both parties agreed on the delivery fee.", quoteAgreed],
    ["payment", "Payment", "You paid via Paystack.", paymentPaid],
    ["escrow", `${KwisCrow.NAME} Holding`, "Funds are held safely in escrow.", escrowHeld],
    ["processing", "Processing", "The vendor is preparing your order.", isProcessing],
    ["delivery", isPickup ? "Ready for Pickup" : "Out for Delivery", isPickup ? "Your order is ready for pickup." : "Your order is on its way.", deliveryReady],
    ["confirmed", "Confirmed", "You confirmed receipt of the order.", confirmed],
    ["completed", "Completed", "Escrow released to the vendor. Order complete.", completed],
  ];

  return stages.map(([key, label, hint, reached]) => ({
    key,
    label,
    hint,
    reached: isCancelled ? false : reached,
    current: isCancelled ? false : currentKey === key,
  }));
}

// ─── Skeleton + Not Found ──────────────────────────────────────────────────

function OrderDetailSkeleton() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Skeleton className="h-5 w-36" />
      <Skeleton className="mt-6 h-36 rounded-2xl" />
      <Skeleton className="mt-4 h-48 rounded-2xl" />
      <Skeleton className="mt-4 h-64 rounded-2xl" />
    </main>
  );
}

function OrderNotFound({ id }: { id: string }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 text-center">
      <Package className="mx-auto h-10 w-10 text-gray-400" />
      <h1 className="mt-4 text-2xl font-semibold text-foreground">Order not found</h1>
      <p className="mt-2 text-sm text-gray-500">
        We could not load order <span className="font-semibold text-foreground">{id}</span>.
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

// ─── Timeline UI ───────────────────────────────────────────────────────────

function OrderTimeline({ order }: { order: MarketplaceOrder }) {
  const stages = computeTimelineStages(order);
  const isCancelled = order.status === "CANCELLED" || order.status === "REFUNDED";

  return (
    <section
      aria-label="Order status timeline"
      className="rounded-lg border border-[#e3e5e8] bg-white p-4"
    >
      <header className="mb-4 flex items-center gap-2">
        <Package className="h-4 w-4 text-kwik-orange" />
        <h2 className="text-sm font-semibold text-foreground">
          Order timeline
        </h2>
      </header>
      <ol className="relative">
        {stages.map((stage, idx) => (
          <li
            key={stage.key}
            className="relative flex gap-3 pb-4 last:pb-0"
          >
            {/* Vertical line — hidden for the last node */}
            {idx < stages.length - 1 && (
              <span
                aria-hidden="true"
                className={
                  "absolute left-[14px] top-7 bottom-[-4px] w-0.5 " +
                  (stage.reached ? "bg-kwik-green" : "bg-kwik-border")
                }
              />
            )}
            {/* Dot */}
            <span
              className={
                "relative z-10 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition " +
                (isCancelled
                  ? "border-kwik-border bg-kwik-bg-surface text-kwik-muted"
                  : stage.reached
                    ? "border-transparent bg-kwik-green text-white"
                    : stage.current
                      ? "border-kwik-orange bg-kwik-orange/10 text-kwik-orange"
                      : "border-kwik-border bg-kwik-bg-surface text-kwik-muted")
              }
              aria-hidden="true"
            >
              {stage.reached && !isCancelled ? (
                <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
              ) : stage.current ? (
                <Clock className="h-3 w-3" strokeWidth={2.5} />
              ) : (
                <span className="text-[10px] font-bold">{idx + 1}</span>
              )}
            </span>
            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p
                  className={
                    "text-sm font-semibold " +
                    (stage.reached || stage.current
                      ? "text-foreground"
                      : "text-kwik-muted")
                  }
                >
                  {stage.label}
                  {stage.current && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-kwik-orange/10 px-2 py-0.5 text-[10px] font-bold text-kwik-orange">
                      Current
                    </span>
                  )}
                </p>
              </div>
              <p
                className={
                  "mt-1 text-xs leading-5 " +
                  (stage.reached || stage.current ? "text-gray-500" : "text-kwik-muted")
                }
              >
                {stage.hint}
              </p>
            </div>
          </li>
        ))}
      </ol>
      {isCancelled && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-kwik-red/5 px-3 py-2 text-xs text-kwik-red">
          <XCircle className="h-3.5 w-3.5 shrink-0" />
          <span>This order was cancelled.</span>
        </div>
      )}
    </section>
  );
}

function ResponsivePanelModal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[140] flex items-end bg-black/45 p-0 sm:items-center sm:justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="max-h-[88vh] w-full overflow-y-auto rounded-t-xl bg-white p-4 shadow-2xl sm:max-w-2xl sm:rounded-lg sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#f1f2f3] text-[#59534b]"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Products section (uses SNAPSHOT fields) ───────────────────────────────

function ProductsSection({
  order,
  limit,
  onShowAll,
}: {
  order: MarketplaceOrder;
  limit?: number;
  onShowAll?: () => void;
}) {
  const items = order.items ?? [];
  if (items.length === 0) return null;
  const visibleItems = typeof limit === "number" ? items.slice(0, limit) : items;

  return (
    <section className="rounded-lg border border-[#e3e5e8] bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[#eceef0] px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">
          Order items
          <span className="ml-2 text-xs font-normal text-kwik-muted">
            ({items.length} item{items.length === 1 ? "" : "s"})
          </span>
        </h2>
        {onShowAll && items.length > (limit ?? items.length) ? (
          <button
            type="button"
            onClick={onShowAll}
            className="text-xs font-medium text-[#6c675f] transition hover:text-foreground"
          >
            Show all
          </button>
        ) : null}
      </div>
      <ul className="divide-y divide-[#f0ece6]">
        {visibleItems.map((item) => {
          const image = itemDisplayImage(item);
          const name = itemDisplayName(item);
          const variant = itemDisplayVariant(item);
          return (
            <li
              key={item.id}
              className="flex items-start justify-between gap-3 px-4 py-3"
            >
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#eceef0] bg-[#f4f5f6]">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image}
                      alt={name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package className="h-5 w-5 text-kwik-muted" strokeWidth={1.5} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{name}</p>
                  {variant && (
                    <p className="mt-0.5 text-xs text-kwik-muted">Variant: {variant}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Qty {item.quantity} × {formatCurrency(item.unitPrice)}
                  </p>
                </div>
              </div>
              <p className="shrink-0 text-sm font-semibold text-foreground tabular-nums">
                {formatCurrency(item.totalPrice)}
              </p>
            </li>
          );
        })}
      </ul>
      {onShowAll && items.length > (limit ?? items.length) ? (
        <div className="border-t border-[#f0ece6] px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={onShowAll}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#6c675f] transition hover:text-foreground"
          >
            Show {items.length - (limit ?? items.length)} more item{items.length - (limit ?? items.length) === 1 ? "" : "s"}
          </button>
        </div>
      ) : null}
    </section>
  );
}

// ─── Quote negotiation section ─────────────────────────────────────────────

function QuoteSection({
  order,
  quote,
}: {
  order: MarketplaceOrder;
  quote: OrderQuote | null | undefined;
}) {
  // Only render for STANDARD_DELIVERY (PICKUP auto-agrees at checkout).
  if (order.deliveryMethod !== "STANDARD_DELIVERY") return null;

  // Sync quoteStatus: prefer the Quote entity's status when present
  // (it may be ahead of the denormalized Order.quoteStatus by a few ms).
  const quoteStatus: QuoteStatus = quote?.status ?? order.quoteStatus;

  const revisions: QuoteRevision[] = quote?.revisions ?? [];
  const latestVendorRevision = [...revisions]
    .reverse()
    .find((r) => r.type === "VENDOR_QUOTE" || r.type === "VENDOR_REVISE");
  const latestCustomerReduction = [...revisions]
    .reverse()
    .find((r) => r.type === "CUSTOMER_REQUEST_REDUCTION");
  const currentAmount = quote?.currentAmount ?? order.agreedDeliveryFee ?? 0;
  const agreedAmount = quote?.agreedAmount ?? (quoteStatus === "AGREED" ? order.agreedDeliveryFee : null);

  return (
    <QuoteNegotiationCard
      orderId={order.id}
      quoteStatus={quoteStatus}
      currentAmount={currentAmount}
      agreedAmount={agreedAmount ?? null}
      latestVendorNote={latestVendorRevision?.note}
      latestCustomerReductionAmount={latestCustomerReduction?.amount}
      latestCustomerReductionNote={latestCustomerReduction?.note}
      revisionCount={revisions.length}
      createdAt={quote?.createdAt}
      paymentPaid={order.paymentStatus === "PAID"}
    />
  );
}

function QuoteNegotiationCard({
  orderId,
  quoteStatus,
  currentAmount,
  agreedAmount,
  latestVendorNote,
  latestCustomerReductionAmount,
  latestCustomerReductionNote,
  revisionCount,
  createdAt,
  paymentPaid,
}: {
  orderId: string;
  quoteStatus: QuoteStatus;
  currentAmount: number;
  agreedAmount: number | null;
  latestVendorNote?: string | null;
  latestCustomerReductionAmount?: number;
  latestCustomerReductionNote?: string | null;
  revisionCount: number;
  createdAt?: string;
  paymentPaid: boolean;
}) {
  const acceptQuote = useAcceptQuote(orderId);
  const requestReduction = useRequestReduction(orderId);
  const rejectQuote = useRejectQuote(orderId);
  const initializePayment = useInitializePayment(orderId);
  const router = useRouter();

  const [reductionOpen, setReductionOpen] = React.useState(false);
  const [reductionAmount, setReductionAmount] = React.useState("");
  const [reductionNote, setReductionNote] = React.useState("");

  const canAcceptOrReduce =
    quoteStatus === "QUOTED" || quoteStatus === "VENDOR_REVISED";

  const handleAccept = async () => {
    try {
      await acceptQuote.mutateAsync({});
      kwikToast.success(
        "Quote accepted",
        "You can now proceed to payment.",
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to accept quote.";
      kwikToast.error("Couldn't accept quote", message);
    }
  };

  const handleRequestReduction = async () => {
    const amount = Number(reductionAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      kwikToast.warning("Enter a valid amount", "Please enter a positive delivery fee.");
      return;
    }
    if (amount >= currentAmount) {
      kwikToast.warning(
        "Amount too high",
        "Your proposed amount must be lower than the vendor's current quote.",
      );
      return;
    }
    try {
      await requestReduction.mutateAsync({
        amount,
        note: reductionNote.trim() || undefined,
      });
      kwikToast.success(
        "Reduction requested",
        "The vendor will review your proposed amount.",
      );
      setReductionOpen(false);
      setReductionAmount("");
      setReductionNote("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to request reduction.";
      kwikToast.error("Couldn't request reduction", message);
    }
  };

  const handleReject = async () => {
    if (
      !window.confirm(
        "Reject this quote? The order will be cancelled and cannot be reopened.",
      )
    ) {
      return;
    }
    try {
      await rejectQuote.mutateAsync({});
      kwikToast.info("Quote rejected", "The order has been cancelled.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reject quote.";
      kwikToast.error("Couldn't reject quote", message);
    }
  };

  const handleProceedToPayment = async () => {
    try {
      const result = await initializePayment.mutateAsync();
      if (result.authorizationUrl) {
        kwikToast.info(
          "Redirecting to Paystack",
          "Complete your payment to confirm the order.",
        );
        // Use a full-page redirect so the Paystack callback can return here.
        window.location.href = result.authorizationUrl;
      } else {
        kwikToast.error(
          "Payment initialization failed",
          "No authorization URL was returned by the server.",
        );
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to initialize payment.";
      kwikToast.error("Couldn't initialize payment", message);
    }
  };

  return (
    <section
      aria-label="Vendor quote negotiation"
      className="overflow-hidden rounded-lg border border-[#e3e5e8] bg-white"
    >
      <div className="border-b border-kwik-border-light px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-kwik-muted">
              Delivery quote
            </p>
            <h2 className="mt-1 font-heading text-lg font-bold text-foreground sm:text-xl">
              Vendor quotation
            </h2>
            {createdAt && (
              <p className="mt-0.5 text-xs text-kwik-muted">
                Opened {formatDate(createdAt)}
                {revisionCount > 0 && ` · ${revisionCount} revision${revisionCount === 1 ? "" : "s"}`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 rounded-full bg-kwik-orange/10 px-3 py-1.5 text-xs font-semibold text-kwik-orange ring-1 ring-kwik-orange/20">
            <StatusBadgeTransparent status={quoteStatus} />
          </div>
        </div>
      </div>

      <div className="px-5 py-5 sm:px-6">
        {/* Status-dependent message + actions */}
        {quoteStatus === "PENDING_VENDOR_QUOTE" && (
          <div className="flex items-center gap-3 rounded-xl bg-kwik-orange/5 p-4 text-sm text-kwik-orange">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>
              Waiting for the vendor to provide a delivery quote. This page
              updates automatically.
            </span>
          </div>
        )}

        {canAcceptOrReduce && (
          <div className="space-y-4">
            <div className="rounded-xl border border-kwik-border-light bg-gray-50 p-4">
              <p className="text-xs font-semibold text-gray-500">
                Vendor&apos;s quoted delivery fee
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground tabular-nums">
                {formatCurrency(currentAmount)}
              </p>
              {latestVendorNote && (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-kwik-bg-surface px-3 py-2 text-xs text-gray-600">
                  <MessageSquareText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-kwik-orange" />
                  <p>
                    <span className="font-semibold text-foreground">Vendor note: </span>
                    {latestVendorNote}
                  </p>
                </div>
              )}
            </div>

            {!reductionOpen ? (
              <div className="flex flex-col gap-2 sm:flex-row-reverse sm:items-center sm:justify-start">
                <button
                  type="button"
                  onClick={handleAccept}
                  disabled={acceptQuote.isPending}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-secondary-500 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-secondary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {acceptQuote.isPending ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Accepting…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Accept quote
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setReductionOpen(true)}
                  disabled={requestReduction.isPending}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-kwik-border bg-kwik-bg-surface px-5 text-sm font-semibold text-foreground transition hover:border-kwik-orange hover:text-kwik-orange disabled:opacity-60"
                >
                  Request reduction
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={rejectQuote.isPending}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold text-kwik-red transition hover:bg-kwik-red/5 disabled:opacity-60"
                >
                  {rejectQuote.isPending ? "Rejecting…" : "Reject"}
                </button>
              </div>
            ) : (
              <div className="space-y-3 rounded-xl border border-kwik-border-light bg-gray-50 p-4">
                <p className="text-sm font-semibold text-foreground">
                  Propose a lower delivery fee
                </p>
                <p className="text-xs text-gray-500">
                  The vendor can accept or counter your proposed amount.
                </p>
                <div>
                  <label
                    htmlFor="reduction-amount"
                    className="text-xs font-semibold text-gray-500"
                  >
                    Your proposed amount (₦)
                  </label>
                  <input
                    id="reduction-amount"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step="any"
                    value={reductionAmount}
                    onChange={(e) => setReductionAmount(e.target.value)}
                    placeholder={`Less than ${formatCurrency(currentAmount)}`}
                    className="mt-1 block h-11 w-full rounded-md border border-kwik-border bg-kwik-bg-surface px-3 text-sm text-foreground shadow-sm focus:border-kwik-orange focus:outline-none focus:ring-2 focus:ring-kwik-orange/30"
                  />
                </div>
                <div>
                  <label
                    htmlFor="reduction-note"
                    className="text-xs font-semibold text-gray-500"
                  >
                    Note (optional)
                  </label>
                  <textarea
                    id="reduction-note"
                    rows={2}
                    value={reductionNote}
                    onChange={(e) => setReductionNote(e.target.value)}
                    placeholder="Add a short message to the vendor…"
                    className="mt-1 block w-full rounded-md border border-kwik-border bg-kwik-bg-surface px-3 py-2 text-sm text-foreground shadow-sm focus:border-kwik-orange focus:outline-none focus:ring-2 focus:ring-kwik-orange/30"
                  />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={handleRequestReduction}
                    disabled={requestReduction.isPending}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-secondary-500 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-secondary-600 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {requestReduction.isPending ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Sending…
                      </>
                    ) : (
                      "Send request"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReductionOpen(false);
                      setReductionAmount("");
                      setReductionNote("");
                    }}
                    disabled={requestReduction.isPending}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-kwik-border bg-kwik-bg-surface px-5 text-sm font-semibold text-foreground transition hover:border-gray-300 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {quoteStatus === "CUSTOMER_REQUESTED_REDUCTION" && (
          <div className="space-y-3">
            <div className="rounded-xl border border-kwik-orange/20 bg-kwik-orange/5 p-4 text-sm text-kwik-orange">
              <p className="font-semibold">
                You requested {formatCurrency(latestCustomerReductionAmount ?? currentAmount)}.
              </p>
              <p className="mt-1 text-xs">
                Waiting for the vendor to respond — they can accept your amount
                or send a counter-offer.
              </p>
              {latestCustomerReductionNote && (
                <p className="mt-2 text-xs italic text-kwik-orange/80">
                  “{latestCustomerReductionNote}”
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleReject}
              disabled={rejectQuote.isPending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold text-kwik-red transition hover:bg-kwik-red/5 disabled:opacity-60"
            >
              {rejectQuote.isPending ? "Withdrawing…" : "Withdraw / reject"}
            </button>
          </div>
        )}

        {quoteStatus === "AGREED" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-kwik-green/30 bg-kwik-green/5 p-4 text-sm text-kwik-green">
              <p className="font-semibold">
                Quote agreed: {formatCurrency(agreedAmount ?? currentAmount)}
              </p>
              <p className="mt-1 text-xs">
                {paymentPaid
                  ? `Payment confirmed. ${KwisCrow.NAME} is holding your funds safely until you confirm receipt.`
                  : `You can now proceed to payment. Your funds will be held safely by ${KwisCrow.NAME} until you confirm receipt.`}
              </p>
            </div>
            {!paymentPaid ? (
              <button
                type="button"
                onClick={handleProceedToPayment}
                disabled={initializePayment.isPending}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-secondary-500 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-secondary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {initializePayment.isPending ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Initializing payment…
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Proceed to payment
                  </>
                )}
              </button>
            ) : null}
          </div>
        )}

        {quoteStatus === "REJECTED" && (
          <div className="rounded-xl border border-kwik-red/20 bg-kwik-red/5 p-4 text-sm text-kwik-red">
            <p className="font-semibold">Quote rejected.</p>
            <p className="mt-1 text-xs">This order has been cancelled.</p>
          </div>
        )}

        {quoteStatus === "EXPIRED" && (
          <div className="rounded-xl border border-kwik-red/20 bg-kwik-red/5 p-4 text-sm text-kwik-red">
            <p className="font-semibold">Quote expired.</p>
            <p className="mt-1 text-xs">
              The quote was not accepted in time and has expired. Please place a
              new order.
            </p>
          </div>
        )}

        {quoteStatus === "CANCELLED" && (
          <div className="rounded-xl border border-kwik-border-light bg-gray-100 p-4 text-sm text-gray-600">
            <p className="font-semibold">Order cancelled.</p>
            <p className="mt-1 text-xs">This order was cancelled before agreement.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function StatusBadgeTransparent({ status }: { status: QuoteStatus }) {
  return (
    <span className="inline-flex items-center rounded-full bg-kwik-orange/10 px-2.5 py-0.5 text-[11px] font-semibold text-kwik-orange">
      {status.replace(/_/g, " ")}
    </span>
  );
}

// ─── Payment + Escrow section ──────────────────────────────────────────────

function PaymentSection({ order }: { order: MarketplaceOrder }) {
  const paid = order.paymentStatus === "PAID";
  const escrow = order.escrow;

  return (
    <section className="rounded-lg border border-[#e3e5e8] bg-white p-4">
      <header className="flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-kwik-orange" />
        <h2 className="font-semibold text-foreground">Payment</h2>
      </header>

      <div className="mt-3 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-kwik-muted">Payment status</span>
          <StatusBadge status={order.paymentStatus} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-kwik-muted">Total paid</span>
          <span className="font-semibold text-foreground tabular-nums">
            {formatCurrency(order.totalAmount)}
          </span>
        </div>
        {order.payment?.reference && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-kwik-muted">Reference</span>
            <span className="font-medium text-foreground">{order.payment.reference}</span>
          </div>
        )}
        {order.payment?.paidAt && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-kwik-muted">Paid at</span>
            <span className="text-foreground">{formatDate(order.payment.paidAt)}</span>
          </div>
        )}
      </div>

      {paid && escrow && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-kwik-orange/20 bg-kwik-orange/5 px-3 py-2.5 text-xs text-kwik-orange">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">
              Payment confirmed — funds held in {KwisCrow.NAME}.
            </p>
            <p className="mt-0.5 text-kwik-orange/80">
              Escrow status: <span className="font-semibold">{escrow.status}</span>
              {escrow.heldAt && ` · held since ${formatDate(escrow.heldAt)}`}
            </p>
          </div>
        </div>
      )}

      {paid && !escrow && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-kwik-green/20 bg-kwik-green/5 px-3 py-2.5 text-xs text-kwik-green">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Payment confirmed.</p>
        </div>
      )}

      {order.paymentStatus === "FAILED" && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-kwik-red/20 bg-kwik-red/5 px-3 py-2.5 text-xs text-kwik-red">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Payment failed. Please try again or contact support.</p>
        </div>
      )}
    </section>
  );
}

// ─── Delivery section ──────────────────────────────────────────────────────

function DeliverySection({ order }: { order: MarketplaceOrder }) {
  const isPickup = order.deliveryMethod === "PICKUP";
  const delivery = order.delivery;
  const address = order.address;
  const autoReleaseDeadline = getAutoReleaseDeadline(order);

  let addressLine = "No delivery address on this order";
  if (delivery?.deliveryAddress) {
    addressLine = delivery.deliveryAddress;
  } else if (address) {
    addressLine = [
      address.fullName,
      address.line1,
      address.line2,
      address.city,
      address.state,
      address.country,
    ]
      .filter(Boolean)
      .join(", ");
  } else if (order.deliveryLocalGovernment && order.deliveryState) {
    addressLine = `${order.deliveryLocalGovernment}, ${order.deliveryState}, Nigeria`;
  }

  return (
    <section className="rounded-lg border border-[#e3e5e8] bg-white p-4">
      <header className="flex items-center gap-2">
        <Truck className="h-5 w-5 text-kwik-orange" />
        <h2 className="font-semibold text-foreground">Delivery</h2>
      </header>

      <div className="mt-3 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-kwik-muted">Method</span>
          <span className="font-semibold text-foreground">
            {isPickup ? "Pickup" : "Standard delivery"}
          </span>
        </div>
        {delivery && (
          <div className="flex items-center justify-between">
            <span className="text-kwik-muted">Status</span>
            <StatusBadge status={delivery.status} />
          </div>
        )}
        {delivery?.currentLocation && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-kwik-muted">Current location</span>
            <span className="text-foreground">{delivery.currentLocation}</span>
          </div>
        )}
        {delivery?.estimatedMinutes != null && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-kwik-muted">ETA</span>
            <span className="text-foreground">{delivery.estimatedMinutes} min</span>
          </div>
        )}
        {order.estimatedDeliveryStart && order.estimatedDeliveryEnd && !isPickup && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-kwik-muted">Delivery window</span>
            <span className="text-right text-foreground">
              {formatDate(order.estimatedDeliveryStart)} - {formatDate(order.estimatedDeliveryEnd)}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-xl bg-gray-50 px-3 py-3 text-sm">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-kwik-orange" />
        <div>
          <p className="font-semibold text-foreground">
            {isPickup ? "Pickup address" : "Delivery address"}
          </p>
          <p className="mt-0.5 text-xs leading-5 text-gray-600">{addressLine}</p>
          {delivery?.deliveryContactName && (
            <p className="mt-1 text-xs text-kwik-muted">
              Contact: {delivery.deliveryContactName}
              {delivery.deliveryContactPhone ? ` · ${delivery.deliveryContactPhone}` : ""}
            </p>
          )}
          {delivery?.deliveredAt && (
            <p className="mt-2 text-xs text-kwik-green">
              Delivered {formatDate(delivery.deliveredAt)}
            </p>
          )}
        </div>
      </div>

      {isPickup ? (
        <div className="mt-4 rounded-xl border border-kwik-orange/20 bg-kwik-orange/5 p-4 text-xs text-kwik-orange">
          <p className="font-semibold">Show your order ID at the vendor store to collect this package.</p>
          <p className="mt-1">
            After handoff, the vendor completes pickup in their dashboard and {KwisCrow.NAME} releases the payment.
          </p>
        </div>
      ) : autoReleaseDeadline && !delivery?.customerConfirmed && order.escrow?.status !== "RELEASED" ? (
        <div className="mt-4 rounded-xl border border-kwik-orange/20 bg-kwik-orange/5 p-4 text-xs text-kwik-orange">
          <p className="font-semibold">
            If you do not respond, funds auto-release on {formatDate(autoReleaseDeadline)}.
          </p>
          <p className="mt-1">
            The 24-hour response window starts after the final delivery date in the vendor's quoted range.
          </p>
        </div>
      ) : null}
    </section>
  );
}

// ─── Order summary section ─────────────────────────────────────────────────

function OrderSummary({ order }: { order: MarketplaceOrder }) {
  const subtotal = Number(order.subtotal ?? 0);
  const processingFee = Number(order.processingFeeAmount ?? 0);
  const deliveryFee = Number(order.agreedDeliveryFee ?? order.shippingFee ?? 0);
  const discount = Number(order.discount ?? 0);
  const total = Number(order.totalAmount ?? subtotal + processingFee + deliveryFee - discount);

  return (
    <section className="rounded-lg border border-[#e3e5e8] bg-white p-4">
      <h2 className="font-semibold text-foreground">Order summary</h2>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-kwik-muted">Subtotal</dt>
          <dd className="font-medium text-foreground tabular-nums">
            {formatCurrency(subtotal)}
          </dd>
        </div>
        {processingFee > 0 && (
          <div className="flex items-center justify-between">
            <dt className="text-kwik-muted">
              Processing fee
              {order.processingFeePercent
                ? ` (${Number(order.processingFeePercent)}%)`
                : ""}
            </dt>
            <dd className="font-medium text-foreground tabular-nums">
              {formatCurrency(processingFee)}
            </dd>
          </div>
        )}
        <div className="flex items-center justify-between">
          <dt className="text-kwik-muted">Delivery fee</dt>
          <dd className="font-medium text-foreground tabular-nums">
            {order.deliveryMethod === "STANDARD_DELIVERY" &&
            order.quoteStatus !== "AGREED"
              ? "To be agreed"
              : formatCurrency(deliveryFee)}
          </dd>
        </div>
        {discount > 0 && (
          <div className="flex items-center justify-between text-kwik-green">
            <dt>Discount</dt>
            <dd className="font-medium tabular-nums">−{formatCurrency(discount)}</dd>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-kwik-border-light pt-2 text-base">
          <dt className="font-bold text-foreground">Total</dt>
          <dd className="font-bold text-kwik-orange tabular-nums">
            {formatCurrency(total)}
          </dd>
        </div>
      </dl>
    </section>
  );
}

// ─── Customer actions (context-aware) ──────────────────────────────────────

function CustomerActions({ order }: { order: MarketplaceOrder }) {
  const router = useRouter();
  const confirmReceipt = useConfirmReceipt(order.id);
  const cancelOrder = useCancelOrder(order.id);
  const initializePayment = useInitializePayment(order.id);

  const quoteAgreed = order.quoteStatus === "AGREED";
  const paymentPending = order.paymentStatus === "PENDING";
  const paymentPaid = order.paymentStatus === "PAID";
  const deliveryReady =
    order.delivery?.status === "DELIVERED" ||
    order.delivery?.status === "READY_FOR_PICKUP" ||
    order.delivery?.status === "ARRIVED";
  const alreadyConfirmed = order.delivery?.customerConfirmed === true;
  const isCancelled = order.status === "CANCELLED" || order.status === "REFUNDED";
  const isPickup = order.deliveryMethod === "PICKUP";
  const autoReleaseDeadline = getAutoReleaseDeadline(order);
  const orderAwaitsPayment =
    order.status === "PENDING_PAYMENT" ||
    (order.status === "PENDING" && quoteAgreed && paymentPending);
  const orderCanStillBeCancelled =
    order.status === "PENDING" ||
    order.status === "PENDING_PAYMENT";
  const orderTrackableStatuses = ["PAID", "CONFIRMED", "PROCESSING", "FULFILLED", "SHIPPED", "DELIVERED", "COMPLETED"];

  // 1. Proceed to Payment — quote agreed, not yet paid
  const showProceedToPayment = quoteAgreed && paymentPending && orderAwaitsPayment && !isCancelled;

  // 2. Confirm receipt — standard delivery only, after delivered/arrived.
  const showConfirmReceipt =
    !isPickup && paymentPaid && deliveryReady && !alreadyConfirmed && !isCancelled;

  // 3. Cancel — payment pending AND quote not yet agreed (and not cancelled)
  const showCancel =
    paymentPending && orderCanStillBeCancelled && !quoteAgreed && !isCancelled;

  // 4. Track order link — show once paid+processing or beyond
  const showTrack =
    (paymentPaid || orderTrackableStatuses.includes(order.status)) &&
    !isCancelled;

  if (!showProceedToPayment && !showConfirmReceipt && !showCancel && !showTrack) {
    return null;
  }

  const handleProceedToPayment = async () => {
    try {
      const result = await initializePayment.mutateAsync();
      if (result.authorizationUrl) {
        kwikToast.info(
          "Redirecting to Paystack",
          "Complete your payment to confirm the order.",
        );
        window.location.href = result.authorizationUrl;
      } else {
        kwikToast.error(
          "Payment initialization failed",
          "No authorization URL was returned by the server.",
        );
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to initialize payment.";
      kwikToast.error("Couldn't initialize payment", message);
    }
  };

  const handleConfirmReceipt = async () => {
    if (
      !window.confirm(
        `Confirm receipt of this order? ${KwisCrow.NAME} will release the funds to the vendor.`,
      )
    ) {
      return;
    }
    try {
      await confirmReceipt.mutateAsync();
      kwikToast.success(
        "Receipt confirmed",
        `${KwisCrow.NAME} has released the funds to the vendor. Thank you!`,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to confirm receipt.";
      kwikToast.error("Couldn't confirm receipt", message);
    }
  };

  const handleCancel = async () => {
    const reason = window.prompt("Reason for cancelling this order? (optional)");
    try {
      await cancelOrder.mutateAsync({ reason: reason || undefined });
      kwikToast.info("Order cancelled", "No payment was taken.");
      router.push("/orders");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to cancel order.";
      kwikToast.error("Couldn't cancel order", message);
    }
  };

  return (
    <section className="rounded-lg border border-[#e3e5e8] bg-white p-4">
      <h2 className="font-semibold text-foreground">Actions</h2>
      {isPickup && paymentPaid && !isCancelled ? (
        <div className="mt-3 rounded-xl border border-kwik-orange/20 bg-kwik-orange/5 p-4 text-xs text-kwik-orange">
          <p className="font-semibold">Pickup order</p>
          <p className="mt-1">
            Bring order ID <span className="font-semibold text-foreground">{orderReference(order)}</span> to the vendor store. The vendor will complete the handoff in their dashboard.
          </p>
        </div>
      ) : null}
      {!isPickup && autoReleaseDeadline && paymentPaid && !alreadyConfirmed && order.escrow?.status !== "RELEASED" ? (
        <div className="mt-3 rounded-xl border border-kwik-orange/20 bg-kwik-orange/5 p-4 text-xs text-kwik-orange">
          <p className="font-semibold">Response deadline</p>
          <p className="mt-1">
            Please confirm receipt or raise an issue before {formatDate(autoReleaseDeadline)}. If there is no response after then, funds release automatically.
          </p>
        </div>
      ) : null}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {showProceedToPayment && (
          <button
            type="button"
            onClick={handleProceedToPayment}
            disabled={initializePayment.isPending}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-secondary-500 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-secondary-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {initializePayment.isPending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Initializing…
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                Proceed to payment
              </>
            )}
          </button>
        )}
        {showConfirmReceipt && (
          <button
            type="button"
            onClick={handleConfirmReceipt}
            disabled={confirmReceipt.isPending}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-kwik-green px-5 text-sm font-bold text-white shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {confirmReceipt.isPending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Confirming…
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Confirm receipt
              </>
            )}
          </button>
        )}
        {showTrack && (
          <Link
            href={`/orders/${encodeURIComponent(order.id)}/track`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-kwik-border bg-kwik-bg-surface px-5 text-sm font-semibold text-foreground transition hover:border-kwik-orange hover:text-kwik-orange"
          >
            <Truck className="h-4 w-4" />
            Track order
          </Link>
        )}
        {showCancel && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={cancelOrder.isPending}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-kwik-red/30 px-5 text-sm font-semibold text-kwik-red transition hover:bg-kwik-red/5 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {cancelOrder.isPending ? "Cancelling…" : "Cancel order"}
          </button>
        )}
      </div>
    </section>
  );
}

// ─── Main page body ────────────────────────────────────────────────────────

function OrderDetailPageInner() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const orderId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { isAuthenticated, isLoading: isAuthLoading, isInitialized } = useAuth();
  const [timelineOpen, setTimelineOpen] = React.useState(false);
  const [itemsOpen, setItemsOpen] = React.useState(false);

  const { data: order, isLoading, isError } = useOrder(orderId);
  // Fetch the quote (only meaningful for STANDARD_DELIVERY, but the hook is
  // always enabled — the call returns 404 for PICKUP orders, which we swallow).
  const { data: quote, error: quoteError } = useQuote(orderId);

  // Hydration guard — only render the body after the client has mounted so
  // localStorage-persisted Zustand stores don't trigger hydration warnings.
  const [hasMounted, setHasMounted] = React.useState(false);
  React.useEffect(() => setHasMounted(true), []);

  // Redirect to login if the user is unauthenticated (the API requires JWT).
  React.useEffect(() => {
    if (isInitialized && !isAuthLoading && !isAuthenticated) {
      const returnUrl = window.location.pathname + window.location.search;
      router.replace(`/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`);
    }
  }, [isAuthLoading, isAuthenticated, isInitialized, router]);

  // A 404 on the quote is expected for PICKUP orders and pre-quote orders —
  // log it once for debugging but don't surface to the user.
  React.useEffect(() => {
    if (quoteError) {
      console.debug(
        "[orders/[id]] quote fetch returned an error (likely PICKUP / not yet created):",
        quoteError instanceof Error ? quoteError.message : quoteError,
      );
    }
  }, [quoteError]);

  if (!hasMounted || isAuthLoading || (isLoading && !order)) {
    return <OrderDetailSkeleton />;
  }

  if (!order) {
    // If we got a 404 on the quote, that's fine — it just means this is a
    // PICKUP order or the quote hasn't been created yet. Only show not-found
    // when the ORDER itself failed to load.
    if (isError) {
      return <OrderNotFound id={orderId} />;
    }
    return <OrderDetailSkeleton />;
  }

  const isCancelled = order.status === "CANCELLED" || order.status === "REFUNDED";

  return (
    <div className="min-h-screen bg-[#f6f7f8]">
      <section className="mx-auto max-w-6xl px-4 pt-5 sm:px-6 lg:px-8">
        <div className="border-b border-[#dfe2e5] pb-4">
          <nav className="mb-3 flex items-center gap-2 text-xs text-[#7d8187]" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/orders" className="hover:text-foreground">Orders</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="truncate">{orderReference(order)}</span>
          </nav>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
                  Order ID: {orderReference(order)}
                </h1>
                <p className="mt-2 text-xs text-[#73777d] sm:text-sm">
                  Order date: {formatDate(order.createdAt)}
                  {order.deliveryMethod && (
                    <>
                      <span className="mx-2 text-[#c4c7ca]">|</span>
                      {order.deliveryMethod === "PICKUP" ? "Pickup" : "Standard delivery"}
                    </>
                  )}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <StatusBadge status={order.status} />
                {order.paymentStatus === "PAID" && order.escrow?.status === "HELD" && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-kwik-orange/10 px-2.5 py-1 text-[11px] font-semibold text-kwik-orange ring-1 ring-kwik-orange/20">
                    <ShieldCheck className="h-3 w-3" />
                    {KwisCrow.NAME}: Held
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pt-3 sm:px-6 lg:px-8">
        <div className="border-l-2 border-kwik-orange bg-white px-3 py-2 text-xs text-[#62666c] shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          {isCancelled ? (
            "This order has been cancelled."
          ) : order.paymentStatus === "PAID" ? (
            <>Payment confirmed — funds held by {KwisCrow.NAME} escrow.</>
          ) : order.quoteStatus === "AGREED" ? (
            "Quote agreed — ready to pay."
          ) : order.deliveryMethod === "STANDARD_DELIVERY" ? (
            "Awaiting the vendor's delivery quote."
          ) : (
            "Awaiting payment."
          )}
        </div>
      </div>

      {/* ── Content: workspace + sticky sidebar ── */}
      <section className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="mb-3 flex gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => setTimelineOpen(true)}
            className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-md border border-[#dfe2e5] bg-white px-3 text-xs font-medium text-[#262626]"
          >
            <Clock className="h-4 w-4" />
            View timeline
          </button>
          <button
            type="button"
            onClick={() => setItemsOpen(true)}
            className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-md border border-[#dfe2e5] bg-white px-3 text-xs font-medium text-[#262626]"
          >
            <Package className="h-4 w-4" />
            Show items
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* Left: Order workspace */}
          <div className="space-y-4">
            <div className="lg:hidden">
              <CustomerActions order={order} />
            </div>

            {/* Quote negotiation (STANDARD_DELIVERY only) */}
            <QuoteSection order={order} quote={quote} />

            {/* Products */}
            <ProductsSection
              order={order}
              limit={4}
              onShowAll={() => setItemsOpen(true)}
            />

            {/* Payment + Escrow */}
            <PaymentSection order={order} />

            {/* Delivery */}
            <DeliverySection order={order} />
          </div>

          {/* Right: Sticky sidebar */}
          <aside className="space-y-3 lg:sticky lg:top-4 lg:self-start">
            <div className="hidden lg:block">
              <OrderTimeline order={order} />
            </div>

            {/* Order summary with totals */}
            <OrderSummary order={order} />

            {/* Customer action buttons */}
            <div className="hidden lg:block">
              <CustomerActions order={order} />
            </div>

            {/* Escrow/payment status indicator */}
            {order.paymentStatus === "PAID" && order.escrow?.status && (
              <section className="rounded-lg border border-kwik-orange/20 bg-white p-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-kwik-orange" />
                  <p className="text-sm font-semibold text-kwik-orange">
                    {KwisCrow.NAME}: {order.escrow.status.replace(/_/g, " ")}
                  </p>
                </div>
                <p className="mt-1 text-xs text-kwik-orange/80">
                  Your payment is secured in escrow until you confirm receipt.
                </p>
              </section>
            )}

            {/* Vendor mini-card */}
            {order.store && (
              <section className="rounded-lg border border-[#e3e5e8] bg-white p-4">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-kwik-orange" />
                  <h3 className="text-sm font-semibold text-kwik-muted">
                    Vendor
                  </h3>
                </div>
                <p className="mt-2 font-semibold text-foreground">{order.store.name}</p>
                {order.store.slug && (
                  <Link
                    href={`/vendors/${encodeURIComponent(order.store.slug)}`}
                    className="mt-1 inline-block text-xs font-semibold text-kwik-orange hover:underline"
                  >
                    View store →
                  </Link>
                )}
              </section>
            )}
          </aside>
        </div>

        <ResponsivePanelModal
          open={timelineOpen}
          title="Order timeline"
          onClose={() => setTimelineOpen(false)}
        >
          <OrderTimeline order={order} />
        </ResponsivePanelModal>

        <ResponsivePanelModal
          open={itemsOpen}
          title="All order items"
          onClose={() => setItemsOpen(false)}
        >
          <ProductsSection order={order} />
        </ResponsivePanelModal>
      </section>
    </div>
  );
}

// ─── Default export: ErrorBoundary wrapper ─────────────────────────────────

export default function BuyerOrderDetailPage() {
  return (
    <AccountLayout>
      <ErrorBoundary
        fallback={
          <main className="mx-auto max-w-2xl px-4 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-kwik-red/10">
              <AlertTriangle className="h-7 w-7 text-kwik-red" />
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
                className="inline-flex h-10 items-center justify-center rounded-md border border-kwik-border bg-kwik-bg-surface px-4 text-sm font-semibold text-foreground hover:border-gray-300"
              >
                Back to orders
              </Link>
            </div>
          </main>
        }
      >
        <OrderDetailPageInner />
      </ErrorBoundary>
    </AccountLayout>
  );
}
