"use client";

import React from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  ArrowRight,
  Shield,
  ArrowLeft,
  Sparkles,
  Truck,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { Button, Separator } from "@heroui/react";
import { useCartStore } from "@/stores";
import { kwikToast } from "@kwikseller/utils";
import { AppImage } from "@/components/ui/app-image";
import Link from "next/link";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
  } = useCartStore();

  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const totalItems = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const savings = items.reduce(
    (sum, item) =>
      sum + ((item.comparePrice || item.price) - item.price) * item.quantity,
    0
  );

  const handleCheckout = () => {
    kwikToast.info(
      "Checkout coming soon! Stay tuned for the full marketplace experience."
    );
  };

  return (
    <div className="min-h-screen bg-kwik-bg-page">
      {/* Header */}
      <div className="sticky top-16 z-30 border-b border-kwik-border bg-background/95 backdrop-blur-md">
        <div className="container mx-auto flex items-center gap-3 px-4 py-3">
          <Link href="/">
            <Button isIconOnly variant="ghost" size="sm" aria-label="Go back" className="hover:bg-kwik-orange-tint transition-colors duration-200">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-kwik-orange/15 to-kwik-orange/5 flex items-center justify-center ring-1 ring-kwik-orange/20">
              <ShoppingBag className="w-4 h-4 text-kwik-orange" />
            </div>
            <div>
              <h1 className="font-semibold text-lg leading-tight text-kwik-dark">Your Cart</h1>
              <p className="text-xs text-kwik-gray-light">
                {totalItems} {totalItems === 1 ? "item" : "items"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 pb-32 md:pb-8">
        {items.length === 0 ? (
          /* ─── Enhanced Empty State ─── */
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="relative mb-6">
              {/* Decorative background */}
              <div className="absolute -inset-10 rounded-full bg-kwik-orange/5 blur-3xl" />
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative flex h-32 w-32 items-center justify-center rounded-3xl bg-gradient-to-br from-kwik-orange/10 to-kwik-orange/5 ring-1 ring-kwik-orange/20"
              >
                <ShoppingBag className="h-14 w-14 text-kwik-orange/60" />
              </motion.div>
            </div>
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="text-xl font-semibold text-kwik-dark"
            >
              Your cart is empty
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="mt-2 max-w-sm text-center text-sm text-kwik-gray-light"
            >
              Browse our marketplace and add some amazing products to your cart.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
            >
              <Link href="/">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="mt-6 flex items-center gap-2 rounded-xl bg-gradient-to-r from-kwik-orange to-[#d97706] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-kwik-orange/20 transition-all duration-300 hover:shadow-xl hover:shadow-kwik-orange/30 hover:brightness-110"
                >
                  Start Shopping
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
            </motion.div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            {/* Cart Items */}
            <div className="space-y-3">
              {/* Savings banner */}
              {savings > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-kwik-green/10 border border-kwik-green/20 rounded-xl px-4 py-2.5 flex items-center gap-2"
                >
                  <span className="text-sm">🎉</span>
                  <span className="text-sm font-medium text-kwik-green">
                    You&apos;re saving {formatCurrency(savings)} on this order!
                  </span>
                </motion.div>
              )}

              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0 }}
                    className="flex gap-3 rounded-2xl bg-background p-3 ring-1 ring-kwik-border/60 shadow-sm transition-all duration-300 hover:shadow-md hover:ring-kwik-orange/20"
                  >
                    {/* Product Image - improved container */}
                    <div className="relative w-20 h-20 md:w-16 md:h-16 rounded-xl overflow-hidden bg-kwik-bg-light flex-shrink-0 ring-1 ring-kwik-border/50 shadow-sm">
                      <AppImage
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm line-clamp-2 leading-tight text-kwik-dark">
                        {item.name}
                      </h3>
                      {item.store && (
                        <p className="text-xs text-kwik-gray-light mt-0.5">
                          {item.store}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-sm text-kwik-orange">
                          {formatCurrency(item.price * item.quantity)}
                        </span>

                        {/* Quantity Controls - improved styling */}
                        <div className="flex items-center gap-0.5 rounded-lg border border-kwik-border bg-kwik-bg-surface px-1 py-0.5">
                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            className="flex h-6 w-6 items-center justify-center rounded-md text-kwik-gray transition-colors duration-200 hover:bg-kwik-orange-tint hover:text-kwik-orange"
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity - 1)
                            }
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </motion.button>
                          <span className="w-6 text-center text-sm font-medium tabular-nums text-kwik-dark">
                            {item.quantity}
                          </span>
                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            className="flex h-6 w-6 items-center justify-center rounded-md text-kwik-gray transition-colors duration-200 hover:bg-kwik-orange-tint hover:text-kwik-orange"
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity + 1)
                            }
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </motion.button>
                        </div>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-kwik-muted transition-colors duration-200 hover:bg-kwik-red/10 hover:text-kwik-red self-start flex-shrink-0"
                      onClick={() => {
                        removeItem(item.productId);
                        kwikToast.success(`${item.name} removed from cart`);
                      }}
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Clear Cart */}
              <div className="pt-2">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-kwik-red transition-colors duration-200 hover:bg-kwik-red/5"
                  onClick={() => {
                    clearCart();
                    kwikToast.success("Cart cleared");
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Cart
                </motion.button>
              </div>

              {/* ─── You Might Also Like Section ─── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="mt-8 rounded-[24px] bg-background p-5 shadow-sm ring-1 ring-kwik-border/50"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-kwik-orange to-[#d97706] shadow-sm shadow-kwik-orange/20">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-kwik-dark">You might also like</h2>
                      <p className="text-[11px] text-kwik-gray-light">Based on your cart</p>
                    </div>
                  </div>
                  <div className="ml-auto hidden items-center gap-1 sm:flex">
                    <span className="h-[2px] w-8 rounded-full bg-kwik-border" />
                    <span className="h-2 w-2 rounded-full bg-kwik-orange" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { name: "Popular picks", icon: "🔥" },
                    { name: "New arrivals", icon: "✨" },
                    { name: "Best sellers", icon: "⭐" },
                  ].map((item) => (
                    <button
                      key={item.name}
                      onClick={() => kwikToast.info("Recommendations coming soon!")}
                      className="flex flex-col items-center gap-2 rounded-2xl bg-kwik-bg-surface p-4 ring-1 ring-kwik-border/50 transition-all duration-200 hover:ring-kwik-orange/20 hover:shadow-sm"
                    >
                      <span className="text-2xl">{item.icon}</span>
                      <span className="text-xs font-medium text-kwik-gray">{item.name}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Order Summary - enhanced card styling */}
            <div className="lg:sticky lg:top-36 lg:self-start">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="rounded-2xl border border-kwik-border/60 bg-background p-5 space-y-4 shadow-sm ring-1 ring-kwik-border/30"
              >
                <h3 className="font-semibold text-base text-kwik-dark">Order Summary</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-kwik-gray">Subtotal ({totalItems} items)</span>
                    <span className="font-medium text-kwik-dark">
                      {formatCurrency(totalPrice)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-kwik-gray">Delivery</span>
                    <span className="font-medium text-kwik-green">Free</span>
                  </div>
                  {savings > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-kwik-gray">Savings</span>
                      <span className="font-medium text-kwik-green">
                        -{formatCurrency(savings)}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-kwik-dark">Total</span>
                    <span className="font-bold text-lg text-kwik-orange">
                      {formatCurrency(totalPrice)}
                    </span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCheckout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-kwik-orange to-amber-600 py-3 text-sm font-semibold text-white shadow-lg shadow-kwik-orange/25 transition-all duration-300 hover:shadow-xl hover:brightness-110"
                >
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4" />
                </motion.button>

                {/* Trust badges */}
                <div className="flex items-center justify-center gap-4 pt-1">
                  <div className="flex items-center gap-1 text-xs text-kwik-gray-light">
                    <Shield className="w-3.5 h-3.5 text-kwik-green" />
                    <span>Secure Payment</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-kwik-gray-light">
                    <span className="text-kwik-green text-xs">●</span>
                    <span>Escrow Protected</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
