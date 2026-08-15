'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Package, Heart, LogOut, ChevronDown } from 'lucide-react'
import { cn } from '@kwikseller/ui'
import { AppImage } from '@/components/ui/app-image'

interface ProfileDropdownProps {
  user: any
  onNavigateStart?: () => void
  onLogout: () => void
}

/**
 * Desktop profile button: avatar + dropdown.
 *
 * Per the marketplace navigation spec, the avatar stands alone — the user's
 * name is NOT shown beside it on desktop. The dropdown exposes the real
 * account actions: My Profile, My Orders, Wishlist, Logout.
 */
export function ProfileDropdown({ user, onNavigateStart, onLogout }: ProfileDropdownProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const displayName = user?.profile?.firstName || user?.email?.split('@')[0] || 'User'
  const avatarUrl = user?.profile?.avatarUrl

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen])

  const navigate = useCallback(
    (href: string) => {
      setIsOpen(false)
      onNavigateStart?.()
      router.push(href)
    },
    [onNavigateStart, router],
  )

  const menuItems = [
    { label: 'My Profile', href: '/profile', icon: User },
    { label: 'My Orders', href: '/orders', icon: Package },
    { label: 'Wishlist', href: '/wishlist', icon: Heart },
  ]

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Account menu"
        className={cn(
          'flex items-center gap-1 rounded-full p-0.5 transition-colors',
          isOpen ? 'bg-kwik-bg-light' : 'hover:bg-kwik-bg-light'
        )}
      >
        <div className="w-9 h-9 rounded-full overflow-hidden bg-kwik-orange flex items-center justify-center font-semibold text-white text-sm">
          {avatarUrl ? (
            <AppImage
              src={avatarUrl}
              alt={displayName}
              width={36}
              height={36}
              className="w-full h-full object-cover"
            />
          ) : (
            displayName.charAt(0).toUpperCase()
          )}
        </div>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 text-muted-foreground transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Invisible gap filler so mouse can travel from button to dropdown */}
            <div className="absolute top-full right-0 h-2 w-full" aria-hidden />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full right-0 z-50 w-60 pt-2"
            >
              <div className="rounded-2xl border border-kwik-border shadow-xl bg-kwik-bg-surface/95 backdrop-blur-xl overflow-hidden">
                {/* User info header */}
                <div className="px-4 py-3 border-b border-kwik-border">
                  <div className="text-sm font-medium text-foreground truncate">
                    {displayName}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-1.5">
                  {menuItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.href}
                        type="button"
                        onClick={() => navigate(item.href)}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-foreground hover:bg-kwik-bg-surface transition-colors"
                      >
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        {item.label}
                      </button>
                    )
                  })}
                </div>

                {/* Logout */}
                <div className="border-t border-kwik-border py-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false)
                      onLogout()
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-kwik-red hover:bg-kwik-bg-surface transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
