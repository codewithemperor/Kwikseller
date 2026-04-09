'use client'

import React from 'react'
import { cn } from '@kwikseller/ui'

/* ============================================================
   SkeletonPulse — Base shimmer animation wrapper
   Uses the existing `animate-shimmer` utility from globals.css
   which reads HeroUI's `--default` and `--default-foreground`
   CSS variables (auto light / dark mode).
   ============================================================ */

interface SkeletonPulseProps {
  className?: string
  delay?: number
}

export function SkeletonPulse({ className, delay = 0 }: SkeletonPulseProps) {
  return (
    <div
      className={cn('animate-shimmer rounded-md', className)}
      style={{ animationDelay: `${delay}ms` }}
      aria-hidden="true"
    />
  )
}

/* ============================================================
   ProductCardSkeleton — Mirrors the product card layout from
   TrendingProducts (aspect-square image, title, price, stars).
   ============================================================ */

export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl ring-1 ring-default-200 bg-background overflow-hidden',
        className,
      )}
    >
      {/* Image area */}
      <SkeletonPulse className="w-full aspect-square rounded-none" />

      {/* Content */}
      <div className="p-4 flex flex-col gap-2">
        {/* Store name */}
        <SkeletonPulse className="h-3 w-1/3" />

        {/* Title — two lines */}
        <SkeletonPulse className="h-4 w-3/4" />
        <SkeletonPulse className="h-4 w-1/2" />

        {/* Rating row */}
        <div className="flex items-center gap-1.5">
          {[...Array(4)].map((_, i) => (
            <SkeletonPulse key={i} className="h-3.5 w-3.5 rounded-full" />
          ))}
          <SkeletonPulse className="h-3 w-16" />
        </div>

        {/* Price */}
        <SkeletonPulse className="h-5 w-1/4 mt-1" />
      </div>
    </div>
  )
}

/* ============================================================
   VendorCardSkeleton — Mirrors the vendor card layout from
   TopVendors (avatar, name, location, rating, description, stats).
   ============================================================ */

export function VendorCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl ring-1 ring-default-200 bg-background p-6 flex flex-col gap-4',
        className,
      )}
    >
      {/* Top row — avatar + info */}
      <div className="flex items-start gap-4">
        {/* Avatar circle */}
        <SkeletonPulse className="w-14 h-14 rounded-full shrink-0" />

        <div className="flex flex-col gap-2 flex-1 min-w-0">
          {/* Name + badge */}
          <div className="flex items-center gap-2">
            <SkeletonPulse className="h-4 w-2/3" />
            <SkeletonPulse className="h-5 w-16 rounded-full" />
          </div>
          {/* Location */}
          <SkeletonPulse className="h-3 w-1/2" />
        </div>
      </div>

      {/* Description */}
      <SkeletonPulse className="h-4 w-full" />
      <SkeletonPulse className="h-4 w-4/5" />

      {/* Bottom row — rating + stats */}
      <div className="flex items-center justify-between mt-auto">
        {/* Rating: circles + text */}
        <div className="flex items-center gap-1">
          {[...Array(3)].map((_, i) => (
            <SkeletonPulse key={i} className="h-4 w-4 rounded-full" />
          ))}
          <SkeletonPulse className="h-4 w-14" />
        </div>
        {/* Sales stat */}
        <SkeletonPulse className="h-3 w-20" />
      </div>
    </div>
  )
}

/* ============================================================
   TestimonialCardSkeleton — Mirrors the testimonial card layout
   from TestimonialCarousel (avatar, name, role, quote lines).
   ============================================================ */

export function TestimonialCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl ring-1 ring-default-200 bg-background p-6 flex flex-col gap-4',
        className,
      )}
    >
      {/* Stars row */}
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <SkeletonPulse key={i} className="h-4 w-4 rounded-sm" />
        ))}
      </div>

      {/* Quote — 3 lines of varying widths */}
      <div className="flex flex-col gap-2">
        <SkeletonPulse className="h-4 w-full" />
        <SkeletonPulse className="h-4 w-5/6" />
        <SkeletonPulse className="h-4 w-3/5" />
      </div>

      {/* Author row */}
      <div className="flex items-center gap-3 mt-auto">
        {/* Avatar */}
        <SkeletonPulse className="w-11 h-11 rounded-full shrink-0" />
        <div className="flex flex-col gap-1.5">
          {/* Name */}
          <SkeletonPulse className="h-4 w-1/3" />
          {/* Role / business */}
          <SkeletonPulse className="h-3 w-2/5" />
          {/* Location */}
          <SkeletonPulse className="h-3 w-2/5" />
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   SectionHeaderSkeleton — Generic section header skeleton
   (chip badge, title, description line).
   ============================================================ */

export function SectionHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('text-center mb-8 flex flex-col items-center gap-3', className)}>
      {/* Chip */}
      <SkeletonPulse className="h-6 w-24 rounded-full" />

      {/* Title */}
      <SkeletonPulse className="h-8 w-3/5 max-w-md" />

      {/* Description */}
      <SkeletonPulse className="h-4 w-2/3 max-w-lg" />
    </div>
  )
}

/* ============================================================
   HeroSkeleton — Full hero section skeleton matching the main
   hero layout (chip, title, description, buttons, check items).
   ============================================================ */

export function HeroSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center text-center gap-6 py-16',
        className,
      )}
    >
      {/* Chip */}
      <SkeletonPulse className="h-6 w-28 rounded-full" />

      {/* Title — 2 lines */}
      <div className="flex flex-col gap-3 w-full max-w-2xl">
        <SkeletonPulse className="h-10 md:h-12 w-full" />
        <SkeletonPulse className="h-10 md:h-12 w-full" />
      </div>

      {/* Description */}
      <SkeletonPulse className="h-5 w-2/3 max-w-lg" />

      {/* Buttons side by side */}
      <div className="flex items-center gap-3">
        <SkeletonPulse className="h-12 w-40 rounded-lg" />
        <SkeletonPulse className="h-12 w-40 rounded-lg" />
      </div>

      {/* Check items */}
      <div className="flex flex-col gap-2 mt-2">
        {[...Array(3)].map((_, i) => (
          <SkeletonPulse key={i} className="h-4 w-48" />
        ))}
      </div>
    </div>
  )
}
