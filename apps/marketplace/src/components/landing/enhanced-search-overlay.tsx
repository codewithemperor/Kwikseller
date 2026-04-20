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

// ─── Data ─────────────────────────────────────────────────────────

const TRENDING_SEARCHES = [
  { term: 'Ankara dresses', count: '12.5K results' },
  { term: 'Wireless earbuds', count: '8.3K results' },
  { term: 'iPhone 15', count: '15.2K results' },
  { term: 'Brazilian hair', count: '6.7K results' },
  { term: 'Samsung TV', count: '9.1K results' },
  { term: 'Jordans', count: '11.8K results' },
]

const POPULAR_CATEGORIES = [
  { icon: Shirt, name: 'Fashion', count: '12K+', color: 'bg-pink-500/10 text-pink-500' },
  { icon: Smartphone, name: 'Electronics', count: '8K+', color: 'bg-cyan-500/10 text-cyan-500' },
  { icon: Gem, name: 'Beauty', count: '6K+', color: 'bg-purple-500/10 text-purple-500' },
  { icon: Home, name: 'Home & Garden', count: '9K+', color: 'bg-amber-500/10 text-amber-500' },
  { icon: Smartphone, name: 'Phones', count: '10K+', color: 'bg-emerald-500/10 text-emerald-500' },
  { icon: UtensilsCrossed, name: 'Food & Drinks', count: '15K+', color: 'bg-orange-500/10 text-orange-500' },
]

interface ProductSuggestion {
  name: string
  price: string
  category: string
  initials: string
  color: string
}

const PRODUCT_SUGGESTIONS: ProductSuggestion[] = [
  { name: 'Ankara Maxi Dress', price: '₦8,500', category: 'Fashion', initials: 'AM', color: 'bg-pink-500' },
  { name: 'iPhone 15 Pro Max', price: '₦850,000', category: 'Phones', initials: 'IP', color: 'bg-gray-800' },
  { name: 'Samsung 55" Smart TV', price: '₦320,000', category: 'Electronics', initials: 'ST', color: 'bg-blue-600' },
  { name: 'Brazilian Body Wave Hair', price: '₦45,000', category: 'Beauty', initials: 'BH', color: 'bg-purple-500' },
  { name: 'AirPods Pro 2nd Gen', price: '₦95,000', category: 'Electronics', initials: 'AP', color: 'bg-gray-700' },
  { name: 'Jordans Retro 4', price: '₦180,000', category: 'Fashion', initials: 'JR', color: 'bg-red-500' },
  { name: 'Whitening Face Cream', price: '₦3,500', category: 'Beauty', initials: 'WF', color: 'bg-rose-400' },
  { name: 'King Size Bed Frame', price: '₦150,000', category: 'Home & Garden', initials: 'KB', color: 'bg-amber-600' },
  { name: 'Wireless Bluetooth Speaker', price: '₦12,000', category: 'Electronics', initials: 'WS', color: 'bg-teal-500' },
  { name: 'Orijin Bitter Lemon', price: '₦800', category: 'Food & Drinks', initials: 'OB', color: 'bg-green-600' },
  { name: 'Samsung Galaxy S24', price: '₦650,000', category: 'Phones', initials: 'SG', color: 'bg-indigo-500' },
  { name: 'Lace Complete Material', price: '₦25,000', category: 'Fashion', initials: 'LC', color: 'bg-fuchsia-500' },
  { name: 'Portable Power Bank', price: '₦5,500', category: 'Electronics', initials: 'PP', color: 'bg-slate-600' },
  { name: 'Coffee Maker Machine', price: '₦35,000', category: 'Home & Garden', initials: 'CM', color: 'bg-yellow-700' },
  { name: 'MAC Matte Lipstick', price: '₦6,500', category: 'Beauty', initials: 'ML', color: 'bg-red-600' },
]

// ─── History localStorage helpers ────────────────────────────────

