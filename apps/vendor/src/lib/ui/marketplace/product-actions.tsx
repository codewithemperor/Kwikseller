'use client'

import React from 'react'
import { Button } from '@heroui/react'
import { cn } from '../lib/utils'
import {
  ShoppingCart,
  Heart,
  GitCompareArrows,
  PackagePlus,
  Pencil,
  Share2,
} from 'lucide-react'

/**
 * Role-based product action buttons.
 *
 * BUYER sees:  Add to Cart, Add to Wishlist, Compare, Share
 * VENDOR sees: everything a buyer sees PLUS Add to Pool, Edit Product (own only)
 *
 * Each action fires its own callback so the consuming app can wire it to
 * the appropriate store / API call.
 */

export type UserRole = 'BUYER' | 'VENDOR'

export interface ProductAction {
  /** Unique key */
  key: string
  /** Display label */
  label: string
  /** HeroUI color variant */
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'danger' | 'warning'
  /** When true the action is only available to vendors */
  vendorOnly?: boolean
  /** When true the action only shows on the vendor's *own* products */
  ownProductOnly?: boolean
}

/** Pre-defined action catalog */
export const PRODUCT_ACTIONS: ProductAction[] = [
  { key: 'add-to-cart', label: 'Add to Cart', color: 'primary' },
  { key: 'add-to-wishlist', label: 'Add to Wishlist' },
  { key: 'compare', label: 'Compare' },
  { key: 'share', label: 'Share' },
  { key: 'add-to-pool', label: 'Add to Pool', vendorOnly: true, color: 'success' },
  { key: 'edit-product', label: 'Edit Product', ownProductOnly: true, color: 'warning' },
]

export interface ProductActionsProps {
  /** Current user role — controls which actions are visible */
  role: UserRole
  /** The product id */
  productId: string
  /** True when the product belongs to the current vendor */
  isOwnProduct?: boolean
  /** Callback map — only provide handlers for actions you support */
  onAddToCart?: () => void
  onAddToWishlist?: () => void
  onCompare?: () => void
  onShare?: () => void
  onAddToPool?: () => void
  onEditProduct?: () => void
  /** Visual layout variant */
  layout?: 'horizontal' | 'vertical' | 'stacked'
  /** Size of the action buttons */
  size?: 'sm' | 'md' | 'lg'
  /** Additional className for the wrapper */
  className?: string
}

const ACTION_ICONS: Record<string, React.ElementType> = {
  'add-to-cart': ShoppingCart,
  'add-to-wishlist': Heart,
  compare: GitCompareArrows,
  share: Share2,
  'add-to-pool': PackagePlus,
  'edit-product': Pencil,
}

/**
 * ProductActions — role-aware action bar for product cards & detail pages.
 *
 * Buyer actions:  Cart, Wishlist, Compare, Share
 * Vendor extras:  Add to Pool, Edit Product (own products only)
 */
export function ProductActions({
  role,
  productId: _productId,
  isOwnProduct = false,
  onAddToCart,
  onAddToWishlist,
  onCompare,
  onShare,
  onAddToPool,
  onEditProduct,
  layout = 'horizontal',
  size = 'md',
  className,
}: ProductActionsProps) {
  // Filter actions based on role and ownership
  const visibleActions = PRODUCT_ACTIONS.filter((action) => {
    if (action.vendorOnly && role !== 'VENDOR') return false
    if (action.ownProductOnly && !isOwnProduct) return false
    return true
  })

  const handlerMap: Record<string, (() => void) | undefined> = {
    'add-to-cart': onAddToCart,
    'add-to-wishlist': onAddToWishlist,
    compare: onCompare,
    share: onShare,
    'add-to-pool': onAddToPool,
    'edit-product': onEditProduct,
  }

  const sizeClasses = {
    sm: 'h-8 min-w-8 text-tiny gap-1',
    md: 'h-9 min-w-9 text-small gap-1.5',
    lg: 'h-11 min-w-11 text-medium gap-2',
  }

  const layoutClasses = {
    horizontal: 'flex-row flex-wrap gap-2',
    vertical: 'flex-col gap-2',
    stacked: 'flex-col gap-1 w-full',
  }

  return (
    <div
      className={cn('flex', layoutClasses[layout], className)}
      role="toolbar"
      aria-label="Product actions"
    >
      {visibleActions.map((action) => {
        const Icon = ACTION_ICONS[action.key]
        const handler = handlerMap[action.key]

        // Stacked layout renders full-width buttons with icon + label
        if (layout === 'stacked') {
          return (
            <Button
              key={action.key}
              variant="ghost"
              size={size}
              onPress={handler}
              className={cn('w-full justify-start', sizeClasses[size])}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {action.label}
            </Button>
          )
        }

        // Icon-only buttons with native title tooltip for horizontal / vertical
        return (
          <Button
            key={action.key}
            isIconOnly
            variant="ghost"
            size={size}
            onPress={handler}
            isDisabled={!handler}
            aria-label={action.label}
            className={sizeClasses[size]}
          >
            {Icon && <Icon className="w-4 h-4" />}
          </Button>
        )
      })}
    </div>
  )
}

export default ProductActions
