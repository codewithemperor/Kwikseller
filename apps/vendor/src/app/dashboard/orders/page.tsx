"use client";

import React from "react";
import {
  AlertTriangle,
  CalendarDays,
  CreditCard,
  PackageCheck,
  RefreshCw,
  ShoppingBag,
  Truck,
} from "lucide-react";
import {
  VendorPageHeader,
  VendorSoftPanel,
} from "@/components/dashboard/vendor-dashboard-ui";
import { KwiksellerLoader } from "@/components/kwikseller-loader";
import { VendorEmptyState } from "@/components/vendor-empty-state";
import { formatCurrency, formatDate, unwrapApiData } from "@/lib/vendor-format";
import { vendorCommerceApi } from "@kwikseller/api-client";
import type { Order, OrderStatus } from "@kwikseller/types";
import { AppButton } from "@kwikseller/ui";
import { kwikToast } from "@kwikseller/utils";

const nextStatuses: OrderStatus[] = ["PROCESSING", "FULFILLED", "DELIVERED", "CANCELLED"];
const tabs = [
  { label: "All", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Cancelled", value: "CANCELLED" },
] as const;

type TabValue = typeof tabs[number]["value"];

function isActiveOrder(order: Order) {
  return ["PENDING", "PAID", "CONFIRMED", "PROCESSING", "FULFILLED", "SHIPPED"].includes(order.status);
}

export default function VendorOrdersPage() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [tab, setTab] = React.useState<TabValue>("ALL");
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

  const filteredOrders = React.useMemo(() => {
    return orders.filter((order) => {
      if (tab === "ALL") return true;
      if (tab === "ACTIVE") return isActiveOrder(order);
      return order.status === tab;
    });
  }, [orders, tab]);

  const waitingCount = orders.filter((order) => ["PENDING", "PAID", "CONFIRMED"].includes(order.status)).length;

  return (
    <div className="safe-container space-y-5">
      <VendorPageHeader
        title="Orders"
        description="Checkout activity and fulfillment."
        action={
          <AppButton type="button" variant="secondary" onClick={loadOrders} disabled={isLoading}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </AppButton>
        }
      />

      <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
        {tabs.map((item) => {
          const active = tab === item.value;
          const count = item.value === "ALL"
            ? orders.length
            : item.value === "ACTIVE"
              ? orders.filter(isActiveOrder).length
              : orders.filter((order) => order.status === item.value).length;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setTab(item.value)}
              className={`filter-tab shrink-0 ${
                active
                  ? "filter-tab-active"
                  : ""
              }`}
            >
              {item.label} ({count})
            </button>
          );
        })}
      </div>

      {waitingCount ? (
        <div className="flex items-center gap-3 border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
          <AlertTriangle className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
          <p className="text-sm font-medium">
            {waitingCount} order{waitingCount === 1 ? "" : "s"} waiting for your approval.
          </p>
        </div>
      ) : null}

      <VendorSoftPanel title="Order queue">
        {isLoading ? (
          <KwiksellerLoader />
        ) : filteredOrders.length ? (
          <div className="divide-y divide-gray-200 border-t border-gray-200">
            {filteredOrders.map((order) => (
              <article key={order.id} className="py-4 first:pt-0">
                <div className="rounded-2xl bg-gray-50 p-4 dark:bg-white/5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-gray-100 px-2.5 py-1 font-mono text-xs font-medium text-muted-foreground dark:bg-white/8">
                        {order.checkoutReference ?? order.id}
                      </span>
                      {order.parentCheckout?.checkoutReference ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-muted-foreground dark:bg-white/8">
                          <CreditCard className="h-3 w-3" strokeWidth={1.5} />
                          Parent {order.parentCheckout.checkoutReference}
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-3 font-heading text-base font-semibold text-foreground">{order.status}</h3>
                    <p className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
                        {order.items?.length ?? 0} item{order.items?.length === 1 ? "" : "s"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-4 w-4" strokeWidth={1.5} />
                        {formatDate(order.createdAt)}
                      </span>
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {order.items?.slice(0, 3).map((item) => (
                        <span key={item.id} className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-muted-foreground dark:bg-white/8">
                          {item.product?.name ?? item.productId} x{item.quantity}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl bg-white p-3 dark:bg-black/20">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Total</p>
                      <p className="mt-1 font-heading text-lg font-semibold text-foreground">{formatCurrency(order.totalAmount)}</p>
                    </div>
                    <div className="rounded-xl bg-white p-3 dark:bg-black/20">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Payment</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">{order.paymentStatus}</p>
                    </div>
                    <div className="rounded-xl bg-white p-3 dark:bg-black/20">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Delivery</p>
                      <p className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-foreground">
                        <Truck className="h-3.5 w-3.5" strokeWidth={1.5} />
                        {formatCurrency(order.shippingFee ?? 0)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,260px)_1fr] sm:items-center">
                    <select
                      disabled={updatingId === order.id}
                      defaultValue=""
                      onChange={(event) => {
                        const status = event.target.value as OrderStatus;
                        if (status) updateStatus(order.id, status);
                      }}
                      className="h-11 w-full rounded-md border border-border bg-white px-3 text-sm font-medium text-foreground outline-none dark:bg-white/5"
                    >
                      <option value="">Update status</option>
                      {nextStatuses.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                    <p className="text-xs leading-5 text-muted-foreground">
                      Escrow releases after package receipt is confirmed.
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <VendorEmptyState
            title="No order found"
            text="Start selling products or select Pool items so customers can place orders."
            action={
              <AppButton type="button" onClick={() => window.location.href = "/dashboard/pool"}>
                <PackageCheck className="h-4 w-4" />
                Browse Pool
              </AppButton>
            }
          />
        )}
      </VendorSoftPanel>
    </div>
  );
}
