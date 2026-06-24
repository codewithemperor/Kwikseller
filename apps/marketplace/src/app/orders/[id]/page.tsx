"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  MapPin,
  Package,
  RefreshCw,
  Shield,
  ShieldAlert,
  Truck,
} from "lucide-react";
import { ordersApi } from "@kwikseller/api-client";
import type { EscrowStatus, Order, OrderStatus } from "@kwikseller/types";
import {
  AppButton,
  AppImage,
  EmptyState,
  OrderStatusBadge,
  OrderSummary,
  OrderTimeline,
  Skeleton,
  SkeletonCard,
  type OrderSummaryItem,
  type OrderTimelineStep,
} from "@kwikseller/ui";
import { cn, formatCurrency, formatDate, formatDateTime, kwikToast, useAuth } from "@kwikseller/utils";
import { DisputeModal } from "@/components/checkout/dispute-modal";
import { DeliveryTracker } from "@/components/landing/delivery-tracker";

/* ─── Helpers ─── */

function unwrapOrder(value: unknown): Order | null {
  if (!value) return null;
  const payload = value as { data?: unknown };
  const nested = payload?.data as { data?: unknown } | undefined;
  const candidate = nested?.data ?? payload?.data ?? value;
  if (!candidate || typeof candidate !== "object") return null;
  if ("id" in candidate) return candidate as Order;
  return null;
}

function getOrderRef(order: Order): string {
  return order.checkoutReference || order.id.slice(-8).toUpperCase();
}

function formatAddress(order: Order): string | null {
  if (order.delivery?.deliveryAddress) {
    return order.delivery.deliveryAddress;
  }
  const addr = order.address;
  if (addr) {
    return [addr.line1, addr.line2, addr.city, addr.state, addr.country]
      .filter(Boolean)
      .join(", ");
  }
  if (order.deliveryLocalGovernment && order.deliveryState) {
    return `${order.deliveryLocalGovernment}, ${order.deliveryState}, Nigeria`;
  }
  return null;
}

function getProductImage(order: Order, productId: string): string | undefined {
  // Order items include product with images
  const item = order.items?.find((it) => it.productId === productId);
  const images = item?.product?.images;
  const main = images?.find((img) => img.isMain) ?? images?.[0];
  return main?.url;
}

/* ─── Order status → timeline steps ─── */

const ORDER_STAGE_RANK: Record<string, number> = {
  DRAFT: 0,
  PENDING_PAYMENT: 0,
  PENDING: 1,
  PAID: 2,
  CONFIRMED: 3,
  PROCESSING: 4,
  FULFILLED: 5,
  SHIPPED: 6,
  DELIVERED: 7,
  CANCELLED: -1,
  REFUNDED: -1,
};

function rankOf(status: OrderStatus | string): number {
  return ORDER_STAGE_RANK[status] ?? 0;
}

function buildOrderTimeline(order: Order): OrderTimelineStep[] {
  const rank = rankOf(order.status);
  const isCancelled = rank < 0;

  const steps: OrderTimelineStep[] = [];

  steps.push({
    label: "Order placed",
    status: "completed",
    timestamp: order.createdAt,
    description: "We received your order.",
  });

  // Confirmed — completed once past PAID, current when PAID, upcoming otherwise
  const confirmedStep: OrderTimelineStep = {
    label: "Confirmed",
    status: "upcoming",
    description: "The vendor has accepted your order.",
  };
  if (rank >= 3) {
    confirmedStep.status = "completed";
    confirmedStep.timestamp = order.updatedAt;
  } else if (rank === 2) {
    confirmedStep.status = "current";
  } else if (isCancelled) {
    confirmedStep.status = "upcoming";
    confirmedStep.description = "Order cancelled before confirmation.";
  }
  steps.push(confirmedStep);

  // Processing — completed if PROCESSING+, current if CONFIRMED
  const processingStep: OrderTimelineStep = {
    label: "Processing",
    status: "upcoming",
    description: "The vendor is preparing your items.",
  };
  if (rank >= 4) {
    processingStep.status = "completed";
    processingStep.timestamp = order.updatedAt;
  } else if (rank === 3) {
    processingStep.status = "current";
  } else if (isCancelled) {
    processingStep.description = "Order cancelled before processing.";
  }
  steps.push(processingStep);

  // Shipped — completed if SHIPPED+, current if PROCESSING/FULFILLED
  const shippedStep: OrderTimelineStep = {
    label: "Shipped",
    status: "upcoming",
    description: "Your order is on its way.",
  };
  if (rank >= 6) {
    shippedStep.status = "completed";
    shippedStep.timestamp = order.delivery?.pickedUpAt ?? order.updatedAt;
  } else if (rank === 4 || rank === 5) {
    shippedStep.status = "current";
    shippedStep.description = "Your items are ready and awaiting pickup.";
  } else if (isCancelled) {
    shippedStep.description = "Order was never shipped.";
  }
  steps.push(shippedStep);

  // Delivered — completed if DELIVERED, current if SHIPPED, upcoming otherwise
  const deliveredStep: OrderTimelineStep = {
    label: "Delivered",
    status: "upcoming",
    description: "Your order has been delivered.",
  };
  if (rank >= 7) {
    deliveredStep.status = "completed";
    deliveredStep.timestamp =
      order.delivery?.deliveredAt ?? order.delivery?.customerConfirmedAt ?? order.updatedAt;
  } else if (rank === 6) {
    deliveredStep.status = "current";
    deliveredStep.description = "Your rider is on the way.";
  } else if (isCancelled) {
    deliveredStep.description = "Order was never delivered.";
  }
  steps.push(deliveredStep);

  return steps;
}

