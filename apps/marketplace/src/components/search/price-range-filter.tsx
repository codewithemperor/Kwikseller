"use client";

import React, { useState } from "react";

interface PriceRangeFilterProps {
  min?: number;
  max?: number;
  priceRange?: { min: number; max: number }; // bounds from backend
  onChange: (range: { min?: number; max?: number }) => void;

  /**
   * Optional `resetKey` — when this value changes, the internal draft
   * inputs are reset to match `min`/`max`. Use this to sync the local
   * input state when the parent's URL state is externally cleared
   * (e.g. user clicks "Reset all filters").
   *
   * Implemented via React's `key` prop on the inner component so the
   * state is cleanly reset without `useEffect` or ref-mutation.
   */
  resetKey?: string;
}

function formatPrice(n: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * Inner component — holds the local draft state. The outer component
 * remounts this when `resetKey` changes.
 */
function PriceRangeInputs({
  min,
  max,
  priceRange,
  onChange,
}: Omit<PriceRangeFilterProps, "resetKey">) {
  const [minInput, setMinInput] = useState(min?.toString() ?? "");
  const [maxInput, setMaxInput] = useState(max?.toString() ?? "");

  const applyRange = () => {
    const parsedMin = minInput ? Number(minInput) : undefined;
    const parsedMax = maxInput ? Number(maxInput) : undefined;
    onChange({
      min: parsedMin && !Number.isNaN(parsedMin) ? parsedMin : undefined,
      max: parsedMax && !Number.isNaN(parsedMax) ? parsedMax : undefined,
    });
  };

  const clear = () => {
    setMinInput("");
    setMaxInput("");
    onChange({ min: undefined, max: undefined });
  };

  const hasValue = (min && min > 0) || (max && max > 0);
  const boundMin = priceRange?.min ?? 0;
  const boundMax = priceRange?.max ?? 100000;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-kwik-muted">
            ₦
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Min"
            value={minInput}
            onChange={(e) => setMinInput(e.target.value)}
            onBlur={applyRange}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyRange();
            }}
            className="h-9 w-full rounded-lg border border-kwik-border bg-background pl-7 pr-2 text-sm text-kwik-dark outline-none transition focus:border-kwik-orange focus:ring-2 focus:ring-kwik-orange/20 dark:text-white dark:bg-white/5 dark:border-white/10"
          />
        </div>
        <span className="text-kwik-muted">–</span>
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-kwik-muted">
            ₦
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Max"
            value={maxInput}
            onChange={(e) => setMaxInput(e.target.value)}
            onBlur={applyRange}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyRange();
            }}
            className="h-9 w-full rounded-lg border border-kwik-border bg-background pl-7 pr-2 text-sm text-kwik-dark outline-none transition focus:border-kwik-orange focus:ring-2 focus:ring-kwik-orange/20 dark:text-white dark:bg-white/5 dark:border-white/10"
          />
        </div>
      </div>

      {priceRange && boundMax > boundMin ? (
        <p className="text-[11px] text-kwik-muted">
          Price range: {formatPrice(boundMin)} – {formatPrice(boundMax)}
        </p>
      ) : null}

      {hasValue ? (
        <button
          type="button"
          onClick={clear}
          className="text-[11px] font-medium text-kwik-muted hover:text-kwik-red transition-colors"
        >
          Clear price
        </button>
      ) : null}
    </div>
  );
}

export function PriceRangeFilter(props: PriceRangeFilterProps) {
  // The `key` on the inner component changes when `resetKey` changes,
  // which remounts the inputs with fresh state from `min`/`max` props.
  const resetKey = props.resetKey ?? `${props.min ?? ""}-${props.max ?? ""}`;
  return <PriceRangeInputs key={resetKey} min={props.min} max={props.max} priceRange={props.priceRange} onChange={props.onChange} />;
}
