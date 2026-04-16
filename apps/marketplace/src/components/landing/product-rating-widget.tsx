'use client'

import React, { useRef, useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Star, ThumbsUp, Truck, Coins, MousePointer, Palette, ShieldCheck } from 'lucide-react'
import { Card, Chip } from '@heroui/react'
import { cn } from '@kwikseller/ui'

/* ── Data ──────────────────────────────────────────────────── */

const OVERALL_RATING = 4.8
const TOTAL_REVIEWS = 4000

const ratingDistribution = [
  { stars: 5, count: 2340, percentage: 58 },
  { stars: 4, count: 1120, percentage: 28 },
  { stars: 3, count: 360, percentage: 9 },
  { stars: 2, count: 120, percentage: 3 },
  { stars: 1, count: 60, percentage: 2 },
]

const ratingTags = [
  { label: 'Great Quality', count: 1890, icon: ThumbsUp },
  { label: 'Fast Delivery', count: 1650, icon: Truck },
  { label: 'Value for Money', count: 1420, icon: Coins },
  { label: 'Easy to Use', count: 980, icon: MousePointer },
  { label: 'Beautiful Design', count: 870, icon: Palette },
]

/* ── Helpers ───────────────────────────────────────────────── */

/** Animated number counter hook */
function useCountUp(target: number, duration: number = 1200, startOnView: boolean = false) {
  const [value, setValue] = useState(0)
  const hasStarted = useRef(false)

  function startCounting() {
    if (hasStarted.current) return
    hasStarted.current = true
    const startTime = performance.now()

    function tick(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) {
        requestAnimationFrame(tick)
      }
    }
    requestAnimationFrame(tick)
  }

  useEffect(() => {
    if (!startOnView) {
      startCounting()
    }
  }, [startOnView])

  return { value, startCounting }
}

/** Star visualization with partial fill */
function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-7 h-7' }
  const iconSize = sizeMap[size]

  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const fillLevel = Math.min(Math.max(rating - (star - 1), 0), 1)
        return (
          <div key={star} className={cn('relative', iconSize)}>
            {/* Empty star background */}
            <Star className={cn(iconSize, 'text-default-200')} />
            {/* Filled star overlay */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fillLevel * 100}%` }}
            >
              <Star
                className={cn(
                  iconSize,
                  'fill-warning text-warning',
                )}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Single rating distribution row */
function RatingBar({
  stars,
  count,
  percentage,
  isInView,
  index,
}: {
  stars: number
  count: number
  percentage: number
  isInView: boolean
  index: number
}) {
  const { value: displayCount, startCounting } = useCountUp(count, 800)

  useEffect(() => {
    if (isInView) startCounting()
  }, [isInView, startCounting])

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.1, ease: 'easeOut' }}
      className="flex items-center gap-3 group"
    >
      {/* Star label */}
      <div className="flex items-center gap-1.5 w-16 shrink-0">
        <span className="text-sm font-medium text-foreground">{stars}</span>
        <Star className="w-3.5 h-3.5 fill-warning text-warning" />
      </div>

      {/* Progress bar */}
      <div className="flex-1 h-2.5 rounded-full bg-default-100 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={isInView ? { width: `${percentage}%` } : { width: 0 }}
          transition={{ duration: 0.8, delay: index * 0.1 + 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="h-full rounded-full bg-accent"
        />
      </div>

      {/* Count & percentage */}
      <div className="flex items-center gap-2 w-20 shrink-0 justify-end">
        <span className="text-sm text-default-500 tabular-nums">{displayCount.toLocaleString()}</span>
        <span className="text-xs text-default-400 w-9 text-right tabular-nums">({percentage}%)</span>
      </div>
    </motion.div>
  )
}

/* ── Main Component ───────────────────────────────────────── */

export function ProductRatingWidget({ className }: { className?: string }) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-60px' })

  const { value: displayRating, startCounting: startRatingCount } = useCountUp(
    Math.round(OVERALL_RATING * 10),
    1000,
  )
  const { value: displayTotal, startCounting: startTotalCount } = useCountUp(TOTAL_REVIEWS, 1200)

  useEffect(() => {
    if (isInView) {
      startRatingCount()
      startTotalCount()
    }
  }, [isInView, startRatingCount, startTotalCount])

  return (
    <Card
      ref={sectionRef}
      className={cn(
        'max-w-2xl w-full mx-auto p-6 md:p-8 border border-divider',
        className,
      )}
    >
      {/* ── Overall Rating ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 mb-8"
      >
        {/* Large rating number */}
        <div className="flex flex-col items-center sm:items-start gap-2 shrink-0">
          <div className="flex items-baseline gap-1.5">
            <span className="text-5xl md:text-6xl font-bold tracking-tight text-foreground tabular-nums">
              {(displayRating / 10).toFixed(1)}
            </span>
            <span className="text-lg text-default-400 font-medium">/5</span>
          </div>
          <div className="flex items-center gap-2">
            <StarRating rating={OVERALL_RATING} size="lg" />
          </div>
        </div>

        {/* Total reviews */}
        <div className="flex flex-col gap-1 sm:border-l sm:border-divider sm:pl-8">
          <p className="text-sm text-default-500">
            Based on{' '}
            <span className="font-semibold text-foreground tabular-nums">
              {displayTotal.toLocaleString()}
            </span>{' '}
            reviews
          </p>
          <p className="text-xs text-default-400">
            Last updated 2 days ago
          </p>
        </div>
      </motion.div>

      {/* ── Distribution Bars ────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="space-y-3 mb-8"
      >
        {ratingDistribution.map((item, index) => (
          <RatingBar
            key={item.stars}
            stars={item.stars}
            count={item.count}
            percentage={item.percentage}
            isInView={isInView}
            index={index}
          />
        ))}
      </motion.div>

      {/* ── Rating Tags ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <p className="text-xs font-semibold text-default-400 uppercase tracking-wider mb-3">
          Top Review Tags
        </p>
        <div className="flex flex-wrap gap-2">
          {ratingTags.map((tag, index) => {
            const Icon = tag.icon
            return (
              <motion.div
                key={tag.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.3, delay: 0.4 + index * 0.08 }}
              >
                <Chip
                  variant="soft"
                  size="sm"
                  className="bg-default-100 hover:bg-accent-soft transition-colors cursor-default"
                >
                  <Icon className="w-3.5 h-3.5 text-accent mr-1" />
                  <span className="text-xs font-medium text-default-600">{tag.label}</span>
                  <span className="text-xs text-default-400 ml-1 tabular-nums">
                    ({tag.count.toLocaleString()})
                  </span>
                </Chip>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* ── Verified Purchase Badge ──────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="mt-6 pt-6 border-t border-divider"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-success/10">
            <ShieldCheck className="w-4.5 h-4.5 text-success" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Verified Purchases</p>
            <p className="text-xs text-default-400">
              <span className="font-semibold text-success">87%</span> of reviews are from verified purchases
            </p>
          </div>
        </div>
      </motion.div>
    </Card>
  )
}
