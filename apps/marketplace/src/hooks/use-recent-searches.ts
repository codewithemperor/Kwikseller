"use client";

/**
 * useRecentSearches
 * -----------------
 * Persists the buyer's recent search queries to localStorage so they
 * survive page refreshes and navigation. Capped at MAX_ITEMS entries
 * and deduplicated case-insensitively.
 *
 * Implemented with `useSyncExternalStore` so React 19's
 * `react-hooks/set-state-in-effect` lint rule is satisfied (no
 * `setState` calls in effect bodies) and cross-tab updates are
 * reactive.
 *
 * Used by the /search page (no-query state) and the search overlay.
 */

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "kwik:recent-searches";
const MAX_ITEMS = 8;
const CHANGE_EVENT = "kwik:recent-searches-changed";

export interface RecentSearch {
  query: string;
  timestamp: number;
}

function readStore(): RecentSearch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (x): x is RecentSearch =>
          x && typeof x.query === "string" && typeof x.timestamp === "number",
      )
      .slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

function writeStore(items: RecentSearch[]) {
  if (typeof window === "undefined") return;
  try {
    if (items.length === 0) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(items.slice(0, MAX_ITEMS)),
      );
    }
    // Notify same-tab subscribers (the `storage` event only fires cross-tab).
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    /* ignore quota / private mode errors */
  }
}

// ── useSyncExternalStore glue ─────────────────────────────────────────────

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function getSnapshot(): RecentSearch[] {
  return readStore();
}

function getServerSnapshot(): RecentSearch[] {
  return EMPTY;
}

// Cache the parsed snapshot to keep referential stability across renders
// (useSyncExternalStore requires getSnapshot to return a stable reference
// when nothing has changed).
let cachedSnapshot: RecentSearch[] | null = null;
let cachedRaw: string | null = null;

function getStableSnapshot(): RecentSearch[] {
  if (typeof window === "undefined") return EMPTY;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw && cachedSnapshot) return cachedSnapshot;
  cachedRaw = raw;
  cachedSnapshot = readStore();
  return cachedSnapshot;
}

const EMPTY: RecentSearch[] = [];

export function useRecentSearches() {
  const items = useSyncExternalStore(subscribe, getStableSnapshot, getServerSnapshot);

  const addSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const current = readStore();
    const filtered = current.filter(
      (x) => x.query.toLowerCase() !== trimmed.toLowerCase(),
    );
    const next = [{ query: trimmed, timestamp: Date.now() }, ...filtered].slice(
      0,
      MAX_ITEMS,
    );
    writeStore(next);
  }, []);

  const removeSearch = useCallback((query: string) => {
    const current = readStore();
    const next = current.filter(
      (x) => x.query.toLowerCase() !== query.toLowerCase(),
    );
    writeStore(next);
  }, []);

  const clearSearches = useCallback(() => {
    writeStore([]);
  }, []);

  return {
    items,
    addSearch,
    removeSearch,
    clearSearches,
  };
}
