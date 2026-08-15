'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ArrowRight } from 'lucide-react'
import { cn } from '@kwikseller/ui'
import {
  PRIMARY_NAV_ITEMS,
  type DropdownLink,
  type NavItemConfig,
} from '@/constants/navigation'
import { useCategories } from '@/lib/api-hooks'
import { AppImage } from '@/components/ui/app-image'

// ─── Animation variants ───────────────────────────────────────

const dropdownVariants = {
  hidden: {
    opacity: 0,
    y: -8,
    scale: 0.97,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      damping: 25,
      stiffness: 300,
      staggerChildren: 0.03,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.97,
    transition: {
      duration: 0.15,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
}

// ─── Categories Mega Menu Dropdown ──────────────────────────────
// Categories are fetched live from the backend so the menu always
// reflects the real category tree (no hardcoded counts).

function CategoriesDropdown({ onNavigate }: { onNavigate?: () => void }) {
  const { data: categories, isLoading } = useCategories()

  // Show up to 9 categories in the grid; the "View All" CTA covers the rest.
  const visible = (categories ?? []).slice(0, 9)

  return (
    <div className="grid grid-cols-3 gap-1.5 w-[520px] p-3">
      {isLoading
        ? Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-kwik-bg-light/60 animate-pulse"
            >
              <div className="w-10 h-10 rounded-lg bg-kwik-bg-light" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-20 rounded bg-kwik-bg-light" />
                <div className="h-2.5 w-14 rounded bg-kwik-bg-light/70" />
              </div>
            </div>
          ))
        : visible.map((cat) => (
            <motion.div key={cat.id} variants={itemVariants}>
              <Link
                href={`/categories/${cat.slug || cat.id}`}
                onClick={onNavigate}
                className={cn(
                  'group flex items-center gap-3 px-3 py-2.5 rounded-xl',
                  'bg-kwik-bg-surface/60 hover:bg-kwik-orange/10',
                  'border border-transparent hover:border-kwik-orange/20',
                  'transition-all duration-200 cursor-pointer'
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden',
                    'bg-kwik-bg-light group-hover:bg-kwik-orange/20 transition-colors duration-200'
                  )}
                >
                  {cat.imageUrl ? (
                    <AppImage
                      src={cat.imageUrl}
                      alt={cat.name}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-kwik-gray-light group-hover:text-kwik-orange">
                      {cat.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground group-hover:text-foreground transition-colors truncate">
                    {cat.name}
                  </div>
                  <div className="text-[11px] text-muted-foreground group-hover:text-kwik-orange transition-colors">
                    {cat._count?.products ?? 0} products
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
      {/* View All CTA — solid, NO gradient */}
      <motion.div variants={itemVariants} className="col-span-3 mt-1">
        <Link
          href="/categories"
          onClick={onNavigate}
          className={cn(
            'flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl',
            'bg-kwik-orange text-white text-sm font-medium',
            'hover:bg-kwik-orange/90 transition-colors'
          )}
        >
          <span>View All Categories</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>
    </div>
  )
}

// ─── Standard Dropdown (Products / Vendors / Deals / Resources) ───────

function StandardDropdown({
  links,
  viewAllHref,
  onNavigate,
}: {
  links: DropdownLink[]
  viewAllHref: string
  onNavigate?: () => void
}) {
  return (
    <div className="p-3 w-[400px]">
      <div className="grid grid-cols-2 gap-1.5">
        {links.map((link) => {
          const Icon = link.icon
          return (
            <motion.div key={link.label} variants={itemVariants}>
              <Link
                href={link.href}
                onClick={onNavigate}
                className={cn(
                  'group flex items-start gap-3 px-3 py-3 rounded-xl',
                  'bg-kwik-bg-surface/60 hover:bg-kwik-orange/10',
                  'border border-transparent hover:border-kwik-orange/20',
                  'transition-all duration-200 cursor-pointer'
                )}
              >
                <div
                  className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                    'bg-kwik-bg-light group-hover:bg-kwik-orange/20 transition-colors duration-200'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4 transition-colors duration-200',
                      'text-muted-foreground group-hover:text-kwik-orange'
                    )}
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground group-hover:text-foreground transition-colors">
                    {link.label}
                  </div>
                  <div className="text-[11px] text-muted-foreground group-hover:text-kwik-orange transition-colors mt-0.5">
                    {link.description}
                  </div>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>
      {/* View All CTA — solid, NO gradient */}
      <motion.div variants={itemVariants} className="mt-2">
        <Link
          href={viewAllHref}
          onClick={onNavigate}
          className={cn(
            'flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl',
            'bg-kwik-orange text-white text-sm font-medium',
            'hover:bg-kwik-orange/90 transition-colors'
          )}
        >
          <span>Explore All</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>
    </div>
  )
}

// ─── Nav Item Component ───────────────────────────────────────

function NavItemButton({
  item,
  isHovered,
  onOpen,
  onClose,
}: {
  item: NavItemConfig
  isHovered: boolean
  onOpen: () => void
  onClose: () => void
  onNavigate?: () => void
}) {
  const Icon = item.icon
  return (
    <div
      className="relative"
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
    >
      {/* Trigger */}
      <button
        type="button"
        className={cn(
          'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
          isHovered ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
        )}
        aria-expanded={isHovered}
        aria-haspopup="true"
      >
        <Icon className="w-4 h-4" />
        <span>{item.label}</span>
        <motion.span
          animate={{ rotate: isHovered ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-3.5 h-3.5 opacity-60" />
        </motion.span>

        {/* Active underline indicator */}
        {isHovered && (
          <motion.span
            layoutId="mega-nav-indicator"
            className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-kwik-orange"
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          />
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isHovered && (
          <>
            {/* Invisible gap filler so mouse can travel from button to dropdown */}
            <div className="absolute top-full left-0 right-0 h-2" aria-hidden />
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={dropdownVariants}
              className={cn(
                'absolute top-full left-1/2 -translate-x-1/2 z-30 pt-2',
                'pointer-events-auto'
              )}
              onMouseEnter={onOpen}
              onMouseLeave={onClose}
            >
              <div
                className={cn(
                  'rounded-2xl border border-kwik-border shadow-xl',
                  'bg-kwik-bg-surface/95 backdrop-blur-xl backdrop-saturate-150'
                )}
              >
                {item.kind === 'categories' ? (
                  <CategoriesDropdown />
                ) : (
                  <StandardDropdown links={item.links ?? []} viewAllHref={item.href} />
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main MegaNav Component ───────────────────────────────────

export function MegaNav() {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navRef = useRef<HTMLDivElement>(null)

  const openItem = useCallback((label: string) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    setHoveredItem(label)
  }, [])

  const closeItem = useCallback((label: string) => {
    // 200ms delay to prevent accidental close when moving mouse between button and dropdown
    closeTimerRef.current = setTimeout(() => {
      setHoveredItem((prev) => (prev === label ? null : prev))
    }, 200)
  }, [])

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setHoveredItem(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close on scroll
  useEffect(() => {
    function handleScroll() {
      setHoveredItem(null)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    }
  }, [])

  return (
    <nav
      ref={navRef}
      className="hidden md:flex items-center gap-1"
      aria-label="Main navigation"
    >
      {PRIMARY_NAV_ITEMS.map((item) => (
        <NavItemButton
          key={item.label}
          item={item}
          isHovered={hoveredItem === item.label}
          onOpen={() => openItem(item.label)}
          onClose={() => closeItem(item.label)}
        />
      ))}
    </nav>
  )
}
