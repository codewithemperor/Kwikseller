'use client'

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  X,
  Clock,
  TrendingUp,
  Flame,
  Sparkles,
  Shirt,
  Smartphone,
  Gem,
  Home,
  UtensilsCrossed,
  Loader2,
  Package,
  Store as StoreIcon,
  Tag,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { getSimilarSuggestions } from '@/lib/search-similarity'
import {
  POPULAR_SEARCH_CATEGORIES as POPULAR_CATEGORIES,
  SEARCH_PRODUCT_SUGGESTIONS as PRODUCT_SUGGESTIONS,
} from '@/constants/marketplace'
import { useTrendingSearches, useSearchSuggestions } from '@/lib/api-hooks'
import { useRecentSearches } from '@/hooks'

// ─── Text highlight ──────────────────────────────────────────────

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  const parts = text.split(regex)
  return parts.map((part, i) =>
    regex.test(part) ? (
      <span key={i} className="font-semibold text-kwik-orange">
        {part}
      </span>
    ) : (
      part
    ),
  )
}

// ─── Suggestion type icon ────────────────────────────────────────

function SuggestionIcon({ label }: { label: string }) {
  // Heuristic: pick an icon based on the suggestion source so the user
  // can tell whether the suggestion is a product, brand, store, or category.
  const lower = label.toLowerCase()
  if (lower.includes('dress') || lower.includes('shirt') || lower.includes('sneaker') || lower.includes('fashion')) {
    return <Shirt className="h-4 w-4 text-pink-500" />
  }
  if (lower.includes('phone') || lower.includes('iphone') || lower.includes('samsung') || lower.includes('earbud') || lower.includes('speaker')) {
    return <Smartphone className="h-4 w-4 text-cyan-500" />
  }
  if (lower.includes('beauty') || lower.includes('serum') || lower.includes('cream') || lower.includes('makeup')) {
    return <Gem className="h-4 w-4 text-purple-500" />
  }
  if (lower.includes('kitchen') || lower.includes('home') || lower.includes('decor') || lower.includes('bed')) {
    return <Home className="h-4 w-4 text-amber-500" />
  }
  if (lower.includes('food') || lower.includes('coffee') || lower.includes('rice') || lower.includes('drink')) {
    return <UtensilsCrossed className="h-4 w-4 text-emerald-500" />
  }
  return <Package className="h-4 w-4 text-kwik-orange" />
}

// ─── Component ────────────────────────────────────────────────────

