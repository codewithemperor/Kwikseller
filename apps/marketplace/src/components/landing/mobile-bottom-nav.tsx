'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Grid3X3, LayoutGrid, Store, User } from 'lucide-react'
import { usePathname } from 'next/navigation'

interface MobileBottomNavProps {
  onNavigateStart?: () => void
}

interface NavItem {
  label: string
  icon: React.ElementType
  href: string
}

export function MobileBottomNav({ onNavigateStart }: MobileBottomNavProps) {
  const pathname = usePathname()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const navItems: NavItem[] = [
    {
      label: 'Home',
      icon: LayoutGrid,
      href: '/',
    },
    {
      label: 'Categories',
      icon: Grid3X3,
      href: '/categories',
    },
    {
      label: 'Vendors',
      icon: Store,
      href: '/vendors',
    },
    {
      label: 'Profile',
      icon: User,
      href: '/profile',
    },
  ]

  const [activeTab, setActiveTab] = React.useState(() => {
    if (pathname === '/categories') return 'Categories'
    if (pathname.startsWith('/vendors') || pathname.startsWith('/vendor/')) return 'Vendors'
    if (pathname === '/profile' || pathname === '/login' || pathname === '/register') return 'Profile'
    return 'Home'
  })

  React.useEffect(() => {
    if (pathname === '/categories') setActiveTab('Categories')
    else if (pathname.startsWith('/vendors') || pathname.startsWith('/vendor/')) setActiveTab('Vendors')
    else if (pathname === '/profile' || pathname === '/login' || pathname === '/register') setActiveTab('Profile')
    else if (pathname === '/') setActiveTab('Home')
  }, [pathname])

  const handleTap = (item: NavItem) => {
    setActiveTab(item.label)
    if (pathname !== item.href) onNavigateStart?.()
  }

  const iconClass = (isActive: boolean) =>
    `w-5 h-5 transition-colors duration-300 ease-out ${isActive ? 'text-kwik-orange' : 'text-kwik-muted'}`

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[45] md:hidden"
      role="navigation"
      aria-label="Mobile navigation"
    >
      {/* Nav bar container */}
      <div className="bg-background/90 backdrop-blur-xl border-t border-divider">
        <div className="flex items-center justify-around px-1 pt-1.5 pb-[max(env(safe-area-inset-bottom),4px)]">
          {navItems.map((item, index) => {
            const isActive = activeTab === item.label
            const Icon = item.icon

            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring' as const, stiffness: 500, damping: 25, delay: index * 0.05 }}
                whileTap={{ scale: 0.85, y: 1 }}
              >
                <Link
                  href={item.href}
                  onClick={() => handleTap(item)}
                  className="relative flex min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-2"
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

                  {/* Notification dot on Profile icon */}
                  {mounted && item.label === 'Profile' && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-kwik-red ring-2 ring-background" />
                  )}
                </div>

                <span
                  className={isActive ? 'text-[10px] font-medium text-kwik-orange transition-colors duration-300 ease-out' : 'text-[10px] font-medium text-kwik-muted transition-colors duration-300 ease-out'}
                >
                  {item.label}
                </span>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
