'use client'

import React from 'react'
import { Skeleton } from '@heroui/react'
import { cn } from '../lib/utils'
import { ProductCard, Product, ProductCardProps } from './product-card'

export interface ProductGridProps {
  products: Product[]
  columns?: 2 | 3 | 4 | 5 | 6
  variant?: ProductCardProps['variant']
  loading?: boolean
  emptyMessage?: string
  onProductClick?: (product: Product) => void
  onAddToCart?: (product: Product) => void
  onAddToWishlist?: (product: Product) => void
  className?: string
}

/**
 * ProductGrid - A shared product grid component
 * Uses HeroUI Skeleton for loading state
 */
export function ProductGrid({
  products,
  columns = 4,
  variant = 'default',
  loading = false,
  emptyMessage = 'No products found',
  onProductClick,
  onAddToCart,
  onAddToWishlist,
  className,
}: ProductGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
  }

  if (loading) {
    return (
      <div className={cn('grid gap-4', gridCols[columns], className)}>
        {Array.from({ length: columns * 2 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="aspect-square rounded-lg" />
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-4 w-1/2 rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-default-500">
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          variant={variant}
          onClick={onProductClick}
          onAddToCart={onAddToCart}
          onAddToWishlist={onAddToWishlist}
        />
      ))}
    </div>
  )
}

export default ProductGrid
