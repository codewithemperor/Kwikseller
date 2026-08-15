"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
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
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const current = SORT_OPTIONS.find((o) => o.value === value) ?? SORT_OPTIONS[0];

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-9 items-center gap-1.5 rounded-lg border border-kwik-border bg-background px-3 text-sm font-medium text-kwik-dark transition hover:border-kwik-orange/50 hover:bg-kwik-bg-light dark:bg-white/5 dark:text-white dark:border-white/10 dark:hover:bg-white/10"
      >
        <span className="text-kwik-muted">Sort:</span>
        <span>{current.label}</span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 text-kwik-muted transition-transform", open && "rotate-180")}
        />
      </button>
      {open ? (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-1.5 w-56 overflow-hidden rounded-xl border border-kwik-border bg-background py-1 shadow-lg dark:bg-neutral-900 dark:border-white/10"
        >
          {SORT_OPTIONS.map((opt) => {
            const isActive = opt.value === value;
            return (
              <li key={opt.value} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors",
                    isActive
                      ? "bg-kwik-orange-tint text-kwik-orange font-medium"
                      : "text-kwik-dark hover:bg-kwik-bg-light dark:text-white/80 dark:hover:bg-white/5",
                  )}
                >
                  {opt.label}
                  {isActive ? <Check className="h-3.5 w-3.5" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
