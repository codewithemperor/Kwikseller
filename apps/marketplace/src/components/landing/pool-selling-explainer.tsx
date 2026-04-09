'use client'

import React, { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  Search,
  ListPlus,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Layers,
  PackageCheck,
  Banknote,
} from 'lucide-react'
import { Button, Chip } from '@heroui/react'
import { cn } from '@kwikseller/ui'

// ─── Step Data ─────────────────────────────────────────────────

interface PoolStep {
  number: number
  title: string
  description: string
  icon: React.ElementType
  gradientFrom: string
  gradientTo: string
  decorElements: { shape: string; position: string; size: string; color: string }[]
  miniItems: { label: string; icon?: React.ElementType }[]
}

const poolSteps: PoolStep[] = [
  {
    number: 1,
    title: 'Browse the Product Pool',
    description:
      'Explore thousands of pre-listed products across categories. From electronics to fashion, food to home goods — discover trending items already validated by the marketplace.',
    icon: Search,
    gradientFrom: 'from-violet-500',
    gradientTo: 'to-purple-600',
    decorElements: [
      { shape: 'circle', position: '-top-4 -right-4', size: 'w-20 h-20', color: 'bg-violet-400/20' },
      { shape: 'circle', position: '-bottom-3 -left-3', size: 'w-14 h-14', color: 'bg-purple-400/20' },
      { shape: 'rounded-xl', position: 'top-1/2 right-6', size: 'w-10 h-10 rotate-12', color: 'bg-violet-500/10' },
      { shape: 'circle', position: 'top-8 left-4', size: 'w-6 h-6', color: 'bg-purple-300/30' },
    ],
    miniItems: [
      { label: 'Electronics', icon: PackageCheck },
      { label: 'Fashion', icon: Layers },
      { label: 'Beauty', icon: Banknote },
      { label: 'Home & Garden', icon: ShieldCheck },
    ],
  },
  {
    number: 2,
    title: 'List Products from the Pool',
    description:
      'Add pool products to your store with one click. No inventory needed, no upfront cost. Your store instantly has hundreds of products ready for customers to buy.',
    icon: ListPlus,
    gradientFrom: 'from-amber-400',
    gradientTo: 'to-orange-500',
    decorElements: [
      { shape: 'circle', position: '-top-4 -left-4', size: 'w-20 h-20', color: 'bg-amber-400/20' },
      { shape: 'circle', position: '-bottom-3 -right-3', size: 'w-14 h-14', color: 'bg-orange-400/20' },
      { shape: 'rounded-xl', position: 'top-1/2 left-6', size: 'w-10 h-10 -rotate-12', color: 'bg-amber-500/10' },
      { shape: 'circle', position: 'top-8 right-4', size: 'w-6 h-6', color: 'bg-orange-300/30' },
    ],
    miniItems: [
      { label: 'One-Click Add' },
      { label: 'No Inventory' },
      { label: 'Instant Setup' },
    ],
  },
  {
    number: 3,
    title: 'Earn Commission on Every Sale',
    description:
      'Receive commission for each pool product sold through your store. Track earnings in real-time with transparent reporting. The more you sell, the more you earn.',
    icon: TrendingUp,
    gradientFrom: 'from-emerald-400',
    gradientTo: 'to-teal-500',
    decorElements: [
      { shape: 'circle', position: '-top-4 -right-4', size: 'w-20 h-20', color: 'bg-emerald-400/20' },
      { shape: 'circle', position: '-bottom-3 -left-3', size: 'w-14 h-14', color: 'bg-teal-400/20' },
      { shape: 'rounded-xl', position: 'top-1/2 right-6', size: 'w-10 h-10 rotate-12', color: 'bg-emerald-500/10' },
      { shape: 'circle', position: 'top-8 left-4', size: 'w-6 h-6', color: 'bg-teal-300/30' },
    ],
    miniItems: [
      { label: 'Real-Time Tracking' },
      { label: 'Transparent Reports' },
      { label: 'Auto Payouts' },
    ],
  },
  {
    number: 4,
    title: 'Grow Risk-Free',
    description:
      'No upfront cost, no storage fees, no unsold inventory. Scale your business without financial risk. Focus on marketing and customer service — we handle the rest.',
    icon: ShieldCheck,
    gradientFrom: 'from-rose-400',
    gradientTo: 'to-pink-500',
    decorElements: [
      { shape: 'circle', position: '-top-4 -left-4', size: 'w-20 h-20', color: 'bg-rose-400/20' },
      { shape: 'circle', position: '-bottom-3 -right-3', size: 'w-14 h-14', color: 'bg-pink-400/20' },
      { shape: 'rounded-xl', position: 'top-1/2 left-6', size: 'w-10 h-10 -rotate-12', color: 'bg-rose-500/10' },
      { shape: 'circle', position: 'top-8 right-4', size: 'w-6 h-6', color: 'bg-pink-300/30' },
    ],
    miniItems: [
      { label: 'Zero Upfront Cost' },
      { label: 'No Storage Fees' },
      { label: 'No Unsold Stock' },
    ],
  },
]

