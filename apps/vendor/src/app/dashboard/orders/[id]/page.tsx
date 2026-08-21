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
import { vendorCommerceApi } from "@/lib/api-client";
import type { Order, OrderQuote, OrderStatus, QuoteStatus } from "@/lib/types";
import { AppModal, Skeleton } from "@/lib/ui";
import { kwikToast } from "@/lib/utils";
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
  return null;
}

function formatDeliveryWindow(order: Pick<Order, "estimatedDeliveryStart" | "estimatedDeliveryEnd">) {
  if (!order.estimatedDeliveryStart && !order.estimatedDeliveryEnd) {
    return "Delivery window pending";
  }
  if (order.estimatedDeliveryStart && order.estimatedDeliveryEnd) {
    return `${formatDate(order.estimatedDeliveryStart)} - ${formatDate(order.estimatedDeliveryEnd)}`;
  }
  return formatDate(order.estimatedDeliveryStart ?? order.estimatedDeliveryEnd);
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
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#171717] text-white">
          {icon}
        </span>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <div className="space-y-2.5 text-sm text-foreground">{children}</div>
    </section>
  );
}

function VendorPanelModal({
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
      className="fixed inset-0 z-[140] flex items-end bg-black/45 sm:items-center sm:justify-center sm:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="max-h-[88vh] w-full overflow-y-auto rounded-t-[28px] bg-white p-4 shadow-2xl sm:max-w-xl sm:rounded-[28px] sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#f4f1ec] text-[#5b554d]"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

type OrderActionKind =
  | "prepare"
  | "ready"
  | "complete-pickup"
  | "dispatch"
  | "mark-delivered"
  | "cancel";

type OrderActionCopy = {
  title: string;
  description: string;
  confirmLabel: string;
  tone: "default" | "success" | "danger";
};

const ORDER_ACTION_COPY: Record<OrderActionKind, OrderActionCopy> = {
  prepare: {
    title: "Mark order as preparing?",
    description: "This tells the customer that you have started working on the order.",
    confirmLabel: "Mark preparing",
    tone: "success",
  },
  ready: {
    title: "Mark ready for pickup?",
    description: "The buyer will see that the package is ready to collect from your store.",
    confirmLabel: "Mark ready",
    tone: "success",
  },
  "complete-pickup": {
    title: "Complete pickup handoff?",
    description: "Use this only after the buyer has arrived and collected the goods. Kwikscrow will be instructed to release the funds.",
    confirmLabel: "Complete pickup",
    tone: "success",
  },
  dispatch: {
    title: "Dispatch this order?",
    description: "Add tracking details if you have them. The buyer will be notified that the order is on the way.",
    confirmLabel: "Dispatch order",
    tone: "success",
  },
  "mark-delivered": {
    title: "Mark order delivered?",
    description: "This records that the package has reached the buyer. Funds remain held until the buyer confirms receipt or auto-release applies.",
    confirmLabel: "Mark delivered",
    tone: "default",
  },
  cancel: {
    title: "Cancel this order?",
    description: "This action changes the order status to cancelled. Add a clear reason so the customer understands what happened.",
    confirmLabel: "Cancel order",
    tone: "danger",
  },
};

function OrderActionModal({
  action,
  isOpen,
  isLoading,
  onClose,
  onConfirm,
  carrier,
  trackingNumber,
  pickupNote,
  cancelReason,
  onCarrierChange,
  onTrackingNumberChange,
  onPickupNoteChange,
  onCancelReasonChange,
}: {
  action: OrderActionKind | null;
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
  carrier: string;
  trackingNumber: string;
  pickupNote: string;
  cancelReason: string;
  onCarrierChange: (value: string) => void;
  onTrackingNumberChange: (value: string) => void;
  onPickupNoteChange: (value: string) => void;
  onCancelReasonChange: (value: string) => void;
}) {
  if (!action) return null;

  const copy = ORDER_ACTION_COPY[action];
  const isDanger = copy.tone === "danger";
  const confirmDisabled = isLoading || (action === "cancel" && !cancelReason.trim());

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!confirmDisabled) onConfirm();
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={copy.title}
      description={copy.description}
      className="sm:max-w-md"
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
          >
            Keep order as is
          </button>
          <button
            type="submit"
            form="vendor-order-action-form"
            disabled={confirmDisabled}
            className={cn(
              "inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60",
              isDanger ? "bg-danger hover:bg-danger/90" : "bg-[#171717] hover:bg-[#2a2a2a]",
            )}
          >
            {isLoading ? "Working..." : copy.confirmLabel}
          </button>
        </div>
      }
    >
      <form id="vendor-order-action-form" onSubmit={handleSubmit} className="space-y-4">
        {action === "dispatch" ? (
          <div className="grid gap-3">
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-foreground">Carrier or delivery partner</span>
              <input
                value={carrier}
                onChange={(event) => onCarrierChange(event.target.value)}
                placeholder="e.g. Kwik courier"
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-accent"
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-foreground">Tracking number</span>
              <input
                value={trackingNumber}
                onChange={(event) => onTrackingNumberChange(event.target.value)}
                placeholder="Optional"
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-accent"
              />
            </label>
          </div>
        ) : null}

        {action === "complete-pickup" ? (
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-foreground">Pickup note</span>
            <textarea
              value={pickupNote}
              onChange={(event) => onPickupNoteChange(event.target.value)}
              placeholder="Optional note for this handoff"
              rows={3}
              className="resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent"
            />
          </label>
        ) : null}

        {action === "cancel" ? (
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-foreground">Cancellation reason</span>
            <textarea
              value={cancelReason}
              onChange={(event) => onCancelReasonChange(event.target.value)}
              placeholder="Explain why this order cannot continue"
              rows={3}
              className="resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent"
              required
            />
          </label>
        ) : null}
      </form>
    </AppModal>
  );
}

