'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Store } from 'lucide-react'
import { cn } from '@kwikseller/ui'

/* ============================================================
   PageLoader — Full-screen splash / loading overlay
   Shows a branded loading animation while the page prepares.
   ============================================================ */

interface PageLoaderProps {
  isLoading: boolean
}

/* ── Animation variants ─────────────────────────────────── */

const overlayVariants = {
  enter: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: {
    opacity: 0,
    scale: 0.95,
    filter: 'blur(4px)',
    transition: { duration: 0.5, ease: 'easeInOut' as const },
  },
}

const logoVariants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  },
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.3 },
  },
}

const letterVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' as const },
  },
}

const taglineVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6, delay: 1.2, ease: 'easeOut' as const },
  },
}

const dotBounce = {
  y: [0, -8, 0],
}

/* ── Brand name split ──────────────────────────────────── */

const brandName = 'KWIKSELLER'

/* ── Component ──────────────────────────────────────────── */

export function PageLoader({ isLoading }: PageLoaderProps) {
  return (
    <AnimatePresence mode="wait">
      {isLoading && (
        <motion.div
          key="page-loader"
          variants={overlayVariants}
          initial="enter"
          exit="exit"
          className="fixed inset-0 z-[100] bg-background flex items-center justify-center"
          aria-label="Loading page"
          role="status"
        >
          {/* ── Main centered content ─────────────────────── */}
          <div className="flex flex-col items-center gap-6">
            {/* Logo with pulsing glow */}
            <motion.div
              variants={logoVariants}
              initial="hidden"
              animate="visible"
              className="relative"
            >
              {/* Glow ring behind the logo */}
              <motion.div
                className="absolute inset-0 rounded-2xl animate-pulse-glow"
                style={{ width: '80px', height: '80px' }}
                aria-hidden="true"
              />

              {/* Logo square */}
              <div className="relative w-20 h-20 rounded-2xl kwik-gradient flex items-center justify-center">
                <Store className="w-10 h-10 text-white" />
              </div>
            </motion.div>

            {/* Brand name — letter-by-letter stagger */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="flex items-center"
            >
              {brandName.split('').map((letter, index) => {
                const isSeller = index >= 4 // "SELLER" starts at index 4

                return (
                  <motion.span
                    key={index}
                    variants={letterVariants}
                    className={cn(
                      'font-bold text-2xl inline-block',
                      isSeller
                        ? 'kwik-gradient-text'
                        : 'text-foreground',
                    )}
                  >
                    {letter}
                  </motion.span>
                )
              })}
            </motion.div>

            {/* Loading dots */}
            <div className="flex items-center gap-2 h-4">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-accent"
                  animate={dotBounce}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: 'easeInOut',
                  }}
                  aria-hidden="true"
                />
              ))}
            </div>

            {/* Tagline */}
            <motion.p
              variants={taglineVariants}
              initial="hidden"
              animate="visible"
              className="text-sm text-default-400 tracking-wide"
            >
              Africa&apos;s Commerce Platform
            </motion.p>
          </div>

          {/* ── Progress bar at bottom ────────────────────── */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-default-100">
            <motion.div
              className="h-full kwik-gradient"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, ease: 'easeInOut' }}
              aria-hidden="true"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
