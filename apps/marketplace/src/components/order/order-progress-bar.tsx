"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types/order-workflow";

/**
 * OrderProgressBar — a compact horizontal progress indicator showing the
 * order's position in the 1688-style workflow (Quote → Pay → Ship → Receive).
 *
 * Sits above the detailed timeline; gives an at-a-glance "where am I" view.
 */

interface ProgressStep {
  key: string;
  label: string;
  statuses: OrderStatus[];
}

// Four macro-phases, each mapping to the statuses that satisfy it.
const PROGRESS_STEPS: ProgressStep[] = [
  {
    key: "quote",
    label: "Quotation",
    statuses: [
      "QUOTED" as OrderStatus,
      "TO_PAY" as OrderStatus,
      "PAID" as OrderStatus,
      "PROCESSING" as OrderStatus,
      "SHIPPED" as OrderStatus,
      "OUT_FOR_DELIVERY" as OrderStatus,
      "DELIVERED" as OrderStatus,
      "RECEIVED" as OrderStatus,
      "COMPLETED" as OrderStatus,
    ],
  },
  {
    key: "pay",
    label: "Payment",
    statuses: [
      "PAID" as OrderStatus,
      "PROCESSING" as OrderStatus,
      "SHIPPED" as OrderStatus,
      "OUT_FOR_DELIVERY" as OrderStatus,
      "DELIVERED" as OrderStatus,
      "RECEIVED" as OrderStatus,
      "COMPLETED" as OrderStatus,
    ],
  },
  {
    key: "ship",
    label: "Shipping",
    statuses: [
      "SHIPPED" as OrderStatus,
      "OUT_FOR_DELIVERY" as OrderStatus,
      "DELIVERED" as OrderStatus,
      "RECEIVED" as OrderStatus,
      "COMPLETED" as OrderStatus,
    ],
  },
  {
    key: "receive",
    label: "Received",
    statuses: ["RECEIVED" as OrderStatus, "COMPLETED" as OrderStatus],
  },
];

function isDisputedOrCancelled(status: OrderStatus): boolean {
  return status === "DISPUTED" || status === "CANCELLED" || status === "RETURNED";
}

function isStepReached(currentStatus: OrderStatus, step: ProgressStep): boolean {
  return step.statuses.includes(currentStatus);
}

export function OrderProgressBar({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  // Special-case the pre-quote state (PENDING_QUOTE) — nothing reached yet.
  const isPreQuote = status === ("PENDING_QUOTE" as OrderStatus);
  const isAbnormal = isDisputedOrCancelled(status);

  // Compute the fill percentage of the connecting track.
  const reachedCount = isPreQuote
    ? 0
    : PROGRESS_STEPS.filter((s) => isStepReached(status, s)).length;
  const progressPercent = isAbnormal
    ? 100
    : (reachedCount / PROGRESS_STEPS.length) * 100;

  // Track color: normal = primary (blue), abnormal = danger/warning.
  const trackColor = isAbnormal
    ? status === "DISPUTED"
      ? "bg-warning"
      : "bg-danger"
    : "bg-primary-500";

  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-surface p-4 sm:p-5",
        className,
      )}
      aria-label="Order progress"
    >
      {/* Step dots + labels */}
      <div className="relative">
        {/* Background track */}
        <div className="absolute left-0 right-0 top-4 h-1 rounded-full bg-gray-200" />
        {/* Filled track */}
        <motion.div
          className={cn("absolute left-0 top-4 h-1 rounded-full", trackColor)}
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        {/* Step markers */}
        <div className="relative flex justify-between">
          {PROGRESS_STEPS.map((step, idx) => {
            const reached = !isPreQuote && isStepReached(status, step);
            const isCurrent =
              reached &&
              (idx === PROGRESS_STEPS.length - 1 ||
                !isStepReached(status, PROGRESS_STEPS[idx + 1]));
            return (
              <div
                key={step.key}
                className="flex flex-col items-center gap-2"
                style={{ width: "25%" }}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors",
                    reached
                      ? isAbnormal
                        ? "border-warning bg-warning text-white"
                        : "border-primary-500 bg-primary-500 text-white"
                      : "border-gray-300 bg-background text-gray-400",
                    isCurrent && "ring-4 ring-primary-500/20",
                  )}
                >
                  {reached ? (
                    <Check className="h-4 w-4" strokeWidth={3} />
                  ) : (
                    <span className="text-xs font-bold">{idx + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-[11px] font-semibold sm:text-xs",
                    reached ? "text-foreground" : "text-gray-400",
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Abnormal status note */}
      {isAbnormal ? (
        <p className="mt-3 text-center text-xs font-medium text-warning">
          {status === "DISPUTED"
            ? "This order is in dispute — escrow is frozen pending review."
            : status === "CANCELLED"
              ? "This order was cancelled."
              : "This order was refunded."}
        </p>
      ) : null}
    </section>
  );
}