const ESCROW_STATUS_LABEL: Record<EscrowStatus, string> = {
  HELD: "Held in escrow",
  PENDING_RELEASE: "Release pending",
  RELEASED: "Released to vendor",
  DISPUTED: "Under dispute review",
  REFUNDED: "Refunded",
  PARTIAL: "Partially released",
};

const ESCROW_STATUS_TONE: Record<EscrowStatus, string> = {
  HELD: "bg-accent/10 text-accent",
  PENDING_RELEASE: "bg-warning/10 text-warning",
  RELEASED: "bg-success/10 text-success",
  DISPUTED: "bg-danger/10 text-danger",
  REFUNDED: "bg-default-100 text-muted-foreground",
  PARTIAL: "bg-warning/10 text-warning",
};

/* ─── Loading skeleton ─── */

function OrderDetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <Skeleton className="h-4 w-32" />
      <div className="flex flex-wrap items-center gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SkeletonCard className="rounded-2xl" />
          <SkeletonCard className="rounded-2xl" />
          <SkeletonCard className="rounded-2xl" />
        </div>
        <div className="space-y-4">
          <SkeletonCard className="rounded-2xl" />
          <SkeletonCard className="rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

/* ─── Page ─── */

export default function BuyerOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [disputeOpen, setDisputeOpen] = useState(false);
  const trackingSectionRef = useRef<HTMLDivElement | null>(null);

  // Auth gate
  React.useEffect(() => {
    if (!isAuthLoading && !isAuthenticated && orderId) {
      router.replace(`/login?redirect=/orders/${orderId}`);
    }
  }, [isAuthLoading, isAuthenticated, orderId, router]);

  const queryKey = useMemo(
    () => ["buyer-order", orderId] as const,
    [orderId],
  );

  const { data: order, isLoading, isError } = useQuery<Order | null>({
    queryKey,
    enabled: !!orderId && !isAuthLoading && isAuthenticated,
    queryFn: async () => {
      try {
        const response = await ordersApi.get(orderId as string);
        return unwrapOrder(response);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load order.";
        kwikToast.error("Couldn't load this order", message);
        throw err;
      }
    },
    retry: 1,
    staleTime: 15 * 1000,
  });

  // Confirm delivery mutation
  const confirmDeliveryMutation = useMutation({
    mutationFn: async () => {
      const response = await ordersApi.confirmDelivery(orderId as string);
      return unwrapOrder(response);
    },
    onSuccess: (updated) => {
      kwikToast.success(
        "Delivery confirmed",
        "The escrow will be released to the vendor shortly.",
      );
      // Update both the detail cache and the list cache
      if (updated) {
        queryClient.setQueryData(queryKey, updated);
      } else {
        queryClient.invalidateQueries({ queryKey });
      }
      queryClient.invalidateQueries({ queryKey: ["buyer-orders"] });
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : "Please try again.";
      kwikToast.error("Couldn't confirm delivery", message);
    },
  });

  // Open dispute mutation
  const openDisputeMutation = useMutation({
    mutationFn: async ({
      reason,
      evidence,
    }: {
      reason: string;
      evidence?: string;
    }) => {
      const response = await ordersApi.openDispute(
        orderId as string,
        reason,
        evidence,
      );
      return unwrapOrder(response);
    },
    onSuccess: (updated) => {
      kwikToast.success(
        "Dispute opened",
        "Our team will review your case and the escrow has been frozen.",
      );
      setDisputeOpen(false);
      if (updated) {
        queryClient.setQueryData(queryKey, updated);
      } else {
        queryClient.invalidateQueries({ queryKey });
      }
      queryClient.invalidateQueries({ queryKey: ["buyer-orders"] });
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : "Please try again.";
      kwikToast.error("Couldn't open dispute", message);
    },
  });

  // Auth loading / not yet authenticated
  if (isAuthLoading || (!isAuthLoading && !isAuthenticated)) {
    return <OrderDetailSkeleton />;
  }

  // Loading
  if (isLoading) {
    return <OrderDetailSkeleton />;
  }

  // Not found or error
  if (isError || !order) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mx-auto max-w-4xl px-4 py-12"
      >
        <Link
          href="/orders"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to orders
        </Link>
        <EmptyState
          variant="error"
          title="Order not found"
          description="We couldn't find this order. It may have been removed, or you might not have permission to view it."
          action={{
            label: "Back to my orders",
            onClick: () => router.push("/orders"),
          }}
          className="rounded-2xl border border-kwik-border bg-surface"
        />
      </motion.div>
    );
  }

  // Derive display values
  const orderRef = getOrderRef(order);
  const placedAt = formatDateTime(order.createdAt);
  const timelineSteps = buildOrderTimeline(order);
  const addressLine = formatAddress(order);
  const items: OrderSummaryItem[] = (order.items ?? []).map((item) => ({
    name: item.product?.name ?? `Item ${item.id.slice(-4)}`,
    quantity: item.quantity,
    unitPrice: Number(item.unitPrice ?? 0),
    image: getProductImage(order, item.productId),
  }));
  const subtotal = Number(order.subtotal ?? 0);
  const deliveryFee = Number(order.shippingFee ?? 0);
  const discount = order.discount ? Number(order.discount) : undefined;
  const total = Number(order.totalAmount ?? 0);

  const isCancelled = ["CANCELLED", "REFUNDED"].includes(order.status);
  const isDisputed = order.disputeStatus === "OPENED" || order.escrow?.status === "DISPUTED";
  const canConfirmDelivery =
    !order.delivery?.customerConfirmed &&
    ["SHIPPED", "DELIVERED", "FULFILLED"].includes(order.status);
  const canOpenDispute =
    !isDisputed &&
    !isCancelled &&
    ["SHIPPED", "DELIVERED", "FULFILLED", "PROCESSING", "CONFIRMED"].includes(
      order.status,
    );

  const scrollToTracking = () => {
    trackingSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleConfirmDelivery = () => {
    confirmDeliveryMutation.mutate();
  };

  const handleDisputeSubmit = (reason: string, evidence?: string) => {
    openDisputeMutation.mutate({ reason, evidence });
  };

  const handleReorder = () => {
    // Reorder is optional — for now, route to cart and let the buyer rebuild.
    // A full reorder implementation would re-add items to the cart via cartApi.
    kwikToast.info(
      "Reorder",
      "Cart rebuild is coming soon — for now, please re-add items from the store.",
    );
    router.push("/cart");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-6xl px-4 py-8"
    >
      {/* Breadcrumb / back */}
      <Link
        href="/orders"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to my orders
      </Link>

      {/* Order header */}
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
              Order #{orderRef}
            </h1>
            <OrderStatusBadge status={order.status} size="md" />
            {isDisputed && (
              <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2.5 py-1 text-xs font-semibold text-danger">
                <ShieldAlert className="h-3 w-3" />
                Disputed
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Placed on{" "}
            <time dateTime={order.createdAt} className="font-medium text-foreground">
              {placedAt}
            </time>
            {order.store?.name && (
              <>
                {" "}
                · from{" "}
                <span className="font-medium text-foreground">
                  {order.store.name}
                </span>
              </>
            )}
          </p>
        </div>
      </header>

      {/* Two-column grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* ─── LEFT COLUMN ─── */}
        <div className="space-y-6 lg:col-span-2">
          {/* Order timeline */}
          <section className="rounded-2xl border border-kwik-border bg-surface p-5 sm:p-6">
            <h2 className="mb-4 font-heading text-base font-bold text-foreground">
              Order status
            </h2>
            <OrderTimeline steps={timelineSteps} direction="vertical" />
          </section>

          {/* Order items */}
          <section className="rounded-2xl border border-kwik-border bg-surface p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-base font-bold text-foreground">
                Items in this order
              </h2>
              <span className="text-xs text-muted-foreground">
                {items.length} {items.length === 1 ? "item" : "items"}
              </span>
            </div>

            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No items could be loaded for this order.
              </p>
            ) : (
              <ul className="divide-y divide-kwik-border">
                {order.items?.map((item) => {
                  const name =
                    item.product?.name ?? `Item ${item.id.slice(-4)}`;
                  const variantName = item.variant?.name;
                  const image = getProductImage(order, item.productId);
                  const unitPrice = Number(item.unitPrice ?? 0);
                  const lineTotal = Number(item.totalPrice ?? unitPrice * item.quantity);
                  return (
                    <li
                      key={item.id}
                      className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                    >
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-kwik-border bg-default-100">
                        <AppImage
                          src={image}
                          alt={name}
                          fallbackVariant="product"
                          className="h-full w-full"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {name}
                        </p>
                        {variantName && (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            Variant: {variantName}
                          </p>
                        )}
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Qty: {item.quantity} ·{" "}
                          {formatCurrency(unitPrice)} each
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-foreground">
                          {formatCurrency(lineTotal)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Delivery address */}
          {addressLine && (
            <section className="rounded-2xl border border-kwik-border bg-surface p-5 sm:p-6">
              <h2 className="mb-3 flex items-center gap-2 font-heading text-base font-bold text-foreground">
                <MapPin className="h-4 w-4 text-accent" />
                Delivery address
              </h2>
              <p className="text-sm text-foreground">{addressLine}</p>
              {order.estimatedDeliveryStart && order.estimatedDeliveryEnd && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Estimated delivery:{" "}
                  {formatDate(order.estimatedDeliveryStart)} –{" "}
                  {formatDate(order.estimatedDeliveryEnd)}
                </p>
              )}
            </section>
          )}

          {/* Delivery tracking section */}
          <div ref={trackingSectionRef} className="scroll-mt-24">
            <DeliveryTracker
              orderId={order.id}
              delivery={order.delivery}
              order={order}
              onConfirmDelivery={handleConfirmDelivery}
              isConfirming={confirmDeliveryMutation.isPending}
            />
          </div>

          {/* Confirm-delivery CTA (inline, below tracker) */}
          {canConfirmDelivery && (
            <section className="rounded-2xl border border-accent/30 bg-accent/5 p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-heading text-base font-bold text-foreground">
                    Confirm delivery
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Once you confirm receipt, the escrow will be released to the
                    vendor.
                  </p>
                </div>
                <AppButton
                  variant="primary"
                  size="md"
                  onClick={handleConfirmDelivery}
                  isLoading={confirmDeliveryMutation.isPending}
                  loadingLabel="Confirming..."
                  className="shrink-0"
                >
                  Confirm delivery
                </AppButton>
              </div>
            </section>
          )}

          {/* Customer-confirmed badge */}
          {order.delivery?.customerConfirmed && (
            <section className="flex items-center gap-3 rounded-2xl border border-success/30 bg-success/5 p-5 sm:p-6">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <div>
                <p className="font-heading text-base font-bold text-foreground">
                  Delivery confirmed ✓
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  You confirmed receipt of this order
                  {order.delivery.customerConfirmedAt
                    ? ` on ${formatDateTime(order.delivery.customerConfirmedAt)}.`
                    : "."}
                </p>
              </div>
            </section>
          )}

          {/* Open dispute link */}
          {canOpenDispute && (
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setDisputeOpen(true)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-danger transition-opacity hover:opacity-80"
              >
                <ShieldAlert className="h-4 w-4" />
                Open dispute
              </button>
            </div>
          )}
        </div>

        {/* ─── RIGHT COLUMN (sidebar) ─── */}
        <div className="space-y-6 lg:col-span-1">
          {/* Order summary */}
          <OrderSummary
            items={items}
            subtotal={subtotal}
            deliveryFee={deliveryFee}
            discount={discount}
            total={total}
            showDeliveryFee
            showDiscount={!!discount}
          />

          {/* Payment info */}
          {order.payment && (
            <section className="rounded-2xl border border-kwik-border bg-surface p-5">
              <h3 className="mb-3 flex items-center gap-2 font-heading text-base font-bold text-foreground">
                <CreditCard className="h-4 w-4 text-accent" />
                Payment
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted-foreground">Gateway</dt>
                  <dd className="font-medium text-foreground">
                    {order.payment.gateway?.replace(/_/g, " ") ?? "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted-foreground">Reference</dt>
                  <dd className="truncate font-mono text-xs text-foreground">
                    {order.payment.reference ?? "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>
                    <OrderStatusBadge
                      status={order.payment.status}
                      size="sm"
                    />
                  </dd>
                </div>
                {order.payment.paidAt && (
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-muted-foreground">Paid on</dt>
                    <dd className="font-medium text-foreground">
                      {formatDateTime(order.payment.paidAt)}
                    </dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          {/* Escrow status */}
          {order.escrow && (
            <section className="rounded-2xl border border-kwik-border bg-surface p-5">
              <h3 className="mb-3 flex items-center gap-2 font-heading text-base font-bold text-foreground">
                <Shield className="h-4 w-4 text-accent" />
                Escrow
              </h3>
              {isDisputed ? (
                <div className="rounded-xl border border-danger/30 bg-danger/5 p-3">
                  <p className="text-sm font-semibold text-danger">
                    Dispute opened — under review
                  </p>
                  {order.disputeReason && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Reason: {order.disputeReason}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    Our team will review your case and respond within 48 hours.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-muted-foreground">
                      Amount held
                    </span>
                    <span className="font-bold text-foreground">
                      {formatCurrency(Number(order.escrow.amount ?? 0))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-muted-foreground">
                      Status
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                        ESCROW_STATUS_TONE[order.escrow.status] ??
                          "bg-default-100 text-muted-foreground",
                      )}
                    >
                      {ESCROW_STATUS_LABEL[order.escrow.status] ??
                        order.escrow.status}
                    </span>
                  </div>
                  {order.escrow.releaseAt && order.escrow.status === "HELD" && (
                    <p className="text-xs text-muted-foreground">
                      Auto-releases on{" "}
                      {formatDateTime(order.escrow.releaseAt)} unless you open a
                      dispute.
                    </p>
                  )}
                  {order.escrow.releasedAt &&
                    order.escrow.status === "RELEASED" && (
                      <p className="text-xs text-muted-foreground">
                        Released to vendor on{" "}
                        {formatDateTime(order.escrow.releasedAt)}.
                      </p>
                    )}
                </div>
              )}
            </section>
          )}

          {/* Action buttons */}
          <section className="space-y-3">
            {order.delivery &&
              ["ASSIGNED", "ACCEPTED", "PICKED_UP", "IN_TRANSIT", "DELIVERED"].includes(
                order.delivery.status,
              ) && (
                <AppButton
                  variant="secondary"
                  fullWidth
                  size="md"
                  onClick={scrollToTracking}
                >
                  <Truck className="h-4 w-4" />
                  Track delivery
                </AppButton>
              )}

            {canConfirmDelivery && (
              <AppButton
                variant="primary"
                fullWidth
                size="md"
                onClick={handleConfirmDelivery}
                isLoading={confirmDeliveryMutation.isPending}
                loadingLabel="Confirming..."
              >
                Confirm delivery
              </AppButton>
            )}

            {canOpenDispute && (
              <AppButton
                variant="ghost"
                fullWidth
                size="md"
                onClick={() => setDisputeOpen(true)}
                className="text-danger hover:bg-danger/5"
              >
                <ShieldAlert className="h-4 w-4" />
                Open dispute
              </AppButton>
            )}

            <AppButton
              variant="secondary"
              fullWidth
              size="md"
              onClick={handleReorder}
            >
              <RefreshCw className="h-4 w-4" />
              Reorder
            </AppButton>

            <Link href="/orders" className="block">
              <AppButton variant="ghost" fullWidth size="md">
                <Package className="h-4 w-4" />
                View all orders
              </AppButton>
            </Link>
          </section>
        </div>
      </div>

      {/* Dispute modal */}
      <DisputeModal
        isOpen={disputeOpen}
        onClose={() => setDisputeOpen(false)}
        onSubmit={handleDisputeSubmit}
        orderRef={orderRef}
        isLoading={openDisputeMutation.isPending}
      />
    </motion.div>
  );
}
