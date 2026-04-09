'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Clock, Zap, ChevronRight, ShoppingCart } from 'lucide-react'
import { Button, Chip, Card } from '@heroui/react'
import { useCartStore } from '@/stores'
import { kwikToast } from '@kwikseller/utils'

// Sample deal products
const deals = [
  { id: 'd1', name: 'Ankara Print Bundle (5 yards)', originalPrice: 18000, dealPrice: 8999, initials: 'AP', color: 'from-pink-500 to-rose-600', timeLeft: '2h 15m' },
  { id: 'd2', name: 'Wireless Earbuds Pro Max', originalPrice: 12000, dealPrice: 5499, initials: 'WE', color: 'from-blue-500 to-cyan-600', timeLeft: '4h 30m' },
  { id: 'd3', name: 'Organic Black Soap Pack', originalPrice: 5000, dealPrice: 2499, initials: 'BS', color: 'from-amber-500 to-orange-600', timeLeft: '1h 45m' },
  { id: 'd4', name: 'Smart Watch Ultra', originalPrice: 35000, dealPrice: 19999, initials: 'SW', color: 'from-purple-500 to-violet-600', timeLeft: '6h 00m' },
]

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Individual flip-style digit card
function DigitCard({ digit }: { digit: string }) {
  return (
    <div className="relative w-10 h-14 md:w-14 md:h-18 flex items-center justify-center">
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 shadow-lg overflow-hidden">
        <div className="absolute inset-x-0 top-1/2 h-px bg-white/10" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
      </div>
      <span className="relative z-10 text-2xl md:text-4xl font-bold text-white font-mono tabular-nums">
        {digit}
      </span>
    </div>
  )
}

// Single countdown unit (hours/minutes/seconds)
function TimeUnit({ value, label }: { value: number, label: string }) {
  const digits = String(value).padStart(2, '0').split('')

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-1">
        {digits.map((d, i) => (
          <DigitCard key={i} digit={d} />
        ))}
      </div>
      <span className="text-xs md:text-sm text-white/60 uppercase tracking-wider font-medium">
        {label}
      </span>
    </div>
  )
}

function DealCard({
  deal,
  index,
}: {
  deal: typeof deals[0]
  index: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })
  const addItem = useCartStore((s) => s.addItem)

  const discount = Math.round(
    ((deal.originalPrice - deal.dealPrice) / deal.originalPrice) * 100
  )

  const handleShopNow = (e: React.MouseEvent) => {
    e.stopPropagation()
    addItem({
      productId: deal.id,
      name: deal.name,
      price: deal.dealPrice,
      comparePrice: deal.originalPrice,
      image: '',
      store: 'Flash Deal',
    })
    kwikToast.success(`${deal.name} added to cart!`)
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 40, scale: 0.95 }}
      transition={{ duration: 0.5, delay: index * 0.12, ease: 'easeOut' }}
      className="min-w-[280px] md:min-w-[300px] snap-center flex-shrink-0"
    >
      <Card className="overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
        {/* Product Image Area */}
        <div className="relative h-44 md:h-52 overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${deal.color}`} />

          {/* Large Initials */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl md:text-7xl font-black text-white/20 select-none">
              {deal.initials}
            </span>
          </div>

          {/* Decorative circles */}
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/10" />

          {/* Discount Badge */}
          <div className="absolute top-3 left-3 z-10">
            <Chip color="danger" size="sm" className="font-bold shadow-lg">
              -{discount}%
            </Chip>
          </div>

          {/* Time Left Badge */}
          <div className="absolute top-3 right-3 z-10">
            <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-2.5 py-1">
              <Clock className="w-3 h-3 text-white" />
              <span className="text-xs text-white font-medium">{deal.timeLeft}</span>
            </div>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4 md:p-5">
          <h3 className="font-semibold text-white text-sm md:text-base line-clamp-2 mb-3 min-h-[2.5rem]">
            {deal.name}
          </h3>

          {/* Pricing */}
          <div className="flex items-end gap-2.5 mb-4">
            <span className="text-xl md:text-2xl font-bold text-white">
              {formatCurrency(deal.dealPrice)}
            </span>
            <span className="text-sm text-white/50 line-through mb-0.5">
              {formatCurrency(deal.originalPrice)}
            </span>
          </div>

          {/* Savings Info */}
          <div className="flex items-center gap-1.5 mb-4">
            <span className="text-xs bg-success/20 text-success-foreground px-2 py-0.5 rounded-full font-medium">
              You save {formatCurrency(deal.originalPrice - deal.dealPrice)}
            </span>
          </div>

          {/* Shop Now Button */}
          <Button
            size="md"
            className="w-full bg-white text-foreground font-semibold hover:bg-white/90 shadow-lg transition-all duration-200"
            onClick={handleShopNow}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Shop Now
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}

