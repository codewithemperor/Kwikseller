"use client";

import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActiveFilterChip {
  key: string; // unique key
  label: string; // display label
  onRemove: () => void;
}

interface ActiveFiltersProps {
  chips: ActiveFilterChip[];
  onClearAll?: () => void;
  className?: string;
}

export function ActiveFilters({ chips, onClearAll, className }: ActiveFiltersProps) {
  if (chips.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1 rounded-full border border-kwik-border bg-kwik-bg-surface py-1 pl-3 pr-1.5 text-xs font-medium text-kwik-dark dark:bg-white/5 dark:text-white/80 dark:border-white/10"
        >
          {chip.label}
          <button
            type="button"
            onClick={chip.onRemove}
            aria-label={`Remove filter ${chip.label}`}
            className="flex h-4 w-4 items-center justify-center rounded-full text-kwik-muted hover:bg-kwik-red/10 hover:text-kwik-red transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      {onClearAll && chips.length > 1 ? (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-medium text-kwik-muted hover:text-kwik-red transition-colors px-1.5"
        >
          Clear all
        </button>
      ) : null}
    </div>
  );
}
