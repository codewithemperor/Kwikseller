"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CreditCard,
  Download,
  Loader2,
  MapPin,
  PackageCheck,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  Truck,
  Users,
} from "lucide-react";
import { Button } from "@heroui/react";
import { cartApi, checkoutApi, deliveryRatesApi, tokenManager } from "@kwikseller/api-client";
import { kwikToast } from "@kwikseller/utils";
import type { CartValidationIssue, CartVendorGroup, CouponValidationResponse, DeliveryRate } from "@kwikseller/types";
import { AppImage } from "@/components/ui/app-image";
import { useCartStore } from "@/stores";

type CheckoutStep = "cart" | "delivery" | "payment";

const defaultShipping = {
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  localGovernment: "",
  state: "",
  country: "Nigeria",
  deliveryInstructions: "",
};

const NIGERIA_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function unwrapApiData<T>(value: unknown): T {
  if (value && typeof value === "object" && "data" in value) {
    return (value as { data: T }).data;
  }
  return value as T;
}

function extractValidationIssues(error: unknown): CartValidationIssue[] {
  const responseData = (error as { response?: { data?: unknown } })?.response?.data;
  const candidates = [
    responseData,
    responseData && typeof responseData === "object" && "data" in responseData
      ? (responseData as { data?: unknown }).data
      : null,
    responseData && typeof responseData === "object" && "message" in responseData
      ? (responseData as { message?: unknown }).message
      : null,
  ];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === "object" && "errors" in candidate) {
      const errors = (candidate as { errors?: unknown }).errors;
      if (Array.isArray(errors)) return errors as CartValidationIssue[];
    }
  }

  return [];
}

function fulfillmentMeta(item: {
  productType?: string;
  productSource?: string;
  requiresShipping?: boolean;
}) {
  if (item.productSource === "POOL_RESALE") return { label: "Pool Resale", icon: Users, color: "text-emerald-700" };
  if (item.productSource === "GROUP_BUY") return { label: "Group Buy", icon: Users, color: "text-cyan-700" };
  if (item.productType === "DIGITAL" || item.requiresShipping === false) return { label: "Digital Delivery", icon: Download, color: "text-violet-700" };
  return { label: "Vendor Stock", icon: PackageCheck, color: "text-kwik-dark" };
}

function formatDeliveryWindow(rate?: DeliveryRate | null) {
  if (!rate?.estimatedDeliveryStart || !rate?.estimatedDeliveryEnd) return null;
  const formatter = new Intl.DateTimeFormat("en-NG", { month: "short", day: "numeric" });
  return `${formatter.format(new Date(rate.estimatedDeliveryStart))} - ${formatter.format(new Date(rate.estimatedDeliveryEnd))}`;
}

