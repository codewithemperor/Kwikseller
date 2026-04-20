"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  ArrowRight,
  Shield,
  ArrowLeft,
} from "lucide-react";
import { Button, Separator } from "@heroui/react";
import { useCartStore } from "@/stores";
import { kwikToast } from "@kwikseller/utils";
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-16 z-30 border-b border-divider bg-background/95 backdrop-blur-md">
        <div className="container mx-auto flex items-center gap-3 px-4 py-3">
          <Link href="/">
            <Button isIconOnly variant="ghost" size="sm" aria-label="Go back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h1 className="font-semibold text-lg leading-tight">Your Cart</h1>
              <p className="text-xs text-default-400">
                {totalItems} {totalItems === 1 ? "item" : "items"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 pb-32 md:pb-8">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-default-50 flex items-center justify-center mb-4">
              <ShoppingBag className="w-8 h-8 text-default-300" />
            </div>
            <h2 className="font-semibold text-xl mb-2">Your cart is empty</h2>
            <p className="text-sm text-default-400 mb-6 max-w-[280px]">
              Browse our marketplace and add some amazing products to your cart.
            </p>
            <Link href="/">
              <Button variant="primary" className="kwik-shadow">
                Start Shopping
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
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
                  className="bg-success/10 border border-success/20 rounded-xl px-4 py-2.5 flex items-center gap-2"
                >
                  <span className="text-sm">🎉</span>
                  <span className="text-sm font-medium text-success">
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
                    className="flex gap-3 bg-default-50 rounded-xl p-3"
                  >
                    {/* Product Image */}
                    <div className="w-20 h-20 md:w-16 md:h-16 rounded-lg overflow-hidden bg-default-100 flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm line-clamp-2 leading-tight">
                        {item.name}
                      </h3>
                      {item.store && (
                        <p className="text-xs text-default-400 mt-0.5">
                          {item.store}
                        </p>
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
                            variant="ghost"
                            className="w-7 h-7 min-w-7"
                            onPress={() =>
                              updateQuantity(
                                item.productId,
                                item.quantity - 1
                              )
                            }
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
                            onPress={() =>
                              updateQuantity(
                                item.productId,
                                item.quantity + 1
                              )
                            }
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
                        removeItem(item.productId);
                        kwikToast.success(`${item.name} removed from cart`);
                      }}
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Clear Cart */}
              <div className="pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-danger w-full"
                  onPress={() => {
                    clearCart();
                    kwikToast.success("Cart cleared");
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Cart
                </Button>
              </div>
            </div>

            {/* Order Summary - sidebar on desktop, sticky bottom on mobile */}
            <div className="lg:sticky lg:top-36 lg:self-start">
              <div className="rounded-2xl border border-divider bg-background p-5 space-y-4 shadow-sm">
                <h3 className="font-semibold text-base">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-default-500">Subtotal</span>
                    <span className="font-medium">
                      {formatCurrency(totalPrice)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-default-500">Delivery</span>
                    <span className="text-success font-medium">Free</span>
                  </div>
                  {savings > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-default-500">Savings</span>
                      <span className="text-success font-medium">
                        -{formatCurrency(savings)}
                      </span>
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
