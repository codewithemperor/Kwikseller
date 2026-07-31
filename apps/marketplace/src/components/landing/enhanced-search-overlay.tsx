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
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@kwikseller/ui'
import { getSimilarSuggestions } from '@/lib/search-similarity'
import {
  POPULAR_SEARCH_CATEGORIES as POPULAR_CATEGORIES,
  SEARCH_HISTORY_KEY as HISTORY_KEY,
  SEARCH_HISTORY_MAX as MAX_HISTORY,
  SEARCH_PRODUCT_SUGGESTIONS as PRODUCT_SUGGESTIONS,
  TRENDING_SEARCH_TERMS as TRENDING_SEARCHES,
  type ProductSuggestion,
} from '@/constants/marketplace'

// ─── History localStorage helpers ────────────────────────────────


// External store for SSR-safe localStorage reads
const historyListeners = new Set<() => void>()
let cachedHistory: string[] = []
let cachedHistoryRaw: string | null = null

function subscribeToHistory(callback: () => void) {
  historyListeners.add(callback)
  return () => {
    historyListeners.delete(callback)
  }
}

function getHistorySnapshot(): string[] {
  if (typeof window === 'undefined') return cachedHistory
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (raw !== cachedHistoryRaw) {
      cachedHistoryRaw = raw
      cachedHistory = raw ? JSON.parse(raw) : []
    }
    return cachedHistory
  } catch {
    return cachedHistory
  }
}

function getHistoryServerSnapshot(): string[] {
  return cachedHistory
}

function emitHistoryChange() {
  // Invalidate cache so next getHistorySnapshot reads fresh data
  cachedHistoryRaw = null
  historyListeners.forEach((listener) => listener())
}

function saveToHistory(term: string) {
  if (typeof window === 'undefined') return
  const trimmed = term.trim()
  if (!trimmed) return
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    const current: string[] = raw ? JSON.parse(raw) : []
    const filtered = current.filter((t) => t.toLowerCase() !== trimmed.toLowerCase())
    filtered.unshift(trimmed)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered.slice(0, MAX_HISTORY)))
    emitHistoryChange()
  } catch {
    // ignore storage errors
  }
}

function removeFromHistory(term: string) {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    const current: string[] = raw ? JSON.parse(raw) : []
    const filtered = current.filter((t) => t !== term)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered))
    emitHistoryChange()
  } catch {
    // ignore storage errors
  }
}

function clearAllHistory() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(HISTORY_KEY)
    emitHistoryChange()
  } catch {
    // ignore storage errors
  }
}

// ─── Text highlight ──────────────────────────────────────────────

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  const parts = text.split(regex)
  return parts.map((part, i) =>
    regex.test(part) ? (
      <span key={i} className="font-semibold text-accent">
        {part}
      </span>
    ) : (
      part
    ),
  )
}

// ─── Component ────────────────────────────────────────────────────

