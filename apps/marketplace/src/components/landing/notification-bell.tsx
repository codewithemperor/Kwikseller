'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
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
} from 'lucide-react'
import { Button, Chip } from '@heroui/react'
import { cn } from '@kwikseller/ui'

// --- Types ---

interface Notification {
  id: string
  icon: React.ElementType
  title: string
  description: string
  time: string
  unread: boolean
  action?: string
  iconColor?: string
  iconBg?: string
}

// --- Sample Data ---

const sampleNotifications: Notification[] = [
  {
    id: 'notif-1',
    icon: Package,
    title: 'Order #KW-2847 shipped',
    description: 'Your Ankara dress order has been picked up by the courier',
    time: '5 min ago',
    unread: true,
    action: 'Track Order',
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
  },
  {
    id: 'notif-2',
    icon: Zap,
    title: 'Flash deal alert',
    description: 'iPhone 15 Pro 40% off — ends in 2h',
    time: '15 min ago',
    unread: true,
    action: 'Shop Now',
    iconColor: 'text-warning',
    iconBg: 'bg-warning/10',
  },
  {
    id: 'notif-3',
    icon: Star,
    title: 'New review on your product',
    description: 'Adaeze left a 5-star review on your Ankara fabric',
    time: '1 hour ago',
    unread: true,
    action: 'View Review',
    iconColor: 'text-warning',
    iconBg: 'bg-warning/10',
  },
  {
    id: 'notif-4',
    icon: PackageCheck,
    title: 'Order #KW-2831 delivered',
    description: 'Package delivered to Lagos — Gbagada area',
    time: '3 hours ago',
    unread: false,
    action: 'Confirm Delivery',
    iconColor: 'text-success',
    iconBg: 'bg-success/10',
  },
  {
    id: 'notif-5',
    icon: Gift,
    title: 'KwikCoins earned',
    description: 'You earned 25 KwikCoins for your recent purchase!',
    time: '5 hours ago',
    unread: false,
    action: 'View Rewards',
    iconColor: 'text-accent',
    iconBg: 'bg-accent/10',
  },
  {
    id: 'notif-6',
    icon: Megaphone,
    title: 'System update',
    description: 'New vendor tools are available in your dashboard',
    time: '1 day ago',
    unread: false,
    action: 'Explore',
    iconColor: 'text-default-500',
    iconBg: 'bg-default-100',
  },
]

// --- Animation Variants ---

const panelVariants = {
  hidden: { opacity: 0, scale: 0.92, y: -8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
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
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
}

// --- Component ---

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] =
    useState<Notification[]>(sampleNotifications)
  const containerRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => n.unread).length

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
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, unread: false }))
    )
  }, [])

  const visibleNotifications = notifications.slice(0, 6)

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
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
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

        {/* Red dot (when unread but zero visible count after mark read) */}
        {unreadCount === 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-danger ring-2 ring-background" />
        )}
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
              'absolute right-0 top-full mt-2 w-80 z-50',
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
                    variant="flat"
                    className="h-5 text-[10px] px-1.5 bg-accent/10 text-accent"
                  >
                    {unreadCount} new
                  </Chip>
                )}
              </div>
              <Button
                isIconOnly
                size="sm"
                variant="flat"
                onPress={markAllRead}
                aria-label="Mark all notifications as read"
                className="text-default-400 hover:text-default-600 min-w-8 w-8 h-8"
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>

            {/* Notification List */}
            <div className="max-h-96 overflow-y-auto scrollbar-thin">
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
                      onClick={() => {
                        // Mark individual as read
                        setNotifications((prev) =>
                          prev.map((n) =>
                            n.id === notif.id ? { ...n, unread: false } : n
                          )
                        )
                      }}
                    >
                      {/* Unread dot indicator */}
                      <div className="absolute left-1.5 top-1/2 -translate-y-1/2">
                        <span
                          className={cn(
                            'block w-2 h-2 rounded-full transition-colors',
                            notif.unread
                              ? 'bg-accent'
                              : 'bg-default-300'
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
                              notif.unread
                                ? 'text-foreground'
                                : 'text-default-500'
                            )}
                          >
                            {notif.title}
                          </p>
                          <span className="text-[10px] text-default-400 whitespace-nowrap flex-shrink-0">
                            {notif.time}
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
            </div>

            {/* Panel Footer */}
            <div className="border-t border-divider px-4 py-3">
              <Button
                variant="flat"
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
