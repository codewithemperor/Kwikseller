"use client";

import React from "react";
import { cn } from "../lib/utils";

export type VendorStatusBadgeSize = "sm" | "md";

export interface VendorStatusBadgeProps {
  status: string;
  size?: VendorStatusBadgeSize;
  className?: string;
}

type StatusStyle = {
  wrapper: string;
  dot: string;
};

const STATUS_PALETTE: Record<string, StatusStyle> = {
  pending: { wrapper: "bg-amber-500/10 text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  awaiting: { wrapper: "bg-amber-500/10 text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  active: { wrapper: "bg-blue-500/10 text-blue-600 dark:text-blue-400", dot: "bg-blue-500" },
  processing: { wrapper: "bg-blue-500/10 text-blue-600 dark:text-blue-400", dot: "bg-blue-500" },
  paid: { wrapper: "bg-blue-500/10 text-blue-600 dark:text-blue-400", dot: "bg-blue-500" },
  confirmed: { wrapper: "bg-blue-500/10 text-blue-600 dark:text-blue-400", dot: "bg-blue-500" },
  shipped: { wrapper: "bg-purple-500/10 text-purple-600 dark:text-purple-400", dot: "bg-purple-500" },
  out_for_delivery: { wrapper: "bg-purple-500/10 text-purple-600 dark:text-purple-400", dot: "bg-purple-500" },
  completed: { wrapper: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  delivered: { wrapper: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  success: { wrapper: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  approved: { wrapper: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  cancelled: { wrapper: "bg-red-500/10 text-red-600 dark:text-red-400", dot: "bg-red-500" },
  failed: { wrapper: "bg-red-500/10 text-red-600 dark:text-red-400", dot: "bg-red-500" },
  rejected: { wrapper: "bg-red-500/10 text-red-600 dark:text-red-400", dot: "bg-red-500" },
  declined: { wrapper: "bg-red-500/10 text-red-600 dark:text-red-400", dot: "bg-red-500" },
  refunded: { wrapper: "bg-red-500/10 text-red-600 dark:text-red-400", dot: "bg-red-500" },
  draft: { wrapper: "bg-default-100 text-default-600 dark:text-default-400", dot: "bg-default-400" },
  inactive: { wrapper: "bg-default-100 text-default-600 dark:text-default-400", dot: "bg-default-400" },
  on_hold: { wrapper: "bg-amber-500/10 text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  returned: { wrapper: "bg-orange-500/10 text-orange-600 dark:text-orange-400", dot: "bg-orange-500" },
};

function resolveStyle(status: string): StatusStyle {
  const key = status?.trim().toLowerCase().replace(/[\s-]+/g, "_") ?? "";
  return STATUS_PALETTE[key] ?? {
    wrapper: "bg-default-100 text-default-600 dark:text-default-400",
    dot: "bg-default-400",
  };
}

function formatLabel(status: string): string {
  if (!status) return "";
  return status
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/**
 * VendorStatusBadge - A consistent pill-style status indicator for the vendor
 * dashboard. Maps common commerce/order/fulfilment statuses to a semantic
 * colour palette with a dot indicator.
 */
export function VendorStatusBadge({
  status,
  size = "md",
  className,
}: VendorStatusBadgeProps) {
  const style = resolveStyle(status);
  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-[11px]"
      : "px-2.5 py-1 text-xs";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold capitalize",
        sizeClasses,
        style.wrapper,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} aria-hidden />
      {formatLabel(status)}
    </span>
  );
}

export default VendorStatusBadge;
