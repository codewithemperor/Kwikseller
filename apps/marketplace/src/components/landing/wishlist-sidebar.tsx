'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, Trash2, ShoppingBag, Star, ArrowRight } from 'lucide-react'
import { Button, Chip } from '@heroui/react'
import { useWishlistStore } from '@/stores'
import { kwikToast } from '@kwikseller/utils'

function formatCurrency(price: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(price)
}

export function WishlistSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { items, removeItem, clearAll, itemCount } = useWishlistStore()

  const handleRemoveItem = (id: string, name: string) => {
    removeItem(id)
    kwikToast.success(`${name} removed from wishlist`)
  }

  const handleClearAll = () => {
    clearAll()
    kwikToast.success('Wishlist cleared')
  }

  const handleAddAllToCart = () => {
    kwikToast.info('Items will be added to cart soon!')
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-[420px] max-w-[92vw] bg-background/95 backdrop-blur-xl border-l border-divider z-[60] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-divider">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-danger" fill="currentColor" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">Wishlist</h2>
                  <p className="text-xs text-default-400">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </div>
              <Button
                isIconOnly
                variant="ghost"
                size="sm"
                onPress={onClose}
                aria-label="Close wishlist"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex flex-col items-center justify-center h-full px-6 text-center"
                >
                  <div className="w-24 h-24 rounded-full bg-default-50 flex items-center justify-center mb-5">
                    <Heart className="w-10 h-10 text-default-300" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Your wishlist is empty</h3>
                  <p className="text-sm text-default-400 mb-6 max-w-[260px]">
                    Items you love will appear here. Start exploring and save your favorites!
                  </p>
                  <Button
                    variant="primary"
                    className="kwik-shadow"
                    onPress={onClose}
                  >
                    Start Shopping
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </motion.div>
              ) : (
                <div className="px-6 py-4 space-y-3">
                  {items.map((item, index) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group relative flex gap-3 bg-default-50 hover:bg-default-100 rounded-xl p-3 transition-colors"
                    >
                      {/* Product Image */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-default-100 flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-1 leading-tight">
                          {item.name}
                        </h4>

                        {/* Category Tag */}
                        {item.category && (
                          <div className="mt-1">
                            <Chip
                              size="sm"
                              variant="flat"
                              className="text-[10px] h-5"
                            >
                              {item.category}
                            </Chip>
                          </div>
                        )}

                        {/* Price & Rating */}
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="font-bold text-sm text-accent">
                            {formatCurrency(item.price)}
                          </span>
                          {item.rating > 0 && (
                            <div className="flex items-center gap-0.5">
                              <Star className="w-3 h-3 text-warning fill-warning" />
                              <span className="text-xs text-default-400">{item.rating}</span>
                            </div>
                          )}
                        </div>

                        {/* Original Price */}
                        {item.originalPrice && item.originalPrice > item.price && (
                          <span className="text-xs text-default-400 line-through">
                            {formatCurrency(item.originalPrice)}
                          </span>
                        )}
                      </div>

                      {/* Remove Button - shows on hover */}
                      <Button
                        isIconOnly
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2 text-default-300 hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        onPress={() => handleRemoveItem(item.id, item.name)}
                        aria-label={`Remove ${item.name} from wishlist`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}

                  {/* Clear All Button */}
                  <div className="pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger w-full"
                      onPress={handleClearAll}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear All
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-divider px-6 py-4 space-y-3 bg-background">
                {/* Add All to Cart Button */}
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full kwik-shadow"
                  onPress={handleAddAllToCart}
                >
                  <ShoppingBag className="mr-2 w-4 h-4" />
                  Add All to Cart ({itemCount})
                </Button>

                {/* Local storage note */}
                <p className="text-xs text-default-400 text-center">
                  Your wishlist is saved locally
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
