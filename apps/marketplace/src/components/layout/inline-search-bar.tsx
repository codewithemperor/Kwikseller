"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Search, SlidersHorizontal, X } from "lucide-react";

interface InlineSearchBarProps {
  query: string;
  onSearch: (q: string) => void;
  onBack?: () => void;
  onInputChange?: (q: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  placeholder?: string;
  showBackButton?: boolean;
  showFilterButton?: boolean;
  activeFilterCount?: number;
}

export function InlineSearchBar({
  query,
  onSearch,
  onBack,
  onInputChange,
  showFilters,
  onToggleFilters,
  placeholder = "Search products, stores, categories...",
  showBackButton = true,
  showFilterButton = true,
  activeFilterCount = 0,
}: InlineSearchBarProps) {
  const [inputValue, setInputValue] = useState(query);

  useEffect(() => {
    setInputValue(query);
  }, [query]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const trimmed = inputValue.trim();
    if (trimmed) onSearch(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className="flex min-w-0 flex-1 items-center gap-2">
      {showBackButton ? (
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors hover:bg-kwik-bg-light"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4 text-kwik-dark-medium" />
        </button>
      ) : null}

      <div className="relative min-w-0 flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-kwik-muted" />
        <input
          type="text"
          value={inputValue}
          onChange={(event) => {
            setInputValue(event.target.value);
            onInputChange?.(event.target.value);
          }}
          placeholder={placeholder}
          className="h-9 w-full rounded-xl border border-kwik-border bg-kwik-bg-surface pl-9 pr-9 text-sm text-kwik-dark outline-none transition-colors placeholder:text-kwik-muted focus:border-kwik-orange focus:ring-1 focus:ring-kwik-orange"
          autoFocus={showBackButton}
        />
        {inputValue ? (
          <button
            type="button"
            onClick={() => {
              setInputValue("");
              onInputChange?.("");
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-kwik-muted hover:text-kwik-dark-medium"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {showFilterButton ? (
        <button
          type="button"
          onClick={onToggleFilters}
          className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors lg:hidden ${
            showFilters
              ? "bg-kwik-orange-tint text-kwik-orange"
              : "text-kwik-dark-medium hover:bg-kwik-bg-light"
          }`}
          aria-label="Toggle filters"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {activeFilterCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-kwik-orange px-1 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          ) : null}
        </button>
      ) : null}
    </form>
  );
}
