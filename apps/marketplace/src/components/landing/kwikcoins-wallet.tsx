'use client'

import React, { useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  Coins,
  Zap,
  Gift,
  ArrowRightLeft,
  Sparkles,
  Trophy,
  ShoppingBag,
  Users,
  Star,
  TrendingUp,
  Info,
} from 'lucide-react'
import { Card, Chip } from '@heroui/react'
import { cn } from '@kwikseller/ui'

// ─── Transaction Data ──────────────────────────────────────

interface Transaction {
  id: string
  coins: number
  description: string
  date: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
}

const transactions: Transaction[] = [
  {
    id: '1',
    coins: 25,
    description: 'Sale completed - Order #KW-2847',
    date: '2 hours ago',
    icon: ShoppingBag,
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    id: '2',
    coins: -50,
    description: 'Promoted product: Ankara Dress',
    date: '5 hours ago',
    icon: TrendingUp,
    iconBg: 'bg-rose-100 dark:bg-rose-900/40',
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
  {
    id: '3',
    coins: 100,
    description: 'Milestone: 100 sales reached!',
    date: '1 day ago',
    icon: Trophy,
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    id: '4',
    coins: 50,
    description: 'Referral bonus: @emmas_store',
    date: '2 days ago',
    icon: Users,
    iconBg: 'bg-blue-100 dark:bg-blue-900/40',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    id: '5',
    coins: 3,
    description: 'Sale completed - Order #KW-2831',
    date: '3 days ago',
    icon: ShoppingBag,
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
]

// ─── Quick Action Data ─────────────────────────────────────

interface QuickAction {
  icon: React.ElementType
  label: string
  description: string
  bg: string
  iconColor: string
}

const quickActions: QuickAction[] = [
  {
    icon: Zap,
    label: 'Earn Coins',
    description: 'Complete tasks & sales',
    bg: 'bg-purple-50 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    icon: Gift,
    label: 'Redeem',
    description: 'Use coins for perks',
    bg: 'bg-emerald-50 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    icon: ArrowRightLeft,
    label: 'Transfer',
    description: 'Send coins to others',
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
]

// ─── Animation Variants ────────────────────────────────────

const walletSlideVariants = {
  hidden: { opacity: 0, x: -60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
}

const rightSlideVariants = {
  hidden: { opacity: 0, x: 60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

const actionPopVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      delay: 0.15 + i * 0.1,
      ease: 'backOut',
    },
  }),
}

const transactionVariants = {
  hidden: { opacity: 0, x: 40 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      delay: 0.3 + i * 0.08,
      ease: 'easeOut',
    },
  }),
}

// ─── Count-Up Hook ─────────────────────────────────────────

function useCountUp(target: number, isInView: boolean, duration = 1200) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isInView) return

    let startTime: number | null = null
    let animationFrame: number

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [isInView, target, duration])

  return count
}

// ─── Main Export ───────────────────────────────────────────