export function EnhancedSearchOverlay({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')

  // Unified recent searches hook (same one used by /search page).
  const { items: recentSearches, addSearch, removeSearch, clearSearches } = useRecentSearches()

  // Live API-powered suggestions — debounced via React Query cache.
  const trimmedQuery = query.trim()
  const suggestionsQuery = useSearchSuggestions(trimmedQuery, trimmedQuery.length > 0)
  const liveSuggestions = suggestionsQuery.data ?? []

  // Live API-powered trending searches.
  const trendingQuery = useTrendingSearches(8)
  const trendingItems = trendingQuery.data ?? []

  // Focus input when overlay opens
  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(() => inputRef.current?.focus(), 150)
    return () => clearTimeout(timer)
  }, [isOpen])

  // ESC to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isOpen])

  // Filter local product suggestions (kept as a richer visual fallback
  // so the overlay always has something to show even if the API is slow).
  const localSuggestions = useMemo(() => {
    if (!trimmedQuery) return []
    const q = trimmedQuery.toLowerCase()
    const exact = PRODUCT_SUGGESTIONS.filter(
      (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q),
    )
    return (exact.length ? exact : getSimilarSuggestions(trimmedQuery, PRODUCT_SUGGESTIONS, 4)).slice(0, 4)
  }, [trimmedQuery])

  // Merge live API suggestions with local ones, deduped by label (case-insensitive).
  const mergedSuggestions = useMemo(() => {
    if (!trimmedQuery) return []
    const seen = new Set<string>()
    const merged: Array<{ label: string; source: 'api' | 'local' }> = []
    for (const s of liveSuggestions) {
      const key = s.toLowerCase()
      if (!seen.has(key)) {
        seen.add(key)
        merged.push({ label: s, source: 'api' })
      }
    }
    for (const p of localSuggestions) {
      const key = p.name.toLowerCase()
      if (!seen.has(key)) {
        seen.add(key)
        merged.push({ label: p.name, source: 'local' })
      }
    }
    return merged.slice(0, 8)
  }, [liveSuggestions, localSuggestions, trimmedQuery])

  // Keyboard navigation: which suggestion row is currently highlighted?
  // -1 = none, 0..N-1 = index into `mergedSuggestions`.
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const suggestionsListRef = useRef<HTMLDivElement>(null)

  // Reset highlight whenever the suggestion list changes (new query → new list).
  // Uses the "storing info from previous renders" pattern instead of a setState
  // in effect — see https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevSuggestionsLen, setPrevSuggestionsLen] = useState(mergedSuggestions.length)
  if (prevSuggestionsLen !== mergedSuggestions.length) {
    setPrevSuggestionsLen(mergedSuggestions.length)
    setHighlightedIndex(-1)
  }

  // Scroll the highlighted row into view within the suggestions container.
  useEffect(() => {
    if (highlightedIndex < 0) return
    const el = suggestionsListRef.current
    if (!el) return
    const child = el.children[highlightedIndex] as HTMLElement | undefined
    child?.scrollIntoView({ block: 'nearest' })
  }, [highlightedIndex])

  const handleSearch = useCallback(
    (term: string) => {
      const trimmed = term.trim()
      if (!trimmed) return
      addSearch(trimmed)
      onClose()
      router.push(`/search?q=${encodeURIComponent(trimmed)}`)
    },
    [addSearch, onClose, router],
  )

  const handleRemoveHistory = useCallback((term: string, e: React.MouseEvent) => {
    e.stopPropagation()
    removeSearch(term)
  }, [removeSearch])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // ↑ / ↓ navigate the merged-suggestion list, Enter triggers a search.
      if (e.key === 'ArrowDown') {
        if (mergedSuggestions.length === 0) return
        e.preventDefault()
        setHighlightedIndex((prev) =>
          prev < 0 || prev >= mergedSuggestions.length - 1 ? 0 : prev + 1,
        )
        return
      }
      if (e.key === 'ArrowUp') {
        if (mergedSuggestions.length === 0) return
        e.preventDefault()
        setHighlightedIndex((prev) =>
          prev <= 0 ? mergedSuggestions.length - 1 : prev - 1,
        )
        return
      }
      if (e.key === 'Enter') {
        if (highlightedIndex >= 0 && mergedSuggestions[highlightedIndex]) {
          handleSearch(mergedSuggestions[highlightedIndex].label)
        } else {
          handleSearch(query)
        }
      }
    },
    [query, handleSearch, highlightedIndex, mergedSuggestions],
  )

  const handleCategoryClick = useCallback(
    (categoryName: string) => {
      const trimmed = categoryName.trim()
      if (!trimmed) return
      addSearch(trimmed)
      onClose()
      router.push(`/search?q=${encodeURIComponent(trimmed)}`)
    },
    [addSearch, onClose, router],
  )

  const hasQuery = trimmedQuery.length > 0
  const showSuggestions = hasQuery && mergedSuggestions.length > 0
  const showNoResults = hasQuery && !suggestionsQuery.isLoading && mergedSuggestions.length === 0
  const showRelated = hasQuery && !PRODUCT_SUGGESTIONS.some((p) => {
    const q = trimmedQuery.toLowerCase()
    return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
  })

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Full-screen backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-md"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Main container */}
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 top-0 z-[100] mx-auto w-full max-w-2xl px-4 pt-4 sm:top-8 sm:pt-0"
          >
            <div className="flex flex-col max-h-[85vh] sm:max-h-[80vh]">
              {/* Search bar - glassmorphism */}
              <div className="relative rounded-2xl bg-background/90 backdrop-blur-xl border border-kwik-border shadow-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4">
                  <Search className="w-5 h-5 text-kwik-muted flex-shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search products, stores, categories..."
                    className="flex-1 bg-transparent text-base text-kwik-dark outline-none placeholder:text-kwik-muted dark:text-white"
                    aria-label="Search"
                    role="searchbox"
                  />
                  {hasQuery && suggestionsQuery.isLoading && (
                    <Loader2 className="h-4 w-4 animate-spin text-kwik-orange" aria-label="Loading suggestions" />
                  )}
                  {hasQuery && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      onClick={() => setQuery('')}
                      className="p-1 rounded-full hover:bg-kwik-bg-light transition-colors text-kwik-muted hover:text-kwik-dark"
                      aria-label="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  )}
                  <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 rounded-md bg-kwik-bg-light text-[11px] text-kwik-muted font-mono border border-kwik-border">
                    ESC
                  </kbd>
                </div>
              </div>

              {/* Content panel */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.2 }}
                className="mt-2 rounded-2xl bg-kwik-bg-surface/95 dark:bg-background/95 backdrop-blur-xl border border-kwik-border shadow-2xl overflow-hidden"
              >
                <div className="overflow-y-auto max-h-[60vh] sm:max-h-[55vh]">
                  <AnimatePresence mode="wait">
                    {/* ── Search Suggestions (when typing) ── */}
                    {showSuggestions && (
                      <motion.div
                        key="suggestions"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="p-4"
                      >
                        <div className="flex items-center justify-between mb-3 px-1">
                          <h3 className="text-xs font-semibold text-kwik-muted uppercase tracking-wider">
                            {showRelated ? 'Similar picks' : 'Suggestions'}
                          </h3>
                          <span className="text-xs text-kwik-muted">{mergedSuggestions.length} results</span>
                        </div>
                        <div className="space-y-1" ref={suggestionsListRef} role="listbox" aria-label="Search suggestions">
                          {mergedSuggestions.map((suggestion, index) => {
                            const localMatch = PRODUCT_SUGGESTIONS.find(
                              (p) => p.name.toLowerCase() === suggestion.label.toLowerCase(),
                            )
                            const isHighlighted = index === highlightedIndex
                            return (
                              <motion.button
                                key={`${suggestion.label}-${index}`}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.03 }}
                                onClick={() => handleSearch(suggestion.label)}
                                onMouseEnter={() => setHighlightedIndex(index)}
                                aria-selected={isHighlighted}
                                role="option"
                                className={cn(
                                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left group',
                                  isHighlighted
                                    ? 'bg-kwik-orange-tint/60 ring-1 ring-kwik-orange/30'
                                    : 'hover:bg-kwik-bg-light',
                                )}
                              >
                                {/* Icon + colored chip */}
                                {localMatch ? (
                                  <div
                                    className={cn(
                                      'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold',
                                      localMatch.color,
                                    )}
                                  >
                                    {localMatch.initials}
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-kwik-orange-tint text-kwik-orange">
                                    <SuggestionIcon label={suggestion.label} />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="truncate text-sm font-medium text-kwik-dark dark:text-white">
                                    {highlightMatch(suggestion.label, trimmedQuery)}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs text-kwik-gray-light dark:text-white/55">
                                    {localMatch ? (
                                      <>
                                        <Tag className="h-3 w-3" />
                                        {localMatch.category}
                                      </>
                                    ) : (
                                      <>
                                        <StoreIcon className="h-3 w-3" />
                                        Marketplace
                                      </>
                                    )}
                                  </div>
                                </div>
                                {localMatch && (
                                  <span className="flex-shrink-0 text-sm font-semibold text-kwik-dark dark:text-white">
                                    {localMatch.price}
                                  </span>
                                )}
                              </motion.button>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}

                    {/* ── No-results while typing ── */}
                    {showNoResults && (
                      <motion.div
                        key="no-results"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="p-8 text-center"
                      >
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-kwik-orange-tint text-kwik-orange">
                          <Search className="h-7 w-7" />
                        </div>
                        <p className="mt-3 font-heading text-base font-bold text-foreground">
                          No matches for &ldquo;{trimmedQuery}&rdquo;
                        </p>
                        <p className="mt-1 text-sm text-kwik-muted">
                          Try a different keyword, or browse trending searches below.
                        </p>
                        {trendingItems.length > 0 && (
                          <div className="mt-4 flex flex-wrap justify-center gap-2">
                            {trendingItems.slice(0, 4).map((t) => (
                              <button
                                key={t.id}
                                onClick={() => handleSearch(t.label)}
                                className="inline-flex items-center gap-1.5 rounded-full border border-kwik-border-light bg-kwik-bg-surface px-3 py-1.5 text-xs font-medium text-kwik-dark transition hover:border-kwik-orange hover:text-kwik-orange dark:text-white"
                              >
                                <TrendingUp className="h-3 w-3" />
                                {t.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* ── Default state (no query) ── */}
                    {!hasQuery && (
                      <motion.div
                        key="default"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        {/* Recent Searches */}
                        {recentSearches.length > 0 && (
                          <div className="p-4 pb-2">
                            <div className="flex items-center justify-between mb-3 px-1">
                              <h3 className="text-xs font-semibold text-kwik-muted uppercase tracking-wider">
                                Recent Searches
                              </h3>
                              <button
                                onClick={clearSearches}
                                className="text-xs text-kwik-orange hover:text-kwik-orange-dark transition-colors font-medium"
                              >
                                Clear All
                              </button>
                            </div>
                            <div className="space-y-0.5">
                              {recentSearches.map((item, index) => (
                                <motion.div
                                  key={`${item.query}-${item.timestamp}`}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.03 }}
                                  className="group flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-kwik-bg-light transition-colors cursor-pointer"
                                  onClick={() => handleSearch(item.query)}
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSearch(item.query)
                                  }}
                                >
                                  <Clock className="w-4 h-4 text-kwik-muted flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <span className="block truncate text-sm text-kwik-dark dark:text-white">{item.query}</span>
                                    <span className="block text-[10px] text-kwik-muted">
                                      {formatRelative(item.timestamp)}
                                    </span>
                                  </div>
                                  <button
                                    onClick={(e) => handleRemoveHistory(item.query, e)}
                                    className="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-kwik-bg-light transition-all text-kwik-muted hover:text-kwik-dark"
                                    aria-label={`Remove "${item.query}" from history`}
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}

                        {recentSearches.length > 0 && (
                          <div className="px-4 pt-2">
                            <div className="h-px bg-kwik-border-light" />
                          </div>
                        )}

                        {/* Trending Now (live from API) */}
                        <div className="p-4 pb-2">
                          <div className="flex items-center gap-2 mb-3 px-1">
                            <Flame className="w-4 h-4 text-kwik-orange" />
                            <h3 className="text-xs font-semibold text-kwik-muted uppercase tracking-wider">
                              Trending Now
                            </h3>
                            {trendingQuery.isLoading && (
                              <Loader2 className="h-3 w-3 animate-spin text-kwik-muted" />
                            )}
                          </div>
                          {trendingQuery.isLoading ? (
                            <div className="grid grid-cols-2 gap-1">
                              {Array.from({ length: 6 }).map((_, i) => (
                                <div
                                  key={i}
                                  className="h-12 rounded-xl bg-kwik-bg-light/60 animate-pulse"
                                />
                              ))}
                            </div>
                          ) : trendingItems.length > 0 ? (
                            <div className="grid grid-cols-2 gap-1">
                              {trendingItems.map((item, index) => (
                                <motion.button
                                  key={item.id}
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.04 }}
                                  onClick={() => handleSearch(item.label)}
                                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-kwik-bg-light transition-colors text-left group"
                                >
                                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-kwik-orange-tint text-[10px] font-bold text-kwik-orange">
                                    {index + 1}
                                  </span>
                                  <TrendingUp className="w-3.5 h-3.5 text-kwik-orange flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <div className="truncate text-sm text-kwik-dark transition-colors group-hover:text-kwik-orange dark:text-white">
                                      {item.label}
                                    </div>
                                    <div className="text-[10px] text-kwik-muted">
                                      {item.count.toLocaleString()} searches
                                    </div>
                                  </div>
                                </motion.button>
                              ))}
                            </div>
                          ) : (
                            <p className="px-3 py-2 text-xs text-kwik-muted">Trending searches unavailable.</p>
                          )}
                        </div>

                        <div className="px-4 pt-2">
                          <div className="h-px bg-kwik-border-light" />
                        </div>

                        {/* Popular Categories */}
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-3 px-1">
                            <Sparkles className="w-4 h-4 text-kwik-orange" />
                            <h3 className="text-xs font-semibold text-kwik-muted uppercase tracking-wider">
                              Popular Categories
                            </h3>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {POPULAR_CATEGORIES.map((cat, index) => (
                              <motion.button
                                key={cat.name}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => handleCategoryClick(cat.name)}
                                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-kwik-bg-light transition-all cursor-pointer group"
                              >
                                <div
                                  className={cn(
                                    'w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110',
                                    cat.color,
                                  )}
                                >
                                  <cat.icon className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-medium text-kwik-dark dark:text-white">{cat.name}</span>
                                <span className="text-[10px] text-kwik-muted">{cat.count}</span>
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Footer hint */}
                {(!hasQuery || showSuggestions) && (
                  <div className="flex flex-wrap items-center justify-center gap-2 px-4 py-3 border-t border-kwik-border bg-kwik-bg-surface/50">
                    {showSuggestions && (
                      <>
                        <span className="text-[11px] text-kwik-muted">
                          <kbd className="px-1 py-0.5 rounded bg-kwik-bg-light text-[10px] font-mono mx-0.5 border border-kwik-border">
                            ↑ ↓
                          </kbd>{' '}
                          to navigate
                        </span>
                        <span className="text-kwik-muted">&middot;</span>
                      </>
                    )}
                    <span className="text-[11px] text-kwik-muted">
                      Press{' '}
                      <kbd className="px-1 py-0.5 rounded bg-kwik-bg-light text-[10px] font-mono mx-0.5 border border-kwik-border">
                        Enter
                      </kbd>{' '}
                      to search
                    </span>
                    <span className="text-kwik-muted">&middot;</span>
                    <span className="text-[11px] text-kwik-muted">
                      <kbd className="px-1 py-0.5 rounded bg-kwik-bg-light text-[10px] font-mono mx-0.5 border border-kwik-border">
                        ESC
                      </kbd>{' '}
                      to close
                    </span>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────

function formatRelative(timestamp: number): string {
  const diff = Date.now() - timestamp
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d ago`
  return new Date(timestamp).toLocaleDateString('en-NG', { dateStyle: 'medium' })
}
