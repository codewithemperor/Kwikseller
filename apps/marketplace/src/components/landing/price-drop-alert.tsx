'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingDown, X, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { usePriceDropStore, type PriceRecord } from '@/stores'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function PriceDropAlertItem({
  alert,
  onDismiss,
}: {
  alert: PriceRecord
  onDismiss: (id: string) => void
}) {
  const router = useRouter()
  const savings = alert.lastSeenPrice - alert.currentPrice
  const savingsPercent = Math.round(
    ((alert.lastSeenPrice - alert.currentPrice) / alert.lastSeenPrice) * 100,
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -20, height: 0, marginBottom: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="bg-gradient-to-r from-kwik-orange/10 via-amber-50/80 to-kwik-orange/5 dark:from-kwik-orange/15 dark:via-amber-950/40 dark:to-kwik-orange/10 border border-kwik-orange/20 dark:border-kwik-orange/30 rounded-xl px-4 py-3 flex items-center gap-3 mb-2 shadow-sm"
    >
      {/* Icon */}
      <div className="w-10 h-10 rounded-xl bg-kwik-orange/15 dark:bg-kwik-orange/20 flex items-center justify-center flex-shrink-0">
        <TrendingDown className="w-5 h-5 text-kwik-orange" />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-kwik-dark truncate">
          Price dropped on {alert.name}!
        </p>
        <p className="text-xs text-kwik-gray-light mt-0.5">
          Was{' '}
          <span className="line-through text-kwik-muted">
            {formatCurrency(alert.lastSeenPrice)}
          </span>{' '}
          <span className="mx-1 text-kwik-muted">→</span>
          <span className="font-bold text-kwik-green">
            {formatCurrency(alert.currentPrice)}
          </span>
          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-md bg-kwik-green/10 text-kwik-green text-[10px] font-bold">
            -{savingsPercent}%
          </span>
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={() => router.push(`/products/${String(alert.id)}`)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-kwik-orange text-white text-xs font-semibold hover:bg-kwik-orange-hover transition-colors"
        >
          View
          <ArrowRight className="w-3 h-3" />
        </button>
        <button
          onClick={() => onDismiss(alert.id)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-kwik-muted hover:bg-kwik-bg-surface hover:text-kwik-dark transition-colors"
          aria-label="Dismiss alert"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  )
}

export function PriceDropAlert() {
  const alerts = usePriceDropStore((s) => s.alerts)
  const dismissAlert = usePriceDropStore((s) => s.dismissAlert)
  const [mounted, setMounted] = useState(false)

  React.useLayoutEffect(() => {
    setMounted(true)
  }, [])

  // Don't render during SSR to avoid hydration mismatch
  if (!mounted) return null

  const activeAlerts = alerts.filter((a) => !a.dismissed).slice(0, 3)

  if (activeAlerts.length === 0) return null

  return (
    <div className="sticky top-[calc(4rem+1px)] z-30 px-4 pt-2 pb-1">
      <AnimatePresence initial={false}>
        {activeAlerts.map((alert) => (
          <PriceDropAlertItem
            key={alert.id}
            alert={alert}
            onDismiss={dismissAlert}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
