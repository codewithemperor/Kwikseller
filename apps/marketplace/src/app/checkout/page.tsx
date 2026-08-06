"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  CreditCard,
  Wallet,
  Banknote,
  Lock,
  ChevronRight,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  Check,
  Loader2,
  Truck,
  MapPin,
  RefreshCw,
  Package,
  PackageCheck,
  CheckCircle2,
  Tag,
  X,
  Zap,
  Store,
} from "lucide-react";
import { useCartStore } from "@/stores";
import { useOrderWorkflowStore } from "@/stores/order-workflow-store";
import { kwikToast } from "@kwikseller/utils";
import { PAYMENT_PROVIDERS, DEFAULT_PAYMENT_PROVIDER, KwisCrow } from "@/constants/order-workflow";
import { cn } from "@/lib/utils";
import { useCheckout } from "@/lib/order-api";
import { api } from "@kwikseller/api-client";

function formatNGN(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}

// ── Delivery options ──────────────────────────────────────────────────────
// Buyer selects one of STANDARD / EXPRESS / PICKUP. The vendor still
// confirms the final fee during quotation — this is the live estimate
// shown in the order summary and sent to the backend as `deliveryType`.
type DeliveryType = "STANDARD" | "EXPRESS" | "PICKUP";

const DELIVERY_OPTIONS: Array<{
  type: DeliveryType;
  label: string;
  Icon: typeof Truck;
  etaDays: string;
  priceLagos: string;
  priceOther: string;
  description: string;
}> = [
  {
    type: "STANDARD",
    label: "Standard",
    Icon: Truck,
    etaDays: "2-3 days",
    priceLagos: formatNGN(1500),
    priceOther: formatNGN(2000),
    description: "Doorstep delivery via local courier.",
  },
  {
    type: "EXPRESS",
    label: "Express",
    Icon: Zap,
    etaDays: "1 day",
    priceLagos: formatNGN(3500),
    priceOther: formatNGN(4500),
    description: "Next-day priority delivery.",
  },
  {
    type: "PICKUP",
    label: "Pickup",
    Icon: Store,
    etaDays: "Same day",
    priceLagos: "Free",
    priceOther: "Free",
    description: "Pick up from the vendor's store.",
  },
];

/**
 * Estimated delivery fee based on the buyer's state + selected delivery type.
 * Mirrors the dummy API's `deliveryFeeByState` for STANDARD, then applies the
 * EXPRESS premium (+₦2,000) or PICKUP waiver.
 */
function deliveryFeeByStateAndType(state: string, type: DeliveryType): number {
  if (type === "PICKUP") return 0;
  const s = (state ?? "").toLowerCase();
  let standard: number;
  if (s.includes("lagos")) standard = 1500;
  else if (s.includes("abuja")) standard = 2500;
  else if (s.includes("rivers") || s.includes("port")) standard = 3000;
  else if (s.includes("oyo") || s.includes("ibadan")) standard = 2200;
  else if (s.includes("kano")) standard = 3200;
  else standard = 2000;
  if (type === "EXPRESS") return standard + 2000;
  return standard;
}

function deliveryDaysByType(type: DeliveryType): number {
  if (type === "EXPRESS") return 1;
  if (type === "PICKUP") return 0;
  return 3; // STANDARD upper bound
}

function deliveryEtaLabel(type: DeliveryType): string {
  if (type === "EXPRESS") return "1 day";
  if (type === "PICKUP") return "Same day";
  return "2-3 days";
}

type PaymentProviderKey = keyof typeof PAYMENT_PROVIDERS;

interface AddressForm {
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  landmark?: string;
}

