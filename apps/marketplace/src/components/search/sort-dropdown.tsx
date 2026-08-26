"use client";

import { cn } from "@/lib/utils";

export type SortValue =
  | "relevance"
  | "price-low"
  | "price-high"
  | "rating"
  | "newest"
  | "popular";

interface SortOption {
  value: SortValue;
  label: string;
}

export const SORT_OPTIONS: SortOption[] = [
  { value: "relevance", label: "Relevance" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most Popular" },
];

interface SortDropdownProps {
  value: SortValue;
  onChange: (value: SortValue) => void;
  className?: string;
}

export function SortDropdown({ value, onChange, className }: SortDropdownProps) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as SortValue)}
      aria-label="Sort products"
      className={cn(
        "h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground outline-none transition-colors hover:border-kwik-orange/50 focus:border-kwik-orange focus:ring-2 focus:ring-kwik-orange/15",
        className,
      )}
    >
      {SORT_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
