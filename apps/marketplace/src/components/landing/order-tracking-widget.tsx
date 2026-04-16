'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Truck,
  X,
  Package,
  CheckCircle2,
  MapPin,
  CircleCheckBig,
} from 'lucide-react'
import { Button } from '@heroui/react'
import { cn } from '@kwikseller/ui'

// --- Types ---

interface TrackingStage {
  id: string
  label: string
  icon: React.ElementType
  description: string
  time: string
}

// --- Stages Config ---

const trackingStages: TrackingStage[] = [
  {
    id: 'placed',
    label: 'Order Placed',
    icon: Package,
    description: 'Your order has been received',
    time: 'Jan 15, 9:00 AM',
  },
  {
    id: 'confirmed',
    label: 'Confirmed',
    icon: CheckCircle2,
    description: 'Vendor confirmed your order',
    time: 'Jan 15, 9:15 AM',
  },
  {
    id: 'shipped',
    label: 'Shipped',
    icon: Truck,
    description: 'Package picked up by courier',
    time: 'Jan 15, 2:30 PM',
  },
  {
    id: 'out-for-delivery',
    label: 'Out for Delivery',
    icon: MapPin,
    description: 'On the way to your location',
    time: 'Jan 16, 8:00 AM',
  },
  {
    id: 'delivered',
    label: 'Delivered',
    icon: CircleCheckBig,
    description: 'Package delivered successfully',
    time: 'Jan 16, 10:45 AM',
  },
]

const STORAGE_KEY = 'kwikseller-order-tracking-seen'
const WIDGET_DISMISS_KEY = 'kwikseller-order-tracking-dismissed'

// --- Component ---

