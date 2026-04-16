'use client'

import React from 'react'
import { Chip } from '@heroui/react'
import { cn } from '../lib/utils'
import { Package, Clock, XCircle, CheckCircle2 } from 'lucide-react'

/**
 * PoolStatusBadge — shows the pool selling status of a product.
 *
 * Kwikseller's pool selling lets vendors list products in a shared pool
 * for wider reach. This badge communicates the current pool state to
 * both buyers and vendors.
 */

export type PoolStatus = 'IN_POOL' | 'NOT_IN_POOL' | 'PENDING' | 'REMOVED'

export interface PoolStatusBadgeProps {
  status: PoolStatus | string
  /** Visual size */
  size?: 'sm' | 'md' | 'lg'
  /** Show icon */
  showIcon?: boolean
  /** Additional className */
  className?: string
}

const STATUS_CONFIG: Record<
  string,
  {
    color: 'success' | 'danger' | 'warning' | 'default'
    label: string
    icon: React.ElementType
  }
> = {
  IN_POOL: { color: 'success', label: 'In Pool', icon: CheckCircle2 },
  ACTIVE: { color: 'success', label: 'In Pool', icon: CheckCircle2 },
  NOT_IN_POOL: { color: 'default', label: 'Not in Pool', icon: XCircle },
  NONE: { color: 'default', label: 'Not in Pool', icon: XCircle },
  PENDING: { color: 'warning', label: 'Pending', icon: Clock },
  REVIEW: { color: 'warning', label: 'Pending', icon: Clock },
  REMOVED: { color: 'danger', label: 'Removed', icon: XCircle },
  REJECTED: { color: 'danger', label: 'Rejected', icon: XCircle },
}

/**
 * PoolStatusBadge — pool selling status indicator
 */
export function PoolStatusBadge({
  status,
  size = 'md',
  showIcon = true,
  className,
}: PoolStatusBadgeProps) {
  const key = status.toUpperCase().replace(/[\s-]/g, '_')
  const config = STATUS_CONFIG[key] ?? {
    color: 'default' as const,
    label: status,
    icon: Package,
  }

  const Icon = config.icon

  return (
    <Chip
      color={config.color}
      size={size}
      variant="soft"
      className={cn('font-medium', className)}
    >
      {showIcon && <Icon className="w-3.5 h-3.5" />}
      {config.label}
    </Chip>
  )
}

export default PoolStatusBadge
