"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@heroui/react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Mail,
  MapPin,
  Package,
  Phone,
  Shield,
  Store,
  Truck,
  User,
} from "lucide-react";
import {
  AppButton,
  AppModal,
  EmptyState,
  FieldInput,
  FieldSelect,
  OrderStatusBadge,
  OrderSummary,
  OrderTimeline,
  PriceDisplay,
  Skeleton,
  SkeletonCard,
  VendorStatusBadge,
  type OrderTimelineStep,
} from "@/lib/ui";
import {
  adminApi,
  commerceOpsApi,
  adminEscrowApi,
  adminDeliveriesApi,
  type AdminCommerceOrder,
} from "@/lib/api";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

/* ─── Helpers ─── */

function unwrap<T>(value: unknown): T {
  if (value && typeof value === "object" && "data" in value) {
    return (value as { data: T }).data;
  }
  return value as T;
}

function orderRef(order: AdminCommerceOrder): string {
  return order.checkoutReference ?? order.id.slice(-8);
}

function buyerName(order: AdminCommerceOrder): string {
  const p = order.buyer?.profile;
  if (p?.firstName || p?.lastName) {
    return [p.firstName, p.lastName].filter(Boolean).join(" ");
  }
  return order.buyer?.email ?? "Unknown buyer";
}

function buildTimelineSteps(order: AdminCommerceOrder): OrderTimelineStep[] {
  const status = order.status;
  const createdAt = order.createdAt;
  const steps: OrderTimelineStep[] = [
    {
      label: "Order Placed",
      status: "completed",
      timestamp: createdAt,
    },
    {
      label: "Confirmed",
      status: ["PAID", "CONFIRMED", "PROCESSING", "FULFILLED", "SHIPPED", "DELIVERED"].includes(status)
        ? "completed"
        : status === "PENDING_PAYMENT" || status === "PENDING"
          ? "current"
          : "upcoming",
    },
    {
      label: "Processing",
      status: ["PROCESSING", "FULFILLED", "SHIPPED", "DELIVERED"].includes(status)
        ? "completed"
        : status === "CONFIRMED"
          ? "current"
          : "upcoming",
    },
    {
      label: "Ready for Pickup",
      status: ["FULFILLED", "SHIPPED", "DELIVERED"].includes(status)
        ? "completed"
        : status === "PROCESSING"
          ? "current"
          : "upcoming",
    },
    {
      label: "Shipped",
      status: ["SHIPPED", "DELIVERED"].includes(status)
        ? "completed"
        : status === "FULFILLED"
          ? "current"
          : "upcoming",
    },
    {
      label: "Delivered",
      status: status === "DELIVERED" ? "completed" : status === "SHIPPED" ? "current" : "upcoming",
    },
  ];
  return steps;
}

