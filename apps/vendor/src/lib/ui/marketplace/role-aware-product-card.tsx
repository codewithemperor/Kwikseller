'use client'

import React from 'react'
import { Card, Button, Chip } from '@heroui/react'
import { cn, formatCurrency, truncate } from '../lib/utils'
import {
  ShoppingCart,
  Heart,
  Star,
  Eye,
  GitCompareArrows,
  PackagePlus,
  Pencil,
  Share2,
} from 'lucide-react'
import { VendorBadge } from './vendor-badge'
import { PoolStatusBadge } from './pool-status-badge'
import type { Product } from '../commerce/product-card'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Role = 'BUYER' | 'VENDOR'

export type PoolStatus = 'IN_POOL' | 'NOT_IN_POOL' | 'PENDING' | 'REMOVED'

export interface RoleAwareProductCardProps {
  /** The product to display */
  product: Product & {
    /** Whether the store is verified (enables VendorBadge) */
    isVerifiedStore?: boolean
    /** Pool status of the product (vendors only) */
    poolStatus?: PoolStatus
  }
  /** Current user role — controls which badges / actions are visible */
  role: Role
  /** True when the product belongs to the current vendor */
  isOwnProduct?: boolean
  /** Card visual variant */
  variant?: 'default' | 'compact' | 'horizontal'
  /** Show store name with optional verified badge */
  showStore?: boolean
  /** Show star rating */
  showRating?: boolean
  /** Show role-aware quick actions on the card image */
  showActions?: boolean
  /** Show the pool status badge (vendor only, falls back to poolStatus prop) */
  showPoolStatus?: boolean
  /** Callbacks */
  onProductClick?: (product: Product) => void
  onAddToCart?: (product: Product) => void
  onAddToWishlist?: (product: Product) => void
  onCompare?: (product: Product) => void
  onShare?: () => void
  onAddToPool?: (product: Product) => void
  onEditProduct?: (product: Product) => void
  /** Additional className for the wrapper */
  className?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * RoleAwareProductCard — a deeply integrated product card that changes its
 * badges and actions based on the user's role.
 *
 * **Buyer** sees: standard card + wishlist / cart / compare overlays
 * **Vendor** (own product) sees: edit overlay + pool status badge + verified badge
 * **Vendor** (other product) sees: add-to-pool overlay + pool status badge
 *
 * Unlike `ProductCardActions` (which renders a separate action bar *below*
 * the card), this component embeds everything inside the card for a more
 * cohesive, native look.
 */
export function RoleAwareProductCard({
  product,
  role,
  isOwnProduct = false,
  variant = 'default',
  showStore = true,
  showRating = true,
  showActions = true,
  showPoolStatus = true,
  onProductClick,
  onAddToCart,
  onAddToWishlist,
  onCompare,
  onShare,
  onAddToPool,
  onEditProduct,
  className,
}: RoleAwareProductCardProps) {
  // ── Derived values ──────────────────────────────────────────────────────

  const discount =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round(
          ((product.comparePrice - product.price) / product.comparePrice) * 100,
        )
      : 0

  const isOutOfStock =
    product.stock !== undefined && product.stock <= 0

  const isVendor = role === 'VENDOR'
  const shouldShowPool = isVendor && showPoolStatus && product.poolStatus
  const shouldShowEdit = isVendor && isOwnProduct

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleClick = () => onProductClick?.(product)

  const stopProp =
    <T extends React.SyntheticEvent>(fn?: (p: Product) => void) =>
    (e: T) => {
      e.stopPropagation()
      fn?.(product)
    }

  // ── Horizontal variant ──────────────────────────────────────────────────

  if (variant === 'horizontal') {
    return (
      <Card
        className={cn(
          'flex flex-row w-full cursor-pointer hover:shadow-md transition-shadow',
          className,
        )}
        onClick={handleClick}
      >
        {/* Image */}
        <div className="relative w-32 h-32 flex-shrink-0">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover rounded-l-lg"
          />
          {discount > 0 && (
            <Chip size="sm" color="danger" className="absolute top-2 left-2">
              -{discount}%
            </Chip>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-l-lg">
              <span className="text-white font-medium text-xs">Out of Stock</span>
            </div>
          )}
        </div>

        {/* Body */}
        <Card.Content className="flex-1 p-3 flex flex-col gap-1 min-w-0">
          {showStore && product.store && (
            <span className="text-xs text-default-500 flex items-center gap-1">
              {product.store.name}
              {product.isVerifiedStore && (
                <VendorBadge size="sm" variant="icon" />
              )}
            </span>
          )}
          <h3 className="font-semibold line-clamp-2 text-sm">{product.name}</h3>
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary text-sm">
              {formatCurrency(product.price)}
            </span>
            {product.comparePrice && (
              <span className="text-xs text-default-400 line-through">
                {formatCurrency(product.comparePrice)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-auto">
            {shouldShowPool && (
              <PoolStatusBadge status={product.poolStatus!} size="sm" />
            )}
            {showRating && product.rating != null && (
              <div className="flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-warning text-warning" />
                <span className="text-xs">{product.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </Card.Content>
      </Card>
    )
  }

  // ── Compact variant ─────────────────────────────────────────────────────

  if (variant === 'compact') {
    return (
      <Card
        className={cn('w-40 cursor-pointer hover:shadow-md transition-shadow', className)}
        onClick={handleClick}
      >
        <div className="relative aspect-square">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover rounded-t-lg"
          />
          {discount > 0 && (
            <Chip size="sm" color="danger" className="absolute top-2 left-2">
              -{discount}%
            </Chip>
          )}
          {shouldShowPool && (
            <div className="absolute bottom-2 left-2">
              <PoolStatusBadge status={product.poolStatus!} size="sm" />
            </div>
          )}
        </div>
        <Card.Content className="p-2 flex flex-col gap-0.5">
          {showStore && product.store && (
            <span className="text-[10px] text-default-500 flex items-center gap-0.5">
              {product.store.name}
              {product.isVerifiedStore && (
                <VendorBadge size="sm" variant="icon" />
              )}
            </span>
          )}
          <h4 className="text-xs font-medium line-clamp-1">{product.name}</h4>
          <span className="text-xs font-bold text-primary">
            {formatCurrency(product.price)}
          </span>
        </Card.Content>
      </Card>
    )
  }

  // ── Default variant ─────────────────────────────────────────────────────

  return (
    <Card
      className={cn(
        'group overflow-hidden cursor-pointer hover:shadow-md transition-shadow',
        className,
      )}
      onClick={handleClick}
    >
      {/* Image area */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Top-left badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {discount > 0 && (
            <Chip size="sm" color="danger">
              -{discount}%
            </Chip>
          )}
          {product.isNew && (
            <Chip size="sm" color="success">
              New
            </Chip>
          )}
          {product.isPoolProduct && (
            <Chip size="sm" color="default">
              Pool
            </Chip>
          )}
        </div>

        {/* Top-right action icons (role-aware) */}
        {showActions && !isOutOfStock && (
          <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            {/* Buyer actions */}
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              onClick={stopProp(onAddToWishlist)}
              className="bg-background/90 backdrop-blur-sm"
              aria-label="Add to wishlist"
            >
              <Heart className="w-4 h-4" />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              onClick={handleClick}
              className="bg-background/90 backdrop-blur-sm"
              aria-label="Quick view"
            >
              <Eye className="w-4 h-4" />
            </Button>

            {/* Vendor-only: edit own product */}
            {shouldShowEdit && (
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                onClick={stopProp(onEditProduct)}
                className="bg-background/90 backdrop-blur-sm text-warning"
                aria-label="Edit product"
              >
                <Pencil className="w-4 h-4" />
              </Button>
            )}

            {/* Vendor: add to pool */}
            {isVendor && !isOwnProduct && (
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                onClick={stopProp(onAddToPool)}
                className="bg-background/90 backdrop-blur-sm text-success"
                aria-label="Add to pool"
              >
                <PackagePlus className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}

        {/* Bottom-left: pool status badge (vendor) */}
        {shouldShowPool && (
          <div className="absolute bottom-2 left-2 z-10">
            <PoolStatusBadge status={product.poolStatus!} size="sm" />
          </div>
        )}

        {/* Out-of-stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-t-lg">
            <span className="text-white font-medium">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Card body */}
      <Card.Content className="p-4 flex flex-col gap-2">
        {/* Store row with optional verified badge */}
        {showStore && product.store && (
          <span className="text-xs text-default-500 flex items-center gap-1">
            {product.store.name}
            {product.isVerifiedStore && (
              <VendorBadge size="sm" variant="icon" />
            )}
          </span>
        )}

        <h3 className="font-medium line-clamp-2 min-h-[2.5rem]">
          {truncate(product.name, 60)}
        </h3>

        {/* Rating */}
        {showRating && product.rating != null && (
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-warning text-warning" />
            <span className="text-sm">{product.rating.toFixed(1)}</span>
            {product.reviewCount != null && (
              <span className="text-sm text-default-400">
                ({product.reviewCount})
              </span>
            )}
          </div>
        )}

        {/* Price + CTA row */}
        <div className="flex items-center justify-between w-full mt-auto">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-primary">
              {formatCurrency(product.price)}
            </span>
            {product.comparePrice && (
              <span className="text-sm text-default-400 line-through">
                {formatCurrency(product.comparePrice)}
              </span>
            )}
          </div>

          {/* Primary CTA — changes based on role */}
          {showActions && !isOutOfStock && (
            <>
              {/* Vendor own product: edit */}
              {shouldShowEdit && onEditProduct ? (
                <Button
                  isIconOnly
                  size="sm"
                  onClick={stopProp(onEditProduct)}
                  className="bg-warning text-warning-foreground"
                  aria-label="Edit product"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              ) : /* Vendor other product: add to pool */
              isVendor && onAddToPool ? (
                <Button
                  isIconOnly
                  size="sm"
                  onClick={stopProp(onAddToPool)}
                  className="bg-success text-success-foreground"
                  aria-label="Add to pool"
                >
                  <PackagePlus className="w-4 h-4" />
                </Button>
              ) : /* Buyer: add to cart */
              onAddToCart ? (
                <Button
                  isIconOnly
                  size="sm"
                  onClick={stopProp(onAddToCart)}
                  className="bg-primary text-primary-foreground"
                  aria-label="Add to cart"
                >
                  <ShoppingCart className="w-4 h-4" />
                </Button>
              ) : null}
            </>
          )}
        </div>

        {/* Extra action row (vendor) — compare + share for buyers, pool toggle for vendors */}
        {showActions && !isOutOfStock && (
          <div className="flex items-center gap-1.5 pt-1 border-t border-divider">
            {onCompare && (
              <Button
                size="sm"
                variant="ghost"
                onClick={stopProp(onCompare)}
                className="flex-1 min-w-0 text-tiny"
                aria-label="Compare"
              >
                <GitCompareArrows className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Compare</span>
              </Button>
            )}
            {onShare && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation()
                  onShare()
                }}
                className="flex-1 min-w-0 text-tiny"
                aria-label="Share"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Share</span>
              </Button>
            )}
            {isVendor && isOwnProduct && onAddToPool && (
              <Button
                size="sm"
                variant="ghost"
                onClick={stopProp(onAddToPool)}
                className="flex-1 min-w-0 text-tiny text-success"
                aria-label="Manage pool"
              >
                <PackagePlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {product.poolStatus === 'IN_POOL' ? 'In Pool' : 'Add to Pool'}
                </span>
              </Button>
            )}
          </div>
        )}
      </Card.Content>
    </Card>
  )
}

export default RoleAwareProductCard
