'use client'

import React from 'react'
import { cn } from '../lib/utils'
import { ProductCard, type Product, type ProductCardProps } from '../commerce/product-card'
import { ProductActions, type UserRole } from './product-actions'

/**
 * ProductCardActions wraps the shared ProductCard with role-aware action
 * buttons injected into the card's quick-actions area.
 *
 * This allows vendor and marketplace apps to use the same base card while
 * exposing extra actions (Add to Pool, Edit Product) only for vendors.
 */

export interface ProductCardActionsProps {
  /** The product to display */
  product: Product
  /** Current user role — controls visible actions */
  role: UserRole
  /** True when the product belongs to the current vendor */
  isOwnProduct?: boolean
  /** Card variant forwarded to ProductCard */
  variant?: ProductCardProps['variant']
  /** Show store name */
  showStore?: boolean
  /** Show rating */
  showRating?: boolean
  /** Show role-based action buttons on the card */
  showActions?: boolean
  /** Handler callbacks */
  onProductClick?: (product: Product) => void
  onAddToCart?: (product: Product) => void
  onAddToWishlist?: (product: Product) => void
  onCompare?: () => void
  onShare?: () => void
  onAddToPool?: () => void
  onEditProduct?: () => void
  /** Additional className */
  className?: string
}

/**
 * ProductCardActions — ProductCard + vendor/buyer action buttons
 *
 * Renders the standard ProductCard and appends an action bar below it
 * with role-appropriate actions (cart, wishlist, compare, share for buyers;
 * plus add-to-pool & edit-product for vendors).
 */
export function ProductCardActions({
  product,
  role,
  isOwnProduct = false,
  variant = 'default',
  showStore = true,
  showRating = true,
  showActions = true,
  onProductClick,
  onAddToCart,
  onAddToWishlist,
  onCompare,
  onShare,
  onAddToPool,
  onEditProduct,
  className,
}: ProductCardActionsProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <ProductCard
        product={product}
        variant={variant}
        showStore={showStore}
        showRating={showRating}
        showQuickActions={showActions}
        onClick={onProductClick}
        onAddToCart={onAddToCart}
        onAddToWishlist={onAddToWishlist}
      />

      {showActions && (
        <ProductActions
          role={role}
          productId={product.id}
          isOwnProduct={isOwnProduct}
          onAddToCart={onAddToCart ? () => onAddToCart(product) : undefined}
          onAddToWishlist={onAddToWishlist ? () => onAddToWishlist(product) : undefined}
          onCompare={onCompare}
          onShare={onShare}
          onAddToPool={onAddToPool}
          onEditProduct={onEditProduct}
          layout="horizontal"
          size="sm"
        />
      )}
    </div>
  )
}

export default ProductCardActions