const HISTORY_KEY = 'kwikseller-search-history'
const MAX_HISTORY = 8

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
    return PRODUCT_SUGGESTIONS.filter(
      (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q),
    ).slice(0, 6)
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
  const showNoResults = hasQuery && filteredSuggestions.length === 0

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
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Main container */}
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 top-0 z-50 mx-auto w-full max-w-2xl px-4 pt-4 sm:top-8 sm:pt-0"
          >
            <div className="flex flex-col max-h-[85vh] sm:max-h-[80vh]">
              {/* Search bar - glassmorphism */}
              <div className="relative rounded-2xl bg-background/90 backdrop-blur-xl border border-divider shadow-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4">
                  <Search className="w-5 h-5 text-default-400 flex-shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search products, stores, categories..."
                    className="flex-1 bg-transparent outline-none text-base placeholder:text-default-400 text-foreground"
                    aria-label="Search"
                    role="searchbox"
                  />
                  {hasQuery && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      onClick={() => setQuery('')}
                      className="p-1 rounded-full hover:bg-default-100 transition-colors text-default-400 hover:text-foreground"
                      aria-label="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  )}
                  <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 rounded-md bg-default-100 text-[11px] text-default-400 font-mono border border-default-200">
                    ESC
                  </kbd>
                </div>
              </div>

              {/* Content panel */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.2 }}
                className="mt-2 rounded-2xl bg-background/95 backdrop-blur-xl border border-divider shadow-2xl overflow-hidden"
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
                          <h3 className="text-xs font-semibold text-default-400 uppercase tracking-wider">
                            Suggestions
                          </h3>
                          <span className="text-xs text-default-400">{filteredSuggestions.length} results</span>
                        </div>
                        <div className="space-y-1">
                          {filteredSuggestions.map((product, index) => (
                            <motion.button
                              key={product.name}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.03 }}
                              onClick={() => handleSearch(product.name)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-default-100 transition-colors text-left group"
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
                                <div className="text-sm font-medium truncate text-foreground">
                                  {highlightMatch(product.name, query)}
                                </div>
                                <div className="text-xs text-default-400">{product.category}</div>
                              </div>
                              <span className="text-sm font-semibold text-foreground flex-shrink-0">
                                {product.price}
                              </span>
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* ── No Results ── */}
                    {showNoResults && (
                      <motion.div
                        key="no-results"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="p-8 text-center"
                      >
                        <div className="w-16 h-16 rounded-full bg-default-100 flex items-center justify-center mx-auto mb-4">
                          <Search className="w-7 h-7 text-default-300" />
                        </div>
                        <p className="text-sm font-medium text-foreground mb-1">No results found</p>
                        <p className="text-xs text-default-400">
                          Try searching for &quot;Ankara dresses&quot;, &quot;iPhone&quot;, or &quot;Samsung&quot;
                        </p>
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
                              <h3 className="text-xs font-semibold text-default-400 uppercase tracking-wider">
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
                                  className="group flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-default-100 transition-colors cursor-pointer"
                                  onClick={() => handleSearch(term)}
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSearch(term)
                                  }}
                                >
                                  <Clock className="w-4 h-4 text-default-300 flex-shrink-0" />
                                  <span className="flex-1 text-sm text-foreground truncate">{term}</span>
                                  <button
                                    onClick={(e) => handleRemoveHistory(term, e)}
                                    className="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-default-200 transition-all text-default-400 hover:text-foreground"
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
                            <Flame className="w-4 h-4 text-orange-400" />
                            <h3 className="text-xs font-semibold text-default-400 uppercase tracking-wider">
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
                                className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-default-100 transition-colors text-left group"
                              >
                                <TrendingUp className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm text-foreground truncate group-hover:text-accent transition-colors">
                                    {item.term}
                                  </div>
                                  <div className="text-[10px] text-default-400">{item.count}</div>
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
                            <Sparkles className="w-4 h-4 text-accent" />
                            <h3 className="text-xs font-semibold text-default-400 uppercase tracking-wider">
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
                                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-default-100 transition-all cursor-pointer group"
                              >
                                <div
                                  className={cn(
                                    'w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110',
                                    cat.color,
                                  )}
                                >
                                  <cat.icon className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-medium text-foreground">{cat.name}</span>
                                <span className="text-[10px] text-default-400">{cat.count}</span>
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
                  <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-divider bg-default-50/50">
                    <span className="text-[11px] text-default-400">
                      Press{' '}
                      <kbd className="px-1 py-0.5 rounded bg-default-100 text-[10px] font-mono mx-0.5 border border-default-200">
                        Enter
                      </kbd>{' '}
                      to search
                    </span>
                    <span className="text-default-300">&middot;</span>
                    <span className="text-[11px] text-default-400">
                      <kbd className="px-1 py-0.5 rounded bg-default-100 text-[10px] font-mono mx-0.5 border border-default-200">
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
