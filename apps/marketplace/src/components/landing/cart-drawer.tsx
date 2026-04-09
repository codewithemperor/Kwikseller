'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Minus, Plus, ShoppingBag, Trash2, ArrowRight, Shield } from 'lucide-react'
import { Button, Chip, Separator } from '@heroui/react'
import { useCartStore } from '@/stores'
import { kwikToast } from '@kwikseller/utils'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function CartDrawer() {
  const {
    items,
    isOpen,
    setCartOpen,
    removeItem,
    updateQuantity,
    clearCart,
  } = useCartStore()

  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const savings = items.reduce(
    (sum, item) => sum + ((item.comparePrice || item.price) - item.price) * item.quantity,
    0
  )

  const handleCheckout = () => {
    kwikToast.info('Checkout coming soon! Stay tuned for the full marketplace experience.')
  }

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
            onClick={() => setCartOpen(false)}
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-[420px] max-w-[92vw] bg-background border-l border-divider z-[60] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-divider">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">Your Cart</h2>
                  <p className="text-xs text-default-400">
                    {totalItems} {totalItems === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </div>
              <Button
                isIconOnly
                variant="ghost"
                size="sm"
                onPress={() => setCartOpen(false)}
                aria-label="Close cart"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                  <div className="w-20 h-20 rounded-full bg-default-50 flex items-center justify-center mb-4">
                    <ShoppingBag className="w-8 h-8 text-default-300" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Your cart is empty</h3>
                  <p className="text-sm text-default-400 mb-6 max-w-[250px]">
                    Browse our marketplace and add some amazing products to your cart.
                  </p>
                  <Button
                    variant="primary"
                    className="kwik-shadow"
                    onPress={() => setCartOpen(false)}
                  >
                    Start Shopping
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="px-6 py-4 space-y-4">
                  {/* Savings banner */}
                  {savings > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-success/10 border border-success/20 rounded-xl px-4 py-2.5 flex items-center gap-2"
                    >
                      <span className="text-sm">🎉</span>
                      <span className="text-sm font-medium text-success">
                        You&apos;re saving {formatCurrency(savings)} on this order!
                      </span>
                    </motion.div>
                  )}

                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0 }}
                      className="flex gap-3 bg-default-50 rounded-xl p-3"
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
                        <h4 className="font-medium text-sm line-clamp-2 leading-tight">
                          {item.name}
                        </h4>
                        {item.store && (
                          <p className="text-xs text-default-400 mt-0.5">{item.store}</p>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <span className="font-bold text-sm text-accent">
                            {formatCurrency(item.price * item.quantity)}
                          </span>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-1">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="flat"
                              className="w-7 h-7 min-w-7"
                              onPress={() => updateQuantity(item.productId, item.quantity - 1)}
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </Button>
                            <span className="text-sm font-medium w-7 text-center tabular-nums">
                              {item.quantity}
                            </span>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="flat"
                              className="w-7 h-7 min-w-7"
                              onPress={() => updateQuantity(item.productId, item.quantity + 1)}
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <Button
                        isIconOnly
                        size="sm"
                        variant="ghost"
                        className="text-default-300 hover:text-danger self-start flex-shrink-0"
                        onPress={() => {
                          removeItem(item.productId)
                          kwikToast.success(`${item.name} removed from cart`)
                        }}
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}

                  {/* Clear Cart */}
                  <div className="pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger w-full"
                      onPress={() => {
                        clearCart()
                        kwikToast.success('Cart cleared')
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear Cart
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer / Checkout */}
            {items.length > 0 && (
              <div className="border-t border-divider px-6 py-4 space-y-3 bg-background">
                {/* Summary */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-default-500">Subtotal</span>
                    <span className="font-medium">{formatCurrency(totalPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-default-500">Delivery</span>
                    <span className="text-success font-medium">Free</span>
                  </div>
                  {savings > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-default-500">Savings</span>
                      <span className="text-success font-medium">-{formatCurrency(savings)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-lg text-accent">
                      {formatCurrency(totalPrice)}
                    </span>
                  </div>
                </div>

                {/* Checkout Button */}
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full kwik-shadow"
                  onPress={handleCheckout}
                >
                  Proceed to Checkout
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>

                {/* Trust badges */}
                <div className="flex items-center justify-center gap-4 pt-1">
                  <div className="flex items-center gap-1 text-xs text-default-400">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Secure Payment</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-default-400">
                    <span className="text-success text-xs">●</span>
                    <span>Escrow Protected</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
