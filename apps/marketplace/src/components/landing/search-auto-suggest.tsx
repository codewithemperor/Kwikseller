'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Clock,
  X,
  TrendingUp,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { productsApi } from '@kwikseller/api-client'

// ─── Types ─────────────────────────────────────────────────────────

interface SuggestionItem {
  type: 'recent' | 'product' | 'category'
  text: string
  subtext?: string
  icon: React.ElementType
}

// ─── Constants ─────────────────────────────────────────────────────

const TRENDING_CATEGORIES = [
  { name: 'Fashion', count: '12K+' },
  { name: 'Electronics', count: '8K+' },
  { name: 'Phones', count: '10K+' },
  { name: 'Beauty', count: '6K+' },
  { name: 'Home & Garden', count: '9K+' },
  { name: 'Food & Drinks', count: '15K+' },
]

const HISTORY_KEY = 'kwikseller-search-history'
const MAX_HISTORY = 6

// ─── History helpers ──────────────────────────────────────────────

function getHistory(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function removeFromHistory(term: string) {
  if (typeof window === 'undefined') return
  try {
    const current = getHistory()
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(current.filter((t) => t !== term)),
    )
  } catch {
    // ignore
  }
}

// ─── Component ─────────────────────────────────────────────────────

interface SearchAutoSuggestProps {
  isOpen: boolean
  onClose: () => void
  anchorRef: React.RefObject<HTMLElement | null>
}