function groupCartItems(items: ReturnType<typeof useCartStore.getState>["items"]) {
  const groups = new Map<
    string,
    {
      storeId: string;
      storeSlug?: string;
      storeName: string;
      items: typeof items;
      subtotal: number;
      requiresShipping: boolean;
      hasDigitalDelivery: boolean;
      hasPoolResale: boolean;
    }
  >();

  for (const item of items) {
    const storeId = item.storeId ?? item.storeSlug ?? item.store ?? "kwikseller-store";
    if (!groups.has(storeId)) {
      groups.set(storeId, {
        storeId,
        storeSlug: item.storeSlug,
        storeName: item.storeName ?? item.store ?? "Kwikseller vendor",
        items: [],
        subtotal: 0,
        requiresShipping: false,
        hasDigitalDelivery: false,
        hasPoolResale: false,
      });
    }

    const group = groups.get(storeId)!;
    group.items.push(item);
    group.subtotal += item.price * item.quantity;
    group.requiresShipping = group.requiresShipping || (item.requiresShipping !== false && item.productType !== "DIGITAL");
    group.hasDigitalDelivery = group.hasDigitalDelivery || item.productType === "DIGITAL" || item.requiresShipping === false;
    group.hasPoolResale = group.hasPoolResale || item.productSource === "POOL_RESALE" || Boolean(item.poolOfferId);
  }

  return [...groups.values()];
}

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  const [shipping, setShipping] = React.useState(defaultShipping);
  const [step, setStep] = React.useState<CheckoutStep>("cart");
  const [isCheckingOut, setIsCheckingOut] = React.useState(false);
  const [isValidating, setIsValidating] = React.useState(false);
  const [validationIssues, setValidationIssues] = React.useState<CartValidationIssue[]>([]);
  const [validationGroups, setValidationGroups] = React.useState<CartVendorGroup[]>([]);
  const [deliveryRate, setDeliveryRate] = React.useState<DeliveryRate | null>(null);
  const [isLoadingDeliveryRate, setIsLoadingDeliveryRate] = React.useState(false);
  const [deliveryRateError, setDeliveryRateError] = React.useState("");
  const [couponCode, setCouponCode] = React.useState("");
  const [appliedCoupon, setAppliedCoupon] = React.useState<CouponValidationResponse | null>(null);
  const [couponError, setCouponError] = React.useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = React.useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const savings = items.reduce(
    (sum, item) => sum + Math.max(0, (item.comparePrice ?? item.price) - item.price) * item.quantity,
    0,
  );
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const cartGroups = React.useMemo(() => groupCartItems(items), [items]);
  const physicalVendorGroups = cartGroups.filter((group) => group.requiresShipping).length;
  const requiresShipping = items.some((item) => item.requiresShipping !== false && item.productType !== "DIGITAL");
  const hasDigital = items.some((item) => item.productType === "DIGITAL" || item.requiresShipping === false);
  const hasPool = items.some((item) => item.productSource === "POOL_RESALE" || item.poolOfferId);
  const deliveryDate = formatDeliveryWindow(deliveryRate);
  const deliveryFee = requiresShipping ? (deliveryRate?.fee ?? 0) * Math.max(1, physicalVendorGroups) : 0;
  const couponDiscount = appliedCoupon?.discount ?? 0;
  const payableTotal = Math.max(0, subtotal + deliveryFee - couponDiscount);
  const hasUnvalidatedCoupon = Boolean(couponCode.trim()) && !appliedCoupon;

  React.useEffect(() => {
    setAppliedCoupon(null);
    setCouponError("");
  }, [subtotal]);

  React.useEffect(() => {
    setDeliveryRate(null);
    setDeliveryRateError("");

    if (!requiresShipping) return;

    const state = shipping.state.trim();
    const localGovernment = shipping.localGovernment.trim();
    if (!state || !localGovernment) return;

    let cancelled = false;
    const load = async () => {
      setIsLoadingDeliveryRate(true);
      try {
        const response = await deliveryRatesApi.lookup({ state, localGovernment });
        if (!cancelled) {
          setDeliveryRate(unwrapApiData<DeliveryRate>(response.data));
          setDeliveryRateError("");
        }
      } catch (error) {
        if (!cancelled) {
          setDeliveryRate(null);
          const message =
            (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            "No active delivery rate for this location yet.";
          setDeliveryRateError(message);
        }
      } finally {
        if (!cancelled) setIsLoadingDeliveryRate(false);
      }
    };

    const timeout = window.setTimeout(load, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [requiresShipping, shipping.state, shipping.localGovernment]);

  const updateShipping = (field: keyof typeof defaultShipping, value: string) => {
    setShipping((current) => ({ ...current, [field]: value }));
  };

  const applyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) return;
    setIsApplyingCoupon(true);
    setCouponError("");
    try {
      const response = await cartApi.applyCoupon(code);
      const coupon = unwrapApiData<CouponValidationResponse>(response.data);
      setAppliedCoupon(coupon);
      setCouponCode(coupon.code);
      kwikToast.success(coupon.message ?? "Coupon applied");
    } catch (error) {
      setAppliedCoupon(null);
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Coupon could not be applied.";
      setCouponError(message);
      kwikToast.error(message);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
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

  const syncLocalCartToApi = async () => {
    await cartApi.clear();
    for (const item of items) {
      if (item.poolOfferId) {
        await cartApi.addPoolOffer(item.poolOfferId, item.quantity);
      } else {
        await cartApi.addItem(item.productId, item.quantity);
      }
    }

    const validationResponse = await cartApi.validate();
    const validation = unwrapApiData<{
      valid: boolean;
      errors: CartValidationIssue[];
      warnings: CartValidationIssue[];
      groups?: CartVendorGroup[];
    }>(validationResponse.data);

    const issues = [...(validation.errors ?? []), ...(validation.warnings ?? [])];
    setValidationIssues(issues);
    setValidationGroups(validation.groups ?? []);

    if (!validation.valid) {
      throw new Error("Cart validation failed");
    }
  };

  const ensureAuthenticated = () => {
    if (tokenManager.isAuthenticated()) return true;
    kwikToast.info("Login to continue checkout.");
    router.push("/login?redirect=/cart");
    return false;
  };

  const validateCartBeforeNextStep = async () => {
    setIsValidating(true);
    setValidationIssues([]);
    setValidationGroups([]);
    try {
      await syncLocalCartToApi();
      return true;
    } catch (error) {
      const issues = extractValidationIssues(error);
      if (issues.length) {
        setValidationIssues(issues);
        kwikToast.error(issues[0]?.message ?? "Cart validation failed");
      } else {
        kwikToast.error("Fix the cart issues before checkout.");
      }
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handlePrimaryAction = async () => {
    if (!items.length) return;
    if (!ensureAuthenticated()) return;

    if (step === "cart") {
      const isValidCart = await validateCartBeforeNextStep();
      if (!isValidCart) return;
      setStep(requiresShipping ? "delivery" : "payment");
      return;
    }

    if (step === "delivery") {
      if (!validateShipping()) {
        kwikToast.error("Add full delivery details before payment.");
        return;
      }
      if (requiresShipping && !deliveryRate) {
        kwikToast.error(deliveryRateError || "Choose a delivery location with an active rate.");
        return;
      }
      setStep("payment");
      return;
    }

    if (hasUnvalidatedCoupon) {
      kwikToast.error("Apply or remove the coupon before payment.");
      return;
    }

    setIsCheckingOut(true);
    setValidationIssues([]);
    try {
      await syncLocalCartToApi();
      const response = await checkoutApi.create({
        idempotencyKey: `marketplace-${Date.now()}`,
        shippingAddress: requiresShipping ? shipping : undefined,
        couponCode: appliedCoupon?.code,
      });
      const checkout = unwrapApiData<{ authorizationUrl?: string; reference?: string }>(response.data);

      if (!checkout.authorizationUrl) {
        throw new Error("Checkout did not return a Paystack authorization URL.");
      }

      clearCart();
      window.location.href = checkout.authorizationUrl;
    } catch (error) {
      const issues = extractValidationIssues(error);
      if (issues.length) {
        setValidationIssues(issues);
        setStep("cart");
        kwikToast.error(issues[0]?.message ?? "Cart validation failed");
      } else {
        kwikToast.error(error instanceof Error ? error.message : "Checkout failed");
      }
    } finally {
      setIsCheckingOut(false);
    }
  };

  const primaryLabel =
    step === "cart"
      ? requiresShipping
        ? "Continue to delivery"
        : "Continue to payment"
      : step === "delivery"
        ? "Continue to payment"
        : "Pay with Paystack";

  const isPrimaryBusy = isCheckingOut || isValidating;
  const isPrimaryDisabled =
    !items.length ||
    isPrimaryBusy ||
    (step === "payment" &&
      ((requiresShipping && (!deliveryRate || isLoadingDeliveryRate)) || hasUnvalidatedCoupon));

  return (
    <div className="min-h-screen bg-white dark:bg-[#07111f]">
      <div className="border-b border-neutral-200 bg-white dark:border-white/10 dark:bg-[#07111f]">
        <div className="container mx-auto flex items-center gap-4 px-4 py-4">
          <Link href="/">
            <Button isIconOnly variant="ghost" size="sm" aria-label="Go back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-kwik-dark dark:text-white">Cart and checkout</h1>
            <p className="text-sm text-kwik-muted dark:text-white/60">
              Review items, set delivery details, then pay securely with Paystack.
            </p>
          </div>
        </div>
      </div>

      <main className="container mx-auto grid gap-8 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-8">
          <section className="grid gap-3 sm:grid-cols-3">
            {[
              { id: "cart", icon: ShoppingCart, title: "Cart", text: `${totalItems} item${totalItems === 1 ? "" : "s"}` },
              { id: "delivery", icon: Truck, title: "Delivery", text: requiresShipping ? "Address required" : "Not required" },
              { id: "payment", icon: CreditCard, title: "Payment", text: "Paystack checkout" },
            ].map((item) => {
              const isActive = item.id === step;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.id === "cart") setStep("cart");
                    if (item.id === "delivery" && requiresShipping) setStep("delivery");
                    if (item.id === "payment" && (!requiresShipping || (validateShipping() && deliveryRate))) setStep("payment");
                  }}
                  className={`border-b pb-4 text-left transition ${
                    isActive
                      ? "border-kwik-orange"
                      : "border-neutral-200 dark:border-white/10"
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? "text-kwik-orange" : "text-kwik-muted"}`} />
                  <p className="mt-3 text-sm font-semibold text-kwik-dark dark:text-white">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-kwik-muted dark:text-white/60">{item.text}</p>
                </button>
              );
            })}
          </section>

          {validationIssues.length > 0 && (
            <div className="border border-red-200 bg-red-50 p-4 dark:border-red-400/30 dark:bg-red-950/30">
              <div className="flex gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-700 dark:text-red-100" />
                <div>
                  <p className="text-sm font-semibold text-red-800 dark:text-red-100">Cart needs attention</p>
                  <ul className="mt-2 space-y-1 text-sm leading-6 text-red-700 dark:text-red-100/75">
                    {validationIssues.map((issue, index) => (
                      <li key={`${issue.code}-${issue.cartItemId ?? index}`}>{issue.message}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {validationGroups.length > 1 && step === "cart" && (
            <div className="border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900 dark:border-emerald-300/20 dark:bg-emerald-950/30 dark:text-emerald-100">
              Server validation grouped this cart into {validationGroups.length} vendor orders. You will still pay once with Paystack.
            </div>
          )}

          {!items.length ? (
            <section className="border border-dashed border-neutral-300 p-12 text-center dark:border-white/15">
              <ShoppingCart className="mx-auto h-12 w-12 text-kwik-muted" />
              <h2 className="mt-4 text-xl font-semibold text-kwik-dark dark:text-white">Your cart is empty</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-kwik-muted dark:text-white/60">
                Browse vendor stock, Pool resale, or digital delivery products and build a checkout-ready cart.
              </p>
              <Link href="/" className="mt-6 inline-flex h-11 items-center gap-2 rounded-md bg-kwik-dark px-5 text-sm font-semibold text-white">
                Browse marketplace
                <ArrowRight className="h-4 w-4" />
              </Link>
            </section>
          ) : step === "cart" ? (
            <section className="space-y-4">
              {cartGroups.map((group) => (
                <div key={group.storeId} className="border border-neutral-200 bg-white dark:border-white/10 dark:bg-white/5">
                  <div className="flex flex-col gap-2 border-b border-neutral-200 p-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="font-heading text-base font-semibold text-kwik-dark dark:text-white">{group.storeName}</h2>
                      <p className="mt-1 text-xs text-kwik-muted dark:text-white/55">
                        {group.items.length} product{group.items.length === 1 ? "" : "s"} • {group.requiresShipping ? "Delivery required" : "Digital-only"}{group.hasPoolResale ? " • Pool resale" : ""}
                      </p>
                    </div>
                    <div className="text-sm font-bold text-kwik-dark dark:text-white">{formatCurrency(group.subtotal)}</div>
                  </div>

                  <div className="divide-y divide-neutral-200 dark:divide-white/10">
                    {group.items.map((item) => {
                      const meta = fulfillmentMeta(item);
                      const MetaIcon = meta.icon;

                      return (
                        <article key={`${item.productId}-${item.poolOfferId ?? "stock"}`} className="p-4">
                          <div className="flex gap-4">
                            <div className="h-24 w-24 shrink-0 overflow-hidden bg-neutral-100">
                              <AppImage src={item.image} alt={item.name} className="h-full w-full object-cover" fallbackVariant="product" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <span className={`inline-flex items-center gap-1 bg-[#f3f5f2] px-2 py-1 text-[11px] font-semibold ${meta.color}`}>
                                    <MetaIcon className="h-3 w-3" />
                                    {meta.label}
                                  </span>
                                  <h3 className="mt-2 line-clamp-2 text-sm font-semibold text-kwik-dark dark:text-white">{item.name}</h3>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeItem(item.productId)}
                                  className="flex h-8 w-8 items-center justify-center rounded-md text-kwik-muted hover:bg-red-50 hover:text-red-600"
                                  aria-label="Remove item"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>

                              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <p className="text-base font-bold text-kwik-dark dark:text-white">{formatCurrency(item.price * item.quantity)}</p>
                                  {item.comparePrice && (
                                    <p className="text-xs text-kwik-muted line-through">{formatCurrency(item.comparePrice * item.quantity)}</p>
                                  )}
                                </div>
                                <div className="flex items-center overflow-hidden rounded-md border border-neutral-200 dark:border-white/10">
                                  <button
                                    type="button"
                                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                    className="h-9 w-9 text-sm font-semibold hover:bg-neutral-50 dark:text-white dark:hover:bg-white/10"
                                  >
                                    -
                                  </button>
                                  <span className="min-w-10 border-x border-neutral-200 px-3 text-center text-sm font-semibold dark:border-white/10 dark:text-white">{item.quantity}</span>
                                  <button
                                    type="button"
                                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                    className="h-9 w-9 text-sm font-semibold hover:bg-neutral-50 dark:text-white dark:hover:bg-white/10"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  clearCart();
                  setStep("cart");
                  kwikToast.success("Cart cleared");
                }}
                className="inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Clear cart
              </button>
            </section>
          ) : step === "delivery" && requiresShipping ? (
            <section className="border border-neutral-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-kwik-orange" />
                <h2 className="text-base font-semibold text-kwik-dark dark:text-white">Delivery details</h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-kwik-muted dark:text-white/60">
                Admin uses this address to assign manual dispatch while the Rider app is paused.
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {[
                  ["fullName", "Full name"],
                  ["phone", "Phone number"],
                  ["city", "City"],
                  ["country", "Country"],
                ].map(([field, label]) => (
                  <label key={field} className="block">
                    <span className="text-xs font-semibold text-kwik-muted dark:text-white/60">{label}</span>
                    <input
                      value={shipping[field as keyof typeof shipping]}
                      onChange={(event) => updateShipping(field as keyof typeof shipping, event.target.value)}
                      className="mt-1 h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-kwik-dark outline-none transition focus:border-kwik-dark dark:border-white/10 dark:bg-[#07111f] dark:text-white"
                    />
                  </label>
                ))}
                <label className="block">
                  <span className="text-xs font-semibold text-kwik-muted dark:text-white/60">State</span>
                  <select
                    value={shipping.state}
                    onChange={(event) => updateShipping("state", event.target.value)}
                    className="mt-1 h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-kwik-dark outline-none transition focus:border-kwik-dark dark:border-white/10 dark:bg-[#07111f] dark:text-white"
                  >
                    <option value="">Select state</option>
                    {NIGERIA_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-kwik-muted dark:text-white/60">Local government</span>
                  <input
                    value={shipping.localGovernment}
                    onChange={(event) => updateShipping("localGovernment", event.target.value)}
                    placeholder="e.g. Ikeja"
                    className="mt-1 h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-kwik-dark outline-none transition focus:border-kwik-dark dark:border-white/10 dark:bg-[#07111f] dark:text-white"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-semibold text-kwik-muted dark:text-white/60">Street address</span>
                  <input
                    value={shipping.addressLine1}
                    onChange={(event) => updateShipping("addressLine1", event.target.value)}
                    className="mt-1 h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-kwik-dark outline-none transition focus:border-kwik-dark dark:border-white/10 dark:bg-[#07111f] dark:text-white"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-semibold text-kwik-muted dark:text-white/60">Apartment, landmark, or nearest bus stop</span>
                  <input
                    value={shipping.addressLine2}
                    onChange={(event) => updateShipping("addressLine2", event.target.value)}
                    className="mt-1 h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-kwik-dark outline-none transition focus:border-kwik-dark dark:border-white/10 dark:bg-[#07111f] dark:text-white"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-semibold text-kwik-muted dark:text-white/60">Delivery instructions</span>
                  <textarea
                    value={shipping.deliveryInstructions}
                    onChange={(event) => updateShipping("deliveryInstructions", event.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-kwik-dark outline-none transition focus:border-kwik-dark dark:border-white/10 dark:bg-[#07111f] dark:text-white"
                  />
                </label>
              </div>

              <div className="mt-5 border border-neutral-200 p-4 dark:border-white/10">
                <div className="flex items-start gap-3">
                  {isLoadingDeliveryRate ? (
                    <Loader2 className="mt-0.5 h-5 w-5 animate-spin text-kwik-orange" />
                  ) : (
                    <Truck className="mt-0.5 h-5 w-5 text-kwik-orange" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-kwik-dark dark:text-white">Delivery pricing</p>
                    {!shipping.state || !shipping.localGovernment ? (
                      <p className="mt-1 text-sm leading-6 text-kwik-muted dark:text-white/60">
                        Select state and local government to calculate delivery fee and estimate for each physical vendor group.
                      </p>
                    ) : deliveryRate ? (
                      <p className="mt-1 text-sm leading-6 text-kwik-muted dark:text-white/60">
                        {formatCurrency(deliveryRate.fee)} per physical vendor group x {physicalVendorGroups}. Total delivery {formatCurrency(deliveryFee)}. Estimated {deliveryDate}. Admin/manual dispatch assignment after payment.
                      </p>
                    ) : (
                      <p className="mt-1 text-sm leading-6 text-red-600 dark:text-red-200">
                        {deliveryRateError || "Checking delivery availability..."}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <section className="border border-neutral-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-kwik-orange" />
                <h2 className="text-base font-semibold text-kwik-dark dark:text-white">Payment review</h2>
              </div>
              <div className="mt-5 space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="border border-neutral-200 p-4 dark:border-white/10">
                    <p className="text-xs font-semibold text-kwik-muted dark:text-white/60">Items</p>
                    <p className="mt-2 text-lg font-bold text-kwik-dark dark:text-white">{totalItems}</p>
                  </div>
                  <div className="border border-neutral-200 p-4 dark:border-white/10">
                    <p className="text-xs font-semibold text-kwik-muted dark:text-white/60">Delivery</p>
                    <p className="mt-2 text-lg font-bold text-kwik-dark dark:text-white">
                      {requiresShipping ? formatCurrency(deliveryFee) : "Digital"}
                    </p>
                  </div>
                  <div className="border border-neutral-200 p-4 dark:border-white/10">
                    <p className="text-xs font-semibold text-kwik-muted dark:text-white/60">Payable</p>
                    <p className="mt-2 text-lg font-bold text-kwik-dark dark:text-white">{formatCurrency(payableTotal)}</p>
                  </div>
                </div>
                {requiresShipping ? (
                  <div className="border border-neutral-200 p-4 text-sm leading-6 text-kwik-muted dark:border-white/10 dark:text-white/60">
                    <p className="font-semibold text-kwik-dark dark:text-white">Dispatch address</p>
                    <p className="mt-1">
                      {shipping.addressLine1}, {shipping.city}, {shipping.localGovernment}, {shipping.state}
                    </p>
                    {deliveryDate && <p>Estimated delivery: {deliveryDate}</p>}
                    <p>Admin will manually assign dispatch and tracking after payment.</p>
                  </div>
                ) : (
                  <div className="border border-violet-200 bg-violet-50 p-4 text-sm leading-6 text-violet-900 dark:border-violet-300/20 dark:bg-violet-950/30 dark:text-violet-100">
                    Digital-only cart. No delivery address or delivery fee is required.
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4 self-start lg:sticky lg:top-28">
          <section className="border border-neutral-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
            <h2 className="text-base font-semibold text-kwik-dark dark:text-white">Order summary</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-kwik-muted dark:text-white/60">Subtotal</span>
                <span className="font-semibold text-kwik-dark dark:text-white">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-kwik-muted dark:text-white/60">Savings</span>
                <span className="font-semibold text-emerald-700">-{formatCurrency(savings)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-kwik-muted dark:text-white/60">Delivery</span>
                <span className="font-semibold text-kwik-dark dark:text-white">
                  {requiresShipping ? (deliveryRate ? formatCurrency(deliveryFee) : "Select location") : "Not required"}
                </span>
              </div>
              {requiresShipping && deliveryDate && (
                <div className="border-y border-neutral-200 py-3 dark:border-white/10">
                  <div className="flex items-start gap-2">
                    <CalendarDays className="mt-0.5 h-4 w-4 text-kwik-orange" />
                    <div>
                      <p className="font-semibold text-kwik-dark dark:text-white">Estimated delivery</p>
                      <p className="text-xs leading-5 text-kwik-muted dark:text-white/60">{deliveryDate}</p>
                      <p className="mt-1 text-xs leading-5 text-kwik-muted dark:text-white/60">Manual dispatch assignment by admin.</p>
                    </div>
                  </div>
                </div>
              )}
              {cartGroups.length > 1 && (
                <div className="border-b border-neutral-200 pb-3 dark:border-white/10">
                  <p className="text-xs font-semibold uppercase text-kwik-muted dark:text-white/60">Vendor groups</p>
                  <div className="mt-2 space-y-2">
                    {cartGroups.map((group) => (
                      <div key={group.storeId} className="flex items-center justify-between gap-3 text-xs">
                        <span className="min-w-0 truncate text-kwik-muted dark:text-white/60">
                          {group.storeName}
                          {group.requiresShipping ? " • delivery" : " • digital"}
                        </span>
                        <span className="shrink-0 font-semibold text-kwik-dark dark:text-white">
                          {formatCurrency(group.subtotal + (group.requiresShipping && deliveryRate ? deliveryRate.fee : 0))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="border-y border-neutral-200 py-3 dark:border-white/10">
                <label className="text-xs font-semibold text-kwik-muted dark:text-white/60">Coupon code</label>
                <div className="mt-2 flex gap-2">
                  <input
                    value={couponCode}
                    onChange={(event) => {
                      setCouponCode(event.target.value.toUpperCase());
                      if (appliedCoupon) setAppliedCoupon(null);
                      setCouponError("");
                    }}
                    placeholder="KWIKSAVE"
                    className="h-10 min-w-0 flex-1 rounded-md border border-neutral-200 bg-white px-3 text-sm font-semibold uppercase text-kwik-dark outline-none transition focus:border-kwik-dark dark:border-white/10 dark:bg-[#07111f] dark:text-white"
                  />
                  {appliedCoupon ? (
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="h-10 rounded-md border border-neutral-200 px-3 text-xs font-semibold text-kwik-dark dark:border-white/10 dark:text-white"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={applyCoupon}
                      disabled={!couponCode.trim() || isApplyingCoupon}
                      className="h-10 rounded-md bg-kwik-dark px-3 text-xs font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-[#07111f]"
                    >
                      {isApplyingCoupon ? "..." : "Apply"}
                    </button>
                  )}
                </div>
                {appliedCoupon && (
                  <p className="mt-2 text-xs font-semibold text-emerald-700">
                    {appliedCoupon.code} applied: -{formatCurrency(couponDiscount)}
                  </p>
                )}
                {couponError && <p className="mt-2 text-xs font-semibold text-red-600">{couponError}</p>}
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between">
                  <span className="text-kwik-muted dark:text-white/60">Coupon discount</span>
                  <span className="font-semibold text-emerald-700">-{formatCurrency(couponDiscount)}</span>
                </div>
              )}
              <div className="border-t border-neutral-200 pt-3 dark:border-white/10">
                <div className="flex justify-between">
                  <span className="font-semibold text-kwik-dark dark:text-white">Total</span>
                  <span className="text-xl font-bold text-kwik-dark dark:text-white">{formatCurrency(payableTotal)}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={isPrimaryDisabled}
              onClick={handlePrimaryAction}
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-kwik-dark text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-[#07111f]"
            >
              {isPrimaryBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : step === "payment" ? <ShieldCheck className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
              {isPrimaryBusy ? (isCheckingOut ? "Starting Paystack" : "Validating cart") : primaryLabel}
            </button>

            {step === "payment" && (
              <p className="mt-3 text-center text-xs leading-5 text-kwik-muted dark:text-white/60">
                Payment creates the order, reserves inventory, and sends admin the delivery details for dispatch assignment.
              </p>
            )}
          </section>

          <section className="border border-neutral-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
            <h3 className="text-sm font-semibold text-kwik-dark dark:text-white">Checkout checks</h3>
            <div className="mt-4 space-y-3">
              {[
                { active: true, icon: ShieldCheck, title: "Server validation", text: "Inventory and fulfillment are checked before payment." },
                { active: hasPool, icon: Users, title: "Pool-aware", text: hasPool ? "Pool resale item in cart." : "No Pool resale item." },
                { active: hasDigital, icon: Download, title: "Digital-ready", text: hasDigital ? "Digital delivery skips shipping." : "Physical delivery rules apply." },
              ].map((item) => (
                <div key={item.title} className="flex gap-3">
                  <item.icon className={`mt-0.5 h-4 w-4 ${item.active ? "text-kwik-orange" : "text-kwik-muted"}`} />
                  <div>
                    <p className="text-sm font-semibold text-kwik-dark dark:text-white">{item.title}</p>
                    <p className="text-xs leading-5 text-kwik-muted dark:text-white/60">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}
