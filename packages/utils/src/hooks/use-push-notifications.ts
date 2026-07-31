/// <reference lib="dom" />
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@kwikseller/api-client';

interface PushSubscriptionPayload {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface UsePushNotificationsReturn {
  /** Whether the browser supports push notifications + service workers */
  isSupported: boolean;
  /** Current permission state: 'default' | 'granted' | 'denied' */
  permission: NotificationPermission;
  /** Whether the user is currently subscribed */
  isSubscribed: boolean;
  /** Request permission + create a push subscription. Returns true on success. */
  subscribe: () => Promise<boolean>;
  /** Remove the current push subscription (browser + server). */
  unsubscribe: () => Promise<boolean>;
}

/**
 * usePushNotifications — a shared hook that registers/unregisters web-push
 * subscriptions for the logged-in user.
 *
 * - On `subscribe()`: requests Notification permission, creates a PushSubscription
 *   via the service worker, and POSTs it to /api/v1/notifications/push/subscribe.
 * - On `unsubscribe()`: removes the subscription from the browser + sends DELETE
 *   to /api/v1/notifications/push/unsubscribe.
 *
 * The VAPID public key is fetched from /api/v1/notifications/push/vapid-public-key.
 * Requires a service worker to be registered (the marketplace PWA registers one).
 */
export function usePushNotifications(): UsePushNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const currentEndpointRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const supported =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;
    setIsSupported(supported);
    if (supported) {
      setPermission(Notification.permission);
      // Check existing subscription on mount
      navigator.serviceWorker.ready
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => {
          if (sub) {
            setIsSubscribed(true);
            currentEndpointRef.current = sub.endpoint;
          }
        })
        .catch(() => undefined);
    }
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      // 1) Request notification permission
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return false;

      // 2) Fetch VAPID public key
      const vapidRes = await api.get<{ publicKey: string }>(
        '/notifications/push/vapid-public-key',
      );
      const publicKey = vapidRes?.data?.publicKey;
      if (!publicKey) return false;

      // 3) Convert VAPID key to Uint8Array for subscribe()
      const applicationServerKey = urlBase64ToUint8Array(publicKey);

      // 4) Register service worker (if not already) + subscribe
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      const subscription =
        existing ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as BufferSource,
        }));

      currentEndpointRef.current = subscription.endpoint;

      // 5) Send subscription to backend
      const keys = (subscription as any).keys as { p256dh: string; auth: string };
      await api.post('/notifications/push/subscribe', {
        endpoint: subscription.endpoint,
        p256dh: keys?.p256dh,
        auth: keys?.auth,
        deviceName: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
      });

      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.warn('Push subscription failed:', err);
      return false;
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        currentEndpointRef.current = sub.endpoint;
      }
      if (currentEndpointRef.current) {
        await api.delete('/notifications/push/unsubscribe', {
          data: { endpoint: currentEndpointRef.current },
        } as any);
      }
      setIsSubscribed(false);
      currentEndpointRef.current = null;
      return true;
    } catch (err) {
      console.warn('Push unsubscription failed:', err);
      return false;
    }
  }, [isSupported]);

  return { isSupported, permission, isSubscribed, subscribe, unsubscribe };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = typeof atob !== 'undefined' ? atob(base64) : '';
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}
