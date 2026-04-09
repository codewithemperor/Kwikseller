'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingBag, MapPin, EyeOff } from 'lucide-react'
import { Button } from '@heroui/react'

const notifications = [
  { buyer: 'Amina K.', city: 'Lagos', product: 'Ankara Print Dress', time: '2 min ago', color: 'bg-pink-500' },
  { buyer: 'Kwame M.', city: 'Accra', product: 'Wireless Earbuds Pro', time: '5 min ago', color: 'bg-blue-500' },
  { buyer: 'Fatima I.', city: 'Abuja', product: 'Natural Shea Butter', time: '8 min ago', color: 'bg-amber-500' },
  { buyer: 'David O.', city: 'Nairobi', product: 'Phone Case Premium', time: '3 min ago', color: 'bg-green-500' },
  { buyer: 'Grace N.', city: 'Kumasi', product: 'African Wall Art Set', time: '12 min ago', color: 'bg-purple-500' },
  { buyer: 'Ibrahim T.', city: 'Kano', product: 'Leather Sandals', time: '6 min ago', color: 'bg-orange-500' },
  { buyer: 'Chidinma A.', city: 'Port Harcourt', product: 'Hair Growth Oil', time: '1 min ago', color: 'bg-rose-500' },
  { buyer: 'Yusuf B.', city: 'Dakar', product: 'Bluetooth Speaker', time: '15 min ago', color: 'bg-cyan-500' },
  { buyer: 'Ngozi E.', city: 'Enugu', product: 'Kitchen Blender Set', time: '9 min ago', color: 'bg-red-500' },
  { buyer: 'Moussa D.', city: 'Abidjan', product: 'Football Jersey', time: '7 min ago', color: 'bg-emerald-500' },
  { buyer: 'Aisha B.', city: 'Kaduna', product: 'Handwoven Basket', time: '4 min ago', color: 'bg-teal-500' },
  { buyer: 'Emeka O.', city: 'Owerri', product: 'Smart Watch Band', time: '11 min ago', color: 'bg-indigo-500' },
]

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export function LiveActivityFeed() {
  const [feedEnabled, setFeedEnabled] = useState(true)
  const [currentNotification, setCurrentNotification] = useState<typeof notifications[0] | null>(null)
  const [notificationKey, setNotificationKey] = useState(0)
  const [isDismissed, setIsDismissed] = useState(false)
  const hasStartedRef = useRef(false)

  const showNext = useCallback(() => {
    // Pick a random notification different from the current one
    setCurrentNotification((prev) => {
      let nextIndex: number
      do {
        nextIndex = Math.floor(Math.random() * notifications.length)
      } while (
        notifications[nextIndex] === prev &&
        notifications.length > 1
      )

      return notifications[nextIndex]
    })

    setNotificationKey((k) => k + 1)
    setIsDismissed(false)

    // Show for 4 seconds, then dismiss
    setTimeout(() => {
      setIsDismissed(true)
    }, 4000)
  }, [])

  // Initial startup + cycling effect
  useEffect(() => {
    if (!feedEnabled) return

    // Initial delay of 3 seconds before first notification
    const initialDelay = setTimeout(() => {
      hasStartedRef.current = true
      showNext()
    }, 3000)

    // Cycle every 8 seconds with a random inner delay
    const cycleTimer = setInterval(() => {
      const jitter = Math.random() * 2000
      setTimeout(() => {
        showNext()
      }, jitter)
    }, 8000)

    return () => {
      clearTimeout(initialDelay)
      clearInterval(cycleTimer)
    }
  }, [feedEnabled, showNext])

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDismissed(true)
  }

  const handleDisableFeed = () => {
    setFeedEnabled(false)
  }

  if (!feedEnabled) return null

  return (
    <div className="fixed bottom-20 md:bottom-8 left-4 z-30 flex flex-col gap-2">
      {/* Close all button */}
      <Button
        isIconOnly
        size="sm"
        variant="flat"
        className="w-7 h-7 min-w-7 bg-white/80 dark:bg-default-100/80 backdrop-blur-md border border-default-200/50 rounded-full"
        onPress={handleDisableFeed}
        aria-label="Disable activity feed"
      >
        <EyeOff className="w-3 h-3 text-default-400" />
      </Button>

      {/* Notification card */}
      <AnimatePresence mode="wait">
        {currentNotification && (
          <motion.div
            key={notificationKey}
            initial={{ x: -320, opacity: 0 }}
            animate={
              isDismissed
                ? { x: -320, opacity: 0 }
                : { x: 0, opacity: 1 }
            }
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative"
          >
            <div className="flex items-start gap-3 bg-white/70 dark:bg-default-100/70 backdrop-blur-xl border border-default-200/50 rounded-lg shadow-lg p-3 w-[280px] sm:w-[320px]">
              {/* Dismiss button */}
              <button
                onClick={handleDismiss}
                className="absolute top-2 right-2 w-5 h-5 rounded-full hover:bg-default-200/50 dark:hover:bg-default-300/30 flex items-center justify-center transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="w-3 h-3 text-default-400" />
              </button>

              {/* Product thumbnail */}
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-lg ${currentNotification.color} flex items-center justify-center`}
              >
                <span className="text-white text-xs font-bold">
                  {getInitials(currentNotification.product)}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pr-5">
                <div className="flex items-center gap-1 text-default-500">
                  <ShoppingBag className="w-3 h-3 flex-shrink-0" />
                  <span className="text-[11px] font-medium truncate">
                    Someone purchased
                  </span>
                </div>
                <p className="text-sm font-semibold text-default-800 dark:text-default-200 truncate mt-0.5">
                  {currentNotification.product}
                </p>
                <div className="flex items-center gap-1.5 mt-1 text-default-400">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="text-[11px] truncate">
                    {currentNotification.city} · {currentNotification.time}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
