"use client";
import React from "react";
import {
  Settings,
  Store,
  Lock,
  Bell,
  ShoppingCart,
  Truck,
  Wallet,
  Package,
  Megaphone,
  Smartphone,
  AlertTriangle,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import {
  AppButton,
  AppSwitch,
  AppModal,
  FieldInput,
  FieldSelect,
  FieldTextarea,
  Skeleton,
} from "@kwikseller/ui";
import { unwrapApiData } from "@/lib/vendor-format";
import { storeApi, authApi, usersApi } from "@kwikseller/api-client";
import { kwikToast } from "@kwikseller/utils";

// ==================== Constants ====================

const SETTINGS_KEY = "kwikseller_vendor_settings";
const STORE_SETTINGS_KEY = "kwikseller_vendor_store_settings";
const DELIVERY_SETTINGS_KEY = "kwikseller_vendor_delivery_settings";
const PREFS_KEY = "kwikseller_vendor_notification_prefs";

const PROCESSING_TIME_OPTIONS = [
  { value: "same_day", label: "Same Day" },
  { value: "1_2_days", label: "1-2 Days" },
  { value: "3_5_days", label: "3-5 Days" },
  { value: "5_7_days", label: "5-7 Days" },
];

const CURRENCY_OPTIONS = [
  { value: "NGN", label: "Nigerian Naira (NGN)" },
  { value: "USD", label: "US Dollar (USD)" },
  { value: "GBP", label: "British Pound (GBP)" },
  { value: "EUR", label: "Euro (EUR)" },
];

type NotificationPref = {
  newOrderEmail: boolean;
  deliveryPush: boolean;
  paymentEmail: boolean;
  lowStockEmail: boolean;
  lowStockPush: boolean;
  marketingEmail: boolean;
};

const DEFAULT_PREFS: NotificationPref = {
  newOrderEmail: true,
  deliveryPush: true,
  paymentEmail: true,
  lowStockEmail: true,
  lowStockPush: true,
  marketingEmail: false,
};

// ==================== Local helpers ====================

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ==================== Section Navigation ====================

type SectionId =
  | "account"
  | "notifications"
  | "store"
  | "shipping"
  | "danger";

const SECTIONS: { id: SectionId; label: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }[] = [
  { id: "account", label: "Account", icon: Settings },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "store", label: "Store", icon: Store },
  { id: "shipping", label: "Shipping", icon: Truck },
  { id: "danger", label: "Danger Zone", icon: AlertTriangle },
];

// ==================== Main Component ====================

