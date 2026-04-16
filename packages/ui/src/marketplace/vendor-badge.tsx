'use client'

import React from 'react'
import { Chip } from '@heroui/react'
import { cn } from '../lib/utils'
import { BadgeCheck } from 'lucide-react'

/**
 * VendorBadge — "Verified Vendor" indicator shown next to vendor names.
 *
 * Can be used in product cards, storefront headers, review sections, etc.
 * Both buyer and vendor apps share this component.
 */

export type VendorBadgeSize = 'sm' | 'md' | 'lg'
export type VendorBadgeVariant = 'chip' | 'icon' | 'text'

export interface VendorBadgeProps {
  /** Whether the vendor is verified */
  isVerified?: boolean
  /** Display size */
  size?: VendorBadgeSize
  /** Visual variant */
  variant?: VendorBadgeVariant
  /** Custom label (overrides default "Verified") */
  label?: string
  /** Additional className */
  className?: string
}

const sizeConfig = {
  sm: { icon: 'w-3 h-3', chip: 'sm' as const, text: 'text-[10px]' },
  md: { icon: 'w-4 h-4', chip: 'md' as const, text: 'text-xs' },
  lg: { icon: 'w-5 h-5', chip: 'lg' as const, text: 'text-sm' },
}

/**
 * VendorBadge — verified vendor indicator
 */
export function VendorBadge({
  isVerified = true,
  size = 'md',
  variant = 'chip',
  label,
  className,
}: VendorBadgeProps) {
  if (!isVerified) return null

  const config = sizeConfig[size]
  const displayLabel = label ?? 'Verified Vendor'

  // Chip variant — uses HeroUI Chip component with icon + text as children
  if (variant === 'chip') {
    return (
      <Chip
        size={config.chip}
        color="success"
        variant="soft"
        className={cn('font-medium', className)}
      >
        <BadgeCheck className={cn('text-success', config.icon)} />
        {displayLabel}
      </Chip>
    )
  }

  // Icon-only variant — just the verified icon
  if (variant === 'icon') {
    return (
      <BadgeCheck
        className={cn('text-success', config.icon, className)}
        aria-label={displayLabel}
      />
    )
  }

  // Text variant — icon + text inline
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-success font-medium',
        config.text,
        className
      )}
    >
      <BadgeCheck className={config.icon} />
      {displayLabel}
    </span>
  )
}

export default VendorBadge
