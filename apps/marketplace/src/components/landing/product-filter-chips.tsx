'use client'

import React, { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@kwikseller/ui'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const filters = [
  { label: 'All', value: 'all', icon: null },
  { label: 'Fashion', value: 'fashion', icon: '👗' },
  { label: 'Electronics', value: 'electronics', icon: '📱' },
  { label: 'Beauty', value: 'beauty', icon: '💄' },
  { label: 'Food & Drinks', value: 'food', icon: '🍽️' },
  { label: 'Home & Garden', value: 'home', icon: '🏡' },
  { label: 'Automobiles', value: 'automobiles', icon: '🚗' },
  { label: 'Phones', value: 'phones', icon: '📲' },
]

interface ProductFilterChipsProps {
  activeFilter: string
  onFilterChange: (filter: string) => void
}

export function ProductFilterChips({ activeFilter, onFilterChange }: ProductFilterChipsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollButtons = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    updateScrollButtons()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', updateScrollButtons, { passive: true })
    return () => el.removeEventListener('scroll', updateScrollButtons)
  }, [])

  useEffect(() => {
    // Re-check after active filter changes (might shift scroll)
    const timer = requestAnimationFrame(updateScrollButtons)
    return () => cancelAnimationFrame(timer)
  }, [activeFilter])

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const amount = direction === 'left' ? -200 : 200
    el.scrollBy({ left: amount, behavior: 'smooth' })
  }

  const handleFilterClick = (value: string) => {
    onFilterChange(value)
  }

  return (
    <div className="relative flex items-center gap-2">
      {/* Left scroll arrow — hidden on mobile */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: canScrollLeft ? 1 : 0, pointerEvents: canScrollLeft ? 'auto' : 'none' }}
        transition={{ duration: 0.2 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => scroll('left')}
        className="hidden md:flex absolute -left-3 z-10 w-8 h-8 rounded-full bg-background border border-divider shadow-md items-center justify-center text-default-500 hover:text-accent hover:border-accent transition-colors"
        aria-label="Scroll filters left"
      >
        <ChevronLeft className="w-4 h-4" />
      </motion.button>

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className="flex-1 flex gap-2 overflow-x-auto scrollbar-thin snap-x snap-mandatory scroll-smooth pb-1 md:flex-wrap md:overflow-visible"
      >
        {filters.map((filter) => {
          const isActive = activeFilter === filter.value

          return (
            <motion.button
              key={filter.value}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleFilterClick(filter.value)}
              className={cn(
                'relative flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap snap-start transition-colors select-none',
                isActive
                  ? 'text-white'
                  : 'bg-default-100 text-default-500 hover:bg-default-200'
              )}
              aria-pressed={isActive}
            >
              {/* Active indicator — animated layout */}
              {isActive && (
                <motion.div
                  layoutId="active-filter"
                  className="absolute inset-0 rounded-full kwik-gradient"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              {/* Content */}
              <span className="relative z-10 flex items-center gap-1.5">
                {filter.icon && <span className="text-base leading-none">{filter.icon}</span>}
                {filter.label}
              </span>
            </motion.button>
          )
        })}
      </div>

      {/* Right scroll arrow — hidden on mobile */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: canScrollRight ? 1 : 0, pointerEvents: canScrollRight ? 'auto' : 'none' }}
        transition={{ duration: 0.2 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => scroll('right')}
        className="hidden md:flex absolute -right-3 z-10 w-8 h-8 rounded-full bg-background border border-divider shadow-md items-center justify-center text-default-500 hover:text-accent hover:border-accent transition-colors"
        aria-label="Scroll filters right"
      >
        <ChevronRight className="w-4 h-4" />
      </motion.button>
    </div>
  )
}