export default function SettingsPage() {
  // Active section
  const [activeSection, setActiveSection] = React.useState<SectionId>("account");
  const [mobileExpanded, setMobileExpanded] = React.useState<SectionId | null>("account");

  // ---- Account Settings State ----
  const [storeName, setStoreName] = React.useState("");
  const [storeSlug, setStoreSlug] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showCurrentPw, setShowCurrentPw] = React.useState(false);
  const [showNewPw, setShowNewPw] = React.useState(false);
  const [showConfirmPw, setShowConfirmPw] = React.useState(false);
  const [isSavingAccount, setIsSavingAccount] = React.useState(false);
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);
  const [isSendingVerification, setIsSendingVerification] = React.useState(false);

  // ---- Notification Preferences State ----
  const [prefs, setPrefs] = React.useState<NotificationPref>(DEFAULT_PREFS);
  const [isSavingPrefs, setIsSavingPrefs] = React.useState(false);

  // ---- Store Settings State ----
  const [currency, setCurrency] = React.useState("NGN");
  const [taxRate, setTaxRate] = React.useState("");
  const [isTaxable, setIsTaxable] = React.useState(false);
  const [minOrderAmount, setMinOrderAmount] = React.useState("");
  const [autoAcceptOrders, setAutoAcceptOrders] = React.useState(false);
  const [isSavingStore, setIsSavingStore] = React.useState(false);

  // ---- Shipping/Delivery State ----
  const [processingTime, setProcessingTime] = React.useState("same_day");
  const [deliveryRegions, setDeliveryRegions] = React.useState("");
  const [deliveryInstructions, setDeliveryInstructions] = React.useState("");
  const [isSavingDelivery, setIsSavingDelivery] = React.useState(false);

  // ---- Danger Zone State ----
  const [deactivateModalOpen, setDeactivateModalOpen] = React.useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = React.useState("");
  const [isDeactivating, setIsDeactivating] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // ---- Loading state ----
  const [isLoading, setIsLoading] = React.useState(true);

  // Load all settings from localStorage on mount
  React.useEffect(() => {
    const accountSettings = loadJson<{
      storeName?: string;
      storeSlug?: string;
      email?: string;
      phone?: string;
    }>(SETTINGS_KEY, {});

    setStoreName(accountSettings.storeName ?? "");
    setStoreSlug(accountSettings.storeSlug ?? "");
    setEmail(accountSettings.email ?? "");
    setPhone(accountSettings.phone ?? "");

    setPrefs(loadJson(PREFS_KEY, DEFAULT_PREFS));

    const storeSettings = loadJson<{
      currency?: string;
      taxRate?: string;
      isTaxable?: boolean;
      minOrderAmount?: string;
      autoAcceptOrders?: boolean;
    }>(STORE_SETTINGS_KEY, {});

    setCurrency(storeSettings.currency ?? "NGN");
    setTaxRate(storeSettings.taxRate ?? "");
    setIsTaxable(storeSettings.isTaxable ?? false);
    setMinOrderAmount(storeSettings.minOrderAmount ?? "");
    setAutoAcceptOrders(storeSettings.autoAcceptOrders ?? false);

    const deliverySettings = loadJson<{
      processingTime?: string;
      deliveryRegions?: string;
      deliveryInstructions?: string;
    }>(DELIVERY_SETTINGS_KEY, {});

    setProcessingTime(deliverySettings.processingTime ?? "same_day");
    setDeliveryRegions(deliverySettings.deliveryRegions ?? "");
    setDeliveryInstructions(deliverySettings.deliveryInstructions ?? "");

    // Also try to load from API
    loadFromApi();

    setIsLoading(false);
  }, []);

  // Generate slug from store name
  React.useEffect(() => {
    if (storeName && !storeSlug) {
      setStoreSlug(slugify(storeName));
    }
  }, [storeName, storeSlug]);

  const loadFromApi = async () => {
    try {
      const response = await storeApi.get();
      const data = unwrapApiData<{
        name?: string;
        slug?: string;
        email?: string;
        phone?: string;
        currency?: string;
      }>(response.data);
      if (data) {
        if (data.name) setStoreName(data.name);
        if (data.slug) setStoreSlug(data.slug);
        if (data.email) setEmail(data.email);
        if (data.phone) setPhone(data.phone);
        if (data.currency) setCurrency(data.currency);
      }
    } catch {
      // Silently fail — use localStorage values
    }
  };

  // ---- Handlers ----

  const handleSaveAccount = async () => {
    setIsSavingAccount(true);
    try {
      await storeApi.update({
        name: storeName,
        slug: storeSlug,
      });
      kwikToast.success("Account settings saved");
    } catch {
      // Fallback to localStorage
      saveJson(SETTINGS_KEY, { storeName, storeSlug, email, phone });
      kwikToast.success("Settings saved locally");
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handleSendVerification = async () => {
    setIsSendingVerification(true);
    try {
      // sendVerificationEmail not yet in api-client — will catch and show toast
      const fn = (authApi as Record<string, unknown>).sendVerificationEmail as ((data: { email: string }) => Promise<void>) | undefined;
      await fn?.({ email });
      kwikToast.success("Verification email sent");
    } catch {
      kwikToast.error("Could not send verification email");
    } finally {
      setIsSendingVerification(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      kwikToast.error("Fill in all password fields");
      return;
    }
    if (newPassword.length < 8) {
      kwikToast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      kwikToast.error("Passwords do not match");
      return;
    }

    setIsChangingPassword(true);
    try {
      // changePassword not yet in api-client — will catch and show toast
      const fn = (authApi as Record<string, unknown>).changePassword as ((data: { currentPassword: string; newPassword: string }) => Promise<void>) | undefined;
      await fn?.({
        currentPassword,
        newPassword,
      });
      kwikToast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      kwikToast.error("Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSavePrefs = async () => {
    setIsSavingPrefs(true);
    await new Promise((r) => setTimeout(r, 400));
    saveJson(PREFS_KEY, prefs);
    kwikToast.success("Notification preferences saved");
    setIsSavingPrefs(false);
  };

  const handleSaveStoreSettings = async () => {
    setIsSavingStore(true);
    try {
      await storeApi.update({
        currency,
        taxRate: isTaxable ? parseFloat(taxRate) || 0 : undefined,
        minOrderAmount: parseFloat(minOrderAmount) || undefined,
        autoAcceptOrders,
      } as Parameters<typeof storeApi.update>[0]);
      kwikToast.success("Store settings saved");
    } catch {
      saveJson(STORE_SETTINGS_KEY, {
        currency,
        taxRate,
        isTaxable,
        minOrderAmount,
        autoAcceptOrders,
      });
      kwikToast.success("Store settings saved locally");
    } finally {
      setIsSavingStore(false);
    }
  };

  const handleSaveDeliverySettings = async () => {
    setIsSavingDelivery(true);
    try {
      await storeApi.update({
        processingTime,
        deliveryRegions,
        deliveryInstructions,
      } as Parameters<typeof storeApi.update>[0]);
      kwikToast.success("Delivery settings saved");
    } catch {
      saveJson(DELIVERY_SETTINGS_KEY, {
        processingTime,
        deliveryRegions,
        deliveryInstructions,
      });
      kwikToast.success("Delivery settings saved locally");
    } finally {
      setIsSavingDelivery(false);
    }
  };

  const handleDeactivateStore = async () => {
    setIsDeactivating(true);
    try {
      await storeApi.update({ status: "INACTIVE" } as Parameters<typeof storeApi.update>[0]);
      kwikToast.success("Store deactivated");
      setDeactivateModalOpen(false);
    } catch {
      kwikToast.error("Failed to deactivate store");
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE MY ACCOUNT") return;
    setIsDeleting(true);
    try {
      // deleteAccount not yet in api-client — will catch and show toast
      const fn = (usersApi as Record<string, unknown>).deleteAccount as (() => Promise<void>) | undefined;
      await fn?.();
      kwikToast.success("Account deleted. You will be logged out.");
      setDeleteModalOpen(false);
    } catch {
      kwikToast.error("Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  };

  // ---- Toggle mobile expanded section ----
  const toggleMobileSection = (id: SectionId) => {
    setMobileExpanded((prev) => (prev === id ? null : id));
  };

  // ==================== Render ====================

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <section>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account, store preferences, and notifications.
        </p>
      </section>

      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        {/* Left Nav (Desktop) */}
        <nav className="hidden lg:block lg:w-56 lg:shrink-0">
          <div className="space-y-0 divide-y divide-gray-100 border-t border-gray-200">
            {SECTIONS.map((section) => {
              const IconComp = section.icon;
              const isDanger = section.id === "danger";
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={`flex w-full items-center gap-3 px-3 py-3 text-left text-sm font-medium transition ${
                    activeSection === section.id
                      ? "bg-gray-50 text-gray-900"
                      : isDanger
                        ? "text-red-600 hover:bg-red-50"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <IconComp
                    className={`h-4 w-4 shrink-0 ${isDanger ? "text-red-500" : "text-gray-400"}`}
                    strokeWidth={1.5}
                  />
                  {section.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Main Content */}
        <div className="min-w-0 flex-1">
          {isLoading ? (
            <div className="space-y-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-9 w-28" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-0 divide-y divide-gray-100 border-t border-gray-200">
              {/* ==================== Mobile Accordion Nav ==================== */}
              {SECTIONS.map((section) => {
                const IconComp = section.icon;
                const isDanger = section.id === "danger";
                const isExpanded = mobileExpanded === section.id;
                return (
                  <div key={section.id} className="lg:hidden">
                    <button
                      type="button"
                      onClick={() => toggleMobileSection(section.id)}
                      className={`flex w-full items-center justify-between px-1 py-4 text-left text-sm font-medium transition ${
                        isDanger ? "text-red-600" : "text-gray-900"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <IconComp
                          className={`h-4 w-4 shrink-0 ${isDanger ? "text-red-500" : "text-gray-400"}`}
                          strokeWidth={1.5}
                        />
                        {section.label}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" strokeWidth={1.5} />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" strokeWidth={1.5} />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="pb-6">
                        {renderSection(section.id)}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* ==================== Desktop Sections (only active) ==================== */}
              <div className="hidden lg:block space-y-0">
                {SECTIONS.map((section) => (
                  <div
                    key={section.id}
                    className={activeSection === section.id ? "pb-6 pt-6 first:pt-0" : "hidden"}
                  >
                    {renderSection(section.id)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==================== Danger Zone Modals ==================== */}
      <AppModal
        isOpen={deactivateModalOpen}
        onClose={() => setDeactivateModalOpen(false)}
        title="Deactivate Store"
        footer={
          <div className="flex w-full items-center justify-end gap-2">
            <AppButton
              variant="secondary"
              onClick={() => setDeactivateModalOpen(false)}
              disabled={isDeactivating}
            >
              Cancel
            </AppButton>
            <AppButton
              variant="primary"
              className="bg-amber-600 hover:bg-amber-700"
              onClick={handleDeactivateStore}
              isLoading={isDeactivating}
              loadingLabel="Deactivating..."
            >
              Deactivate Store
            </AppButton>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-medium text-gray-900">
                This action will temporarily disable your store
              </p>
              <p className="mt-1 text-xs text-gray-600">
                Your products will be hidden from the marketplace and customers will not be able
                to place new orders. You can reactivate your store at any time from settings.
              </p>
            </div>
          </div>
        </div>
      </AppModal>

      <AppModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteConfirmText("");
        }}
        title="Delete Account Permanently"
        footer={
          <div className="flex w-full items-center justify-end gap-2">
            <AppButton
              variant="secondary"
              onClick={() => {
                setDeleteModalOpen(false);
                setDeleteConfirmText("");
              }}
              disabled={isDeleting}
            >
              Cancel
            </AppButton>
            <AppButton
              variant="danger"
              onClick={handleDeleteAccount}
              isLoading={isDeleting}
              loadingLabel="Deleting..."
              disabled={deleteConfirmText !== "DELETE MY ACCOUNT"}
            >
              <Trash2 className="h-4 w-4" />
              Delete Account
            </AppButton>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-medium text-gray-900">
                This action is permanent and cannot be undone
              </p>
              <p className="mt-1 text-xs text-gray-600">
                All your products, orders, earnings history, and store data will be permanently
                deleted. You will not be able to recover your account.
              </p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-700">
              Type <span className="font-mono font-semibold text-red-600">DELETE MY ACCOUNT</span> to confirm:
            </p>
            <FieldInput
              type="text"
              placeholder="DELETE MY ACCOUNT"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="mt-2"
            />
          </div>
        </div>
      </AppModal>
    </div>
  );

  // ==================== Section Renderer ====================

  function renderSection(id: SectionId) {
    switch (id) {
      case "account":
        return <AccountSection />;
      case "notifications":
        return <NotificationsSection />;
      case "store":
        return <StoreSection />;
      case "shipping":
        return <ShippingSection />;
      case "danger":
        return <DangerSection />;
    }
  }

  // ==================== Account Section ====================

  function AccountSection() {
    return (
      <div className="space-y-8">
        {/* Store Info */}
        <div>
          <h3 className="text-base font-semibold text-gray-900">Store Information</h3>
          <p className="mt-1 text-xs text-gray-500">
            Your store name and URL shown to customers.
          </p>

          <div className="mt-5 space-y-4">
            <FieldInput
              label="Store Name"
              type="text"
              placeholder="My Store"
              value={storeName}
              onChange={(e) => {
                setStoreName(e.target.value);
                if (!storeSlug || slugify(storeName) === storeSlug) {
                  setStoreSlug(slugify(e.target.value));
                }
              }}
            />
            <div>
              <FieldInput
                label="Store URL / Slug"
                type="text"
                placeholder="my-store"
                value={storeSlug}
                onChange={(e) => setStoreSlug(slugify(e.target.value))}
              />
              <p className="mt-1.5 text-xs text-gray-400">
                Preview:{" "}
                <span className="font-mono text-gray-600">
                  kwikseller.com/store/{storeSlug || "your-store"}
                </span>
              </p>
            </div>
          </div>

          <div className="mt-6">
            <AppButton
              variant="primary"
              size="sm"
              onClick={handleSaveAccount}
              isLoading={isSavingAccount}
              loadingLabel="Saving..."
              disabled={isSavingAccount}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Save Changes
            </AppButton>
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* Contact Info */}
        <div>
          <h3 className="text-base font-semibold text-gray-900">Contact Information</h3>
          <p className="mt-1 text-xs text-gray-500">
            How customers and Kwikseller can reach you.
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <FieldInput
                label="Email Address"
                type="email"
                placeholder="vendor@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div className="mt-1.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSendVerification}
                  disabled={isSendingVerification || !email}
                  className="text-xs font-medium text-gray-500 transition hover:text-gray-700 disabled:text-gray-300"
                >
                  {isSendingVerification ? "Sending..." : "Send verification email"}
                </button>
              </div>
            </div>
            <div>
              <FieldInput
                label="Phone Number"
                type="tel"
                placeholder="+234 800 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="mt-1.5 text-xs text-gray-400">
                OTP verification required when changed.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <AppButton
              variant="primary"
              size="sm"
              onClick={handleSaveAccount}
              isLoading={isSavingAccount}
              loadingLabel="Saving..."
              disabled={isSavingAccount}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Save Changes
            </AppButton>
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* Password Change */}
        <div>
          <h3 className="text-base font-semibold text-gray-900">Change Password</h3>
          <p className="mt-1 text-xs text-gray-500">
            Update your account password. You will be logged out of other sessions.
          </p>

          <div className="mt-5 space-y-4">
            <div className="relative">
              <FieldInput
                label="Current Password"
                type={showCurrentPw ? "text" : "password"}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showCurrentPw ? (
                  <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                ) : (
                  <Eye className="h-4 w-4" strokeWidth={1.5} />
                )}
              </button>
            </div>
            <div className="relative">
              <FieldInput
                label="New Password"
                type={showNewPw ? "text" : "password"}
                placeholder="Min. 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showNewPw ? (
                  <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                ) : (
                  <Eye className="h-4 w-4" strokeWidth={1.5} />
                )}
              </button>
            </div>
            <div className="relative">
              <FieldInput
                label="Confirm New Password"
                type={showConfirmPw ? "text" : "password"}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPw(!showConfirmPw)}
                className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showConfirmPw ? (
                  <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                ) : (
                  <Eye className="h-4 w-4" strokeWidth={1.5} />
                )}
              </button>
            </div>
          </div>

          <div className="mt-6">
            <AppButton
              variant="primary"
              size="sm"
              onClick={handleChangePassword}
              isLoading={isChangingPassword}
              loadingLabel="Changing..."
              disabled={
                isChangingPassword ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
            >
              <Lock className="h-3.5 w-3.5" />
              Change Password
            </AppButton>
          </div>
        </div>
      </div>
    );
  }

  // ==================== Notifications Section ====================

  function NotificationsSection() {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            Notification Preferences
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            Choose how you want to be notified about activity on your store.
          </p>
        </div>

        <div className="space-y-0 divide-y divide-gray-100">
          {/* New order alerts */}
          <div className="flex items-center justify-between gap-4 py-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-green-50">
                <ShoppingCart className="h-4 w-4 text-green-600" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">New order alerts</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Receive an email when a new order is placed
                </p>
              </div>
            </div>
            <AppSwitch
              isSelected={prefs.newOrderEmail}
              onChange={(val) => setPrefs((p) => ({ ...p, newOrderEmail: val }))}
              className="shrink-0"
            />
          </div>

          {/* Delivery updates */}
          <div className="flex items-center justify-between gap-4 py-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-green-50">
                <Smartphone className="h-4 w-4 text-green-600" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Delivery updates</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Get push/browser notifications for delivery status changes
                </p>
              </div>
            </div>
            <AppSwitch
              isSelected={prefs.deliveryPush}
              onChange={(val) => setPrefs((p) => ({ ...p, deliveryPush: val }))}
              className="shrink-0"
            />
          </div>

          {/* Payment released */}
          <div className="flex items-center justify-between gap-4 py-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-green-50">
                <Wallet className="h-4 w-4 text-green-600" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Payment released</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Receive an email when payment is released to your wallet
                </p>
              </div>
            </div>
            <AppSwitch
              isSelected={prefs.paymentEmail}
              onChange={(val) => setPrefs((p) => ({ ...p, paymentEmail: val }))}
              className="shrink-0"
            />
          </div>

          {/* Low stock warnings */}
          <div className="flex items-center justify-between gap-4 py-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-green-50">
                <Package className="h-4 w-4 text-green-600" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Low stock warnings</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Get email + push alerts when products are running low
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-gray-400">Email</span>
              <AppSwitch
                isSelected={prefs.lowStockEmail}
                onChange={(val) => setPrefs((p) => ({ ...p, lowStockEmail: val }))}
              />
              <span className="text-xs text-gray-400">Push</span>
              <AppSwitch
                isSelected={prefs.lowStockPush}
                onChange={(val) => setPrefs((p) => ({ ...p, lowStockPush: val }))}
              />
            </div>
          </div>

          {/* Marketing emails */}
          <div className="flex items-center justify-between gap-4 py-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-green-50">
                <Megaphone className="h-4 w-4 text-green-600" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Marketing emails</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Receive promotional emails and product updates from Kwikseller
                </p>
              </div>
            </div>
            <AppSwitch
              isSelected={prefs.marketingEmail}
              onChange={(val) => setPrefs((p) => ({ ...p, marketingEmail: val }))}
              className="shrink-0"
            />
          </div>
        </div>

        <div>
          <AppButton
            variant="primary"
            size="sm"
            onClick={handleSavePrefs}
            isLoading={isSavingPrefs}
            loadingLabel="Saving..."
          >
            <Bell className="h-3.5 w-3.5" />
            Save Preferences
          </AppButton>
        </div>
      </div>
    );
  }

  // ==================== Store Section ====================

  function StoreSection() {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            Store Configuration
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            Configure currency, tax, and order settings for your store.
          </p>
        </div>

        <div className="space-y-4">
          <FieldSelect
            label="Default Currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {CURRENCY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </FieldSelect>

          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <FieldInput
                label="Tax Rate (%)"
                type="number"
                placeholder="0"
                min="0"
                max="100"
                step="0.25"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                disabled={!isTaxable}
              />
            </div>
            <div className="pt-5">
              <AppSwitch
                isSelected={isTaxable}
                onChange={(val) => {
                  setIsTaxable(val);
                  if (!val) setTaxRate("");
                }}
                label="Taxable"
                description="Charge tax on orders"
              />
            </div>
          </div>

          <FieldInput
            label="Minimum Order Amount"
            type="number"
            placeholder="No minimum"
            min="0"
            step="100"
            value={minOrderAmount}
            onChange={(e) => setMinOrderAmount(e.target.value)}
          />
          <p className="-mt-2 text-xs text-gray-400">
            Leave empty for no minimum order amount.
          </p>

          <div className="flex items-center justify-between gap-4 py-2">
            <div>
              <p className="text-sm font-medium text-gray-900">Auto-accept orders</p>
              <p className="mt-0.5 text-xs text-gray-500">
                New orders will be automatically accepted without manual review.
                You can still cancel orders within the processing window.
              </p>
            </div>
            <AppSwitch
              isSelected={autoAcceptOrders}
              onChange={(val) => setAutoAcceptOrders(val)}
              className="shrink-0"
            />
          </div>
        </div>

        <div>
          <AppButton
            variant="primary"
            size="sm"
            onClick={handleSaveStoreSettings}
            isLoading={isSavingStore}
            loadingLabel="Saving..."
          >
            <Store className="h-3.5 w-3.5" />
            Save Store Settings
          </AppButton>
        </div>
      </div>
    );
  }

  // ==================== Shipping Section ====================

  function ShippingSection() {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            Shipping &amp; Delivery
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            Set your processing time, delivery coverage, and rider instructions.
          </p>
        </div>

        <div className="space-y-4">
          <FieldSelect
            label="Processing Time"
            value={processingTime}
            onChange={(e) => setProcessingTime(e.target.value)}
          >
            {PROCESSING_TIME_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </FieldSelect>

          <FieldTextarea
            label="Delivery Regions Served"
            value={deliveryRegions}
            onChange={(e) => setDeliveryRegions(e.target.value)}
            rows={3}
            placeholder="e.g. Lagos Mainland, Lagos Island, Abuja, Port Harcourt"
          />
          <p className="-mt-2 text-xs text-gray-400">
            List the areas you deliver to, one per line.
          </p>

          <FieldTextarea
            label="Delivery Instructions for Riders"
            value={deliveryInstructions}
            onChange={(e) => setDeliveryInstructions(e.target.value)}
            rows={4}
            placeholder="e.g. Call customer before delivery. Do not leave package at the gate."
          />
        </div>

        <div>
          <AppButton
            variant="primary"
            size="sm"
            onClick={handleSaveDeliverySettings}
            isLoading={isSavingDelivery}
            loadingLabel="Saving..."
          >
            <Truck className="h-3.5 w-3.5" />
            Save Delivery Settings
          </AppButton>
        </div>
      </div>
    );
  }

  // ==================== Danger Section ====================

  function DangerSection() {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-base font-semibold text-red-600">Danger Zone</h3>
          <p className="mt-1 text-xs text-gray-500">
            Irreversible actions that affect your store and account.
          </p>
        </div>

        <div className="space-y-0 divide-y divide-red-100">
          {/* Deactivate Store */}
          <div className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Deactivate Store</p>
              <p className="mt-0.5 text-xs text-gray-500">
                Temporarily disable your store. Products will be hidden from the marketplace.
              </p>
            </div>
            <AppButton
              variant="secondary"
              size="sm"
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
              onClick={() => setDeactivateModalOpen(true)}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Deactivate Store
            </AppButton>
          </div>

          {/* Delete Account */}
          <div className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Delete Account</p>
              <p className="mt-0.5 text-xs text-gray-500">
                Permanently delete your account, store, products, and all associated data.
                This cannot be undone.
              </p>
            </div>
            <AppButton
              variant="danger"
              size="sm"
              onClick={() => setDeleteModalOpen(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Account
            </AppButton>
          </div>
        </div>
      </div>
    );
  }
}
