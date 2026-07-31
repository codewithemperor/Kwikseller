"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCheck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkflowNotification } from "@/stores/order-workflow-store";

/**
 * OrderNotifications — shows the timeline of notifications sent for this order
 * (quotation received, payment confirmed, shipped, delivered, etc).
 *
 * Renders inline on the order detail page's side panel.
 */
export function OrderNotifications({
  notifications,
  onMarkRead,
  className,
}: {
  notifications: WorkflowNotification[];
  onMarkRead?: (id: string) => void;
  className?: string;
}) {
  const orderNotifications = notifications
    .filter((n) => n.orderId !== undefined)
    .slice(0, 8);

  if (orderNotifications.length === 0) return null;

  const unreadCount = orderNotifications.filter((n) => !n.read).length;

  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-surface p-4 sm:p-5",
        className,
      )}
      aria-label="Order notifications"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <Bell className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-heading text-sm font-semibold text-foreground">
              Updates
            </h3>
            <p className="text-xs text-gray-500">
              {orderNotifications.length} notification
              {orderNotifications.length !== 1 ? "s" : ""}
              {unreadCount > 0 ? ` • ${unreadCount} unread` : ""}
            </p>
          </div>
        </div>
        {unreadCount > 0 && onMarkRead ? (
          <button
            type="button"
            onClick={() => orderNotifications.forEach((n) => !n.read && onMarkRead(n.id))}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
          >
            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
          </button>
        ) : null}
      </div>

      <ul className="space-y-2.5">
        <AnimatePresence initial={false}>
          {orderNotifications.map((n, idx) => (
            <motion.li
              key={n.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: Math.min(idx * 0.04, 0.2) }}
              className={cn(
                "relative rounded-xl border p-3 transition",
                n.read
                  ? "border-border bg-background"
                  : "border-primary-200 bg-primary-50",
              )}
            >
              {!n.read ? (
                <span
                  className="absolute right-3 top-3 h-2 w-2 rounded-full bg-secondary-500"
                  aria-label="Unread"
                />
              ) : null}
              <p className="pr-6 text-sm font-semibold text-foreground">
                {n.title}
              </p>
              <p className="mt-0.5 text-xs leading-5 text-gray-600">{n.body}</p>
              <p className="mt-1.5 flex items-center gap-1 text-[11px] text-gray-400">
                <Clock className="h-3 w-3" />
                {formatRelative(n.at)}
              </p>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </section>
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
