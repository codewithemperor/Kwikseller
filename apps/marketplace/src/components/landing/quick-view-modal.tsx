'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Star,
  ShoppingCart,
  Heart,
  Truck,
  Shield,
  RotateCcw,
  Share2,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
} from 'lucide-react'
import { Button, Chip } from '@heroui/react'
import { useCartStore } from '@/stores'
import { kwikToast } from '@kwikseller/utils'

export interface QuickViewProduct {
  id: string
  name: string
  price: number
  comparePrice?: number
  image: string
  rating: number
  reviewCount: number
  store: string
  isNew: boolean
  description?: string
  images?: string[]
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/* ─── Inner content — remounts via key when product changes ─── */

function QuickViewContent({
  product,
  onClose,
}: {
  product: QuickViewProduct
  onClose: () => void
}) {
  const [quantity, setQuantity] = useState(1)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const addItem = useCartStore((s) => s.addItem)

  const allImages = product.images?.length ? product.images : [product.image]

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && currentImageIndex > 0) setCurrentImageIndex((i) => i - 1)
      if (e.key === 'ArrowRight' && currentImageIndex < allImages.length - 1)
        setCurrentImageIndex((i) => i + 1)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, currentImageIndex, allImages.length])

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        productId: product.id,
        name: product.name,
        price: product.price,
        comparePrice: product.comparePrice,
        image: product.image,
        store: product.store,
      })
    }
    kwikToast.success(`${quantity}x ${product.name} added to cart!`)
    onClose()
  }

  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-background rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            onPress={onClose}
            className="absolute top-3 right-3 z-10 bg-background/80 backdrop-blur-sm rounded-full"
            aria-label="Close quick view"
          >
            <X className="w-4 h-4" />
          </Button>

          {/* Image Gallery */}
          <div className="relative md:w-1/2 bg-default-50">
            <div className="aspect-square overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImageIndex}
                  src={allImages[currentImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              </AnimatePresence>
            </div>

            {/* Image navigation */}
            {allImages.length > 1 && (
              <>
                {currentImageIndex > 0 && (
                  <button
                    onClick={() => setCurrentImageIndex((i) => i - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                {currentImageIndex < allImages.length - 1 && (
                  <button
                    onClick={() => setCurrentImageIndex((i) => i + 1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
                {/* Image dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {allImages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImageIndex(i)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === currentImageIndex
                          ? 'bg-accent w-6'
                          : 'bg-default-300 hover:bg-default-400'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1">
              {discount > 0 && <Chip size="sm" color="danger">-{discount}%</Chip>}
              {product.isNew && <Chip size="sm" color="success">New</Chip>}
            </div>
          </div>

          {/* Product Details */}
          <div className="flex-1 p-6 overflow-y-auto scrollbar-thin">
            {/* Store name */}
            <p className="text-xs text-accent font-medium mb-1">{product.store}</p>

            {/* Product name */}
            <h2 className="text-xl font-bold mb-3 leading-tight">{product.name}</h2>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(product.rating)
                        ? 'fill-warning text-warning'
                        : 'fill-default-200 text-default-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium">{product.rating}</span>
              <span className="text-sm text-default-400">
                ({product.reviewCount} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-2xl font-bold text-accent">
                {formatCurrency(product.price)}
              </span>
              {product.comparePrice && (
                <span className="text-base text-default-400 line-through">
                  {formatCurrency(product.comparePrice)}
                </span>
              )}
              {discount > 0 && (
                <Chip size="sm" variant="soft" color="danger">
                  Save {discount}%
                </Chip>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-default-500 mb-6 leading-relaxed">
              This premium product is sourced from trusted African vendors. Quality guaranteed
              with our escrow-protected checkout. Free delivery on orders over ₦10,000.
            </p>

            {/* Quantity selector */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm font-medium">Quantity:</span>
              <div className="flex items-center gap-2 bg-default-50 rounded-lg px-1 py-1">
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  className="w-8 h-8 min-w-8"
                  onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                  isDisabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-8 text-center font-semibold tabular-nums">{quantity}</span>
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  className="w-8 h-8 min-w-8"
                  onPress={() => setQuantity((q) => q + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mb-6">
              <Button
                variant="primary"
                size="lg"
                className="flex-1 kwik-shadow"
                onPress={handleAddToCart}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Cart
              </Button>
              <Button
                isIconOnly
                size="lg"
                variant="outline"
                onPress={() => {
                  setIsLiked(!isLiked)
                  kwikToast.success(isLiked ? 'Removed from wishlist' : 'Added to wishlist!')
                }}
                className={isLiked ? 'text-danger' : ''}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              </Button>
              <Button
                isIconOnly
                size="lg"
                variant="outline"
                onPress={() => kwikToast.info('Share link copied!')}
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Truck, label: 'Free Delivery' },
                { icon: Shield, label: 'Escrow Pay' },
                { icon: RotateCcw, label: 'Easy Returns' },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5 p-3 bg-default-50 rounded-xl text-center"
                >
                  <Icon className="w-4 h-4 text-accent" />
                  <span className="text-xs text-default-500 font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  )
}

/* ─── Public component ─── */

export function QuickViewModal({
  product,
  isOpen,
  onClose,
}: {
  product: QuickViewProduct | null
  isOpen: boolean
  onClose: () => void
}) {
  if (!product || !isOpen) return null

  // Key remounts the inner component each time a different product is opened,
  // ensuring all interactive state (quantity, image index, liked) resets to defaults.
  return (
    <AnimatePresence>
      <QuickViewContent key={product.id} product={product} onClose={onClose} />
    </AnimatePresence>
  )
}
