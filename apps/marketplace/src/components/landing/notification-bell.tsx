'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  Eye,
  Package,
  Zap,
  Star,
  PackageCheck,
  Gift,
  Megaphone,
  ExternalLink,
  CheckCheck,
  Inbox,
  ShoppingBag,
  Info,
} from 'lucide-react'
import { Button, Chip } from '@heroui/react'
import { cn } from '@kwikseller/ui'

// --- Types ---

type NotificationCategory = 'orders' | 'promotions' | 'system'

interface Notification {
  id: string
  icon: React.ElementType
  title: string
  description: string
  time: Date
  unread: boolean
  action?: string
  category: NotificationCategory
  iconColor?: string
  iconBg?: string
}

// --- Relative Time Formatting ---

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) return 'just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return `${Math.floor(diffDays / 30)}mo ago`
}

// --- Sample Data ---

const now = new Date()
const sampleNotifications: Notification[] = [
  {
    id: 'notif-1',
    icon: Package,
    title: 'Order #KW-2847 shipped',
    description: 'Your Ankara dress order has been picked up by the courier',
    time: new Date(now.getTime() - 5 * 60 * 1000),
    unread: true,
    action: 'Track Order',
    category: 'orders',
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
  },
  {
    id: 'notif-2',
    icon: Zap,
    title: 'Flash deal alert',
    description: 'iPhone 15 Pro 40% off — ends in 2h',
    time: new Date(now.getTime() - 15 * 60 * 1000),
    unread: true,
    action: 'Shop Now',
    category: 'promotions',
    iconColor: 'text-warning',
    iconBg: 'bg-warning/10',
  },
  {
    id: 'notif-3',
    icon: Star,
    title: 'New review on your product',
    description: 'Adaeze left a 5-star review on your Ankara fabric',
    time: new Date(now.getTime() - 60 * 60 * 1000),
    unread: true,
    action: 'View Review',
    category: 'orders',
    iconColor: 'text-warning',
    iconBg: 'bg-warning/10',
  },
  {
    id: 'notif-4',
    icon: PackageCheck,
    title: 'Order #KW-2831 delivered',
    description: 'Package delivered to Lagos — Gbagada area',
    time: new Date(now.getTime() - 3 * 60 * 60 * 1000),
    unread: false,
    action: 'Confirm Delivery',
    category: 'orders',
    iconColor: 'text-success',
    iconBg: 'bg-success/10',
  },
  {
    id: 'notif-5',
    icon: Gift,
    title: 'KwikCoins earned',
    description: 'You earned 25 KwikCoins for your recent purchase!',
    time: new Date(now.getTime() - 5 * 60 * 60 * 1000),
    unread: false,
    action: 'View Rewards',
    category: 'promotions',
    iconColor: 'text-accent',
    iconBg: 'bg-accent/10',
  },
  {
    id: 'notif-6',
    icon: Megaphone,
    title: 'System update',
    description: 'New vendor tools are available in your dashboard',
    time: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    unread: false,
    action: 'Explore',
    category: 'system',
    iconColor: 'text-default-500',
    iconBg: 'bg-default-100',
  },
  {
    id: 'notif-7',
    icon: ShoppingBag,
    title: 'Order #KW-2901 confirmed',
    description: 'Your order for Samsung Galaxy Buds has been confirmed by the vendor',
    time: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    unread: true,
    action: 'View Order',
    category: 'orders',
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
  },
  {
    id: 'notif-8',
    icon: Info,
    title: 'Scheduled maintenance',
    description: 'Brief maintenance window on Saturday 2AM–4AM WAT',
    time: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    unread: false,
    action: 'Learn More',
    category: 'system',
    iconColor: 'text-default-500',
    iconBg: 'bg-default-100',
  },
]

// --- Category Config ---

const categoryConfig: Record<NotificationCategory, { label: string; icon: React.ElementType; color: string }> = {
  orders: { label: 'Orders', icon: Package, color: 'bg-primary/10 text-primary' },
  promotions: { label: 'Promotions', icon: Zap, color: 'bg-warning/10 text-warning' },
  system: { label: 'System', icon: Info, color: 'bg-default-100 text-default-500' },
}

// --- Animation Variants ---