export function OrderTrackingWidget() {
  const [currentStage, setCurrentStage] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isWidgetDismissed, setIsWidgetDismissed] = useState(false)

  // Show widget after a short delay (simulates "mock order")
  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY)
    const dismissed = localStorage.getItem(WIDGET_DISMISS_KEY)

    if (seen && !dismissed) {
      // Show after a small delay
      const timer = setTimeout(() => setIsVisible(true), 3000)
      return () => clearTimeout(timer)
    } else if (!seen) {
      // First visit: show after delay and mark as seen
      const timer = setTimeout(() => {
        setIsVisible(true)
        localStorage.setItem(STORAGE_KEY, 'true')
      }, 8000)
      return () => clearTimeout(timer)
    }
  }, [])

  // Auto-cycle through stages every 5 seconds
  useEffect(() => {
    if (!isVisible || !isExpanded) return

    const interval = setInterval(() => {
      setCurrentStage((prev) => {
        const next = prev + 1
        return next >= trackingStages.length ? 0 : next
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [isVisible, isExpanded])

  const handleDismiss = useCallback(() => {
    setIsWidgetDismissed(true)
    localStorage.setItem(WIDGET_DISMISS_KEY, 'true')
  }, [])

  const handleTrackOrder = useCallback(() => {
    setIsExpanded(true)
  }, [])

  // Don't render if dismissed
  if (isWidgetDismissed) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Floating trigger button (bottom-left) */}
          <AnimatePresence>
            {!isExpanded && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring' as const, stiffness: 400, damping: 25 }}
                onClick={handleTrackOrder}
                className={cn(
                  'fixed bottom-24 md:bottom-8 left-4 z-50',
                  'w-12 h-12 rounded-full shadow-lg',
                  'bg-success text-white',
                  'flex items-center justify-center',
                  'hover:bg-success/90 active:scale-95',
                  'transition-colors'
                )}
                aria-label="Track your order"
              >
                <Truck className="w-5 h-5" />

                {/* Pulsing ring */}
                <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-20" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Tracking widget panel */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ x: '-120%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '-120%', opacity: 0 }}
                transition={{ type: 'spring' as const, damping: 30, stiffness: 300 }}
                className={cn(
                  'fixed bottom-24 md:bottom-8 left-4 z-50',
                  'w-[340px] max-w-[calc(100vw-2rem)]',
                  'rounded-2xl overflow-hidden',
                  'bg-background/95 backdrop-blur-xl',
                  'border border-divider shadow-2xl'
                )}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-divider bg-success/5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                      <Truck className="w-4 h-4 text-success" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">Track Order</h3>
                      <p className="text-[10px] text-default-400">Order #KW-2847</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      isIconOnly
                      variant="ghost"
                      size="sm"
                      onPress={handleDismiss}
                      aria-label="Dismiss tracking widget"
                      className="min-w-7 w-7 h-7 text-default-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="px-4 pt-3">
                  <div className="flex items-center gap-1">
                    {trackingStages.map((stage, index) => {
                      const isCompleted = index <= currentStage
                      const isCurrent = index === currentStage
                      return (
                        <React.Fragment key={stage.id}>
                          <div className="relative flex-1">
                            <div className="h-1.5 rounded-full bg-default-200 overflow-hidden">
                              <motion.div
                                className={cn(
                                  'h-full rounded-full',
                                  isCompleted ? 'bg-success' : 'bg-default-200'
                                )}
                                initial={{ width: 0 }}
                                animate={{ width: isCompleted ? '100%' : '0%' }}
                                transition={{ duration: 0.6, ease: 'easeOut' as const }}
                              />
                            </div>
                            {isCurrent && (
                              <motion.div
                                className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                              >
                                <span className="absolute inset-0 w-3 h-3 rounded-full bg-success/40 animate-ping" />
                                <span className="relative block w-3 h-3 rounded-full bg-success ring-2 ring-background" />
                              </motion.div>
                            )}
                          </div>
                          {index < trackingStages.length - 1 && (
                            <div className="w-1" />
                          )}
                        </React.Fragment>
                      )
                    })}
                  </div>
                </div>

                {/* Timeline */}
                <div className="px-4 py-3 max-h-64 overflow-y-auto scrollbar-thin">
                  <div className="relative space-y-0">
                    {trackingStages.map((stage, index) => {
                      const StageIcon = stage.icon
                      const isCompleted = index < currentStage
                      const isCurrent = index === currentStage
                      const isPending = index > currentStage
                      const isLast = index === trackingStages.length - 1

                      return (
                        <div key={stage.id} className="relative flex gap-3">
                          {/* Vertical line */}
                          {!isLast && (
                            <div className="flex flex-col items-center">
                              <div
                                className={cn(
                                  'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-500',
                                  isCompleted && 'bg-success text-white',
                                  isCurrent && 'bg-warning text-white',
                                  isPending && 'bg-default-200 text-default-400'
                                )}
                              >
                                <StageIcon className="w-3.5 h-3.5" />
                              </div>
                              <div
                                className={cn(
                                  'w-0.5 flex-1 my-1 transition-colors duration-500',
                                  isCompleted ? 'bg-success' : 'bg-default-200'
                                )}
                              />
                            </div>
                          )}

                          {isLast && (
                            <div
                              className={cn(
                                'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-500',
                                isCompleted && 'bg-success text-white',
                                isCurrent && 'bg-warning text-white',
                                isPending && 'bg-default-200 text-default-400'
                              )}
                            >
                              <StageIcon className="w-3.5 h-3.5" />
                            </div>
                          )}

                          {/* Content */}
                          <div className={cn('pb-4', isLast && 'pb-0')}>
                            <div className="flex items-center gap-2">
                              <p
                                className={cn(
                                  'text-xs font-semibold transition-colors duration-500',
                                  isCompleted && 'text-success',
                                  isCurrent && 'text-warning',
                                  isPending && 'text-default-400'
                                )}
                              >
                                {stage.label}
                              </p>
                              {isCurrent && (
                                <motion.span
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-warning/10 text-warning"
                                >
                                  Current
                                </motion.span>
                              )}
                              {isCompleted && !isCurrent && (
                                <motion.span
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="text-[9px] font-bold text-success"
                                >
                                  ✓
                                </motion.span>
                              )}
                            </div>
                            <p
                              className={cn(
                                'text-[11px] mt-0.5 transition-colors duration-500',
                                isPending ? 'text-default-400' : 'text-default-500'
                              )}
                            >
                              {stage.description}
                            </p>
                            {!isPending && (
                              <p className="text-[10px] text-default-400 mt-0.5">
                                {stage.time}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-divider px-4 py-3 flex items-center justify-between">
                  <p className="text-[10px] text-default-400">
                    Auto-updating • Demo order
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs font-medium text-success"
                    onPress={() => {
                      setCurrentStage((prev) => (prev + 1 >= trackingStages.length ? 0 : prev + 1))
                    }}
                  >
                    Skip Stage
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  )
}
