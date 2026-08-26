"use client";

import React from "react";
import { SlidersHorizontal, Tag, Store, MapPin, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchMeta } from "@/lib/api";
import { PriceRangeFilter } from "./price-range-filter";
import { RatingFilter } from "./rating-filter";
import { FacetList } from "./facet-list";

export interface SearchFiltersState {
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  category?: string; // slug
  categoryIds?: string[];
  brandId?: string; // id
  brandIds?: string[];
  storeId?: string; // id
  storeIds?: string[];
  state?: string; // name
  states?: string[];
}

interface SearchFiltersProps {
  state: SearchFiltersState;
  meta: SearchMeta | null;
  onChange: (next: Partial<SearchFiltersState>) => void;
  onReset: () => void;
  className?: string;
  showHeader?: boolean;
}

function FilterSection({
  title,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="border-b border-kwik-border py-4 dark:border-white/10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 text-left"
      >
        <span className="text-kwik-orange">{icon}</span>
        <span className="flex-1 text-sm font-semibold text-kwik-dark dark:text-white">{title}</span>
        <svg
          className={cn("h-4 w-4 text-kwik-muted transition-transform", open && "rotate-180")}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}

export function SearchFilters({
  state,
  meta,
  onChange,
  onReset,
  className,
  showHeader = true,
}: SearchFiltersProps) {
  const hasActiveFilters =
    state.minPrice !== undefined ||
    state.maxPrice !== undefined ||
    state.rating !== undefined ||
    state.category !== undefined ||
    (state.categoryIds?.length ?? 0) > 0 ||
    state.brandId !== undefined ||
    (state.brandIds?.length ?? 0) > 0 ||
    state.storeId !== undefined ||
    (state.storeIds?.length ?? 0) > 0 ||
    state.state !== undefined ||
    (state.states?.length ?? 0) > 0;

  return (
    <div className={cn("flex flex-col", className)}>
      {showHeader ? (
        <div className="flex items-center justify-between border-b border-kwik-border pb-3 dark:border-white/10">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-kwik-orange" />
            <h2 className="text-sm font-semibold text-kwik-dark dark:text-white">Filters</h2>
          </div>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={onReset}
              className="text-[11px] font-medium text-kwik-muted hover:text-kwik-red transition-colors"
            >
              Reset
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Price */}
      <FilterSection title="Price" icon={<Tag className="h-4 w-4" />}>
        <PriceRangeFilter
          min={state.minPrice}
          max={state.maxPrice}
          priceRange={meta?.priceRange}
          onChange={(range) => onChange({ minPrice: range.min, maxPrice: range.max })}
        />
      </FilterSection>

      {/* Rating */}
      <FilterSection title="Rating" icon={<Star className="h-4 w-4" />}>
        <RatingFilter
          value={state.rating}
          onChange={(r) => onChange({ rating: r })}
        />
      </FilterSection>

      {/* Category — only shows relevant categories for current search */}
      <FilterSection title="Category" icon={<Tag className="h-4 w-4" />}>
        <FacetList
          facets={meta?.categories ?? []}
          selected={state.categoryIds ?? state.category}
          multiple
          onSelect={(v) => onChange({ category: undefined, categoryIds: Array.isArray(v) ? v : v ? [v] : undefined })}
          emptyMessage="No categories match your search"
        />
      </FilterSection>

      {/* Vendor */}
      <FilterSection title="Vendor" icon={<Store className="h-4 w-4" />}>
        <FacetList
          facets={meta?.stores ?? []}
          selected={state.storeIds ?? state.storeId}
          multiple
          onSelect={(v) => onChange({ storeId: undefined, storeIds: Array.isArray(v) ? v : v ? [v] : undefined })}
          emptyMessage="No vendors match your search"
        />
      </FilterSection>

      {/* Brand */}
      {(meta?.brands?.length ?? 0) > 0 ? (
        <FilterSection title="Brand" icon={<Tag className="h-4 w-4" />}>
          <FacetList
            facets={meta?.brands ?? []}
            selected={state.brandIds ?? state.brandId}
            multiple
            onSelect={(v) => onChange({ brandId: undefined, brandIds: Array.isArray(v) ? v : v ? [v] : undefined })}
            emptyMessage="No brands match your search"
          />
        </FilterSection>
      ) : null}

      {/* Location */}
      {(meta?.states?.length ?? 0) > 0 ? (
        <FilterSection title="Location" icon={<MapPin className="h-4 w-4" />}>
          <FacetList
            facets={meta?.states ?? []}
            selected={state.states ?? state.state}
            multiple
            onSelect={(v) => onChange({ state: undefined, states: Array.isArray(v) ? v : v ? [v] : undefined })}
            emptyMessage="No locations match your search"
          />
        </FilterSection>
      ) : null}
    </div>
  );
}
