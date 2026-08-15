"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingDisplayProps {
  rating: number;
  reviewCount?: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { star: "h-3.5 w-3.5", text: "text-xs", gap: "gap-0.5" },
  md: { star: "h-4 w-4", text: "text-sm", gap: "gap-1" },
  lg: { star: "h-5 w-5", text: "text-base", gap: "gap-1" },
};

/**
 * Reusable star-rating display.
 * Shows filled stars up to the rounded rating + optional review count.
 * No gradients — uses solid `text-kwik-star` for filled stars.
 */
export function RatingDisplay({
  rating,
  reviewCount,
  size = "md",
  showCount = true,
  className,
}: RatingDisplayProps) {
  const s = sizeMap[size];
  const rounded = Math.round(rating);

  return (
    <div className={cn("flex items-center", s.gap, className)}>
      <div className={cn("flex items-center", s.gap)}>
        {Array.from({ length: 5 }).map((_, idx) => (
          <Star
            key={idx}
            className={cn(
              s.star,
              idx < rounded
                ? "fill-kwik-star text-kwik-star"
                : "fill-none text-kwik-border-light dark:text-white/20",
            )}
          />
        ))}
      </div>
      <span className={cn("font-semibold text-kwik-dark dark:text-white", s.text)}>
        {rating.toFixed(1)}
      </span>
      {showCount && reviewCount !== undefined && (
        <span className={cn("text-kwik-muted dark:text-white/55", s.text)}>
          ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
        </span>
      )}
    </div>
  );
}
