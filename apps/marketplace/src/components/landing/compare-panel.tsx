'use client'

import React, { useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Scale,
  X,
  Star,
  Trash2,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
} from 'lucide-react'
import { Button, Chip } from '@heroui/react'
import { useCompareStore, type CompareProduct } from '@/stores'
import { kwikToast } from '@kwikseller/utils'

// ─── Helpers ───────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const GRADIENT_COLORS = [
  'from-orange-400 to-rose-500',
  'from-emerald-400 to-teal-500',
  'from-violet-400 to-purple-500',
  'from-amber-400 to-yellow-500',
]

// ─── CompareToggle ─────────────────────────────────────────────────

export function CompareToggle({ product }: { product: CompareProduct }) {
  const { addProduct, removeProduct, isInCompare } = useCompareStore()
  const inCompare = isInCompare(product.id)

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      if (inCompare) {
        removeProduct(product.id)
        kwikToast.success('Removed from comparison')
      } else {
        const success = addProduct(product)
        if (!success) {
          kwikToast.warning('You can compare up to 4 products at a time. Remove one first.')
        } else {
          kwikToast.success('Added to comparison!')
        }
      }
    },
    [inCompare, addProduct, removeProduct, product]
  )

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={`w-9 h-9 rounded-xl shadow-md flex items-center justify-center transition-colors ${
        inCompare
          ? 'bg-accent text-accent-foreground'
          : 'bg-background/90 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground'
      }`}
      onClick={handleToggle}
      aria-label={inCompare ? 'Remove from comparison' : 'Add to comparison'}
    >
      <Scale className={`w-4 h-4 ${inCompare ? 'fill-current' : ''}`} />
    </motion.button>
  )
}

// ─── Star Rating ───────────────────────────────────────────────────

function StarRating({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <div className="flex items-center gap-1">
      <Star className="w-3.5 h-3.5 fill-warning text-warning" />
      <span className="text-xs font-semibold">{rating}</span>
      <span className="text-xs text-default-400">({reviews})</span>
    </div>
  )
}

// ─── Product Column ────────────────────────────────────────────────

