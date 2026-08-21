"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  PackageCheck,
  ShieldCheck,
  Store,
  XCircle,
} from "lucide-react";
import { checkoutApi } from "@/services/api-client";
import type { Order, ParentCheckout } from "@/types";

import {
  DEFAULT_PAYMENT_PROVIDER,
  KwisCrow,
  PAYMENT_PROVIDERS,
  type PaymentProviderKey,
} from "@/constants/order-workflow";
import { OrderStatus } from "@/constants/order-workflow";
import { useOrderWorkflowStore } from "@/stores/order-workflow-store";

// ─── Helpers ───────────────────────────────────────────────────────────────

type VerifyState = "loading" | "pending" | "success" | "failed";

function unwrapApiData<T>(value: unknown): T {
  if (value && typeof value === "object" && "data" in value) {
    return (value as { data: T }).data;
  }
  return value as T;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Main page ─────────────────────────────────────────────────────────────

export default function CheckoutVerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference =
    searchParams.get("reference") ??
    searchParams.get("trxref") ??
    searchParams.get("ref") ??
    undefined;
  // The status param lets us short-circuit verification in the mock sandbox
  // (no real Paystack roundtrip needed). If absent we still attempt the live
  // verify call and fall back to "success" for any non-failure response.
  const queryStatus = searchParams.get("status") ?? undefined;
  // The optional orderId param wires the success branch to the order-workflow
  // store so paying a mock order actually moves it into PAID.
  const orderId = searchParams.get("orderId") ?? searchParams.get("order") ?? undefined;
  const providerKey =
    (searchParams.get("provider") as PaymentProviderKey | null) ??
    DEFAULT_PAYMENT_PROVIDER;
  const provider =
    PAYMENT_PROVIDERS[providerKey] ?? PAYMENT_PROVIDERS[DEFAULT_PAYMENT_PROVIDER];

  const [state, setState] = React.useState<VerifyState>("loading");
  const [headline, setHeadline] = React.useState<string>("Verifying your payment");
  const [message, setMessage] = React.useState<string>(
    `We're confirming your payment with ${provider.label}.`,
  );
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [parentCheckout, setParentCheckout] = React.useState<ParentCheckout | null>(
    null,
  );
  const [attempt, setAttempt] = React.useState(0);

  // Pull the store actions we need to wire a successful payment back into the
  // workflow.
  const markToPay = useOrderWorkflowStore((s) => s.markToPay);
  const payOrder = useOrderWorkflowStore((s) => s.payOrder);
  const workflowOrder = useOrderWorkflowStore((s) =>
    orderId ? s.orders.find((o) => o.id === orderId) : undefined,
  );

  React.useEffect(() => {
    let mounted = true;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const verify = async () => {
      if (!reference) {
        if (!mounted) return;
        setState("failed");
        setHeadline("Missing payment reference");
        setMessage(
          "We couldn't find a payment reference in the URL. Please return to checkout and try again.",
        );
        return;
      }

      // If the URL says success, fast-path to the success branch (mock flow).
      if (queryStatus === "success") {
        if (!mounted) return;
        setState("success");
        setHeadline("Payment confirmed");
        setMessage(
          "Your payment is confirmed. KwisCrow is holding your funds safely — the vendor will now process your order.",
        );
        // Wire the workflow store: move the order to PAID.
        if (workflowOrder) {
          try {
            if (workflowOrder.status === OrderStatus.QUOTED) {
              markToPay(workflowOrder.id);
            }
            payOrder(workflowOrder.id);
          } catch (err) {
            console.warn("[checkout/verify] could not advance workflow store:", err);
          }
        }
        return;
      }

      // If the URL says failed/pending, reflect that without hitting the API.
      if (queryStatus === "failed") {
        if (!mounted) return;
        setState("failed");
        setHeadline("Payment not completed");
        setMessage(
          "The payment was not completed successfully. Your order is still in 'To Pay' — you can retry safely.",
        );
        return;
      }
      if (queryStatus === "pending") {
        if (!mounted) return;
        setState("pending");
        setHeadline("Payment is being processed");
        setMessage(
          `${provider.label} is still processing your payment. This usually takes a few minutes — we'll update this page when it clears.`,
        );
        retryTimer = setTimeout(() => {
          if (mounted) setAttempt((current) => current + 1);
        }, 5000);
        return;
      }

      // Otherwise attempt the live verify call.
      try {
        const response = await checkoutApi.verifyPayment(reference);
        const verification = unwrapApiData<{
          status?: string;
          orders?: Order[];
          order?: Order;
          parentCheckout?: ParentCheckout;
        }>(response);
        if (!mounted) return;

        setOrders(verification.orders ?? (verification.order ? [verification.order] : []));
        setParentCheckout(verification.parentCheckout ?? null);

        const paymentStatus = (verification?.status ?? "").toUpperCase();
        if (paymentStatus === "PAID" || paymentStatus === "SUCCESS") {
          setState("success");
          setHeadline("Payment confirmed");
          setMessage(
            "Your payment is confirmed. KwisCrow is holding your funds safely — the vendor will now process your order.",
          );
          if (workflowOrder) {
            try {
              if (workflowOrder.status === OrderStatus.QUOTED) {
                markToPay(workflowOrder.id);
              }
              payOrder(workflowOrder.id);
            } catch (err) {
              console.warn("[checkout/verify] could not advance workflow store:", err);
            }
          }
        } else if (paymentStatus === "PENDING") {
          setState("pending");
          setHeadline("Payment is being processed");
          setMessage(
            `${provider.label} is still processing your payment. This usually takes a few minutes — we'll update this page when it clears.`,
          );
          retryTimer = setTimeout(() => {
            if (mounted) setAttempt((current) => current + 1);
          }, 5000);
        } else {
          setState("failed");
          setHeadline("Payment not completed");
          setMessage(
            "The payment was not completed successfully. Your order is still in 'To Pay' — you can retry safely.",
          );
        }
      } catch (error) {
        if (!mounted) return;
        // Soft-fail: the sandbox has no backend, so if the live verify call
        // errors out we treat it as "pending" (the user can refresh later)
        // rather than blocking the whole checkout flow.
        console.warn("[checkout/verify] live verify failed:", error);
        setState("pending");
        setHeadline("Payment is being processed");
        setMessage(
          `We're still confirming your payment with ${provider.label}. This usually takes a few minutes — please check back shortly or refresh this page.`,
        );
        retryTimer = setTimeout(() => {
          if (mounted) setAttempt((current) => current + 1);
        }, 5000);
      }
    };

    verify();
    return () => {
      mounted = false;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [attempt, reference, queryStatus, providerKey, orderId, workflowOrder, markToPay, payOrder]);

  return (
    <div className="bg-background min-h-screen">
      {/* ── Hero header (matches checkout page design) ── */}
      <section className="bg-secondary-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_55%)]" />
        <div className="container relative mx-auto max-w-4xl px-4 py-8">
          {/* KwisCrow brand strip */}
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 backdrop-blur">
              <ShieldCheck className="h-4 w-4 text-white" />
            </span>
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-white">
              {KwisCrow.NAME}
            </span>
            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70 sm:inline">
              {KwisCrow.TAGLINE}
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="flex items-start gap-4">
              <div className="hidden shrink-0 sm:block">
                <VerifyHeroIcon state={state} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/80">
                  Payment verification
                </p>
                <h1 className="mt-1 font-heading text-2xl font-bold text-white sm:text-3xl">
                  {headline}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85">
                  {message}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Content ── */}
      <section className="container mx-auto max-w-4xl px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={state}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
          >
            {/* Reference + provider strip */}
            {reference && (
              <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2">
                <div className="bg-card px-5 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Reference
                  </p>
                  <p className="mt-1 break-all font-mono text-sm font-semibold text-foreground">
                    {reference}
                  </p>
                </div>
                <div className="bg-card px-5 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Provider
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {provider.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{provider.blurb}</p>
                </div>
              </div>
            )}

            {/* State-specific body */}
            <div className="p-5 md:p-6">
              {state === "loading" && <LoadingBody />}
              {state === "pending" && <PendingBody reference={reference} />}
              {state === "success" && (
                <SuccessBody
                  orders={orders}
                  parentCheckout={parentCheckout}
                  workflowOrderRef={
                    workflowOrder
                      ? {
                          id: workflowOrder.id,
                          ref: workflowOrder.ref,
                          vendorName: workflowOrder.vendor.name,
                          itemCount: workflowOrder.items.length,
                          total: workflowOrder.items.reduce(
                            (s, i) => s + i.unitPrice * i.quantity,
                            0,
                          ) + (workflowOrder.quotation?.deliveryFee ?? 0) - (workflowOrder.quotation?.discount ?? 0),
                        }
                      : null
                  }
                />
              )}
              {state === "failed" && (
                <FailedBody
                  reference={reference}
                  onRetry={() => router.push("/orders")}
                />
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </section>
    </div>
  );
}

// ─── Sub-views ─────────────────────────────────────────────────────────────

function VerifyHeroIcon({ state }: { state: VerifyState }) {
  if (state === "loading") {
    return (
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/15 backdrop-blur">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }
  if (state === "success") {
    return (
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/15 backdrop-blur">
        <CheckCircle2 className="h-9 w-9 text-white" />
      </div>
    );
  }
  if (state === "pending") {
    return (
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/15 backdrop-blur">
        <Clock className="h-8 w-8 text-white" />
      </div>
    );
  }
  return (
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/15 backdrop-blur">
      <XCircle className="h-9 w-9 text-white" />
    </div>
  );
}

function LoadingBody() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-xl bg-primary-50 px-4 py-3 text-sm text-primary-900">
        <ShieldCheck className="h-4.5 w-4.5 shrink-0 text-primary-600" />
        <span>
          <strong>Secure verification.</strong> Your payment is being verified
          through an encrypted channel. Please don&apos;t close this page.
        </span>
      </div>
      <div className="flex items-center justify-center gap-2 py-2 text-xs text-gray-500">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Connecting to payment gateway…
      </div>
    </div>
  );
}

function PendingBody({ reference }: { reference?: string | null }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-foreground">
        <Clock className="mt-0.5 h-4.5 w-4.5 shrink-0 text-warning" />
        <div>
          <p className="font-semibold">Hang tight — payment is still processing.</p>
          <p className="mt-1 text-xs leading-5 text-gray-600">
            Some payment methods (bank transfer, USSD) can take a few minutes to
            settle. You can refresh this page in a moment, or head to your
            orders list — we&apos;ll mark it paid automatically when the funds
            clear.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-gray-200 bg-surface px-5 text-sm font-semibold text-foreground transition hover:border-gray-300"
        >
          <Clock className="h-4 w-4" />
          Refresh status
        </button>
        <Link
          href="/orders"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-secondary-500 px-5 text-sm font-bold text-white transition hover:bg-secondary-600"
        >
          View orders
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      {reference && (
        <p className="text-center text-[11px] text-gray-500">
          Reference: <span className="font-mono">{reference}</span>
        </p>
      )}
    </div>
  );
}

function SuccessBody({
  orders,
  parentCheckout,
  workflowOrderRef,
}: {
  orders: Order[];
  parentCheckout: ParentCheckout | null;
  workflowOrderRef: {
    id: string;
    ref: string;
    vendorName: string;
    itemCount: number;
    total: number;
  } | null;
}) {
  const hasLiveOrders = orders.length > 0;
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-sm text-foreground">
        <ShieldCheck className="mt-0.5 h-4.5 w-4.5 shrink-0 text-success" />
        <div>
          <p className="font-semibold">
            Order confirmed — vendor will process your order.
          </p>
          <p className="mt-1 text-xs leading-5 text-gray-600">
            Your payment is safely held by {KwisCrow.NAME} escrow. The vendor
            only gets paid after you confirm receipt (or after the 24-hour
            dispute window closes).
          </p>
        </div>
      </div>

      {/* Mock-workflow order summary */}
      {workflowOrderRef && !hasLiveOrders && (
        <div className="rounded-xl border border-gray-200 bg-surface">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">
              Order summary
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {workflowOrderRef.ref}
            </p>
          </div>
          <div className="flex items-start justify-between gap-4 px-4 py-3">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Store className="h-4 w-4 text-primary-600" />
                <span className="truncate">{workflowOrderRef.vendorName}</span>
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {workflowOrderRef.itemCount} item
                {workflowOrderRef.itemCount === 1 ? "" : "s"} • Order in escrow
              </p>
            </div>
            <p className="shrink-0 text-sm font-bold text-foreground tabular-nums">
              {formatCurrency(workflowOrderRef.total)}
            </p>
          </div>
        </div>
      )}

      {/* Live order summary (from the API) */}
      {hasLiveOrders && (
        <div className="rounded-xl border border-gray-200 bg-surface">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">
              {parentCheckout ? "Parent checkout" : "Order summary"}
            </p>
            {parentCheckout && (
              <p className="mt-1 break-all text-sm font-semibold text-foreground">
                {parentCheckout.checkoutReference}
              </p>
            )}
          </div>
          <ul className="divide-y divide-gray-100">
            {orders.map((order) => (
              <li
                key={order.id}
                className="flex items-start justify-between gap-4 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Store className="h-4 w-4 text-primary-600" />
                    <span className="truncate">
                      {order.store?.name ?? "Vendor store"}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {order.items?.length ?? 0} item
                    {order.items?.length === 1 ? "" : "s"} • {order.status}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-bold text-foreground tabular-nums">
                  {formatCurrency(Number(order.totalAmount ?? 0))}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        {workflowOrderRef ? (
          <Link
            href={`/orders/${workflowOrderRef.id}`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-secondary-500 px-5 text-sm font-bold text-white transition hover:bg-secondary-600"
          >
            <PackageCheck className="h-4 w-4" />
            Track this order
          </Link>
        ) : (
          <Link
            href="/orders"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-secondary-500 px-5 text-sm font-bold text-white transition hover:bg-secondary-600"
          >
            <PackageCheck className="h-4 w-4" />
            View orders
          </Link>
        )}
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-gray-200 bg-surface px-5 text-sm font-semibold text-foreground transition hover:border-gray-300"
        >
          Continue shopping
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function FailedBody({
  reference,
  onRetry,
}: {
  reference?: string | null;
  onRetry: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-foreground">
        <AlertCircle className="mt-0.5 h-4.5 w-4.5 shrink-0 text-danger" />
        <div>
          <p className="font-semibold">Your order is still in &quot;To Pay&quot;.</p>
          <p className="mt-1 text-xs leading-5 text-gray-600">
            No payment was captured. You can safely retry the payment — your
            order is waiting for you in your orders list.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-secondary-500 px-5 text-sm font-bold text-white transition hover:bg-secondary-600"
        >
          Back to orders
          <ArrowRight className="h-4 w-4" />
        </button>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-gray-200 bg-surface px-5 text-sm font-semibold text-foreground transition hover:border-gray-300"
        >
          Continue shopping
        </Link>
      </div>
      {reference && (
        <p className="text-center text-[11px] text-gray-500">
          Reference: <span className="font-mono">{reference}</span>
        </p>
      )}
    </div>
  );
}
