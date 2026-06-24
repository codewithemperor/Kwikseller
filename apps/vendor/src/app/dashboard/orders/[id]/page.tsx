"use client";

import React from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Copy,
  CreditCard,
  Loader2,
  MapPin,
  MessageSquare,
  PackageCheck,
  Phone,
  Printer,
  Truck,
  User,
  X,
  XCircle,
} from "lucide-react";
import { Skeleton, VendorPageHeader, VendorStatusBadge } from "@kwikseller/ui";
import { AppButton, AppModal, FieldTextarea } from "@kwikseller/ui";
import { kwikToast } from "@kwikseller/utils";
import { formatCurrency, formatDate, unwrapApiData } from "@/lib/vendor-format";
import { vendorCommerceApi } from "@kwikseller/api-client";
import type { Order, OrderStatus } from "@kwikseller/types";
import Link from "next/link";
import { use } from "react";
import { motion } from "framer-motion";

/* ─── Helpers ─── */

const deliveryStages = [
  "CONFIRMED",
  "PROCESSING",
  "FULFILLED",
  "SHIPPED",
  "DELIVERED",
] as const;

const allStages: string[] = ["PENDING", ...deliveryStages, "CANCELLED"];

function getStageIndex(status: string): number {
  const idx = allStages.indexOf(status);
  return idx >= 0 ? idx : 0;
}

const stageLabels: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Preparing",
  FULFILLED: "Ready for Pickup",
  SHIPPED: "In Transit",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

function buildActivityLog(order: Order): Array<{ time: string; label: string }> {
  const log: Array<{ time: string; label: string }> = [];
  if (order.createdAt) {
    log.push({ time: order.createdAt, label: "Order placed" });
  }
  if (order.payment?.paidAt) {
    log.push({ time: order.payment.paidAt, label: "Payment confirmed" });
  }
  if (order.payment?.verifiedAt) {
    log.push({ time: order.payment.verifiedAt, label: "Payment verified" });
  }
  if (order.updatedAt && order.updatedAt !== order.createdAt) {
    log.push({ time: order.updatedAt, label: `Status updated to ${order.status}` });
  }
  if (order.estimatedDeliveryEnd) {
    log.push({ time: order.estimatedDeliveryEnd, label: "Estimated delivery date" });
  }
  if (order.fulfillments?.length) {
    order.fulfillments.forEach((f) => {
      if (f.deliveredAt) {
        log.push({ time: f.deliveredAt, label: "Package delivered" });
      } else if (f.createdAt) {
        log.push({ time: f.createdAt, label: `Fulfillment: ${f.status}` });
      }
    });
  }
  return log.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
}

/* ─── Loading skeleton ─── */

function OrderDetailSkeleton() {
  return (
    <div className="safe-container space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-3" shape="circular" />
        <Skeleton className="h-4 w-24" />
      </nav>
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <Skeleton className="h-5 w-32 mb-3" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" shape="rectangular" />
          <Skeleton className="h-24 w-full" shape="rectangular" />
        </div>
      </div>
    </div>
  );
}