function ProductColumn({
  product,
  index,
  onRemove,
}: {
  product: CompareProduct
  index: number
  onRemove: (id: string) => void
}) {
  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      className="flex flex-col items-center min-w-[200px] md:min-w-[180px] flex-1"
    >
      {/* Image placeholder */}
      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-default-100 mb-3">
        <div
          className={`absolute inset-0 bg-gradient-to-br ${
            GRADIENT_COLORS[index % GRADIENT_COLORS.length]
          } opacity-20`}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {discount > 0 && (
          <div className="absolute top-2 left-2">
            <Chip size="sm" color="danger" className="shadow-sm text-[10px]">
              -{discount}%
            </Chip>
          </div>
        )}
        {/* Remove button */}
        <button
          onClick={() => onRemove(product.id)}
          className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-background/90 backdrop-blur-sm shadow-sm flex items-center justify-center hover:bg-danger hover:text-danger-foreground transition-colors"
          aria-label={`Remove ${product.name} from comparison`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Product info */}
      <div className="text-center w-full px-1">
        <h4 className="font-medium text-sm line-clamp-2 leading-snug mb-1.5">
          {product.name}
        </h4>
        <span className="text-[11px] text-default-400 block mb-1.5">{product.store}</span>
        <StarRating rating={product.rating} reviews={product.reviews} />
        <div className="flex items-center justify-center gap-1.5 mt-1.5">
          <span className="font-bold text-sm text-accent">
            {formatCurrency(product.price)}
          </span>
          {product.comparePrice && (
            <span className="text-xs text-default-400 line-through">
              {formatCurrency(product.comparePrice)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Spec Row ──────────────────────────────────────────────────────

function SpecRow({
  label,
  products,
}: {
  label: string
  products: CompareProduct[]
}) {
  return (
    <div className="flex border-b border-divider last:border-b-0">
      <div className="min-w-[100px] md:min-w-[130px] flex-shrink-0 px-3 py-2.5 bg-default-50">
        <span className="text-xs font-medium text-default-500">{label}</span>
      </div>
      <div className="flex-1 grid divide-x divide-divider" style={{ gridTemplateColumns: `repeat(${products.length}, 1fr)` }}>
        {products.map((p) => (
          <div
            key={p.id}
            className="px-3 py-2.5 flex items-center justify-center"
          >
            <span className="text-xs text-center">{p.specs[label] || '—'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── ComparePanel ──────────────────────────────────────────────────

export function ComparePanel() {
  const { products, isOpen, setOpen, removeProduct, clearAll, toggleOpen } =
    useCompareStore()

  const count = products.length

  // Collect all unique spec keys from all products
  const allSpecKeys = useMemo(() => {
    const keySet = new Set<string>()
    products.forEach((p) => {
      Object.keys(p.specs).forEach((key) => keySet.add(key))
    })
    return Array.from(keySet)
  }, [products])

  // ESC to close
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setOpen(false)
      }
    },
    [isOpen, setOpen]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // No products → return null
  if (count === 0) return null

  return (
    <>
      {/* Backdrop when expanded */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[55] md:hidden"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Panel container — slides up from bottom */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-[64px] md:bottom-0 left-0 right-0 z-[55] bg-background border-t border-divider shadow-[0_-8px_30px_rgba(0,0,0,0.12)]"
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-divider">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <ArrowUpDown className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Compare Products</h3>
                  <p className="text-[11px] text-default-400">
                    {count} of 4 products
                  </p>
                </div>
              </div>
              <Button
                isIconOnly
                variant="ghost"
                size="sm"
                onPress={() => setOpen(false)}
                aria-label="Close comparison"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Product cards row */}
            <div className="p-4 overflow-x-auto scrollbar-thin">
              <div className="flex gap-4 min-w-max">
                <AnimatePresence mode="popLayout">
                  {products.map((product, index) => (
                    <ProductColumn
                      key={product.id}
                      product={product}
                      index={index}
                      onRemove={removeProduct}
                    />
                  ))}
                </AnimatePresence>

                {/* Empty slots */}
                {Array.from({ length: 4 - count }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="flex flex-col items-center min-w-[200px] md:min-w-[180px] flex-1"
                  >
                    <div className="w-full aspect-square rounded-xl border-2 border-dashed border-default-200 bg-default-50 mb-3 flex items-center justify-center">
                      <Scale className="w-8 h-8 text-default-200" />
                    </div>
                    <div className="text-center px-1">
                      <p className="text-xs text-default-400">Add product</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Specs comparison table */}
            {allSpecKeys.length > 0 && (
              <div className="border-t border-divider">
                <div className="px-4 py-2 bg-default-50">
                  <span className="text-xs font-semibold text-default-500 uppercase tracking-wide">
                    Specifications
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto scrollbar-thin">
                  {allSpecKeys.map((key) => (
                    <SpecRow key={key} label={key} products={products} />
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-divider bg-background">
              <Button
                variant="ghost"
                size="sm"
                className="text-danger"
                onPress={() => {
                  clearAll()
                  kwikToast.success('Comparison cleared')
                }}
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Clear All
              </Button>
              <div className="flex-1" />
              <span className="text-[11px] text-default-400 hidden sm:block">
                Press ESC to close
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimized bar — always visible when products exist */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-[64px] md:bottom-4 left-1/2 -translate-x-1/2 z-[55]"
          >
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-background border border-divider shadow-[0_-4px_20px_rgba(0,0,0,0.1)] backdrop-blur-md">
              {/* Mini product thumbnails */}
              <div className="flex -space-x-2">
                {products.slice(0, 4).map((product, index) => (
                  <div
                    key={product.id}
                    className="w-8 h-8 rounded-lg overflow-hidden border-2 border-background shadow-sm relative"
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${
                        GRADIENT_COLORS[index % GRADIENT_COLORS.length]
                      } opacity-20`}
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>

              <span className="text-sm font-medium whitespace-nowrap">
                Compare ({count})
              </span>

              <Button
                size="sm"
                variant="ghost"
                onPress={() => {
                  clearAll()
                  kwikToast.success('Comparison cleared')
                }}
                className="text-danger text-xs h-7 px-2"
              >
                Clear
              </Button>

              <Button
                size="sm"
                variant="primary"
                onPress={toggleOpen}
                className="kwik-shadow text-xs h-7"
              >
                Compare Now
                <ChevronUp className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
