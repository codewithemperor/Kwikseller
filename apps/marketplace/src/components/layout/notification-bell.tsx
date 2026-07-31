"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCheck, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrderWorkflowStore } from "@/stores/order-workflow-store";
import type { WorkflowNotification } from "@/stores/order-workflow-store";

/**
 * NotificationBell — global header dropdown showing all order workflow
 * notifications (quotation received, payment confirmed, shipped, delivered,
 * dispute window, etc).
 *
 * Unread count badge on the bell; click to open a dropdown panel with the
 * list; "Mark all read" action; click a notification → navigate to its order.
 */
export function NotificationBell({ className }: { className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const notifications = useOrderWorkflowStore((s) => s.notifications);
  const markNotificationRead = useOrderWorkflowStore((s) => s.markNotificationRead);
  const clearNotifications = useOrderWorkflowStore((s) => s.clearNotifications);

  // Avoid SSR/hydration mismatch — only show the badge after mount.
  useEffect(() => setMounted(true), []);

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

  const unreadCount = mounted ? notifications.filter((n) => !n.read).length : 0;
  const displayNotifications = notifications.slice(0, 12);

  function handleNotificationClick(n: WorkflowNotification) {
    if (!n.read) markNotificationRead(n.id);
    setOpen(false);
    if (n.orderId) router.push(`/orders/${n.orderId}`);
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
                {displayNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                      <Bell className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="mt-3 text-sm font-medium text-foreground">
                      You&rsquo;re all caught up
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Order updates will appear here.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {displayNotifications.map((n) => (
                      <li key={n.id}>
                        <button
                          type="button"
                          onClick={() => handleNotificationClick(n)}
                          className={cn(
                            "flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-gray-50",
                            !n.read && "bg-primary-50/50",
                          )}
                        >
                          {!n.read ? (
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-secondary-500" />
                          ) : (
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gray-300" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-foreground">
                              {n.title}
                            </p>
                            <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-gray-500">
                              {n.body}
                            </p>
                            <p className="mt-1 text-[11px] text-gray-400">
                              {formatRelative(n.at)} • Order {n.orderRef}
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
              {displayNotifications.length > 0 ? (
                <div className="flex items-center justify-between border-t border-border bg-surface px-4 py-2.5">
                  {unreadCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => notifications.forEach((n) => !n.read && markNotificationRead(n.id))}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
                    >
                      <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400">No unread items</span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      clearNotifications();
                    }}
                    className="text-xs font-medium text-gray-500 hover:text-danger"
                  >
                    Clear all
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

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(
    new Date(iso),
  );
}