/* ─── Page ─── */

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [order, setOrder] = React.useState<Order | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [orderFound, setOrderFound] = React.useState(true);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  // Reject modal
  const [rejectModalOpen, setRejectModalOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");

  // Cancel modal
  const [isCancelModalOpen, setIsCancelModalOpen] = React.useState(false);

  // Load order
  React.useEffect(() => {
    const loadOrder = async () => {
      setIsLoading(true);
      try {
        const response = await vendorCommerceApi.listOrders();
        const orders = unwrapApiData<any[]>(response.data);
        const found = Array.isArray(orders)
          ? orders.find((o: any) => o.id === id)
          : null;

        if (!found) {
          setOrderFound(false);
          setIsLoading(false);
          return;
        }
        setOrder(found);
      } catch (error) {
        kwikToast.error(
          error instanceof Error ? error.message : "Could not load order"
        );
      } finally {
        setIsLoading(false);
      }
    };
    loadOrder();
  }, [id]);

  const handleCopyId = () => {
    const ref = order?.checkoutReference || order?.id || "";
    navigator.clipboard.writeText(ref).then(() => {
      kwikToast.success("Order ID copied to clipboard");
    });
  };

  const updateStatus = async (newStatus: string) => {
    if (!order) return;
    setUpdatingId(order.id);
    try {
      await vendorCommerceApi.updateOrderStatus(order.id, newStatus);
      kwikToast.success(`Order status updated to ${newStatus}`);
      // Reload
      const response = await vendorCommerceApi.listOrders();
      const orders = unwrapApiData<any[]>(response.data);
      const found = Array.isArray(orders)
        ? orders.find((o: any) => o.id === id)
        : null;
      if (found) setOrder(found);
    } catch (error) {
      kwikToast.error(
        error instanceof Error ? error.message : "Could not update order status"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAccept = () => updateStatus("CONFIRMED");
  const handleReject = () => {
    if (!rejectReason.trim()) {
      kwikToast.error("Please provide a reason for rejection");
      return;
    }
    updateStatus("CANCELLED");
    setRejectModalOpen(false);
    setRejectReason("");
  };
  const handleMarkPreparing = () => updateStatus("PROCESSING");
  const handleMarkReady = () => updateStatus("FULFILLED");
  const handleConfirmHandoff = () => updateStatus("SHIPPED");
  const handleCancel = () => {
    setIsCancelModalOpen(true);
  };
  const confirmCancel = () => {
    setIsCancelModalOpen(false);
    updateStatus("CANCELLED");
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  // Loading state
  if (isLoading) {
    return <OrderDetailSkeleton />;
  }

  // Not found state
  if (!orderFound || !order) {
    return (
      <div className="safe-container py-20 text-center">
        <PackageCheck className="mx-auto h-12 w-12 text-muted-foreground/50" strokeWidth={1.5} />
        <p className="mt-4 text-lg font-semibold text-foreground">
          Order not found
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          The order you are looking for does not exist or has been removed.
        </p>
        <Link
          href="/dashboard/orders"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-accent transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Link>
      </div>
    );
  }

  const activityLog = buildActivityLog(order);
  const currentStageIdx = getStageIndex(order.status);
  const isCancelled = order.status === "CANCELLED" || order.status === "REFUNDED";

  const buyerName =
    order.buyer?.profile
      ? `${order.buyer.profile.firstName || ""} ${order.buyer.profile.lastName || ""}`.trim() ||
        order.buyer.email
      : "Customer";
  const buyerPhone = order.buyer?.phone;
  const buyerEmail = order.buyer?.email;
  const address = order.address;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="safe-container space-y-6 pb-16"
    >
      {/* Page Header */}
      <VendorPageHeader
        title={order.checkoutReference || order.id}
        description={`Order placed ${formatDate(order.createdAt)} by ${buyerName}`}
        breadcrumbs={[
          { label: "Orders", href: "/dashboard/orders" },
          { label: "Order Details" },
        ]}
        actions={
          <button
            type="button"
            onClick={handleCopyId}
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-default-100 transition"
            title="Copy order ID"
          >
            <Copy className="h-4 w-4" />
          </button>
        }
      />

      {/* Status + meta row */}
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <VendorStatusBadge status={order.status} size="md" />
        <span className="inline-flex items-center gap-1">
          <CalendarDays className="h-3.5 w-3.5" />
          {formatDate(order.createdAt)}
        </span>
        <span className="inline-flex items-center gap-1">
          <User className="h-3.5 w-3.5" />
          {buyerName}
        </span>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Left Column */}
        <div className="min-w-0 space-y-0">
          {/* Customer Information */}
          <section className="border-t border-kwik-border pt-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">
              Customer Information
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Name</p>
                <p className="text-sm font-medium text-foreground">{buyerName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Contact</p>
                <div className="flex items-center gap-2">
                  {buyerPhone && (
                    <a
                      href={`tel:${buyerPhone}`}
                      className="inline-flex h-7 items-center gap-1 rounded-md border border-kwik-border px-2 text-xs font-medium text-foreground hover:border-accent hover:text-accent transition"
                    >
                      <Phone className="h-3 w-3" />
                      {buyerPhone}
                    </a>
                  )}
                  {buyerEmail && (
                    <a
                      href={`mailto:${buyerEmail}`}
                      className="inline-flex h-7 items-center gap-1 rounded-md border border-kwik-border px-2 text-xs font-medium text-foreground hover:border-accent hover:text-accent transition"
                    >
                      <MessageSquare className="h-3 w-3" />
                      Email
                    </a>
                  )}
                </div>
              </div>
            </div>

            {address && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-1">Delivery Address</p>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <p className="text-sm text-foreground">
                    {address.line1}
                    {address.line2 ? `, ${address.line2}` : ""}
                    {address.localGovernment ? `, ${address.localGovernment}` : ""}
                    {address.city ? `, ${address.city}` : ""}
                    {address.state ? `, ${address.state}` : ""}
                    {address.country ? `, ${address.country}` : ""}
                  </p>
                </div>
                {address.deliveryInstructions && (
                  <p className="mt-2 text-xs text-muted-foreground italic">
                    Note: {address.deliveryInstructions}
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Order Items */}
          <section className="border-t border-kwik-border pt-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">
              Order Items
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-kwik-border text-left text-xs text-muted-foreground uppercase tracking-wide">
                    <th className="pb-3 pr-4 font-medium">Product</th>
                    <th className="pb-3 pr-4 font-medium hidden sm:table-cell">Variant</th>
                    <th className="pb-3 pr-4 font-medium text-right">Qty</th>
                    <th className="pb-3 pr-4 font-medium text-right hidden sm:table-cell">Unit Price</th>
                    <th className="pb-3 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-kwik-border">
                  {order.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 pr-4">
                        <p className="font-medium text-foreground">
                          {item.product?.name || item.productId}
                        </p>
                        {item.isPoolItem && (
                          <span className="text-xs text-muted-foreground">Pool item</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 hidden sm:table-cell">
                        <span className="text-muted-foreground">
                          {item.variant?.name || "-"}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right text-foreground">
                        {item.quantity}
                      </td>
                      <td className="py-3 pr-4 text-right text-muted-foreground hidden sm:table-cell">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="py-3 text-right font-medium text-foreground">
                        {formatCurrency(item.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-4 border-t border-kwik-border pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>{formatCurrency(order.shippingFee ?? 0)}</span>
              </div>
              {order.discount ? (
                <div className="flex justify-between text-muted-foreground">
                  <span>Discount</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between font-semibold text-foreground pt-2 border-t border-kwik-border">
                <span>Total</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </section>

          {/* Payment Information */}
          <section className="border-t border-kwik-border pt-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">
              Payment Information
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Payment Method</p>
                <div className="flex items-center gap-1.5 text-sm text-foreground">
                  <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                  {order.payment?.gateway || "Online Payment"}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Payment Status</p>
                <VendorStatusBadge status={order.paymentStatus} size="sm" />
              </div>
            </div>
            {order.escrow?.status === "HELD" && (
              <div className="mt-4 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 dark:border-amber-400/20 dark:bg-amber-400/10">
                <ClipboardList className="h-4 w-4 mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Amount of {formatCurrency(order.escrow.amount)} is held in escrow and will be released after delivery confirmation.
                </p>
              </div>
            )}
          </section>

          {/* Activity Log / Timeline */}
          <section className="border-t border-kwik-border pt-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">
              Activity Log
            </h2>
            {activityLog.length > 0 ? (
              <div className="relative pl-6">
                {/* Vertical line */}
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-kwik-border" />
                <div className="space-y-4">
                  {activityLog.map((entry, idx) => (
                    <div key={idx} className="relative flex items-start gap-3">
                      {/* Dot */}
                      <div className="absolute -left-6 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-kwik-border bg-surface" />
                      <div className="min-w-0">
                        <p className="text-sm text-foreground">{entry.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDate(entry.time)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
            )}
          </section>
        </div>

        {/* Right Column */}
        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          {/* Delivery Tracking */}
          <section className="border border-kwik-border rounded-lg p-4">
            <h2 className="text-sm font-semibold text-foreground mb-4">
              Delivery Tracking
            </h2>

            {/* Progress stages */}
            <div className="space-y-3">
              {deliveryStages.map((stage, idx) => {
                const stageIdx = allStages.indexOf(stage);
                const isActive = stageIdx <= currentStageIdx && !isCancelled;
                const isCurrent = stageIdx === currentStageIdx && !isCancelled;
                return (
                  <div key={stage} className="flex items-center gap-3">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition ${
                        isActive
                          ? "border-foreground bg-foreground text-background"
                          : "border-kwik-border bg-surface text-muted-foreground"
                      }`}
                    >
                      {isActive ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <span className="text-xs">{idx + 1}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          isActive ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {stageLabels[stage]}
                      </p>
                    </div>
                  </div>
                );
              })}
              {isCancelled && (
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400">
                    <XCircle className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">Cancelled</p>
                </div>
              )}
            </div>

            {/* Rider info */}
            {order.delivery?.rider && (
              <div className="mt-4 border-t border-kwik-border pt-3 space-y-2">
                <p className="text-xs text-muted-foreground">Assigned Rider</p>
                <p className="text-sm font-medium text-foreground">
                  {order.delivery.rider.vehicleType === "BIKE"
                    ? "Bike"
                    : order.delivery.rider.vehicleType === "CAR"
                    ? "Car"
                    : "Truck"}{" "}
                  - {order.delivery.assignedAt
                    ? formatDate(order.delivery.assignedAt)
                    : ""}
                </p>
              </div>
            )}

            {order.estimatedDeliveryEnd && (
              <div className="mt-3 border-t border-kwik-border pt-3">
                <p className="text-xs text-muted-foreground">Estimated Delivery</p>
                <p className="text-sm font-medium text-foreground">
                  {formatDate(order.estimatedDeliveryEnd)}
                </p>
              </div>
            )}

            <p className="mt-4 text-xs text-muted-foreground">
              Delivery tracking powered by Kwikseller Logistics
            </p>
          </section>

          {/* Order Actions */}
          <section className="border border-kwik-border rounded-lg p-4">
            <h2 className="text-sm font-semibold text-foreground mb-4">
              Order Actions
            </h2>
            <div className="space-y-2">
              {(order.status === "PENDING" || order.status === "PAID") && (
                <>
                  <AppButton
                    type="button"
                    variant="primary"
                    fullWidth
                    onClick={handleAccept}
                    isLoading={updatingId === order.id}
                  >
                    Accept Order
                  </AppButton>
                  <AppButton
                    type="button"
                    variant="secondary"
                    fullWidth
                    onClick={() => setRejectModalOpen(true)}
                    disabled={updatingId === order.id}
                  >
                    Reject Order
                  </AppButton>
                </>
              )}

              {order.status === "CONFIRMED" && (
                <>
                  <AppButton
                    type="button"
                    variant="primary"
                    fullWidth
                    onClick={handleMarkPreparing}
                    isLoading={updatingId === order.id}
                  >
                    Mark as Preparing
                  </AppButton>
                  <AppButton
                    type="button"
                    variant="secondary"
                    fullWidth
                    onClick={handleCancel}
                    disabled={updatingId === order.id}
                  >
                    Cancel Order
                  </AppButton>
                </>
              )}

              {order.status === "PROCESSING" && (
                <AppButton
                  type="button"
                  variant="primary"
                  fullWidth
                  onClick={handleMarkReady}
                  isLoading={updatingId === order.id}
                >
                  Mark as Ready for Pickup
                </AppButton>
              )}

              {order.status === "FULFILLED" && (
                <AppButton
                  type="button"
                  variant="primary"
                  fullWidth
                  onClick={handleConfirmHandoff}
                  isLoading={updatingId === order.id}
                >
                  Confirm Handoff
                </AppButton>
              )}

              {(order.status === "SHIPPED" ||
                order.status === "DELIVERED" ||
                order.status === "CANCELLED" ||
                order.status === "REFUNDED") && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No further actions available
                </p>
              )}
            </div>
          </section>

          {/* Print Invoice */}
          <AppButton
            type="button"
            variant="ghost"
            fullWidth
            onClick={handlePrintInvoice}
          >
            <Printer className="h-4 w-4" />
            Print Invoice
          </AppButton>
        </div>
      </div>

      {/* Reject Order Modal */}
      <AppModal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Order"
        description="Please provide a reason for rejecting this order."
        footer={
          <div className="flex justify-end gap-2">
            <AppButton
              type="button"
              variant="secondary"
              onClick={() => setRejectModalOpen(false)}
            >
              Cancel
            </AppButton>
            <AppButton
              type="button"
              variant="danger"
              onClick={handleReject}
              isLoading={updatingId === order.id}
            >
              Reject Order
            </AppButton>
          </div>
        }
      >
        <FieldTextarea
          label="Rejection reason"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          rows={4}
          placeholder="Explain why you are rejecting this order..."
        />
      </AppModal>

      {/* Cancel Order Modal */}
      <AppModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancel Order?"
        description="This action is irreversible. The order will be marked as cancelled and the customer will be notified."
        className="sm:max-w-md"
      >
        <div className="flex items-center justify-end gap-3">
          <AppButton type="button" variant="secondary" onClick={() => setIsCancelModalOpen(false)}>
            Keep order
          </AppButton>
          <AppButton
            type="button"
            variant="danger"
            onClick={confirmCancel}
            isLoading={updatingId === order.id}
          >
            Yes, cancel order
          </AppButton>
        </div>
      </AppModal>
    </motion.div>
  );
}
