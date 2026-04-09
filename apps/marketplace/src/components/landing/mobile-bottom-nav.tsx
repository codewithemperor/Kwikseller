'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { LayoutGrid, Grid3X3, Search, ShoppingCart, User } from 'lucide-react'
import { useCartStore } from '@/stores'

interface MobileBottomNavProps {
  onSearchOpen?: () => void
}

interface NavItem {
  label: string
  icon: React.ElementType
  action: () => void
}

export function MobileBottomNav({ onSearchOpen }: MobileBottomNavProps) {
  const itemCount = useCartStore((s) => s.itemCount)
  const setCartOpen = useCartStore((s) => s.setCartOpen)
  const [mounted, setMounted] = React.useState(false)
  const count = mounted ? itemCount() : 0

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const navItems: NavItem[] = [
    {
      label: 'Home',
      icon: LayoutGrid,
      action: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
    },
    {
      label: 'Categories',
      icon: Grid3X3,
      action: () => {
        const el = document.getElementById('categories')
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      },
    },
    {
      label: 'Search',
      icon: Search,
      action: () => onSearchOpen?.(),
    },
    {
      label: 'Cart',
      icon: ShoppingCart,
      action: () => setCartOpen(true),
    },
    {
      label: 'Profile',
      icon: User,
      action: () => {
        window.location.href = '/login'
      },
    },
  ]

  const [activeTab, setActiveTab] = React.useState('Home')

  const handleTap = (item: NavItem) => {
    setActiveTab(item.label)
    item.action()
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[45] bg-background/90 backdrop-blur-xl border-t border-divider md:hidden"
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around px-1 pt-1 pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const isActive = activeTab === item.label
          const Icon = item.icon

          return (
            <motion.button
              key={item.label}
              whileTap={{ scale: 0.88, y: -2 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              onClick={() => handleTap(item)}
              className="relative flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-w-[56px] rounded-xl transition-colors"
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active indicator dot */}
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-accent"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}

              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-colors duration-200 ${
                    isActive ? 'text-accent' : 'text-default-400'
                  }`}
                />

                {/* Cart badge - only render after mount to avoid hydration mismatch */}
                {item.label === 'Cart' && mounted && count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-2 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-accent text-white text-[10px] font-bold leading-none px-1"
                  >
                    {count > 99 ? '99+' : count}
                  </motion.span>
                )}
              </div>

              <span
                className={`text-[10px] font-medium transition-colors duration-200 ${
                  isActive ? 'text-accent' : 'text-default-400'
                }`}
              >
                {item.label}
              </span>
            </motion.button>
          )
        })}
      </div>
    </nav>
  )
}
