"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CreditCard, MapPin, Package, Store, Truck } from "lucide-react";
import { ordersApi } from "@kwikseller/api-client";
import type { Order } from "@kwikseller/types";
import { OrderStatusBadge, Skeleton } from "@kwikseller/ui";
import { kwikToast, useAuth } from "@kwikseller/utils";

function unwrapOrder(value: unknown): Order | null {
  const payload = value as { data?: unknown } | undefined;
  const nested = payload?.data as { data?: unknown; order?: unknown } | undefined;
  const candidate = nested?.data ?? nested?.order ?? payload?.data ?? value;
  return candidate && typeof candidate === "object" && "id" in candidate ? (candidate as Order) : null;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value?: string | Date | null) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function orderReference(order: Order) {
  return order.checkoutReference || order.id.slice(-8).toUpperCase();
}

function deliveryAddress(order: Order) {
  const delivery = order.delivery as { deliveryAddress?: string; status?: string } | undefined;
  if (delivery?.deliveryAddress) return delivery.deliveryAddress;
  const address = order.address;
  if (address) {
    return [address.line1, address.line2, address.city, address.state, address.country].filter(Boolean).join(", ");
  }
  if (order.deliveryLocalGovernment && order.deliveryState) {
    return `${order.deliveryLocalGovernment}, ${order.deliveryState}, Nigeria`;
  }
  return "No delivery address on this order";
}

function OrderDetailSkeleton() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Skeleton className="h-5 w-36" />
      <Skeleton className="mt-6 h-36 rounded-2xl" />
      <Skeleton className="mt-4 h-64 rounded-2xl" />
    </main>
  );
}

export default function BuyerOrderDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const orderId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  React.useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace(`/login?redirect=/orders/${orderId}`);
    }
  }, [isAuthLoading, isAuthenticated, orderId, router]);

  const { data: order, isLoading, isError } = useQuery<Order | null>({
    queryKey: ["buyer-order", orderId],
    enabled: Boolean(orderId) && !isAuthLoading && isAuthenticated,
    queryFn: async () => {
      try {
        const response = await ordersApi.get(orderId);
        return unwrapOrder(response);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load order.";
        kwikToast.error("Couldn't load this order", message);
        throw error;
      }
    },
    retry: 1,
  });

  if (isAuthLoading || isLoading) return <OrderDetailSkeleton />;

  if (isError || !order) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <Package className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-semibold text-foreground">Order not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">We could not load this order.</p>
        <Link href="/orders" className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-foreground px-5 text-sm font-semibold text-background">
          Back to orders
        </Link>
      </main>
    );
  }

  const delivery = order.delivery as { status?: string; currentLocation?: string; deliveredAt?: string | Date } | undefined;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/orders" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to orders
      </Link>

      <section className="mt-6 rounded-2xl border border-kwik-border bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Order</p>
            <h1 className="mt-1 text-2xl font-bold text-foreground">{orderReference(order)}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Placed {formatDate(order.createdAt)}</p>
          </div>
          <OrderStatusBadge status={order.status} size="md" />
        </div>
      </section>

      <section className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-kwik-border bg-surface p-4">
          <CreditCard className="h-5 w-5 text-accent" />
          <p className="mt-3 text-xs font-semibold uppercase text-muted-foreground">Payment</p>
          <p className="mt-1 font-semibold text-foreground">{order.paymentStatus}</p>
          <p className="mt-1 text-sm text-muted-foreground">{formatCurrency(Number(order.totalAmount ?? 0))}</p>
        </div>
        <div className="rounded-2xl border border-kwik-border bg-surface p-4">
          <Truck className="h-5 w-5 text-accent" />
          <p className="mt-3 text-xs font-semibold uppercase text-muted-foreground">Delivery</p>
          <p className="mt-1 font-semibold text-foreground">{delivery?.status ?? "Pending"}</p>
          <p className="mt-1 text-sm text-muted-foreground">{delivery?.currentLocation ?? "Manual dispatch after payment confirmation"}</p>
        </div>
        <div className="rounded-2xl border border-kwik-border bg-surface p-4">
          <Store className="h-5 w-5 text-accent" />
          <p className="mt-3 text-xs font-semibold uppercase text-muted-foreground">Vendor</p>
          <p className="mt-1 font-semibold text-foreground">{order.store?.name ?? "Vendor store"}</p>
          <p className="mt-1 text-sm text-muted-foreground">{order.items?.length ?? 0} item{order.items?.length === 1 ? "" : "s"}</p>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-kwik-border bg-surface">
        <div className="border-b border-kwik-border p-4">
          <h2 className="font-semibold text-foreground">Items</h2>
        </div>
        <div className="divide-y divide-kwik-border">
          {(order.items ?? []).map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-4 p-4">
              <div>
                <p className="font-semibold text-foreground">{item.product?.name ?? `Item ${item.id.slice(-4)}`}</p>
                <p className="mt-1 text-sm text-muted-foreground">Qty {item.quantity}</p>
              </div>
              <p className="shrink-0 font-semibold text-foreground">{formatCurrency(Number(item.totalPrice ?? item.unitPrice ?? 0))}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-kwik-border bg-surface p-4">
        <div className="flex gap-3">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <div>
            <h2 className="font-semibold text-foreground">Delivery address</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{deliveryAddress(order)}</p>
            {delivery?.deliveredAt ? (
              <p className="mt-2 text-xs text-muted-foreground">Delivered {formatDate(delivery.deliveredAt)}</p>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
