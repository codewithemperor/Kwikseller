'use client'

import React from 'react'
import { Card, Button, Chip } from '@heroui/react'
import { cn, formatCurrency, truncate } from '../lib/utils'
import { 
  ShoppingCart, 
  Heart, 
  Star, 
  Eye,
} from 'lucide-react'

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  comparePrice?: number
  images: string[]
  stock?: number
  rating?: number
  reviewCount?: number
  store?: {
    name: string
    slug: string
  }
  isNew?: boolean
  isFeatured?: boolean
  isPoolProduct?: boolean
}

export interface ProductCardProps {
  product: Product
  variant?: 'default' | 'compact' | 'horizontal'
  showStore?: boolean
  showRating?: boolean
  showQuickActions?: boolean
  onAddToCart?: (product: Product) => void
  onAddToWishlist?: (product: Product) => void
  onClick?: (product: Product) => void
  className?: string
}

/**
 * ProductCard - A shared product card component for all KWIKSELLER frontends
 * Uses HeroUI Card component as base
 */
export function ProductCard({
  product,
  variant = 'default',
  showStore = true,
  showRating = true,
  showQuickActions = true,
  onAddToCart,
  onAddToWishlist,
  onClick,
  className,
}: ProductCardProps) {
  const discount = product.comparePrice 
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0

  const isOutOfStock = product.stock !== undefined && product.stock <= 0

  const handleClick = () => {
    onClick?.(product)
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    onAddToCart?.(product)
  }

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.stopPropagation()
    onAddToWishlist?.(product)
  }

  if (variant === 'horizontal') {
    return (
      <Card
        className={cn('flex flex-row w-full cursor-pointer hover:shadow-md transition-shadow', className)}
        onClick={handleClick}
      >
        <div className="relative w-32 h-32 flex-shrink-0">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover rounded-l-lg"
          />
          {discount > 0 && (
            <Chip
              size="sm"
              color="danger"
              className="absolute top-2 left-2"
            >
              -{discount}%
            </Chip>
          )}
        </div>
        <Card.Content className="flex-1 p-4">
          {showStore && product.store && (
            <span className="text-xs text-default-500">{product.store.name}</span>
          )}
          <h3 className="font-semibold line-clamp-2">{product.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-bold text-primary">
              {formatCurrency(product.price)}
            </span>
            {product.comparePrice && (
              <span className="text-sm text-default-400 line-through">
                {formatCurrency(product.comparePrice)}
              </span>
            )}
          </div>
          {showRating && product.rating && (
            <div className="flex items-center gap-1 mt-auto">
              <Star className="w-3 h-3 fill-warning text-warning" />
              <span className="text-xs">{product.rating.toFixed(1)}</span>
              {product.reviewCount && (
                <span className="text-xs text-default-400">
                  ({product.reviewCount})
                </span>
              )}
            </div>
          )}
        </Card.Content>
      </Card>
    )
  }

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
            <Chip
              size="sm"
              color="danger"
              className="absolute top-2 left-2"
            >
              -{discount}%
            </Chip>
          )}
        </div>
        <Card.Content className="p-2">
          <p className="text-xs text-default-500 line-clamp-1">
            {product.store?.name}
          </p>
          <h4 className="text-sm font-medium line-clamp-1">{product.name}</h4>
          <span className="text-sm font-bold text-primary">
            {formatCurrency(product.price)}
          </span>
        </Card.Content>
      </Card>
    )
  }

  // Default variant
  return (
    <Card
      className={cn('group overflow-hidden cursor-pointer hover:shadow-md transition-shadow', className)}
      onClick={handleClick}
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {discount > 0 && (
            <Chip size="sm" color="danger">-{discount}%</Chip>
          )}
          {product.isNew && (
            <Chip size="sm" color="success">New</Chip>
          )}
          {product.isPoolProduct && (
            <Chip size="sm" color="default">Pool</Chip>
          )}
        </div>

        {/* Quick Actions */}
        {showQuickActions && !isOutOfStock && (
          <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              onClick={handleAddToWishlist}
              className="bg-background/90 backdrop-blur-sm"
            >
              <Heart className="w-4 h-4" />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              onClick={handleClick}
              className="bg-background/90 backdrop-blur-sm"
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-t-lg">
            <span className="text-white font-medium">Out of Stock</span>
          </div>
        )}
      </div>
      
      <Card.Content className="p-4 flex flex-col gap-2">
        {showStore && product.store && (
          <span className="text-xs text-default-500">{product.store.name}</span>
        )}
        
        <h3 className="font-medium line-clamp-2 min-h-[2.5rem]">
          {truncate(product.name, 60)}
        </h3>

        {showRating && product.rating !== undefined && (
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-warning text-warning" />
            <span className="text-sm">{product.rating.toFixed(1)}</span>
            {product.reviewCount !== undefined && (
              <span className="text-sm text-default-400">
                ({product.reviewCount})
              </span>
            )}
          </div>
        )}

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
          
          {showQuickActions && !isOutOfStock && onAddToCart && (
            <Button
              isIconOnly
              size="sm"
              onClick={handleAddToCart}
              className="bg-primary text-primary-foreground"
            >
              <ShoppingCart className="w-4 h-4" />
            </Button>
          )}
        </div>
      </Card.Content>
    </Card>
  )
}

export default ProductCard