// ─── Decorative Image Placeholder ──────────────────────────────

function PoolStepImage({
  step,
  isInView,
}: {
  step: PoolStep
  isInView: boolean
}) {
  const Icon = step.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: step.number % 2 === 1 ? -30 : 30 }}
      animate={
        isInView
          ? { opacity: 1, x: 0 }
          : { opacity: 0, x: step.number % 2 === 1 ? -30 : 30 }
      }
      transition={{
        duration: 0.7,
        delay: 0.15,
        ease: 'easeOut',
      }}
      className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden"
    >
      {/* Gradient background */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-90',
          step.gradientFrom,
          step.gradientTo,
        )}
      />

      {/* Floating parallax icon */}
      <motion.div
        animate={isInView ? { y: [0, -8, 0] } : { y: 0 }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: step.number * 0.3,
        }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
          <Icon className="w-10 h-10 md:w-12 md:h-12 text-white" />
        </div>
      </motion.div>

      {/* Mini item tags */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2"
      >
        {step.miniItems.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-medium"
          >
            {item.icon && <item.icon className="w-3 h-3" />}
            {item.label}
          </span>
        ))}
      </motion.div>

      {/* Decorative floating elements */}
      {step.decorElements.map((deco, i) => (
        <motion.div
          key={i}
          animate={
            isInView
              ? { y: [0, -6, 0], rotate: [0, 5, 0] }
              : { y: 0, rotate: 0 }
          }
          transition={{
            duration: 4 + i * 0.8,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: step.number * 0.2 + i * 0.4,
          }}
          className={cn(
            'absolute pointer-events-none',
            deco.position,
            deco.size,
            deco.shape,
            deco.color,
          )}
        />
      ))}

      {/* Bottom depth overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/10 to-transparent" />
    </motion.div>
  )
}

// ─── Single Step Card ─────────────────────────────────────────

function PoolStepCard({
  step,
  index,
  totalSteps,
}: {
  step: PoolStep
  index: number
  totalSteps: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const isOdd = step.number % 2 === 1

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.7, delay: index * 0.05, ease: 'easeOut' }}
      className="relative py-12 md:py-16"
    >
      {/* Dashed connecting line between steps (desktop only) */}
      {index < totalSteps - 1 && (
        <div className="hidden md:flex justify-center">
          <div className="w-px border-l-2 border-dashed border-default-200 my-4" />
        </div>
      )}

      <div className="container mx-auto px-4">
        <div
          className={cn(
            'flex flex-col items-center gap-8 md:gap-12 lg:gap-16',
            isOdd ? 'md:flex-row' : 'md:flex-row-reverse',
          )}
        >
          {/* Image Placeholder */}
          <div className="w-full md:w-1/2 max-w-lg">
            <PoolStepImage step={step} isInView={isInView} />
          </div>

          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: isOdd ? 30 : -30 }}
            animate={
              isInView
                ? { opacity: 1, x: 0 }
                : { opacity: 0, x: isOdd ? 30 : -30 }
            }
            transition={{ duration: 0.6, delay: 0.25, ease: 'easeOut' }}
            className="w-full md:w-1/2"
          >
            {/* Step number badge */}
            <div className="flex items-center gap-3 mb-5">
              <div
                className={cn(
                  'w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-lg shadow-md',
                  step.gradientFrom,
                  step.gradientTo,
                )}
              >
                {step.number}
              </div>
              <div
                className={cn(
                  'flex-1 h-0.5 bg-gradient-to-r rounded-full',
                  step.gradientFrom,
                  'to-transparent',
                )}
              />
            </div>

            {/* Title */}
            <h3 className="text-2xl md:text-3xl font-bold mb-4">{step.title}</h3>

            {/* Description */}
            <p className="text-default-500 text-base md:text-lg leading-relaxed max-w-md">
              {step.description}
            </p>

            {/* Step progress indicator */}
            <div className="flex items-center gap-2 mt-6">
              {poolSteps.map((s) => (
                <div
                  key={s.number}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-500',
                    s.number <= step.number
                      ? cn('bg-gradient-to-r w-8', s.gradientFrom, s.gradientTo)
                      : 'bg-default-200 w-4',
                  )}
                />
              ))}
              <span className="text-xs text-default-400 ml-2">
                Step {step.number} of {poolSteps.length}
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Export ───────────────────────────────────────────────