/* ─── Page ─── */

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ["admin-order-detail", orderId],
    queryFn: async () => {
      // No dedicated admin single-order endpoint — fetch the list and find it.
      // The list returns full order objects with items, payment, delivery, escrow.
      const res = await commerceOpsApi.orders({ limit: 100 });
      const orders = unwrap<AdminCommerceOrder[]>(res.data ?? res);
      return orders.find((o) => o.id === orderId);
    },
    enabled: !!orderId,
  });

  // Rider search
  const [riderQuery, setRiderQuery] = React.useState("");
  const { data: riders } = useQuery({
    queryKey: ["admin-riders", riderQuery],
    queryFn: async () => {
      const res = await adminApi.getUsers({ role: "RIDER", search: riderQuery, limit: 20 });
      return unwrap<any[]>(res.data ?? res);
    },
    enabled: !!order && !order.delivery,
  });

  // Assign rider state
  const [selectedRiderId, setSelectedRiderId] = React.useState("");
  const [estimatedMinutes, setEstimatedMinutes] = React.useState("");

  const assignRiderMutation = useMutation({
    mutationFn: () =>
      adminDeliveriesApi.assignRider(orderId, {
        riderId: selectedRiderId,
        estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : undefined,
      }),
    onSuccess: () => {
      toast.success("Rider assigned successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-order-detail", orderId] });
      setSelectedRiderId("");
      setEstimatedMinutes("");
    },
    onError: (e: any) => toast.danger(e?.message ?? "Failed to assign rider"),
  });

  // Escrow actions
  const releaseMutation = useMutation({
    mutationFn: (deliveryId: string) => adminEscrowApi.releaseEscrow(deliveryId),
    onSuccess: () => {
      toast.success("Escrow released to vendor");
      queryClient.invalidateQueries({ queryKey: ["admin-order-detail", orderId] });
    },
    onError: (e: any) => toast.danger(e?.message ?? "Failed to release escrow"),
  });

  const refundMutation = useMutation({
    mutationFn: (deliveryId: string) => adminEscrowApi.refundEscrow(deliveryId),
    onSuccess: () => {
      toast.success("Escrow refunded to customer");
      queryClient.invalidateQueries({ queryKey: ["admin-order-detail", orderId] });
    },
    onError: (e: any) => toast.danger(e?.message ?? "Failed to refund escrow"),
  });

  // Dispute resolution modal
  const [disputeModalOpen, setDisputeModalOpen] = React.useState(false);
  const [disputeResolution, setDisputeResolution] = React.useState<
    "release_to_vendor" | "refund_to_customer" | "partial"
  >("release_to_vendor");
  const [disputeVendorAmount, setDisputeVendorAmount] = React.useState("");

  const resolveDisputeMutation = useMutation({
    mutationFn: (deliveryId: string) =>
      adminEscrowApi.resolveDispute(
        deliveryId,
        disputeResolution,
        disputeResolution === "partial" && disputeVendorAmount
          ? Number(disputeVendorAmount)
          : undefined,
      ),
    onSuccess: () => {
      toast.success("Dispute resolved");
      setDisputeModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-order-detail", orderId] });
    },
    onError: (e: any) => toast.danger(e?.message ?? "Failed to resolve dispute"),
  });

  // Manual status override
  const [manualStatus, setManualStatus] = React.useState("");
  const statusMutation = useMutation({
    mutationFn: () =>
      commerceOpsApi.updateManualStatus(orderId, manualStatus, "Admin manual override"),
    onSuccess: () => {
      toast.success("Order status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-order-detail", orderId] });
      setManualStatus("");
    },
    onError: (e: any) => toast.danger(e?.message ?? "Failed to update status"),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6">
        <EmptyState
          variant="error"
          title="Order not found"
          description="This order may have been deleted or the ID is invalid."
          action={{ label: "Back to orders", onClick: () => router.push("/admin/orders") }}
        />
      </div>
    );
  }

  const escrow = (order as any).escrow;
  const delivery = (order as any).delivery;
  const payment = order.payment;
  const items = order.items ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-4 md:p-6"
    >
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <AppButton variant="ghost" size="sm" onClick={() => router.push("/admin/orders")}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </AppButton>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Order #{orderRef(order)}
          </h1>
          <p className="text-sm text-muted-foreground">
            Placed {formatRelativeTime(order.createdAt)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} size="md" />
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Timeline */}
          <div className="rounded-2xl border border-kwik-border bg-surface p-5">
            <h2 className="mb-4 font-heading text-base font-bold text-foreground">
              Order Timeline
            </h2>
            <OrderTimeline steps={buildTimelineSteps(order)} />
          </div>

          {/* Order items */}
          <div className="rounded-2xl border border-kwik-border bg-surface p-5">
            <h2 className="mb-4 flex items-center gap-2 font-heading text-base font-bold text-foreground">
              <Package className="h-4 w-4 text-accent" />
              Items ({items.length})
            </h2>
            <div className="space-y-3">
              {items.map((item: any) => (
                <div key={item.id} className="flex items-center gap-3 border-b border-kwik-border pb-3 last:border-0 last:pb-0">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-default-100">
                    {item.product?.images?.[0]?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.product.images[0].url} alt={item.product.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {item.product?.name ?? "Item"}
                    </p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <PriceDisplay price={Number(item.unitPrice ?? 0) * item.quantity} size="sm" showDiscount={false} />
                </div>
              ))}
            </div>
          </div>

          {/* Delivery info */}
          {delivery && (
            <div className="rounded-2xl border border-kwik-border bg-surface p-5">
              <h2 className="mb-4 flex items-center gap-2 font-heading text-base font-bold text-foreground">
                <Truck className="h-4 w-4 text-accent" />
                Delivery
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <VendorStatusBadge status={delivery.status} size="sm" />
                </div>
                {delivery.deliveryAddress && (
                  <p className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    {delivery.deliveryAddress}
                  </p>
                )}
                {delivery.rider && (
                  <div className="flex items-center gap-3 rounded-lg bg-default-100 p-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">
                      {delivery.rider.name ?? "Rider assigned"}
                    </span>
                    {delivery.rider.phone && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {delivery.rider.phone}
                      </span>
                    )}
                  </div>
                )}
                {delivery.estimatedMinutes && (
                  <p className="text-xs text-muted-foreground">
                    ETA: {delivery.estimatedMinutes} minutes
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Order summary */}
          <OrderSummary
            items={items.map((i: any) => ({
              name: i.product?.name ?? "Item",
              quantity: i.quantity,
              unitPrice: Number(i.unitPrice ?? 0),
              image: i.product?.images?.[0]?.url,
            }))}
            subtotal={Number(order.subtotal ?? order.totalAmount ?? 0)}
            deliveryFee={Number(order.shippingFee ?? 0)}
            discount={Number(order.discount ?? 0)}
            total={Number(order.totalAmount ?? 0)}
          />

          {/* Payment info */}
          {payment && (
            <div className="rounded-2xl border border-kwik-border bg-surface p-5">
              <h3 className="mb-3 font-heading text-sm font-bold text-foreground">Payment</h3>
              <dl className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Gateway</dt>
                  <dd className="font-medium text-foreground">{payment.gateway ?? "Paystack"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Reference</dt>
                  <dd className="font-mono text-foreground">{payment.reference?.slice(-10) ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd><VendorStatusBadge status={payment.status} size="sm" /></dd>
                </div>
                {payment.paidAt && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Paid</dt>
                    <dd className="text-foreground">{formatRelativeTime(payment.paidAt)}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Escrow card + actions */}
          {escrow && (
            <div className="rounded-2xl border border-kwik-border bg-surface p-5">
              <h3 className="mb-3 flex items-center gap-2 font-heading text-sm font-bold text-foreground">
                <Shield className="h-4 w-4 text-accent" />
                Escrow
              </h3>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-2xl font-bold text-foreground">
                  {formatCurrency(Number(escrow.amount ?? 0))}
                </span>
                <VendorStatusBadge status={escrow.status} size="sm" />
              </div>
              {order.disputeStatus === "OPENED" && (
                <p className="mb-3 rounded-lg bg-danger/5 px-3 py-2 text-xs text-danger">
                  Dispute opened: {order.disputeReason ?? "No reason provided"}
                </p>
              )}
              {/* Escrow actions */}
              <div className="space-y-2">
                {delivery && ["HELD", "PENDING_RELEASE"].includes(escrow.status) && (
                  <AppButton
                    variant="primary"
                    size="sm"
                    fullWidth
                    isLoading={releaseMutation.isPending}
                    onClick={() => releaseMutation.mutate(delivery.id)}
                  >
                    Release to Vendor
                  </AppButton>
                )}
                {delivery && !["REFUNDED", "RELEASED"].includes(escrow.status) && (
                  <AppButton
                    variant="danger"
                    size="sm"
                    fullWidth
                    isLoading={refundMutation.isPending}
                    onClick={() => refundMutation.mutate(delivery.id)}
                  >
                    Refund to Customer
                  </AppButton>
                )}
                {escrow.status === "DISPUTED" && delivery && (
                  <AppButton
                    variant="secondary"
                    size="sm"
                    fullWidth
                    onClick={() => setDisputeModalOpen(true)}
                  >
                    Resolve Dispute
                  </AppButton>
                )}
              </div>
            </div>
          )}

          {/* Rider assignment */}
          {!delivery && (
            <div className="rounded-2xl border border-kwik-border bg-surface p-5">
              <h3 className="mb-3 flex items-center gap-2 font-heading text-sm font-bold text-foreground">
                <Truck className="h-4 w-4 text-accent" />
                Assign Rider
              </h3>
              <div className="space-y-3">
                <FieldInput
                  placeholder="Search riders by name..."
                  value={riderQuery}
                  onChange={(e) => setRiderQuery(e.target.value)}
                />
                <FieldSelect
                  label="Select rider"
                  value={selectedRiderId}
                  onChange={(e) => setSelectedRiderId(e.target.value)}
                >
                  <option value="">Choose a rider...</option>
                  {(riders ?? []).map((r: any) => (
                    <option key={r.id} value={r.id}>
                      {r.profile?.firstName ?? r.email ?? r.id.slice(-6)}
                    </option>
                  ))}
                </FieldSelect>
                <FieldInput
                  type="number"
                  label="Estimated minutes"
                  placeholder="e.g. 30"
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(e.target.value)}
                />
                <AppButton
                  variant="primary"
                  size="sm"
                  fullWidth
                  isLoading={assignRiderMutation.isPending}
                  disabled={!selectedRiderId}
                  onClick={() => assignRiderMutation.mutate()}
                >
                  Assign Rider
                </AppButton>
              </div>
            </div>
          )}

          {/* Manual status override */}
          <div className="rounded-2xl border border-kwik-border bg-surface p-5">
            <h3 className="mb-3 font-heading text-sm font-bold text-foreground">
              Manual Status Override
            </h3>
            <div className="space-y-2">
              <FieldSelect
                label="New status"
                value={manualStatus}
                onChange={(e) => setManualStatus(e.target.value)}
              >
                <option value="">Select status...</option>
                {["PENDING_PAYMENT", "PAID", "CONFIRMED", "PROCESSING", "FULFILLED", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </FieldSelect>
              <AppButton
                variant="secondary"
                size="sm"
                fullWidth
                isLoading={statusMutation.isPending}
                disabled={!manualStatus}
                onClick={() => statusMutation.mutate()}
              >
                Update Status
              </AppButton>
            </div>
          </div>
        </div>
      </div>

      {/* Dispute resolution modal */}
      <AppModal
        isOpen={disputeModalOpen}
        onClose={() => setDisputeModalOpen(false)}
        title="Resolve Dispute"
        description="Choose how to resolve this escrow dispute."
        footer={
          <div className="flex w-full justify-end gap-2">
            <AppButton variant="secondary" size="sm" onClick={() => setDisputeModalOpen(false)}>
              Cancel
            </AppButton>
            <AppButton
              variant="primary"
              size="sm"
              isLoading={resolveDisputeMutation.isPending}
              onClick={() => delivery && resolveDisputeMutation.mutate(delivery.id)}
            >
              Confirm Resolution
            </AppButton>
          </div>
        }
      >
        <div className="space-y-3">
          <FieldSelect
            label="Resolution"
            value={disputeResolution}
            onChange={(e) => setDisputeResolution(e.target.value as any)}
          >
            <option value="release_to_vendor">Release full amount to vendor</option>
            <option value="refund_to_customer">Refund full amount to customer</option>
            <option value="partial">Partial (split the amount)</option>
          </FieldSelect>
          {disputeResolution === "partial" && (
            <FieldInput
              type="number"
              label="Vendor amount (₦)"
              placeholder="Amount to release to vendor"
              value={disputeVendorAmount}
              onChange={(e) => setDisputeVendorAmount(e.target.value)}
            />
          )}
        </div>
      </AppModal>
    </motion.div>
  );
}
