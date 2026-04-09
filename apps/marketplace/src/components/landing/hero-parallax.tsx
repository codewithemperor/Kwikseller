'use client'

import React, { useRef, useSyncExternalStore, useCallback } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Button, Chip } from '@heroui/react'
import {
  ShoppingCart,
  Laptop,
  Smartphone,
  Shirt,
  Package,
  ArrowRight,
  Check,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { cn } from '@kwikseller/ui'

// ─── Prefers‑reduced‑motion hook (same pattern as hero-background.tsx) ────

function usePrefersReducedMotion() {
  const subscribe = useCallback((callback: () => void) => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    mq.addEventListener('change', callback)
    return () => mq.removeEventListener('change', callback)
  }, [])

  const getSnapshot = useCallback(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )

  const getServerSnapshot = useCallback(() => true, [])

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

// ─── Data ────────────────────────────────────────────────────────────────

interface ProductBubble {
  id: number
  icon: React.ElementType
  x: string
  y: string
  size: number
  rotation: number
  opacity: number
  floatDuration: number
  floatDelay: number
  driftX: number
  driftY: number
}

const productBubbles: ProductBubble[] = [
  { id: 1, icon: ShoppingCart, x: '8%', y: '12%', size: 64, rotation: 12, opacity: 0.25, floatDuration: 6, floatDelay: 0, driftX: 30, driftY: -20 },
  { id: 2, icon: Laptop, x: '78%', y: '8%', size: 72, rotation: -8, opacity: 0.3, floatDuration: 7.5, floatDelay: 1.5, driftX: -25, driftY: 15 },
  { id: 3, icon: Smartphone, x: '82%', y: '52%', size: 60, rotation: 15, opacity: 0.2, floatDuration: 5.5, floatDelay: 0.8, driftX: -35, driftY: -10 },
  { id: 4, icon: Shirt, x: '12%', y: '68%', size: 68, rotation: -12, opacity: 0.35, floatDuration: 8, floatDelay: 2, driftX: 20, driftY: 25 },
  { id: 5, icon: Package, x: '68%', y: '78%', size: 76, rotation: 8, opacity: 0.25, floatDuration: 6.5, floatDelay: 1, driftX: -15, driftY: -30 },
]

interface TrustIndicator {
  id: number
  icon: React.ElementType
  text: string
}

const trustIndicators: TrustIndicator[] = [
  { id: 1, icon: Check, text: 'Free to start' },
  { id: 2, icon: ShieldCheck, text: 'No credit card required' },
  { id: 3, icon: Zap, text: 'Setup in 5 minutes' },
]

// ─── Animation variants ──────────────────────────────────────────────────

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.3,
    },
  },
}

const fadeUpItem = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
}

// ─── Product Bubble sub‑component ────────────────────────────────────────

