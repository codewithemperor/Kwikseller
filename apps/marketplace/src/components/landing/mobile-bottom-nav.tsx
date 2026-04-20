'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { LayoutGrid, Grid3X3, Search, ShoppingCart, User } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
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
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = React.useState(false)
  const count = mounted ? itemCount() : 0

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const navItems: NavItem[] = [
    {
      label: 'Home',
      icon: LayoutGrid,
      action: () => router.push('/'),
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
      action: () => router.push('/cart'),
    },
    {
      label: 'Profile',
      icon: User,
      action: () => {
        window.location.href = '/login'
      },
    },
  ]

  const [activeTab, setActiveTab] = React.useState(() => {
    if (pathname === '/cart') return 'Cart'
    if (pathname === '/login' || pathname === '/register') return 'Profile'
    return 'Home'
  })

  React.useEffect(() => {
    if (pathname === '/cart') setActiveTab('Cart')
    else if (pathname === '/login' || pathname === '/register') setActiveTab('Profile')
    else if (pathname === '/') setActiveTab('Home')
  }, [pathname])

  const handleTap = (item: NavItem) => {
    setActiveTab(item.label)
    item.action()
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[45] md:hidden"
      role="navigation"
      aria-label="Mobile navigation"
    >
      {/* Glow/shadow above the nav bar */}
      <div className="absolute -top-6 left-0 right-0 h-6 bg-black/[0.08] dark:bg-black/20 pointer-events-none" />

      {/* Nav bar container */}
      <div className="bg-background/90 backdrop-blur-xl border-t border-divider">
        <div className="flex items-center justify-around px-1 pt-1.5 pb-[env(safe-area-inset-bottom)]">
          {navItems.map((item) => {
            const isActive = activeTab === item.label
            const Icon = item.icon

            return (
              <motion.button
                key={item.label}
                whileTap={{ scale: 0.85, y: 1 }}
                transition={{ type: 'spring' as const, stiffness: 500, damping: 25 }}
                onClick={() => handleTap(item)}
                className="relative flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-w-[56px] rounded-xl"
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Active indicator bar — smoother transition with longer spring */}
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-[3px] rounded-full bg-accent"
                    transition={{ type: 'spring' as const, stiffness: 400, damping: 35, mass: 0.8 }}
                  />
                )}

                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-colors duration-300 ease-out ${
                      isActive ? 'text-accent' : 'text-default-400'
                    }`}
                  />

                  {/* Cart badge — only render after mount to avoid hydration mismatch */}
                  {item.label === 'Cart' && mounted && count > 0 && (
                    <motion.span
                      key={count}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring' as const, stiffness: 500, damping: 25 }}
                      className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-accent text-white text-[10px] font-bold leading-none px-1 shadow-sm"
                    >
                      {count > 99 ? '99+' : count}
                    </motion.span>
                  )}

                  {/* Notification dot on Profile icon */}
                  {item.label === 'Profile' && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-danger ring-2 ring-background" />
                  )}
                </div>

                <span
                  className={`text-[10px] font-medium transition-colors duration-300 ease-out ${
                    isActive ? 'text-accent' : 'text-default-400'
                  }`}
                >
                  {item.label}
                </span>
              </motion.button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
