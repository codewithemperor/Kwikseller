"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "../lib/utils";

export type VendorMetricTrend = {
  value: number;
  direction: "up" | "down";
};

export type VendorMetricCardVariant = "default" | "solid" | "soft";

export interface VendorMetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: VendorMetricTrend;
  description?: string;
  variant?: VendorMetricCardVariant;
  className?: string;
}

const variantSurface: Record<VendorMetricCardVariant, string> = {
  default: "border border-border bg-background text-foreground",
  solid: "border border-accent/40 bg-accent text-accent-foreground",
  soft: "border border-accent/20 bg-accent-soft text-accent-soft-foreground",
};

const iconSurface: Record<VendorMetricCardVariant, string> = {
  default: "bg-accent/10 text-accent",
  solid: "bg-accent-foreground/15 text-accent-foreground",
  soft: "bg-accent/15 text-accent",
};

/**
 * VendorMetricCard - The single shared metric card for all vendor dashboards.
 * Consolidates the legacy DashboardMetricCard, VendorMetricCard, SummaryCard
 * and VendorSolidCard into one consistent, animated component.
 */
export function VendorMetricCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  variant = "default",
  className,
}: VendorMetricCardProps) {
  const isPositiveTrend = trend?.direction === "up";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        "rounded-xl p-5 transition-colors",
        variantSurface[variant],
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 truncate text-2xl font-bold tracking-tight">
            {value}
          </p>
        </div>
        <span
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
            iconSurface[variant],
          )}
        >
          <Icon className="h-6 w-6" />
        </span>
      </div>

      {(trend || description) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold",
                isPositiveTrend
                  ? "bg-success/10 text-success"
                  : "bg-danger/10 text-danger",
              )}
            >
              {isPositiveTrend ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {Math.abs(trend.value)}%
            </span>
          )}
          {description && (
            <span className="truncate text-muted-foreground">{description}</span>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default VendorMetricCard;