function ProductBubble({
  bubble,
  scrollY,
}: {
  bubble: ProductBubble
  scrollY: ReturnType<typeof useScroll>['scrollY']
}) {
  const Icon = bubble.icon

  // Individual drift transforms on top of the parent layer parallax
  const driftX = useTransform(scrollY, (v) => (v * bubble.driftX) / 100)
  const driftY = useTransform(scrollY, (v) => (v * bubble.driftY) / 100)

  return (
    <motion.div
      className="absolute"
      style={{
        willChange: 'transform',
        x: driftX,
        y: driftY,
        left: bubble.x,
        top: bubble.y,
      }}
    >
      <motion.div
        animate={{
          y: [0, -14, 6, -10, 0],
          rotate: [
            bubble.rotation,
            bubble.rotation + 8,
            bubble.rotation - 4,
            bubble.rotation + 6,
            bubble.rotation,
          ],
        }}
        transition={{
          duration: bubble.floatDuration,
          delay: bubble.floatDelay,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={cn(
          'rounded-full bg-default-100 dark:bg-default-200/10',
          'border border-border/40 flex items-center justify-center',
        )}
        style={{
          width: bubble.size,
          height: bubble.size,
          opacity: bubble.opacity,
        }}
      >
        <Icon className="w-6 h-6 text-default-400 dark:text-default-300" />
      </motion.div>
    </motion.div>
  )
}

// ─── Static fallback (reduced motion) ────────────────────────────────────

function StaticHero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Static background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-20 w-[350px] h-[350px] rounded-full bg-accent/15 blur-[100px]" />
        <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] rounded-full bg-warning/15 blur-[100px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <Chip variant="flat" className="mb-6 bg-accent/10 text-accent-foreground">
          🌍 Africa&apos;s #1 Commerce Platform
        </Chip>

        <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6 max-w-4xl mx-auto">
          Africa&apos;s Most Powerful{' '}
          <span className="kwik-gradient-text">Commerce Operating System</span>
        </h1>

        <p className="text-default-500 text-lg md:text-xl max-w-2xl mx-auto mb-8">
          Empower your business with the all-in-one commerce platform built for
          Africa. Manage your store, process payments, ship products, and reach
          millions of customers — all in one place.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Button size="lg" className="kwik-gradient text-white font-semibold">
            Start Selling Free
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
          <Button size="lg" variant="bordered">
            Browse Marketplace
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm text-default-400">
          {trustIndicators.map((t) => {
            const Icon = t.icon
            return (
              <span key={t.id} className="flex items-center gap-1.5">
                <Icon className="w-4 h-4 text-success" />
                {t.text}
              </span>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── Main export ─────────────────────────────────────────────────────────

export function HeroParallax() {
  const containerRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = usePrefersReducedMotion()

  const { scrollY } = useScroll()

  // Fade‑out: opacity goes from 1 → 0 over the first 200 px of scroll
  const heroOpacity = useTransform(scrollY, [0, 200], [1, 0])

  // Layer 1 (background): moves at 0.2× apparent speed → compensate 0.8×
  const layer1Y = useTransform(scrollY, (v) => v * 0.8)

  // Layer 2 (midground): moves at 0.5× apparent speed → compensate 0.5×
  const layer2Y = useTransform(scrollY, (v) => v * 0.5)

  // Layer 3 (foreground): moves at 0.9× apparent speed → compensate 0.1×
  const layer3Y = useTransform(scrollY, (v) => v * 0.1)

  if (prefersReducedMotion) {
    return <StaticHero />
  }

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      {/* ── Layer 1: Background (slowest, 0.2×) ─────────────────── */}
      <motion.div
        style={{ willChange: 'transform', y: layer1Y }}
        className="absolute inset-0 pointer-events-none"
      >
        {/* Gradient orb – accent */}
        <div
          className="absolute -top-20 -left-20 w-[380px] h-[380px] rounded-full bg-accent/20 blur-[120px]"
        />
        {/* Gradient orb – warning */}
        <div
          className="absolute -bottom-20 -right-20 w-[350px] h-[350px] rounded-full bg-warning/20 blur-[120px]"
        />
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(var(--border) 1px, transparent 1px),
              linear-gradient(90deg, var(--border) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </motion.div>

      {/* ── Layer 2: Midground (medium, 0.5×) ──────────────────── */}
      <motion.div
        style={{ willChange: 'transform', y: layer2Y }}
        className="absolute inset-0 pointer-events-none"
      >
        {/* Product bubbles – hidden on mobile for performance + clarity */}
        <div className="relative w-full h-full hidden md:block">
          {productBubbles.map((bubble) => (
            <ProductBubble
              key={bubble.id}
              bubble={bubble}
              scrollY={scrollY}
            />
          ))}
        </div>
      </motion.div>

      {/* ── Layer 3: Foreground content (normal, slight parallax) ── */}
      <motion.div
        style={{ willChange: 'transform', y: layer3Y, opacity: heroOpacity }}
        className="relative z-10 container mx-auto px-4 text-center"
      >
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Chip badge */}
          <motion.div variants={fadeUpItem} className="mb-6">
            <Chip
              variant="flat"
              className="bg-accent/10 text-accent-foreground text-sm"
            >
              🌍 Africa&apos;s #1 Commerce Platform
            </Chip>
          </motion.div>

          {/* H1 */}
          <motion.h1
            variants={fadeUpItem}
            className="text-4xl md:text-6xl font-bold leading-tight mb-6 max-w-4xl mx-auto"
          >
            Africa&apos;s Most Powerful{' '}
            <span className="kwik-gradient-text">
              Commerce Operating System
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            variants={fadeUpItem}
            className="text-default-500 text-lg md:text-xl max-w-2xl mx-auto mb-8"
          >
            Empower your business with the all-in-one commerce platform built
            for Africa. Manage your store, process payments, ship products, and
            reach millions of customers — all in one place.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            variants={fadeUpItem}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
          >
            <Button
              size="lg"
              className="kwik-gradient text-white font-semibold"
            >
              Start Selling Free
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button size="lg" variant="bordered">
              Browse Marketplace
            </Button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            variants={fadeUpItem}
            className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm text-default-400"
          >
            {trustIndicators.map((t) => {
              const Icon = t.icon
              return (
                <span key={t.id} className="flex items-center gap-1.5">
                  <Icon className="w-4 h-4 text-success" />
                  {t.text}
                </span>
              )
            })}
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  )
}
