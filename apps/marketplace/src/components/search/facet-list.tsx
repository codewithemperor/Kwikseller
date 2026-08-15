"use client";

import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchFacet, StateFacet } from "@/lib/api";

interface FacetListProps {
  facets: SearchFacet[] | StateFacet[];
  selected?: string; // selected id or slug
  onSelect: (value: string | undefined) => void;
  emptyMessage?: string;
}

/**
 * Reusable facet list — renders a list of categories/brands/states with
 * counts and a check indicator when selected. Clicking a selected item
 * clears it.
 */
export function FacetList({ facets, selected, onSelect, emptyMessage }: FacetListProps) {
  if (!facets || facets.length === 0) {
    return (
      <p className="px-2.5 py-2 text-xs text-kwik-muted">{emptyMessage ?? "No options available"}</p>
    );
  }

  return (
    <ul className="space-y-0.5">
      {facets.map((facet) => {
        const id = "slug" in facet ? facet.slug : facet.id;
        const isActive = selected === id || selected === facet.name;
        return (
          <li key={facet.id}>
            <button
              type="button"
              onClick={() => onSelect(isActive ? undefined : id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                isActive
                  ? "bg-kwik-orange-tint text-kwik-orange font-medium"
                  : "text-kwik-dark hover:bg-kwik-bg-light dark:text-white/80 dark:hover:bg-white/5",
              )}
            >
              <span className="flex-1 truncate">{facet.name}</span>
              <span
                className={cn(
                  "shrink-0 text-[11px]",
                  isActive ? "text-kwik-orange" : "text-kwik-muted",
                )}
              >
                {facet.count}
              </span>
              {isActive ? <Check className="h-3.5 w-3.5 shrink-0" /> : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
