'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { LayoutGrid, Grid3X3, Search, ShoppingCart, User, Heart } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useCartStore, useWishlistStore } from '@/stores'

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
  const wishlistCount = useWishlistStore((s) => s.itemCount)
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
      label: 'Wishlist',
      icon: Heart,
      action: () => router.push('/wishlist'),
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
    if (pathname === '/wishlist') setActiveTab('Wishlist')
    else if (pathname === '/cart') setActiveTab('Cart')
    else if (pathname === '/login' || pathname === '/register') setActiveTab('Profile')
    else if (pathname === '/') setActiveTab('Home')
  }, [pathname])

  const handleTap = (item: NavItem) => {
    setActiveTab(item.label)
    item.action()
  }

  const iconClass = (isActive: boolean) =>
    `w-5 h-5 transition-colors duration-300 ease-out ${isActive ? 'text-kwik-orange' : 'text-kwik-muted'}`

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
        <div className="flex items-center justify-around px-1 pt-1.5 pb-[max(env(safe-area-inset-bottom),4px)]">
          {navItems.map((item, index) => {
            const isActive = activeTab === item.label
            const Icon = item.icon

            return (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring' as const, stiffness: 500, damping: 25, delay: index * 0.05 }}
                whileTap={{ scale: 0.85, y: 1 }}
                onClick={() => handleTap(item)}
                className="relative flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-w-[56px] rounded-xl"
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-[3px] rounded-full bg-kwik-orange"
                    style={{ boxShadow: '0 0 8px rgba(234, 88, 12, 0.4)' }}
                    transition={{ type: 'spring' as const, stiffness: 400, damping: 35, mass: 0.8 }}
                  />
                )}

                <div className="relative">
                  <Icon className={iconClass(isActive)} />

                  {/* Cart badge */}
                  {item.label === 'Cart' && mounted && count > 0 && (
                    <motion.span
                      key={count}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
                      transition={{ type: 'spring' as const, stiffness: 500, damping: 25 }}
                      className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-kwik-orange text-white text-[10px] font-bold leading-none px-1 shadow-sm"
                    >
                      {count > 99 ? '99+' : count}
                    </motion.span>
                  )}

                  {/* Wishlist badge */}
                  {item.label === 'Wishlist' && mounted && wishlistCount > 0 && (
                    <motion.span
                      key={wishlistCount}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring' as const, stiffness: 500, damping: 25 }}
                      className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-kwik-red text-white text-[10px] font-bold leading-none px-1 shadow-sm"
                    >
                      {wishlistCount > 99 ? '99+' : wishlistCount}
                    </motion.span>
                  )}

                  {/* Notification dot on Profile icon */}
                  {item.label === 'Profile' && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-kwik-red ring-2 ring-background" />
                  )}
                </div>

                <span
                  className={isActive ? 'text-[10px] font-medium text-kwik-orange transition-colors duration-300 ease-out' : 'text-[10px] font-medium text-kwik-muted transition-colors duration-300 ease-out'}
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
