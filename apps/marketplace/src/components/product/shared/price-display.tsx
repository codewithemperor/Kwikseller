"use client";

import { cn } from "@/lib/utils";
import { formatCurrency, discountPercent } from "./format";

interface PriceDisplayProps {
  price: number;
  comparePrice?: number;
  size?: "sm" | "md" | "lg" | "xl";
  showDiscount?: boolean;
  className?: string;
}

const sizeMap = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-2xl",
  xl: "text-3xl sm:text-4xl",
};

/**
 * Reusable price hierarchy: Current Price → Previous Price → Discount %.
 * Only shows discount/previous price when a real comparePrice exists and
 * is greater than the current price. No fake discounts.
 */
export function PriceDisplay({
  price,
  comparePrice,
  size = "lg",
  showDiscount = true,
  className,
}: PriceDisplayProps) {
  const hasDiscount = !!comparePrice && comparePrice > price;
  const pct = discountPercent(price, comparePrice);

  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-3 gap-y-1", className)}>
      <span className={cn("font-bold leading-none text-kwik-dark dark:text-white", sizeMap[size])}>
        {formatCurrency(price)}
      </span>
      {hasDiscount && (
        <>
          <span className="text-sm font-medium text-kwik-muted line-through dark:text-white/45">
            {formatCurrency(comparePrice!)}
          </span>
          {showDiscount && pct > 0 && (
            <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-300">
              -{pct}%
            </span>
          )}
        </>
      )}
    </div>
  );
}
