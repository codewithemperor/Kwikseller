'use client'

import React from 'react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Store } from 'lucide-react'
import { cn } from '@kwikseller/ui'

/* ============================================================
   PageLoader — Full-screen splash / loading overlay
   Shows a branded loading animation while the page prepares.
   ============================================================ */

interface PageLoaderProps {
  isLoading: boolean
  vendorSlug?: string
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

function titleFromSlug(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

/* ── Component ──────────────────────────────────────────── */

export function PageLoader({ isLoading, vendorSlug }: PageLoaderProps) {
  const pathname = usePathname()
  const activeVendorSlug = vendorSlug ?? (pathname.startsWith('/vendor/') ? pathname.split('/')[2] : undefined)
  const [vendorBrand, setVendorBrand] = React.useState<{
    name: string
    logoUrl?: string | null
    primaryColor?: string
    accentColor?: string
  } | null>(null)

  React.useEffect(() => {
    if (!activeVendorSlug) {
      setVendorBrand(null)
      return
    }

    try {
      const saved = window.sessionStorage.getItem('kwik.vendorLoader')
      const parsed = saved ? JSON.parse(saved) as {
        slug?: string
        name?: string
        logoUrl?: string | null
        primaryColor?: string
        accentColor?: string
      } : null
      setVendorBrand({
        name: parsed?.slug === activeVendorSlug && parsed.name ? parsed.name : titleFromSlug(activeVendorSlug),
        logoUrl: parsed?.slug === activeVendorSlug ? parsed.logoUrl : null,
        primaryColor: parsed?.slug === activeVendorSlug ? parsed.primaryColor : undefined,
        accentColor: parsed?.slug === activeVendorSlug ? parsed.accentColor : undefined,
      })
    } catch {
      setVendorBrand({ name: titleFromSlug(activeVendorSlug), logoUrl: null })
    }
  }, [activeVendorSlug])

  const isVendorLoading = Boolean(activeVendorSlug)
  const vendorPrimary = vendorBrand?.primaryColor ?? 'var(--loader-primary, #071A2F)'
  const vendorAccent = vendorBrand?.accentColor ?? 'var(--loader-accent, #F97316)'

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
              <div
                className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-background shadow-lg ring-1 ring-border"
                style={isVendorLoading ? { borderColor: vendorAccent } : undefined}
              >
                {isVendorLoading ? (
                  vendorBrand?.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={vendorBrand.logoUrl} alt="" className="h-14 w-14 object-cover" />
                  ) : (
                    <Store className="h-10 w-10" style={{ color: vendorPrimary }} />
                  )
                ) : (
                  <Image
                    src="/icon.png"
                    alt="Kwikseller"
                    width={52}
                    height={52}
                    style={{ width: 52, height: 52 }}
                    priority
                  />
                )}
              </div>
            </motion.div>

            {/* Brand name — letter-by-letter stagger */}
            {!isVendorLoading && <motion.div
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
            </motion.div>}
            {isVendorLoading && (
              <motion.h1
                variants={taglineVariants}
                initial="hidden"
                animate="visible"
                className="max-w-xs text-center font-heading text-2xl font-bold"
                style={{ color: vendorPrimary }}
              >
                {vendorBrand?.name ?? titleFromSlug(activeVendorSlug ?? '')}
              </motion.h1>
            )}

            {/* Loading dots */}
            <div className="flex items-center gap-2 h-4">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-accent"
                  style={isVendorLoading ? { backgroundColor: vendorAccent } : undefined}
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
              className={cn('tracking-wide', isVendorLoading ? 'text-[10px] uppercase' : 'text-sm text-default-400')}
              style={isVendorLoading ? { color: vendorPrimary } : undefined}
            >
              {isVendorLoading ? 'Powered by Kwikseller' : "Africa's Commerce Platform"}
            </motion.p>
          </div>

          {/* ── Progress bar at bottom ────────────────────── */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-default-100">
            <motion.div
              className="h-full kwik-gradient"
              style={isVendorLoading ? { background: `linear-gradient(90deg, ${vendorPrimary}, ${vendorAccent})` } : undefined}
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
