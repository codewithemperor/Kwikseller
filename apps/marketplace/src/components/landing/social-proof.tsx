'use client'

import React, { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const partners = [
  { name: 'Paystack', logo: 'PS' },
  { name: 'Flutterwave', logo: 'FW' },
  { name: 'FedEx', logo: 'FX' },
  { name: 'DHL', logo: 'DH' },
  { name: 'GIG Logistics', logo: 'GL' },
  { name: 'Bolt', logo: 'BL' },
  { name: 'MTN', logo: 'MT' },
  { name: 'Airtel', logo: 'AI' },
  { name: 'MoMo', logo: 'MM' },
  { name: 'Opay', logo: 'OP' },
  { name: 'PalmPay', logo: 'PP' },
  { name: 'Cowrywise', logo: 'CW' },
]

function MarqueeRow({ items, direction = 'left', speed = 35 }: { items: typeof partners; direction?: 'left' | 'right'; speed?: number }) {
  return (
    <div className="flex overflow-hidden">
      <div
        className="flex items-center gap-10 md:gap-14 shrink-0 animate-marquee"
        style={{
          animationDirection: direction === 'right' ? 'reverse' : 'normal',
          animationDuration: `${speed}s`,
        }}
      >
        {/* Duplicate items for seamless loop */}
        {[...items, ...items, ...items].map((partner, i) => (
          <div
            key={`${partner.name}-${i}`}
            className="flex items-center gap-2.5 text-default-300 hover:text-default-500 transition-colors duration-300 cursor-pointer shrink-0"
            title={partner.name}
          >
            <div className="w-11 h-11 rounded-xl bg-default-100 flex items-center justify-center font-bold text-xs text-default-500 hover:bg-accent/10 hover:text-accent transition-colors shadow-sm">
              {partner.logo}
            </div>
            <span className="text-sm font-semibold hidden sm:inline whitespace-nowrap">{partner.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SocialProof() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-40px' })

  const row1 = partners.slice(0, 6)
  const row2 = partners.slice(6, 12)

  return (
    <section ref={sectionRef} className="py-14 border-y border-divider bg-default-50/50 overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-6"
      >
        {/* Label */}
        <p className="text-center text-xs text-default-400 uppercase tracking-[0.2em] font-semibold mb-4">
          Trusted by leading brands and partners
        </p>

        {/* Row 1 - scrolling left */}
        <MarqueeRow items={row1} direction="left" speed={30} />

        {/* Row 2 - scrolling right */}
        {row2.length > 0 && (
          <MarqueeRow items={row2} direction="right" speed={35} />
        )}
      </motion.div>
    </section>
  )
}
