"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { SearchFilters as SearchFiltersPanel, type SearchFiltersState } from "./search-filters";
import type { SearchMeta } from "@/lib/api";

interface SearchFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  state: SearchFiltersState;
  meta: SearchMeta | null;
  onChange: (next: Partial<SearchFiltersState>) => void;
  onReset: () => void;
}

export function SearchFilterDrawer({
  open,
  onClose,
  state,
  meta,
  onChange,
  onReset,
}: SearchFilterDrawerProps) {
  // Lock body scroll when open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden"
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-50 flex w-[88%] max-w-sm flex-col bg-background shadow-2xl md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Search filters"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-kwik-border px-4 py-3 dark:border-white/10">
              <h2 className="text-base font-semibold text-kwik-dark dark:text-white">Filters</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close filters"
                className="flex h-8 w-8 items-center justify-center rounded-full text-kwik-muted hover:bg-kwik-bg-light hover:text-kwik-dark dark:hover:bg-white/10 dark:hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body — scrollable */}
            <div className="flex-1 overflow-y-auto px-4">
              <SearchFiltersPanel
                state={state}
                meta={meta}
                onChange={onChange}
                onReset={onReset}
              />
            </div>

            {/* Footer */}
            <div className="border-t border-kwik-border px-4 py-3 dark:border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="h-11 w-full rounded-xl bg-kwik-orange px-4 text-sm font-semibold text-white hover:bg-kwik-orange-hover transition-colors"
              >
                Show results{meta ? ` (${meta.total})` : ""}
              </button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
