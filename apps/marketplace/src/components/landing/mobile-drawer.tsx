'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ArrowRight, LogOut, X } from 'lucide-react'
import { Button, Separator } from '@heroui/react'
import { cn } from '@/lib/utils'
import { PRIMARY_NAV_ITEMS } from '@/constants/navigation'
import { useCategories } from '@/lib/api-hooks'
import { AppImage } from '@/components/ui/app-image'

interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
  onNavigateStart?: () => void
  isAuthenticated: boolean
  user: any
  isAuthLoading: boolean
  onLogout: () => void
}

/**
 * Mobile navigation drawer with expandable accordion sections.
 *
 * The drawer mirrors the five primary nav items (Categories | Products |
 * Vendors | Deals | Resources). Each section expands inline to reveal its
 * child links — users discover child routes without leaving the drawer.
 *
 * Categories is special: its children are fetched live from the backend.
 */
export function MobileDrawer({
  isOpen,
  onClose,
  onNavigateStart,
  isAuthenticated,
  user,
  isAuthLoading,
  onLogout,
}: MobileDrawerProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: categories } = useCategories()

  // Track which accordion sections are expanded. Multiple may be open at once
  // so the user can compare routes across sections.
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // Auto-expand the section that matches the current pathname so the user
  // sees their context on open. Deferred via `queueMicrotask` so it isn't a
  // synchronous setState inside the effect body (lint-safe).
  useEffect(() => {
    if (!isOpen) return
    const matching = PRIMARY_NAV_ITEMS.find((item) => {
      if (item.href === '/') return pathname === '/'
      return pathname === item.href || pathname.startsWith(item.href + '/')
    })
    if (matching) {
      queueMicrotask(() => {
        setExpanded((prev) => {
          if (prev.has(matching.label)) return prev
          const next = new Set(prev)
          next.add(matching.label)
          return next
        })
      })
    }
  }, [isOpen, pathname])

  const toggleSection = (label: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(label)) {
        next.delete(label)
      } else {
        next.add(label)
      }
      return next
    })
  }

  const handleNavigate = (href: string) => {
    onClose()
    onNavigateStart?.()
    router.push(href)
  }

  const visibleCategories = useMemo(() => (categories ?? []).slice(0, 10), [categories])

  return (
    <div className="flex h-full flex-col overflow-y-auto px-6 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => handleNavigate('/')}
          className="flex items-center gap-2"
        >
          <Image
            src="/icon.png"
            alt="KWIKSELLER"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="text-xl font-bold text-foreground">KWIKSELLER</span>
        </button>
        <Button
          isIconOnly
          variant="ghost"
          onPress={onClose}
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Accordion nav */}
      <nav className="mb-4 flex flex-col gap-1" aria-label="Mobile navigation">
        {PRIMARY_NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isExpanded = expanded.has(item.label)
          const isCategories = item.kind === 'categories'

          return (
            <div key={item.label}>
              {/* Section header */}
              <div className="flex items-stretch">
                <button
                  type="button"
                  onClick={() => handleNavigate(item.href)}
                  className={cn(
                    'flex flex-1 items-center gap-3 rounded-l-xl px-4 py-3 text-left text-base font-medium transition-colors',
                    pathname === item.href || pathname.startsWith(item.href + '/')
                      ? 'bg-kwik-orange-tint text-kwik-orange'
                      : 'text-foreground hover:bg-kwik-bg-surface'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
                <button
                  type="button"
                  onClick={() => toggleSection(item.label)}
                  aria-expanded={isExpanded}
                  aria-label={`Expand ${item.label}`}
                  className={cn(
                    'flex w-11 items-center justify-center rounded-r-xl transition-colors',
                    isExpanded
                      ? 'bg-kwik-orange-tint text-kwik-orange'
                      : 'text-muted-foreground hover:bg-kwik-bg-surface'
                  )}
                >
                  <motion.span
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </motion.span>
                </button>
              </div>

              {/* Expandable children */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <div className="ml-3 mt-1 mb-2 flex flex-col gap-0.5 border-l border-kwik-border pl-3">
                      {isCategories
                        ? visibleCategories.map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => handleNavigate(`/categories/${cat.slug || cat.id}`)}
                              className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                                'text-muted-foreground hover:bg-kwik-bg-surface hover:text-foreground'
                              )}
                            >
                              <div className="w-7 h-7 rounded-md overflow-hidden bg-kwik-bg-light flex-shrink-0 flex items-center justify-center">
                                {cat.imageUrl ? (
                                  <AppImage
                                    src={cat.imageUrl}
                                    alt={cat.name}
                                    width={28}
                                    height={28}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xs font-semibold text-muted-foreground">
                                    {cat.name.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <span className="flex-1 truncate text-foreground">{cat.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {cat._count?.products ?? 0}
                              </span>
                            </button>
                          ))
                        : (item.links ?? []).map((link) => {
                            const LinkIcon = link.icon
                            return (
                              <button
                                key={link.label}
                                type="button"
                                onClick={() => handleNavigate(link.href)}
                                className={cn(
                                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                                  'text-muted-foreground hover:bg-kwik-bg-surface hover:text-foreground'
                                )}
                              >
                                <LinkIcon className="h-4 w-4 flex-shrink-0" />
                                <span className="flex-1 text-foreground">{link.label}</span>
                              </button>
                            )
                          })}
                      {/* View all link */}
                      <button
                        type="button"
                        onClick={() => handleNavigate(item.href)}
                        className={cn(
                          'flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium',
                          'text-kwik-orange hover:bg-kwik-orange/10 transition-colors'
                        )}
                      >
                        <span>View all {item.label.toLowerCase()}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </nav>

      <Separator className="mb-4" />

      {/* Profile / auth section */}
      <div className="mt-auto flex flex-col gap-3">
        {isAuthLoading ? null : isAuthenticated && user ? (
          <>
            <button
              type="button"
              onClick={() => handleNavigate('/profile')}
              className="flex items-center gap-3 rounded-xl bg-kwik-bg-surface px-4 py-3 text-left transition-colors hover:bg-kwik-bg-light"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-kwik-orange font-semibold text-white overflow-hidden">
                {user.profile?.avatarUrl ? (
                  <AppImage
                    src={user.profile.avatarUrl}
                    alt={user.profile?.firstName || 'User'}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (user.profile?.firstName || user.email.split('@')[0])
                    .charAt(0)
                    .toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-foreground truncate">
                  {user.profile?.firstName || user.email.split('@')[0]}
                </div>
                <div className="text-xs text-muted-foreground truncate">{user.email}</div>
              </div>
            </button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onPress={() => {
                onLogout()
                onClose()
              }}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              className="w-full"
              onPress={() => {
                onNavigateStart?.()
                router.push('/login')
                onClose()
              }}
            >
              Sign In
            </Button>
            <Button
              variant="primary"
              className="w-full bg-kwik-orange text-white"
              onPress={() => {
                onNavigateStart?.()
                router.push('/register')
                onClose()
              }}
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
