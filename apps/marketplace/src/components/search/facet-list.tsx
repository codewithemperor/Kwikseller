"use client";

import React from "react";
import { Checkbox } from "@heroui/react";
import { cn } from "@/lib/utils";
import type { SearchFacet, StateFacet } from "@/lib/api";

interface FacetListProps {
  facets: SearchFacet[] | StateFacet[];
  selected?: string | string[];
  onSelect: (value: string | string[] | undefined) => void;
  multiple?: boolean;
  emptyMessage?: string;
}

/**
 * Reusable facet list — renders a list of categories/brands/states with
 * counts and a HeroUI checkbox indicator when selected.
 */
export function FacetList({ facets, selected, onSelect, multiple = false, emptyMessage }: FacetListProps) {
  if (!facets || facets.length === 0) {
    return (
      <p className="px-2.5 py-2 text-xs text-kwik-muted">{emptyMessage ?? "No options available"}</p>
    );
  }

  const selectedValues = Array.isArray(selected)
    ? selected
    : selected
      ? [selected]
      : [];

  return (
    <ul className="space-y-0.5">
      {facets.map((facet) => {
        const id = "slug" in facet ? facet.slug : facet.id;
        const isActive = selectedValues.includes(id) || selectedValues.includes(facet.name);
        const nextValue = () => {
          if (!multiple) {
            onSelect(isActive ? undefined : id);
            return;
          }

          const next = isActive
            ? selectedValues.filter((value) => value !== id && value !== facet.name)
            : [...selectedValues, id];
          onSelect(next.length > 0 ? next : undefined);
        };

        return (
          <li key={facet.id}>
            <Checkbox
              isSelected={isActive}
              onChange={nextValue}
              className={cn(
                "group flex w-full rounded-lg px-2.5 py-2 text-sm transition-colors",
                isActive
                  ? "bg-kwik-orange-tint text-kwik-orange font-medium"
                  : "text-kwik-dark hover:bg-kwik-bg-light dark:text-white/80 dark:hover:bg-white/5",
              )}
            >
              <Checkbox.Content className="!flex !flex-row !items-center !gap-2">
                <Checkbox.Control className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-border bg-background text-accent-foreground shadow-none transition-colors group-data-[selected=true]:border-accent group-data-[selected=true]:bg-accent dark:border-white/20">
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <span className="min-w-0 flex-1 truncate">{facet.name}</span>
                <span className={cn("shrink-0 text-[11px]", isActive ? "text-kwik-orange" : "text-kwik-muted")}>
                  {facet.count}
                </span>
              </Checkbox.Content>
            </Checkbox>
          </li>
        );
      })}
    </ul>
  );
}
