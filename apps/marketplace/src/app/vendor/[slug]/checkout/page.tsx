"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, PackageOpen } from "lucide-react";
import { cartApi, checkoutApi, deliveryRatesApi, tokenManager } from "@/services/api-client";
import { kwikToast } from "@/lib/toast";
import type { DeliveryRate } from "@/types";
import {
  StorefrontLoading,
  VendorStorefrontShell,
  formatStoreCurrency,
  normalizeDesign,
  useVendorStorefront,
} from "@/components/vendor/vendor-storefront";
import { EscrowSafetyDialog } from "@/components/checkout/escrow-safety-dialog";
import { useCartStore } from "@/stores";

const defaultShipping = {
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  localGovernment: "",
  deliveryInstructions: "",
  city: "",
  state: "",
  country: "Nigeria",
};

function unwrapApiData<T>(value: unknown): T {
  const payload = value as { data?: unknown };
  const nested = payload?.data as { data?: unknown } | undefined;
  return (nested?.data ?? payload?.data ?? value) as T;
}

export default function VendorCheckoutPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params.slug;
  const { store, isLoading } = useVendorStorefront(slug, { loadProducts: false });
  const allItems = useCartStore((state) => state.items);
  const clearStoreCart = useCartStore((state) => state.clearStoreCart);
  const [shipping, setShipping] = React.useState(defaultShipping);
  const [deliveryRate, setDeliveryRate] = React.useState<DeliveryRate | null>(null);
  const [deliveryRateError, setDeliveryRateError] = React.useState("");
  const [isLoadingDeliveryRate, setIsLoadingDeliveryRate] = React.useState(false);
  const [isCheckingOut, setIsCheckingOut] = React.useState(false);
  const [isEscrowDialogOpen, setIsEscrowDialogOpen] = React.useState(false);
  const items = React.useMemo(
    () => allItems.filter((item) => item.storeSlug === slug),
    [allItems, slug],
  );

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const requiresShipping = items.some((item) => item.requiresShipping !== false && item.productType !== "DIGITAL");
  const deliveryFee = requiresShipping ? deliveryRate?.fee ?? 0 : 0;
  const total = subtotal + deliveryFee;

  React.useEffect(() => {
    if (!tokenManager.isAuthenticated()) {
      router.replace(`/login?redirect=/vendor/${slug}/checkout`);
    }
  }, [router, slug]);

  React.useEffect(() => {
    setDeliveryRate(null);
    setDeliveryRateError("");
    if (!requiresShipping) return;
    const state = shipping.state.trim();
    const localGovernment = shipping.localGovernment.trim();
    if (!state || !localGovernment) return;

    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      setIsLoadingDeliveryRate(true);
      try {
        const response = await deliveryRatesApi.lookup({ state, localGovernment });
        if (!cancelled) setDeliveryRate(unwrapApiData<DeliveryRate>(response.data));
      } catch {
        if (!cancelled) {
          setDeliveryRate(null);
          setDeliveryRateError("No active delivery rate for this location yet.");
        }
      } finally {
        if (!cancelled) setIsLoadingDeliveryRate(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [requiresShipping, shipping.state, shipping.localGovernment]);

  if (isLoading || !store) return <StorefrontLoading slug={slug} />;

  const updateShipping = (field: keyof typeof defaultShipping, value: string) => {
    setShipping((current) => ({ ...current, [field]: value }));
  };

  const validateShipping = () => {
    if (!requiresShipping) return true;
    return Boolean(
      shipping.fullName.trim() &&
        shipping.phone.trim() &&
        shipping.addressLine1.trim() &&
        shipping.city.trim() &&
        shipping.localGovernment.trim() &&
        shipping.state.trim() &&
        shipping.country.trim(),
    );
  };

  const syncVendorCartToApi = async () => {
    await cartApi.clearStore(store.slug);
    for (const item of items) {
      if (item.poolOfferId) {
        await cartApi.addPoolOffer(item.poolOfferId, item.quantity);
      } else {
        await cartApi.addItem(item.productId, item.quantity);
      }
    }
    await cartApi.validate();
  };

  const openEscrowDialog = () => {
    if (!items.length) return;
    if (!tokenManager.isAuthenticated()) {
      router.push(`/login?redirect=/vendor/${store.slug}/checkout`);
      return;
    }
    if (!validateShipping()) {
      kwikToast.error("Add full delivery details before payment.");
      return;
    }
    if (requiresShipping && !deliveryRate) {
      kwikToast.error(deliveryRateError || "Choose a delivery location with an active rate.");
      return;
    }
    setIsEscrowDialogOpen(true);
  };

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    try {
      await syncVendorCartToApi();
      const response = await checkoutApi.create({
        storeSlug: store.slug,
        idempotencyKey: `vendor-${store.slug}-${Date.now()}`,
        shippingAddress: requiresShipping ? shipping : undefined,
      });
      const checkout = unwrapApiData<{ authorizationUrl?: string }>(response.data);
      if (!checkout.authorizationUrl) {
        throw new Error("Checkout did not return a Paystack authorization URL.");
      }
      clearStoreCart(store.slug);
      window.location.href = checkout.authorizationUrl;
    } catch (error) {
      kwikToast.error(error instanceof Error ? error.message : "Checkout failed");
    } finally {
      setIsCheckingOut(false);
      setIsEscrowDialogOpen(false);
    }
  };

  const design = normalizeDesign(store.storefrontDesign);

  return (
    <VendorStorefrontShell store={store} active="cart">
      <section className="mx-auto max-w-5xl px-4 py-8 lg:px-6">
        <Link href={`/vendor/${store.slug}/cart`} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--store-primary)]">
          <ArrowLeft className="h-4 w-4" />
          Back to cart
        </Link>
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--store-accent)]">Vendor checkout</p>
          <h1 className="mt-2 text-2xl font-semibold">Checkout with {store.name}</h1>
        </div>

        {!items.length ? (
          <div className="border border-black/10 p-8 text-center dark:border-white/10">
            <PackageOpen className="mx-auto h-10 w-10 text-[var(--store-accent)]" />
            <h2 className="mt-4 text-xl font-semibold">No products from this vendor</h2>
            <p className="mt-2 text-sm text-kwik-muted dark:text-white/60">Add products from {store.name} before checkout.</p>
            <Link href={`/vendor/${store.slug}`} className="mt-6 inline-flex h-10 items-center justify-center bg-[var(--store-primary)] px-4 text-sm font-semibold text-white">
              Shop this store
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-5">
              {requiresShipping && (
                <section className="border border-black/10 p-4 dark:border-white/10">
                  <h2 className="text-lg font-semibold">Delivery information</h2>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {[
                      ["fullName", "Full name"],
                      ["phone", "Phone"],
                      ["addressLine1", "Address line 1"],
                      ["addressLine2", "Address line 2"],
                      ["city", "City"],
                      ["localGovernment", "Local government"],
                      ["state", "State"],
                      ["country", "Country"],
                    ].map(([field, label]) => (
                      <label key={field} className="text-xs font-semibold text-kwik-muted dark:text-white/60">
                        {label}
                        <input
                          value={shipping[field as keyof typeof defaultShipping]}
                          onChange={(event) => updateShipping(field as keyof typeof defaultShipping, event.target.value)}
                          className="mt-1 h-12 w-full border border-black/10 bg-white px-3 text-sm text-kwik-dark outline-none ring-0 focus:border-black/10 focus:outline-none focus:ring-0 dark:border-white/10 dark:bg-white/5 dark:text-white"
                        />
                      </label>
                    ))}
                  </div>
                  {isLoadingDeliveryRate && <p className="mt-3 text-xs text-kwik-muted">Loading delivery rate...</p>}
                  {deliveryRateError && <p className="mt-3 text-xs font-semibold text-red-600">{deliveryRateError}</p>}
                  {deliveryRate && (
                    <p className="mt-3 text-xs font-semibold text-emerald-700">
                      Delivery fee: {formatStoreCurrency(deliveryRate.fee)}
                    </p>
                  )}
                </section>
              )}
            </div>

            <aside className="h-fit lg:sticky lg:top-24 border border-black/10 p-4 dark:border-white/10">
              <h2 className="text-lg font-semibold">Order summary</h2>
              <div className="mt-4 space-y-3 text-sm">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.poolOfferId ?? "product"}`} className="flex justify-between gap-3">
                    <span className="line-clamp-1 text-kwik-muted dark:text-white/60">{item.quantity}x {item.name}</span>
                    <span className="font-semibold">{formatStoreCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="border-t border-black/10 pt-3 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold">{formatStoreCurrency(subtotal)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span>Delivery</span>
                    <span className="font-semibold">{requiresShipping ? formatStoreCurrency(deliveryFee) : "Digital only"}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-base font-bold">
                    <span>Total</span>
                    <span>{formatStoreCurrency(total)}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={openEscrowDialog}
                disabled={isCheckingOut}
                className="mt-5 flex h-11 w-full items-center justify-center gap-2 bg-[var(--store-accent)] px-4 text-sm font-semibold text-white disabled:opacity-60"
              >
                <CreditCard className="h-4 w-4" />
                {isCheckingOut ? "Starting Paystack" : "Continue to Paystack"}
              </button>
            </aside>
          </div>
        )}
      </section>
      <EscrowSafetyDialog
        isOpen={isEscrowDialogOpen}
        isLoading={isCheckingOut}
        onClose={() => setIsEscrowDialogOpen(false)}
        onConfirm={handleCheckout}
        accentColor={design.accentColor ?? "#F97316"}
      />
    </VendorStorefrontShell>
  );
}
