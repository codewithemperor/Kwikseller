"use client";
import React from "react";
import {
  Bell,
  ShoppingCart,
  Truck,
  Wallet,
  Package,
  AlertCircle,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  Mail,
  Smartphone,
} from "lucide-react";
import { AppButton, AppSwitch, FieldSelect, Skeleton, VendorPageHeader } from "@/lib/ui";
import { formatDate, unwrapApiData } from "@/lib/vendor-format";
import { notificationsApi } from "@/lib/api-client";
import { kwikToast } from "@/lib/utils";
import { motion } from "framer-motion";

// ==================== Local types ====================

type NotificationType =
  | "NEW_ORDER"
  | "ORDER_UPDATE"
  | "DELIVERY"
  | "PAYMENT_RELEASED"
  | "LOW_STOCK"
  | "SYSTEM"
  | "ANNOUNCEMENT";

type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
};

type TypeFilter = "ALL" | NotificationType;

// ==================== Constants ====================

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "ALL", label: "All Types" },
  { value: "NEW_ORDER", label: "New Order" },
  { value: "ORDER_UPDATE", label: "Order Update" },
  { value: "DELIVERY", label: "Delivery" },
  { value: "PAYMENT_RELEASED", label: "Payment" },
  { value: "LOW_STOCK", label: "Low Stock" },
  { value: "SYSTEM", label: "System" },
];

function getTypeIcon(type: NotificationType) {
  switch (type) {
    case "NEW_ORDER":
    case "ORDER_UPDATE":
      return ShoppingCart;
    case "DELIVERY":
      return Truck;
    case "PAYMENT_RELEASED":
      return Wallet;
    case "LOW_STOCK":
      return Package;
    case "ANNOUNCEMENT":
      return Megaphone;
    default:
      return Bell;
  }
}

function getTypeIconColor(type: NotificationType) {
  switch (type) {
    case "NEW_ORDER":
    case "ORDER_UPDATE":
      return "text-blue-600 bg-blue-50";
    case "DELIVERY":
      return "text-orange-600 bg-orange-50";
    case "PAYMENT_RELEASED":
      return "text-green-600 bg-green-50";
    case "LOW_STOCK":
      return "text-amber-600 bg-amber-50";
    case "ANNOUNCEMENT":
      return "text-purple-600 bg-purple-50";
    default:
      return "text-muted-foreground bg-default-100";
  }
}

// ==================== Preferences helpers ====================

type NotificationPref = {
  newOrderEmail: boolean;
  deliveryPush: boolean;
  paymentEmail: boolean;
  lowStockEmail: boolean;
  lowStockPush: boolean;
  marketingEmail: boolean;
};

const PREFS_KEY = "kwikseller_vendor_notification_prefs";

const DEFAULT_PREFS: NotificationPref = {
  newOrderEmail: true,
  deliveryPush: true,
  paymentEmail: true,
  lowStockEmail: true,
  lowStockPush: true,
  marketingEmail: false,
};

