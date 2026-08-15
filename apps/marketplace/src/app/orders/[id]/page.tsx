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
 * Sections:
 *   1. Header (order ref, date, overall status badge)
 *   2. Visual timeline (9 stages — highlights the current stage)
 *   3. Products (uses SNAPSHOT fields, never live product data)
 *   4. Quote negotiation (STANDARD_DELIVERY only)
 *   5. Payment + Kwikscrow status
 *   6. Delivery section
 *   7. Context-aware customer actions
 *   8. Order summary (subtotal, processing fee, delivery fee, total)
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
import { ErrorBoundary, Skeleton } from "@kwikseller/ui";
import { kwikToast, useAuth } from "@kwikseller/utils";
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
  const confirmed =
    order.delivery?.customerConfirmed === true ||
    order.status === "DELIVERED" ||
    order.status === "COMPLETED";
  const completed =
    order.status === "COMPLETED" ||
    order.escrow?.status === "RELEASED";

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

function needsAuthRedirect(): boolean {
  return typeof window !== "undefined" && !localStorage.getItem("kwikseller_access_token");
}

// ─── Timeline UI ───────────────────────────────────────────────────────────

function OrderTimeline({ order }: { order: MarketplaceOrder }) {
  const stages = computeTimelineStages(order);
  const isCancelled = order.status === "CANCELLED" || order.status === "REFUNDED";

  return (
    <section
      aria-label="Order status timeline"
      className="rounded-2xl border border-kwik-border bg-kwik-bg-surface p-5 sm:p-6"
    >
      <header className="mb-5 flex items-center gap-2">
        <Package className="h-4 w-4 text-kwik-orange" />
        <h2 className="font-heading text-sm font-bold uppercase tracking-[0.16em] text-foreground">
          Order timeline
        </h2>
      </header>
      <ol className="relative">
        {stages.map((stage, idx) => (
          <li
            key={stage.key}
            className="relative flex gap-4 pb-5 last:pb-0"
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
                    <span className="ml-2 inline-flex items-center rounded-full bg-kwik-orange/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-kwik-orange">
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

// ─── Products section (uses SNAPSHOT fields) ───────────────────────────────

function ProductsSection({ order }: { order: MarketplaceOrder }) {
  const items = order.items ?? [];
  if (items.length === 0) return null;

  return (
    <section className="rounded-2xl border border-kwik-border bg-kwik-bg-surface">
      <div className="border-b border-kwik-border-light p-4 sm:p-5">
        <h2 className="font-semibold text-foreground">
          Items in this order
          <span className="ml-2 text-sm font-normal text-kwik-muted">
            ({items.length} item{items.length === 1 ? "" : "s"})
          </span>
        </h2>
      </div>
      <ul className="divide-y divide-kwik-border-light">
        {items.map((item) => {
          const image = itemDisplayImage(item);
          const name = itemDisplayName(item);
          const variant = itemDisplayVariant(item);
          return (
            <li
              key={item.id}
              className="flex items-start justify-between gap-4 p-4 sm:p-5"
            >
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
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
                  <p className="truncate font-semibold text-foreground">{name}</p>
                  {variant && (
                    <p className="mt-0.5 text-xs text-kwik-muted">Variant: {variant}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Qty {item.quantity} × {formatCurrency(item.unitPrice)}
                  </p>
                </div>
              </div>
              <p className="shrink-0 font-semibold text-foreground tabular-nums">
                {formatCurrency(item.totalPrice)}
              </p>
            </li>
          );
        })}
      </ul>
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
      className="overflow-hidden rounded-2xl border border-kwik-border bg-kwik-bg-surface shadow-sm"
    >
      <div className="kwik-gradient px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/80">
              Delivery quote
            </p>
            <h2 className="mt-1 font-heading text-lg font-bold text-white sm:text-xl">
              Vendor quotation
            </h2>
            {createdAt && (
              <p className="mt-0.5 text-xs text-white/80">
                Opened {formatDate(createdAt)}
                {revisionCount > 0 && ` · ${revisionCount} revision${revisionCount === 1 ? "" : "s"}`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
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
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
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
                    className="text-xs font-semibold uppercase tracking-wide text-gray-500"
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
                    className="text-xs font-semibold uppercase tracking-wide text-gray-500"
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
                You can now proceed to payment. Your funds will be held safely
                by {KwisCrow.NAME} until you confirm receipt.
              </p>
            </div>
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
    <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold text-white">
      {status.replace(/_/g, " ")}
    </span>
  );
}

// ─── Payment + Escrow section ──────────────────────────────────────────────

function PaymentSection({ order }: { order: MarketplaceOrder }) {
  const paid = order.paymentStatus === "PAID";
  const escrow = order.escrow;

  return (
    <section className="rounded-2xl border border-kwik-border bg-kwik-bg-surface p-5">
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
            <span className="font-mono text-foreground">{order.payment.reference}</span>
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
    <section className="rounded-2xl border border-kwik-border bg-kwik-bg-surface p-5">
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
    <section className="rounded-2xl border border-kwik-border bg-kwik-bg-surface p-5">
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

  // 1. Proceed to Payment — quote agreed, not yet paid
  const showProceedToPayment = quoteAgreed && paymentPending && !isCancelled;

  // 2. Confirm receipt — paid AND (delivered OR ready for pickup)
  const showConfirmReceipt =
    paymentPaid && deliveryReady && !alreadyConfirmed && !isCancelled;

  // 3. Cancel — payment pending AND quote not yet agreed (and not cancelled)
  const showCancel =
    paymentPending && !quoteAgreed && !isCancelled;

  // 4. Track order link — show once paid+processing or beyond
  const showTrack =
    (paymentPaid || order.status === "PROCESSING" || order.status === "FULFILLED") &&
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
    <section className="rounded-2xl border border-kwik-border bg-kwik-bg-surface p-5">
      <h2 className="font-semibold text-foreground">Actions</h2>
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
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

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
    if (!isAuthLoading && !isAuthenticated && needsAuthRedirect()) {
      const returnUrl = window.location.pathname + window.location.search;
      router.replace(`/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`);
    }
  }, [isAuthLoading, isAuthenticated, router]);

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
    <div className="bg-background min-h-screen">
      {/* ── Hero header (matches checkout/orders page design) ── */}
      <section className="kwik-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_55%)]" />
        <div className="container relative mx-auto max-w-6xl px-4 py-8">
          <Link
            href="/orders"
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-white/85 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to orders
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/80">
                  Order {orderReference(order)}
                </p>
                <h1 className="mt-1 font-heading text-2xl font-bold text-white sm:text-3xl">
                  {order.store?.name ?? "Vendor store"}
                </h1>
                <p className="mt-1 text-xs text-white/80">
                  Placed {formatDate(order.createdAt)}
                  {order.deliveryMethod && (
                    <>
                      {" · "}
                      {order.deliveryMethod === "PICKUP" ? "Pickup" : "Standard delivery"}
                    </>
                  )}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge
                  status={order.status}
                  className="bg-white/15 text-white ring-white/30"
                />
                {order.paymentStatus === "PAID" && order.escrow?.status === "HELD" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                    <ShieldCheck className="h-3 w-3" />
                    {KwisCrow.NAME}: Held
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Status bar ── */}
      <div className="border-b border-kwik-border bg-kwik-bg-surface">
        <div className="container mx-auto max-w-6xl px-4 py-3 text-xs text-muted-foreground">
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

      {/* ── Content ── */}
      <section className="container mx-auto max-w-6xl px-4 py-8">
        {/* Timeline */}
        <OrderTimeline order={order} />

        {/* Quote negotiation (STANDARD_DELIVERY only) */}
        <div className="mt-4">
          <QuoteSection order={order} quote={quote} />
        </div>

        {/* Two-column layout: products + side panel */}
        <div className="mt-4 grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-4">
            <ProductsSection order={order} />
            <CustomerActions order={order} />
          </div>

          <div className="lg:col-span-2 space-y-4">
            <PaymentSection order={order} />
            <DeliverySection order={order} />
            <OrderSummary order={order} />

            {/* Vendor mini-card */}
            {order.store && (
              <section className="rounded-2xl border border-kwik-border bg-kwik-bg-surface p-4">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-kwik-orange" />
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-kwik-muted">
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
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Default export: ErrorBoundary wrapper ─────────────────────────────────

export default function BuyerOrderDetailPage() {
  return (
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
  );
}
