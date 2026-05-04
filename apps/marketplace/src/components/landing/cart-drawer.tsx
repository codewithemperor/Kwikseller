'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Minus, Plus, ShoppingBag, Trash2, ArrowRight, Shield, Tag, CheckCircle2 } from 'lucide-react'
import { Button, Separator } from '@heroui/react'
import { useCartStore } from '@/stores'
import { kwikToast } from '@kwikseller/utils'
import { SavingsWidget } from './savings-widget'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Coupon codes
const VALID_COUPONS: Record<string, { type: 'percent' | 'fixed'; value: number; label: string; description: string }> = {
  SAVE10: { type: 'percent', value: 10, label: 'SAVE10', description: '10% off your order' },
  WELCOME: { type: 'fixed', value: 500, label: 'WELCOME', description: '₦500 off your order' },
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

  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null)
  const [couponError, setCouponError] = useState('')
  const [isApplying, setIsApplying] = useState(false)

  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const savings = items.reduce(
    (sum, item) => sum + ((item.comparePrice || item.price) - item.price) * item.quantity,
    0
  )

  // Calculate coupon discount
  const couponDiscount = React.useMemo(() => {
    if (!appliedCoupon || !VALID_COUPONS[appliedCoupon]) return 0
    const coupon = VALID_COUPONS[appliedCoupon]
    if (coupon.type === 'percent') {
      return Math.round(totalPrice * (coupon.value / 100))
    }
    return coupon.value
  }, [appliedCoupon, totalPrice])

  const finalTotal = Math.max(0, totalPrice - couponDiscount)

  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase()
    if (!code) {
      setCouponError('Please enter a coupon code')
      return
    }

    setIsApplying(true)
    // Simulate API call
    setTimeout(() => {
      if (VALID_COUPONS[code]) {
        setAppliedCoupon(code)
        setCouponError('')
        const coupon = VALID_COUPONS[code]
        kwikToast.success(
          `Coupon "${code}" applied!`,
          coupon.description
        )
      } else {
        setCouponError('Invalid coupon code')
        kwikToast.error('Invalid code', `"${code}" is not a valid coupon code`)
      }
      setIsApplying(false)
    }, 600)
  }

  const handleRemoveCoupon = () => {
    if (appliedCoupon) {
      kwikToast.info(`Coupon "${appliedCoupon}" removed`)
      setAppliedCoupon(null)
      setCouponCode('')
    }
  }

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
            className="fixed top-0 right-0 bottom-0 w-[420px] max-w-[92vw] bg-kwik-bg-surface border-l border-kwik-border z-[60] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-kwik-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-kwik-orange/10 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-kwik-orange" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg text-kwik-dark">Your Cart</h2>
                  <p className="text-xs text-kwik-muted">
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
                  <div className="w-20 h-20 rounded-full bg-kwik-bg-light flex items-center justify-center mb-4">
                    <ShoppingBag className="w-8 h-8 text-kwik-muted" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-kwik-dark">Your cart is empty</h3>
                  <p className="text-sm text-kwik-gray-light mb-6 max-w-[250px]">
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
                  {/* Savings Widget */}
                  <SavingsWidget />

                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0 }}
                      className="flex gap-3 bg-kwik-bg-light rounded-xl p-3"
                    >
                      {/* Product Image */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-kwik-bg-surface flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image || undefined}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2 leading-tight text-kwik-dark">
                          {item.name}
                        </h4>
                        {item.store && (
                          <p className="text-xs text-kwik-muted mt-0.5">{item.store}</p>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <span className="font-bold text-sm text-kwik-orange">
                            {formatCurrency(item.price * item.quantity)}
                          </span>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-1">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="ghost"
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
                              variant="ghost"
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
                        className="text-default-300 hover:text-kwik-red self-start flex-shrink-0"
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
              <div className="border-t border-kwik-border px-6 py-4 space-y-3 bg-kwik-bg-surface">
                {/* Coupon Input */}
                {!appliedCoupon ? (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-kwik-dark-medium uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="w-3 h-3 text-kwik-orange" />
                      Apply Coupon
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => {
                            setCouponCode(e.target.value.toUpperCase())
                            setCouponError('')
                          }}
                          onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                          placeholder="Enter coupon code"
                          className={`w-full h-10 rounded-xl border text-sm text-kwik-dark placeholder:text-kwik-muted outline-none transition-colors px-3 pr-9 ${
                            couponError
                              ? 'border-kwik-red focus:border-kwik-red focus:ring-1 focus:ring-kwik-red/20'
                              : 'border-kwik-border bg-kwik-bg-light focus:border-kwik-orange focus:ring-1 focus:ring-kwik-orange/20'
                          }`}
                        />
                        {couponCode && (
                          <button
                            type="button"
                            onClick={() => { setCouponCode(''); setCouponError('') }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-kwik-muted hover:text-kwik-dark-medium"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleApplyCoupon}
                        disabled={isApplying}
                        className="h-10 px-4 rounded-xl bg-kwik-orange text-white text-xs font-semibold hover:bg-kwik-orange-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex-shrink-0"
                      >
                        {isApplying ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                          />
                        ) : (
                          'Apply'
                        )}
                      </motion.button>
                    </div>
                    <AnimatePresence>
                      {couponError && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="text-[11px] text-kwik-red"
                        >
                          {couponError}
                        </motion.p>
                      )}
                    </AnimatePresence>
                    <p className="text-[10px] text-kwik-muted">
                      Try: SAVE10 or WELCOME
                    </p>
                  </div>
                ) : (
                  /* Applied coupon badge */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center gap-2 rounded-xl bg-kwik-green/10 border border-kwik-green/20 px-3 py-2.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-kwik-green flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-kwik-green">
                        {VALID_COUPONS[appliedCoupon]?.label}
                      </p>
                      <p className="text-[10px] text-kwik-gray-light">
                        {VALID_COUPONS[appliedCoupon]?.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-kwik-muted hover:text-kwik-red hover:bg-kwik-red/10 transition-colors flex-shrink-0"
                      aria-label="Remove coupon"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                )}

                {/* Summary */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-kwik-muted">Subtotal</span>
                    <span className="font-medium text-kwik-dark">{formatCurrency(totalPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-kwik-muted">Delivery</span>
                    <span className="text-kwik-green font-medium">Free</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-kwik-muted">Discount</span>
                      <span className="text-kwik-green font-medium flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        -{formatCurrency(couponDiscount)}
                      </span>
                    </div>
                  )}
                  {savings > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-kwik-muted">Savings</span>
                      <span className="text-kwik-green font-medium">-{formatCurrency(savings)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-kwik-dark">Total</span>
                    <span className="font-bold text-lg text-kwik-orange">
                      {formatCurrency(finalTotal)}
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
                  <div className="flex items-center gap-1 text-xs text-kwik-muted">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Secure Payment</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-kwik-muted">
                    <span className="text-kwik-green text-xs">●</span>
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
