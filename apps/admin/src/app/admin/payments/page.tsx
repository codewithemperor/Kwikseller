"use client";

import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@heroui/react";
import { CreditCard, RefreshCw, RotateCcw, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { commerceOpsApi, type AdminCommercePayment } from "@/lib/api";
import { formatCurrency } from "@kwikseller/utils";

function unwrap<T>(value: unknown): T {
  if (value && typeof value === "object" && "data" in value) {
    return (value as { data: T }).data;
  }
  return value as T;
}

export default function AdminPaymentsPage() {
  const queryClient = useQueryClient();
  const [refundTarget, setRefundTarget] = React.useState<{ paymentId: string; orderId?: string } | null>(null);
  const [refundReason, setRefundReason] = React.useState("");

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["admin-commerce-payments"],
    queryFn: async () => {
      const response = await commerceOpsApi.payments();
      return unwrap<AdminCommercePayment[]>(response.data);
    },
  });

  const payments = data ?? [];
  const failedPayments = payments.filter((payment) => payment.status === "FAILED").length;
  const parentPayments = payments.filter((payment) => payment.parentCheckout).length;

  const refundMutation = useMutation({
    mutationFn: () => {
      if (!refundTarget) throw new Error("Select a payment to refund");
      return commerceOpsApi.refundPayment(
        refundTarget.paymentId,
        refundReason || "Admin refund from payments operations",
        undefined,
        refundTarget.orderId,
      );
    },
    onSuccess: () => {
      toast.success("Refund recorded");
      setRefundTarget(null);
      setRefundReason("");
      queryClient.invalidateQueries({ queryKey: ["admin-commerce-payments"] });
    },
    onError: (error: Error) => toast.danger(error.message || "Refund failed"),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Operations"
        description="Review parent split-checkout payments, child vendor orders, and refund actions."
        breadcrumbs={[{ label: "Payments" }]}
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
          { label: "Payments", value: payments.length, icon: CreditCard },
          { label: "Split checkouts", value: parentPayments, icon: RotateCcw },
          { label: "Failed payments", value: failedPayments, icon: ShieldAlert },
        ].map((item) => (
          <div key={item.label} className="border border-border bg-background p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.label}</p>
              <item.icon className="h-5 w-5 text-accent" />
            </div>
            <p className="mt-3 font-heading text-2xl font-semibold text-foreground">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="border border-border bg-background">
        <div className="flex items-center gap-2 border-b border-border p-4">
          <CreditCard className="h-5 w-5 text-accent" />
          <h2 className="font-heading text-base font-semibold text-foreground">Parent payments</h2>
        </div>

        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading payments...</div>
        ) : payments.length ? (
          <div className="divide-y divide-border">
            {payments.map((payment) => {
              const childOrders = payment.parentCheckout?.orders ?? (payment.order ? [payment.order] : []);
              return (
                <article key={payment.id} className="grid gap-5 p-4 xl:grid-cols-[260px_minmax(0,1fr)_220px]">
                  <div>
                    <p className="font-mono text-xs font-semibold text-muted-foreground">{payment.reference}</p>
                    <h3 className="mt-2 font-heading text-lg font-semibold text-foreground">
                      {formatCurrency(payment.amount)}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {payment.gateway} • {payment.status}
                    </p>
                    {payment.parentCheckout ? (
                      <p className="mt-2 bg-surface px-2 py-1 text-xs font-semibold text-muted-foreground">
                        Parent {payment.parentCheckout.checkoutReference}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-3">
                    {childOrders.map((order) => (
                      <div key={order.id} className="grid gap-3 border border-border p-3 md:grid-cols-[minmax(0,1fr)_140px_auto] md:items-center">
                        <div>
                          <p className="font-semibold text-foreground">{order.store?.name ?? "Vendor store"}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {order.checkoutReference ?? order.id} • {order.status} • {order.items?.length ?? 0} items
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-foreground">{formatCurrency(order.totalAmount)}</p>
                        <button
                          type="button"
                          disabled={payment.status !== "PAID"}
                          onClick={() => setRefundTarget({ paymentId: payment.id, orderId: order.id })}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border px-3 text-xs font-semibold text-foreground hover:bg-surface disabled:opacity-50"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Refund order
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      disabled={payment.status !== "PAID"}
                      onClick={() => setRefundTarget({ paymentId: payment.id })}
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-danger px-3 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Full refund
                    </button>
                    <p className="text-xs leading-5 text-muted-foreground">
                      Full refunds mark the parent payment and all child vendor orders as refunded.
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-muted-foreground">No payment records yet.</div>
        )}
      </section>

      {refundTarget ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              refundMutation.mutate();
            }}
            className="w-full max-w-md border border-border bg-background p-5 shadow-xl"
          >
            <h3 className="font-heading text-lg font-semibold text-foreground">
              {refundTarget.orderId ? "Refund vendor order" : "Refund full payment"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              This records the refund decision in Kwikseller and updates order/payment state for operations.
            </p>
            <label className="mt-4 block text-sm font-semibold text-foreground">
              Reason
              <textarea
                value={refundReason}
                onChange={(event) => setRefundReason(event.target.value)}
                className="mt-2 min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                placeholder="Customer requested refund, duplicate payment, failed fulfillment..."
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRefundTarget(null)}
                className="h-10 rounded-lg border border-border px-4 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={refundMutation.isPending}
                className="h-10 rounded-lg bg-danger px-4 text-sm font-semibold text-white disabled:opacity-60"
              >
                {refundMutation.isPending ? "Recording..." : "Record refund"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
