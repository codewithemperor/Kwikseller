'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Globe, Users, Package, MapPin } from 'lucide-react'
import { Chip, Card } from '@heroui/react'

// ─── Country data ────────────────────────────────────────────────
const countries = [
  { name: 'Morocco', vendors: 1240, x: 27, y: 12 },
  { name: 'Egypt', vendors: 1850, x: 62, y: 16 },
  { name: 'Senegal', vendors: 620, x: 18, y: 30 },
  { name: 'Nigeria', vendors: 3200, x: 38, y: 40 },
  { name: 'Ghana', vendors: 980, x: 35, y: 44 },
  { name: "Côte d'Ivoire", vendors: 750, x: 32, y: 47 },
  { name: 'Cameroon', vendors: 870, x: 41, y: 50 },
  { name: 'Ethiopia', vendors: 1100, x: 63, y: 36 },
  { name: 'Congo', vendors: 430, x: 50, y: 57 },
  { name: 'Uganda', vendors: 680, x: 57, y: 44 },
  { name: 'Kenya', vendors: 2100, x: 60, y: 48 },
  { name: 'Rwanda', vendors: 540, x: 55, y: 46 },
  { name: 'Tanzania', vendors: 960, x: 57, y: 56 },
  { name: 'Mozambique', vendors: 380, x: 56, y: 70 },
  { name: 'South Africa', vendors: 2650, x: 47, y: 82 },
]

const totalVendors = countries.reduce((sum, c) => sum + c.vendors, 0)

// ─── Country Dot Component ───────────────────────────────────────

