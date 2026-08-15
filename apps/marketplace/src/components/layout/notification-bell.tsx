"use client";

import React, { useState, useRef, useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCheck, ChevronRight, X, AlertCircle } from "lucide-react";
import { useAuth } from "@kwikseller/utils";
import { cn } from "@/lib/utils";
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  timeAgo,
  type Notification,
} from "@/lib/notification-api";

/**
 * NotificationBell — global header dropdown showing the authenticated user's
 * real notifications from the backend (`GET /api/v1/notifications`).
 *
 * Behaviour:
 *   - When unauthenticated → renders nothing (the bell only makes sense for
 *     logged-in users; a guaranteed 401 would just spam the console).
 *   - When authenticated → shows the live unread count badge; clicking opens
 *     a dropdown with the most recent 12 notifications.
 *   - Loading → skeleton rows.
 *   - Error → friendly retry message.
 *   - Empty → "No notifications yet".
 *   - Click a notification → mark as read + navigate to its order (when the
 *     notification's `data.orderId` is present).
 *   - "Mark all read" → bulk PATCH.
 *
 * Polls every 30s (see `notification-api.ts`) so the badge stays fresh
 * without a WebSocket.
 */
export function NotificationBell({ className }: { className?: string }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  // useSyncExternalStore avoids a setState-in-effect lint violation while
  // still giving us a server-safe `mounted` flag (false on SSR, true on
  // client). This prevents hydration mismatch on the unread-count badge.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const ref = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError } = useNotifications({
    isAuthenticated,
    page: 1,
    limit: 12,
  });
  const unreadQuery = useUnreadNotificationCount({ isAuthenticated });
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  // Unauthenticated users see no bell — saves an empty UI element and a
  // guaranteed 401 from the unread-count query.
  if (!isAuthenticated) return null;

  const unreadCount = mounted ? (unreadQuery.data ?? 0) : 0;
  const notifications = data?.data ?? [];

  function handleNotificationClick(n: Notification) {
    if (!n.isRead) markAsRead.mutate(n.id);
    setOpen(false);
    const orderId =
      (n.data?.orderId as string | undefined) ??
      (n.data?.orderRef as string | undefined);
    if (orderId) router.push(`/orders/${orderId}`);
  }

  return (
    <div className={cn("relative", className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-foreground"
      >
        <Bell className="h-[18px] w-[18px]" />
        {mounted && unreadCount > 0 ? (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-secondary-500 px-1 text-[10px] font-bold text-white"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        ) : null}
      </button>

      <AnimatePresence>
        {open ? (
          <>
            {/* Mobile backdrop */}
            <div
              className="fixed inset-0 z-40 md:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] origin-top-right overflow-hidden rounded-2xl border border-border bg-background shadow-xl"
              role="dialog"
              aria-label="Notifications"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary-600" />
                  <h3 className="text-sm font-semibold text-foreground">
                    Notifications
                  </h3>
                  {unreadCount > 0 ? (
                    <span className="rounded-full bg-secondary-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {unreadCount} new
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close notifications"
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-foreground md:hidden"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* List */}
              <div className="max-h-96 overflow-y-auto">
                {isLoading ? (
                  <NotificationListSkeleton />
                ) : isError ? (
                  <NotificationListError />
                ) : notifications.length === 0 ? (
                  <EmptyState />
                ) : (
                  <ul className="divide-y divide-border">
                    {notifications.map((n) => (
                      <li key={n.id}>
                        <button
                          type="button"
                          onClick={() => handleNotificationClick(n)}
                          className={cn(
                            "flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-gray-50",
                            !n.isRead && "bg-primary-50/50",
                          )}
                        >
                          {!n.isRead ? (
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-secondary-500" />
                          ) : (
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gray-300" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-foreground">
                              {n.title}
                            </p>
                            <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-gray-500">
                              {n.message}
                            </p>
                            <p className="mt-1 text-[11px] text-gray-400">
                              {timeAgo(n.createdAt)}
                              {n.data?.orderRef
                                ? ` • ${n.data.orderRef}`
                                : n.type
                                  ? ` • ${n.type}`
                                  : ""}
                            </p>
                          </div>
                          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-gray-300" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 ? (
                <div className="flex items-center justify-between border-t border-border bg-surface px-4 py-2.5">
                  {unreadCount > 0 ? (
                    <button
                      type="button"
                      disabled={markAllAsRead.isPending}
                      onClick={() => markAllAsRead.mutate()}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50"
                    >
                      <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400">No unread items</span>
                  )}
                  <button
                    type="button"
                    onClick={() => router.push("/profile/notifications")}
                    className="text-xs font-medium text-gray-500 hover:text-primary-600"
                  >
                    View all
                  </button>
                </div>
              ) : null}
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

// ─── Internal sub-components ────────────────────────────────────────────────

function NotificationListSkeleton() {
  // 4 shimmering placeholder rows so the dropdown doesn't pop empty during
  // the initial fetch.
  return (
    <ul className="divide-y divide-border">
      {Array.from({ length: 4 }).map((_, i) => (
        <li
          key={i}
          className="flex items-start gap-3 px-4 py-3"
          aria-hidden="true"
        >
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gray-200" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-2/3 rounded bg-gray-200" />
            <div className="h-2.5 w-full rounded bg-gray-100" />
            <div className="h-2.5 w-1/3 rounded bg-gray-100" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function NotificationListError() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50">
        <AlertCircle className="h-6 w-6 text-rose-500" />
      </div>
      <p className="mt-3 text-sm font-medium text-foreground">
        Couldn&rsquo;t load notifications
      </p>
      <p className="mt-1 text-xs text-gray-500">
        Please check your connection and try again.
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
        <Bell className="h-6 w-6 text-gray-400" />
      </div>
      <p className="mt-3 text-sm font-medium text-foreground">
        No notifications yet
      </p>
      <p className="mt-1 text-xs text-gray-500">
        Order updates and alerts will appear here.
      </p>
    </div>
  );
}