function loadPrefs(): NotificationPref {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

function savePrefs(prefs: NotificationPref) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

// ==================== Main Component ====================

export default function NotificationsPage() {
  // Tab state
  const [activeTab, setActiveTab] = React.useState<"notifications" | "preferences">("notifications");

  // Notifications state
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [typeFilter, setTypeFilter] = React.useState<TypeFilter>("ALL");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isMarkingAll, setIsMarkingAll] = React.useState(false);

  // Preferences state
  const [prefs, setPrefs] = React.useState<NotificationPref>(DEFAULT_PREFS);
  const [isSavingPrefs, setIsSavingPrefs] = React.useState(false);

  // Load preferences on mount
  React.useEffect(() => {
    setPrefs(loadPrefs());
  }, []);

  // Fetch notifications
  const fetchNotifications = React.useCallback(async (pageNum: number, filterType?: TypeFilter) => {
    setIsLoading(true);
    setError(null);
    try {
      const params: { type?: string; page?: number; limit?: number } = {
        page: pageNum,
        limit: 15,
      };
      if (filterType && filterType !== "ALL") {
        params.type = filterType;
      }
      const response = await notificationsApi.list(params);
      const data = unwrapApiData<{ items?: NotificationItem[]; total?: number; totalPages?: number }>(response.data);
      setNotifications(Array.isArray(data?.items) ? data.items : []);
      setTotalPages(data?.totalPages ?? 1);
    } catch {
      setError("Could not load notifications");
      setNotifications([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch unread count
  const fetchUnreadCount = React.useCallback(async () => {
    try {
      const response = await notificationsApi.getUnreadCount();
      const data = unwrapApiData<{ count?: number }>(response.data);
      setUnreadCount(data?.count ?? 0);
    } catch {
      // Silent fail
    }
  }, []);

  // Initial load
  React.useEffect(() => {
    fetchNotifications(page, typeFilter);
    fetchUnreadCount();
  }, [page, typeFilter, fetchNotifications, fetchUnreadCount]);

  // Mark as read
  const markAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      kwikToast.error("Failed to mark as read");
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    setIsMarkingAll(true);
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      kwikToast.success("All notifications marked as read");
    } catch {
      kwikToast.error("Failed to mark all as read");
    } finally {
      setIsMarkingAll(false);
    }
  };

  // Save preferences
  const handleSavePrefs = async () => {
    setIsSavingPrefs(true);
    // Simulate a small delay for UX feedback
    await new Promise((r) => setTimeout(r, 500));
    savePrefs(prefs);
    kwikToast.success("Notification preferences saved");
    setIsSavingPrefs(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* ==================== Section 1: Page Header ==================== */}
      <VendorPageHeader
        title="Notifications"
        description="Manage your alerts and preferences."
        actions={
          <AppButton
            variant="secondary"
            size="sm"
            onClick={markAllAsRead}
            isLoading={isMarkingAll}
            loadingLabel="Marking…"
            disabled={unreadCount === 0 || isMarkingAll}
          >
            <Bell className="h-4 w-4" />
            Mark All Read
          </AppButton>
        }
      />

      {/* ==================== Section 2: Tab Switcher ==================== */}
      <nav className="flex gap-0 border-b border-kwik-border" aria-label="Notifications tabs">
        <button
          type="button"
          onClick={() => setActiveTab("notifications")}
          className={`px-4 pb-3 text-sm font-medium transition ${
            activeTab === "notifications"
              ? "border-b-2 border-gray-900 text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Notifications
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("preferences")}
          className={`px-4 pb-3 text-sm font-medium transition ${
            activeTab === "preferences"
              ? "border-b-2 border-gray-900 text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Preferences
        </button>
      </nav>

      {/* ==================== Notifications Tab ==================== */}
      {activeTab === "notifications" && (
        <section>
          {/* Filter bar */}
          <div className="flex items-center gap-3 pb-4">
            <FieldSelect
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as TypeFilter);
                setPage(1);
              }}
              className="h-9"
              wrapperClassName="w-auto"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </FieldSelect>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{unreadCount}</span> unread
              </p>
            )}
          </div>

          {/* Notification list */}
          <div>
            {isLoading ? (
              <div className="space-y-0 divide-y divide-kwik-border">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-4 px-4 py-4">
                    <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-72" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Bell className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />
                <p className="mt-3 text-sm font-medium text-muted-foreground">{error}</p>
                <AppButton
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={() => fetchNotifications(page, typeFilter)}
                >
                  Try Again
                </AppButton>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Bell className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />
                <p className="mt-3 text-sm font-medium text-muted-foreground">
                  No notifications
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {typeFilter !== "ALL"
                    ? `No ${TYPE_OPTIONS.find((o) => o.value === typeFilter)?.label.toLowerCase()} notifications yet`
                    : "You're all caught up!"}
                </p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-kwik-border">
                  {notifications.map((notification) => {
                    const IconComponent = getTypeIcon(notification.type);
                    const iconColorClass = getTypeIconColor(notification.type);
                    const Wrapper = notification.link ? "a" : "div";

                    return (
                      <Wrapper
                        key={notification.id}
                        {...(notification.link
                          ? {
                              href: notification.link,
                              target: "_blank",
                              rel: "noopener noreferrer",
                            }
                          : {})}
                        className={`group flex items-start gap-4 px-4 py-4 transition ${
                          !notification.read ? "bg-default-100/50" : ""
                        }`}
                      >
                        {/* Type icon */}
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconColorClass}`}
                        >
                          <IconComponent className="h-5 w-5" strokeWidth={1.5} />
                        </div>

                        {/* Center content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={`text-sm ${
                                notification.read
                                  ? "font-medium text-muted-foreground"
                                  : "font-medium text-foreground"
                              }`}
                            >
                              {notification.title}
                            </p>
                            {/* Unread dot */}
                            {!notification.read && (
                              <span
                                className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500"
                                aria-label="Unread"
                              />
                            )}
                          </div>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {notification.message}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>

                        {/* Mark read button */}
                        {!notification.read && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="mt-1 shrink-0 text-xs font-medium text-muted-foreground opacity-0 transition-opacity hover:text-blue-600 group-hover:opacity-100"
                          >
                            Mark read
                          </button>
                        )}
                      </Wrapper>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t border-kwik-border pt-4 sm:flex-row">
                    <p className="text-xs text-muted-foreground">
                      Page {page} of {totalPages}
                    </p>
                    <div className="flex items-center gap-1">
                      <AppButton
                        variant="secondary"
                        size="sm"
                        disabled={page <= 1 || isLoading}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Prev
                      </AppButton>
                      {Array.from({ length: totalPages }).map((_, i) => {
                        const pageNum = i + 1;
                        if (
                          totalPages > 7 &&
                          pageNum !== 1 &&
                          pageNum !== totalPages &&
                          Math.abs(pageNum - page) > 1
                        ) {
                          if (pageNum === 2 || pageNum === totalPages - 1) {
                            return (
                              <span
                                key={pageNum}
                                className="px-2 text-xs text-muted-foreground"
                              >
                                …
                              </span>
                            );
                          }
                          return null;
                        }
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => setPage(pageNum)}
                            disabled={isLoading}
                            className={`inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm font-medium transition ${
                              page === pageNum
                                ? "border-gray-900 bg-gray-900 text-white"
                                : "border-kwik-border bg-surface text-foreground hover:border-accent"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <AppButton
                        variant="secondary"
                        size="sm"
                        disabled={page >= totalPages || isLoading}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </AppButton>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {/* ==================== Preferences Tab ==================== */}
      {activeTab === "preferences" && (
        <section>
          <div className="space-y-0 divide-y divide-kwik-border border-b border-kwik-border">
            {/* New order alerts */}
            <div className="flex items-center justify-between gap-4 px-4 py-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                  <Mail className="h-4 w-4 text-blue-600" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    New order alerts
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
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
            <div className="flex items-center justify-between gap-4 px-4 py-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50">
                  <Smartphone className="h-4 w-4 text-orange-600" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Delivery updates
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
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
            <div className="flex items-center justify-between gap-4 px-4 py-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50">
                  <Mail className="h-4 w-4 text-green-600" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Payment released
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
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
            <div className="flex items-center justify-between gap-4 px-4 py-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                  <Package className="h-4 w-4 text-amber-600" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Low stock warnings
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Get email + push alerts when products are running low
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground">Email</span>
                <AppSwitch
                  isSelected={prefs.lowStockEmail}
                  onChange={(val) => setPrefs((p) => ({ ...p, lowStockEmail: val }))}
                />
                <span className="text-xs text-muted-foreground">Push</span>
                <AppSwitch
                  isSelected={prefs.lowStockPush}
                  onChange={(val) => setPrefs((p) => ({ ...p, lowStockPush: val }))}
                />
              </div>
            </div>

            {/* Marketing emails */}
            <div className="flex items-center justify-between gap-4 px-4 py-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-50">
                  <Megaphone className="h-4 w-4 text-purple-600" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Marketing emails
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Receive promotional emails and product updates
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

          {/* Save button */}
          <div className="mt-6">
            <AppButton
              variant="primary"
              onClick={handleSavePrefs}
              isLoading={isSavingPrefs}
              loadingLabel="Saving…"
            >
              Save Preferences
            </AppButton>
          </div>
        </section>
      )}
    </motion.div>
  );
}