export function SearchAutoSuggest({
  isOpen,
  onClose,
  anchorRef,
}: SearchAutoSuggestProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [apiResults, setApiResults] = useState<
    Array<{ id: string; name: string; price: number; category: string }>
  >([])
  const [isSearching, setIsSearching] = useState(false)

  // Load history on open
  useEffect(() => {
    if (isOpen) {
      setHistory(getHistory())
      const timer = setTimeout(() => inputRef.current?.focus(), 100)
      return () => clearTimeout(timer)
    }
    setQuery('')
    setApiResults([])
  }, [isOpen])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        anchorRef.current &&
        !anchorRef.current.contains(target)
      ) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen, onClose, anchorRef])

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  // Debounced API search
  useEffect(() => {
    if (!query.trim()) {
      setApiResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const timer = setTimeout(async () => {
      try {
        const response = await productsApi.search(query, 6)
        if (response.success && response.data) {
          const data = response.data as any
          const list = Array.isArray(data) ? data : data.products || []
          setApiResults(
            list.slice(0, 6).map((p: any) => ({
              id: String(p.id),
              name: p.name,
              price: p.price,
              category: p.category?.name || p.categoryName || '',
            })),
          )
        }
      } catch {
        setApiResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = useCallback(
    (term: string) => {
      const trimmed = term.trim()
      if (!trimmed) return
      // Save to history
      try {
        const current = getHistory()
        const filtered = current.filter(
          (t) => t.toLowerCase() !== trimmed.toLowerCase(),
        )
        filtered.unshift(trimmed)
        localStorage.setItem(
          HISTORY_KEY,
          JSON.stringify(filtered.slice(0, MAX_HISTORY)),
        )
      } catch {
        // ignore
      }
      onClose()
      router.push(`/search?q=${encodeURIComponent(trimmed)}`)
    },
    [onClose, router],
  )

  const handleRemoveHistory = useCallback(
    (term: string) => {
      removeFromHistory(term)
      setHistory(getHistory())
    },
    [],
  )

  // Build suggestions list
  const suggestions = useMemo(() => {
    const items: SuggestionItem[] = []

    if (query.trim()) {
      // API results
      apiResults.forEach((r) => {
        items.push({
          type: 'product',
          text: r.name,
          subtext: `${r.category} · ₦${r.price.toLocaleString()}`,
          icon: Search,
        })
      })
    } else {
      // Recent searches
      history.forEach((term) => {
        items.push({
          type: 'recent',
          text: term,
          icon: Clock,
        })
      })
    }

    return items.slice(0, 6)
  }, [query, apiResults, history])

  const showNoResults = query.trim() && !isSearching && apiResults.length === 0

  // ─── Text highlight ──────────────────────────────────────────────

  function highlightMatch(text: string, q: string) {
    if (!q.trim()) return text
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
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

  // Position dropdown below the anchor
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})

  useEffect(() => {
    if (!isOpen || !anchorRef.current) return
    const rect = anchorRef.current.getBoundingClientRect()
    setDropdownStyle({
      top: `${rect.bottom + 6}px`,
      left: `${Math.max(8, rect.left - 8)}px`,
      width: `${Math.min(rect.width + 16, window.innerWidth - 16)}px`,
    })
  }, [isOpen, anchorRef])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.15 }}
          style={dropdownStyle}
          className="fixed z-50 rounded-2xl bg-background border border-kwik-border shadow-2xl overflow-hidden"
        >
          {/* Search input */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-kwik-border">
            <Search className="w-4 h-4 text-kwik-muted flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSelect(query)
              }}
              placeholder="Search products, brands, categories..."
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-kwik-muted text-kwik-dark"
              aria-label="Search"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-kwik-muted hover:text-kwik-dark transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="max-h-[320px] overflow-y-auto scrollbar-thin">
            {/* Loading */}
            {isSearching && (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-kwik-orange/30 border-t-kwik-orange rounded-full animate-spin" />
              </div>
            )}

            {/* No results */}
            {showNoResults && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-8 px-4 text-center"
              >
                <Search className="w-6 h-6 text-kwik-muted mx-auto mb-2" />
                <p className="text-sm text-kwik-dark font-medium">
                  No results found
                </p>
                <p className="text-xs text-kwik-muted mt-1">
                  Try a different search term
                </p>
              </motion.div>
            )}

            {/* Suggestions list */}
            {!isSearching && suggestions.length > 0 && (
              <div className="py-1">
                {suggestions.map((item, index) => {
                  const Icon = item.icon
                  return (
                    <motion.div
                      key={`${item.type}-${item.text}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-kwik-bg-surface cursor-pointer transition-colors group"
                      onClick={() => handleSelect(item.text)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSelect(item.text)
                      }}
                    >
                      <div className="w-8 h-8 rounded-lg bg-kwik-bg-surface flex items-center justify-center flex-shrink-0 group-hover:bg-kwik-orange-tint transition-colors">
                        <Icon className="w-3.5 h-3.5 text-kwik-muted group-hover:text-kwik-orange transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-kwik-dark truncate">
                          {item.type === 'product'
                            ? highlightMatch(item.text, query)
                            : item.text}
                        </p>
                        {item.subtext && (
                          <p className="text-xs text-kwik-gray-light truncate">
                            {item.subtext}
                          </p>
                        )}
                      </div>
                      {/* Remove button for history items */}
                      {item.type === 'recent' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveHistory(item.text)
                          }}
                          className="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-kwik-bg-light transition-all text-kwik-muted hover:text-kwik-dark"
                          aria-label={`Remove "${item.text}" from history`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                      {/* Arrow for product items */}
                      {item.type === 'product' && (
                        <ArrowRight className="w-3.5 h-3.5 text-kwik-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      )}
                    </motion.div>
                  )
                })}
              </div>
            )}

            {/* Trending categories when no query */}
            {!query.trim() && !isSearching && history.length === 0 && (
              <div className="py-3 px-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-3.5 h-3.5 text-kwik-orange" />
                  <p className="text-xs font-semibold text-kwik-muted uppercase tracking-wider">
                    Trending
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {TRENDING_CATEGORIES.map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => handleSelect(cat.name)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-kwik-bg-surface hover:bg-kwik-orange-tint transition-colors text-xs text-kwik-gray hover:text-kwik-orange"
                    >
                      <Sparkles className="w-3 h-3" />
                      {cat.name}
                      <span className="text-[10px] text-kwik-muted">
                        {cat.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-kwik-border bg-kwik-bg-surface/50 flex items-center justify-between">
            <span className="text-[10px] text-kwik-muted">
              Press <kbd className="px-1 py-0.5 rounded bg-kwik-bg-light text-[9px] font-mono mx-0.5 border border-kwik-border">Enter</kbd> to search
            </span>
            <span className="text-[10px] text-kwik-muted">
              <kbd className="px-1 py-0.5 rounded bg-kwik-bg-light text-[9px] font-mono mx-0.5 border border-kwik-border">Esc</kbd> to close
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
