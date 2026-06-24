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
import { cn } from '@kwikseller/ui'

// --- Types ---

interface TrackingStage {
  id: string
  label: string
  icon: React.ElementType
  description: string
}

// --- Stages Config ---

const trackingStages: TrackingStage[] = [
  {
    id: 'placed',
    label: 'Order Placed',
    icon: Package,
    description: 'Your order has been received',
  },
  {
    id: 'confirmed',
    label: 'Confirmed',
    icon: CheckCircle2,
    description: 'Vendor confirmed your order',
  },
  {
    id: 'shipped',
    label: 'Shipped',
    icon: Truck,
    description: 'Package picked up by courier',
  },
  {
    id: 'out-for-delivery',
    label: 'Out for Delivery',
    icon: MapPin,
    description: 'On the way to your location',
  },
  {
    id: 'delivered',
    label: 'Delivered',
    icon: CircleCheckBig,
    description: 'Package delivered successfully',
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
      const timer = setTimeout(() => setIsVisible(true), 3000)
      return () => clearTimeout(timer)
    } else if (!seen) {
      const timer = setTimeout(() => {
        setIsVisible(true)
        localStorage.setItem(STORAGE_KEY, 'true')
      }, 8000)
      return () => clearTimeout(timer)
    }
  }, [])

  // Auto-advance stages every 3 seconds
  useEffect(() => {
    if (!isVisible) return

    const interval = setInterval(() => {
      setCurrentStage((prev) => {
        const next = prev + 1
        return next >= trackingStages.length ? 0 : next
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [isVisible])

  const handleDismiss = useCallback(() => {
    setIsWidgetDismissed(true)
    localStorage.setItem(WIDGET_DISMISS_KEY, 'true')
  }, [])

  const handleTrackOrder = useCallback(() => {
    setIsExpanded(true)
  }, [])

  const handleClose = useCallback(() => {
    setIsExpanded(false)
  }, [])

  // Don't render if dismissed
  if (isWidgetDismissed) return null

  // Progress percentage
  const progressPct = ((currentStage) / (trackingStages.length - 1)) * 100

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Floating trigger button (bottom-right, above cart drawer) */}
          <AnimatePresence>
            {!isExpanded && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring' as const, stiffness: 400, damping: 25 }}
                onClick={handleTrackOrder}
                className={cn(
                  'fixed bottom-24 md:bottom-8 right-4 z-50',
                  'w-14 h-14 rounded-full shadow-xl',
                  'bg-kwik-orange text-white',
                  'flex items-center justify-center',
                  'hover:bg-kwik-orange-hover active:scale-95',
                  'transition-colors'
                )}
                aria-label="Track your order"
              >
                <Truck className="w-5 h-5" />

                {/* Pulsing ring */}
                <span className="absolute inset-0 rounded-full bg-kwik-orange animate-ping opacity-20" />

                {/* Animated truck driving indicator */}
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-kwik-green border-2 border-background"
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Tracking widget panel */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ y: 80, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 80, opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring' as const, damping: 28, stiffness: 320 }}
                className={cn(
                  'fixed bottom-24 md:bottom-8 right-4 z-50',
                  'w-[360px] max-w-[calc(100vw-2rem)]',
                  'rounded-2xl overflow-hidden',
                  'bg-kwik-bg-surface/95 backdrop-blur-xl',
                  'border border-kwik-border shadow-2xl'
                )}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-kwik-border bg-kwik-orange/5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-kwik-orange/10 flex items-center justify-center">
                      <Truck className="w-4 h-4 text-kwik-orange" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-kwik-dark">Order Tracking</h3>
                      <p className="text-[10px] text-kwik-gray-light">Order #KW-2847 · Demo</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-kwik-muted hover:text-kwik-dark hover:bg-kwik-bg-light transition-colors duration-200"
                      aria-label="Minimize tracking widget"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleDismiss}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-kwik-muted hover:text-kwik-red hover:bg-kwik-red/10 transition-colors duration-200"
                      aria-label="Dismiss tracking widget"
                    >
                      <span className="text-xs font-medium">✕</span>
                    </button>
                  </div>
                </div>

                {/* Progress bar with animated truck */}
                <div className="px-4 pt-4 pb-2">
                  <div className="relative">
                    <div className="h-2.5 rounded-full bg-kwik-border-light overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-kwik-orange to-kwik-amber"
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' as const }}
                      />
                    </div>

                    {/* Animated truck icon on progress bar */}
                    <motion.div
                      className="absolute -top-2"
                      animate={{ left: `${Math.min(progressPct, 95)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' as const }}
                    >
                      <motion.div
                        animate={{ x: [0, 2, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' as const }}
                        className="flex items-center justify-center"
                      >
                        <div className="relative">
                          <Truck className="w-6 h-6 text-kwik-orange drop-shadow-sm" />
                          <motion.span
                            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-kwik-green"
                            animate={{ scale: [1, 1.5, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                        </div>
                      </motion.div>
                    </motion.div>
                  </div>
                </div>

                {/* Step labels */}
                <div className="px-4 pb-3">
                  <div className="flex items-center justify-between">
                    {trackingStages.map((stage, index) => {
                      const isCompleted = index <= currentStage
                      const isCurrent = index === currentStage
                      return (
                        <div key={stage.id} className="flex flex-col items-center gap-1 flex-1">
                          <div
                            className={cn(
                              'w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold transition-all duration-500',
                              isCompleted && !isCurrent && 'bg-kwik-green text-white',
                              isCurrent && 'bg-kwik-orange text-white ring-2 ring-kwik-orange/30',
                              !isCompleted && 'bg-kwik-border-light text-kwik-muted'
                            )}
                          >
                            {isCompleted && !isCurrent ? '✓' : index + 1}
                          </div>
                          <span
                            className={cn(
                              'text-[9px] text-center leading-tight transition-colors duration-500',
                              isCompleted && !isCurrent && 'text-kwik-green font-medium',
                              isCurrent && 'text-kwik-orange font-semibold',
                              !isCompleted && 'text-kwik-muted'
                            )}
                          >
                            {stage.label.split(' ')[0]}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Current status detail */}
                <div className="px-4 pb-3">
                  <motion.div
                    key={currentStage}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-xl bg-kwik-bg-light p-3"
                  >
                    <div className="flex items-center gap-2">
                      {(() => {
                        const StageIcon = trackingStages[currentStage].icon
                        return <StageIcon className="w-4 h-4 text-kwik-orange" />
                      })()}
                      <p className="text-xs font-semibold text-kwik-dark">
                        {trackingStages[currentStage].label}
                      </p>
                      <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-kwik-orange/10 text-kwik-orange ml-auto">
                        Current
                      </span>
                    </div>
                    <p className="text-[11px] text-kwik-gray-light mt-1">
                      {trackingStages[currentStage].description}
                    </p>
                  </motion.div>
                </div>

                {/* Footer */}
                <div className="border-t border-kwik-border px-4 py-2.5 flex items-center justify-between bg-kwik-bg-light/50">
                  <p className="text-[10px] text-kwik-muted">
                    Auto-advancing · Demo order
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStage((prev) => (prev + 1 >= trackingStages.length ? 0 : prev + 1))
                    }}
                    className="text-[10px] font-medium text-kwik-orange hover:text-kwik-orange-hover transition-colors duration-200"
                  >
                    Skip Step →
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  )
}
