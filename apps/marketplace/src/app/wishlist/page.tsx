'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart,
  Star,
  ShoppingCart,
  Trash2,
  ArrowRight,
  X,
  Share2,
  PackageCheck,
  Check,
} from 'lucide-react'
import Link from 'next/link'
import { useCartStore, useWishlistStore } from '@/stores'
import { kwikToast } from '@/lib/toast'
import { AppImage } from '@/components/ui/app-image'
import { AccountLayout } from '@/components/layout/account-layout'
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
  onShare,
}: {
  item: WishlistItem
  onRemove: (id: string) => void
  onMoveToCart: (item: WishlistItem) => void
  onShare: (item: WishlistItem) => void
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
      className="group rounded-2xl bg-background border border-border overflow-hidden shadow-sm hover:shadow-md hover:border-primary-300 transition-all duration-300"
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        <AppImage
          src={item.image}
          alt={item.name}
          className="w-full h-full"
        />
        {/* Discount badge */}
        {discount > 0 && (
          <div className="absolute top-2 left-2 bg-secondary-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">
            -{discount}%
          </div>
        )}
        {/* Quick actions overlay (remove + share) */}
        <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onShare(item)}
            className="w-8 h-8 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center text-gray-500 hover:text-primary-600 hover:bg-background transition-all"
            aria-label={`Share ${item.name}`}
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              if (showConfirm) {
                onRemove(item.id)
              } else {
                setShowConfirm(true)
                setTimeout(() => setShowConfirm(false), 3000)
              }
            }}
            className="w-8 h-8 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center text-gray-500 hover:text-danger hover:bg-background transition-all"
            aria-label="Remove from wishlist"
          >
            {showConfirm ? (
              <Check className="w-3.5 h-3.5 text-danger" />
            ) : (
              <X className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        {/* Category */}
        {item.category && (
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">
            {item.category}
          </p>
        )}

        {/* Name */}
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug min-h-[2.5rem]">
          {item.name}
        </h3>

        {/* Rating */}
        {item.rating > 0 && (
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-warning text-warning" />
            <span className="text-xs text-gray-600 font-medium">
              {item.rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-foreground">
            {formatCurrency(item.price)}
          </span>
          {item.originalPrice && item.originalPrice > item.price && (
            <span className="text-xs text-gray-400 line-through">
              {formatCurrency(item.originalPrice)}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onMoveToCart(item)}
            className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-secondary-500 text-white text-xs font-semibold hover:bg-secondary-600 transition-colors"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Move to Cart
          </button>
          <button
            onClick={() => onRemove(item.id)}
            className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-gray-500 hover:text-danger hover:border-danger/30 transition-colors"
            aria-label="Remove"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function WishlistPageInner() {
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

  const handleShare = async (item: WishlistItem) => {
    const shareUrl = `${window.location.origin}/products/${item.id}`
    const shareData = {
      title: `${item.name} — Kwikseller`,
      text: `Check out ${item.name} on Kwikseller!`,
      url: shareUrl,
    }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(shareUrl)
        kwikToast.success('Link copied', `${item.name} link is in your clipboard.`)
      }
    } catch {
      // user cancelled or clipboard failed — silent
    }
  }

  const handleMoveAllToCart = () => {
    items.forEach((item) => {
      addItemToCart({
        productId: item.id,
        name: item.name,
        price: item.price,
        comparePrice: item.originalPrice,
        image: item.image,
      })
    })
    clearAll()
    kwikToast.success(
      `${items.length} item${items.length > 1 ? 's' : ''} moved to cart`,
    )
    setCartOpen(true)
  }

  const handleClearAll = () => {
    clearAll()
    kwikToast.success('Wishlist cleared')
  }

  // Summary stats
  const totalValue = useMemo(
    () => items.reduce((sum, i) => sum + i.price, 0),
    [items],
  )
  const totalSavings = useMemo(
    () =>
      items.reduce(
        (sum, i) =>
          i.originalPrice && i.originalPrice > i.price
            ? sum + (i.originalPrice - i.price)
            : sum,
        0,
      ),
    [items],
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center">
              <Heart className="w-5 h-5 text-danger" fill="currentColor" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">My Wishlist</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {itemCount} {itemCount === 1 ? 'item' : 'items'} saved
              </p>
            </div>
          </div>

          {items.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={handleMoveAllToCart}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary-500 text-white text-sm font-semibold hover:bg-secondary-600 transition-colors"
              >
                <PackageCheck className="w-4 h-4" />
                Move all to cart
              </button>
              <button
                onClick={handleClearAll}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-gray-600 hover:text-danger hover:border-danger/30 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            </div>
          )}
        </motion.div>

        {/* Summary bar (only when items exist) */}
        {items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 grid grid-cols-3 gap-3 rounded-2xl border border-border bg-surface px-4 py-3"
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Total value
              </p>
              <p className="mt-1 font-heading text-lg font-bold text-foreground">
                {formatCurrency(totalValue)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Potential savings
              </p>
              <p className="mt-1 font-heading text-lg font-bold text-success">
                {totalSavings > 0 ? formatCurrency(totalSavings) : '—'}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Items
              </p>
              <p className="mt-1 font-heading text-lg font-bold text-foreground">
                {itemCount}
              </p>
            </div>
          </motion.div>
        )}

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
              <div className="absolute -inset-10 rounded-full bg-danger/5 blur-3xl" />
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.4, ease: "easeOut" }}
                className="relative flex h-32 w-32 items-center justify-center rounded-3xl bg-gradient-to-br from-danger/10 to-danger/5 ring-1 ring-danger/20"
              >
                <Heart className="h-14 w-14 text-danger/60" />
              </motion.div>
            </div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="text-xl font-semibold text-foreground"
            >
              Your wishlist is empty
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="mt-2 text-sm text-gray-500 mb-8 max-w-[300px]"
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
                href="/products"
                className="kwik-gradient inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold shadow-lg transition-all duration-300 hover:shadow-xl hover:brightness-110"
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
                  onShare={handleShare}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

export default function WishlistPage() {
  return (
    <AccountLayout>
      <WishlistPageInner />
    </AccountLayout>
  )
}