function ActivityPanel({
  order,
  quote,
  quoteStatus,
}: {
  order: Order;
  quote: OrderQuote | null;
  quoteStatus: QuoteStatus;
}) {
  const events: Array<{ key: string; title: string; note: string }> = [
    {
      key: "created",
      title: "Order placed",
      note: formatDate(order.createdAt),
    },
  ];

  if (quote) {
    const latestQuoteEventAt =
      quote.agreedAt ??
      quote.revisions?.[quote.revisions.length - 1]?.createdAt ??
      order.createdAt;

    events.push({
      key: "quote",
      title: quoteStatusLabel(quoteStatus),
      note:
        quote.currentAmount != null
          ? `${formatCurrency(quote.currentAmount)} · ${formatDate(latestQuoteEventAt)}`
          : formatDate(latestQuoteEventAt),
    });
  }

  if (["PAID", "AUTHORIZED"].includes(getPaymentStatus(order))) {
    events.push({
      key: "paid",
      title: "Payment confirmed",
      note: "Buyer payment has been verified.",
    });
  }

  if (["PROCESSING", "FULFILLED", "SHIPPED", "DELIVERED"].includes(order.status)) {
    events.push({
      key: "status",
      title: formatStatus(order.status),
      note: "Latest fulfillment status.",
    });
  }

  return (
    <section className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Activity</h3>
          <p className="mt-1 text-xs text-muted-foreground">Recent milestones for this order.</p>
        </div>
      </div>
      <ol className="mt-4 space-y-3">
        {events.map((event, index) => (
          <li key={event.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#171717]" />
              {index < events.length - 1 ? <span className="mt-1 h-full w-px bg-border" /> : null}
            </div>
            <div className="pb-3">
              <p className="text-sm font-medium text-foreground">{event.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{event.note}</p>
            </div>
          </li>
        ))}
      </ol>
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
  const [minDeliveryDays, setMinDeliveryDays] = useState("1");
  const [maxDeliveryDays, setMaxDeliveryDays] = useState("3");

  React.useEffect(() => {
    if (isOpen) {
      setAmount(String(quote?.currentAmount ?? order.agreedDeliveryFee ?? ""));
      setNote("");
      const start = order.estimatedDeliveryStart ? new Date(order.estimatedDeliveryStart) : null;
      const end = order.estimatedDeliveryEnd ? new Date(order.estimatedDeliveryEnd) : null;
      const base = new Date();
      base.setHours(0, 0, 0, 0);
      const nextMin =
        start != null
          ? Math.max(1, Math.ceil((start.getTime() - base.getTime()) / (24 * 60 * 60 * 1000)))
          : 1;
      const nextMax =
        end != null
          ? Math.max(nextMin, Math.ceil((end.getTime() - base.getTime()) / (24 * 60 * 60 * 1000)))
          : Math.max(nextMin, 3);
      setMinDeliveryDays(String(nextMin));
      setMaxDeliveryDays(String(nextMax));
    }
  }, [
    isOpen,
    order.id,
    order.agreedDeliveryFee,
    order.estimatedDeliveryEnd,
    order.estimatedDeliveryStart,
    quoteStatus,
    quote?.currentAmount,
  ]);

  const invalidate = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["vendor-order", order.id] });
    queryClient.invalidateQueries({ queryKey: ["vendor-quote", order.id] });
    queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
    queryClient.invalidateQueries({ queryKey: ["vendor-attention-counts"] });
  }, [queryClient, order.id]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const fee = Number(amount);
      const minDays = Number(minDeliveryDays);
      const maxDays = Number(maxDeliveryDays);
      if (!Number.isFinite(fee) || fee < 0) throw new Error("Enter a valid delivery fee");
      if (!Number.isFinite(minDays) || minDays < 1) throw new Error("Enter a valid minimum delivery day");
      if (!Number.isFinite(maxDays) || maxDays < minDays) throw new Error("Maximum delivery day must be greater than or equal to minimum delivery day");
      await vendorCommerceApi.submitDeliveryQuote(order.id, {
        amount: fee,
        minDeliveryDays: minDays,
        maxDeliveryDays: maxDays,
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
      const minDays = Number(minDeliveryDays);
      const maxDays = Number(maxDeliveryDays);
      if (!Number.isFinite(fee) || fee < 0) throw new Error("Enter a valid amount");
      if (!Number.isFinite(minDays) || minDays < 1) throw new Error("Enter a valid minimum delivery day");
      if (!Number.isFinite(maxDays) || maxDays < minDays) throw new Error("Maximum delivery day must be greater than or equal to minimum delivery day");
      await vendorCommerceApi.reviseDeliveryQuote(order.id, {
        amount: fee,
        minDeliveryDays: minDays,
        maxDeliveryDays: maxDays,
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
  const numericMinDeliveryDays = Number(minDeliveryDays);
  const numericMaxDeliveryDays = Number(maxDeliveryDays);
  const isAmountValid = Number.isFinite(numericAmount) && numericAmount > 0;
  const isDeliveryWindowValid =
    Number.isFinite(numericMinDeliveryDays) &&
    Number.isFinite(numericMaxDeliveryDays) &&
    numericMinDeliveryDays >= 1 &&
    numericMaxDeliveryDays >= numericMinDeliveryDays;
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
    if (!isAmountValid || !isDeliveryWindowValid) {
      kwikToast.warning("Complete the quote details", "Enter a valid delivery fee and delivery date range.");
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

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Min delivery days
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={minDeliveryDays}
                onChange={(e) => setMinDeliveryDays(e.target.value)}
                className="bg-background text-foreground h-11 w-full rounded-xl border border-border px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Max delivery days
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={maxDeliveryDays}
                onChange={(e) => setMaxDeliveryDays(e.target.value)}
                className="bg-background text-foreground h-11 w-full rounded-xl border border-border px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
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
              disabled={!isAmountValid || !isDeliveryWindowValid || submitMutation.isPending || reviseMutation.isPending}
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
  const [activityOpen, setActivityOpen] = useState(false);
  const [orderAction, setOrderAction] = useState<OrderActionKind | null>(null);
  const [dispatchCarrier, setDispatchCarrier] = useState("");
  const [dispatchTrackingNumber, setDispatchTrackingNumber] = useState("");
  const [pickupNote, setPickupNote] = useState("");
  const [cancelReason, setCancelReason] = useState("");

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

  const invalidateOrderViews = () => {
    queryClient.invalidateQueries({ queryKey: ["vendor-order", id] });
    queryClient.invalidateQueries({ queryKey: ["vendor-quote", id] });
    queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
    queryClient.invalidateQueries({ queryKey: ["vendor-attention-counts"] });
  };

  const updateStatusMutation = useMutation({
    mutationFn: async (status: OrderStatus) => {
      if (status === "PROCESSING") {
        await vendorCommerceApi.prepareOrder(id);
      } else if (status === "FULFILLED") {
        await vendorCommerceApi.readyOrder(id);
      } else {
        throw new Error(`No vendor endpoint for status ${status}`);
      }
    },
    onSuccess: () => {
      setOrderAction(null);
      kwikToast.success("Order status updated");
      invalidateOrderViews();
    },
    onError: () => {
      kwikToast.error("Could not update order status");
    },
  });

  const dispatchMutation = useMutation({
    mutationFn: async (data?: { carrier?: string; trackingNumber?: string }) => {
      const carrier = data?.carrier?.trim() || undefined;
      const trackingNumber = data?.trackingNumber?.trim() || undefined;
      await vendorCommerceApi.dispatchOrder(id, { carrier, trackingNumber });
    },
    onSuccess: () => {
      setOrderAction(null);
      setDispatchCarrier("");
      setDispatchTrackingNumber("");
      kwikToast.success("Order dispatched", "The buyer can now track this delivery.");
      invalidateOrderViews();
    },
    onError: () => {
      kwikToast.error("Could not dispatch order");
    },
  });

  const markDeliveredMutation = useMutation({
    mutationFn: async () => {
      await vendorCommerceApi.markDelivered(id);
    },
    onSuccess: () => {
      setOrderAction(null);
      kwikToast.success("Order marked delivered", "The buyer has been notified to confirm receipt.");
      invalidateOrderViews();
    },
    onError: () => {
      kwikToast.error("Could not mark this order delivered");
    },
  });

  const completePickupMutation = useMutation({
    mutationFn: async (data?: { note?: string }) => {
      const note = data?.note?.trim() || undefined;
      await vendorCommerceApi.completePickup(id, note ? { note } : undefined);
    },
    onSuccess: () => {
      setOrderAction(null);
      setPickupNote("");
      kwikToast.success("Pickup completed", "Kwikscrow has been instructed to release the funds.");
      invalidateOrderViews();
    },
    onError: () => {
      kwikToast.error("Could not complete pickup");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (reason: string) => {
      await vendorCommerceApi.cancelOrder(id, reason);
    },
    onSuccess: () => {
      setOrderAction(null);
      setCancelReason("");
      kwikToast.info("Order cancelled");
      invalidateOrderViews();
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
  const isBusy =
    updateStatusMutation.isPending ||
    dispatchMutation.isPending ||
    markDeliveredMutation.isPending ||
    completePickupMutation.isPending ||
    cancelMutation.isPending;

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

  const fulfillmentAction = nextFulfillmentAction(order.status);
  const canReadyForPickup = isPickup && order.status === "PROCESSING";
  const canCompletePickup = isPickup && isPaid && ["FULFILLED", "PROCESSING", "CONFIRMED", "PAID"].includes(order.status);
  const canDispatch = isStandardDelivery && order.status === "PROCESSING";
  const canMarkDelivered = isStandardDelivery && order.status === "SHIPPED";
  const canCancel = !["CANCELLED", "REFUNDED", "DELIVERED"].includes(order.status) && !quoteInFlight;

  // ── Totals (use consistent typography — same size as amount & shipping rows) ──
  const subtotal =
    order.subtotal ?? order.items?.reduce((sum, item) => sum + Number(item.totalPrice ?? 0), 0) ?? 0;
  const deliveryFee = isPickup ? 0 : order.agreedDeliveryFee ?? 0;
  const total = order.totalAmount ?? subtotal + deliveryFee;

  const openOrderAction = (action: OrderActionKind) => {
    setOrderAction(action);
  };

  const closeOrderAction = () => {
    if (isBusy) return;
    setOrderAction(null);
  };

  const confirmOrderAction = () => {
    if (orderAction === "prepare") {
      updateStatusMutation.mutate("PROCESSING");
      return;
    }
    if (orderAction === "ready") {
      updateStatusMutation.mutate("FULFILLED");
      return;
    }
    if (orderAction === "dispatch") {
      dispatchMutation.mutate({
        carrier: dispatchCarrier,
        trackingNumber: dispatchTrackingNumber,
      });
      return;
    }
    if (orderAction === "mark-delivered") {
      markDeliveredMutation.mutate();
      return;
    }
    if (orderAction === "complete-pickup") {
      completePickupMutation.mutate({ note: pickupNote });
      return;
    }
    if (orderAction === "cancel" && cancelReason.trim()) {
      cancelMutation.mutate(cancelReason.trim());
    }
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/orders"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-foreground transition hover:border-accent/45"
            aria-label="Back to orders"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
          </Link>
          <h1 className="text-xl font-semibold text-foreground sm:text-[22px]">Order</h1>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-kwik-dark px-4 text-sm font-medium text-white transition hover:opacity-90"
        >
          <Printer className="h-4 w-4" strokeWidth={1.8} />
          Print invoice
        </button>
      </section>

      {isStandardDelivery ? (
        <section className="rounded-xl border border-[#ece9e4] bg-white px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Delivery quote</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {quoteStatus === "AGREED"
                  ? `Buyer agreed to ${formatCurrency(quote?.agreedAmount ?? quote?.currentAmount ?? order.agreedDeliveryFee ?? 0)}`
                  : quoteStatusLabel(quoteStatus)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                  quoteTone(quoteStatus),
                )}
              >
                {quoteStatusLabel(quoteStatus)}
              </span>
              {quoteNeedsAction ? (
                <button
                  type="button"
                  onClick={() => setQuoteModalOpen(true)}
                  className="inline-flex h-9 items-center justify-center rounded-full bg-[#171717] px-4 text-xs font-medium text-white"
                >
                  {quoteStatus === "PENDING_VENDOR_QUOTE" ? "Set quote" : "Review request"}
                </button>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="flex gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => setActivityOpen(true)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[#e6dfd5] bg-white px-4 py-3 text-sm font-medium text-[#262626]"
            >
              <Clock className="h-4 w-4" />
              View activity
            </button>
            {isStandardDelivery ? (
              <button
                type="button"
                onClick={() => setQuoteModalOpen(true)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[#e6dfd5] bg-white px-4 py-3 text-sm font-medium text-[#262626]"
              >
                <HandCoins className="h-4 w-4" />
                Quote details
              </button>
            ) : null}
          </div>

          <section className="rounded-xl border border-border bg-background p-4 md:p-5">
            <div className="flex flex-col gap-5 border-b border-border pb-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Order reference</p>
                  <h2 className="mt-1 text-xl font-semibold text-foreground">
                    #{getOrderRef(order)}
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-foreground">
                    <span className={cn("h-2.5 w-2.5 rounded-full", badgeClass(order.status).includes("success") ? "bg-success" : "bg-warning")} />
                    {formatStatus(order.status)}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-border px-2.5 py-1 text-xs font-medium text-foreground">
                    {isPickup ? "Pickup" : "Standard delivery"}
                  </span>
                  <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", badgeClass(paymentStatus))}>
                    Payment {formatStatus(paymentStatus)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-start gap-3 lg:items-end">
                {["CONFIRMED", "PROCESSING", "FULFILLED", "SHIPPED", "DELIVERED"].includes(order.status) ? (
                  <div className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-xs font-medium text-success">
                    Order accepted and active
                  </div>
                ) : null}
                <Link
                  href="/dashboard/messages"
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-kwik-blue px-4 text-sm font-medium text-kwik-blue transition hover:bg-kwik-blue/5"
                >
                  Chat with client
                  <MessageCircle className="h-4 w-4" strokeWidth={1.8} />
                </Link>
              </div>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-3">
              <InfoBlock icon={<User className="h-6 w-6" />} title="Customer">
                <p className="grid grid-cols-[90px_1fr] gap-3">
                  <span>Full name</span>
                  <span>{getCustomerName(order)}</span>
                </p>
                <p className="grid grid-cols-[90px_1fr] gap-3">
                  <span>Email</span>
                  <span className="break-all">{order.buyer?.email ?? "No email"}</span>
                </p>
                <p className="grid grid-cols-[90px_1fr] gap-3">
                  <span>Phone</span>
                  <span>{order.buyer?.phone ?? "No phone"}</span>
                </p>
              </InfoBlock>

              <InfoBlock icon={<Package className="h-6 w-6" />} title="Order details">
                <p>Items: {order.items?.length ?? 0}</p>
                <p>
                  Delivery: {isPickup ? "Buyer will pick up" : formatDeliveryWindow(order)}
                </p>
                <p>Payment status: {formatStatus(paymentStatus)}</p>
              </InfoBlock>

              <InfoBlock icon={<Truck className="h-6 w-6" />} title="Delivery">
                {isPickup ? (
                  <p>Buyer collects from your store. Share the order reference during pickup handoff.</p>
                ) : (
                  <>
                    <p>City: {order.address?.city ?? order.deliveryState ?? "Not set"}</p>
                    <p>Area: {order.address?.localGovernment ?? order.deliveryLocalGovernment ?? "Not set"}</p>
                    <p>Address: {addressLine(order)}</p>
                    <p>Window: {formatDeliveryWindow(order)}</p>
                  </>
                )}
              </InfoBlock>
            </div>

            <div className="mt-8 overflow-x-auto">
              <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left">
                <thead>
                  <tr className="bg-default">
                    <th className="rounded-l-lg px-5 py-4 text-sm font-semibold text-foreground">Product</th>
                    <th className="px-5 py-4 text-sm font-semibold text-foreground">Price</th>
                    <th className="px-5 py-4 text-sm font-semibold text-foreground">Quantity</th>
                    <th className="rounded-r-lg px-5 py-4 text-sm font-semibold text-foreground">Total</th>
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
                        <td className="border-b border-border px-5 py-4 text-sm font-semibold text-foreground">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="border-b border-border px-5 py-4 text-sm text-foreground">{item.quantity}</td>
                        <td className="border-b border-border px-5 py-4 text-sm font-semibold text-foreground">
                          {formatCurrency(item.totalPrice)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {isStandardDelivery ? (
            <section className="rounded-xl border border-border bg-background p-4 md:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <HandCoins className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Delivery quote</h3>
                    <p className="text-xs text-muted-foreground">
                      Set the fee once, then track buyer response here.
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                    quoteTone(quoteStatus),
                  )}
                >
                  {quoteNeedsAction ? <Clock className="h-3.5 w-3.5" /> : null}
                  {quoteStatus === "AGREED" ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                  {quoteStatusLabel(quoteStatus)}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-surface/40 px-4 py-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    {quoteStatus === "AGREED" ? "Agreed fee" : "Current quote"}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {formatCurrency(quote?.currentAmount ?? order.agreedDeliveryFee ?? 0)}
                  </p>
                  {quote?.agreedAmount != null && quoteStatus === "AGREED" ? (
                    <p className="text-xs text-success">Agreed on {formatDate(quote.agreedAt)}</p>
                  ) : null}
                </div>

                <div className="rounded-lg border border-border bg-surface/40 px-4 py-3">
                  <p className="text-xs font-medium text-muted-foreground">Delivery window</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {formatDeliveryWindow(order)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Funds auto-release 24 hours after the final delivery date if the buyer does not respond.
                  </p>
                </div>

                {latestReduction(quote) ? (
                  <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-4 sm:col-span-2">
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-warning">
                      <TrendingDown className="h-4 w-4" />
                      Buyer requested a lower fee
                    </p>
                    <p className="mt-1 text-xl font-bold text-warning">
                      {formatCurrency(latestReduction(quote)!.amount)}
                    </p>
                    {latestReduction(quote)!.note ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        &ldquo;{latestReduction(quote)!.note}&rdquo;
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {quote?.revisions && quote.revisions.length > 0 ? (
                <ol className="mt-4 space-y-2 border-l border-border pl-4">
                  {quote.revisions.slice(-4).map((rev) => (
                    <li key={rev.id} className="text-sm text-muted-foreground">
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

              {quoteNeedsAction ? (
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuoteModalOpen(true)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    <Send className="h-4 w-4" />
                    {quoteStatus === "PENDING_VENDOR_QUOTE" ? "Set delivery quote" : "Review buyer's request"}
                  </button>
                  {quoteStatus === "CUSTOMER_REQUESTED_REDUCTION" && latestReduction(quote) ? (
                    <span className="text-sm text-muted-foreground">
                      Accept ₦{latestReduction(quote)!.amount.toLocaleString()} or counter with a different amount.
                    </span>
                  ) : null}
                </div>
              ) : quoteStatus === "QUOTED" || quoteStatus === "VENDOR_REVISED" ? (
                <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Waiting for the buyer to respond.
                </p>
              ) : null}
            </section>
          ) : null}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="hidden lg:block">
            <ActivityPanel order={order} quote={quote} quoteStatus={quoteStatus} />
          </div>

          <section className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Next action</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Keep fulfillment moving from here.
                </p>
              </div>
              {isBusy ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : null}
            </div>

            <div className="mt-4 flex flex-col gap-3">
              {quoteNeedsAction ? (
                <button
                  type="button"
                  onClick={() => setQuoteModalOpen(true)}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  <HandCoins className="h-4 w-4" />
                  {quoteStatus === "PENDING_VENDOR_QUOTE" ? "Set delivery quote" : "Review buyer request"}
                </button>
              ) : null}

              {fulfillmentAction && !quoteNeedsAction ? (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => openOrderAction("prepare")}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-success px-5 text-sm font-semibold text-success-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {fulfillmentAction.label}
                </button>
              ) : null}

              {canReadyForPickup ? (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => openOrderAction("ready")}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-success px-5 text-sm font-semibold text-success-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark ready for pickup
                </button>
              ) : null}

              {canCompletePickup ? (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => openOrderAction("complete-pickup")}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-kwik-dark px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Package className="h-4 w-4" />
                  Complete pickup handoff
                </button>
              ) : null}

              {canDispatch ? (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => openOrderAction("dispatch")}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-success px-5 text-sm font-semibold text-success-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Truck className="h-4 w-4" />
                  Dispatch order
                </button>
              ) : null}

              {canMarkDelivered ? (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => openOrderAction("mark-delivered")}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-kwik-dark px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark delivered
                </button>
              ) : null}

              {canCancel ? (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => openOrderAction("cancel")}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-danger/30 px-5 text-sm font-semibold text-danger transition hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <XCircle className="h-4 w-4" />
                  Cancel order
                </button>
              ) : null}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-background p-4">
            <h3 className="text-sm font-semibold text-foreground">Order summary</h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-sm text-foreground">
                <span>Subtotal</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Shipping fee</span>
                <span className="font-semibold">
                  {isPickup
                    ? formatCurrency(0)
                    : quoteStatus === "AGREED"
                      ? formatCurrency(deliveryFee)
                      : "Pending quote"}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3 text-base font-semibold text-foreground">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </section>

          {isStandardDelivery ? (
            <section className="rounded-xl border border-border bg-background p-4">
              <h3 className="text-sm font-semibold text-foreground">Quote status</h3>
              <p className="mt-2 text-xs text-muted-foreground">{quoteStatusLabel(quoteStatus)}</p>
              <div className="mt-4 rounded-lg bg-surface/50 px-4 py-3">
                <p className="text-xs font-medium text-muted-foreground">Current fee</p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {formatCurrency(quote?.currentAmount ?? order.agreedDeliveryFee ?? 0)}
                </p>
              </div>
            </section>
          ) : (
            <section className="rounded-xl border border-border bg-background p-4">
              <h3 className="text-sm font-semibold text-foreground">Pickup workflow</h3>
              <p className="mt-2 text-xs text-muted-foreground">
                Once the buyer arrives with the order reference, complete the pickup handoff here to trigger escrow release.
              </p>
            </section>
          )}
        </aside>
      </div>

      {/* Quote modal */}
      <QuoteModal
        order={order}
        quote={quote}
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
      />

      <VendorPanelModal
        open={activityOpen}
        title="Order activity"
        onClose={() => setActivityOpen(false)}
      >
        <ActivityPanel order={order} quote={quote} quoteStatus={quoteStatus} />
      </VendorPanelModal>

      <OrderActionModal
        action={orderAction}
        isOpen={orderAction !== null}
        isLoading={isBusy}
        onClose={closeOrderAction}
        onConfirm={confirmOrderAction}
        carrier={dispatchCarrier}
        trackingNumber={dispatchTrackingNumber}
        pickupNote={pickupNote}
        cancelReason={cancelReason}
        onCarrierChange={setDispatchCarrier}
        onTrackingNumberChange={setDispatchTrackingNumber}
        onPickupNoteChange={setPickupNote}
        onCancelReasonChange={setCancelReason}
      />
    </div>
  );
}
