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
} from "lucide-react";
import { useCartStore } from "@/stores";
import { useOrderWorkflowStore } from "@/stores/order-workflow-store";
import { kwikToast } from "@kwikseller/utils";
import { PAYMENT_PROVIDERS, DEFAULT_PAYMENT_PROVIDER, KwisCrow } from "@/constants/order-workflow";
import { cn } from "@/lib/utils";

function formatNGN(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
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
  const [placing, setPlacing] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof AddressForm, string>>>({});

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
  const totalDueNow = subtotal + estimatedProcessingFee;

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
    // Simulate a brief network call so the user sees feedback.
    await new Promise((r) => setTimeout(r, 900));

    try {
      // Place one order per vendor (1688-style: each vendor quotes separately).
      const orderIds: string[] = [];
      for (const [storeKey, group] of Object.entries(itemsByStore)) {
        const order = placeOrder({
          items: group.items.map((i) => ({
            productId: i.productId,
            name: i.name,
            unitPrice: i.price,
            quantity: i.quantity,
            image: i.image,
          })),
          vendorId: storeKey,
          vendorName: group.storeName,
          deliveryAddress: `${address.fullName}, ${address.addressLine}, ${address.city}, ${address.state}. Phone: ${address.phone}${address.landmark ? `. Landmark: ${address.landmark}` : ""}`,
        });
        if (order?.id) orderIds.push(order.id);
      }

      clearCart();
      kwikToast.success(
        "Order placed!",
        `${orderIds.length} order${orderIds.length > 1 ? "s" : ""} sent to vendor${orderIds.length > 1 ? "s" : ""} for quotation.`,
      );

      // Redirect to the first order's detail page (status: PENDING_QUOTE → QUOTED → TO_PAY).
      if (orderIds.length > 0) {
        router.push(`/orders/${orderIds[0]}`);
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
            <div className="rounded-2xl border border-border bg-surface p-5 md:p-6">
              <h2 className="mb-4 font-heading text-base font-semibold text-foreground">
                Order summary
              </h2>

              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Items subtotal</dt>
                  <dd className="font-medium text-foreground">{formatNGN(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Processing fee (1.5%)</dt>
                  <dd className="font-medium text-foreground">
                    {formatNGN(estimatedProcessingFee)}
                  </dd>
                </div>
                <div className="flex items-start justify-between">
                  <dt className="text-gray-500">
                    Delivery fee
                    <span className="block text-xs text-gray-400">
                      Set by vendor after quotation
                    </span>
                  </dt>
                  <dd className="font-medium text-primary-600">Pending</dd>
                </div>
              </dl>

              <div className="my-4 border-t border-border" />

              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium text-foreground">Due now</span>
                <span className="font-heading text-xl font-bold text-foreground">
                  {formatNGN(totalDueNow)}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Final total (with delivery fee) is confirmed once the vendor
                submits a quotation. You pay on the &ldquo;To Pay&rdquo; step.
              </p>

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={placing}
                className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-secondary-500 text-sm font-semibold text-white transition hover:bg-secondary-600 disabled:cursor-not-allowed disabled:opacity-70"
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
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-primary-50 p-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />
                <div className="text-xs leading-5 text-primary-800">
                  <span className="font-semibold">KwisCrow Buyer Protection.</span>{" "}
                  Your payment stays in escrow until you confirm receipt (or the
                  24-hour dispute window closes).
                </div>
              </div>

              {/* Trust badges row */}
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center gap-1 rounded-lg border border-border bg-background p-2.5 text-center">
                  <Lock className="h-4 w-4 text-primary-600" />
                  <span className="text-[10px] font-semibold text-foreground">SSL Secured</span>
                </div>
                <div className="flex flex-col items-center gap-1 rounded-lg border border-border bg-background p-2.5 text-center">
                  <ShieldCheck className="h-4 w-4 text-success" />
                  <span className="text-[10px] font-semibold text-foreground">Escrow Protected</span>
                </div>
                <div className="flex flex-col items-center gap-1 rounded-lg border border-border bg-background p-2.5 text-center">
                  <RefreshCw className="h-4 w-4 text-warning" />
                  <span className="text-[10px] font-semibold text-foreground">24h Disputes</span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-400">
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
