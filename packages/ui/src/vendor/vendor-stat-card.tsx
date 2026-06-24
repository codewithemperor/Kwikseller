"use client";

import React from "react";
import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import { cn } from "../lib/utils";

export type VendorStatCardVariant = "balance" | "stat";

export interface VendorStatSubItem {
  label: string;
  value: string;
}

export interface VendorStatCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  variant?: VendorStatCardVariant;
  subItems?: VendorStatSubItem[];
  className?: string;
}

/**
 * VendorStatCard - A wider horizontal card used for wallet balance displays
 * and analytics stats. The `balance` variant emphasises a large amount with
 * optional sub-items (Available / In Escrow / Total Earnings); the `stat`
 * variant is a standard metric with an optional icon.
 */
export function VendorStatCard({
  label,
  value,
  icon: Icon,
  variant = "stat",
  subItems,
  className,
}: VendorStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      whileHover={{ scale: 1.01 }}
      className={cn(
        "kwik-shadow rounded-2xl border border-kwik-border bg-surface p-5",
        variant === "balance" && "bg-gradient-to-br from-surface to-accent-soft/40",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p
          className={cn(
            "font-medium text-muted-foreground",
            variant === "balance" ? "text-sm" : "text-sm",
          )}
        >
          {label}
        </p>
        {Icon && (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>

      <p
        className={cn(
          "mt-2 font-bold tracking-tight text-foreground",
          variant === "balance" ? "text-3xl md:text-4xl" : "text-2xl",
        )}
      >
        {value}
      </p>

      {subItems && subItems.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-2 border-t border-kwik-border pt-4 sm:grid-cols-3">
          {subItems.map((item) => (
            <div key={item.label} className="min-w-0">
              <p className="truncate text-xs text-muted-foreground">{item.label}</p>
              <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default VendorStatCard;
