'use client'

import React, { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { cn } from '@kwikseller/ui'
import { Smartphone, CheckCircle, Download } from 'lucide-react'

const features = [
  { title: 'Exclusive App Deals', description: 'Access app-only discounts and flash sales' },
  { title: 'Real-time Tracking', description: 'Track your orders live from warehouse to doorstep' },
  { title: 'Faster Checkout', description: 'One-tap payments with saved preferences' },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
}

const phoneVariants = {
  hidden: { opacity: 0, x: 40, scale: 0.95 },
  visible: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.7, ease: 'easeOut' as const, delay: 0.3 } },
}

export function AppDownloadCta() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' })

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-default-50 py-16 md:py-24">
      <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-accent/[0.04]" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-accent/[0.03]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="flex flex-col items-center gap-12 lg:flex-row lg:gap-16"
        >
          {/* Left Column: Text + Buttons */}
          <div className="flex flex-1 flex-col items-start gap-6 lg:gap-8">
            <motion.div variants={itemVariants}>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
                <Smartphone className="h-3.5 w-3.5" />
                Mobile App
              </span>
            </motion.div>

            <motion.h2 variants={itemVariants} className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Shop on the Go
            </motion.h2>

            <motion.p variants={itemVariants} className="max-w-lg text-base leading-relaxed text-default-500 md:text-lg">
              Download the KWIKSELLER app for exclusive deals, real-time order
              tracking, and a faster shopping experience.
            </motion.p>

            <motion.ul variants={containerVariants} className="flex flex-col gap-3">
              {features.map((feature) => (
                <motion.li key={feature.title} variants={itemVariants} className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                  <div>
                    <span className="font-semibold">{feature.title}</span>
                    <span className="mx-1 text-default-300">—</span>
                    <span className="text-sm text-default-500">{feature.description}</span>
                  </div>
                </motion.li>
              ))}
            </motion.ul>

            <motion.div variants={itemVariants} className="mt-2 flex flex-wrap gap-4">
              {/* App Store */}
              <button className="flex flex-row items-center gap-3 px-4 py-3 w-48 border border-border bg-background shadow-md hover:shadow-lg transition-shadow rounded-xl">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-medium leading-none text-default-400">Download on the</span>
                  <span className="text-sm font-bold leading-tight">App Store</span>
                </div>
              </button>

              {/* Google Play */}
              <button className="flex flex-row items-center gap-3 px-4 py-3 w-48 border border-border bg-background shadow-md hover:shadow-lg transition-shadow rounded-xl">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                    <path d="M3.18 23.58c-.4-.2-.68-.58-.68-1.02V1.44c0-.44.28-.82.68-1.02l10.1 11.58L3.18 23.58zm12.69-7.26L4.51 23.11l10.1-6.79h1.26zm0-8.64h-1.26L4.51.89l11.36 6.79zm4.42 3.86c.37.21.68.58.68 1.02 0 .44-.31.81-.68 1.02l-2.66 1.52-2.95-2.54 2.95-2.54 2.66 1.52z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-medium leading-none text-default-400">Get it on</span>
                  <span className="text-sm font-bold leading-tight">Google Play</span>
                </div>
              </button>
            </motion.div>
          </div>

          {/* Right Column: CSS Phone Mockup */}
          <motion.div
            variants={phoneVariants}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            className="flex flex-1 items-center justify-center"
          >
            <div className="relative">
              <div className={cn(
                'relative mx-auto h-[520px] w-[260px] rounded-[2.5rem] border-[6px] border-foreground bg-background shadow-2xl',
              )}>
                {/* Notch */}
                <div className="absolute left-1/2 top-0 z-10 h-6 w-24 -translate-x-1/2 rounded-b-2xl bg-foreground" />

                {/* Status bar */}
                <div className="flex items-center justify-between px-6 pt-8 pb-2">
                  <span className="text-[10px] font-semibold">9:41</span>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-3 rounded-sm bg-default-400" />
                    <div className="h-2.5 w-1.5 rounded-full border border-default-400" />
                  </div>
                </div>

                {/* Screen content */}
                <div className="flex flex-col gap-3 px-4 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="h-2 w-16 rounded bg-default-200" />
                      <div className="mt-1.5 h-2.5 w-24 rounded bg-foreground" />
                    </div>
                    <div className="h-8 w-8 rounded-full bg-accent/10" />
                  </div>
                  <div className="mt-1 flex h-9 items-center gap-2 rounded-xl bg-default-100 px-3">
                    <div className="h-3 w-3 rounded-full bg-default-300" />
                    <div className="h-2 w-28 rounded bg-default-200" />
                  </div>
                  <div className="mt-1 h-24 rounded-xl bg-accent p-3">
                    <div className="h-2 w-20 rounded bg-white/40" />
                    <div className="mt-1.5 h-1.5 w-32 rounded bg-white/25" />
                    <div className="mt-1.5 h-1.5 w-24 rounded bg-white/25" />
                    <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/30 px-2.5 py-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                      <div className="h-1.5 w-12 rounded bg-white/70" />
                    </div>
                  </div>
                  <div className="mt-1 h-2.5 w-24 rounded bg-foreground" />
                  <div className="grid grid-cols-2 gap-2">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="flex flex-col gap-1.5 rounded-xl border border-border p-2">
                        <div className={cn('h-14 w-full rounded-lg', i % 2 === 0 ? 'bg-accent/10' : 'bg-success/10')} />
                        <div className="h-1.5 w-full rounded bg-default-200" />
                        <div className="h-1.5 w-2/3 rounded bg-default-200" />
                        <div className="mt-auto flex items-center justify-between">
                          <div className="h-2 w-10 rounded bg-accent" />
                          <div className="h-5 w-5 rounded-full bg-accent" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom nav */}
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-around border-t border-border bg-background py-2.5">
                  {['Home', 'Search', 'Cart', 'Profile'].map((label) => (
                    <div key={label} className="flex flex-col items-center gap-0.5">
                      <div className={cn('h-4 w-4 rounded', label === 'Home' ? 'bg-accent' : 'bg-default-300')} />
                      <div className={cn('h-1 w-6 rounded', label === 'Home' ? 'bg-accent' : 'bg-default-200')} />
                    </div>
                  ))}
                </div>
                <div className="absolute bottom-1.5 left-1/2 h-1 w-16 -translate-x-1/2 rounded-full bg-default-300" />
              </div>

              {/* Floating badge */}
              <div className="absolute -bottom-4 -right-4 -z-10 flex h-20 w-20 items-center justify-center rounded-2xl bg-accent shadow-lg">
                <Download className="h-8 w-8 text-accent-foreground" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
