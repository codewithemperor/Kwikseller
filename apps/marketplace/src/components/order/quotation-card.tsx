"use client";

import React from "react";
import { motion } from "framer-motion";
import { Clock, MessageSquareText, Tag, Truck } from "lucide-react";
import { OrderStatus } from "@/constants/order-workflow";
import type { OrderWorkflowState } from "@/types/order-workflow";
import { computeCostBreakdown } from "@/stores/order-workflow-store";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateRange(min: string, max: string): string {
  const fmt = new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" });
  return `${fmt.format(new Date(min))} – ${fmt.format(new Date(max))}`;
}

interface QuotationCardProps {
  order: OrderWorkflowState;
  /** Called when the buyer clicks "Pay now". */
  onPay: () => void;
  /** Called when the buyer wants to decline / cancel. */
  onCancel?: () => void;
  /** Whether the pay action is in-flight (disables the button + shows spinner). */
  isPaying?: boolean;
  className?: string;
}

/**
 * QuotationCard — displays the vendor's quotation (delivery fee, discount,
 * delivery date range, optional note) with a cost breakdown and a "Pay now"
 * CTA. Shown when the order is in QUOTED or TO_PAY state.
 *
 * The cost breakdown is: items subtotal + delivery fee − discount = total.
 */
export function QuotationCard({
  order,
  onPay,
  onCancel,
  isPaying = false,
  className,
}: QuotationCardProps) {
  if (!order.quotation) return null;
  const breakdown = computeCostBreakdown(order.items, order.quotation);
  const quotation = order.quotation;
  const isToPay = order.status === OrderStatus.TO_PAY;
  const isQuoted = order.status === OrderStatus.QUOTED;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      aria-label="Vendor quotation"
      className={
        "overflow-hidden rounded-2xl border border-gray-200 bg-surface shadow-sm " +
        (className ?? "")
      }
    >
      {/* Header strip with brand gradient */}
      <div className="kwik-gradient px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/80">
              Vendor quotation
            </p>
            <h2 className="mt-1 font-heading text-lg font-bold text-white sm:text-xl">
              {order.vendor.name}
            </h2>
            <p className="mt-0.5 text-xs text-white/80">
              Submitted {new Date(quotation.createdAt).toLocaleString("en-NG", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
            <Clock className="h-3.5 w-3.5" />
            ETA {formatDateRange(quotation.deliveryDateMin, quotation.deliveryDateMax)}
          </div>
        </div>
      </div>

      {/* Body: line items summary */}
      <div className="px-5 py-5 sm:px-6">
        <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500">
          Items
        </h3>
        <ul className="mt-3 divide-y divide-gray-100">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {item.name}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Qty {item.quantity} × {formatCurrency(item.unitPrice)}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-foreground">
                {formatCurrency(item.unitPrice * item.quantity)}
              </p>
            </li>
          ))}
        </ul>

        {/* Cost breakdown */}
        <dl className="mt-4 space-y-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-gray-600">Items subtotal</dt>
            <dd className="font-medium text-foreground tabular-nums">
              {formatCurrency(breakdown.subtotal)}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="flex items-center gap-1.5 text-gray-600">
              <Truck className="h-3.5 w-3.5 text-primary-600" />
              Delivery fee
            </dt>
            <dd className="font-medium text-foreground tabular-nums">
              + {formatCurrency(breakdown.deliveryFee)}
            </dd>
          </div>
          {breakdown.discount > 0 && (
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-1.5 text-gray-600">
                <Tag className="h-3.5 w-3.5 text-secondary-600" />
                Vendor discount
              </dt>
              <dd className="font-medium text-success tabular-nums">
                − {formatCurrency(breakdown.discount)}
              </dd>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-gray-200 pt-2">
            <dt className="text-sm font-bold text-foreground">Total to pay</dt>
            <dd className="text-base font-bold text-foreground tabular-nums">
              {formatCurrency(breakdown.total)}
            </dd>
          </div>
        </dl>

        {/* Vendor note */}
        {quotation.note && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-primary-100 bg-primary-50 px-3 py-2.5">
            <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
            <p className="text-xs leading-5 text-primary-900">
              <span className="font-semibold">Vendor note: </span>
              {quotation.note}
            </p>
          </div>
        )}

        {/* CTA row */}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse sm:items-center sm:justify-start">
          <button
            type="button"
            onClick={onPay}
            disabled={isPaying}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-secondary-500 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-secondary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            aria-label={`Pay ${formatCurrency(breakdown.total)} now`}
          >
            {isPaying ? (
              <>
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  aria-hidden="true"
                />
                Processing…
              </>
            ) : (
              <>
                Pay {formatCurrency(breakdown.total)} now
              </>
            )}
          </button>
          {(isQuoted || isToPay) && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isPaying}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-gray-200 bg-surface px-5 text-sm font-semibold text-gray-600 transition hover:border-gray-300 hover:text-foreground disabled:opacity-60"
            >
              Decline &amp; cancel
            </button>
          )}
        </div>
        <p className="mt-3 text-center text-[11px] text-gray-500 sm:text-left">
          🔒 Payment is held safely by KwisCrow escrow — the vendor is paid only
          after you confirm receipt.
        </p>
      </div>
    </motion.section>
  );
}

export default QuotationCard;