export function PoolSellingExplainer() {
  const headerRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const isHeaderInView = useInView(headerRef, { once: true, margin: '-80px' })
  const isCtaInView = useInView(ctaRef, { once: true, margin: '-60px' })

  return (
    <section className="relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-violet-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-amber-500/5 blur-[100px] pointer-events-none" />

      {/* Section Header */}
      <div className="bg-default-50 py-16 md:py-20 relative">
        {/* Subtle dot pattern */}
        <div className="absolute inset-0 pattern-dots opacity-20 pointer-events-none" />
        <div className="container mx-auto px-4 relative">
          <motion.div
            ref={headerRef}
            initial={{ opacity: 0, y: 30 }}
            animate={
              isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
            }
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-center max-w-2xl mx-auto"
          >
            <Chip variant="soft" className="mb-5">
              <Layers className="w-4 h-4 mr-1" />
              Unique Feature
            </Chip>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              How Pool Selling{' '}
              <span className="kwik-gradient-text">Works</span>
            </h2>
            <p className="text-default-500 text-base md:text-lg">
              Sell products from a shared inventory without holding stock. Start earning commissions from day one with zero risk.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Steps */}
      <div>
        {poolSteps.map((step, index) => (
          <PoolStepCard
            key={step.number}
            step={step}
            index={index}
            totalSteps={poolSteps.length}
          />
        ))}
      </div>

      {/* CTA */}
      <div className="bg-default-50 py-16 md:py-20 relative">
        {/* Decorative blob */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-accent/5 blur-[80px] pointer-events-none deco-blob" />
        <div className="container mx-auto px-4 relative">
          <motion.div
            ref={ctaRef}
            initial={{ opacity: 0, y: 30 }}
            animate={
              isCtaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
            }
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-center"
          >
            <h3 className="text-2xl md:text-3xl font-bold mb-3">
              Ready to sell without inventory?
            </h3>
            <p className="text-default-500 mb-8 max-w-md mx-auto">
              Join thousands of vendors already earning commissions through pool selling. No upfront cost, no risk.
            </p>
            <Button
              size="lg"
              className="kwik-gradient text-white font-semibold kwik-shadow-lg hover:opacity-90 transition-opacity"
            >
              Start Pool Selling Today
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
