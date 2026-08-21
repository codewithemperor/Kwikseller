"use client";

import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@heroui/react";
import { AlertTriangle, MapPin, PackageCheck, ReceiptText, RefreshCw, Truck } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { commerceOpsApi, type AdminCommerceOrder } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

function unwrap<T>(value: unknown): T {
  if (value && typeof value === "object" && "data" in value) {
    return (value as { data: T }).data;
  }
  return value as T;
}

function shortId(value?: string) {
  return value ? value.slice(0, 12) : "unknown";
}

const operationalStatuses = ["PAID", "PROCESSING", "FULFILLED", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = React.useState("");

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["admin-commerce-orders", status],
    queryFn: async () => {
      const response = await commerceOpsApi.orders({ status: status || undefined });
      return unwrap<AdminCommerceOrder[]>(response.data);
    },
  });

  const orders = data ?? [];

  const statusMutation = useMutation({
    mutationFn: ({ orderId, nextStatus }: { orderId: string; nextStatus: string }) =>
      commerceOpsApi.updateManualStatus(orderId, nextStatus, "Updated from admin order operations"),
    onSuccess: () => {
      toast.success("Order status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-commerce-orders"] });
    },
    onError: (error: Error) => toast.danger(error.message || "Could not update order"),
  });

  const riskFlags = React.useMemo(
    () => ({
      unpaid: orders.filter((order) => order.paymentStatus !== "PAID").length,
      delayed: orders.filter((order) => order.status === "PAID").length,
      missingLga: orders.filter((order) => Number(order.shippingFee ?? 0) > 0 && !order.deliveryLocalGovernment).length,
    }),
    [orders],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Order Operations"
        description="Monitor split checkout child orders, delivery details, vendor ownership, and manual dispatch."
        breadcrumbs={[{ label: "Orders" }]}
        actions={
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-foreground hover:bg-surface"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Unpaid / failed payment", value: riskFlags.unpaid, icon: AlertTriangle },
          { label: "Awaiting dispatch", value: riskFlags.delayed, icon: Truck },
          { label: "Missing LGA", value: riskFlags.missingLga, icon: MapPin },
        ].map((flag) => (
          <div key={flag.label} className="border border-border bg-background p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{flag.label}</p>
              <flag.icon className="h-5 w-5 text-accent" />
            </div>
            <p className="mt-3 font-heading text-2xl font-semibold text-foreground">{flag.value}</p>
          </div>
        ))}
      </section>

      <section className="border border-border bg-background">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <ReceiptText className="h-5 w-5 text-accent" />
            <h2 className="font-heading text-base font-semibold text-foreground">Vendor child orders</h2>
          </div>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
          >
            <option value="">All statuses</option>
            {operationalStatuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading orders...</div>
        ) : orders.length ? (
          <div className="divide-y divide-border">
            {orders.map((order) => (
              <article key={order.id} className="grid gap-5 p-4 xl:grid-cols-[minmax(0,1fr)_220px_230px]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-muted-foreground">
                      {order.checkoutReference ?? shortId(order.id)}
                    </span>
                    {order.parentCheckout?.checkoutReference ? (
                      <span className="bg-surface px-2 py-1 text-xs font-semibold text-muted-foreground">
                        Parent {order.parentCheckout.checkoutReference}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-2 font-heading text-lg font-semibold text-foreground">
                    {order.store?.name ?? "Vendor store"}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {order.items?.length ?? 0} item{order.items?.length === 1 ? "" : "s"} • {order.status} • {order.paymentStatus}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {order.items?.slice(0, 4).map((item) => (
                      <span key={item.id} className="bg-surface px-2 py-1 text-xs font-semibold text-muted-foreground">
                        {item.product?.name ?? item.productId} x{item.quantity}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-foreground">{formatCurrency(order.totalAmount)}</p>
                  <p className="text-muted-foreground">Subtotal {formatCurrency(order.subtotal)}</p>
                  <p className="text-muted-foreground">Delivery {formatCurrency(order.shippingFee ?? 0)}</p>
                  <p className="text-muted-foreground">Discount {formatCurrency(order.discount ?? 0)}</p>
                </div>

                <div className="space-y-3">
                  <div className="border border-border p-3 text-xs leading-5 text-muted-foreground">
                    <p className="font-semibold text-foreground">Dispatch address</p>
                    <p>{order.address?.line1 ?? "No address stored"}</p>
                    <p>
                      {[order.deliveryLocalGovernment, order.address?.city, order.deliveryState].filter(Boolean).join(", ") ||
                        "No location snapshot"}
                    </p>
                    {order.address?.deliveryInstructions ? <p>Note: {order.address.deliveryInstructions}</p> : null}
                  </div>
                  <select
                    defaultValue=""
                    disabled={statusMutation.isPending}
                    onChange={(event) => {
                      if (event.target.value) {
                        statusMutation.mutate({ orderId: order.id, nextStatus: event.target.value });
                      }
                    }}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  >
                    <option value="">Manual status</option>
                    {operationalStatuses.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-muted-foreground">
            <PackageCheck className="mx-auto mb-3 h-8 w-8 text-accent" />
            No orders match this filter.
          </div>
        )}
      </section>
    </div>
  );
}

