"use client";

import { useEffect } from "react";
import { usePushNotifications, useAuthStore } from "@kwikseller/utils";

/**
 * PushNotificationManager — registers the marketplace service worker and
 * auto-subscribes the logged-in user to web push notifications.
 *
 * Mount this once near the root of the marketplace layout. It:
 *  1. Registers /sw.js on mount.
 *  2. When a user is authenticated, calls `subscribe()` to request permission
 *     and create a push subscription (silently no-ops if permission denied or
 *     push unsupported).
 *
 * The service worker (public/sw.js) handles `push` + `notificationclick` events.
 */
export function PushNotificationManager() {
  const { isSupported, permission, subscribe } = usePushNotifications();
  const user = useAuthStore((s) => s.user);
  const tokens = useAuthStore((s) => s.tokens);

  // Register the service worker on mount
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js")
      .catch((err) => console.warn("SW registration failed:", err));
  }, []);

  // Auto-subscribe when the user is logged in + permission already granted
  // (don't auto-prompt — the user enables push from their settings to avoid
  // a surprising permission popup on every login)
  useEffect(() => {
    if (!isSupported || !user || !tokens) return;
    if (permission !== "granted") return;
    subscribe().catch(() => undefined);
  }, [isSupported, user, tokens, permission, subscribe]);

  return null;
}