function CountryDot({
  country,
  index,
}: {
  country: (typeof countries)[0]
  index: number
}) {
  const [isHovered, setIsHovered] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-20px' })

  // Scale dot size based on vendor count
  const minSize = 10
  const maxSize = 22
  const minVendors = 380
  const maxVendors = 3200
  const scale = (country.vendors - minVendors) / (maxVendors - minVendors)
  const size = minSize + scale * (maxSize - minSize)

  // Staggered delay based on index
  const delay = 0.3 + index * 0.06

  return (
    <motion.div
      ref={ref}
      className="absolute z-10"
      style={{
        left: `${country.x}%`,
        top: `${country.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={
        isInView
          ? { opacity: 1, scale: 1 }
          : { opacity: 0, scale: 0 }
      }
      transition={{
        duration: 0.5,
        delay,
        type: 'spring',
        stiffness: 200,
        damping: 15,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Pulse ring */}
      <motion.div
        className="absolute rounded-full bg-accent/30"
        style={{
          width: size + 16,
          height: size + 16,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        animate={
          isHovered
            ? {
                scale: [1, 1.8, 1.8],
                opacity: [0.5, 0, 0],
              }
            : {
                scale: [1, 1.5, 1.5],
                opacity: [0.3, 0, 0],
              }
        }
        transition={{
          duration: isHovered ? 0.8 : 1.5,
          repeat: Infinity,
          ease: 'easeOut',
        }}
      />

      {/* Main dot */}
      <motion.div
        className="relative rounded-full bg-accent shadow-lg cursor-pointer"
        style={{ width: size, height: size }}
        animate={
          isHovered
            ? { scale: 1.3, boxShadow: '0 0 20px 4px oklch(0.7 0.17 48 / 50%)' }
            : { scale: 1, boxShadow: '0 0 8px 1px oklch(0.7 0.17 48 / 30%)' }
        }
        transition={{ duration: 0.2 }}
      >
        {/* Inner highlight */}
        <div className="absolute inset-1 rounded-full bg-white/40" />
      </motion.div>

      {/* Tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 pointer-events-none"
          >
            <div className="bg-white/95 dark:bg-default-100/95 backdrop-blur-md rounded-lg px-3 py-2 shadow-xl border border-border min-w-[140px]">
              <div className="flex items-center gap-1.5 mb-0.5">
                <MapPin className="w-3 h-3 text-accent" />
                <span className="text-xs font-semibold text-foreground">
                  {country.name}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-default-500">
                <Users className="w-3 h-3" />
                <span>
                  {country.vendors.toLocaleString()} vendors
                </span>
              </div>
              {/* Arrow */}
              <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-white/95 dark:bg-default-100/95 border-r border-b border-border rotate-45" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Stat Card Component ─────────────────────────────────────────

function StatCard({
  icon: Icon,
  value,
  label,
  suffix,
  delay,
}: {
  icon: React.ElementType
  value: number
  label: string
  suffix?: string
  delay: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })
  const [count, setCount] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!isInView) return
    const duration = 1800
    const increment = value / (duration / 16)
    let start = 0
    const timer = setInterval(() => {
      start += increment
      if (start >= value) {
        setCount(value)
        setDone(true)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [isInView, value])

  const displayValue = done
    ? label === '15+ Countries'
      ? '15+'
      : label === '10K+ Vendors'
        ? '10K+'
        : '500K+'
    : `${count.toLocaleString()}${suffix || ''}`

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      <Card className="bg-white/10 backdrop-blur-md border border-white/20 p-5 text-center">
        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mx-auto mb-3">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="text-2xl md:text-3xl font-bold text-white mb-1">
          {displayValue}
        </div>
        <div className="text-sm text-white/60">{label}</div>
      </Card>
    </motion.div>
  )
}

// ─── Africa Silhouette (CSS clip-path) ───────────────────────────

function AfricaSilhouette() {
  return (
    <div
      className="absolute inset-0 opacity-[0.07] pointer-events-none"
      style={{
        background: 'linear-gradient(135deg, #fff 0%, #fff 100%)',
        clipPath:
          'polygon(27% 3%, 32% 1%, 38% 2%, 44% 1%, 50% 1%, 55% 2%, 60% 3%, 65% 5%, 68% 9%, 70% 14%, 72% 18%, 71% 22%, 68% 25%, 66% 28%, 68% 32%, 70% 36%, 71% 40%, 69% 44%, 67% 47%, 68% 50%, 70% 53%, 69% 57%, 67% 60%, 65% 64%, 62% 67%, 60% 70%, 58% 73%, 56% 76%, 54% 79%, 52% 82%, 50% 85%, 48% 88%, 46% 90%, 44% 88%, 42% 85%, 40% 82%, 38% 78%, 36% 74%, 34% 70%, 32% 66%, 30% 62%, 28% 58%, 26% 54%, 24% 50%, 22% 46%, 20% 42%, 18% 38%, 16% 34%, 15% 30%, 16% 26%, 18% 22%, 20% 18%, 22% 14%, 24% 10%, 26% 6%)',
      }}
    />
  )
}

// ─── Main Component ──────────────────────────────────────────────

export function AfricaCoverageMap() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' })

  return (
    <section className="py-16 md:py-20 kwik-gradient relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-white/[0.03] rounded-full blur-2xl pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          ref={sectionRef}
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 md:mb-14"
        >
          <Chip
            variant="soft"
            className="mb-4 bg-white/15 text-white border-white/20 backdrop-blur-sm"
          >
            <Globe className="w-4 h-4 mr-1" />
            Pan-African Coverage
          </Chip>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3">
            Serving Across Africa
          </h2>
          <p className="text-white/60 max-w-xl mx-auto text-sm md:text-base">
            From North to South, East to West — connecting vendors and buyers across the continent.
          </p>
        </motion.div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-center">
          {/* Map Visualization — 3 columns on desktop */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -40 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="lg:col-span-3 order-1"
          >
            <div className="relative w-full aspect-[4/5] md:aspect-[3/4] rounded-2xl bg-black/20 backdrop-blur-sm border border-white/10 overflow-hidden shadow-2xl">
              {/* Subtle grid pattern */}
              <div className="absolute inset-0 pattern-grid opacity-5 pointer-events-none" />

              {/* Africa silhouette background */}
              <AfricaSilhouette />

              {/* Connection lines (decorative) */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none opacity-10"
                xmlns="http://www.w3.org/2000/svg"
              >
                <line x1="38%" y1="40%" x2="60%" y2="48%" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
                <line x1="35%" y1="44%" x2="38%" y2="40%" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
                <line x1="41%" y1="50%" x2="50%" y2="57%" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
                <line x1="57%" y1="44%" x2="57%" y2="56%" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
                <line x1="47%" y1="82%" x2="56%" y2="70%" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
                <line x1="62%" y1="36%" x2="60%" y2="48%" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
              </svg>

              {/* Country dots */}
              {countries.map((country, index) => (
                <CountryDot key={country.name} country={country} index={index} />
              ))}

              {/* Legend */}
              <div className="absolute bottom-3 left-3 right-3 md:bottom-4 md:left-4 md:right-auto">
                <div className="bg-black/40 backdrop-blur-md rounded-lg px-3 py-2 border border-white/10">
                  <div className="flex items-center gap-3 text-[10px] md:text-xs text-white/70">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-accent" />
                      <span>High activity</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent/60" />
                      <span>Growing</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Country List + Stats — 2 columns on desktop */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="lg:col-span-2 order-2"
          >
            {/* Stat Cards */}
            <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
              <StatCard
                icon={Globe}
                value={15}
                label="15+ Countries"
                delay={0.4}
              />
              <StatCard
                icon={Users}
                value={10000}
                label="10K+ Vendors"
                delay={0.5}
              />
              <StatCard
                icon={Package}
                value={500000}
                label="500K+ Products"
                delay={0.6}
              />
            </div>

            {/* Country List */}
            <Card className="bg-white/10 backdrop-blur-md border border-white/20 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-accent" />
                  Active Markets
                </h3>
              </div>
              <div className="max-h-64 md:max-h-72 overflow-y-auto scrollbar-thin p-1">
                {countries.map((country, index) => (
                  <motion.div
                    key={country.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, delay: 0.35 + index * 0.04 }}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      {/* Mini dot */}
                      <div className="w-2 h-2 rounded-full bg-accent group-hover:animate-pulse-glow transition-all" />
                      <span className="text-sm text-white/90 font-medium">
                        {country.name}
                      </span>
                    </div>
                    <span className="text-xs text-white/50 font-mono tabular-nums">
                      {country.vendors.toLocaleString()} vendors
                    </span>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
