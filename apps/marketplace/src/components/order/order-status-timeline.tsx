"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check, Clock, Package } from "lucide-react";
import {
  ORDER_STATUS_META,
  PRE_PAYMENT_STEPS,
  FULFILMENT_STEPS,
  OrderStatus,
} from "@/constants/order-workflow";
import type { OrderStatusValue, OrderWorkflowState } from "@/types/order-workflow";

function formatDate(value?: string | Date | null): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDateRange(min: string, max: string): string {
  const minD = new Date(min);
  const maxD = new Date(max);
  const fmtShort = new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" });
  return `${fmtShort.format(minD)} – ${fmtShort.format(maxD)}`;
}

interface TimelineNode {
  status: OrderStatusValue;
  label: string;
  hint: string;
  reached: boolean;
  reachedAt?: string;
  isCurrent: boolean;
  isLast: boolean;
}

/**
 * Compute the set of statuses the order has "reached" given its current
 * status, taking care of the special cases (DISPUTED, CANCELLED, RETURNED).
 */
function computeReachedStatuses(order: OrderWorkflowState): Set<OrderStatusValue> {
  const reached = new Set<OrderStatusValue>();
  const preIdx = PRE_PAYMENT_STEPS.indexOf(order.status);
  PRE_PAYMENT_STEPS.forEach((s, idx) => {
    if (preIdx >= 0 && idx <= preIdx) reached.add(s);
  });
  const fulfilIdx = FULFILMENT_STEPS.indexOf(order.status);
  if (fulfilIdx >= 0) {
    PRE_PAYMENT_STEPS.forEach((s) => reached.add(s));
    FULFILMENT_STEPS.forEach((s, idx) => {
      if (idx <= fulfilIdx) reached.add(s);
    });
  }

  // DISPUTED — order was DELIVERED when the dispute was opened.
  if (order.status === OrderStatus.DISPUTED) {
    reached.add(OrderStatus.DELIVERED);
    reached.delete(OrderStatus.RECEIVED);
    reached.delete(OrderStatus.COMPLETED);
  }
  // CANCELLED — pre-payment only; no fulfilment steps reached.
  if (order.status === OrderStatus.CANCELLED) {
    [
      OrderStatus.PAID,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.DELIVERED,
      OrderStatus.RECEIVED,
      OrderStatus.COMPLETED,
    ].forEach((s) => reached.delete(s));
  }
  // RETURNED — dispute resolved in buyer favor; RECEIVED never reached.
  if (order.status === OrderStatus.RETURNED) {
    reached.delete(OrderStatus.RECEIVED);
    reached.delete(OrderStatus.COMPLETED);
  }
  return reached;
}

/**
 * OrderStatusTimeline — vertical timeline showing the order's journey through
 * all workflow statuses (pre-payment + fulfilment). Completed steps use the
 * brand primary dot; pending steps use gray. The "current" step is highlighted.
 */
export function OrderStatusTimeline({
  order,
  className,
}: {
  order: OrderWorkflowState;
  className?: string;
}) {
  const reachedStatuses = computeReachedStatuses(order);

  const nodes: TimelineNode[] = [...PRE_PAYMENT_STEPS, ...FULFILMENT_STEPS].map(
    (status, idx, arr) => {
      const meta = ORDER_STATUS_META[status];
      const reached = reachedStatuses.has(status);
      // Best-effort timestamp lookup from the timeline by label match.
      const reachedAt = order.timeline.find(
        (e) => e.title.toLowerCase() === meta.label.toLowerCase(),
      )?.at;
      return {
        status,
        label: meta.label,
        hint: meta.hint,
        reached,
        reachedAt,
        isCurrent: order.status === status,
        isLast: idx === arr.length - 1,
      };
    },
  );

  return (
    <section
      aria-label="Order status timeline"
      className={
        "rounded-2xl border border-gray-200 bg-surface p-5 sm:p-6 " +
        (className ?? "")
      }
    >
      <header className="mb-5 flex items-center gap-2">
        <Package className="h-4 w-4 text-primary-600" />
        <h2 className="font-heading text-sm font-bold uppercase tracking-[0.16em] text-foreground">
          Order timeline
        </h2>
      </header>
      <motion.ol
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
        }}
        className="relative"
      >
        {nodes.map((node) => (
          <motion.li
            key={node.status}
            variants={{
              hidden: { opacity: 0, y: 6 },
              visible: { opacity: 1, y: 0 },
            }}
            className="relative flex gap-4"
          >
            {/* Vertical line — hidden for the last node. */}
            {!node.isLast && (
              <span
                aria-hidden="true"
                className={
                  "absolute left-[14px] top-7 bottom-[-16px] w-0.5 " +
                  (node.reached ? "bg-primary-500" : "bg-gray-200")
                }
              />
            )}
            {/* Dot */}
            <span
              className={
                "relative z-10 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition " +
                (node.reached
                  ? "border-transparent bg-primary-500 text-white"
                  : "border-gray-200 bg-surface text-gray-400")
              }
              aria-hidden="true"
            >
              {node.reached ? (
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              ) : (
                <Clock className="h-3 w-3" strokeWidth={2.5} />
              )}
            </span>
            {/* Content */}
            <div className="min-w-0 flex-1 pb-5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p
                  className={
                    "text-sm font-semibold " +
                    (node.reached ? "text-foreground" : "text-gray-400")
                  }
                >
                  {node.label}
                  {node.isCurrent && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-700">
                      Current
                    </span>
                  )}
                </p>
                {node.reachedAt && (
                  <span className="text-xs tabular-nums text-gray-500">
                    {formatDate(node.reachedAt)}
                  </span>
                )}
              </div>
              {node.hint && (
                <p
                  className={
                    "mt-1 text-xs leading-5 " +
                    (node.reached ? "text-gray-500" : "text-gray-400")
                  }
                >
                  {node.hint}
                </p>
              )}
            </div>
          </motion.li>
        ))}
      </motion.ol>
      {order.quotation && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-primary-50 px-3 py-2 text-xs text-primary-800">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span>
            Estimated delivery:{" "}
            <span className="font-semibold">
              {formatDateRange(
                order.quotation.deliveryDateMin,
                order.quotation.deliveryDateMax,
              )}
            </span>
          </span>
        </div>
      )}
    </section>
  );
}

export default OrderStatusTimeline;
