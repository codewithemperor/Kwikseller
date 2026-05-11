"use client";

import React from "react";
import { CreditCard, PackageCheck, RefreshCw, Truck } from "lucide-react";
import { vendorCommerceApi } from "@kwikseller/api-client";
import type { Order, OrderStatus } from "@kwikseller/types";
import { kwikToast } from "@kwikseller/utils";
import { formatCurrency, formatDate, unwrapApiData } from "@/lib/vendor-format";
import { VendorEmptyState } from "@/components/vendor-empty-state";

const nextStatuses: OrderStatus[] = ["PROCESSING", "FULFILLED", "DELIVERED", "CANCELLED"];

export default function VendorOrdersPage() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [updatingId, setUpdatingId] = React.useState("");

  const loadOrders = React.useCallback(() => {
    setIsLoading(true);
    vendorCommerceApi
      .listOrders()
      .then((response) => setOrders(unwrapApiData<Order[]>(response.data)))
      .catch(() => kwikToast.error("Could not load vendor orders"))
      .finally(() => setIsLoading(false));
  }, []);

  React.useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      await vendorCommerceApi.updateOrderStatus(orderId, status);
      kwikToast.success("Order status updated");
      loadOrders();
    } catch (error) {
      kwikToast.error(error instanceof Error ? error.message : "Could not update order");
    } finally {
      setUpdatingId("");
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Orders</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Handle paid orders, digital readiness, fulfillment status, and manual delivery progression.
          </p>
        </div>
        <button onClick={loadOrders} className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </section>

      <section className="border border-border bg-background">
        <div className="flex items-center gap-2 border-b border-border p-4">
          <PackageCheck className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-base font-semibold">Order queue</h2>
        </div>
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading orders...</div>
        ) : orders.length ? (
          <div className="divide-y divide-border">
            {orders.map((order) => (
              <article key={order.id} className="grid gap-4 p-4 xl:grid-cols-[1fr_180px_220px] xl:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-xs font-semibold text-muted-foreground">{order.checkoutReference ?? order.id}</p>
                    {order.parentCheckout?.checkoutReference ? (
                      <span className="inline-flex items-center gap-1 bg-surface px-2 py-1 text-xs font-semibold text-muted-foreground">
                        <CreditCard className="h-3 w-3" />
                        Parent {order.parentCheckout.checkoutReference}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-1 font-semibold text-foreground">{order.status}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {order.items?.length ?? 0} item{order.items?.length === 1 ? "" : "s"} • {formatDate(order.createdAt)}
                  </p>
                  {order.shippingFee > 0 ? (
                    <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                      <Truck className="h-3.5 w-3.5 text-primary" />
                      Manual dispatch: {order.deliveryLocalGovernment || "LGA pending"}, {order.deliveryState || "state pending"}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs font-semibold text-primary">Digital-only fulfillment can skip delivery.</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {order.items?.slice(0, 3).map((item) => (
                      <span key={item.id} className="bg-surface px-2 py-1 text-xs font-semibold text-muted-foreground">
                        {item.product?.name ?? item.productId} x{item.quantity}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Total</p>
                  <p className="mt-1 font-heading text-lg font-semibold text-foreground">{formatCurrency(order.totalAmount)}</p>
                  <p className="text-xs text-muted-foreground">{order.paymentStatus}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Delivery {formatCurrency(order.shippingFee ?? 0)}</p>
                  <p className="text-xs text-muted-foreground">Discount {formatCurrency(order.discount ?? 0)}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <select
                    disabled={updatingId === order.id}
                    defaultValue=""
                    onChange={(event) => {
                      const status = event.target.value as OrderStatus;
                      if (status) updateStatus(order.id, status);
                    }}
                    className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                  >
                    <option value="">Update status</option>
                    {nextStatuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Admin handles final dispatch assignment while Rider stays paused.
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <VendorEmptyState title="No orders yet" text="Orders will appear here after buyers complete checkout." />
        )}
      </section>
    </div>
  );
}
