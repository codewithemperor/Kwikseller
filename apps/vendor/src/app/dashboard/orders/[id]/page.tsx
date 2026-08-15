"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  HandCoins,
  Loader2,
  MessageCircle,
  Package,
  Printer,
  Send,
  TrendingDown,
  Truck,
  User,
  XCircle,
} from "lucide-react";
import { vendorCommerceApi } from "@kwikseller/api-client";
import type { Order, OrderQuote, OrderStatus, QuoteStatus } from "@kwikseller/types";
import { Skeleton } from "@kwikseller/ui";
import { kwikToast } from "@kwikseller/utils";
import { formatCurrency, formatDate, unwrapApiData } from "@/lib/vendor-format";
import { cn } from "@/lib/utils";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getOrderRef(order: Order) {
  return order.checkoutReference ?? order.id;
}

function getCustomerName(order: Order) {
  const profile = order.buyer?.profile;
  const name = `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim();
  return name || order.buyer?.email || "Customer";
}

function formatStatus(status: string) {
  if (status === "FULFILLED") return "Ready to ship";
  if (status === "REFUNDED") return "Returned";
  return status
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function getPaymentStatus(order: Order) {
  return order.payment?.status ?? order.parentCheckout?.payment?.status ?? order.paymentStatus;
}

function badgeClass(status: string) {
  if (["PAID", "AUTHORIZED", "DELIVERED", "CONFIRMED"].includes(status)) {
    return "bg-success/10 text-success";
  }
  if (["PENDING", "PENDING_PAYMENT", "PROCESSING", "FULFILLED"].includes(status)) {
    return "bg-warning/10 text-warning";
  }
  return "bg-danger/10 text-danger";
}

function quoteTone(status: QuoteStatus): string {
  if (status === "AGREED") return "bg-success/10 text-success border-success/30";
  if (status === "REJECTED" || status === "EXPIRED" || status === "CANCELLED")
    return "bg-danger/10 text-danger border-danger/30";
  if (status === "CUSTOMER_REQUESTED_REDUCTION") return "bg-warning/10 text-warning border-warning/30";
  return "bg-accent/10 text-accent border-accent/30";
}

function quoteStatusLabel(status: QuoteStatus): string {
  switch (status) {
    case "PENDING_VENDOR_QUOTE": return "Awaiting your quote";
    case "QUOTED": return "Quote sent — waiting for buyer";
    case "CUSTOMER_REQUESTED_REDUCTION": return "Buyer requested a lower fee";
    case "VENDOR_REVISED": return "You revised the quote";
    case "AGREED": return "Fee agreed";
    case "REJECTED": return "Quote rejected";
    case "EXPIRED": return "Quote expired";
    case "CANCELLED": return "Quote cancelled";
    default: return status;
  }
}

function addressLine(order: Order) {
  const address = order.address;
  if (!address) return "No delivery address";
  return [
    address.line1,
    address.line2,
    address.localGovernment,
    address.city,
    address.state,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");
}

/**
 * Returns the next *fulfillment* action (after the order is paid & accepted).
 * The quote / accept-order actions are handled separately by the page because
 * they depend on `quoteStatus`, not just `order.status`.
 *
 * NOTE: only prepare (CONFIRMED → PROCESSING) and ready (PROCESSING →
 * FULFILLED) have backend routes — there are no vendor ship/deliver endpoints.
 */
function nextFulfillmentAction(status: OrderStatus): { label: string; status: OrderStatus } | null {
  if (status === "CONFIRMED") return { label: "Mark preparing", status: "PROCESSING" };
  if (status === "PROCESSING") return { label: "Mark ready to ship", status: "FULFILLED" };
  return null;
}

// ─── Info block ────────────────────────────────────────────────────────────────

function InfoBlock({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0">
      <div className="mb-6 flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-kwik-dark text-white">
          {icon}
        </span>
        <h2 className="font-heading text-xl font-bold text-foreground">{title}</h2>
      </div>
      <div className="space-y-3 text-sm text-foreground">{children}</div>
    </section>
  );
}

// ─── Quote modal ──────────────────────────────────────────────────────────────

type QuoteModalMode = "submit" | "review-reduction";

function resolveQuoteMode(quoteStatus: QuoteStatus): QuoteModalMode | null {
  if (quoteStatus === "PENDING_VENDOR_QUOTE") return "submit";
  if (quoteStatus === "CUSTOMER_REQUESTED_REDUCTION") return "review-reduction";
  return null;
}

function latestReduction(quote: OrderQuote | null | undefined) {
  if (!quote?.revisions?.length) return null;
  return [...quote.revisions]
    .reverse()
    .find((r) => r.type === "CUSTOMER_REQUEST_REDUCTION") ?? null;
}

function QuoteModal({
  order,
  quote,
  isOpen,
  onClose,
}: {
  order: Order;
  quote: OrderQuote | null | undefined;
  isOpen: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const quoteStatus: QuoteStatus = quote?.status ?? order.quoteStatus ?? "PENDING_VENDOR_QUOTE";
  const mode = resolveQuoteMode(quoteStatus);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  React.useEffect(() => {
    if (isOpen) {
      setAmount(String(quote?.currentAmount ?? order.agreedDeliveryFee ?? ""));
      setNote("");
    }
  }, [isOpen, order.id, quoteStatus, quote?.currentAmount, order.agreedDeliveryFee]);

  const invalidate = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["vendor-order", order.id] });
    queryClient.invalidateQueries({ queryKey: ["vendor-quote", order.id] });
    queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
    queryClient.invalidateQueries({ queryKey: ["vendor-attention-counts"] });
  }, [queryClient, order.id]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const fee = Number(amount);
      if (!Number.isFinite(fee) || fee < 0) throw new Error("Enter a valid delivery fee");
      await vendorCommerceApi.submitDeliveryQuote(order.id, {
        amount: fee,
        note: note.trim() || undefined,
      });
    },
    onSuccess: () => {
      kwikToast.success("Quote submitted", "The buyer will be notified to review your delivery fee.");
      invalidate();
      onClose();
    },
    onError: (err) => kwikToast.error("Could not submit quote", err instanceof Error ? err.message : "Please try again."),
  });

  const reviseMutation = useMutation({
    mutationFn: async () => {
      const fee = Number(amount);
      if (!Number.isFinite(fee) || fee < 0) throw new Error("Enter a valid amount");
      await vendorCommerceApi.reviseDeliveryQuote(order.id, {
        amount: fee,
        note: note.trim() || undefined,
      });
    },
    onSuccess: () => {
      kwikToast.success("Quote updated", "The buyer will see your new delivery fee.");
      invalidate();
      onClose();
    },
    onError: () => kwikToast.error("Could not revise quote", "Please try again."),
  });

  const acceptReductionMutation = useMutation({
    mutationFn: async () => {
      await vendorCommerceApi.acceptQuoteReduction(order.id, { note: note.trim() || undefined });
    },
    onSuccess: () => {
      kwikToast.success("Reduction accepted", "The buyer can now proceed to payment.");
      invalidate();
      onClose();
    },
    onError: () => kwikToast.error("Could not accept reduction", "Please try again."),
  });

  const rejectReductionMutation = useMutation({
    mutationFn: async () => {
      await vendorCommerceApi.rejectQuoteReduction(order.id, { note: note.trim() || undefined });
    },
    onSuccess: () => {
      kwikToast.info("Reduction rejected", "Your original delivery fee has been restored.");
      invalidate();
      onClose();
    },
    onError: () => kwikToast.error("Could not reject reduction", "Please try again."),
  });

  if (!isOpen || !mode) return null;

  const numericAmount = Number(amount);
  const isAmountValid = Number.isFinite(numericAmount) && numericAmount > 0;
  const reduction = latestReduction(quote);
  const canAcceptReduction = reduction ? numericAmount === reduction.amount : false;

  const title = mode === "review-reduction" ? "Review buyer's request" : "Set delivery quote";
  const desc =
    mode === "review-reduction"
      ? "The buyer requested a lower delivery fee. Accept, counter, or reject."
      : "Quote a delivery fee for this order. The buyer can accept, negotiate, or reject.";

  const isPending =
    submitMutation.isPending ||
    reviseMutation.isPending ||
    acceptReductionMutation.isPending ||
    rejectReductionMutation.isPending;

  const handleSubmit = () => {
    if (!isAmountValid) {
      kwikToast.warning("Enter a valid amount", "Please enter a positive delivery fee.");
      return;
    }
    if (mode === "submit") submitMutation.mutate();
    else reviseMutation.mutate();
  };

  return (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quote-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-background max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl p-5 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 id="quote-modal-title" className="text-lg font-bold text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </div>
          <button type="button" onClick={onClose} className="hover:bg-muted flex h-9 w-9 items-center justify-center rounded-lg" aria-label="Close">
            <XCircle className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {/* Buyer reduction info (review-reduction mode) */}
          {mode === "review-reduction" && reduction ? (
            <div className="rounded-xl border border-warning/40 bg-warning/5 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-warning">
                <TrendingDown className="h-4 w-4" />
                Buyer requested a lower fee
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg bg-background px-3 py-2.5">
                <div>
                  <p className="text-xs text-muted-foreground">Your current quote</p>
                  <p className="text-sm font-bold text-foreground">{formatCurrency(quote?.currentAmount ?? 0)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Buyer offered</p>
                  <p className="text-sm font-bold text-warning">{formatCurrency(reduction.amount)}</p>
                </div>
              </div>
              {reduction.note ? (
                <p className="mt-2 text-xs italic text-muted-foreground">&ldquo;{reduction.note}&rdquo;</p>
              ) : null}
              <p className="mt-3 text-xs text-muted-foreground">
                To accept, set the amount to{" "}
                <button
                  type="button"
                  className="font-semibold text-warning underline"
                  onClick={() => setAmount(String(reduction.amount))}
                >
                  {formatCurrency(reduction.amount)}
                </button>{" "}
                and click Accept, or enter a different amount to counter-offer.
              </p>
            </div>
          ) : null}

          {/* Delivery fee input */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Delivery fee (₦)
            </label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 2500"
              className="bg-background text-foreground h-11 w-full rounded-xl border border-border px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>

          {/* Note */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Note to buyer (optional)
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                mode === "review-reduction"
                  ? "Add a message about your decision."
                  : "e.g. Standard delivery via logistics partner, 2–3 business days."
              }
              className="bg-background text-foreground w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-accent/5 px-3 py-2.5 text-xs text-muted-foreground">
            <HandCoins className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <p>You handle delivery yourself — Kwikseller does not provide riders. The buyer pays (via Paystack) only after agreeing to this fee. Pickup orders skip this step entirely.</p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-border text-sm font-semibold text-foreground transition hover:bg-muted disabled:opacity-60"
          >
            Cancel
          </button>

          {mode === "review-reduction" && reduction ? (
            <>
              <button
                type="button"
                disabled={rejectReductionMutation.isPending}
                onClick={() => rejectReductionMutation.mutate()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-danger/10 px-5 text-sm font-semibold text-danger transition hover:bg-danger/20 disabled:opacity-60"
              >
                Reject
              </button>
              <button
                type="button"
                disabled={!canAcceptReduction || acceptReductionMutation.isPending}
                onClick={() => acceptReductionMutation.mutate()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-success px-5 text-sm font-bold text-success-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {acceptReductionMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Accept ₦{reduction.amount.toLocaleString()}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isAmountValid || submitMutation.isPending || reviseMutation.isPending}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-bold text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {(submitMutation.isPending || reviseMutation.isPending) ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
              ) : (
                <><Send className="h-4 w-4" /> {mode === "submit" ? "Submit quote" : "Send revised quote"}</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-11 w-36" />
      </div>
      <div className="rounded-xl border border-border bg-background p-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-4 h-5 w-32" />
        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        <Skeleton className="mt-10 h-80 w-full" />
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function VendorOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);

  const orderQuery = useQuery({
    queryKey: ["vendor-order", id],
    queryFn: async () => {
      const response = await vendorCommerceApi.getOrder(id);
      return unwrapApiData<Order>(response.data);
    },
  });

  // Fetch the full quote (with revision history) for STANDARD_DELIVERY orders.
  // PICKUP orders auto-agree at checkout; the endpoint still returns the quote
  // but it's already AGREED so the section won't render action buttons.
  const quoteQuery = useQuery({
    queryKey: ["vendor-quote", id],
    queryFn: async () => {
      try {
        const response = await vendorCommerceApi.getOrderQuote(id);
        return unwrapApiData<OrderQuote>(response.data);
      } catch {
        return null;
      }
    },
    enabled: !!id,
  });

  // Status transitions map to the REAL vendor endpoints — the backend has no
  // generic PATCH /vendor/orders/:id/status route:
  //   CONFIRMED  → /accept   (PENDING/PAID → CONFIRMED)
  //   PROCESSING → /prepare  (CONFIRMED → PROCESSING)
  //   FULFILLED  → /ready    (PROCESSING → FULFILLED)
  const updateStatusMutation = useMutation({
    mutationFn: async (status: OrderStatus) => {
      if (status === "CONFIRMED") {
        await vendorCommerceApi.acceptOrder(id);
      } else if (status === "PROCESSING") {
        await vendorCommerceApi.prepareOrder(id);
      } else if (status === "FULFILLED") {
        await vendorCommerceApi.readyOrder(id);
      } else {
        throw new Error(`No vendor endpoint for status ${status}`);
      }
    },
    onSuccess: () => {
      kwikToast.success("Order status updated");
      queryClient.invalidateQueries({ queryKey: ["vendor-order", id] });
      queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-attention-counts"] });
    },
    onError: () => {
      kwikToast.error("Could not update order status");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (reason: string) => {
      await vendorCommerceApi.cancelOrder(id, reason);
    },
    onSuccess: () => {
      kwikToast.info("Order cancelled");
      queryClient.invalidateQueries({ queryKey: ["vendor-order", id] });
      queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-attention-counts"] });
    },
    onError: () => {
      kwikToast.error("Could not cancel order");
    },
  });

  if (orderQuery.isLoading) return <LoadingState />;

  const order = orderQuery.data;
  if (!order) {
    return (
      <div className="rounded-xl border border-border bg-background p-10 text-center">
        <Package className="mx-auto h-12 w-12 text-muted-foreground" strokeWidth={1.6} />
        <h1 className="mt-4 font-heading text-2xl font-bold text-foreground">Order not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">This order could not be loaded for your store.</p>
        <Link
          href="/dashboard/orders"
          className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to orders
        </Link>
      </div>
    );
  }

  const quote = quoteQuery.data ?? null;
  const quoteStatus: QuoteStatus = quote?.status ?? order.quoteStatus ?? "PENDING_VENDOR_QUOTE";
  const paymentStatus = getPaymentStatus(order);
  const isPaid = ["PAID", "AUTHORIZED"].includes(paymentStatus);
  const isPickup = order.deliveryMethod === "PICKUP";
  const isStandardDelivery = !isPickup;
  const isBusy = updateStatusMutation.isPending || cancelMutation.isPending;

  // ── Quote-driven logic ──
  const quoteNeedsAction =
    isStandardDelivery &&
    (quoteStatus === "PENDING_VENDOR_QUOTE" || quoteStatus === "CUSTOMER_REQUESTED_REDUCTION");
  const quoteInFlight =
    isStandardDelivery &&
    quoteStatus !== "AGREED" &&
    quoteStatus !== "REJECTED" &&
    quoteStatus !== "EXPIRED" &&
    quoteStatus !== "CANCELLED";

  // Accept-order is a pure optional status flip (PENDING/PAID → CONFIRMED).
  // It only makes sense once the quote is agreed (or for pickup) and the
  // order isn't already confirmed/cancelled.
  const canAcceptOrder =
    (isPickup || quoteStatus === "AGREED") &&
    isPaid &&
    (order.status === "PENDING" || order.status === "PAID");

  const fulfillmentAction = nextFulfillmentAction(order.status);
  const canCancel = !["CANCELLED", "REFUNDED", "DELIVERED"].includes(order.status) && !quoteInFlight;

  // ── Totals (use consistent typography — same size as amount & shipping rows) ──
  const subtotal =
    order.subtotal ?? order.items?.reduce((sum, item) => sum + Number(item.totalPrice ?? 0), 0) ?? 0;
  const deliveryFee = isPickup ? 0 : order.agreedDeliveryFee ?? 0;
  const total = order.totalAmount ?? subtotal + deliveryFee;

  const handleCancel = () => {
    const reason = window.prompt("Reason for cancelling this order?");
    if (!reason) return;
    cancelMutation.mutate(reason);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/orders"
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background text-foreground transition hover:border-accent/45"
            aria-label="Back to orders"
          >
            <ArrowLeft className="h-6 w-6" strokeWidth={1.8} />
          </Link>
          <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">Order details</h1>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-kwik-dark px-5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Printer className="h-4 w-4" strokeWidth={1.8} />
          Print invoice
        </button>
      </section>

      {/* Main card */}
      <section className="mx-auto max-w-6xl rounded-xl border border-border bg-background p-5 md:p-8">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto_1fr] lg:items-start">
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground">
              Order ID #{getOrderRef(order)}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <span className={cn("h-2.5 w-2.5 rounded-full", badgeClass(order.status).includes("success") ? "bg-success" : "bg-warning")} />
                {formatStatus(order.status)}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-foreground">
                {isPickup ? "Pickup" : "Standard delivery"}
              </span>
            </div>
          </div>

          {["CONFIRMED", "PROCESSING", "FULFILLED", "SHIPPED", "DELIVERED"].includes(order.status) ? (
            <div className="rounded-lg border border-success/40 bg-success/15 px-8 py-4 text-center font-heading text-xl font-bold text-success">
              Order accepted successfully!
            </div>
          ) : null}

          <div className="flex justify-start lg:justify-end">
            <Link
              href="/dashboard/messages"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-kwik-blue px-4 text-sm font-semibold text-kwik-blue transition hover:bg-kwik-blue/5"
            >
              Chat with client
              <MessageCircle className="h-4 w-4" strokeWidth={1.8} />
            </Link>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-8">
          <div className="grid gap-10 lg:grid-cols-3">
            <InfoBlock icon={<User className="h-6 w-6" />} title="Customer">
              <p className="grid grid-cols-[90px_1fr] gap-3">
                <span>Full Name :</span>
                <span>{getCustomerName(order)}</span>
              </p>
              <p className="grid grid-cols-[90px_1fr] gap-3">
                <span>Email :</span>
                <span className="break-all">{order.buyer?.email ?? "No email"}</span>
              </p>
              <p className="grid grid-cols-[90px_1fr] gap-3">
                <span>Phone</span>
                <span>{order.buyer?.phone ?? "No phone"}</span>
              </p>
            </InfoBlock>

            <InfoBlock icon={<Package className="h-6 w-6" />} title="Order Details">
              <p className="flex flex-wrap items-center gap-2">
                <span>Payment :</span>
                <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", badgeClass(paymentStatus))}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {formatStatus(paymentStatus)}
                </span>
              </p>
              <p>
                Delivery :{" "}
                {isPickup
                  ? "Buyer will pick up"
                  : order.estimatedDeliveryEnd
                    ? `Deliver before ${formatDate(order.estimatedDeliveryEnd)}`
                    : "Delivery date pending"}
              </p>
              <p>Items : {order.items?.length ?? 0}</p>
            </InfoBlock>

            <InfoBlock icon={<Truck className="h-6 w-6" />} title="Delivery">
              {isPickup ? (
                <p>Buyer collects from your store — no delivery address needed.</p>
              ) : (
                <>
                  <p>City: {order.address?.city ?? order.deliveryState ?? "Not set"}</p>
                  <p>Area: {order.address?.localGovernment ?? order.deliveryLocalGovernment ?? "Not set"}</p>
                  <p>Address : {addressLine(order)}</p>
                  <p>Time : {order.estimatedDeliveryStart ? formatDate(order.estimatedDeliveryStart) : "Pending"}</p>
                </>
              )}
            </InfoBlock>
          </div>
        </div>

        {/* Items table */}
        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left">
            <thead>
              <tr className="bg-default">
                <th className="rounded-l-lg px-5 py-5 text-sm font-bold text-foreground">Product</th>
                <th className="px-5 py-5 text-sm font-bold text-foreground">Price</th>
                <th className="px-5 py-5 text-sm font-bold text-foreground">Quantity</th>
                <th className="rounded-r-lg px-5 py-5 text-sm font-bold text-foreground">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item) => {
                const imageUrl = item.product?.images?.[0]?.url;
                return (
                  <tr key={item.id}>
                    <td className="border-b border-border px-5 py-4">
                      <div className="flex min-w-0 items-center gap-4">
                        {imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imageUrl}
                            alt={item.product?.name ?? "Product"}
                            className="h-11 w-20 rounded object-cover"
                          />
                        ) : (
                          <span className="flex h-11 w-20 items-center justify-center rounded bg-default text-muted-foreground">
                            <Package className="h-5 w-5" />
                          </span>
                        )}
                        <span className="truncate font-semibold text-foreground">
                          {item.product?.name ?? item.productId}
                        </span>
                      </div>
                    </td>
                    <td className="border-b border-border px-5 py-4 font-semibold text-foreground">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="border-b border-border px-5 py-4 text-foreground">{item.quantity}</td>
                    <td className="border-b border-border px-5 py-4 font-semibold text-foreground">
                      {formatCurrency(item.totalPrice)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals — consistent font sizing across all rows */}
        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-sm space-y-3">
            <div className="flex justify-between text-sm text-foreground">
              <span>Subtotal</span>
              <span className="font-semibold">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Shipping fee</span>
              <span className="font-semibold">
                {isPickup
                  ? formatCurrency(0)
                  : quoteStatus === "AGREED"
                    ? formatCurrency(deliveryFee)
                    : "Pending quote"}
              </span>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-sm font-semibold text-foreground">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quote negotiation section (STANDARD_DELIVERY only) */}
      {isStandardDelivery ? (
        <section className="mx-auto max-w-6xl rounded-xl border border-border bg-background p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
                <HandCoins className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-heading text-base font-bold text-foreground">Delivery quote</h3>
                <p className="text-xs text-muted-foreground">
                  {isStandardDelivery
                    ? "You handle delivery — quote a fee for the buyer."
                    : "Delivery fee negotiation"}
                </p>
              </div>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
                quoteTone(quoteStatus),
              )}
            >
              {quoteNeedsAction ? <Clock className="h-3 w-3" /> : null}
              {quoteStatus === "AGREED" ? <CheckCircle2 className="h-3 w-3" /> : null}
              {quoteStatusLabel(quoteStatus)}
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-surface/40 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {quoteStatus === "AGREED" ? "Agreed fee" : "Current quote"}
              </p>
              <p className="mt-1 text-lg font-bold text-foreground">
                {formatCurrency(quote?.currentAmount ?? order.agreedDeliveryFee ?? 0)}
              </p>
              {quote?.agreedAmount != null && quoteStatus === "AGREED" ? (
                <p className="text-xs text-success">Agreed on {formatDate(quote.agreedAt)}</p>
              ) : null}
            </div>

            {/* Buyer reduction request */}
            {latestReduction(quote) ? (
              <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-warning">
                  <TrendingDown className="h-3 w-3" />
                  Buyer offered
                </p>
                <p className="mt-1 text-lg font-bold text-warning">
                  {formatCurrency(latestReduction(quote)!.amount)}
                </p>
                {latestReduction(quote)!.note ? (
                  <p className="mt-1 text-xs italic text-muted-foreground">
                    &ldquo;{latestReduction(quote)!.note}&rdquo;
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Revision timeline */}
          {quote?.revisions && quote.revisions.length > 0 ? (
            <ol className="mt-4 space-y-1.5 border-l border-border pl-4">
              {quote.revisions.slice(-4).map((rev) => (
                <li key={rev.id} className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {rev.type === "VENDOR_QUOTE" && "You quoted"}
                    {rev.type === "VENDOR_REVISE" && "You revised to"}
                    {rev.type === "CUSTOMER_REQUEST_REDUCTION" && "Buyer requested"}
                    {rev.type === "VENDOR_ACCEPT_REDUCTION" && "You accepted"}
                    {rev.type === "VENDOR_REJECT_REDUCTION" && "You rejected"}
                    {rev.type === "CUSTOMER_ACCEPT" && "Buyer accepted"}
                    {rev.type === "CUSTOMER_REJECT" && "Buyer rejected"}
                  </span>{" "}
                  {formatCurrency(rev.amount)}
                  <span className="ml-1 text-muted-foreground/70">· {formatDate(rev.createdAt)}</span>
                </li>
              ))}
            </ol>
          ) : null}

          {/* Quote action button */}
          {quoteNeedsAction ? (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setQuoteModalOpen(true)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                <Send className="h-4 w-4" />
                {quoteStatus === "PENDING_VENDOR_QUOTE" ? "Set delivery quote" : "Review buyer's request"}
              </button>
              {quoteStatus === "CUSTOMER_REQUESTED_REDUCTION" && latestReduction(quote) ? (
                <span className="text-xs text-muted-foreground">
                  Accept ₦{latestReduction(quote)!.amount.toLocaleString()} or counter with a different amount.
                </span>
              ) : null}
            </div>
          ) : quoteStatus === "QUOTED" || quoteStatus === "VENDOR_REVISED" ? (
            <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Waiting for the buyer to respond.
            </p>
          ) : null}
        </section>
      ) : null}

      {/* Primary action buttons */}
      <section className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:justify-end">
        {canCancel ? (
          <button
            type="button"
            disabled={isBusy}
            onClick={handleCancel}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg px-6 text-sm font-semibold text-danger transition hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <XCircle className="h-4 w-4" />
            Cancel order
          </button>
        ) : null}

        {/* Quote action takes priority over accept/fulfillment when the
            delivery fee hasn't been agreed yet. */}
        {quoteNeedsAction ? (
          <button
            type="button"
            onClick={() => setQuoteModalOpen(true)}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-accent px-8 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <HandCoins className="h-4 w-4" />
            {quoteStatus === "PENDING_VENDOR_QUOTE" ? "Set delivery quote" : "Review buyer's request"}
          </button>
        ) : null}

        {/* Accept order — pure status flip, no modal needed. Only after the
            quote is agreed (or pickup) and payment is confirmed. */}
        {canAcceptOrder && !quoteNeedsAction ? (
          <button
            type="button"
            disabled={isBusy}
            onClick={() => updateStatusMutation.mutate("CONFIRMED")}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-success px-8 text-sm font-semibold text-success-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CheckCircle2 className="h-4 w-4" />
            Accept order
          </button>
        ) : null}

        {/* Fulfillment actions (prepare / ready / ship / deliver) */}
        {fulfillmentAction ? (
          <button
            type="button"
            disabled={isBusy}
            onClick={() => updateStatusMutation.mutate(fulfillmentAction.status)}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-success px-8 text-sm font-semibold text-success-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CheckCircle2 className="h-4 w-4" />
            {fulfillmentAction.label}
          </button>
        ) : null}
      </section>

      {/* Quote modal */}
      <QuoteModal
        order={order}
        quote={quote}
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
      />
    </div>
  );
}
