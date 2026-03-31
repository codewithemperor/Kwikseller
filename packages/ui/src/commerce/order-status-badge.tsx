'use client'

import React from 'react'
import { Chip } from '@heroui/react'
import { cn, capitalize } from '../lib/utils'

export type OrderStatus = 
  | 'PENDING' 
  | 'CONFIRMED' 
  | 'PROCESSING' 
  | 'SHIPPED' 
  | 'DELIVERED' 
  | 'CANCELLED'
  | 'REFUNDED'

export interface OrderStatusBadgeProps {
  status: OrderStatus | string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const statusConfig: Record<string, {
  color: 'default' | 'accent' | 'success' | 'danger' | 'warning'
  label: string
}> = {
  PENDING: { color: 'warning', label: 'Pending' },
  CONFIRMED: { color: 'accent', label: 'Confirmed' },
  PROCESSING: { color: 'default', label: 'Processing' },
  SHIPPED: { color: 'accent', label: 'Shipped' },
  DELIVERED: { color: 'success', label: 'Delivered' },
  CANCELLED: { color: 'danger', label: 'Cancelled' },
  REFUNDED: { color: 'default', label: 'Refunded' },
  PAID: { color: 'success', label: 'Paid' },
  FAILED: { color: 'danger', label: 'Failed' },
  ACTIVE: { color: 'success', label: 'Active' },
  EXPIRED: { color: 'danger', label: 'Expired' },
}

/**
 * OrderStatusBadge - A shared badge component for displaying order/payment status
 * Used across marketplace, vendor, admin, and rider apps
 */
export function OrderStatusBadge({
  status,
  size = 'md',
  className,
}: OrderStatusBadgeProps) {
  const config = statusConfig[status.toUpperCase()] || {
    color: 'default' as const,
    label: capitalize(status),
  }

  return (
    <Chip
      color={config.color}
      size={size}
      variant="soft"
      className={cn('font-medium', className)}
    >
      {config.label}
    </Chip>
  )
}

export default OrderStatusBadge
