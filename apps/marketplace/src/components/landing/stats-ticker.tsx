'use client'

import React from 'react'
import { cn } from '@kwikseller/ui'

const stats = [
  '12,543 orders processed today',
  '₦45M+ in transactions this month',
  '847 new vendors joined this week',
  '2.3M+ products and counting',
  '15 countries and growing',
  'Free delivery on 10K+ orders',
  '99.9% uptime guaranteed',
  '24/7 customer support',
  'Escrow protection on all payments',
  '15K+ 5-star reviews',
]

const separator = '  •  '

export function StatsTicker() {
  const content = stats.join(separator)
  // Triple the content so the -33.333% translateX creates a seamless loop
  const repeated = `${content}${separator}${content}${separator}${content}${separator}`

  return (
    <div className="relative w-full kwik-gradient overflow-hidden select-none">
      {/* Top separator line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-white/10" />

      {/* Subtle gradient overlays for fade edges */}
      <div className="absolute inset-y-0 left-0 w-16 md:w-32 bg-gradient-to-r from-[oklch(0.22_0.12_264)] to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-16 md:w-32 bg-gradient-to-l from-[oklch(0.7_0.17_48)] to-transparent z-10 pointer-events-none" />

      <div className="group flex items-center py-3">
        <div
          className="shrink-0 flex items-center whitespace-nowrap animate-marquee group-hover:[animation-play-state:paused]"
        >
          <span className="text-xs md:text-sm text-white/90 font-medium tracking-wide">
            {repeated}
          </span>
        </div>
      </div>

      {/* Bottom separator line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10" />
    </div>
  )
}