const panelVariants = {
  hidden: { opacity: 0, scale: 0.92, y: -8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 28,
      staggerChildren: 0.04,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    y: -8,
    transition: { duration: 0.15 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
  },
}

// --- Component ---

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(sampleNotifications)
  const [activeCategory, setActiveCategory] = useState<NotificationCategory | 'all'>('all')
  const containerRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => n.unread).length

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    if (activeCategory === 'all') return notifications
    return notifications.filter((n) => n.category === activeCategory)
  }, [notifications, activeCategory])

  const visibleNotifications = filteredNotifications.slice(0, 6)

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Close on ESC
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
  }, [])

  const markSingleRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    )
  }, [])

  const allRead = unreadCount === 0

  return (
    <div ref={containerRef} className="relative">
      {/* Bell Button */}
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        onPress={() => setIsOpen((prev) => !prev)}
        className="relative"
      >
        <Bell className="w-5 h-5" />

        {/* Unread count badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key={unreadCount}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring' as const, stiffness: 500, damping: 25 }}
              className={cn(
                'absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px]',
                'flex items-center justify-center rounded-full',
                'bg-danger text-white text-[10px] font-bold leading-none px-1',
                'ring-2 ring-background'
              )}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </Button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              'absolute right-0 top-full mt-2 w-[360px] max-w-[calc(100vw-2rem)] z-50',
              'rounded-2xl overflow-hidden',
              'bg-background/95 backdrop-blur-xl',
              'border border-divider shadow-2xl'
            )}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Notifications panel"
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-divider">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <Chip
                    size="sm"
                    variant="soft"
                    className="h-5 text-[10px] px-1.5 bg-accent/10 text-accent"
                  >
                    {unreadCount} new
                  </Chip>
                )}
              </div>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                onPress={markAllRead}
                isDisabled={allRead}
                aria-label="Mark all notifications as read"
                className="text-default-400 hover:text-default-600 min-w-8 w-8 h-8"
              >
                <CheckCheck className="w-4 h-4" />
              </Button>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-1 px-3 py-2 border-b border-divider bg-default-50/50">
              <button
                onClick={() => setActiveCategory('all')}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  activeCategory === 'all'
                    ? 'bg-foreground text-background'
                    : 'text-default-500 hover:bg-default-100 hover:text-foreground'
                )}
              >
                All
              </button>
              {(Object.keys(categoryConfig) as NotificationCategory[]).map((cat) => {
                const config = categoryConfig[cat]
                const CatIcon = config.icon
                const catCount = notifications.filter((n) => n.category === cat && n.unread).length
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                      activeCategory === cat
                        ? 'bg-foreground text-background'
                        : 'text-default-500 hover:bg-default-100 hover:text-foreground'
                    )}
                  >
                    <CatIcon className="w-3 h-3" />
                    {config.label}
                    {catCount > 0 && (
                      <span className={cn(
                        'ml-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[9px] font-bold px-1',
                        activeCategory === cat ? 'bg-background/20 text-background' : 'bg-accent/10 text-accent'
                      )}>
                        {catCount}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Notification List */}
            <div className="max-h-80 overflow-y-auto scrollbar-thin">
              {visibleNotifications.length === 0 ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring' as const, stiffness: 300, damping: 24 }}
                    className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4"
                  >
                    <Inbox className="w-7 h-7 text-success" />
                  </motion.div>
                  <h4 className="font-semibold text-sm mb-1">
                    {allRead ? 'You&apos;re all caught up!' : 'No notifications in this category'}
                  </h4>
                  <p className="text-xs text-default-400 max-w-[220px]">
                    {allRead
                      ? 'We\'ll let you know when something new comes in.'
                      : 'Notifications in this category will appear here.'}
                  </p>
                </div>
              ) : (
                <motion.div
                  variants={{
                    visible: {
                      transition: { staggerChildren: 0.04, delayChildren: 0.08 },
                    },
                  }}
                  initial="hidden"
                  animate="visible"
                  className="divide-y divide-divider"
                >
                  {visibleNotifications.map((notif) => {
                    const Icon = notif.icon
                    return (
                      <motion.div
                        key={notif.id}
                        variants={itemVariants}
                        className={cn(
                          'group relative flex gap-3 px-4 py-3',
                          'transition-colors cursor-pointer',
                          'hover:bg-default-50',
                          notif.unread && 'bg-accent/[0.03]'
                        )}
                        onClick={() => markSingleRead(notif.id)}
                      >
                        {/* Unread dot indicator */}
                        <div className="absolute left-1.5 top-1/2 -translate-y-1/2">
                          <span
                            className={cn(
                              'block w-2 h-2 rounded-full transition-colors',
                              notif.unread ? 'bg-accent' : 'bg-transparent'
                            )}
                          />
                        </div>

                        {/* Icon */}
                        <div
                          className={cn(
                            'flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center',
                            notif.iconBg
                          )}
                        >
                          <Icon className={cn('w-4 h-4', notif.iconColor)} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pl-1">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={cn(
                                'text-xs font-medium leading-tight line-clamp-1',
                                notif.unread ? 'text-foreground' : 'text-default-500'
                              )}
                            >
                              {notif.title}
                            </p>
                            <span className="text-[10px] text-default-400 whitespace-nowrap flex-shrink-0">
                              {formatRelativeTime(notif.time)}
                            </span>
                          </div>
                          <p className="text-[11px] text-default-400 leading-relaxed mt-0.5 line-clamp-2">
                            {notif.description}
                          </p>

                          {/* Action link */}
                          {notif.action && (
                            <div className="mt-1.5">
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1 text-[11px] font-medium',
                                  'kwik-gradient-text'
                                )}
                              >
                                {notif.action}
                                <ExternalLink className="w-3 h-3" />
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </motion.div>
              )}
            </div>

            {/* Panel Footer */}
            <div className="border-t border-divider px-4 py-3">
              <Button
                variant="ghost"
                size="sm"
                className="w-full font-medium"
                onPress={() => setIsOpen(false)}
              >
                View All Notifications
                <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
