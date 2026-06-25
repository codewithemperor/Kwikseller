"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Boxes,
  Clock,
  FileText,
  Layers,
  Package,
  Search,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../lib/utils";

export type SearchAutoSuggestItemType =
  | "recent"
  | "product"
  | "category"
  | "order"
  | "inventory"
  | "pool"
  | "page"
  | string;

export interface SearchAutoSuggestItem {
  id?: string;
  type: SearchAutoSuggestItemType;
  text: string;
  subtext?: string;
  href?: string;
}

export interface SearchAutoSuggestProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  placeholder?: string;
  historyKey?: string;
  emptyLabel?: string;
  footerLabel?: string;
  showTrending?: boolean;
  trendingItems?: SearchAutoSuggestItem[];
  idleItems?: SearchAutoSuggestItem[];
  loadSuggestions?: (query: string) => Promise<SearchAutoSuggestItem[]>;
  onSearch: (query: string) => void;
  onSelect?: (item: SearchAutoSuggestItem, query: string) => void;
  className?: string;
}

const MAX_HISTORY = 6;

const iconMap: Record<string, LucideIcon> = {
  recent: Clock,
  product: Package,
  category: Layers,
  order: FileText,
  inventory: Boxes,
  pool: Sparkles,
  page: Search,
};

function getHistory(historyKey: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(historyKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setHistory(historyKey: string, values: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(historyKey, JSON.stringify(values.slice(0, MAX_HISTORY)));
  } catch {
    // localStorage can fail in private mode; search should still work.
  }
}

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  return text.split(regex).map((part, index) =>
    regex.test(part) ? (
      <span key={`${part}-${index}`} className="font-semibold text-kwik-orange">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

export function SearchAutoSuggest({
  isOpen,
  onClose,
  anchorRef,
  placeholder = "Search...",
  historyKey = "kwikseller-search-history",
  emptyLabel = "No matching suggestions",
  footerLabel = "Press Enter to search",
  showTrending = true,
  trendingItems = [],
  idleItems = [],
  loadSuggestions,
  onSearch,
  onSelect,
  className,
}: SearchAutoSuggestProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [query, setQuery] = React.useState("");
  const [history, setHistoryState] = React.useState<string[]>([]);
  const [suggestions, setSuggestions] = React.useState<SearchAutoSuggestItem[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [dropdownStyle, setDropdownStyle] = React.useState<React.CSSProperties>({});
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const updateViewport = () => setIsMobile(window.innerWidth < 768);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  React.useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setSuggestions([]);
      return;
    }

    setHistoryState(getHistory(historyKey));
    const timer = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [historyKey, isOpen]);

  React.useEffect(() => {
    if (!isOpen || !anchorRef.current) return;

    const updatePosition = () => {
      if (window.innerWidth < 768) {
        setDropdownStyle({});
        return;
      }

      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(Math.max(rect.width + 16, 320), window.innerWidth - 16);
      const left = Math.min(Math.max(8, rect.left - 8), window.innerWidth - width - 8);
      setDropdownStyle({
        top: `${rect.bottom + 8}px`,
        left: `${left}px`,
        width: `${width}px`,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorRef, isOpen]);

  React.useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        anchorRef.current &&
        !anchorRef.current.contains(target)
      ) {
        onClose();
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKey);
    };
  }, [anchorRef, isOpen, onClose]);

  React.useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || !loadSuggestions) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    let active = true;
    setIsSearching(true);
    const timer = window.setTimeout(async () => {
      try {
        const results = await loadSuggestions(trimmed);
        if (active) setSuggestions(results.slice(0, 8));
      } catch {
        if (active) setSuggestions([]);
      } finally {
        if (active) setIsSearching(false);
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [loadSuggestions, query]);

  const persistAndSearch = React.useCallback(
    (term: string) => {
      const trimmed = term.trim();
      if (!trimmed) return;
      const nextHistory = [
        trimmed,
        ...getHistory(historyKey).filter((item) => item.toLowerCase() !== trimmed.toLowerCase()),
      ];
      setHistory(historyKey, nextHistory);
      setHistoryState(nextHistory.slice(0, MAX_HISTORY));
      onClose();
      onSearch(trimmed);
    },
    [historyKey, onClose, onSearch],
  );

  const handleSelect = React.useCallback(
    (item: SearchAutoSuggestItem) => {
      const trimmed = item.text.trim();
      if (!trimmed) return;
      const nextHistory = [
        trimmed,
        ...getHistory(historyKey).filter((entry) => entry.toLowerCase() !== trimmed.toLowerCase()),
      ];
      setHistory(historyKey, nextHistory);
      setHistoryState(nextHistory.slice(0, MAX_HISTORY));
      onClose();
      onSelect?.(item, query);
      if (!onSelect) onSearch(trimmed);
    },
    [historyKey, onClose, onSearch, onSelect, query],
  );

  const removeHistoryItem = React.useCallback(
    (term: string) => {
      const nextHistory = getHistory(historyKey).filter((item) => item !== term);
      setHistory(historyKey, nextHistory);
      setHistoryState(nextHistory);
    },
    [historyKey],
  );

  const visibleItems = React.useMemo<SearchAutoSuggestItem[]>(() => {
    if (query.trim()) return suggestions;
    if (idleItems.length) return idleItems.slice(0, 8);
    return history.map((term) => ({ type: "recent", text: term }));
  }, [history, idleItems, query, suggestions]);

  if (!isOpen) return null;

  const panel = (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.15 }}
      style={isMobile ? undefined : dropdownStyle}
      className={cn(
        isMobile
          ? "relative mt-3 w-full max-w-xl overflow-hidden rounded-2xl border border-kwik-border bg-background shadow-2xl"
          : "fixed z-50 overflow-hidden rounded-2xl border border-kwik-border bg-background shadow-2xl",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-kwik-border px-4 py-3">
        <Search className="h-4 w-4 shrink-0 text-kwik-muted" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") persistAndSearch(query);
          }}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm text-kwik-dark outline-none placeholder:text-kwik-muted"
          aria-label="Search"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="text-kwik-muted transition-colors hover:text-kwik-dark"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      <div className={cn("overflow-y-auto scrollbar-thin", isMobile ? "max-h-[min(72vh,520px)]" : "max-h-[320px]")}>
        {isSearching ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-kwik-orange/30 border-t-kwik-orange" />
          </div>
        ) : null}

        {!isSearching && visibleItems.length ? (
          <div className="py-1">
            {visibleItems.map((item, index) => {
              const Icon = iconMap[item.type] ?? Search;
              return (
                <motion.div
                  key={`${item.type}-${item.id ?? item.text}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.025 }}
                  className="group flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-kwik-bg-surface"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelect(item)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleSelect(item);
                  }}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-kwik-bg-surface transition-colors group-hover:bg-kwik-orange-tint">
                    <Icon className="h-3.5 w-3.5 text-kwik-muted transition-colors group-hover:text-kwik-orange" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-kwik-dark">
                      {item.type === "recent" ? item.text : highlightMatch(item.text, query)}
                    </p>
                    {item.subtext ? (
                      <p className="truncate text-xs text-kwik-gray-light">{item.subtext}</p>
                    ) : null}
                  </div>
                  {item.type === "recent" ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeHistoryItem(item.text);
                      }}
                      className="rounded-full p-1 text-kwik-muted opacity-0 transition-all hover:bg-kwik-bg-light hover:text-kwik-dark group-hover:opacity-100"
                      aria-label={`Remove ${item.text} from history`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  ) : (
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-kwik-muted opacity-0 transition-opacity group-hover:opacity-100" />
                  )}
                </motion.div>
              );
            })}
          </div>
        ) : null}

        {!isSearching && query.trim() && !visibleItems.length ? (
          <div className="px-4 py-8 text-center text-sm text-kwik-muted">{emptyLabel}</div>
        ) : null}

        {!query.trim() && showTrending && !history.length && trendingItems.length ? (
          <div className="px-4 py-3">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-kwik-orange" />
              <p className="text-xs font-semibold uppercase tracking-wider text-kwik-muted">
                Trending
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {trendingItems.map((item) => (
                <button
                  key={item.text}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="rounded-lg bg-kwik-bg-surface px-2.5 py-1.5 text-xs text-kwik-gray transition-colors hover:bg-kwik-orange-tint hover:text-kwik-orange"
                >
                  {item.text}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between border-t border-kwik-border bg-kwik-bg-surface/50 px-4 py-2">
        <span className="text-[10px] text-kwik-muted">
          {footerLabel}
        </span>
        <span className="text-[10px] text-kwik-muted">Esc to close</span>
      </div>
    </motion.div>
  );

  return (
    <AnimatePresence>
      {isMobile ? (
        <motion.div
          className="fixed inset-0 z-50 bg-black/60 px-3 pt-3 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          {panel}
        </motion.div>
      ) : (
        panel
      )}
    </AnimatePresence>
  );
}
