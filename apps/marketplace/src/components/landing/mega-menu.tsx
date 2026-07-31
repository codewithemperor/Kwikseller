'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ArrowRight, LayoutGrid } from 'lucide-react'
import { cn } from '@kwikseller/ui'
import {
  MEGA_MENU_CATEGORIES as categories,
  MEGA_MENU_NAV_ITEMS as navItems,
  type DropdownLink,
  type NavItemConfig,
} from '@/constants/navigation'

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

// ─── Category Mega Menu Dropdown ──────────────────────────────

function CategoriesDropdown() {
  return (
    <div className="grid grid-cols-3 gap-1.5 w-[520px] p-3">
      {categories.map((cat) => {
        const Icon = cat.icon
        return (
          <motion.a
            key={cat.name}
            href={cat.href}
            variants={itemVariants}
            className={cn(
              'group flex items-center gap-3 px-3 py-2.5 rounded-xl',
              'bg-kwik-bg-surface/60 hover:bg-kwik-orange/10',
              'border border-transparent hover:border-kwik-orange/20',
              'transition-all duration-200 cursor-pointer'
            )}
          >
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                'bg-kwik-bg-light group-hover:bg-kwik-orange/20 transition-colors duration-200'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 transition-colors duration-200',
                  'text-kwik-gray-light group-hover:text-kwik-orange'
                )}
              />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-kwik-dark group-hover:text-kwik-dark transition-colors truncate">
                {cat.name}
              </div>
              <div className="text-[11px] text-kwik-gray-light group-hover:text-kwik-orange transition-colors">
                {cat.count} products
              </div>
            </div>
          </motion.a>
        )
      })}
      {/* Featured CTA at bottom */}
      <motion.div
        variants={itemVariants}
        className="col-span-3 mt-1"
      >
        <a
          href="/categories"
          className={cn(
            'flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl',
            'kwik-gradient text-white text-sm font-medium',
            'hover:opacity-90 transition-opacity'
          )}
        >
          <span>View All Categories</span>
          <ArrowRight className="w-4 h-4" />
        </a>
      </motion.div>
    </div>
  )
}

// ─── Standard Dropdown (Products / Vendors / Resources) ───────

function StandardDropdown({ links }: { links: DropdownLink[] }) {
  return (
    <div className="grid grid-cols-2 gap-1.5 w-[380px] p-3">
      {links.map((link) => {
        const Icon = link.icon
        return (
          <motion.a
            key={link.label}
            href={link.href}
            variants={itemVariants}
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
                  'text-kwik-gray-light group-hover:text-kwik-orange'
                )}
              />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-kwik-dark group-hover:text-kwik-dark transition-colors">
                {link.label}
              </div>
              <div className="text-[11px] text-kwik-gray-light group-hover:text-kwik-muted transition-colors mt-0.5">
                {link.description}
              </div>
            </div>
          </motion.a>
        )
      })}
    </div>
  )
}

// ─── Nav Item Component ───────────────────────────────────────

function NavItemButton({
  item,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  activeLabel,
}: {
  item: NavItemConfig
  isHovered: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
  activeLabel: string | null
}) {
  return (
    <div
      className="relative"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Trigger */}
      <button
        type="button"
        className={cn(
          'flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
          isHovered ? 'text-kwik-dark' : 'text-kwik-gray hover:text-kwik-dark'
        )}
        aria-expanded={isHovered}
        aria-haspopup="true"
      >
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
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
            >
              <div
                className={cn(
                  'rounded-2xl border border-kwik-border shadow-xl',
                  'bg-kwik-bg-surface/95 backdrop-blur-xl backdrop-saturate-150'
                )}
              >
                <StandardDropdown links={item.links} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Categories Nav Item (special layout) ─────────────────────

function CategoriesNavItem({
  isHovered,
  onMouseEnter,
  onMouseLeave,
}: {
  isHovered: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
}) {
  return (
    <div
      className="relative"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Trigger */}
      <button
        type="button"
        className={cn(
          'flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
          isHovered ? 'text-kwik-dark' : 'text-kwik-gray hover:text-kwik-dark'
        )}
        aria-expanded={isHovered}
        aria-haspopup="true"
      >
        <LayoutGrid className="w-4 h-4 mr-0.5" />
        <span>Categories</span>
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
            {/* Invisible gap filler */}
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
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
            >
              <div
                className={cn(
                  'rounded-2xl border border-kwik-border shadow-xl',
                  'bg-kwik-bg-surface/95 backdrop-blur-xl backdrop-saturate-150'
                )}
              >
                <CategoriesDropdown />
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
      {/* Categories (special mega menu) */}
      <CategoriesNavItem
        isHovered={hoveredItem === 'Categories'}
        onMouseEnter={() => openItem('Categories')}
        onMouseLeave={() => closeItem('Categories')}
      />

      {/* Standard nav items */}
      {navItems.map((item) => (
        <NavItemButton
          key={item.label}
          item={item}
          isHovered={hoveredItem === item.label}
          onMouseEnter={() => openItem(item.label)}
          onMouseLeave={() => closeItem(item.label)}
          activeLabel={hoveredItem}
        />
      ))}
    </nav>
  )
}