export function DealsOfTheDay() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' })

  // Countdown timer — 8 hours from mount
  const [timeLeft, setTimeLeft] = useState({
    hours: 8,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    // Set the end time to 8 hours from now on mount
    const endTime = Date.now() + 8 * 60 * 60 * 1000

    const updateTimer = () => {
      const now = Date.now()
      const diff = Math.max(0, endTime - now)

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 })
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft({ hours, minutes, seconds })
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [])

  // Scroll ref for horizontal deal cards
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const updateScrollButtons = () => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setCanScrollLeft(scrollLeft > 5)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5)
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    updateScrollButtons()
    el.addEventListener('scroll', updateScrollButtons, { passive: true })
    return () => el.removeEventListener('scroll', updateScrollButtons)
  }, [])

  const scrollDeals = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const scrollAmount = 320
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  return (
    <section className="py-16 md:py-20 kwik-gradient relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.02] rounded-full" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          ref={sectionRef}
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <Chip
            variant="soft"
            className="mb-4 bg-white/15 text-white border-white/20 backdrop-blur-sm"
          >
            <Zap className="w-4 h-4 mr-1" />
            Flash Deals
          </Chip>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3">
            Deals of the Day
          </h2>
          <p className="text-white/60 max-w-xl mx-auto text-sm md:text-base">
            Grab incredible bargains before time runs out. Updated daily!
          </p>
        </motion.div>

        {/* Countdown Timer */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex items-center justify-center gap-3 md:gap-5 mb-12"
        >
          <div className="flex items-center gap-2 text-white/70 mb-6">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-medium">Ends in:</span>
          </div>
          <div className="flex items-center gap-3 md:gap-5">
            <TimeUnit value={timeLeft.hours} label="Hours" />
            <span className="text-2xl md:text-3xl font-bold text-white/40 mb-6 mt-0">:</span>
            <TimeUnit value={timeLeft.minutes} label="Minutes" />
            <span className="text-2xl md:text-3xl font-bold text-white/40 mb-6 mt-0">:</span>
            <TimeUnit value={timeLeft.seconds} label="Seconds" />
          </div>
        </motion.div>

        {/* Deal Cards Row */}
        <div className="relative">
          {/* Scroll arrows — desktop only */}
          {canScrollLeft && (
            <button
              onClick={() => scrollDeals('left')}
              className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 items-center justify-center text-white hover:bg-white/25 transition-colors shadow-lg"
              aria-label="Scroll left"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={() => scrollDeals('right')}
              className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 items-center justify-center text-white hover:bg-white/25 transition-colors shadow-lg"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Scrollable container */}
          <div
            ref={scrollRef}
            className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-thin pb-4 px-1"
          >
            {deals.map((deal, index) => (
              <DealCard key={deal.id} deal={deal} index={index} />
            ))}
          </div>

          {/* Fade edges */}
          <div className="absolute top-0 left-0 w-8 h-full bg-gradient-to-r from-[#0D1B5E] to-transparent pointer-events-none z-10 hidden md:block" />
          <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-[#F07A22] to-transparent pointer-events-none z-10 hidden md:block" />
        </div>
      </div>
    </section>
  )
}
