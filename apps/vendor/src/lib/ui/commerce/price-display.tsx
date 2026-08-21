'use client'

import React from 'react'
import { cn, formatCurrency } from '../lib/utils'

export interface PriceDisplayProps {
  price: number
  comparePrice?: number
  currency?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showDiscount?: boolean
  className?: string
}

/**
 * PriceDisplay - A shared price display component with optional discount
 */
export function PriceDisplay({
  price,
  comparePrice,
  currency = 'NGN',
  size = 'md',
  showDiscount = true,
  className,
}: PriceDisplayProps) {
  const discount = comparePrice && price < comparePrice
    ? Math.round(((comparePrice - price) / comparePrice) * 100)
    : 0

  const sizeClasses = {
    sm: {
      price: 'text-sm',
      compare: 'text-xs',
      discount: 'text-xs',
    },
    md: {
      price: 'text-lg',
      compare: 'text-sm',
      discount: 'text-xs',
    },
    lg: {
      price: 'text-2xl',
      compare: 'text-base',
      discount: 'text-sm',
    },
    xl: {
      price: 'text-3xl',
      compare: 'text-lg',
      discount: 'text-sm',
    },
  }

  const classes = sizeClasses[size]

  return (
    <div className={cn('flex items-baseline gap-2', className)}>
      <span className={cn('font-bold text-primary', classes.price)}>
        {formatCurrency(price, currency)}
      </span>
      {comparePrice && comparePrice > price && (
        <>
          <span className={cn('text-default-400 line-through', classes.compare)}>
            {formatCurrency(comparePrice, currency)}
          </span>
          {showDiscount && discount > 0 && (
            <span className={cn('text-success font-medium', classes.discount)}>
              Save {discount}%
            </span>
          )}
        </>
      )}
    </div>
  )
}

export default PriceDisplay
