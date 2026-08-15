"use client";

import React from "react";
import { SearchX, RotateCcw, ArrowRight, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface NoResultsStateProps {
  query: string;
  onClearFilters: () => void;
  onBrowseAll: () => void;
  className?: string;
}

/**
 * No-results state for search — uses solid colors only (no gradients).
 * Offers clear-filters + browse-categories actions.
 */
export function NoResultsState({
  query,
  onClearFilters,
  onBrowseAll,
  className,
}: NoResultsStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-kwik-orange-tint ring-1 ring-kwik-orange/20">
        <SearchX className="h-10 w-10 text-kwik-orange" />
      </div>
      <h3 className="text-lg font-semibold text-kwik-dark dark:text-white">
        No products found for &ldquo;{query}&rdquo;
      </h3>
      <p className="mt-2 max-w-sm text-sm text-kwik-gray-light dark:text-white/60">
        Try adjusting your search or filters to find what you&rsquo;re looking for.
      </p>

      <div className="mt-6 flex flex-col items-center gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onClearFilters}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-kwik-border bg-background px-5 text-sm font-semibold text-kwik-dark hover:border-kwik-orange/50 hover:bg-kwik-bg-light transition-colors dark:bg-white/5 dark:text-white dark:border-white/10 dark:hover:bg-white/10"
        >
          <RotateCcw className="h-4 w-4" />
          Clear filters
        </button>
        <button
          type="button"
          onClick={onBrowseAll}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-kwik-orange px-5 text-sm font-semibold text-white hover:bg-kwik-orange-hover transition-colors"
        >
          Browse all products
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

interface SearchErrorStateProps {
  onRetry: () => void;
  className?: string;
}

export function SearchErrorState({ onRetry, className }: SearchErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-kwik-red/10 ring-1 ring-kwik-red/20">
        <Package className="h-10 w-10 text-kwik-red" />
      </div>
      <h3 className="text-lg font-semibold text-kwik-dark dark:text-white">
        Something went wrong
      </h3>
      <p className="mt-2 max-w-sm text-sm text-kwik-gray-light dark:text-white/60">
        We couldn&rsquo;t load search results. Please check your connection and try again.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-kwik-orange px-5 text-sm font-semibold text-white hover:bg-kwik-orange-hover transition-colors"
      >
        <RotateCcw className="h-4 w-4" />
        Retry search
      </button>
    </div>
  );
}
