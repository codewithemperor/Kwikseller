"use client";

import Link from "next/link";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  Store as StoreIcon,
  ShieldCheck,
  Truck,
  Tag,
} from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import { AccountLayout } from "@/components/layout/account-layout";
import { EmptyState } from "@/components/ui/empty-state";
import { useCartStore } from "@/stores";
import { cn } from "@/lib/utils";

function formatNGN(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}

interface StoreGroup {
  key: string;
  storeName: string;
  storeSlug?: string;
  items: ReturnType<typeof useCartStore.getState>["items"];
  subtotal: number;
}

function CartPageInner() {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);

  // Group items by store.
  const groups: StoreGroup[] = React.useMemo(() => {
    const map = new Map<string, StoreGroup>();
    for (const item of items) {
      const key = item.storeSlug ?? item.store ?? item.storeName ?? "unknown";
      if (!map.has(key)) {
        map.set(key, {
          key,
          storeName: item.store ?? item.storeName ?? "Vendor",
          storeSlug: item.storeSlug,
          items: [],
          subtotal: 0,
        });
      }
      const g = map.get(key)!;
      g.items.push(item);
      g.subtotal += item.price * item.quantity;
    }
    return Array.from(map.values());
  }, [items]);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const estimatedDelivery = groups.length * 1500;
  const total = subtotal + estimatedDelivery;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="font-heading text-2xl font-bold text-foreground">Your Cart</h1>
        <div className="mt-6">
          <EmptyState
            variant="cart"
            title="Your cart is empty"
            description="Browse the marketplace and add products to your cart to get started."
            action={
              <Link
                href="/products"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-kwik-orange px-6 text-sm font-semibold text-white transition hover:bg-kwik-orange-hover"
              >
                Browse products
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Your Cart</h1>
          <p className="mt-1 text-sm text-kwik-muted">
            {items.length} item{items.length === 1 ? "" : "s"} from {groups.length}{" "}
            vendor{groups.length === 1 ? "" : "s"}
          </p>
        </div>
        <button
          type="button"
          onClick={clearCart}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-kwik-border-light px-3 text-sm font-medium text-kwik-muted transition hover:bg-kwik-red/5 hover:text-kwik-red"
        >
          <Trash2 className="h-4 w-4" /> Clear cart
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Items */}
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {groups.map((group) => (
              <motion.section
                key={group.key}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="rounded-2xl border border-kwik-border-light bg-kwik-bg-surface p-4 sm:p-5"
              >
                {/* Store header */}
                <div className="flex items-center justify-between border-b border-kwik-border-light pb-3">
                  <div className="flex items-center gap-2">
                    <StoreIcon className="h-4 w-4 text-kwik-orange" />
                    <Link
                      href={`/vendor/${group.storeSlug ?? group.key}`}
                      className="text-sm font-semibold text-foreground transition hover:text-kwik-orange"
                    >
                      {group.storeName}
                    </Link>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {formatNGN(group.subtotal)}
                  </span>
                </div>

                {/* Items */}
                <div className="mt-3 space-y-3">
                  <AnimatePresence initial={false}>
                    {group.items.map((item) => (
                      <motion.div
                        key={`${item.productId}-${item.storeSlug ?? ""}`}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex gap-3"
                      >
                        <AppImage
                          src={item.image}
                          alt={item.name}
                          className="h-20 w-20 shrink-0 rounded-xl object-cover"
                        />
                        <div className="flex flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              href={`/products/${item.productId}`}
                              className="line-clamp-2 text-sm font-semibold text-foreground transition hover:text-kwik-orange"
                            >
                              {item.name}
                            </Link>
                            <button
                              type="button"
                              onClick={() => removeItem(item.productId, item.storeSlug)}
                              aria-label={`Remove ${item.name}`}
                              className="shrink-0 rounded-lg p-1.5 text-kwik-muted transition hover:bg-kwik-red/5 hover:text-kwik-red"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <p className="mt-0.5 text-xs text-kwik-muted">{formatNGN(item.price)} each</p>
                          <div className="mt-auto flex items-center justify-between pt-2">
                            {/* Quantity stepper */}
                            <div className="inline-flex items-center rounded-lg border border-kwik-border-light">
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(item.productId, Math.max(1, item.quantity - 1), item.storeSlug)
                                }
                                aria-label="Decrease quantity"
                                className="flex h-8 w-8 items-center justify-center text-kwik-muted transition hover:text-kwik-orange disabled:opacity-40"
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-10 text-center text-sm font-semibold text-foreground">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.productId, item.quantity + 1, item.storeSlug)}
                                aria-label="Increase quantity"
                                className="flex h-8 w-8 items-center justify-center text-kwik-muted transition hover:text-kwik-orange"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <span className="text-sm font-bold text-foreground">
                              {formatNGN(item.price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.section>
            ))}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-kwik-border-light bg-kwik-bg-surface p-5">
            <h2 className="font-heading text-lg font-bold text-foreground">Order Summary</h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-kwik-muted">Subtotal</dt>
                <dd className="font-medium text-foreground">{formatNGN(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="flex items-center gap-1 text-kwik-muted">
                  <Truck className="h-3.5 w-3.5" /> Est. delivery
                </dt>
                <dd className="font-medium text-foreground">{formatNGN(estimatedDelivery)}</dd>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-kwik-orange/5 px-3 py-2 text-xs text-kwik-orange">
                <Tag className="h-3.5 w-3.5" />
                <span>Delivery &amp; discounts are finalized by the vendor at checkout.</span>
              </div>
              <div className="flex justify-between border-t border-kwik-border-light pt-3 text-base">
                <dt className="font-semibold text-foreground">Estimated total</dt>
                <dd className="font-bold text-kwik-orange">{formatNGN(total)}</dd>
              </div>
            </dl>

            <Link
              href="/checkout"
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-kwik-orange text-sm font-semibold text-white transition hover:bg-kwik-orange-hover"
            >
              Proceed to Checkout
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/products"
              className="mt-2 flex h-11 w-full items-center justify-center rounded-xl border border-kwik-border-light text-sm font-medium text-kwik-muted transition hover:bg-kwik-bg-page"
            >
              Continue shopping
            </Link>

            {/* Trust badges */}
            <div className="mt-5 space-y-2 border-t border-kwik-border-light pt-4 text-xs text-kwik-muted">
              <p className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-kwik-green" />
                KwisCrow escrow protection on every order
              </p>
              <p className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-kwik-orange" />
                Vendors quote delivery &amp; discount before you pay
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <AccountLayout>
      <CartPageInner />
    </AccountLayout>
  );
}
