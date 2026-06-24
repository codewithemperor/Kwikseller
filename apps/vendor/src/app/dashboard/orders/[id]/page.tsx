"use client";

import React, { use } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  MessageCircle,
  Package,
  Printer,
  Truck,
  User,
  XCircle,
} from "lucide-react";
import { vendorCommerceApi } from "@kwikseller/api-client";
import type { Order, OrderStatus } from "@kwikseller/types";
import { Skeleton } from "@kwikseller/ui";
import { kwikToast } from "@kwikseller/utils";
import { formatCurrency, formatDate, unwrapApiData } from "@/lib/vendor-format";
import { cn } from "@/lib/utils";

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

function nextPrimaryAction(status: OrderStatus): { label: string; status: OrderStatus } | null {
  if (status === "PENDING" || status === "PAID") return { label: "Accept order", status: "CONFIRMED" };
  if (status === "CONFIRMED") return { label: "Mark preparing", status: "PROCESSING" };
  if (status === "PROCESSING") return { label: "Mark ready to ship", status: "FULFILLED" };
  if (status === "FULFILLED") return { label: "Mark shipped", status: "SHIPPED" };
  if (status === "SHIPPED") return { label: "Mark delivered", status: "DELIVERED" };
  return null;
}

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

export default function VendorOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const queryClient = useQueryClient();

  const orderQuery = useQuery({
    queryKey: ["vendor-order", id],
    queryFn: async () => {
      const response = await vendorCommerceApi.getOrder(id);
      return unwrapApiData<Order>(response.data);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: OrderStatus) => {
      await vendorCommerceApi.updateOrderStatus(id, status);
    },
    onSuccess: () => {
      kwikToast.success("Order status updated");
      queryClient.invalidateQueries({ queryKey: ["vendor-order", id] });
      queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
    },
    onError: () => {
      kwikToast.error("Could not update order status");
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

  const paymentStatus = getPaymentStatus(order);
  const primaryAction = nextPrimaryAction(order.status);
  const subtotal = order.subtotal ?? order.items?.reduce((sum, item) => sum + Number(item.totalPrice ?? 0), 0) ?? 0;
  const shippingFee = order.shippingFee ?? 0;
  const total = order.totalAmount ?? subtotal + shippingFee;
  const canCancel = !["CANCELLED", "REFUNDED", "DELIVERED"].includes(order.status);

  return (
    <div className="space-y-6 pb-16">
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

      <section className="mx-auto max-w-6xl rounded-xl border border-border bg-background p-5 md:p-8">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto_1fr] lg:items-start">
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground">
              Order ID #{getOrderRef(order)}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
            <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className={cn("h-2.5 w-2.5 rounded-full", badgeClass(order.status).includes("success") ? "bg-success" : "bg-warning")} />
              {formatStatus(order.status)}
            </div>
          </div>

          {["CONFIRMED", "PROCESSING", "FULFILLED", "SHIPPED", "DELIVERED"].includes(order.status) ? (
            <div className="rounded-lg border border-success/40 bg-success/15 px-8 py-4 text-center font-heading text-xl font-bold text-success">
              Order accepted successfully!
            </div>
          ) : null}

          <div className="flex justify-start lg:justify-end">
            <button
              type="button"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-kwik-blue px-4 text-sm font-semibold text-kwik-blue"
            >
              Chat with client
              <MessageCircle className="h-4 w-4" strokeWidth={1.8} />
            </button>
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
                {order.estimatedDeliveryEnd
                  ? `Deliver before ${formatDate(order.estimatedDeliveryEnd)}`
                  : "Delivery date pending"}
              </p>
              <p>Items : {order.items?.length ?? 0}</p>
            </InfoBlock>

            <InfoBlock icon={<Truck className="h-6 w-6" />} title="Delivery">
              <p>City: {order.address?.city ?? order.deliveryState ?? "Not set"}</p>
              <p>Area: {order.address?.localGovernment ?? order.deliveryLocalGovernment ?? "Not set"}</p>
              <p>Address : {addressLine(order)}</p>
              <p>Time : {order.estimatedDeliveryStart ? formatDate(order.estimatedDeliveryStart) : "Pending"}</p>
            </InfoBlock>
          </div>
        </div>

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

        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-sm space-y-3 text-sm">
            <div className="flex justify-between text-foreground">
              <span>Amount</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping fee</span>
              <span>{formatCurrency(shippingFee)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-3 font-semibold text-foreground">
              <span>total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:justify-end">
        {canCancel ? (
          <button
            type="button"
            disabled={updateStatusMutation.isPending}
            onClick={() => updateStatusMutation.mutate("CANCELLED")}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg px-6 text-sm font-semibold text-danger transition hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <XCircle className="h-4 w-4" />
            Cancel order
          </button>
        ) : null}
        {primaryAction ? (
          <button
            type="button"
            disabled={updateStatusMutation.isPending}
            onClick={() => updateStatusMutation.mutate(primaryAction.status)}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-success px-8 text-sm font-semibold text-success-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CheckCircle2 className="h-4 w-4" />
            {primaryAction.label}
          </button>
        ) : null}
      </section>
    </div>
  );
}
