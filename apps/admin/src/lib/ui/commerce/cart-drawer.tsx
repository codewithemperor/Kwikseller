'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Minus, Plus, Shield, ShoppingBag, Trash2, X } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { AppImage } from '../inputs/app-image';
import { AppButton } from '../inputs/app-button';

export interface CartDrawerItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  store?: string;
  storeSlug?: string;
  storeId?: string;
  storeName?: string;
  poolOfferId?: string;
}

export interface CartDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartDrawerItem[];
  onQuantityChange: (item: CartDrawerItem, quantity: number) => void;
  onRemove: (item: CartDrawerItem) => void;
  onClear?: () => void;
  onCheckout: () => void;
  onContinueShopping?: () => void;
  currency?: string;
  showDeliveryFee?: boolean;
  deliveryFee?: number;
  discount?: number;
  renderImage?: (src: string, alt: string) => React.ReactNode;
  className?: string;
}

/**
 * CartDrawer — a reusable slide-in cart drawer. Takes data + callbacks as
 * props so any app can use it without coupling to a specific cart store.
 *
 * The marketplace passes its zustand cart store values; other apps could use
 * react-query or local state.
 */
export function CartDrawer({
  isOpen,
  onOpenChange,
  items,
  onQuantityChange,
  onRemove,
  onClear,
  onCheckout,
  onContinueShopping,
  currency = 'NGN',
  renderImage,
  className,
}: CartDrawerProps) {
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const productCount = items.length;
  const storeCount = new Set(
    items.map((i) => i.storeSlug || i.storeId || i.storeName).filter(Boolean),
  ).size;

  React.useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const imageFor = (item: CartDrawerItem) => {
    if (renderImage && item.image) {
      return renderImage(item.image, item.name);
    }
    return (
      <AppImage
        src={item.image}
        alt={item.name}
        className="h-full w-full object-cover"
        fallbackVariant="product"
      />
    );
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
            onClick={() => onOpenChange(false)}
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
              'fixed bottom-0 right-0 top-0 z-[120] flex w-[420px] max-w-[92vw] flex-col overflow-hidden border-l border-kwik-border bg-surface shadow-2xl',
              className,
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-kwik-border px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                  <ShoppingBag className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Quick cart</h2>
                  <p className="text-xs text-muted-foreground">
                    {productCount} {productCount === 1 ? 'product' : 'products'}
                    {totalItems !== productCount ? `, ${totalItems} qty` : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                aria-label="Close cart"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-default-100">
                    <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">Your cart is empty</h3>
                  <p className="mb-6 max-w-[250px] text-sm text-muted-foreground">
                    Add items from the marketplace, then use the full cart page for delivery and payment.
                  </p>
                  <AppButton
                    variant="primary"
                    onClick={() => {
                      onOpenChange(false);
                      onContinueShopping?.();
                    }}
                  >
                    Start shopping
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </AppButton>
                </div>
              ) : (
                <div className="space-y-4 px-6 py-4">
                  {items.map((item) => (
                    <motion.div
                      key={`${item.productId}-${item.poolOfferId ?? 'stock'}`}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0 }}
                      className="border-b border-kwik-border pb-4"
                    >
                      <div className="flex gap-3">
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-default-100">
                          {imageFor(item)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="line-clamp-2 text-sm font-medium leading-tight text-foreground">
                            {item.name}
                          </h4>
                          {item.store && (
                            <p className="mt-0.5 text-xs text-muted-foreground">{item.store}</p>
                          )}

                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-sm font-bold text-accent">
                              {formatCurrency(item.price * item.quantity, currency)}
                            </span>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => onQuantityChange(item, item.quantity - 1)}
                                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-7 text-center text-sm font-medium tabular-nums text-foreground">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => onQuantityChange(item, item.quantity + 1)}
                                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                                aria-label="Increase quantity"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemove(item)}
                          className="shrink-0 self-start rounded-md p-1 text-muted-foreground transition-colors hover:text-danger"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}

                  {onClear && (
                    <button
                      type="button"
                      onClick={onClear}
                      className="flex w-full items-center justify-center gap-2 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger/5"
                    >
                      <Trash2 className="h-4 w-4" />
                      Clear cart
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Footer / summary */}
            {items.length > 0 && (
              <div className="border-t border-kwik-border bg-surface px-6 py-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {totalItems} {totalItems === 1 ? 'item' : 'items'}
                      {storeCount > 0 && (
                        <>
                          {' '}from {storeCount} {storeCount === 1 ? 'store' : 'stores'}
                        </>
                      )}
                    </span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(totalPrice, currency)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Estimated delivery</span>
                    <span className="font-medium text-muted-foreground">Calculated at checkout</span>
                  </div>

                  <div className="my-2 border-t border-kwik-border" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Estimated total</span>
                    <span className="text-lg font-bold text-foreground">
                      {formatCurrency(totalPrice, currency)}
                    </span>
                  </div>
                </div>

                <AppButton
                  variant="primary"
                  size="lg"
                  fullWidth
                  className="mt-4"
                  onClick={() => {
                    onOpenChange(false);
                    onCheckout();
                  }}
                >
                  Proceed to Checkout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </AppButton>

                <div className="mt-3 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Secure checkout — protected by escrow</span>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default CartDrawer;
