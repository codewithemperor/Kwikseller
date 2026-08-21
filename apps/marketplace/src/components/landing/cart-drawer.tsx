"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Minus, Plus, Shield, ShoppingBag, Trash2, X } from "lucide-react";
import { Button } from "@heroui/react";
import { kwikToast } from "@/lib/toast";
import { AppImage } from "@/components/ui/app-image";
import { useCartStore } from "@/stores";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function CartDrawer() {
  const router = useRouter();
  const {
    items,
    isOpen,
    setCartOpen,
    removeItem,
    updateQuantity,
    clearCart,
  } = useCartStore();

  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const productCount = items.length;

  React.useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const goToCart = () => {
    setCartOpen(false);
    router.push("/checkout");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 right-0 top-0 z-[120] flex w-[420px] max-w-[92vw] flex-col overflow-hidden border-l border-border bg-background shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-kwik-border px-6 py-4 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center bg-kwik-orange/10">
                  <ShoppingBag className="h-5 w-5 text-kwik-orange" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-kwik-dark dark:text-white">Quick cart</h2>
                  <p className="text-xs text-kwik-muted dark:text-white/60">
                    {productCount} {productCount === 1 ? "product" : "products"}
                    {totalItems !== productCount ? `, ${totalItems} qty` : ""}
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
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100 dark:bg-white/10">
                    <ShoppingBag className="h-8 w-8 text-kwik-muted" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-kwik-dark dark:text-white">Your cart is empty</h3>
                  <p className="mb-6 max-w-[250px] text-sm text-kwik-gray-light dark:text-white/60">
                    Add items from the marketplace, then use the full cart page for delivery and payment.
                  </p>
                  <Button variant="primary" onPress={() => setCartOpen(false)}>
                    Start shopping
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 px-6 py-4">
                  {items.map((item) => (
                    <motion.div
                      key={`${item.productId}-${item.poolOfferId ?? "stock"}`}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0 }}
                      className="border-b border-neutral-200 pb-4 dark:border-white/10"
                    >
                      <div className="flex gap-3">
                        <div className="h-16 w-16 shrink-0 overflow-hidden bg-neutral-100 dark:bg-white/10">
                          <AppImage
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover"
                            fallbackVariant="product"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="line-clamp-2 text-sm font-medium leading-tight text-kwik-dark dark:text-white">
                            {item.name}
                          </h4>
                          {item.store && (
                            <p className="mt-0.5 text-xs text-kwik-muted dark:text-white/55">{item.store}</p>
                          )}

                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-sm font-bold text-kwik-orange">
                              {formatCurrency(item.price * item.quantity)}
                            </span>

                            <div className="flex items-center gap-1">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="ghost"
                                className="h-7 min-w-7"
                                onPress={() => updateQuantity(item.productId, item.quantity - 1)}
                                aria-label="Decrease quantity"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </Button>
                              <span className="w-7 text-center text-sm font-medium tabular-nums dark:text-white">
                                {item.quantity}
                              </span>
                              <Button
                                isIconOnly
                                size="sm"
                                variant="ghost"
                                className="h-7 min-w-7"
                                onPress={() => updateQuantity(item.productId, item.quantity + 1)}
                                aria-label="Increase quantity"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        <Button
                          isIconOnly
                          size="sm"
                          variant="ghost"
                          className="shrink-0 self-start text-default-300 hover:text-kwik-red"
                          onPress={() => {
                            removeItem(item.productId);
                            kwikToast.success(`${item.name} removed from cart`);
                          }}
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-danger"
                    onPress={() => {
                      clearCart();
                      kwikToast.success("Cart cleared");
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear cart
                  </Button>
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-border bg-background px-6 py-4">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm text-kwik-muted dark:text-white/60">Quick total</span>
                  <span className="text-lg font-bold text-kwik-dark dark:text-white">
                    {formatCurrency(totalPrice)}
                  </span>
                </div>

                <Button variant="primary" size="lg" className="w-full" onPress={goToCart}>
                  Checkout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <div className="mt-3 flex items-center justify-center gap-1 text-xs text-kwik-muted dark:text-white/55">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Delivery and payment happen on the cart page</span>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
