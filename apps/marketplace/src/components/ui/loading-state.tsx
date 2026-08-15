"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { ProductCardSkeleton } from "@/components/landing/skeleton-loading";
import { cn } from "@/lib/utils";

/** Centered spinner with optional label — for inline / button / section loading. */
export function LoadingSpinner({
  label,
  className,
  size = 24,
}: {
  label?: string;
  className?: string;
  size?: number;
}) {
  return (
    <div className={cn("flex items-center justify-center gap-3 py-10 text-kwik-muted", className)}>
      <Loader2 className="animate-spin text-kwik-orange" style={{ width: size, height: size }} />
      {label && <span className="text-sm font-medium">{label}</span>}
    </div>
  );
}

/** Full-section loading state with a responsive skeleton product grid. */
export function ProductGridSkeleton({
  count = 8,
  columns = 4,
  className,
}: {
  count?: number;
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}) {
  const cols =
    columns === 2
      ? "grid-cols-2"
      : columns === 3
        ? "grid-cols-2 md:grid-cols-3"
        : columns === 5
          ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
  return (
    <div className={cn("grid gap-4 sm:gap-5", cols, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Generic centered loading state for a whole page. */
export function PageLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <LoadingSpinner label={label} size={32} />
    </div>
  );
}