export function EnhancedSearchOverlay({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')

  // Search history state with manual sync
  const [history, setHistory] = useState<string[]>(() => getHistorySnapshot())

  // Subscribe to history changes
  useEffect(() => {
    return subscribeToHistory(() => {
      setHistory(getHistorySnapshot())
    })
  }, [])

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

  // Filter product suggestions
  const filteredSuggestions = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    const exact = PRODUCT_SUGGESTIONS.filter(
      (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q),
    )
    return (exact.length ? exact : getSimilarSuggestions(query, PRODUCT_SUGGESTIONS, 6)).slice(0, 6)
  }, [query])

  const handleSearch = useCallback(
    (term: string) => {
      const trimmed = term.trim()
      if (!trimmed) return
      saveToHistory(trimmed)
      onClose()
      router.push(`/search?q=${encodeURIComponent(trimmed)}`)
    },
    [onClose, router],
  )

  const handleRemoveHistory = useCallback((term: string, e: React.MouseEvent) => {
    e.stopPropagation()
    removeFromHistory(term)
  }, [])

  const handleClearHistory = useCallback(() => {
    clearAllHistory()
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSearch(query)
      }
    },
    [query, handleSearch],
  )

  const handleCategoryClick = useCallback(
    (categoryName: string) => {
      const trimmed = categoryName.trim()
      if (!trimmed) return
      saveToHistory(trimmed)
      onClose()
      router.push(`/search?q=${encodeURIComponent(trimmed)}`)
    },
    [onClose, router],
  )

  const hasQuery = query.trim().length > 0
  const showSuggestions = hasQuery && filteredSuggestions.length > 0
  const showRelated = hasQuery && !PRODUCT_SUGGESTIONS.some((p) => {
    const q = query.toLowerCase()
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
                          <span className="text-xs text-kwik-muted">{filteredSuggestions.length} results</span>
                        </div>
                        <div className="space-y-1">
                          {filteredSuggestions.map((product, index) => (
                            <motion.button
                              key={product.name}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.03 }}
                              onClick={() => handleSearch(product.name)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-kwik-bg-light transition-colors text-left group"
                            >
                              {/* Product image placeholder */}
                              <div
                                className={cn(
                                  'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold',
                                  product.color,
                                )}
                              >
                                {product.initials}
                              </div>
                              <div className="flex-1 min-w-0">
                              <div className="truncate text-sm font-medium text-kwik-dark dark:text-white">
                                  {highlightMatch(product.name, query)}
                                </div>
                                <div className="text-xs text-kwik-gray-light dark:text-white/55">{product.category}</div>
                              </div>
                              <span className="flex-shrink-0 text-sm font-semibold text-kwik-dark dark:text-white">
                                {product.price}
                              </span>
                            </motion.button>
                          ))}
                        </div>
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
                        {history.length > 0 && (
                          <div className="p-4 pb-2">
                            <div className="flex items-center justify-between mb-3 px-1">
                              <h3 className="text-xs font-semibold text-kwik-muted uppercase tracking-wider">
                                Recent Searches
                              </h3>
                              <button
                                onClick={handleClearHistory}
                                className="text-xs text-accent hover:text-accent-foreground transition-colors font-medium"
                              >
                                Clear All
                              </button>
                            </div>
                            <div className="space-y-0.5">
                              {history.map((term, index) => (
                                <motion.div
                                  key={term}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.03 }}
                                  className="group flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-kwik-bg-light transition-colors cursor-pointer"
                                  onClick={() => handleSearch(term)}
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSearch(term)
                                  }}
                                >
                                  <Clock className="w-4 h-4 text-kwik-muted flex-shrink-0" />
                                  <span className="flex-1 truncate text-sm text-kwik-dark dark:text-white">{term}</span>
                                  <button
                                    onClick={(e) => handleRemoveHistory(term, e)}
                                    className="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-kwik-bg-light transition-all text-kwik-muted hover:text-kwik-dark"
                                    aria-label={`Remove "${term}" from history`}
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}

                        {history.length > 0 && (
                          <div className="px-4 pt-2">
                            <div className="h-px bg-divider" />
                          </div>
                        )}

                        {/* Trending Now */}
                        <div className="p-4 pb-2">
                          <div className="flex items-center gap-2 mb-3 px-1">
                            <Flame className="w-4 h-4 text-kwik-orange" />
                            <h3 className="text-xs font-semibold text-kwik-muted uppercase tracking-wider">
                              Trending Now
                            </h3>
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            {TRENDING_SEARCHES.map((item, index) => (
                              <motion.button
                                key={item.term}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.04 }}
                                onClick={() => handleSearch(item.term)}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-kwik-bg-light transition-colors text-left group"
                              >
                                <TrendingUp className="w-3.5 h-3.5 text-kwik-orange flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-sm text-kwik-dark transition-colors group-hover:text-kwik-orange dark:text-white">
                                    {item.term}
                                  </div>
                                  <div className="text-[10px] text-kwik-muted">{item.count}</div>
                                </div>
                              </motion.button>
                            ))}
                          </div>
                        </div>

                        <div className="px-4 pt-2">
                          <div className="h-px bg-divider" />
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
                {!hasQuery && (
                  <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-kwik-border bg-kwik-bg-surface/50">
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
