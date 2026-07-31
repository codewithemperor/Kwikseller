"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hourglass, ShieldAlert, Timer, CheckCircle2 } from "lucide-react";
import { KwisCrow } from "@/constants/order-workflow";
import { formatDisputeCountdown, isWithinDisputeWindow } from "@/lib/escrow";
import type { OrderWorkflowState } from "@/types/order-workflow";

interface DisputeTimerProps {
  order: OrderWorkflowState;
  className?: string;
}

/**
 * DisputeTimer — shows the 24-hour dispute countdown after delivery.
 *
 * - "Auto-releases to vendor in HH:MM:SS" while the window is open and no
 *   dispute is active.
 * - "Dispute window open" with explanation when the order is DELIVERED.
 * - "Dispute open — escrow frozen" when the buyer has opened a dispute.
 * - "Window expired — escrow released" once auto-release has fired.
 *
 * Re-renders every second so the countdown is live.
 */
export function DisputeTimer({ order, className }: DisputeTimerProps) {
  // Re-render every second for the countdown.
  const [, tick] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => {
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Only render when the order is in a state that has (or had) a dispute window.
  // We treat RECEIVED/COMPLETED as "released" (no live countdown).
  const { escrow, dispute } = order;

  // If there's an open dispute, render the "frozen" state regardless.
  if (dispute && dispute.status === "OPEN") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        role="status"
        aria-live="polite"
        className={
          "flex items-start gap-3 rounded-2xl border border-danger/30 bg-danger/5 p-4 " +
          (className ?? "")
        }
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger">
          <ShieldAlert className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-danger">Dispute open — escrow frozen</p>
          <p className="mt-0.5 text-xs leading-5 text-gray-600">
            You opened a dispute on{" "}
            {new Date(dispute.createdAt).toLocaleString("en-NG", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
            . The {KwisCrow.NAME} team is reviewing your case. Funds will not be
            released until the dispute is resolved.
          </p>
        </div>
      </motion.div>
    );
  }

  // No escrow record → nothing to render.
  if (!escrow || !escrow.autoReleaseAt) return null;

  const deadline = escrow.autoReleaseAt;
  const windowOpen = isWithinDisputeWindow(deadline);

  // Already released/refunded — show the settled state.
  if (escrow.status === "RELEASED") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        role="status"
        aria-live="polite"
        className={
          "flex items-start gap-3 rounded-2xl border border-success/30 bg-success/5 p-4 " +
          (className ?? "")
        }
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-success">
            Escrow released to vendor
          </p>
          <p className="mt-0.5 text-xs leading-5 text-gray-600">
            {escrow.lastActionReason ??
              "The dispute window closed and funds were released to the vendor."}
          </p>
        </div>
      </motion.div>
    );
  }

  if (escrow.status === "REFUNDED") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        role="status"
        aria-live="polite"
        className={
          "flex items-start gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 " +
          (className ?? "")
        }
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
          <CheckCircle2 className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground">
            Escrow refunded to you
          </p>
          <p className="mt-0.5 text-xs leading-5 text-gray-600">
            {escrow.lastActionReason ??
              "The dispute was resolved in your favor and funds were refunded."}
          </p>
        </div>
      </motion.div>
    );
  }

  // HELD — window either open or expired.
  if (!windowOpen) {
    // Window expired but still HELD — the auto-release sweep hasn't fired yet.
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        role="status"
        aria-live="polite"
        className={
          "flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/5 p-4 " +
          (className ?? "")
        }
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning/10 text-warning">
          <Hourglass className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-warning">
            Dispute window expired
          </p>
          <p className="mt-0.5 text-xs leading-5 text-gray-600">
            The {KwisCrow.DISPUTE_WINDOW_HOURS}-hour dispute window has closed.
            KwisCrow is releasing the funds to the vendor.
          </p>
        </div>
      </motion.div>
    );
  }

  // HELD + window open — live countdown.
  const countdown = formatDisputeCountdown(deadline);
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={
        "flex items-start gap-3 rounded-2xl border border-primary-200 bg-primary-50 p-4 " +
        (className ?? "")
      }
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
        <Timer className="h-4.5 w-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-primary-900">
          Dispute window open
        </p>
        <p className="mt-0.5 text-xs leading-5 text-primary-800">
          Auto-releases to vendor in{" "}
          <span className="font-mono font-bold tabular-nums text-primary-900">
            {countdown}
          </span>
          . Confirm receipt — or open a dispute to freeze the escrow.
        </p>
      </div>
    </motion.div>
  );
}

export default DisputeTimer;
