'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { PiggyBank, TrendingUp } from 'lucide-react'
import { useCartStore } from '@/stores'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

interface AnimatedNumberProps {
  value: number
  formatFn: (v: number) => string
}

function AnimatedNumber({ value, formatFn }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value)
  const prevValue = useRef(value)

  useEffect(() => {
    const start = prevValue.current
    const end = value
    if (start === end) return

    const duration = 400
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = start + (end - start) * eased
      setDisplay(Math.round(current))

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        prevValue.current = end
      }
    }

    requestAnimationFrame(animate)
  }, [value])

  return <>{formatFn(display)}</>
}

export function SavingsWidget() {
  const items = useCartStore((s) => s.items)

  const totalSavings = items.reduce(
    (sum, item) => sum + ((item.comparePrice || item.price) - item.price) * item.quantity,
    0,
  )

  const getMessage = useCallback((savings: number) => {
    if (savings === 0) return { emoji: '🛒', text: 'Add items to start saving!' }
    if (savings <= 5000) return { emoji: '😊', text: `Nice! You're saving ${formatCurrency(savings)}` }
    return { emoji: '🎉', text: `Amazing! You're saving ${formatCurrency(savings)} on your order!` }
  }, [])

  const message = getMessage(totalSavings)

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-gradient-to-r from-kwik-green/10 via-kwik-green/5 to-kwik-green/10 dark:from-kwik-green/15 dark:via-kwik-green/8 dark:to-kwik-green/15 border border-kwik-green/20 p-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-kwik-green/15 flex items-center justify-center flex-shrink-0">
          {totalSavings > 0 ? (
            <TrendingUp className="w-5 h-5 text-kwik-green" />
          ) : (
            <PiggyBank className="w-5 h-5 text-kwik-green" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-kwik-green mb-1">
            Order Savings
          </p>
          {totalSavings > 0 ? (
            <p className="text-sm font-medium text-kwik-dark">
              <AnimatedNumber value={totalSavings} formatFn={formatCurrency} />
            </p>
          ) : null}
          <p className="text-sm text-kwik-gray-light mt-0.5">
            <span className="mr-1">{message.emoji}</span>
            {message.text}
          </p>
        </div>
        {totalSavings > 0 && (
          <div className="flex-shrink-0 bg-kwik-green/15 rounded-lg px-2 py-1">
            <span className="text-xs font-bold text-kwik-green">
              -{Math.round(
                ((items.reduce((s, i) => s + (i.comparePrice || i.price) * i.quantity, 0) - items.reduce((s, i) => s + i.price * i.quantity, 0)) /
                  Math.max(1, items.reduce((s, i) => s + (i.comparePrice || i.price) * i.quantity, 0))) *
                  100,
              )}
              %
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
