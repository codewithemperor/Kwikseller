"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, PackageCheck, Store } from "lucide-react";
import { checkoutApi } from "@kwikseller/api-client";
import type { Order, ParentCheckout } from "@kwikseller/types";

function unwrapApiData<T>(value: unknown): T {
  if (value && typeof value === "object" && "data" in value) {
    return (value as { data: T }).data;
  }
  return value as T;
}

export default function CheckoutVerifyPage() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") ?? searchParams.get("trxref");
  const [status, setStatus] = React.useState<"loading" | "success" | "failed">("loading");
  const [message, setMessage] = React.useState("Verifying payment with Paystack.");
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [parentCheckout, setParentCheckout] = React.useState<ParentCheckout | null>(null);

  React.useEffect(() => {
    let mounted = true;

    const verify = async () => {
      if (!reference) {
        setStatus("failed");
        setMessage("Payment reference is missing.");
        return;
      }

      try {
        const response = await checkoutApi.verifyPayment(reference);
        const verification = unwrapApiData<{
          status?: string;
          orders?: Order[];
          order?: Order;
          parentCheckout?: ParentCheckout;
        }>(response);
        const paymentStatus = verification?.status;
        if (!mounted) return;
        setOrders(verification.orders ?? (verification.order ? [verification.order] : []));
        setParentCheckout(verification.parentCheckout ?? null);

        if (paymentStatus === "PAID") {
          setStatus("success");
          setMessage(
            verification.orders && verification.orders.length > 1
              ? "Payment confirmed. Kwikseller created separate vendor orders under one parent checkout."
              : "Payment confirmed. Your order is now being prepared.",
          );
        } else {
          setStatus("failed");
          setMessage("Payment was not completed. Any reserved inventory has been released if Paystack marked the transaction failed.");
        }
      } catch (error) {
        if (!mounted) return;
        setStatus("failed");
        setMessage(error instanceof Error ? error.message : "Payment verification failed.");
      }
    };

    verify();
    return () => {
      mounted = false;
    };
  }, [reference]);

  const isSuccess = status === "success";

  return (
    <main className="min-h-screen bg-kwik-bg-page px-4 py-16">
      <section className="mx-auto max-w-xl rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-neutral-100">
          {status === "loading" && <Loader2 className="h-8 w-8 animate-spin text-kwik-orange" />}
          {status === "success" && <CheckCircle2 className="h-8 w-8 text-emerald-700" />}
          {status === "failed" && <AlertCircle className="h-8 w-8 text-red-600" />}
        </div>

        <h1 className="mt-6 text-2xl font-semibold text-kwik-dark">
          {status === "loading" ? "Checking payment" : isSuccess ? "Order confirmed" : "Payment not completed"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-kwik-muted">{message}</p>

        {reference && (
          <div className="mt-6 rounded-md bg-neutral-50 px-4 py-3 text-left">
            <p className="text-xs font-semibold uppercase text-kwik-muted">Reference</p>
            <p className="mt-1 break-all text-sm font-semibold text-kwik-dark">{reference}</p>
          </div>
        )}

        {isSuccess && orders.length > 0 && (
          <div className="mt-6 rounded-md border border-neutral-200 bg-white text-left">
            <div className="border-b border-neutral-200 px-4 py-3">
              <p className="text-xs font-semibold uppercase text-kwik-muted">
                {parentCheckout ? "Parent checkout" : "Order summary"}
              </p>
              {parentCheckout && (
                <p className="mt-1 break-all text-sm font-semibold text-kwik-dark">
                  {parentCheckout.checkoutReference}
                </p>
              )}
            </div>
            <div className="divide-y divide-neutral-200">
              {orders.map((order) => (
                <div key={order.id} className="flex items-start justify-between gap-4 px-4 py-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-semibold text-kwik-dark">
                      <Store className="h-4 w-4 text-kwik-orange" />
                      <span className="truncate">{order.store?.name ?? "Vendor store"}</span>
                    </p>
                    <p className="mt-1 text-xs text-kwik-muted">
                      {order.items?.length ?? 0} item{order.items?.length === 1 ? "" : "s"} • {order.status}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-bold text-kwik-dark">
                    {new Intl.NumberFormat("en-NG", {
                      style: "currency",
                      currency: "NGN",
                      maximumFractionDigits: 0,
                    }).format(order.totalAmount)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-kwik-dark px-5 text-sm font-semibold text-white"
          >
            <PackageCheck className="h-4 w-4" />
            Continue shopping
          </Link>
          <Link
            href="/orders"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-neutral-300 px-5 text-sm font-semibold text-kwik-dark"
          >
            View orders
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