export function KwikCoinsWallet() {
  const sectionRef = useRef<HTMLElement>(null)
  const walletRef = useRef<HTMLDivElement>(null)
  const actionsRef = useRef<HTMLDivElement>(null)
  const transactionsRef = useRef<HTMLDivElement>(null)

  const isSectionInView = useInView(sectionRef, { once: true, margin: '-80px' })
  const isWalletInView = useInView(walletRef, { once: true, margin: '-40px' })
  const isActionsInView = useInView(actionsRef, { once: true, margin: '-40px' })
  const isTransactionsInView = useInView(transactionsRef, { once: true, margin: '-40px' })

  const balance = useCountUp(2450, isWalletInView, 1400)

  return (
    <section ref={sectionRef} className="py-20 bg-background relative">
      {/* Decorative background blobs */}
      <div className="absolute top-10 right-0 w-80 h-80 bg-amber-200/15 dark:bg-amber-900/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
      <div className="absolute bottom-10 left-0 w-64 h-64 bg-orange-200/15 dark:bg-orange-900/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

      <div className="container mx-auto px-4 max-w-5xl relative z-10">
        {/* ─── Section Header ─── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isSectionInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center mb-12"
        >
          <Chip variant="soft" className="mb-4">
            <Coins className="w-4 h-4 mr-1" />
            KwikCoins Wallet
          </Chip>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Track Your{' '}
            <span className="kwik-gradient-text">Rewards</span>
          </h2>
          <p className="text-default-500 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Manage your KwikCoins balance, view transactions, and redeem your rewards — all from
            one convenient dashboard.
          </p>
        </motion.div>

        {/* ─── Two-Column Layout ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* ─── Left Column: Wallet Card ─── */}
          <motion.div
            ref={walletRef}
            variants={walletSlideVariants}
            initial="hidden"
            animate={isWalletInView ? 'visible' : 'hidden'}
            className="lg:col-span-2"
          >
            <div className="relative rounded-2xl overflow-hidden kwik-gradient p-6 md:p-8 min-h-[340px] flex flex-col justify-between shadow-xl">
              {/* Decorative pattern overlay */}
              <div
                className="absolute inset-0 opacity-[0.06]"
                style={{
                  backgroundImage:
                    'radial-gradient(circle, white 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              />

              {/* Floating coin decorations */}
              <div className="absolute top-4 right-4 text-white/10 text-2xl animate-float-slow select-none pointer-events-none">
                🪙
              </div>
              <div className="absolute top-1/3 right-12 text-white/[0.07] text-lg animate-float-medium select-none pointer-events-none">
                ✨
              </div>
              <div className="absolute bottom-16 right-6 text-white/[0.06] text-xl animate-float-fast select-none pointer-events-none">
                🪙
              </div>

              {/* Top: Coin icon with sparkle */}
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Coins className="w-6 h-6 text-white" />
                  </div>
                  <div className="relative">
                    <Sparkles className="w-4 h-4 text-yellow-300 absolute -top-2 -left-2 animate-pulse" />
                  </div>
                </div>

                {/* Balance Label */}
                <p className="text-white/80 text-sm font-medium mb-1">
                  Available Balance
                </p>

                {/* Balance Number */}
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-white text-3xl font-bold tabular-nums">
                    {balance.toLocaleString()}
                  </span>
                  <span className="text-white/70 text-sm font-medium">
                    KwikCoins
                  </span>
                </div>

                {/* Equivalent Value */}
                <p className="text-white/60 text-sm">
                  ≈ ₦{(balance * 10).toLocaleString()} value
                </p>
              </div>

              {/* Bottom: Tier info + progress */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-300" />
                    <span className="text-white text-sm font-semibold">
                      Gold Tier
                    </span>
                  </div>
                  <span className="text-white/60 text-xs font-medium">
                    Next: Platinum
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={isWalletInView ? { width: '65%' } : { width: 0 }}
                    transition={{ duration: 1.2, delay: 0.4, ease: 'easeOut' }}
                    className="h-full rounded-full bg-white/80"
                  />
                </div>
                <div className="flex justify-end mt-1.5">
                  <span className="text-white/50 text-xs">65%</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ─── Right Column: Activity + Actions ─── */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            {/* ─── Quick Actions Row ─── */}
            <motion.div
              ref={actionsRef}
              className="grid grid-cols-3 gap-3 md:gap-4"
            >
              {quickActions.map((action, i) => {
                const Icon = action.icon
                return (
                  <motion.div
                    key={action.label}
                    custom={i}
                    variants={actionPopVariants}
                    initial="hidden"
                    animate={isActionsInView ? 'visible' : 'hidden'}
                  >
                    <Card
                      isPressable
                      className="p-4 border-none shadow-sm hover:shadow-lg transition-all duration-300 bg-background h-full"
                    >
                      <div className="flex flex-col items-center text-center gap-2">
                        <div
                          className={cn(
                            'w-11 h-11 rounded-xl flex items-center justify-center',
                            action.bg,
                          )}
                        >
                          <Icon className={cn('w-5 h-5', action.iconColor)} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold leading-tight">
                            {action.label}
                          </p>
                          <p className="text-default-400 text-[11px] leading-tight mt-0.5">
                            {action.description}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </motion.div>

            {/* ─── Recent Transactions ─── */}
            <motion.div ref={transactionsRef}>
              <Card className="p-4 md:p-6 border-none shadow-sm bg-background">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm md:text-base">
                    Recent Transactions
                  </h3>
                  <span className="text-default-400 text-xs font-medium">
                    This week
                  </span>
                </div>

                <div className="space-y-1">
                  {transactions.map((tx, i) => {
                    const Icon = tx.icon
                    const isPositive = tx.coins > 0
                    return (
                      <motion.div
                        key={tx.id}
                        custom={i}
                        variants={transactionVariants}
                        initial="hidden"
                        animate={
                          isTransactionsInView ? 'visible' : 'hidden'
                        }
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-default-50 dark:hover:bg-default-100/50 transition-colors"
                      >
                        {/* Icon */}
                        <div
                          className={cn(
                            'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                            tx.iconBg,
                          )}
                        >
                          <Icon className={cn('w-4 h-4', tx.iconColor)} />
                        </div>

                        {/* Description + Date */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {tx.description}
                          </p>
                          <p className="text-default-400 text-xs">
                            {tx.date}
                          </p>
                        </div>

                        {/* Coin amount */}
                        <span
                          className={cn(
                            'text-sm font-bold tabular-nums flex-shrink-0',
                            isPositive
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400',
                          )}
                        >
                          {isPositive ? '+' : ''}
                          {tx.coins} coins
                        </span>
                      </motion.div>
                    )
                  })}
                </div>
              </Card>
            </motion.div>

            {/* ─── Coin Value Calculator ─── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={
                isTransactionsInView
                  ? { opacity: 1, y: 0 }
                  : { opacity: 0, y: 20 }
              }
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <Card className="p-4 md:p-6 border-none shadow-sm bg-background">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Info className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm mb-2">
                      Coin Value Calculator
                    </h3>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-default-500 text-xs">
                          Conversion rate
                        </span>
                        <span className="text-sm font-semibold">
                          1,000 KwikCoins = ₦10,000 ad credit
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-default-500 text-xs">
                          Tier multiplier
                        </span>
                        <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                          ⭐ Gold tier: 3x earning rate
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-default-100 dark:border-default-200/30">
                      <a
                        href="#"
                        className="text-accent text-xs font-medium hover:underline underline-offset-2 transition-colors"
                      >
                        Learn more about KwikCoins →
                      </a>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
