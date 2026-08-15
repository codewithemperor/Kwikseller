"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
  label?: string;
}

/**
 * Reusable quantity stepper.
 * Respects min/max bounds. Disables decrement at min, increment at max.
 */
export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  className,
  label,
}: QuantitySelectorProps) {
  const canDecrement = value > min && !disabled;
  const canIncrement = value < max && !disabled;

  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      {label && (
        <span className="text-sm font-semibold text-kwik-dark dark:text-white">{label}</span>
      )}
      <div
        className={cn(
          "flex items-center gap-1 rounded-xl border border-border bg-kwik-bg-surface px-1.5 py-1 dark:bg-white/5",
          disabled && "opacity-50",
        )}
      >
        <button
          type="button"
          onClick={() => canDecrement && onChange(value - 1)}
          disabled={!canDecrement}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-kwik-dark-medium transition-colors hover:bg-kwik-orange-tint disabled:cursor-not-allowed disabled:opacity-40 dark:text-white/70 dark:hover:bg-white/10"
          aria-label="Decrease quantity"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-8 text-center font-semibold text-kwik-dark tabular-nums dark:text-white">
          {value}
        </span>
        <button
          type="button"
          onClick={() => canIncrement && onChange(value + 1)}
          disabled={!canIncrement}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-kwik-dark-medium transition-colors hover:bg-kwik-orange-tint disabled:cursor-not-allowed disabled:opacity-40 dark:text-white/70 dark:hover:bg-white/10"
          aria-label="Increase quantity"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