const NIGERIAN_STATES = [
  "Lagos", "Abuja FCT", "Rivers", "Kano", "Oyo", "Kaduna", "Enugu", "Delta",
  "Ogun", "Anambra", "Edo", "Plateau", "Imo", "Ondo", "Akwa Ibom", "Cross River",
];

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const placeOrder = useOrderWorkflowStore((s) => s.placeOrder);
  const checkout = useCheckout();

  const [address, setAddress] = useState<AddressForm>({
    fullName: "",
    phone: "",
    addressLine: "",
    city: "",
    state: "Lagos",
    landmark: "",
  });
  const [paymentProvider, setPaymentProvider] =
    useState<PaymentProviderKey>(DEFAULT_PAYMENT_PROVIDER);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("STANDARD");
  const [placing, setPlacing] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof AddressForm, string>>>({});

  // ── Coupon state ──
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountType: "PERCENT" | "AMOUNT" | "FREE_DELIVERY";
    discountValue: number;
    maxDiscount?: number;
    minOrder?: number;
    storeName?: string;
    storeId?: string;
    badgeText?: string;
    accentColor?: "orange" | "amber" | "rose" | "emerald" | "violet";
    message: string;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  async function applyCoupon() {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      kwikToast.error("Enter a coupon code", "Type a code then tap Apply.");
      return;
    }
    setCouponLoading(true);
    try {
      // Send the cart items so the server can enforce vendor-specific coupons.
      const payloadItems = items.map((it) => ({
        productId: it.productId,
        storeId: it.storeId ?? it.storeSlug,
        store: it.store ?? it.storeName,
        productStoreId: it.storeId,
      }));
      const res = await api.post<{
        code: string;
        valid: boolean;
        discountType: "PERCENT" | "AMOUNT" | "FREE_DELIVERY";
        discountValue: number;
        maxDiscount?: number;
        minOrder?: number;
        storeName?: string;
        storeId?: string;
        badgeText?: string;
        accentColor?: "orange" | "amber" | "rose" | "emerald" | "violet";
        message: string;
      }>("cart/coupon", { code, items: payloadItems });
      const data = res.data;
      if (!data?.valid) {
        setAppliedCoupon(null);
        kwikToast.error(
          "Coupon not applicable",
          data?.message || "This code is not valid or has expired.",
        );
        return;
      }
      // Check min order
      if (data.minOrder && data.minOrder > 0 && subtotal < data.minOrder) {
        kwikToast.error("Minimum order not met", `This coupon requires a minimum order of ₦${data.minOrder.toLocaleString()}.`);
        setAppliedCoupon(null);
        return;
      }
      setAppliedCoupon(data);
      kwikToast.success("Coupon applied", data.message || `${data.discountValue}${data.discountType === "PERCENT" ? "%" : data.discountType === "AMOUNT" ? " NGN" : ""} off your order.`);
    } catch (e) {
      setAppliedCoupon(null);
      kwikToast.error("Invalid coupon", e instanceof Error ? e.message : "This code is not valid or has expired.");
    } finally {
      setCouponLoading(false);
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponCode("");
    kwikToast.info("Coupon removed", "The discount has been cleared.");
  }

  // Group items by store (since the 1688 workflow sends each vendor a separate order).
  const itemsByStore = useMemo(() => {
    const groups: Record<string, { storeName: string; items: typeof items; subtotal: number }> =
      {};
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
  // Estimated platform fee (demo) — the real delivery fee is set by the vendor
  // when they submit the quotation (see the 1688 workflow).
  const estimatedProcessingFee = Math.round(subtotal * 0.015);
  // Coupon discount applied at checkout.
  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountType === "FREE_DELIVERY") return 0; // waives delivery fee, not subtotal
    if (appliedCoupon.discountType === "PERCENT") {
      const raw = Math.round((subtotal * appliedCoupon.discountValue) / 100);
      return appliedCoupon.maxDiscount ? Math.min(raw, appliedCoupon.maxDiscount) : raw;
    }
    // AMOUNT
    return Math.min(appliedCoupon.discountValue, subtotal);
  }, [appliedCoupon, subtotal]);
  // Estimated delivery fee — live, based on the buyer's selected state +
  // delivery type. The vendor still confirms the final fee during quotation.
  const deliveryFee = useMemo(
    () => deliveryFeeByStateAndType(address.state, deliveryType),
    [address.state, deliveryType],
  );
  const estimatedDeliveryDays = deliveryDaysByType(deliveryType);
  // Free-delivery coupons waive the delivery fee.
  const effectiveDeliveryFee = appliedCoupon?.discountType === "FREE_DELIVERY" ? 0 : deliveryFee;
  const totalDueNow = Math.max(0, subtotal - couponDiscount + estimatedProcessingFee + effectiveDeliveryFee);

  function validate(): boolean {
    const next: Partial<Record<keyof AddressForm, string>> = {};
    if (!address.fullName.trim()) next.fullName = "Full name is required";
    if (!address.phone.trim()) next.phone = "Phone number is required";
    else if (!/^[0-9+\s-]{7,}$/.test(address.phone.trim()))
      next.phone = "Enter a valid phone number";
    if (!address.addressLine.trim()) next.addressLine = "Street address is required";
    if (!address.city.trim()) next.city = "City is required";
    if (!address.state.trim()) next.state = "State is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handlePlaceOrder() {
    if (items.length === 0) {
      kwikToast.error("Your cart is empty", "Add products before checking out.");
      return;
    }
    if (!validate()) {
      kwikToast.error("Missing delivery details", "Please complete the delivery address.");
      return;
    }

    setPlacing(true);

    try {
      // POST to the backend so the vendor actually RECEIVES the order
      // (TODO #6). The backend groups items by vendor store and creates
      // one order per store (split checkout), each linked to the vendor.
      const result = await checkout.mutateAsync({
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        shippingAddress: {
          fullName: address.fullName,
          phone: address.phone,
          addressLine1: address.addressLine,
          addressLine2: address.landmark,
          city: address.city,
          state: address.state,
          country: "Nigeria",
        },
        paymentMethod: PAYMENT_PROVIDERS[paymentProvider]?.id ?? "CARD",
        deliveryType,
        couponCode: appliedCoupon?.code,
      });

      const apiOrders = result?.orders ?? [];

      // Also mirror into the local workflow store so the rich quotation UI
      // (timeline, escrow badge) keeps working for these orders.
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
          deliveryAddress: `${address.fullName}, ${address.addressLine}, ${address.city}, ${address.state}. Phone: ${address.phone}${address.landmark ? `. Landmark: ${address.landmark}` : ""}`,
        });
      }

      clearCart();
      const count = apiOrders.length || Object.keys(itemsByStore).length;
      kwikToast.success(
        "Order placed!",
        `${count} order${count > 1 ? "s" : ""} sent to vendor${count > 1 ? "s" : ""} for quotation. The vendor will confirm delivery & discount shortly.`,
      );

      // Redirect to the first API order's detail page (status: PENDING →
      // vendor quotes delivery/discount → CONFIRMED → buyer pays).
      if (apiOrders.length > 0 && apiOrders[0]?.id) {
        router.push(`/orders/${apiOrders[0].id}`);
      } else {
        router.push("/orders");
      }
    } catch (err) {
      setPlacing(false);
      kwikToast.error(
        "Checkout failed",
        err instanceof Error ? err.message : "Please try again.",
      );
    }
  }

  // ── Empty cart state ──
  if (items.length === 0) {
    return (
      <div className="bg-background min-h-screen">
        <div className="container mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
            <ShoppingBag className="h-10 w-10 text-gray-400" />
          </div>
          <h1 className="mt-6 font-heading text-2xl font-bold text-foreground">
            Your cart is empty
          </h1>
          <p className="mt-2 text-sm text-gray-500">
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
      {/* ── Hero header (matches order detail page design) ── */}
      <section className="kwik-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_55%)]" />
        <div className="container mx-auto max-w-7xl px-4 py-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/80">
              1688-style checkout
            </p>
            <h1 className="mt-1 font-heading text-2xl font-bold text-white md:text-4xl">
              Review &amp; place your order
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85">
              No payment now — the vendor will send a quotation with the delivery
              fee and ETA. Your funds stay protected by {KwisCrow.NAME} escrow
              until you confirm receipt.
            </p>

            {/* Workflow steps strip */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {[
                { icon: Package, label: "1. Place order", active: true },
                { icon: PackageCheck, label: "2. Vendor quotes", active: false },
                { icon: Wallet, label: "3. Pay (escrow)", active: false },
                { icon: Truck, label: "4. Delivery", active: false },
                { icon: CheckCircle2, label: "5. Confirm", active: false },
              ].map((step, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur ${
                    step.active
                      ? "bg-white/25 text-white"
                      : "bg-white/10 text-white/70"
                  }`}
                >
                  <step.icon className="h-3.5 w-3.5" />
                  {step.label}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          {/* ── Left: address + items + payment ── */}
          <div className="space-y-6">
            {/* Delivery address */}
            <div className="rounded-2xl border border-border bg-surface p-5 md:p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-heading text-base font-semibold text-foreground">
                    Delivery address
                  </h2>
                  <p className="text-xs text-gray-500">
                    Where should the vendor ship your order?
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Full name"
                  required
                  error={errors.fullName}
                  value={address.fullName}
                  onChange={(v) => setAddress((a) => ({ ...a, fullName: v }))}
                  placeholder="Jane Doe"
                />
                <Field
                  label="Phone number"
                  required
                  error={errors.phone}
                  value={address.phone}
                  onChange={(v) => setAddress((a) => ({ ...a, phone: v }))}
                  placeholder="+234 801 234 5678"
                />
                <div className="sm:col-span-2">
                  <Field
                    label="Street address"
                    required
                    error={errors.addressLine}
                    value={address.addressLine}
                    onChange={(v) => setAddress((a) => ({ ...a, addressLine: v }))}
                    placeholder="House 12, Allen Avenue, Ikeja"
                  />
                </div>
                <Field
                  label="City"
                  required
                  error={errors.city}
                  value={address.city}
                  onChange={(v) => setAddress((a) => ({ ...a, city: v }))}
                  placeholder="Ikeja"
                />
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    State <span className="text-danger">*</span>
                  </label>
                  <select
                    value={address.state}
                    onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  >
                    {NIGERIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <Field
                    label="Landmark (optional)"
                    value={address.landmark ?? ""}
                    onChange={(v) => setAddress((a) => ({ ...a, landmark: v }))}
                    placeholder="Opposite the petrol station"
                  />
                </div>
              </div>
            </div>

            {/* Delivery options — STANDARD / EXPRESS / PICKUP */}
            <div className="rounded-2xl border border-kwik-border-light bg-kwik-bg-surface p-5 md:p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-kwik-orange/10 text-kwik-orange">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-heading text-base font-semibold text-foreground">
                    Delivery option
                  </h2>
                  <p className="text-xs text-kwik-muted">
                    Pick how fast you want it. The vendor confirms the final fee
                    during quotation.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {DELIVERY_OPTIONS.map((opt) => {
                  const selected = deliveryType === opt.type;
                  const Icon = opt.Icon;
                  return (
                    <button
                      key={opt.type}
                      type="button"
                      onClick={() => setDeliveryType(opt.type)}
                      aria-pressed={selected}
                      className={cn(
                        "relative flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-kwik-orange/40",
                        selected
                          ? "border-kwik-orange bg-kwik-orange/5 ring-1 ring-kwik-orange/30"
                          : "border-kwik-border-light bg-kwik-bg-page hover:border-kwik-orange/40",
                      )}
                    >
                      <div className="flex w-full items-center justify-between">
                        <div
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-lg",
                            selected ? "bg-kwik-orange/15 text-kwik-orange" : "bg-kwik-bg-light text-kwik-muted",
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        {selected ? (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-kwik-orange text-white">
                            <Check className="h-3 w-3" strokeWidth={3} />
                          </span>
                        ) : null}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                        <p className="text-xs text-kwik-muted">{opt.description}</p>
                      </div>
                      <div className="mt-1 w-full space-y-0.5 border-t border-kwik-border-light pt-2 text-xs">
                        <p className="flex items-center justify-between">
                          <span className="text-kwik-muted">Lagos</span>
                          <span className="font-semibold text-foreground">{opt.priceLagos}</span>
                        </p>
                        <p className="flex items-center justify-between">
                          <span className="text-kwik-muted">Other states</span>
                          <span className="font-semibold text-foreground">{opt.priceOther}</span>
                        </p>
                        <p className="flex items-center justify-between">
                          <span className="text-kwik-muted">ETA</span>
                          <span className="font-semibold text-kwik-orange">{opt.etaDays}</span>
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Live estimate hint — reflects the selected state */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-kwik-bg-page px-4 py-2.5 text-xs">
                <span className="text-kwik-muted">
                  Estimate for <span className="font-semibold text-foreground">{address.state || "your state"}</span>:
                </span>
                <span className="font-semibold text-kwik-orange">
                  {deliveryType === "PICKUP"
                    ? "Free pickup"
                    : `${formatNGN(deliveryFee)} · ${deliveryEtaLabel(deliveryType)}`}
                </span>
              </div>
            </div>

            {/* Cart items grouped by vendor */}
            <div className="rounded-2xl border border-border bg-surface p-5 md:p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-heading text-base font-semibold text-foreground">
                    Your items
                  </h2>
                  <p className="text-xs text-gray-500">
                    {items.length} item{items.length > 1 ? "s" : ""} from{" "}
                    {storeCount} vendor{storeCount > 1 ? "s" : ""} — each vendor
                    quotes delivery separately.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {Object.entries(itemsByStore).map(([key, group]) => (
                  <div key={key} className="rounded-xl border border-border bg-background p-4">
                    <div className="mb-3 flex items-center gap-2 border-b border-border pb-2">
                      <Truck className="h-4 w-4 text-primary-600" />
                      <span className="text-sm font-semibold text-foreground">
                        {group.storeName}
                      </span>
                      <span className="ml-auto text-xs text-gray-500">
                        Subtotal: {formatNGN(group.subtotal)}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {group.items.map((item) => (
                        <div key={item.id} className="flex gap-3">
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-gray-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-sm font-medium text-foreground">
                              {item.name}
                            </p>
                            <p className="mt-0.5 text-sm font-semibold text-foreground">
                              {formatNGN(item.price)}
                            </p>
                            {item.comparePrice ? (
                              <p className="text-xs text-gray-400 line-through">
                                {formatNGN(item.comparePrice)}
                              </p>
                            ) : null}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center rounded-lg border border-border">
                              <button
                                type="button"
                                aria-label="Decrease quantity"
                                onClick={() =>
                                  updateQuantity(item.productId, item.quantity - 1, item.storeSlug)
                                }
                                className="flex h-8 w-8 items-center justify-center text-gray-500 hover:text-foreground"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-8 text-center text-sm font-medium text-foreground">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                aria-label="Increase quantity"
                                onClick={() =>
                                  updateQuantity(item.productId, item.quantity + 1, item.storeSlug)
                                }
                                className="flex h-8 w-8 items-center justify-center text-gray-500 hover:text-foreground"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <button
                              type="button"
                              aria-label={`Remove ${item.name}`}
                              onClick={() => removeItem(item.productId, item.storeSlug)}
                              className="text-gray-400 hover:text-danger"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment method */}
            <div className="rounded-2xl border border-border bg-surface p-5 md:p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-heading text-base font-semibold text-foreground">
                    Payment method
                  </h2>
                  <p className="text-xs text-gray-500">
                    You won&rsquo;t be charged now — payment happens after the vendor
                    sends a quotation.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {(Object.keys(PAYMENT_PROVIDERS) as PaymentProviderKey[]).map((key) => {
                  const provider = PAYMENT_PROVIDERS[key];
                  const selected = paymentProvider === key;
                  const Icon =
                    key === "WALLET" ? Wallet : key === "FLUTTERWAVE" ? Banknote : CreditCard;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPaymentProvider(key)}
                      className={cn(
                        "relative flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition",
                        selected
                          ? "border-primary-500 bg-primary-50 ring-2 ring-primary-500/20"
                          : "border-border bg-background hover:border-primary-300",
                      )}
                      aria-pressed={selected}
                    >
                      <Icon
                        className={cn(
                          "h-6 w-6",
                          selected ? "text-primary-600" : "text-gray-500",
                        )}
                      />
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {provider.label}
                        </p>
                        <p className="text-xs text-gray-500">{provider.blurb}</p>
                      </div>
                      {selected ? (
                        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-white">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Right: order summary (sticky) ── */}
          <aside className="lg:sticky lg:top-4 lg:h-fit">
            <div className="rounded-2xl border border-kwik-border-light bg-kwik-bg-surface p-5 md:p-6">
              <h2 className="mb-4 font-heading text-base font-semibold text-foreground">
                Order summary
              </h2>

              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-kwik-muted">Items subtotal</dt>
                  <dd className="font-medium text-foreground">{formatNGN(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-kwik-muted">Processing fee (1.5%)</dt>
                  <dd className="font-medium text-foreground">
                    {formatNGN(estimatedProcessingFee)}
                  </dd>
                </div>
                {appliedCoupon && (couponDiscount > 0 || appliedCoupon.discountType === "FREE_DELIVERY") && (
                  <div className="flex justify-between text-kwik-green">
                    <dt className="flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5" /> Coupon {appliedCoupon.code}
                    </dt>
                    <dd className="font-medium">
                      {appliedCoupon.discountType === "FREE_DELIVERY"
                        ? "Free delivery"
                        : `−${formatNGN(couponDiscount)}`}
                    </dd>
                  </div>
                )}
                <div className="flex items-start justify-between">
                  <dt className="text-kwik-muted">
                    Delivery fee
                    <span className="block text-xs text-kwik-muted/70">
                      {deliveryType === "PICKUP"
                        ? `Pickup · ${deliveryEtaLabel(deliveryType)}`
                        : `${deliveryEtaLabel(deliveryType)} · vendor confirms final`}
                    </span>
                  </dt>
                  <dd className="font-medium text-kwik-orange">
                    {deliveryType === "PICKUP"
                      ? "Free"
                      : effectiveDeliveryFee === 0 && appliedCoupon?.discountType === "FREE_DELIVERY"
                        ? "Free (coupon)"
                        : formatNGN(deliveryFee)}
                  </dd>
                </div>
              </dl>

              {/* ── Coupon input ── */}
              <div className="mt-4 border-t border-kwik-border-light pt-4">
                {appliedCoupon ? (
                  <div className="rounded-xl bg-kwik-green/5 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-sm font-medium text-kwik-green">
                        <Check className="h-4 w-4" />
                        {appliedCoupon.code} ·{" "}
                        {appliedCoupon.discountType === "PERCENT"
                          ? `${appliedCoupon.discountValue}% off`
                          : appliedCoupon.discountType === "FREE_DELIVERY"
                            ? "Free delivery"
                            : `${formatNGN(appliedCoupon.discountValue)} off`}
                      </span>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        aria-label="Remove coupon"
                        className="rounded-lg p-1 text-kwik-muted transition hover:bg-kwik-red/5 hover:text-kwik-red"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    {appliedCoupon.storeName && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-kwik-muted">
                        <Store className="h-3 w-3" />
                        Vendor-exclusive · applies to {appliedCoupon.storeName} items only
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-kwik-muted" />
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            applyCoupon();
                          }
                        }}
                        placeholder="Coupon code"
                        className="h-10 w-full rounded-lg border border-kwik-border-light bg-kwik-bg-page pl-9 pr-3 text-sm text-foreground uppercase outline-none transition placeholder:normal-case placeholder:text-kwik-muted focus:border-kwik-orange focus:ring-2 focus:ring-kwik-orange/20"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={applyCoupon}
                      disabled={couponLoading}
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-kwik-border-light px-4 text-sm font-semibold text-kwik-dark transition hover:bg-kwik-bg-page disabled:opacity-60"
                    >
                      {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                    </button>
                  </div>
                )}
                <p className="mt-1.5 text-xs text-kwik-muted">
                  Try{" "}
                  <button type="button" onClick={() => setCouponCode("KWIK10")} className="font-medium text-kwik-orange underline-offset-2 hover:underline">KWIK10</button>
                  ,{" "}
                  <button type="button" onClick={() => setCouponCode("WELCOME15")} className="font-medium text-kwik-orange underline-offset-2 hover:underline">WELCOME15</button>
                  ,{" "}
                  <button type="button" onClick={() => setCouponCode("FLASH50")} className="font-medium text-kwik-orange underline-offset-2 hover:underline">FLASH50</button>
                  ,{" "}
                  <button type="button" onClick={() => setCouponCode("SUMMER30")} className="font-medium text-kwik-orange underline-offset-2 hover:underline">SUMMER30</button>
                  , or{" "}
                  <button type="button" onClick={() => setCouponCode("FREEDELIVERY")} className="font-medium text-kwik-orange underline-offset-2 hover:underline">FREEDELIVERY</button>
                </p>
              </div>

              <div className="my-4 border-t border-kwik-border-light" />

              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium text-foreground">Due now</span>
                <span className="font-heading text-xl font-bold text-foreground">
                  {formatNGN(totalDueNow)}
                </span>
              </div>
              <p className="mt-1 text-xs text-kwik-muted">
                Final total (with delivery fee) is confirmed once the vendor
                submits a quotation. You pay on the &ldquo;To Pay&rdquo; step.
              </p>

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={placing}
                className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-kwik-orange text-sm font-semibold text-white transition hover:bg-kwik-orange-hover disabled:cursor-not-allowed disabled:opacity-70"
              >
                {placing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Placing order…
                  </>
                ) : (
                  <>
                    Place order <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {/* KwisCrow protection */}
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-kwik-orange/5 p-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-kwik-orange" />
                <div className="text-xs leading-5 text-kwik-dark">
                  <span className="font-semibold">KwisCrow Buyer Protection.</span>{" "}
                  Your payment stays in escrow until you confirm receipt (or the
                  24-hour dispute window closes).
                </div>
              </div>

              {/* Trust badges row */}
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center gap-1 rounded-lg border border-kwik-border-light bg-kwik-bg-page p-2.5 text-center">
                  <Lock className="h-4 w-4 text-kwik-orange" />
                  <span className="text-[10px] font-semibold text-foreground">SSL Secured</span>
                </div>
                <div className="flex flex-col items-center gap-1 rounded-lg border border-kwik-border-light bg-kwik-bg-page p-2.5 text-center">
                  <ShieldCheck className="h-4 w-4 text-kwik-green" />
                  <span className="text-[10px] font-semibold text-foreground">Escrow Protected</span>
                </div>
                <div className="flex flex-col items-center gap-1 rounded-lg border border-kwik-border-light bg-kwik-bg-page p-2.5 text-center">
                  <RefreshCw className="h-4 w-4 text-kwik-amber" />
                  <span className="text-[10px] font-semibold text-foreground">24h Disputes</span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-kwik-muted">
                <Lock className="h-3 w-3" /> Secure SSL encrypted checkout · Paystack verified
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

// ── Reusable text field ─────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label} {required ? <span className="text-danger">*</span> : null}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "h-11 w-full rounded-xl border bg-background px-3 text-sm text-foreground placeholder:text-gray-400 focus:outline-none focus:ring-2",
          error
            ? "border-danger focus:ring-danger/20"
            : "border-border focus:border-primary-500 focus:ring-primary-500/20",
        )}
      />
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
    </div>
  );
}
