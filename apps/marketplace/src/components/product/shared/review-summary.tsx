"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewSummaryProps {
  average: number;
  total: number;
  distribution: Record<number, number>;
  /** When provided, clicking a star row calls this. */
  onFilter?: (star: number | null) => void;
  activeFilter?: number | null;
  className?: string;
}

/**
 * Reusable rating summary: average score + 5-star breakdown bars.
 * Bars are clickable when `onFilter` is provided.
 * NO gradients — uses solid colors.
 */
export function ReviewSummary({
  average,
  total,
  distribution,
  onFilter,
  activeFilter = null,
  className,
}: ReviewSummaryProps) {
  const stars = [5, 4, 3, 2, 1];

  return (
    <div className={cn("space-y-4", className)}>
      {/* Average */}
      <div className="rounded-xl bg-kwik-orange-tint/50 p-5 text-center dark:bg-white/5">
        <p className="text-5xl font-bold text-kwik-dark dark:text-white">
          {average.toFixed(1)}
        </p>
        <div className="mt-2 flex items-center justify-center gap-0.5">
          {Array.from({ length: 5 }).map((_, idx) => (
            <Star
              key={idx}
              className={cn(
                "h-5 w-5",
                idx < Math.round(average)
                  ? "fill-kwik-star text-kwik-star"
                  : "fill-none text-kwik-border-light dark:text-white/20",
              )}
            />
          ))}
        </div>
        <p className="mt-1 text-sm text-kwik-muted dark:text-white/55">
          Based on {total} {total === 1 ? "review" : "reviews"}
        </p>
      </div>

      {/* Distribution */}
      <div className="space-y-1.5">
        {stars.map((star) => {
          const count = distribution[star] || 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const isActive = activeFilter === star;
          const Row = (
            <div
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2 py-1 text-sm transition-colors",
                onFilter ? "cursor-pointer" : "",
                isActive ? "bg-kwik-orange-tint" : onFilter ? "hover:bg-kwik-bg-surface dark:hover:bg-white/5" : "",
              )}
            >
              <span className="w-3 text-right font-semibold text-kwik-dark dark:text-white">{star}</span>
              <Star className="h-3.5 w-3.5 fill-kwik-star text-kwik-star" />
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-kwik-border-light dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-kwik-star"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-8 text-right text-xs text-kwik-muted dark:text-white/55">{count}</span>
            </div>
          );
          return onFilter ? (
            <button
              type="button"
              key={star}
              onClick={() => onFilter(isActive ? null : star)}
              aria-pressed={isActive}
              aria-label={`Filter to ${star}-star reviews`}
              className="block w-full text-left"
            >
              {Row}
            </button>
          ) : (
            <div key={star}>{Row}</div>
          );
        })}
      </div>

      {onFilter && activeFilter !== null && (
        <button
          type="button"
          onClick={() => onFilter(null)}
          className="text-xs font-medium text-kwik-orange hover:underline"
        >
          Clear filter
        </button>
      )}
    </div>
  );
}
