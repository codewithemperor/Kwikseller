"use client";

import { cn } from "@kwikseller/ui";
import { marketplaceTrendingFilters } from "@/data/marketplace-home";

interface ProductFilterChipsProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export function ProductFilterChips({
  activeFilter,
  onFilterChange,
}: ProductFilterChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin md:flex-wrap">
      {marketplaceTrendingFilters.map((filter) => {
        const isActive = activeFilter === filter.value;

        return (
          <button
            key={filter.value}
            type="button"
            onClick={() => onFilterChange(filter.value)}
            className={cn(
              "whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "border-kwik-orange bg-kwik-orange text-white"
                : "border-kwik-border bg-background text-kwik-dark-medium hover:border-kwik-orange hover:text-kwik-orange",
            )}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
