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
import { AppButton, FieldAutocomplete, FieldInput, FieldTextarea } from "@kwikseller/ui";
import { cartApi, checkoutApi, deliveryRatesApi, tokenManager, usersApi } from "@kwikseller/api-client";
import { getLgasForState, kwikToast, NIGERIA_STATES, useAuth } from "@kwikseller/utils";
import type { CartValidationIssue, CartVendorGroup, CouponValidationResponse, DeliveryRate } from "@kwikseller/types";
import { EscrowSafetyDialog } from "@/components/checkout/escrow-safety-dialog";
import { AppImage } from "@/components/ui/app-image";
import { useCartStore } from "@/stores";

type CheckoutStep = "cart" | "delivery" | "payment";

type SavedAddress = {
  id: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  stateId?: string;
  localGovernment?: string;
  lgaId?: string;
  country: string;
  postalCode?: string;
  isDefault: boolean;
  type: "SHIPPING" | "BILLING" | "BOTH";
};

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

function unwrapNestedApiData<T>(value: unknown): T {
  const payload = value as { data?: unknown };
  const nested = payload?.data as { data?: unknown } | undefined;
  return (nested?.data ?? payload?.data ?? value) as T;
}

function splitAddressLabel(line2?: string) {
  if (!line2) return { label: "Saved address", landmark: "" };
  const [label, ...rest] = line2.split(" - ");
  return { label: label || "Saved address", landmark: rest.join(" - ") };
}

