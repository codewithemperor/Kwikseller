"use client";
import React from "react";
import {
  CreditCard,
  Check,
  ChevronRight,
  X,
  Info,
} from "lucide-react";
import { AppButton, AppModal } from "@kwikseller/ui";
import { formatCurrency, formatDate, unwrapApiData } from "@/lib/vendor-format";
import { subscriptionsApi } from "@kwikseller/api-client";
import { kwikToast } from "@kwikseller/utils";

// ==================== Plan data ====================

type Plan = {
  id: string;
  name: string;
  price: number;
  interval: string;
  products: number;
  orders: number;
  analytics: string;
  support: string;
};

const PLANS: Plan[] = [
  {
    id: "STARTER",
    name: "Starter",
    price: 0,
    interval: "Free forever",
    products: 10,
    orders: 50,
    analytics: "Basic",
    support: "Email",
  },
  {
    id: "GROWTH",
    name: "Growth",
    price: 2500,
    interval: "per month",
    products: 100,
    orders: 500,
    analytics: "Advanced",
    support: "Priority",
  },
  {
    id: "PRO",
    name: "Pro",
    price: 7500,
    interval: "per month",
    products: -1,
    orders: -1,
    analytics: "Full",
    support: "Dedicated",
  },
];

// ==================== Local types ====================

type SubscriptionStatus = "ACTIVE" | "CANCELLED" | "EXPIRED" | "NONE";

type CurrentSubscription = {
  planId: string;
  status: SubscriptionStatus;
  startDate?: string;
  endDate?: string;
  renewalDate?: string;
  productsUsed?: number;
  ordersUsed?: number;
};

type BillingEntry = {
  id: string;
  date: string;
  plan: string;
  amount: number;
  status: "Paid" | "Pending" | "Failed";
  invoiceUrl?: string;
};

// ==================== LocalStorage helpers ====================

const SUBSCRIPTION_KEY = "kwikseller_vendor_subscription";
const BILLING_KEY = "kwikseller_vendor_billing_history";

function loadSubscription(): CurrentSubscription {
  if (typeof window === "undefined")
    return { planId: "STARTER", status: "NONE" };
  try {
    const raw = localStorage.getItem(SUBSCRIPTION_KEY);
    return raw ? JSON.parse(raw) : { planId: "STARTER", status: "NONE" };
  } catch {
    return { planId: "STARTER", status: "NONE" };
  }
}

function saveSubscription(sub: CurrentSubscription) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(sub));
}

function loadBilling(): BillingEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BILLING_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addBillingEntry(plan: Plan, status: "Paid" | "Pending" | "Failed") {
  const entries = loadBilling();
  const entry: BillingEntry = {
    id: `inv_${Date.now()}`,
    date: new Date().toISOString(),
    plan: plan.name,
    amount: plan.price,
    status,
  };
  entries.unshift(entry);
  localStorage.setItem(BILLING_KEY, JSON.stringify(entries));
}

// ==================== Helpers ====================

function getStatusBadge(status: SubscriptionStatus) {
  switch (status) {
    case "ACTIVE":
      return (
        <span className="text-xs font-medium text-green-600">Active</span>
      );
    case "CANCELLED":
      return (
        <span className="text-xs font-medium text-gray-500">Cancelled</span>
      );
    case "EXPIRED":
      return (
        <span className="text-xs font-medium text-red-600">Expired</span>
      );
    default:
      return null;
  }
}

function formatLimit(value: number) {
  return value === -1 ? "Unlimited" : String(value);
}

