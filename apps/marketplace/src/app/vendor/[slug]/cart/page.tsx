"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { PackageOpen, ShoppingCart, Trash2 } from "lucide-react";
import { tokenManager } from "@kwikseller/api-client";
import { kwikToast } from "@kwikseller/utils";
import {
  QuantityStepper,
  StorefrontActionLink,
  StorefrontLoading,
  VendorStorefrontShell,
  formatStoreCurrency,
  useVendorStorefront,
} from "@/components/vendor/vendor-storefront";
import { useCartStore } from "@/stores";

export default function VendorCartPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params.slug;
  const { store, isLoading } = useVendorStorefront(slug, { loadProducts: false });
  const allItems = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const [showMixedCartChoice, setShowMixedCartChoice] = React.useState(false);
  const items = React.useMemo(
    () => allItems.filter((item) => item.storeSlug === slug),
    [allItems, slug],
  );
  const hasOtherStoreItems = allItems.some((item) => item.storeSlug !== slug);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (isLoading || !store) return <StorefrontLoading slug={slug} />;

  const continueToCheckout = () => {
    if (!items.length) return;
    if (!tokenManager.isAuthenticated()) {
      kwikToast.info("Login to continue checkout.");
      router.push(`/login?redirect=/vendor/${store.slug}/checkout`);
      return;
    }
    if (hasOtherStoreItems) {
      setShowMixedCartChoice(true);
      return;
    }
    router.push(`/vendor/${store.slug}/checkout`);
  };

  return (
    <VendorStorefrontShell store={store} active="cart">
      <section className="mx-auto max-w-5xl px-4 py-5 lg:px-6">

        {!items.length ? (
          <div className="border border-black/10 p-8 text-center dark:border-white/10">
            <PackageOpen className="mx-auto h-10 w-10 text-[var(--store-accent)]" />
            <h2 className="mt-4 text-xl font-semibold">This store cart is empty</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-kwik-muted dark:text-white/60">
              Add products from {store.name}, or browse other vendors in the marketplace.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <StorefrontActionLink href={`/vendor/${store.slug}`}>Shop this store</StorefrontActionLink>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <div className="divide-y divide-black/10 border border-black/10 dark:divide-white/10 dark:border-white/10">
              {items.map((item) => (
                <article key={`${item.productId}-${item.poolOfferId ?? "product"}`} className="grid grid-cols-[84px_1fr] gap-3 p-3 sm:grid-cols-[104px_1fr_auto]">
                  <img src={item.image} alt={item.name} className="h-20 w-20 object-cover sm:h-24 sm:w-24" />
                  <div className="min-w-0">
                    <p className="line-clamp-1 font-semibold">{item.name}</p>
                    <p className="mt-1 text-xs text-kwik-muted dark:text-white/55">{item.productType === "DIGITAL" ? "Digital delivery" : "Store fulfillment"}</p>
                    <p className="mt-3 font-bold">{formatStoreCurrency(item.price)}</p>
                  </div>
                  <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:flex-col sm:items-end">
                    <QuantityStepper
                      value={item.quantity}
                      onDecrease={() => updateQuantity(item.productId, item.quantity - 1, store.slug)}
                      onIncrease={() => updateQuantity(item.productId, item.quantity + 1, store.slug)}
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId, store.slug)}
                      className="inline-flex items-center gap-2 text-xs font-semibold text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <aside className="h-fit border border-black/10 p-4 dark:border-white/10">
              <h2 className="text-lg font-semibold">Store checkout</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-kwik-muted dark:text-white/60">Products</span>
                  <span>{items.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-kwik-muted dark:text-white/60">Subtotal</span>
                  <span className="font-semibold">{formatStoreCurrency(subtotal)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={continueToCheckout}
                className="mt-5 flex h-11 w-full items-center justify-center bg-[var(--store-accent)] px-4 text-sm font-semibold text-white"
              >
                Checkout
              </button>
            </aside>
          </div>
        )}
      </section>
      {showMixedCartChoice && (
        <div className="fixed inset-0 z-[130] flex items-end bg-black/45 p-4 sm:items-center sm:justify-center">
          <div className="w-full max-w-md bg-white p-5 shadow-2xl dark:bg-[#07111f]">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-[var(--store-accent)] text-white">
                <ShoppingCart className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold">You have items from other stores</h2>
                <p className="mt-2 text-sm leading-6 text-kwik-muted dark:text-white/60">
                  You can checkout only {store.name} now, or review the full marketplace cart to pay for all stores together.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setShowMixedCartChoice(false);
                  router.push(`/vendor/${store.slug}/checkout`);
                }}
                className="h-11 bg-[var(--store-accent)] px-4 text-sm font-semibold text-white"
              >
                Checkout this store
              </button>
              <button
                type="button"
                onClick={() => router.push("/cart")}
                className="h-11 border border-black/10 px-4 text-sm font-semibold text-[var(--store-primary)] dark:border-white/10"
              >
                Review all carts
              </button>
            </div>
          </div>
        </div>
      )}
    </VendorStorefrontShell>
  );
}