function splitStateAndLocalGovernment(value?: string) {
  const [state = "", ...rest] = (value ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return { state, localGovernment: rest.join(", ") };
}

function formatAddressParts(parts: Array<string | undefined>) {
  return parts.map((part) => part?.trim()).filter(Boolean).join(", ");
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
  if (item.productSource === "POOL_RESALE") return { label: "Partner Fulfilled", icon: Users, color: "text-emerald-700" };
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
  const { user, isAuthenticated } = useAuth();
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
  const [isEscrowDialogOpen, setIsEscrowDialogOpen] = React.useState(false);
  const [savedAddresses, setSavedAddresses] = React.useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = React.useState("");
  const [isLoadingAddresses, setIsLoadingAddresses] = React.useState(false);
  const [saveAddressForNextShopping, setSaveAddressForNextShopping] = React.useState(false);
  const hasAppliedDefaultAddressRef = React.useRef(false);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const savings = items.reduce(
    (sum, item) => sum + Math.max(0, (item.comparePrice ?? item.price) - item.price) * item.quantity,
    0,
  );
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const productCount = items.length;
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
  const selectedSavedAddress = React.useMemo(
    () => savedAddresses.find((address) => address.id === selectedAddressId),
    [savedAddresses, selectedAddressId],
  );

  const applySavedAddress = React.useCallback((address: SavedAddress) => {
    const meta = splitAddressLabel(address.line2);
    const location = splitStateAndLocalGovernment(address.state);

    setShipping((current) => ({
      ...current,
      addressLine1: address.line1 || current.addressLine1,
      addressLine2: meta.landmark || current.addressLine2,
      city: address.city || current.city,
      state: location.state || address.state || current.state,
      localGovernment: address.localGovernment || location.localGovernment || current.localGovernment,
      country: address.country || current.country,
    }));
  }, []);

  React.useEffect(() => {
    if (!isAuthenticated || !user) return;

    const fullName = [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(" ");
    const fallbackName = user.email?.split("@")[0] ?? "";
    const phone = user.phone ?? "";

    setShipping((current) => ({
      ...current,
      fullName: current.fullName || fullName || fallbackName,
      phone: current.phone || phone,
    }));
  }, [isAuthenticated, user]);

  React.useEffect(() => {
    if (!isAuthenticated) {
      setSavedAddresses([]);
      setSelectedAddressId("");
      setIsLoadingAddresses(false);
      return;
    }

    let cancelled = false;
    const loadAddresses = async () => {
      setIsLoadingAddresses(true);
      try {
        const response = await usersApi.getAddresses();
        const payload = unwrapNestedApiData<SavedAddress[]>(response);
        const addresses = (Array.isArray(payload) ? payload : []).filter((address) =>
          ["SHIPPING", "BOTH"].includes(address.type),
        );

        if (cancelled) return;

        setSavedAddresses(addresses);

        const defaultAddress = addresses.find((address) => address.isDefault);
        if (defaultAddress && !hasAppliedDefaultAddressRef.current) {
          setSelectedAddressId(defaultAddress.id);
          const meta = splitAddressLabel(defaultAddress.line2);
          const location = splitStateAndLocalGovernment(defaultAddress.state);
          setShipping((current) => {
            if (current.addressLine1 || current.city || current.state) return current;
            hasAppliedDefaultAddressRef.current = true;
            return {
              ...current,
              addressLine1: defaultAddress.line1 || current.addressLine1,
              addressLine2: meta.landmark || current.addressLine2,
              city: defaultAddress.city || current.city,
              state: location.state || defaultAddress.state || current.state,
              localGovernment: defaultAddress.localGovernment || location.localGovernment || current.localGovernment,
              country: defaultAddress.country || current.country,
            };
          });
        }
      } catch {
        if (!cancelled) setSavedAddresses([]);
      } finally {
        if (!cancelled) setIsLoadingAddresses(false);
      }
    };

    loadAddresses();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

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
    setShipping((current) => ({
      ...current,
      [field]: value,
      ...(field === "state" ? { localGovernment: "" } : {}),
    }));
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

  const saveCheckoutAddressIfNeeded = async () => {
    if (!requiresShipping || !saveAddressForNextShopping || !isAuthenticated || selectedAddressId) return;

    try {
      await usersApi.addAddress({
        line1: shipping.addressLine1,
        line2: ["Checkout address", shipping.addressLine2.trim()].filter(Boolean).join(" - "),
        city: shipping.city,
        state: shipping.state,
        localGovernment: shipping.localGovernment || undefined,
        country: shipping.country,
        type: "SHIPPING",
        isDefault: savedAddresses.length === 0,
      });
      kwikToast.success("Delivery address saved for next shopping");
    } catch {
      kwikToast.error("Could not save delivery address, but checkout can continue.");
    }
  };

  const processCheckout = async () => {
    setIsCheckingOut(true);
    setValidationIssues([]);
    try {
      await syncLocalCartToApi();
      await saveCheckoutAddressIfNeeded();
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
      setIsEscrowDialogOpen(false);
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

    setIsEscrowDialogOpen(true);
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

  const handleStepClick = (nextStep: CheckoutStep) => {
    if (nextStep === "cart") {
      setStep("cart");
      return;
    }

    if (!ensureAuthenticated()) return;

    if (nextStep === "delivery") {
      if (requiresShipping) setStep("delivery");
      return;
    }

    if (!requiresShipping || (validateShipping() && deliveryRate)) {
      setStep("payment");
    } else {
      kwikToast.error("Complete delivery details before payment.");
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#07111f]">
      <div className="border-b border-neutral-200 bg-white dark:border-white/10 dark:bg-[#07111f]">
        <div className="container mx-auto flex items-center gap-3 px-4 py-3">
          <Link href="/">
            <Button isIconOnly variant="ghost" size="sm" aria-label="Go back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-kwik-dark dark:text-white">Checkout</h1>
          </div>
        </div>
      </div>

      <main className="container mx-auto grid w-full max-w-full grid-cols-1 gap-6 overflow-hidden px-4 pb-28 pt-4 md:pb-8 lg:grid-cols-[minmax(0,1fr)_390px]">
        <div className="min-w-0 max-w-full space-y-5">
          <section className="flex min-w-0 max-w-full items-center overflow-hidden border border-neutral-200 bg-white p-1.5 shadow-sm dark:border-white/10 dark:bg-white/5">
            {[
              {
                id: "cart",
                icon: ShoppingCart,
                title: "Cart",
                text: `${productCount} product${productCount === 1 ? "" : "s"}${totalItems !== productCount ? `, ${totalItems} qty` : ""}`,
              },
              { id: "delivery", icon: Truck, title: "Delivery", text: requiresShipping ? "Address required" : "Not required" },
              { id: "payment", icon: CreditCard, title: "Payment", text: "Paystack" },
            ].map((item, index) => {
              const isActive = item.id === step;
              const isDone =
                (item.id === "cart" && step !== "cart") ||
                (item.id === "delivery" && step === "payment");
              return (
                <React.Fragment key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleStepClick(item.id as CheckoutStep)}
                    className={`min-w-0 flex-1 px-1.5 py-2 text-left transition ${
                      isActive
                        ? "bg-kwik-orange text-white shadow-sm"
                        : isDone
                          ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100"
                          : "text-kwik-dark hover:bg-neutral-50 dark:text-white dark:hover:bg-white/10"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center border text-[11px] font-bold ${
                          isActive
                            ? "border-white/35 bg-white/20 text-white"
                            : isDone
                              ? "border-emerald-200 bg-white text-emerald-700 dark:border-emerald-300/20 dark:bg-white/10 dark:text-emerald-100"
                              : "border-neutral-200 bg-white text-kwik-muted dark:border-white/10 dark:bg-white/5"
                        }`}
                      >
                        <item.icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{item.title}</span>
                        <span className={`block truncate text-[11px] ${isActive ? "text-white/80" : "text-kwik-muted dark:text-white/55"}`}>
                          {item.text}
                        </span>
                      </span>
                    </div>
                  </button>
                  {index < 2 && <div className="mx-0.5 h-px w-2 shrink-0 bg-neutral-200 dark:bg-white/10" />}
                </React.Fragment>
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
                Browse vendor stock, partner-fulfilled, or digital delivery products and build a checkout-ready cart.
              </p>
              <Link href="/" className="mt-6 inline-flex h-11 items-center gap-2 rounded-md bg-kwik-blue px-5 text-sm font-semibold text-white">
                Browse marketplace
                <ArrowRight className="h-4 w-4" />
              </Link>
            </section>
          ) : step === "cart" ? (
            <section className="min-w-0 max-w-full space-y-4">
              {cartGroups.map((group) => (
                <div key={group.storeId} className="flex max-h-[340px] min-w-0 max-w-full flex-col overflow-hidden border border-neutral-200 bg-white dark:border-white/10 dark:bg-white/5">
                  <div className="flex min-w-0 shrink-0 items-center justify-between gap-3 border-b border-neutral-200 p-3 dark:border-white/10">
                    <div className="min-w-0">
                      <h2 className="truncate font-heading text-sm font-semibold text-kwik-dark dark:text-white">{group.storeName}</h2>
                      <p className="mt-0.5 truncate text-[11px] text-kwik-muted dark:text-white/55">
                        {group.items.length} product{group.items.length === 1 ? "" : "s"} • {group.requiresShipping ? "Delivery required" : "Digital-only"}{group.hasPoolResale ? " • Partner fulfilled" : ""}
                      </p>
                    </div>
                    <div className="shrink-0 text-sm font-bold text-kwik-dark dark:text-white">{formatCurrency(group.subtotal)}</div>
                  </div>

                  <div className="min-h-0 flex-1 divide-y divide-neutral-200 overflow-y-auto dark:divide-white/10">
                    {group.items.map((item) => {
                      const meta = fulfillmentMeta(item);
                      const MetaIcon = meta.icon;

                      return (
                        <article key={`${item.productId}-${item.poolOfferId ?? "stock"}`} className="min-w-0 p-2.5">
                          <div className="flex min-w-0 gap-2.5">
                            <div className="h-16 w-16 shrink-0 overflow-hidden bg-neutral-100 sm:h-20 sm:w-20">
                              <AppImage src={item.image} alt={item.name} className="h-full w-full object-cover" fallbackVariant="product" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex min-w-0 items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <span className={`inline-flex items-center gap-1 bg-[#f3f5f2] px-1.5 py-0.5 text-[10px] font-semibold ${meta.color}`}>
                                    <MetaIcon className="h-3 w-3" />
                                    {meta.label}
                                  </span>
                                  <h3 className="mt-1 line-clamp-1 text-sm font-semibold text-kwik-dark dark:text-white">{item.name}</h3>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeItem(item.productId)}
                                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-kwik-muted hover:bg-red-50 hover:text-red-600"
                                  aria-label="Remove item"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>

                              <div className="mt-2 flex min-w-0 items-end justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-kwik-dark dark:text-white">{formatCurrency(item.price * item.quantity)}</p>
                                  {item.comparePrice && (
                                    <p className="text-[11px] text-kwik-muted line-through">{formatCurrency(item.comparePrice * item.quantity)}</p>
                                  )}
                                </div>
                                <div className="flex shrink-0 items-center overflow-hidden rounded-md border border-neutral-200 dark:border-white/10">
                                  <button
                                    type="button"
                                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                    className="h-8 w-8 text-sm font-semibold hover:bg-neutral-50 dark:text-white dark:hover:bg-white/10"
                                  >
                                    -
                                  </button>
                                  <span className="min-w-8 border-x border-neutral-200 px-2 text-center text-sm font-semibold dark:border-white/10 dark:text-white">{item.quantity}</span>
                                  <button
                                    type="button"
                                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                    className="h-8 w-8 text-sm font-semibold hover:bg-neutral-50 dark:text-white dark:hover:bg-white/10"
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
                {(isLoadingAddresses || savedAddresses.length > 0) && (
                  <label className="block sm:col-span-2">
                    <span className="text-xs font-semibold text-muted dark:text-white/60">
                      Saved delivery address
                    </span>
                    <select
                      value={selectedAddressId}
                      onChange={(event) => {
                        const value = event.target.value;
                        setSelectedAddressId(value);
                        setSaveAddressForNextShopping(false);

                        if (!value) {
                          setShipping((current) => ({
                            ...current,
                            addressLine1: "",
                            addressLine2: "",
                            city: "",
                            localGovernment: "",
                            state: "",
                            country: current.country || "Nigeria",
                          }));
                          return;
                        }

                        const address = savedAddresses.find((item) => item.id === value);
                        if (address) applySavedAddress(address);
                      }}
                      disabled={isLoadingAddresses}
                      className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-border focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    >
                      <option value="">
                        {isLoadingAddresses ? "Loading saved addresses..." : "Enter a new address"}
                      </option>
                      {savedAddresses.map((address) => {
                        const meta = splitAddressLabel(address.line2);
                        return (
                          <option key={address.id} value={address.id}>
                            {meta.label} - {address.line1}, {address.city}
                          </option>
                        );
                      })}
                    </select>
                  </label>
                )}
                {[
                  ["fullName", "Full name"],
                  ["phone", "Phone number"],
                ].map(([field, label]) => (
                  <FieldInput
                    key={field}
                    label={label}
                    value={shipping[field as keyof typeof shipping]}
                    onChange={(event) => updateShipping(field as keyof typeof shipping, event.target.value)}
                  />
                ))}
                {selectedSavedAddress ? (
                  <div className="rounded-xl border border-kwik-orange/20 bg-kwik-orange/5 p-4 text-sm leading-6 text-kwik-muted dark:border-kwik-orange/30 dark:bg-kwik-orange/10 dark:text-white/70 sm:col-span-2">
                    <p className="font-semibold text-kwik-dark dark:text-white">
                      {splitAddressLabel(selectedSavedAddress.line2).label}
                    </p>
                    <p className="mt-1">
                      {formatAddressParts([
                        shipping.addressLine1,
                        shipping.addressLine2,
                        shipping.city,
                        shipping.localGovernment,
                        shipping.state,
                        shipping.country,
                      ])}
                    </p>
                  </div>
                ) : (
                  <>
                    <FieldInput
                      label="City"
                      value={shipping.city}
                      onChange={(event) => updateShipping("city", event.target.value)}
                    />
                    <FieldInput
                      label="Country"
                      value={shipping.country}
                      onChange={(event) => updateShipping("country", event.target.value)}
                    />
                    <FieldAutocomplete
                      label="State"
                      value={shipping.state}
                      options={NIGERIA_STATES.map((state) => ({ value: state, label: state }))}
                      onValueChange={(nextValue) => updateShipping("state", nextValue)}
                      placeholder="Type or select state"
                    />
                    <FieldAutocomplete
                      label="Local government"
                      value={shipping.localGovernment}
                      options={getLgasForState(shipping.state).map((lga) => ({ value: lga, label: lga }))}
                      onValueChange={(nextValue) => updateShipping("localGovernment", nextValue)}
                      placeholder="Type or select local government"
                    />
                    <FieldInput
                      wrapperClassName="sm:col-span-2"
                      label="Street address"
                      value={shipping.addressLine1}
                      onChange={(event) => updateShipping("addressLine1", event.target.value)}
                    />
                    <FieldInput
                      wrapperClassName="sm:col-span-2"
                      label="Apartment, landmark, or nearest bus stop"
                      value={shipping.addressLine2}
                      onChange={(event) => updateShipping("addressLine2", event.target.value)}
                    />
                  </>
                )}
                <FieldTextarea
                  wrapperClassName="sm:col-span-2"
                  label="Delivery instructions"
                  value={shipping.deliveryInstructions}
                  onChange={(event) => updateShipping("deliveryInstructions", event.target.value)}
                  rows={3}
                />
                {!selectedSavedAddress && (
                  <label className="flex items-start gap-3 rounded-xl border border-neutral-200 p-3 text-sm text-kwik-muted dark:border-white/10 dark:text-white/60 sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={saveAddressForNextShopping}
                      onChange={(event) => setSaveAddressForNextShopping(event.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-neutral-300 text-kwik-orange focus:ring-kwik-orange"
                    />
                    <span>
                      <span className="block font-semibold text-kwik-dark dark:text-white">
                        Save this address for next shopping
                      </span>
                      <span className="block text-xs">
                        We will add it to your delivery addresses after checkout starts.
                      </span>
                    </span>
                  </label>
                )}
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
                      <p className="mt-1 text-sm leading-6 text-red-600 dark:text-red-200">
                        {selectedSavedAddress
                          ? "This saved address is missing state or local government. Choose Enter a new address or update the saved address."
                          : "Select state and local government to calculate delivery fee and estimate for each physical vendor group."}
                      </p>
                    ) : deliveryRate ? (
                      <p className="mt-1 text-sm leading-6 text-kwik-muted dark:text-white/60">
                        {shipping.localGovernment}, {shipping.state}: {formatCurrency(deliveryRate.fee)} per physical vendor group x {physicalVendorGroups}. Total delivery {formatCurrency(deliveryFee)}. Estimated {deliveryDate}. Admin/manual dispatch assignment after payment.
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

        <aside className="min-w-0 max-w-full space-y-4 self-start lg:sticky lg:top-6">
          {step === "cart" ? (
            <section className="min-w-0 max-w-full overflow-hidden border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
              <AppButton
                type="button"
                disabled={isPrimaryDisabled}
                onClick={handlePrimaryAction}
                fullWidth
                size="lg"
                isLoading={isPrimaryBusy}
                loadingLabel="Validating cart"
              >
                {!isPrimaryBusy && <ArrowRight className="h-4 w-4" />}
                {primaryLabel}
              </AppButton>
            </section>
          ) : (
            <>
          <section className="min-w-0 max-w-full overflow-hidden border border-neutral-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
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
                  <FieldInput
                    value={couponCode}
                    onChange={(event) => {
                      setCouponCode(event.target.value.toUpperCase());
                      if (appliedCoupon) setAppliedCoupon(null);
                      setCouponError("");
                    }}
                    placeholder="KWIKSAVE"
                    wrapperClassName="min-w-0 flex-1"
                    className="mt-0 h-10 font-semibold uppercase"
                  />
                  {appliedCoupon ? (
                    <AppButton
                      type="button"
                      onClick={removeCoupon}
                      variant="secondary"
                      size="md"
                      className="h-10 px-3 text-xs"
                    >
                      Remove
                    </AppButton>
                  ) : (
                    <AppButton
                      type="button"
                      onClick={applyCoupon}
                      disabled={!couponCode.trim() || isApplyingCoupon}
                      isLoading={isApplyingCoupon}
                      loadingLabel="..."
                      size="md"
                      className="h-10 px-3 text-xs"
                    >
                      Apply
                    </AppButton>
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

            <AppButton
              type="button"
              disabled={isPrimaryDisabled}
              onClick={handlePrimaryAction}
              fullWidth
              size="lg"
              isLoading={isPrimaryBusy}
              loadingLabel={isCheckingOut ? "Starting Paystack" : "Validating cart"}
              className="mt-5"
            >
              {!isPrimaryBusy && (step === "payment" ? <ShieldCheck className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />)}
              {primaryLabel}
            </AppButton>

            {step === "payment" && (
              <p className="mt-3 text-center text-xs leading-5 text-kwik-muted dark:text-white/60">
                Payment creates the order, reserves inventory, and sends admin the delivery details for dispatch assignment.
              </p>
            )}
          </section>

          <section className="min-w-0 max-w-full overflow-hidden border border-neutral-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
            <h3 className="text-sm font-semibold text-kwik-dark dark:text-white">Checkout checks</h3>
            <div className="mt-4 space-y-3">
              {[
                { active: true, icon: ShieldCheck, title: "Server validation", text: "Inventory and fulfillment are checked before payment." },
                { active: hasPool, icon: Users, title: "Partner-aware", text: hasPool ? "Partner-fulfilled item in cart." : "No partner-fulfilled item." },
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
            </>
          )}
        </aside>
      </main>
      <EscrowSafetyDialog
        isOpen={isEscrowDialogOpen}
        isLoading={isCheckingOut}
        onClose={() => setIsEscrowDialogOpen(false)}
        onConfirm={processCheckout}
      />
    </div>
  );
}