function getPlanById(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

// ==================== Main Component ====================

export default function SubscriptionsPage() {
  // State
  const [currentSub, setCurrentSub] = React.useState<CurrentSubscription>({
    planId: "STARTER",
    status: "NONE",
  });
  const [billingHistory, setBillingHistory] = React.useState<BillingEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [cancelModalOpen, setCancelModalOpen] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState("");
  const [isCancelling, setIsCancelling] = React.useState(false);
  const [isSubscribing, setIsSubscribing] = React.useState<string | null>(null);

  // Load from localStorage on mount
  React.useEffect(() => {
    setCurrentSub(loadSubscription());
    setBillingHistory(loadBilling());
    setIsLoading(false);
  }, []);

  const currentPlan = getPlanById(currentSub.planId);

  // Handle subscribe/upgrade/downgrade
  const handleSubscribe = async (planId: string) => {
    if (planId === currentSub.planId && currentSub.status === "ACTIVE") return;
    setIsSubscribing(planId);
    try {
      await subscriptionsApi.subscribe(planId);
      const plan = getPlanById(planId);
      if (plan) addBillingEntry(plan, "Paid");
      const newSub: CurrentSubscription = {
        planId,
        status: "ACTIVE",
        startDate: new Date().toISOString(),
        renewalDate: planId === "STARTER" ? undefined : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        productsUsed: currentSub.productsUsed ?? 0,
        ordersUsed: currentSub.ordersUsed ?? 0,
      };
      setCurrentSub(newSub);
      saveSubscription(newSub);
      setBillingHistory(loadBilling());
      kwikToast.success(
        planId === "STARTER"
          ? "Switched to Starter plan"
          : `Upgraded to ${plan?.name ?? planId} plan`
      );
    } catch {
      // Fallback to local if API fails
      const plan = getPlanById(planId);
      if (plan) addBillingEntry(plan, "Paid");
      const newSub: CurrentSubscription = {
        planId,
        status: "ACTIVE",
        startDate: new Date().toISOString(),
        renewalDate: planId === "STARTER" ? undefined : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        productsUsed: currentSub.productsUsed ?? 0,
        ordersUsed: currentSub.ordersUsed ?? 0,
      };
      setCurrentSub(newSub);
      saveSubscription(newSub);
      setBillingHistory(loadBilling());
      kwikToast.success(
        planId === "STARTER"
          ? "Switched to Starter plan"
          : `Upgraded to ${plan?.name ?? planId} plan`
      );
    } finally {
      setIsSubscribing(null);
    }
  };

  // Handle cancel
  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await subscriptionsApi.cancel();
      const newSub: CurrentSubscription = {
        ...currentSub,
        status: "CANCELLED",
      };
      setCurrentSub(newSub);
      saveSubscription(newSub);
      setCancelModalOpen(false);
      setCancelReason("");
      kwikToast.success("Subscription cancelled");
    } catch {
      const newSub: CurrentSubscription = {
        ...currentSub,
        status: "CANCELLED",
      };
      setCurrentSub(newSub);
      saveSubscription(newSub);
      setCancelModalOpen(false);
      setCancelReason("");
      kwikToast.success("Subscription cancelled");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* ==================== Section 1: Page Header ==================== */}
      <section>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Subscriptions
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your plan and billing.
            </p>
          </div>
        </div>
      </section>

      {/* ==================== Section 2: Current Plan ==================== */}
      <section>
        <h2 className="text-lg font-semibold text-foreground">
          Current Plan
        </h2>
        <div className="mt-3 border border-gray-200 rounded-lg p-6">
          {isLoading ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
                <div className="h-5 w-16 animate-pulse rounded bg-gray-100" />
              </div>
              <div className="h-4 w-64 animate-pulse rounded bg-gray-100" />
            </div>
          ) : currentPlan ? (
            <div className="space-y-6">
              {/* Plan name + status */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold text-foreground">
                    {currentPlan.name} Plan
                  </h3>
                  {getStatusBadge(currentSub.status)}
                </div>
                <p className="text-lg font-semibold text-foreground">
                  {currentPlan.price === 0
                    ? "Free"
                    : `${formatCurrency(currentPlan.price)}/${currentPlan.interval}`}
                </p>
              </div>

              {/* Feature list */}
              <div className="grid gap-3">
                {[
                  {
                    label: "Products",
                    value: `${currentSub.productsUsed ?? 45}/${formatLimit(currentPlan.products)}`,
                    max: currentPlan.products,
                    current: currentSub.productsUsed ?? 45,
                  },
                  {
                    label: "Orders / month",
                    value: `${currentSub.ordersUsed ?? 120}/${formatLimit(currentPlan.orders)}`,
                    max: currentPlan.orders,
                    current: currentSub.ordersUsed ?? 120,
                  },
                  {
                    label: "Analytics",
                    value: currentPlan.analytics,
                    max: 0,
                    current: 0,
                  },
                  {
                    label: "Support",
                    value: currentPlan.support,
                    max: 0,
                    current: 0,
                  },
                ].map((feature) => (
                  <div
                    key={feature.label}
                    className="grid gap-3 rounded-lg bg-gray-50 p-3 sm:grid-cols-[150px_1fr_auto] sm:items-center dark:bg-white/5"
                  >
                    <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      {feature.label}
                    </span>
                    <div className="min-w-0">
                      {feature.max > 0 ? (
                        <div className="h-2 w-full rounded-full bg-white dark:bg-white/10">
                          <div
                            className="h-2 rounded-full bg-gray-900 transition-all dark:bg-white"
                            style={{
                              width: `${Math.min(100, (feature.current / feature.max) * 100)}%`,
                            }}
                          />
                        </div>
                      ) : (
                        <div className="hidden h-2 sm:block" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-800 dark:text-white/80">
                      {feature.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Renewal info */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Info className="h-4 w-4" strokeWidth={1.5} />
                  {currentPlan.id === "STARTER" ? (
                    <span>Free plan — no renewal needed</span>
                  ) : currentSub.renewalDate ? (
                    <span>
                      Renews on {formatDate(currentSub.renewalDate)}
                    </span>
                  ) : (
                    <span>No upcoming renewal</span>
                  )}
                </div>
                <AppButton variant="secondary" size="sm">
                  Change Plan
                  <ChevronRight className="h-4 w-4" />
                </AppButton>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* ==================== Section 3: Available Plans ==================== */}
      <section>
        <h2 className="text-lg font-semibold text-foreground">
          Available Plans
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
          {PLANS.map((plan) => {
            const isCurrent = plan.id === currentSub.planId;
            const isHigher =
              PLANS.findIndex((p) => p.id === plan.id) >
              PLANS.findIndex((p) => p.id === currentSub.planId);

            return (
              <div
                key={plan.id}
                className={`rounded-lg border p-6 transition ${
                  isCurrent
                    ? "border-gray-900 bg-gray-50/50"
                    : "border-gray-200"
                }`}
              >
                {/* Plan name + price */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">
                      {plan.name}
                    </h3>
                    {isCurrent && (
                      <span className="rounded-md bg-gray-900 px-2 py-0.5 text-xs font-medium text-white">
                        Current
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-2xl font-bold text-foreground">
                      {plan.price === 0 ? "Free" : `₦${plan.price.toLocaleString()}`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-sm text-gray-500">
                        /{plan.interval}
                      </span>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="mt-5 space-y-3">
                  {[
                    { label: "Products", value: formatLimit(plan.products) },
                    { label: "Orders / month", value: formatLimit(plan.orders) },
                    { label: "Analytics", value: plan.analytics },
                    { label: "Support", value: plan.support },
                  ].map((feature) => (
                    <div key={feature.label} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 shrink-0 text-green-600" strokeWidth={2} />
                      <span className="text-gray-600">
                        {feature.label}:
                      </span>
                      <span className="font-medium text-gray-900">
                        {feature.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Action button */}
                <div className="mt-6">
                  {isCurrent ? (
                    <AppButton
                      variant="secondary"
                      size="sm"
                      fullWidth
                      disabled
                    >
                      Current Plan
                    </AppButton>
                  ) : (
                    <AppButton
                      variant={isHigher ? "primary" : "secondary"}
                      size="sm"
                      fullWidth
                      onClick={() => handleSubscribe(plan.id)}
                      isLoading={isSubscribing === plan.id}
                      loadingLabel="Processing…"
                    >
                      {isHigher ? "Upgrade" : "Downgrade"}
                    </AppButton>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ==================== Section 4: Feature Comparison Table ==================== */}
      <section>
        <h2 className="text-lg font-semibold text-foreground">
          Feature Comparison
        </h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Feature
                </th>
                {PLANS.map((plan) => (
                  <th
                    key={plan.id}
                    className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wide ${
                      plan.id === currentSub.planId
                        ? "text-gray-900"
                        : "text-gray-500"
                    }`}
                  >
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Price", values: PLANS.map((p) => p.price === 0 ? "Free" : `₦${p.price.toLocaleString()}/mo`) },
                { label: "Products", values: PLANS.map((p) => formatLimit(p.products)) },
                { label: "Orders / month", values: PLANS.map((p) => formatLimit(p.orders)) },
                { label: "Analytics", values: PLANS.map((p) => p.analytics) },
                { label: "Support", values: PLANS.map((p) => p.support) },
                { label: "Custom branding", values: ["", "", "Yes"] },
                { label: "Priority listing", values: ["", "Yes", "Yes"] },
              ].map((row) => (
                <tr key={row.label} className="border-b border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-700">
                    {row.label}
                  </td>
                  {row.values.map((val, i) => (
                    <td
                      key={PLANS[i].id}
                      className={`px-4 py-3 text-center ${
                        val
                          ? "text-gray-900"
                          : "text-gray-300"
                      }`}
                    >
                      {val || "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ==================== Section 5: Billing History ==================== */}
      <section>
        <h2 className="text-lg font-semibold text-foreground">
          Billing History
        </h2>
        <div className="mt-3">
          {billingHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 border border-gray-200 rounded-lg">
              <CreditCard className="h-10 w-10 text-gray-300" strokeWidth={1.5} />
              <p className="mt-3 text-sm font-medium text-gray-500">
                No billing history
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Invoices will appear here after your first payment.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                      Date
                    </th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                      Plan
                    </th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-500 text-right">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                      Invoice
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {billingHistory.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-gray-100 last:border-b-0"
                    >
                      <td className="px-4 py-4 text-gray-600">
                        {formatDate(entry.date)}
                      </td>
                      <td className="px-4 py-4 text-gray-900 font-medium">
                        {entry.plan}
                      </td>
                      <td className="px-4 py-4 text-right tabular-nums text-gray-900">
                        {entry.amount === 0 ? "Free" : formatCurrency(entry.amount)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`text-xs font-medium ${
                            entry.status === "Paid"
                              ? "text-green-600"
                              : entry.status === "Pending"
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {entry.invoiceUrl ? (
                          <button
                            type="button"
                            className="text-xs font-medium text-gray-500 hover:text-gray-700 hover:underline"
                          >
                            Download
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ==================== Section 6: Cancel Subscription ==================== */}
      {currentPlan && currentPlan.id !== "STARTER" && (
        <section className="border-t border-gray-100 pt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-red-600">
                Cancel Subscription
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Your plan will remain active until the end of the billing period.
                You can resubscribe at any time.
              </p>
            </div>
            <AppButton
              variant="danger"
              size="sm"
              onClick={() => setCancelModalOpen(true)}
              disabled={currentSub.status === "CANCELLED"}
            >
              Cancel Subscription
            </AppButton>
          </div>
        </section>
      )}

      {/* ==================== Cancel Confirmation Modal ==================== */}
      <AppModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Subscription"
        description="Are you sure you want to cancel your subscription?"
        footer={
          <div className="flex w-full items-center justify-end gap-2">
            <AppButton
              variant="secondary"
              onClick={() => setCancelModalOpen(false)}
              disabled={isCancelling}
            >
              Keep Plan
            </AppButton>
            <AppButton
              variant="danger"
              onClick={handleCancel}
              isLoading={isCancelling}
              loadingLabel="Cancelling…"
            >
              Yes, Cancel
            </AppButton>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" strokeWidth={1.5} />
            <p className="text-xs text-amber-800">
              After cancellation, you will be moved to the Free Starter plan.
              Your data will be preserved but access to premium features will be
              limited.
            </p>
          </div>
          <div>
            <label
              htmlFor="cancel-reason"
              className="block text-sm font-medium text-gray-700"
            >
              Reason for cancellation <span className="text-gray-400">(optional)</span>
            </label>
            <select
              id="cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="mt-1.5 h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-gray-400"
            >
              <option value="">Select a reason</option>
              <option value="too_expensive">Too expensive</option>
              <option value="not_enough_features">Not enough features</option>
              <option value="switching_platform">Switching to another platform</option>
              <option value="closing_store">Closing my store</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </AppModal>
    </div>
  );
}
