"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  ChevronRight,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  Check,
  Loader2,
  Truck,
  Store,
  MapPin,
  X,
  AlertCircle,
  Lock,
} from "lucide-react";
import { useCartStore } from "@/stores";
import { useOrderWorkflowStore } from "@/stores/order-workflow-store";
import { kwikToast } from "@/lib/toast";
import { useAuth } from "@/lib/auth-context";
import { KwisCrow } from "@/constants/order-workflow";
import { cn } from "@/lib/utils";
import { useCheckout } from "@/lib/order-api";
import { api } from "@/services/api-client";
import { AddressConfirmModal, type AddressForm } from "@/components/modals/address-confirm-modal";

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatNGN(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * Generates a reasonably-unique idempotency key per checkout attempt.
 * The backend uses it to dedupe a ParentCheckout (and its per-vendor
 * Orders) so a network retry returns the original result instead of
 * double-creating orders. We regenerate it whenever the user starts a
 * new checkout submission (not on every render).
 */
function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `chk_${crypto.randomUUID()}`;
  }
  return `chk_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// ─── Delivery options (NEW spec: Pickup + Standard Delivery ONLY) ──────────
//
// The old STANDARD / EXPRESS / PICKUP trio plus state-based price grid has
// been removed. The backend is authoritative for every price/fee — at
// checkout time we only tell it which delivery method the buyer chose.
//   • PICKUP          → quoteStatus starts as AGREED (no fee to quote),
//                       buyer can initialize payment immediately.
//   • STANDARD_DELIVERY → quoteStatus starts as PENDING_VENDOR_QUOTE,
//                       vendor must quote → customer accepts/requests
//                       reduction → agreement → then payment.

type DeliveryMethod = "PICKUP" | "STANDARD_DELIVERY";

interface DeliveryOption {
  method: DeliveryMethod;
  label: string;
  Icon: typeof Truck;
  description: string;
  feeLabel: string;
}

const DELIVERY_OPTIONS: DeliveryOption[] = [
  {
    method: "PICKUP",
    label: "Pickup",
    Icon: Store,
    description: "Pick up from the vendor's store. No delivery fee.",
    feeLabel: "₦0",
  },
  {
    method: "STANDARD_DELIVERY",
    label: "Standard Delivery",
    Icon: Truck,
    description:
      "Doorstep delivery. The vendor will quote a delivery fee after you place the order.",
    feeLabel: "To be determined by vendor",
  },
];

interface UserProfileResponse {
  id?: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // ─── Cart store ───
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);

  // ─── Local workflow store (kept as a soft mirror so /orders/[id] keeps ──
  // its rich quotation UI working until the API detail page is migrated).
  const placeOrder = useOrderWorkflowStore((s) => s.placeOrder);

  // ─── API ───
  const checkout = useCheckout();

  // ─── UI state ───
  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>("PICKUP");
  const [address, setAddress] = useState<AddressForm>({
    fullName: "",
    phone: "",
    addressLine: "",
    city: "",
    state: "Lagos",
    landmark: "",
  });
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof AddressForm, string>>>(
    {},
  );

  // ─── Auth guard ───
  // The checkout endpoint is JWT-guarded on the backend. If the buyer is
  // not signed in, send them to /login with a return URL so they land back
  // here after authenticating.
  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent("/checkout");
      router.replace(`/login?redirect=${returnUrl}`);
    }
  }, [isAuthLoading, isAuthenticated, router]);

  // ─── Pre-fill name + phone from the user profile API (best-effort) ──
  // Falls back to the auth store's cached user. Both name and phone are
  // shown as disabled fields inside the modal — the buyer cannot change
  // their identity here, only the delivery coordinates.
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    async function loadProfile() {
      setProfileLoading(true);
      try {
        const res = await api.get<UserProfileResponse>("users/me");
        if (cancelled) return;
        const data = res.data;
        const firstName =
          data?.profile?.firstName ?? data?.firstName ?? user?.profile?.firstName ?? "";
        const lastName =
          data?.profile?.lastName ?? data?.lastName ?? user?.profile?.lastName ?? "";
        const phone =
          data?.profile?.phone ?? data?.phone ?? user?.phone ?? "";
        const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
        setAddress((prev) => ({
          ...prev,
          fullName: prev.fullName || fullName,
          phone: prev.phone || phone,
        }));
      } catch {
        // Best-effort: fall back to whatever the auth store has cached.
        if (!cancelled && user) {
          const firstName = user.profile?.firstName ?? "";
          const lastName = user.profile?.lastName ?? "";
          const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
          setAddress((prev) => ({
            ...prev,
            fullName: prev.fullName || fullName,
            phone: prev.phone || (user.phone ?? ""),
          }));
        }
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    }

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user]);

  // ─── Derived cart data ───
  const itemsByStore = useMemo(() => {
    const groups: Record<
      string,
      { storeName: string; items: typeof items; subtotal: number }
    > = {};
    for (const item of items) {
      const key = item.storeSlug ?? item.store ?? "unknown";
      if (!groups[key]) {
        groups[key] = {
          storeName: item.store ?? item.storeName ?? "Vendor",
          items: [],
          subtotal: 0,
        };
      }
      groups[key].items.push(item);
      groups[key].subtotal += item.price * item.quantity;
    }
    return groups;
  }, [items]);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items],
  );
  const storeCount = Object.keys(itemsByStore).length;

  // The backend computes the real 1% processing fee (it's authoritative).
  // For the PICKUP summary only we display a *clearly-labelled* estimate so
  // the buyer has a ballpark figure; the final amount is shown on the order
  // detail page after the backend response lands.
  const estimatedProcessingFee = Math.round(subtotal * 0.01);

  // ─── Validate address (only when Standard Delivery is selected) ───
  function validateAddress(): boolean {
    const next: Partial<Record<keyof AddressForm, string>> = {};
    if (!address.fullName.trim()) next.fullName = "Full name is required";
    if (!address.phone.trim()) next.phone = "Phone number is required";
    else if (!/^[0-9+\s-]{7,}$/.test(address.phone.trim()))
      next.phone = "Enter a valid phone number";
    if (!address.addressLine.trim())
      next.addressLine = "Street address is required";
    if (!address.city.trim()) next.city = "City is required";
    if (!address.state.trim()) next.state = "State is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function openAddressModal() {
    setErrors({});
    setAddressModalOpen(true);
  }

  function saveAddressFromModal() {
    if (!validateAddress()) return;
    setAddressConfirmed(true);
    setAddressModalOpen(false);
    // Confirming the address IS the checkout trigger for Standard Delivery —
    // place the order straight away instead of bouncing back to the form.
    handlePlaceOrder();
  }

  // ─── Place order ───
  async function handlePlaceOrder() {
    if (items.length === 0) {
      kwikToast.error("Your cart is empty", "Add products before checking out.");
      return;
    }

    // Standard Delivery requires a valid shipping address. Pickup does not.
    if (deliveryMethod === "STANDARD_DELIVERY") {
      if (!validateAddress()) {
        kwikToast.error(
          "Confirm your delivery address",
          "Add or confirm a delivery address before placing your order.",
        );
        openAddressModal();
        return;
      }
    }

    checkout.reset();
    const idempotencyKey = newIdempotencyKey();

    try {
      const result = await checkout.mutateAsync({
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        deliveryMethod,
        // Pickup needs no shipping address. Standard Delivery requires one.
        shippingAddress:
          deliveryMethod === "STANDARD_DELIVERY"
            ? {
                fullName: address.fullName,
                phone: address.phone,
                addressLine1: address.addressLine,
                addressLine2: address.landmark,
                city: address.city,
                state: address.state,
                country: "Nigeria",
              }
            : undefined,
        idempotencyKey,
      });

      const apiOrders = result?.orders ?? [];

      // Soft mirror into the local workflow store so the /orders/[id]
      // quotation UI keeps working for these orders (PENDING → vendor
      // quotes → CONFIRMED → buyer pays). This is a UX fallback, not the
      // source of truth — the API is.
      for (const group of Object.values(itemsByStore)) {
        placeOrder({
          items: group.items.map((i) => ({
            productId: i.productId,
            name: i.name,
            unitPrice: i.price,
            quantity: i.quantity,
            image: i.image,
          })),
          vendorId: group.storeName,
          vendorName: group.storeName,
          deliveryAddress:
            deliveryMethod === "STANDARD_DELIVERY"
              ? `${address.fullName}, ${address.addressLine}, ${address.city}, ${address.state}. Phone: ${address.phone}${address.landmark ? `. Landmark: ${address.landmark}` : ""}`
              : "PICKUP — buyer collects from vendor's store",
        });
      }

      clearCart();

      const orderCount = apiOrders.length || storeCount;
      const isPickup = deliveryMethod === "PICKUP";
      kwikToast.success(
        "Order placed!",
        isPickup
          ? `${orderCount} order${orderCount > 1 ? "s" : ""} placed. You can initialize payment now.`
          : `${orderCount} order${orderCount > 1 ? "s" : ""} sent to the vendor${orderCount > 1 ? "s" : ""} for a delivery quote. You'll be notified once they respond.`,
      );

      // PICKUP: the quote auto-agrees at checkout, so skip the order detail
      // page and send the buyer straight to the payment gateway.
      if (isPickup) {
        const firstOrderId = apiOrders[0]?.id;
        if (firstOrderId) {
          try {
            const payRes = await api.post<{ authorizationUrl?: string }>(
              `orders/${firstOrderId}/initialize-payment`,
            );
            const authorizationUrl = payRes.data?.authorizationUrl;
            if (authorizationUrl) {
              kwikToast.info(
                "Redirecting to payment",
                "Complete your payment to confirm the order.",
              );
              window.location.href = authorizationUrl;
              return;
            }
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Failed to initialize payment.";
            kwikToast.error(
              "Payment initialization failed",
              `${message} You can retry from the order page.`,
            );
          }
          router.push(`/orders/${firstOrderId}`);
        } else {
          router.push("/orders");
        }
        return;
      }

      // STANDARD_DELIVERY: redirect to the first API order's detail page if
      // available (quote negotiation happens there), otherwise the orders list.
      if (apiOrders.length > 0 && apiOrders[0]?.id) {
        router.push(`/orders/${apiOrders[0].id}`);
      } else {
        router.push("/orders");
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";
      kwikToast.error("Checkout failed", message);
    }
  }

  // ─── Loading state (auth still resolving) ───
  if (isAuthLoading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="text-secondary-500 h-7 w-7 animate-spin" />
          <p className="text-muted-foreground text-sm">Loading checkout…</p>
        </div>
      </div>
    );
  }

  // ─── Not authenticated (redirect in flight) ───
  if (!isAuthenticated) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <Lock className="text-muted-foreground h-7 w-7" />
          <p className="text-muted-foreground text-sm">
            Redirecting to sign in…
          </p>
        </div>
      </div>
    );
  }

  // ─── Empty cart ───
  if (items.length === 0) {
    return (
      <div className="bg-background min-h-screen">
        <div className="container mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <ShoppingBag className="text-muted-foreground h-10 w-10" />
          </div>
          <h1 className="mt-6 text-foreground text-2xl font-bold">
            Your cart is empty
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Add products to your cart before checking out.
          </p>
          <button
            type="button"
            onClick={() => router.push("/products")}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-secondary-500 px-6 text-sm font-semibold text-white hover:bg-secondary-600"
          >
            Browse products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      {/* ── Hero header ── */}
      <section className="bg-secondary-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_55%)]" />
        <div className="container relative mx-auto max-w-7xl px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/80">
              Secure checkout
            </p>
            <h1 className="mt-1 text-2xl font-bold text-white md:text-4xl">
              Review &amp; place your order
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85">
              No payment now — the vendor will send a delivery quote (for
              Standard Delivery) and you pay once it&rsquo;s agreed. Your funds
              stay protected by {KwisCrow.NAME} escrow until you confirm receipt.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* ── Left column: Products → Delivery Option ── */}
          <div className="space-y-6">
            {/* ── 1. PRODUCTS ── */}
            <section
              aria-labelledby="checkout-products-heading"
              className="rounded-2xl border border-border bg-card p-5 md:p-6"
            >
              <div className="mb-4 flex items-center gap-2">
                <div className="bg-secondary-50 text-secondary-700 flex h-9 w-9 items-center justify-center rounded-lg">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <h2
                    id="checkout-products-heading"
                    className="text-foreground text-base font-semibold"
                  >
                    Your items
                  </h2>
                  <p className="text-muted-foreground text-xs">
                    {items.length} item{items.length > 1 ? "s" : ""} from{" "}
                    {storeCount} vendor{storeCount > 1 ? "s" : ""} — each
                    vendor receives a separate order.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {Object.entries(itemsByStore).map(([key, group]) => (
                  <div
                    key={key}
                    className="rounded-xl border border-border bg-background p-4"
                  >
                    {/* Vendor sub-header (multi-vendor grouping) */}
                    <div className="mb-3 flex items-center gap-2 border-b border-border pb-2">
                      <Store className="text-secondary-600 h-4 w-4" />
                      <span className="text-foreground text-sm font-semibold">
                        {group.storeName}
                      </span>
                      <span className="text-muted-foreground ml-auto text-xs">
                        Subtotal: {formatNGN(group.subtotal)}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {group.items.map((item) => (
                        <div key={item.id} className="flex gap-3">
                          <div className="bg-muted h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-foreground line-clamp-2 text-sm font-medium">
                              {item.name}
                            </p>
                            {item.variantName || item.variantId ? (
                              <p className="text-muted-foreground mt-0.5 text-xs">
                                Variant: {item.variantName ?? item.variantId}
                              </p>
                            ) : null}
                            <p className="text-foreground mt-0.5 text-sm font-semibold">
                              {formatNGN(item.price)}
                            </p>
                            {item.comparePrice ? (
                              <p className="text-muted-foreground text-xs line-through">
                                {formatNGN(item.comparePrice)}
                              </p>
                            ) : null}
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            {/* Quantity stepper */}
                            <div className="flex items-center rounded-lg border border-border">
                              <button
                                type="button"
                                aria-label="Decrease quantity"
                                onClick={() =>
                                  updateQuantity(
                                    item.productId,
                                    item.quantity - 1,
                                    item.storeSlug,
                                  )
                                }
                                className="text-muted-foreground hover:text-foreground flex h-8 w-8 items-center justify-center"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="text-foreground w-8 text-center text-sm font-medium">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                aria-label="Increase quantity"
                                onClick={() =>
                                  updateQuantity(
                                    item.productId,
                                    item.quantity + 1,
                                    item.storeSlug,
                                  )
                                }
                                className="text-muted-foreground hover:text-foreground flex h-8 w-8 items-center justify-center"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <button
                              type="button"
                              aria-label={`Remove ${item.name}`}
                              onClick={() =>
                                removeItem(item.productId, item.storeSlug)
                              }
                              className="text-muted-foreground hover:text-danger"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            {/* Line subtotal */}
                            <p className="text-foreground text-xs font-semibold">
                              {formatNGN(item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── 2. DELIVERY OPTION (Pickup / Standard Delivery ONLY) ── */}
            <section
              aria-labelledby="checkout-delivery-heading"
              className="rounded-2xl border border-border bg-card p-5 md:p-6"
            >
              <div className="mb-4 flex items-center gap-2">
                <div className="bg-secondary-50 text-secondary-700 flex h-9 w-9 items-center justify-center rounded-lg">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <h2
                    id="checkout-delivery-heading"
                    className="text-foreground text-base font-semibold"
                  >
                    Delivery option
                  </h2>
                  <p className="text-muted-foreground text-xs">
                    Choose how you want to receive your order. The vendor
                    confirms the final delivery fee during quotation.
                  </p>
                </div>
              </div>

              <div
                role="radiogroup"
                aria-label="Delivery method"
                className="grid grid-cols-1 gap-3 sm:grid-cols-2"
              >
                {DELIVERY_OPTIONS.map((opt) => {
                  const selected = deliveryMethod === opt.method;
                  const Icon = opt.Icon;
                  return (
                    <button
                      key={opt.method}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setDeliveryMethod(opt.method)}
                      className={cn(
                        "relative flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500/40",
                        selected
                          ? "border-secondary-500 bg-secondary-50 ring-1 ring-secondary-500/30"
                          : "border-border bg-background hover:border-secondary-500/40",
                      )}
                    >
                      <div className="flex w-full items-center justify-between">
                        <div
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-lg",
                            selected
                              ? "bg-secondary-500/15 text-secondary-700"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        {selected ? (
                          <span className="bg-secondary-500 flex h-5 w-5 items-center justify-center rounded-full text-white">
                            <Check className="h-3 w-3" strokeWidth={3} />
                          </span>
                        ) : null}
                      </div>
                      <div>
                        <p className="text-foreground text-sm font-semibold">
                          {opt.label}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {opt.description}
                        </p>
                      </div>
                      <div className="mt-1 w-full border-t border-border pt-2 text-xs">
                        <p className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Delivery fee
                          </span>
                          <span className="text-foreground font-semibold">
                            {opt.feeLabel}
                          </span>
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Pickup → no address needed. Standard Delivery → address CTA. */}
              {deliveryMethod === "PICKUP" ? (
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-muted/60 p-3 text-xs">
                  <Store className="text-secondary-600 mt-0.5 h-4 w-4 shrink-0" />
                  <p className="text-muted-foreground">
                    <span className="text-foreground font-semibold">
                      Pickup selected.
                    </span>{" "}
                    No delivery address needed. The vendor will share pickup
                    instructions once they accept your order. You can
                    initialize payment immediately after placing the order.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <button
                    type="button"
                    onClick={openAddressModal}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-xl border p-4 text-left transition",
                      addressConfirmed
                        ? "border-secondary-500 bg-secondary-50"
                        : "border-border bg-background hover:border-secondary-500/40",
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-lg",
                          addressConfirmed
                            ? "bg-secondary-500/15 text-secondary-700"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        <MapPin className="h-5 w-5" />
                      </span>
                      <span>
                        <span className="text-foreground block text-sm font-semibold">
                          {addressConfirmed
                            ? "Delivery address confirmed"
                            : "Confirm delivery address"}
                        </span>
                        <span className="text-muted-foreground block text-xs">
                          {addressConfirmed
                            ? `${address.fullName} · ${address.addressLine}, ${address.city}, ${address.state}`
                            : "Add the address where the vendor should ship your order."}
                        </span>
                      </span>
                    </span>
                    <ChevronRight className="text-muted-foreground h-4 w-4" />
                  </button>
                  {!addressConfirmed && (
                    <p className="flex items-start gap-1.5 text-xs text-amber-600">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      Standard Delivery requires a confirmed shipping address
                      before you can place your order.
                    </p>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* ── Right column: Order summary + Place order ── */}
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <section
              aria-labelledby="checkout-summary-heading"
              className="rounded-2xl border border-border bg-card p-5 md:p-6"
            >
              <h2
                id="checkout-summary-heading"
                className="text-foreground mb-4 text-base font-semibold"
              >
                Order summary
              </h2>

              <dl className="space-y-2.5 text-sm">
                {/* Subtotal */}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="text-foreground font-medium">
                    {formatNGN(subtotal)}
                  </dd>
                </div>

                {/* Delivery fee */}
                <div className="flex items-start justify-between">
                  <dt className="text-muted-foreground">
                    Delivery fee
                    {deliveryMethod === "STANDARD_DELIVERY" ? (
                      <span className="block text-xs text-muted-foreground/80">
                        Vendor will quote
                      </span>
                    ) : null}
                  </dt>
                  <dd className="text-foreground font-medium">
                    {deliveryMethod === "PICKUP"
                      ? "₦0"
                      : "To be quoted by vendor"}
                  </dd>
                </div>

                {/* Processing fee — backend computes the real amount. */}
                <div className="flex items-start justify-between">
                  <dt className="text-muted-foreground">
                    Processing fee
                    <span className="block text-xs text-muted-foreground/80">
                      1% (calculated at checkout)
                    </span>
                  </dt>
                  <dd className="text-foreground font-medium">
                    {deliveryMethod === "PICKUP"
                      ? `≈ ${formatNGN(estimatedProcessingFee)}`
                      : "Calculated at checkout"}
                  </dd>
                </div>
              </dl>

              <div className="my-4 border-t border-border" />

              {/* Total */}
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-foreground text-sm font-medium">
                  Total
                </span>
                <span className="text-foreground text-right text-base font-bold">
                  {deliveryMethod === "PICKUP" ? (
                    <>
                      ≈ {formatNGN(subtotal + estimatedProcessingFee)}
                      <span className="text-muted-foreground mt-0.5 block text-xs font-normal">
                        Subtotal + 1% processing fee (final amount confirmed by
                        backend)
                      </span>
                    </>
                  ) : (
                    <>
                      Subtotal + processing fee + delivery fee (TBD)
                      <span className="text-muted-foreground mt-0.5 block text-xs font-normal">
                        Final total shown once the vendor&rsquo;s delivery quote
                        is agreed.
                      </span>
                    </>
                  )}
                </span>
              </div>

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={checkout.isPending}
                className="bg-secondary-500 hover:bg-secondary-600 mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70"
              >
                {checkout.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Placing order…
                  </>
                ) : (
                  <>
                    Place order <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <p className="text-muted-foreground mt-3 text-center text-xs">
                {deliveryMethod === "PICKUP"
                  ? "You can initialize payment immediately after placing the order."
                  : "The vendor will send a delivery quote after you place the order. You pay once the quote is agreed."}
              </p>

              {/* KwisCrow protection */}
              <div className="bg-secondary-50 mt-4 flex items-start gap-2 rounded-xl p-3">
                <ShieldCheck className="text-secondary-600 mt-0.5 h-5 w-5 shrink-0" />
                <div className="text-muted-foreground text-xs leading-5">
                  <span className="text-foreground font-semibold">
                    {KwisCrow.NAME} Buyer Protection.
                  </span>{" "}
                  Your payment stays in escrow until you confirm receipt (or
                  the {KwisCrow.DISPUTE_WINDOW_HOURS}-hour dispute window
                  closes).
                </div>
              </div>
            </section>
          </aside>
        </div>
      </section>

      <AddressConfirmModal
        isOpen={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        address={address}
        onUpdateAddress={setAddress}
        errors={errors}
        profileLoading={profileLoading}
        onConfirm={saveAddressFromModal}
        onNavigateToProfile={() => router.push("/profile")}
      />
    </div>
  );
}
