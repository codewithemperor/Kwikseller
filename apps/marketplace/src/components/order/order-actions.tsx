"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Ban,
  CreditCard,
  LogIn,
  PackageCheck,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Truck,
} from "lucide-react";
import {
  OrderStatus,
  DisputeType,
  KwisCrow,
} from "@/constants/order-workflow";
import type { DisputeTypeValue, OrderWorkflowState } from "@/types/order-workflow";

interface OrderActionsProps {
  order: OrderWorkflowState;
  /** Whether the pay action is in-flight. */
  isPaying?: boolean;
  onPay: () => void;
  onCancel: () => void;
  onConfirmReceipt: () => void;
  onRequestReturn: () => void;
  onReportIssue: () => void;
  onViewEscrow: () => void;
  onTrackDelivery?: () => void;
  className?: string;
}

interface ActionButton {
  key: string;
  label: string;
  variant: "primary" | "secondary" | "ghost" | "danger";
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

const VARIANT_CLASS: Record<ActionButton["variant"], string> = {
  // Primary = orange CTA (use secondary token; "primary" here just means main CTA)
  primary:
    "bg-secondary-500 text-white hover:bg-secondary-600 shadow-sm",
  secondary:
    "border border-gray-200 bg-surface text-foreground hover:border-gray-300",
  ghost:
    "text-primary-700 hover:bg-primary-50",
  danger:
    "border border-danger/30 bg-danger/5 text-danger hover:bg-danger/10",
};

function ActionButtonRow({ buttons }: { buttons: ActionButton[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-wrap gap-2"
    >
      {buttons.map((btn) => (
        <button
          key={btn.key}
          type="button"
          onClick={btn.onClick}
          disabled={btn.disabled || btn.isLoading}
          className={
            "inline-flex h-10 items-center justify-center gap-1.5 rounded-md px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60 " +
            VARIANT_CLASS[btn.variant]
          }
          aria-label={btn.label}
        >
          {btn.isLoading ? (
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-current/40 border-t-current"
              aria-hidden="true"
            />
          ) : (
            btn.icon
          )}
          {btn.label}
        </button>
      ))}
    </motion.div>
  );
}

/**
 * OrderActions — context-aware action bar. Shows the right buttons per order
 * status:
 *
 *  - PENDING_QUOTE:    [Cancel order] (ghost)
 *  - QUOTED / TO_PAY:  [Pay now] (primary) [Cancel order] (ghost)
 *  - PAID → OUT_FOR_DELIVERY: [Track delivery] (ghost) [View escrow] (ghost)
 *  - DELIVERED:        [Confirm receipt] (primary) [Request return] (secondary)
 *                      [Report issue] (danger-ghost) [View escrow] (ghost)
 *  - RECEIVED / COMPLETED: [View escrow] (ghost) [Track delivery] (ghost)
 *  - DISPUTED:         [View escrow] (ghost)  (dispute already open)
 *  - CANCELLED / RETURNED: empty (terminal)
 */
export function OrderActions({
  order,
  isPaying = false,
  onPay,
  onCancel,
  onConfirmReceipt,
  onRequestReturn,
  onReportIssue,
  onViewEscrow,
  onTrackDelivery,
  className,
}: OrderActionsProps) {
  const buttons: ActionButton[] = [];

  // Helper buttons reused across statuses.
  const viewEscrowBtn: ActionButton = {
    key: "view-escrow",
    label: "View escrow",
    variant: "ghost",
    icon: <ShieldCheck className="h-4 w-4" />,
    onClick: onViewEscrow,
  };
  const trackBtn: ActionButton | null = onTrackDelivery
    ? {
        key: "track",
        label: "Track delivery",
        variant: "ghost",
        icon: <Truck className="h-4 w-4" />,
        onClick: onTrackDelivery,
      }
    : null;

  switch (order.status) {
    case OrderStatus.PENDING_QUOTE:
      buttons.push({
        key: "cancel",
        label: "Cancel order",
        variant: "ghost",
        icon: <Ban className="h-4 w-4" />,
        onClick: onCancel,
      });
      break;

    case OrderStatus.QUOTED:
    case OrderStatus.TO_PAY:
      buttons.push({
        key: "pay",
        label: "Pay now",
        variant: "primary",
        icon: <CreditCard className="h-4 w-4" />,
        onClick: onPay,
        isLoading: isPaying,
      });
      buttons.push({
        key: "cancel",
        label: "Cancel order",
        variant: "ghost",
        icon: <Ban className="h-4 w-4" />,
        onClick: onCancel,
      });
      break;

    case OrderStatus.PAID:
    case OrderStatus.PROCESSING:
    case OrderStatus.SHIPPED:
    case OrderStatus.OUT_FOR_DELIVERY:
      if (trackBtn) buttons.push(trackBtn);
      buttons.push(viewEscrowBtn);
      break;

    case OrderStatus.DELIVERED:
      buttons.push({
        key: "confirm",
        label: "Confirm receipt",
        variant: "primary",
        icon: <PackageCheck className="h-4 w-4" />,
        onClick: onConfirmReceipt,
      });
      buttons.push({
        key: "return",
        label: "Request return",
        variant: "secondary",
        icon: <RotateCcw className="h-4 w-4" />,
        onClick: onRequestReturn,
      });
      buttons.push({
        key: "issue",
        label: "Report issue",
        variant: "danger",
        icon: <ShieldAlert className="h-4 w-4" />,
        onClick: onReportIssue,
      });
      buttons.push(viewEscrowBtn);
      break;

    case OrderStatus.RECEIVED:
    case OrderStatus.COMPLETED:
      buttons.push({
        key: "return",
        label: "Request return",
        variant: "secondary",
        icon: <RotateCcw className="h-4 w-4" />,
        onClick: onRequestReturn,
      });
      buttons.push(viewEscrowBtn);
      break;

    case OrderStatus.DISPUTED:
      buttons.push({
        key: "view-dispute",
        label: "View dispute",
        variant: "secondary",
        icon: <ShieldAlert className="h-4 w-4" />,
        onClick: onViewEscrow,
      });
      break;

    case OrderStatus.CANCELLED:
    case OrderStatus.RETURNED:
      // Terminal states — no actions.
      break;
  }

  if (buttons.length === 0) return null;

  return (
    <section
      aria-label="Order actions"
      className={
        "rounded-2xl border border-gray-200 bg-surface p-4 sm:p-5 " +
        (className ?? "")
      }
    >
      <div className="mb-3 flex items-center gap-2">
        <LogIn className="h-4 w-4 text-primary-600" />
        <h2 className="font-heading text-sm font-bold uppercase tracking-[0.16em] text-foreground">
          Actions
        </h2>
        {order.escrow && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-700">
            <ShieldCheck className="h-3 w-3" />
            {KwisCrow.NAME}
          </span>
        )}
      </div>
      <ActionButtonRow buttons={buttons} />
    </section>
  );
}

export default OrderActions;

// ─── Helper: which dispute type was requested? ────────────────────────────

export function disputeTypeFromKey(key: string): DisputeTypeValue {
  return key === "return" ? DisputeType.RETURN_REQUEST : DisputeType.ISSUE_REPORT;
}
