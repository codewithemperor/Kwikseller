'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart,
  Star,
  ShoppingCart,
  Trash2,
  ArrowRight,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useCartStore, useWishlistStore } from '@/stores'
import { kwikToast } from '@kwikseller/utils'
import { AppImage } from '@/components/ui/app-image'
import type { WishlistItem } from '@/stores/wishlist-store'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function WishlistCard({
  item,
  onRemove,
  onMoveToCart,
}: {
  item: WishlistItem
  onRemove: (id: string) => void
  onMoveToCart: (item: WishlistItem) => void
}) {
  const [showConfirm, setShowConfirm] = useState(false)

  const discount = item.originalPrice
    ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
    : 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, height: 0 }}
      transition={{ duration: 0.25 }}
      className="group rounded-2xl bg-background border border-kwik-border overflow-hidden shadow-sm hover:shadow-md hover:border-kwik-orange/20 transition-all duration-300"
    >
      {/* Image */}
      <div className="relative aspect-square bg-kwik-bg-light overflow-hidden">
        <AppImage
          src={item.image}
          alt={item.name}
          className="w-full h-full"
        />
        {/* Discount badge */}
        {discount > 0 && (
          <div className="absolute top-2 left-2 bg-kwik-orange text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">
            -{discount}%
          </div>
        )}
        {/* Remove button */}
        <button
          onClick={() => {
            if (showConfirm) {
              onRemove(item.id)
            } else {
              setShowConfirm(true)
              setTimeout(() => setShowConfirm(false), 3000)
            }
          }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-kwik-muted hover:text-kwik-red hover:bg-red-50 dark:hover:bg-red-950/30 transition-all opacity-0 group-hover:opacity-100"
          aria-label="Remove from wishlist"
        >
          {showConfirm ? (
            <span className="text-[10px] font-bold text-kwik-red">?</span>
          ) : (
            <X className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        {/* Category */}
        {item.category && (
          <p className="text-[10px] uppercase tracking-wider text-kwik-muted font-medium">
            {item.category}
          </p>
        )}

        {/* Name */}
        <h3 className="text-sm font-semibold text-kwik-dark line-clamp-2 leading-snug min-h-[2.5rem]">
          {item.name}
        </h3>

        {/* Rating */}
        {item.rating > 0 && (
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-kwik-star text-kwik-star" />
            <span className="text-xs text-kwik-dark-medium font-medium">
              {item.rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-kwik-orange">
            {formatCurrency(item.price)}
          </span>
          {item.originalPrice && item.originalPrice > item.price && (
            <span className="text-xs text-kwik-muted line-through">
              {formatCurrency(item.originalPrice)}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onMoveToCart(item)}
            className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-kwik-orange text-white text-xs font-semibold hover:bg-kwik-orange-hover transition-colors"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Move to Cart
          </button>
          <button
            onClick={() => onRemove(item.id)}
            className="w-9 h-9 rounded-xl border border-kwik-border flex items-center justify-center text-kwik-muted hover:text-kwik-red hover:border-kwik-red/30 transition-colors"
            aria-label="Remove"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default function WishlistPage() {
  const { items, removeItem, clearAll, itemCount } = useWishlistStore()
  const addItemToCart = useCartStore((s) => s.addItem)
  const setCartOpen = useCartStore((s) => s.setCartOpen)

  const handleRemove = (id: string, name: string) => {
    removeItem(id)
    kwikToast.success(`${name} removed from wishlist`)
  }

  const handleMoveToCart = (item: WishlistItem) => {
    addItemToCart({
      productId: item.id,
      name: item.name,
      price: item.price,
      comparePrice: item.originalPrice,
      image: item.image,
    })
    removeItem(item.id)
    kwikToast.success(`${item.name} moved to cart`)
    setCartOpen(true)
  }

  const handleClearAll = () => {
    clearAll()
    kwikToast.success('Wishlist cleared')
  }

  return (
    <div className="min-h-screen bg-kwik-bg-page">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-kwik-red/10 flex items-center justify-center">
              <Heart className="w-6 h-6 text-kwik-red" fill="currentColor" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-kwik-dark">My Wishlist</h1>
              <p className="text-sm text-kwik-gray-light mt-0.5">
                {itemCount} {itemCount === 1 ? 'item' : 'items'} saved
              </p>
            </div>
          </div>

          {items.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-kwik-border text-sm text-kwik-gray hover:text-kwik-red hover:border-kwik-red/30 transition-colors self-start sm:self-auto"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          )}
        </motion.div>

        {/* Content */}
        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            {/* Decorative background */}
            <div className="relative mb-6">
              <div className="absolute -inset-10 rounded-full bg-kwik-red/5 blur-3xl" />
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.4, ease: "easeOut" }}
                className="relative flex h-32 w-32 items-center justify-center rounded-3xl bg-gradient-to-br from-kwik-red/10 to-kwik-red/5 ring-1 ring-kwik-red/20"
              >
                <Heart className="h-14 w-14 text-kwik-red/60" />
              </motion.div>
            </div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="text-xl font-semibold text-kwik-dark"
            >
              Your wishlist is empty
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="mt-2 text-sm text-kwik-gray-light mb-8 max-w-[300px]"
            >
              Items you love will appear here. Start exploring and save your
              favorites!
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.4 }}
            >
              <Link
                href="/"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-kwik-orange to-kwik-amber text-white font-semibold shadow-lg shadow-kwik-orange/20 transition-all duration-300 hover:shadow-xl hover:shadow-kwik-orange/30 hover:brightness-110"
              >
                Start Shopping
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((item) => (
                <WishlistCard
                  key={item.id}
                  item={item}
                  onRemove={(id) => handleRemove(id, item.name)}
                  onMoveToCart={handleMoveToCart}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
