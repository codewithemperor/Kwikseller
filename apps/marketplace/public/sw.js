/* eslint-disable no-restricted-globals */
/**
 * Kwikseller Marketplace Service Worker
 * - Handles web push events (shows notifications)
 * - Handles notification clicks (navigates to the relevant page)
 * - Basic offline fallback for navigation requests
 */

const CACHE_NAME = 'kwikseller-marketplace-v1';
const OFFLINE_URL = '/offline.html';

// ─── Install: precache the offline page ────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([OFFLINE_URL])).catch(() => undefined),
  );
  self.skipWaiting();
});

// ─── Activate: clean up old caches ─────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

// ─── Push: show a notification ─────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'Kwikseller', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'Kwikseller';
  const options = {
    body: data.body || data.message || '',
    icon: data.icon || '/icon.png',
    badge: data.badge || '/icon.png',
    image: data.image,
    data: {
      url: data.data?.url || '/dashboard',
      orderId: data.data?.orderId,
      type: data.data?.type,
      notificationId: data.data?.notificationId,
    },
    actions: data.actions || [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ─── Notification click: navigate to the relevant page ─────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = getNotificationUrl(event.notification.data);

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus an existing window if one is open, otherwise open a new one
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    }),
  );
});

function getNotificationUrl(data) {
  if (!data) return '/';
  if (data.url) return data.url;
  if (data.orderId) {
    if (data.type === 'ORDER_RECEIVED') return `/dashboard/orders/${data.orderId}`;
    return `/orders/${data.orderId}`;
  }
  if (data.type === 'DISPUTE_OPENED') return '/admin/disputes';
  if (data.type === 'FUNDS_RELEASED' || data.type === 'PAYMENT_HELD') return '/dashboard/wallet';
  return '/';
}
