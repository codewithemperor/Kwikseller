'use client'

import React, { useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Scale,
  X,
  Star,
  Trash2,
  ChevronDown,
  ArrowUpDown,
} from 'lucide-react'
import { Button, Chip } from '@heroui/react'
import { useCompareStore, type CompareProduct } from '@/stores'
import { kwikToast } from '@/lib/toast'

// ─── Helpers ───────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const FLAT_COLORS = [
  'bg-orange-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-amber-500',
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
          className={`absolute inset-0 ${FLAT_COLORS[index % FLAT_COLORS.length]} opacity-20`}
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
  const { products, isOpen, setOpen, clearAll, toggleOpen } =
    useCompareStore()

  const count = products.length
  const product = products[0]
  const marketPrice = product?.comparePrice ?? product?.price ?? 0
  const savings = product?.comparePrice ? product.comparePrice - product.price : 0
  const savingsPercent = product?.comparePrice
    ? Math.round((savings / product.comparePrice) * 100)
    : 0

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

  useEffect(() => {
    if (!isOpen) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  // No products → return null
  if (!product) return null

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
            className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm md:hidden"
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
            className="fixed inset-0 z-[120] overflow-y-auto bg-background shadow-[0_-8px_30px_rgba(0,0,0,0.12)] md:bottom-0 md:left-0 md:right-0 md:top-auto md:max-h-[92vh] md:border-t md:border-divider"
          >
            {/* Panel header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-divider bg-background px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <ArrowUpDown className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Market Price Check</h3>
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

            <div className="p-4 pb-24 md:pb-4">
              <div className="grid gap-4 md:grid-cols-[160px_1fr]">
                <div className="overflow-hidden bg-default-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.image} alt={product.name} className="aspect-square w-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-default-400">{product.store}</p>
                  <h4 className="mt-1 line-clamp-2 text-base font-semibold">{product.name}</h4>
                  <div className="mt-4 divide-y divide-divider border-y border-divider">
                    {[
                      ["Seller price", formatCurrency(product.price), "text-accent"],
                      ["Market price", formatCurrency(marketPrice), ""],
                      ["Estimated saving", savings > 0 ? `${formatCurrency(savings)} (${savingsPercent}%)` : "Not available", "text-emerald-700 dark:text-emerald-300"],
                    ].map(([label, value, valueClass]) => (
                      <div key={label} className="flex items-center justify-between gap-4 py-3">
                        <span className="text-xs font-semibold uppercase tracking-wide text-default-400">{label}</span>
                        <span className={`text-right text-base font-bold ${valueClass}`}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="sticky bottom-0 flex items-center gap-2 border-t border-divider bg-background px-4 py-3">
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

    </>
  )
}
