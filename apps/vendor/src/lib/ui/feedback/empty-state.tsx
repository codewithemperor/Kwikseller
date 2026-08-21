'use client'

import React from 'react'
import { Button } from '@heroui/react'
import { cn } from '../lib/utils'
import { LucideIcon, Package, Search, AlertCircle } from 'lucide-react'

export type EmptyStateVariant = 'default' | 'search' | 'orders' | 'products' | 'error'

export interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  variant?: EmptyStateVariant
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

const variantConfig: Record<EmptyStateVariant, { icon: LucideIcon; defaultTitle: string }> = {
  default: { icon: Package, defaultTitle: 'No items found' },
  search: { icon: Search, defaultTitle: 'No results found' },
  orders: { icon: Package, defaultTitle: 'No orders yet' },
  products: { icon: Package, defaultTitle: 'No products found' },
  error: { icon: AlertCircle, defaultTitle: 'Something went wrong' },
}

/**
 * EmptyState - A shared empty state component
 */
export function EmptyState({
  icon,
  title,
  description,
  variant = 'default',
  action,
  className,
}: EmptyStateProps) {
  const Icon = icon || variantConfig[variant].icon
  const displayTitle = title || variantConfig[variant].defaultTitle

  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-4 text-center',
      className
    )}>
      <div className="w-16 h-16 rounded-full bg-default-100 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-default-400" />
      </div>
      
      <h3 className="text-lg font-semibold mb-2">{displayTitle}</h3>
      
      {description && (
        <p className="text-default-500 mb-4 max-w-md">{description}</p>
      )}
      
      {action && (
        <Button
          variant="primary"
          onPress={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}

export default EmptyState
