"use client";

import { Check, AlertCircle, Package, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "COMING_SOON" | "UNAVAILABLE";

interface StockBadgeProps {
  stock: number;
  lowStockThreshold?: number;
  isPreorder?: boolean;
  status?: string;
  className?: string;
  variant?: "badge" | "inline";
}

/**
 * Derive the real stock status from actual inventory data.
 * No hardcoded states — uses the product's actual stock count.
 */
export function getStockStatus(
  stock: number,
  lowStockThreshold = 5,
  isPreorder = false,
  productStatus?: string,
): StockStatus {
  if (productStatus && productStatus !== "ACTIVE") return "UNAVAILABLE";
  if (isPreorder) return "COMING_SOON";
  if (stock === 0) return "OUT_OF_STOCK";
  if (stock <= lowStockThreshold) return "LOW_STOCK";
  return "IN_STOCK";
}

const config: Record<StockStatus, { label: string; className: string; icon: typeof Check }> = {
  IN_STOCK: {
    label: "In Stock",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    icon: Check,
  },
  LOW_STOCK: {
    label: "Low Stock",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
    icon: AlertCircle,
  },
  OUT_OF_STOCK: {
    label: "Out of Stock",
    className: "bg-red-500/10 text-red-600 dark:text-red-300",
    icon: AlertCircle,
  },
  COMING_SOON: {
    label: "Coming Soon",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
    icon: Clock,
  },
  UNAVAILABLE: {
    label: "Unavailable",
    className: "bg-neutral-500/10 text-neutral-600 dark:text-neutral-300",
    icon: Package,
  },
};

/**
 * Reusable stock/availability badge.
 * Uses actual inventory data — no hardcoded status.
 */
export function StockBadge({
  stock,
  lowStockThreshold = 5,
  isPreorder = false,
  status,
  className,
  variant = "badge",
}: StockBadgeProps) {
  const stockStatus = getStockStatus(stock, lowStockThreshold, isPreorder, status);
  const { label, className: colorClass, icon: Icon } = config[stockStatus];

  if (variant === "inline") {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-sm font-medium", colorClass, className)}>
        <Icon className="h-3.5 w-3.5" />
        {label}
        {stockStatus === "LOW_STOCK" && stock > 0 && ` — only ${stock} left`}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        colorClass,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
