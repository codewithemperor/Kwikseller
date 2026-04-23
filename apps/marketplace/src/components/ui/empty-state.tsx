"use client";

import React from "react";
import { motion } from "framer-motion";
import { PackageOpen, Search, Heart, ShoppingBag, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateVariant = "default" | "search" | "cart" | "wishlist" | "error";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  variant?: EmptyStateVariant;
}

const VARIANT_CONFIG: Record<
  EmptyStateVariant,
  {
    defaultIcon: React.ReactNode;
    bgClass: string;
    iconColor: string;
    ringClass: string;
  }
> = {
  default: {
    defaultIcon: <PackageOpen className="h-12 w-12" />,
    bgClass: "bg-gradient-to-br from-kwik-orange/10 to-kwik-orange/5",
    iconColor: "text-kwik-orange",
    ringClass: "ring-kwik-orange/20",
  },
  search: {
    defaultIcon: <Search className="h-12 w-12" />,
    bgClass: "bg-gradient-to-br from-kwik-orange/10 to-kwik-orange/5 dark:from-kwik-orange/20 dark:to-kwik-orange/10",
    iconColor: "text-kwik-orange",
    ringClass: "ring-kwik-orange/20",
  },
  cart: {
    defaultIcon: <ShoppingBag className="h-12 w-12" />,
    bgClass: "bg-gradient-to-br from-kwik-orange/10 to-kwik-orange/5 dark:from-kwik-orange/20 dark:to-kwik-orange/10",
    iconColor: "text-kwik-orange",
    ringClass: "ring-kwik-orange/20",
  },
  wishlist: {
    defaultIcon: <Heart className="h-12 w-12" />,
    bgClass: "bg-gradient-to-br from-kwik-red/10 to-kwik-red/5 dark:from-kwik-red/20 dark:to-kwik-red/10",
    iconColor: "text-kwik-red",
    ringClass: "ring-kwik-red/20",
  },
  error: {
    defaultIcon: <TrendingUp className="h-12 w-12" />,
    bgClass: "bg-gradient-to-br from-kwik-red/10 to-kwik-red/5 dark:from-kwik-red/20 dark:to-kwik-red/10",
    iconColor: "text-kwik-red",
    ringClass: "ring-kwik-red/20",
  },
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  variant = "default",
}: EmptyStateProps) {
  const config = VARIANT_CONFIG[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center",
        className,
      )}
    >
      {/* Decorative blur background */}
      <div className="relative mb-6">
        <div className="absolute -inset-10 rounded-full bg-kwik-orange/5 blur-2xl dark:bg-kwik-orange/10" />
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4, ease: "easeOut" }}
          className={cn(
            "relative flex h-32 w-32 items-center justify-center rounded-3xl ring-1",
            config.bgClass,
            config.ringClass,
          )}
        >
          <motion.span
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className={config.iconColor}
          >
            {icon || config.defaultIcon}
          </motion.span>
        </motion.div>
      </div>

      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="text-lg font-semibold text-kwik-dark"
      >
        {title}
      </motion.h3>

      {description && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="mt-2 max-w-sm text-sm text-kwik-gray-light"
        >
          {description}
        </motion.p>
      )}

      {action && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          className="mt-5"
        >
          {action}
        </motion.div>
      )}
    </motion.div>
  );
}
