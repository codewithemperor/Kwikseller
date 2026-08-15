# Audit: Notifications + Email + Digital Delivery (Task 2-e)

**Scope:** Read-only audit of the NestJS + Prisma (SQLite) backend and the
Next.js marketplace frontend, covering notification schema, in-app
notification service, email service, event system, header notification
bell, order-event → notification/email mapping, digital product delivery,
and real-time notifications.

**TL;DR**

| Question | Answer |
|---|---|
| Is the Header notification dropdown using dummy data? | **YES** — `apps/marketplace/src/components/layout/notification-bell.tsx:32` reads from a Zustand store seeded with 3 mock notifications (`seedNotifications()` at `apps/marketplace/src/stores/order-workflow-store.ts:522`). The frontend never calls `/api/v1/vendor/notifications`. A second, unused bell at `apps/marketplace/src/components/landing/notification-bell.tsx:60-158` uses a hardcoded `sampleNotifications` array of 8 fake entries. |
| Are notifications created on order events? | **NO.** `notificationService.create()` is called only from `wallet.service.ts`, `escrow.service.ts`, and `users.service.ts` (KYC). The commerce / orders / order-operations / delivery modules have ZERO notification calls. Order placement, quoting, dispatch, delivery confirmation → no notifications. |
| Is the email service real or a stub? | **REAL provider (Nodemailer + SMTP, default SendGrid), but with a graceful fallback to log-only** if `transporter.verify()` fails (no SMTP_PASS configured). 22 Handlebars templates loaded inline. **Only 2 templates (`email-verify`, `password-reset`) are actually invoked** — and only from the auth module. 20 templates (order-confirmed, order-shipped, order-delivered, order-cancelled, payment-failed, new-order-vendor, delivery-assigned, withdrawal-processed, kyc-approved/rejected, milestone-earned, low-stock, flash-deal, referral-bonus, subscription-*, welcome, otp-verify, password-changed) are defined but NEVER invoked anywhere in the API. |
| Does any digital product delivery mechanism exist? | **PARTIAL.** The `DigitalAsset` + `Fulfillment` Prisma models exist; the `createFulfillmentsForPaidOrder` helper (`commerce.service.ts:3036-3083`) auto-creates a `DIGITAL_ACCESS` fulfilment row with `accessUrl` on payment. BUT: no email is sent with the link, no notification is created, no secure signed-URL endpoint, no `maxDownloads` / `expiresAfterDays` enforcement, and no customer-facing "my digital purchases" endpoint. |

---

## 1. Notification Schema

**File:** `apps/api/prisma/schema.prisma`

### 1.1 `Notification` model (lines 1734-1748)

```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String
  title     String
  message   String
  isRead    Boolean  @default(false)
  data      String?
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([isRead])
}
```

**Observations:**

- **Single model:** `Notification`. There is NO `UserNotification` or `InAppNotification` model — `Notification` is the only in-app notification entity.
- **Fields present:** `id`, `userId`, `type`, `title`, `message`, `isRead`, `data`, `createdAt`.
- **Missing fields** that the spec implies:
  - NO `readAt` (only a boolean `isRead` — there is no timestamp of when it was read)
  - NO `relatedEntityType` / `relatedEntityId` (cannot link a notification to its originating Order/Escrow/Withdrawal/KycDocument without parsing the JSON `data` field)
  - NO `channel` field (no in-app vs email vs sms vs push distinction at the row level — channel routing would have to be done at runtime by the consumer)
  - NO `updatedBy` / `actorUserId` (the user who triggered the notification is not stored)
  - NO `priority` / `severity` field
- **Type field:** Plain `String` — there is **NO Prisma enum** for notification types. Each call site invents its own string literal (`'WITHDRAWAL_REQUESTED'`, `'PAYMENT_HELD'`, `'FUNDS_RELEASED'`, `'ORDER_REFUNDED'`, `'DISPUTE_RESOLVED'`, `'KYC_STATUS'`). There is no compile-time guarantee of consistency.
- **Tied to a User:** Yes — `userId` is required and cascades on delete.
- **Vendor vs customer targeting:** The model itself is user-agnostic (any user can be the recipient), but in practice all current call sites target either the vendor (escrow/wallet events) or the user who uploaded a KYC document. The buyer is notified ONLY when a dispute is resolved (`escrow.service.ts:757-812`). There is no explicit "audience" or "role" field — routing is decided at the call site.
- **`data` field:** Stored as `String?` and JSON-stringified at write time (`notification.service.ts:29`), parsed back at read time (`notification.service.ts:57`). Works but loses type safety and queryability.

### 1.2 `PushSubscription` model (lines 1750-1762)

```prisma
model PushSubscription {
  id         String   @id @default(cuid())
  userId     String
  endpoint   String   @unique
  p256dh     String
  auth       String
  deviceName String?
  createdAt  DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

Used by `PushNotificationsController` (`apps/api/src/modules/notifications/push-notifications.controller.ts`) for web-push subscription registration. Per-device dedup by `endpoint`.

### 1.3 `EmailLog` model (lines 1766-1775)

```prisma
model EmailLog {
  id        String   @id @default(cuid())
  recipient String
  template  String
  status    String
  error     String?
  sentAt    DateTime @default(now())

  @@index([recipient])
}
```

Defined but **never written to**. `EmailService.sendEmail()` logs to the NestJS logger but does NOT persist an `EmailLog` row. So there is no DB-level audit trail of sent emails.

### 1.4 Notification type values (invented ad-hoc)

Grep of `type:` literals in `notificationService.create()` calls:

| Type string | File:line | Trigger |
|---|---|---|
| `'WITHDRAWAL_REQUESTED'` | `payments/wallet.service.ts:93` | Vendor requests payout |
| `'WITHDRAWAL_PROCESSED'` / `'WITHDRAWAL_FAILED'` | `payments/wallet.service.ts:355` | Admin processes withdrawal |
| `'PAYMENT_HELD'` | `payments/escrow.service.ts:84` | Customer pays → funds held in escrow (vendor notified) |
| `'FUNDS_RELEASED'` | `payments/escrow.service.ts:214` | Escrow released to vendor wallet |
| `'ORDER_REFUNDED'` | `payments/escrow.service.ts:524` | Refund issued to customer |
| `'DISPUTE_RESOLVED'` | `payments/escrow.service.ts:758` | Admin resolves dispute (both parties notified) |
| `'KYC_STATUS'` | `modules/users/users.service.ts:453` and `:561` | KYC document uploaded or approved/rejected |

---

## 2. Notification Service + Controller

### 2.1 Service — `apps/api/src/common/services/notification.service.ts`

```ts
@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateNotificationDto) {                       // line 22
    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        data: dto.data ? JSON.stringify(dto.data) : null,
      },
    });
    this.eventEmitter.emit('notification.created', {               // line 34
      userId: dto.userId,
      notification,
    });
    return notification;
  }

  async getUserNotifications(userId, page = 1, limit = 20) {…}     // line 42
  async markAsRead(notificationId, userId) {…}                     // line 63
  async markAllAsRead(userId) {…}                                  // line 70
  async getUnreadCount(userId): Promise<number> {…}                // line 77
}
```

The `create()` method:
1. Persists a row in the `Notification` table.
2. Emits a `notification.created` event (consumed by `NotificationEventListener` for web-push dispatch — see §4).

### 2.2 Controller — `apps/api/src/modules/notifications/notifications.controller.ts`

`VendorNotificationsController` is mounted at `@Controller('vendor/notifications')` with `@UseGuards(JwtAuthGuard)`. Available endpoints (all require JWT auth):

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/vendor/notifications` | JWT | List notifications (paginated, optional `type` filter) |
| `GET` | `/api/v1/vendor/notifications/unread-count` | JWT | Unread count |
| `PATCH` | `/api/v1/vendor/notifications/:id/read` | JWT | Mark single notification as read |
| `POST` | `/api/v1/vendor/notifications/read-all` | JWT | Mark all as read |

**Critical gap:** The route is `vendor/notifications` — it is intended for VENDOR notifications only. There is **NO customer-facing `/api/v1/notifications` endpoint**. A buyer logged into the marketplace has no API to list their notifications.

### 2.3 Push controller — `apps/api/src/modules/notifications/push-notifications.controller.ts`

`PushNotificationsController` at `@Controller('notifications/push')` with `@UseGuards(JwtAuthGuard)`:

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/notifications/push/vapid-public-key` | Returns the VAPID public key |
| `POST` | `/api/v1/notifications/push/subscribe` | Register a push subscription (endpoint, p256dh, auth, deviceName) |
| `DELETE` | `/api/v1/notifications/push/unsubscribe` | Remove a push subscription by endpoint |

### 2.4 `NotificationService.create()` call sites (full audit)

Grep of `notificationService.create` and `prisma.notification.create` across `apps/api/src/`:

| # | File:line | Triggering event | Recipient |
|---|---|---|---|
| 1 | `apps/api/src/payments/wallet.service.ts:91` | Vendor requests payout (`requestPayout`) | Vendor |
| 2 | `apps/api/src/payments/wallet.service.ts:353` | Admin processes withdrawal (`processWithdrawal`) | Vendor |
| 3 | `apps/api/src/payments/escrow.service.ts:82` | Customer pays → escrow held (`holdPayment`) | Vendor |
| 4 | `apps/api/src/payments/escrow.service.ts:212` | Escrow released to vendor wallet (`releaseFunds`) | Vendor |
| 5 | `apps/api/src/payments/escrow.service.ts:522` | Refund issued to customer (`refundToCustomer`) | Vendor |
| 6 | `apps/api/src/payments/escrow.service.ts:757` | Dispute resolved (`notifyDisputeResolution`) | BOTH vendor + buyer |
| 7 | `apps/api/src/modules/users/users.service.ts:451` | KYC document uploaded | The user who uploaded |
| 8 | `apps/api/src/modules/users/users.service.ts:559` | KYC document approved/rejected by admin | The user who owns the document |

**Modules that NEVER create notifications:**

- `apps/api/src/modules/commerce/` — order placement, checkout, payment verification, vendor order list — confirmed by grep: 0 matches for `notificationService|emailService|sendEmail|prisma.notification|@OnEvent|eventEmitter`.
- `apps/api/src/modules/orders/` — confirmed: 0 matches.
- `apps/api/src/modules/order-operations/` — confirmed: 0 matches. `transitionOrderStatus()` (line 104-166) updates order status, creates a fulfillment row, writes an audit log, but does NOT notify or email anyone.
- `apps/api/src/modules/delivery/` — confirmed: 0 matches.

**Side-effect:** Order placement, vendor quotation submission, vendor order acceptance/rejection, "ready for pickup" / "dispatched" / "delivered" transitions → **NO in-app notification AND NO email**.

---

## 3. Email Service

**File:** `apps/api/src/common/services/email.service.ts` (446 lines)

### 3.1 Provider — REAL (Nodemailer + SMTP)

```ts
import * as nodemailer from 'nodemailer';
import Handlebars from 'handlebars';

private async initializeTransporter() {                  // line 34
  const smtpHost = this.configService.get<string>('email.host', 'smtp.sendgrid.net');
  const smtpPort = this.configService.get<number>('email.port', 587);
  const smtpUser = this.configService.get<string>('email.user', 'apikey');
  const smtpPassRaw = this.configService.get<string>('email.pass');
  …
  this.transporter = nodemailer.createTransport({
    host: smtpHost, port: smtpPort, secure, auth: smtpPass ? { user, pass } : undefined,
    tls: { ciphers: 'SSLv3' }, pool: true, maxConnections: 5, maxMessages: 100,
  });
  try {
    await this.transporter.verify();
    this.logger.log('Email transporter initialized successfully');
  } catch {
    this.logger.warn('Email transporter not verified - emails will be logged only');
  }
}
```

SMTP config defaults (from `apps/api/src/app.module.ts:66-75`):

```ts
email: {
  host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  user: process.env.SMTP_USER || 'apikey',
  pass: process.env.SMTP_PASS || process.env.SENDGRID_API_KEY || '',
  from: process.env.SMTP_FROM || process.env.SENDGRID_FROM_EMAIL || 'noreply@kwikseller.com',
},
```

**Behaviour summary:** This is a **real** SMTP-backed email service (configured for SendGrid by default, but Gmail SMTP is also supported — there's a special branch that strips whitespace from the password if the host is `gmail.com`). It does NOT silently drop emails — it attempts `transporter.sendMail()` and returns `{ success: false, error }` on failure. If SMTP_PASS is missing, `transporter.verify()` will fail on init and log the warning, but `sendEmail()` will still attempt the send (and fail/log). So in dev without SMTP creds, this effectively becomes a log-only stub.

A `GMAIL-SMTP-SETUP.md` doc exists at `/home/z/my-project/docs/GMAIL-SMTP-SETUP.md`, indicating Gmail SMTP is the documented dev path.

### 3.2 Send method signature

```ts
async sendEmail(
  to: string | string[],
  subject: string,
  template: string,
  variables: Record<string, unknown>,
): Promise<{ success: boolean; error?: string }>           // line 120
```

`attachments` is **NOT** exposed on `sendEmail()` — although the `EmailOptions` interface (lines 6-16) defines an optional `attachments` array, the public `sendEmail()` method does not accept or forward attachments to `mailOptions`. So **email attachments are not currently usable** — relevant for digital-product delivery via email.

### 3.3 Templates (22 total, inline strings)

Loaded in `loadTemplates()` (lines 70-115) into a `Map<string, HandlebarsTemplateDelegate>`:

| # | Template key | Defined | Actually invoked? |
|---|---|---|---|
| 1 | `welcome` | line 86 | **NO** — never called |
| 2 | `email-verify` | line 87 | YES — `auth.service.ts:338`, `:405`, `:798`; `auth.controller.ts:290` |
| 3 | `otp-verify` | line 88 | **NO** — never called |
| 4 | `password-reset` | line 89 | YES — `auth.service.ts:627` |
| 5 | `password-changed` | line 90 | **NO** — `changePassword()` (auth.service.ts:815-855) writes audit log only, no email |
| 6 | `order-confirmed` | line 91 | **NO** |
| 7 | `order-shipped` | line 92 | **NO** |
| 8 | `order-delivered` | line 93 | **NO** |
| 9 | `order-cancelled` | line 94 | **NO** |
| 10 | `subscription-renewed` | line 95 | **NO** |
| 11 | `subscription-expiring-7d` | line 96 | **NO** |
| 12 | `subscription-expiring-1d` | line 97 | **NO** |
| 13 | `payment-failed` | line 98 | **NO** |
| 14 | `kyc-approved` | line 99 | **NO** |
| 15 | `kyc-rejected` | line 100 | **NO** |
| 16 | `milestone-earned` | line 101 | **NO** |
| 17 | `withdrawal-processed` | line 102 | **NO** (withdrawal only creates an in-app Notification, no email) |
| 18 | `new-order-vendor` | line 103 | **NO** (vendors never get an email for new orders) |
| 19 | `delivery-assigned` | line 104 | **NO** |
| 20 | `low-stock` | line 105 | **NO** |
| 21 | `flash-deal` | line 106 | **NO** |
| 22 | `referral-bonus` | line 107 | **NO** |

**20 of 22 templates are dead code.** Of the 5 order-related templates (`order-confirmed`, `order-shipped`, `order-delivered`, `order-cancelled`, `new-order-vendor`), **none** are ever invoked — no order event triggers an email.

### 3.4 `emailService.sendEmail()` call sites (full audit)

Grep of `emailService.sendEmail|sendEmail\(|emailService.send` across `apps/api/src/`:

| # | File:line | Trigger | Template |
|---|---|---|---|
| 1 | `apps/api/src/modules/auth/auth.service.ts:335` | User registers | `email-verify` |
| 2 | `apps/api/src/modules/auth/auth.service.ts:402` | User logs in but email is unverified | `email-verify` |
| 3 | `apps/api/src/modules/auth/auth.service.ts:624` | User requests password reset | `password-reset` |
| 4 | `apps/api/src/modules/auth/auth.service.ts:795` | User resends email verification | `email-verify` |
| 5 | `apps/api/src/modules/auth/auth.controller.ts:287` | User initiates email change | `email-verify` |

**ALL 5 call sites are in the auth module.** ZERO order/escrow/wallet/KYC emails are sent. KYC approval/rejection creates an in-app notification but does NOT send the `kyc-approved` / `kyc-rejected` email — same for withdrawal (`withdrawal-processed`), new order (`new-order-vendor`), delivery assignment (`delivery-assigned`), and all order status transitions.

---

## 4. Event / Domain Event System

### 4.1 EventEmitterModule is configured

`apps/api/src/app.module.ts:92-100`:

```ts
EventEmitterModule.forRoot({
  wildcard: true,
  delimiter: '.',
  newListener: false,
  removeListener: false,
  maxListeners: 20,
  verboseMemoryLeak: true,
  ignoreErrors: false,
}),
```

**Note:** `EventEmitterModule` is ALSO imported in `apps/api/src/common/shared.module.ts:20-28` with a slightly different config (`maxListeners: 10`). SharedModule is `@Global()`, so its config likely wins for DI consumers — but the `EventEmitter2` instance is shared across the app. Either way, the emitter is wired up and `NotificationService` injects it successfully.

### 4.2 `@OnEvent` handlers (full audit)

Grep of `@OnEvent` across `apps/api/src/` returned **1 match only**:

| File:line | Event | Handler action |
|---|---|---|
| `apps/api/src/common/services/notification-event.listener.ts:24` | `notification.created` | Looks up the user's `PushSubscription` rows, builds a push payload, calls `pushService.sendPushToMany()`. Best-effort: any failure is logged and swallowed. |

```ts
@OnEvent('notification.created')
async handleNotificationCreated(event: { userId, notification }) {
  const subscriptions = await this.prisma.pushSubscription.findMany({
    where: { userId: event.userId },
  });
  if (!subscriptions || subscriptions.length === 0) return;
  const payload = this.pushService.createOrderStatusPayload(
    event.notification.id, event.notification.type, event.notification.title,
  );
  payload.title = event.notification.title;
  payload.body  = event.notification.message;
  payload.data  = { ...payload.data, type: event.notification.type, url: '/dashboard/notifications' };
  await this.pushService.sendPushToMany(
    subscriptions.map((s) => ({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } })),
    payload,
  );
}
```

### 4.3 Domain events emitted

Grep of `eventEmitter.emit|.emit(` across `apps/api/src/` returned **1 match only**:

| File:line | Event emitted |
|---|---|
| `apps/api/src/common/services/notification.service.ts:34` | `notification.created` |

**There are NO order domain events.** No `@OnEvent('order.placed')`, no `order.paid`, no `order.shipped`, no `order.delivered`, no `order.cancelled`, no `quote.submitted`, no `escrow.released` event handler. The `releaseFunds()` and `holdPayment()` methods in `EscrowService` do the work synchronously and call `notificationService.create()` inline — there is no event-driven decoupling between the order lifecycle and the notification system.

### 4.4 How side-effects are triggered today

Because there is no event bus for order events, side-effects are inline direct service calls:

- `EscrowService.holdPayment()` → inline `this.notificationService.create({type: 'PAYMENT_HELD', …})`
- `EscrowService.releaseFunds()` → inline `this.notificationService.create({type: 'FUNDS_RELEASED', …})` + inline `wallet.update()` to credit vendor wallet
- `EscrowService.refundToCustomer()` → inline `this.notificationService.create({type: 'ORDER_REFUNDED', …})`
- `EscrowService.notifyDisputeResolution()` → inline `Promise.allSettled` of `notificationService.create()` for both parties
- `WalletService.requestPayout()` / `processWithdrawal()` → inline `notificationService.create()`

The commerce/orders/order-operations modules do NOT participate in this pattern at all — they don't even call `notificationService`.

---

## 5. Header Notification Component (Frontend)

### 5.1 Two notification-bell components exist

| File | Used in marketplace header? | Data source |
|---|---|---|
| `apps/marketplace/src/components/layout/notification-bell.tsx` | **YES** — `apps/marketplace/src/components/layout/marketplace-layout.tsx:23,466` imports `NotificationBell` from `@/components/layout/notification-bell` | Zustand store `useOrderWorkflowStore` (mock seed data persisted to localStorage) |
| `apps/marketplace/src/components/landing/notification-bell.tsx` | NO (orphaned) | Hardcoded `sampleNotifications` array (8 fake entries) |

### 5.2 The ACTIVE header bell uses mock data — NOT the API

`apps/marketplace/src/components/layout/notification-bell.tsx:32-34`:

```tsx
const notifications = useOrderWorkflowStore((s) => s.notifications);
const markNotificationRead = useOrderWorkflowStore((s) => s.markNotificationRead);
const clearNotifications = useOrderWorkflowStore((s) => s.clearNotifications);
```

`apps/marketplace/src/stores/order-workflow-store.ts:1-17` (store header comment):

```ts
/**
 * Zustand store (persisted) holding mock orders + their full workflow state:
 * status, quotation, escrow, dispute, fulfilment steps, and an audit-trail
 * timeline.
 *
 * The store is the UI's source of truth for the order workflow in this sandbox
 * (no live API). It delegates escrow mutations to `lib/escrow.ts` so the escrow
 * service can later be swapped for `escrowApi` from `@kwikseller/api-client`
 * without changing any component code.
 *
 * Seeded with 3 mock orders covering three distinct stages:
 *   - order-aurora-001: PENDING_QUOTE  → buyer just placed order, vendor hasn't quoted yet
 *   - order-aurora-002: DELIVERED      → in dispute window (escrow HELD)
 *   - order-aurora-003: RECEIVED       → escrow RELEASED, terminal-ish state
 */
```

The store's `notifications` array is initialized with **3 hardcoded mock notifications** via `seedNotifications()` at `apps/marketplace/src/stores/order-workflow-store.ts:522-562`:

```ts
function seedNotifications(): WorkflowNotification[] {
  return [
    { id: "ntf-001", templateKey: "DISPUTE_WINDOW_OPENED", title: "Dispute window open",
      body: interpolate(NOTIFICATION_TEMPLATES.DISPUTE_WINDOW_OPENED.body, { orderRef: "KW-AUR-002" }),
      at: isoHoursAgo(8), orderId: "order-aurora-002", orderRef: "KW-AUR-002", read: false },
    { id: "ntf-002", templateKey: "ORDER_DELIVERED", title: "Order delivered",
      body: interpolate(NOTIFICATION_TEMPLATES.ORDER_DELIVERED.body, { orderRef: "KW-AUR-002" }),
      at: isoHoursAgo(8), orderId: "order-aurora-002", orderRef: "KW-AUR-002", read: false },
    { id: "ntf-003", templateKey: "QUOTATION_RECEIVED", title: "Quotation ready",
      body: interpolate(NOTIFICATION_TEMPLATES.QUOTATION_RECEIVED.body,
        { orderRef: "KW-AUR-001", vendorName: MOCK_VENDOR.name }),
      at: isoHoursAgo(2), orderId: "order-aurora-001", orderRef: "KW-AUR-001", read: false },
  ];
}
```

The store is wrapped in `persist(...)` (line 567), so these seed notifications are written to `localStorage` and survive reloads. The bell's unread count badge is computed from this array (`notification-bell.tsx:55`):

```tsx
const unreadCount = mounted ? notifications.filter((n) => !n.read).length : 0;
```

→ The badge shows `3` (the seed unread count) on a fresh install and stays at whatever the local Zustand state says.

### 5.3 The marketplace never calls the backend notification API

Grep of `notification` across `apps/marketplace/src/lib/` returned only references to `notification-preferences` (a settings endpoint, see §5.5) — there is NO `api.get('vendor/notifications')` or `api.get('notifications')` call anywhere in the marketplace frontend.

The intended endpoint `GET /api/v1/vendor/notifications` DOES exist on the backend (`apps/api/src/modules/notifications/notifications.controller.ts:26`) — but the frontend does not call it. The bell dropdown is 100% client-side mock data.

### 5.4 The orphaned `landing/notification-bell.tsx` (also dummy)

`apps/marketplace/src/components/landing/notification-bell.tsx:60-158` contains a hardcoded `sampleNotifications` array of 8 fake entries:

```tsx
const now = new Date()
const sampleNotifications: Notification[] = [
  { id: 'notif-1', icon: Package, title: 'Order #KW-2847 shipped',
    description: 'Your Ankara dress order has been picked up by the courier',
    time: new Date(now.getTime() - 5 * 60 * 1000), unread: true, action: 'Track Order',
    category: 'orders', iconColor: 'text-primary', iconBg: 'bg-primary/10' },
  { id: 'notif-2', icon: Zap, title: 'Flash deal alert',
    description: 'iPhone 15 Pro 40% off — ends in 2h', … },
  … 6 more fake entries …
]
```

This component is NOT imported by `marketplace-layout.tsx` (which uses `layout/notification-bell.tsx` instead). It appears to be dead code from an earlier landing-page design. Confirmed via grep: `apps/marketplace/src/components/landing/notification-bell.tsx:202` is the only export site; no other file imports `NotificationBell` from `landing/`.

### 5.5 The `/profile/notifications` page is a PREFERENCES page, not a list

`apps/marketplace/src/app/profile/notifications/page.tsx` is NOT a notification list — it's a channel-preferences page (toggle email/push/sms per category, do-not-disturb hours, preferred language). It calls hooks from `apps/marketplace/src/lib/order-api.ts:630-680`:

```ts
export function useNotificationPreferences() {
  return useQuery<NotificationPreferences>({
    queryKey: ["notification-preferences"],
    queryFn: async () => {
      const res = await api.get<NotificationPreferences>(
        "users/me/notification-preferences",  // ← ENDPOINT DOES NOT EXIST ON BACKEND
      );
      return res.data;
    },
  });
}
```

**Critical gap:** `GET /api/v1/users/me/notification-preferences` and `PUT /api/v1/users/me/notification-preferences` are called by the frontend, but the backend has NO such endpoint — grep of `notification-preferences|notificationPreferences` across `apps/api/src/` returned 0 matches. The Prisma schema has no `NotificationPreference` model either. So this page currently 404s against the real API (only works against the dummy-data API at `apps/marketplace/src/lib/dummy-data/user.ts:624-720`).

---

## 6. Order Event → Notification Mapping

| # | Order event | In-App Notification? | Email? | File:line if yes |
|---|---|---|---|---|
| 1 | Order placed (checkout) | **NO** | **NO** | — (commerce.service.ts has no notification/email calls) |
| 2 | Vendor submitted quote | **NO** | **NO** | — (no quotation workflow on the backend; only the frontend mock store has it) |
| 3 | Vendor changed quote | **NO** | **NO** | — |
| 4 | Quote accepted (by buyer) | **NO** | **NO** | — |
| 5 | Quote reduction requested | **NO** | **NO** | — |
| 6 | Payment successful | **PARTIAL** — vendor gets `PAYMENT_HELD` notification via `escrow.service.ts:82` | **NO** | escrow.service.ts:82 (vendor only; buyer gets nothing) |
| 7 | Payment failed | **NO** | **NO** | — (the `payment-failed` email template exists but is never invoked) |
| 8 | Order ready for pickup | **NO** | **NO** | — (order-operations.service.ts `transitionOrderStatus` action='ready' just updates status) |
| 9 | Order dispatched / shipped | **NO** | **NO** | — (order-operations.service.ts action='prepare' just updates status to PROCESSING) |
| 10 | Order delivered | **NO** | **NO** | — (no delivery-confirmation notification on the buyer side) |
| 11 | Order confirmed (vendor accepts) | **NO** | **NO** | — (order-operations.service.ts action='accept' just updates status to CONFIRMED) |
| 12 | Order cancelled | **NO** | **NO** | — (order-operations.service.ts action='cancel' / 'reject' just updates status) |
| 13 | Refund initiated | **YES** — vendor gets `ORDER_REFUNDED` notification via `escrow.service.ts:522` | **NO** | escrow.service.ts:522 (vendor only) |
| 14 | Digital product ready | **NO** | **NO** | — (`createFulfillmentsForPaidOrder` at commerce.service.ts:3036 creates a Fulfillment row but no notification/email) |
| 15 | KwisCrow (escrow) released | **YES** — vendor gets `FUNDS_RELEASED` notification via `escrow.service.ts:212` | **NO** | escrow.service.ts:212 (vendor only) |
| 16 | Wallet credited | **NO** (no separate notification beyond `FUNDS_RELEASED`) | **NO** | — (`creditWallet` at wallet.service.ts:238 just updates the wallet row; the notification is sent by the caller `releaseFunds`, not by `creditWallet` itself) |
| — | Withdrawal requested | YES — `wallet.service.ts:91` | NO | wallet.service.ts:91 |
| — | Withdrawal processed/failed | YES — `wallet.service.ts:353` | NO (template `withdrawal-processed` exists but unused) | wallet.service.ts:353 |
| — | Dispute opened | **NO** | **NO** | — (`freezeForDispute` at escrow.service.ts:248 just updates escrow status) |
| — | Dispute resolved | YES — both parties via `escrow.service.ts:757` | NO | escrow.service.ts:757 |
| — | KYC document uploaded | YES — `users.service.ts:451` | NO | users.service.ts:451 |
| — | KYC approved/rejected | YES — `users.service.ts:559` | NO (templates `kyc-approved`/`kyc-rejected` exist but unused) | users.service.ts:559 |

**Scorecard:** Of the 16 spec-required order events, **only 2 generate any in-app notification** (Payment successful → vendor only; Refund initiated → vendor only; Escrow released → vendor only). **ZERO events send an email to anyone.** Buyers never receive any in-app notification for any order event except being a party to a dispute resolution.

---

## 7. Digital Product Delivery

### 7.1 Prisma models

**`DigitalAsset`** (`apps/api/prisma/schema.prisma:919-941`):

```prisma
model DigitalAsset {
  id               String              @id @default(cuid())
  productId        String
  variantId        String?
  deliveryType     DigitalDeliveryType @default(DOWNLOAD)
  name             String
  fileUrl          String?
  accessUrl        String?
  licenseKey       String?
  maxDownloads     Int?
  expiresAfterDays Int?
  isActive         Boolean             @default(true)
  createdAt        DateTime            @default(now())
  updatedAt        DateTime            @updatedAt
  product Product @relation(...)
  variant ProductVariant? @relation(...)
  fulfillments Fulfillment[]
  @@index([productId])  @@index([variantId])  @@index([isActive])
}
```

`DigitalDeliveryType` enum (defined elsewhere in schema) has values `DOWNLOAD | LICENSE_KEY | EXTERNAL_ACCESS` (confirmed via `apps/api/src/modules/commerce/commerce.dto.ts:177`).

**`Fulfillment`** (`apps/api/prisma/schema.prisma:1309-1331`):

```prisma
model Fulfillment {
  id             String            @id @default(cuid())
  orderId        String
  orderItemId    String?
  type           FulfillmentType
  status         FulfillmentStatus @default(PENDING)
  manualCarrier  String?
  trackingNumber String?
  digitalAssetId String?
  accessUrl      String?
  deliveredAt    DateTime?
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt
  order        Order         @relation(...)
  orderItem    OrderItem?    @relation(...)
  digitalAsset DigitalAsset? @relation(...)
  @@index([orderId])  @@index([orderItemId])  @@index([status])  @@index([type])
}
```

### 7.2 Vendor endpoint to register a digital asset

`apps/api/src/modules/commerce/commerce.controller.ts:266-268`:

```ts
@Post('digital-assets')
addDigitalAsset(@CurrentUser() user: any, @Body() dto: DigitalAssetDto) {
  return this.commerce.addDigitalAsset(user, dto);
}
```

`apps/api/src/modules/commerce/commerce.service.ts:1739-1752`:

```ts
async addDigitalAsset(user: AuthContext, dto: DigitalAssetDto) {
  const storeId = await this.resolveStoreId(user);
  await this.assertVendorProductOwnership(storeId, dto.productId);
  return this.db().digitalAsset?.create({
    data: {
      productId: dto.productId, variantId: dto.variantId,
      name: dto.name, deliveryType: dto.deliveryType,
      fileUrl: dto.fileUrl, licenseKey: dto.licenseKey,
    },
  });
}
```

### 7.3 Auto-fulfilment on payment

`apps/api/src/modules/commerce/commerce.service.ts:3036-3083` — `createFulfillmentsForPaidOrder`:

```ts
private async createFulfillmentsForPaidOrder(tx: any, order: any) {
  const existingByItem = new Set((order.fulfillments ?? []).map((f: any) => f.orderItemId));
  for (const item of order.items ?? []) {
    if (existingByItem.has(item.id)) continue;
    if (item.productType === 'DIGITAL') {
      const digitalAsset = item.product?.digitalAssets?.find((asset: any) => asset.isActive);
      if (!digitalAsset) {
        await tx.fulfillment.create({
          data: { orderId: order.id, orderItemId: item.id, type: 'DIGITAL_ACCESS', status: 'FAILED' },
        });
        continue;
      }
      await tx.fulfillment.create({
        data: {
          orderId: order.id, orderItemId: item.id,
          type: 'DIGITAL_ACCESS', status: 'READY',
          digitalAssetId: digitalAsset.id,
          accessUrl: digitalAsset.accessUrl ?? digitalAsset.fileUrl,   // ← plain copy
        },
      });
      await tx.orderItem.update({ where: { id: item.id }, data: { fulfillmentStatus: 'READY' } });
    } else {
      await tx.fulfillment.create({
        data: { orderId: order.id, orderItemId: item.id, type: 'PHYSICAL_MANUAL', status: 'PENDING' },
      });
    }
  }
}
```

### 7.4 What's MISSING

| Capability | Status | Evidence |
|---|---|---|
| Email with download/access link | **MISSING** | `emailService.sendEmail()` is never called with the access URL; the `EmailService.sendEmail()` signature doesn't even accept attachments |
| In-app notification "Your digital product is ready" | **MISSING** | No `notificationService.create()` call in `createFulfillmentsForPaidOrder` |
| Secure signed-URL download endpoint | **MISSING** | No `@Get('digital-assets/:id/download')` or signed-URL generation anywhere; the `accessUrl` stored on the Fulfillment row is the vendor-supplied `digitalAsset.accessUrl ?? digitalAsset.fileUrl` — could be a public S3/Cloudinary URL with no expiry |
| `maxDownloads` enforcement | **MISSING** | The `DigitalAsset.maxDownloads` field exists in the schema but no code ever checks it. There's no download counter column either |
| `expiresAfterDays` enforcement | **MISSING** | The `DigitalAsset.expiresAfterDays` field exists but no code computes expiry or rejects access based on it |
| Customer-facing "my digital purchases" endpoint | **MISSING** | No `@Get('orders/:id/digital-assets')` or `@Get('me/digital-products')` endpoint exists. The customer would have to fetch their order via `GET /api/v1/orders/:orderId` and walk `order.fulfillments[].accessUrl` themselves — and the orders controller's `GET /:orderId` may not even include `fulfillments` in the response |
| License-key delivery | **Partial — schema only** | `DigitalAsset.licenseKey` is stored but the fulfilment flow copies only `accessUrl ?? fileUrl`, not the license key. A `LICENSE_KEY`-type asset would have its key stranded |

**Conclusion:** There is a *database-level* digital delivery mechanism (Fulfillment row with `DIGITAL_ACCESS` type, `READY` status, and an `accessUrl` is auto-created when payment succeeds), but there is **no customer-facing delivery** (no email, no notification, no secure download endpoint). The buyer would only discover their access URL by manually inspecting their order's `fulfillments` relation via the API.

---

## 8. Real-time Notifications

### 8.1 NestJS API

Grep of `WebSocketGateway|@WebSocketServer|socket.io|@SubscribeMessage` across `apps/api/src/` → **0 matches.**

The NestJS API has **no WebSocket gateway**. There is no real-time push of notifications to a connected browser session. The closest thing is **web push** (VAPID + the `PushService` at `apps/api/src/common/services/push.service.ts`), which fires from the `notification.created` event listener (see §4.2) — but web push requires the user to (a) have a registered `PushSubscription` and (b) have the browser/service worker configured to display push notifications. The PushService also gracefully no-ops if VAPID keys aren't configured (sandbox default).

### 8.2 Standalone example

`examples/websocket/server.ts` (port 3003) — a standalone Socket.io **chat demo** that has no connection to the NestJS API and no notification logic. It only handles `join` / `message` / `disconnect` chat events.

`examples/websocket/frontend.tsx` — a chat UI demo that connects to the standalone server via `io('/?XTransformPort=3003', …)`.

These are illustrative scaffolding, NOT a notifications real-time channel.

### 8.3 Marketplace frontend

Grep of `socket.io|WebSocket|useWebSocket|io\(|new WebSocket` across `apps/marketplace/src/` → **0 matches.**

The marketplace frontend does NOT subscribe to any socket. There is no real-time notification feed. The bell dropdown renders whatever is in the Zustand `useOrderWorkflowStore.notifications` array (mock seed data) at mount time, and updates only when the user takes a local action (mark as read, clear) — there is no live data refresh.

### 8.4 `mini-services/` folder

The user prompt mentions checking a `mini-services/` folder. **This folder does not exist** in the project — `LS /home/z/my-project/` shows no `mini-services/` directory. The only related artefacts are `examples/websocket/server.ts` and `examples/websocket/frontend.tsx` (covered above).

---

## 9. Gaps & Observations

### 9.1 Dummy Data Locations

| File:line | What's hardcoded |
|---|---|
| `apps/marketplace/src/stores/order-workflow-store.ts:522-562` | `seedNotifications()` — 3 mock notifications (`ntf-001` to `ntf-003`) with fake order refs `KW-AUR-001` / `KW-AUR-002`. Persisted to localStorage via `persist(...)`. **This is what the active header bell renders.** |
| `apps/marketplace/src/stores/order-workflow-store.ts:230+` | `seedOrders()` — 3 mock orders (`order-aurora-001/002/003`) with mock items, quotations, escrow state, timeline events |
| `apps/marketplace/src/components/landing/notification-bell.tsx:60-158` | `sampleNotifications` — 8 hardcoded fake notifications (Order shipped, Flash deal, Review, Order delivered, KwikCoins, System update, Order confirmed, Scheduled maintenance). **Orphaned — not imported by the active layout.** |
| `apps/marketplace/src/lib/dummy-data/user.ts:624-720` | Mock `NotificationPreferences` store + `getNotificationPreferences` / `updateNotificationPreferences` — used by the dummy-data API when `NEXT_PUBLIC_USE_DUMMY_DATA=true`. The real backend endpoint is missing. |

### 9.2 Critical Gaps

1. **Header notification dropdown uses 100% mock data.** `apps/marketplace/src/components/layout/notification-bell.tsx:32` pulls from a Zustand store seeded with 3 fake notifications. The actual backend endpoint `GET /api/v1/vendor/notifications` exists and works but is never called from the marketplace frontend.

2. **The notification system is disconnected from order events.** Of the 16 spec-required order events (placed, quoted, paid, delivered, dispatched, delivered, confirmed, cancelled, refunded, digital ready, escrow released, etc.), only **3** generate any in-app notification — and all 3 are vendor-side (payment held, refund issued, escrow released). The buyer NEVER receives an in-app notification for ANY order event (except being a party to a dispute resolution). The commerce / orders / order-operations / delivery modules have ZERO `notificationService` calls.

3. **The email service is real but barely used.** Nodemailer + SMTP (SendGrid by default) is fully configured, 22 Handlebars templates are loaded — but only **2 templates are actually invoked** (`email-verify`, `password-reset`), and only from the auth module. ZERO order-related emails are sent. The 5 order templates (`order-confirmed`, `order-shipped`, `order-delivered`, `order-cancelled`, `new-order-vendor`) are dead code.

4. **No order domain events are emitted.** The `EventEmitterModule` is configured, and one `@OnEvent('notification.created')` handler exists (for web-push dispatch), but no `order.placed` / `order.paid` / `order.shipped` / `order.delivered` events are ever emitted. Side-effects in `EscrowService` are inline direct calls. There is no decoupling between the order lifecycle and the notification/email systems.

5. **No customer-facing notification endpoint.** The only notification-listing endpoint is `GET /api/v1/vendor/notifications` — vendor-scoped. There is no `GET /api/v1/notifications` for buyers. Even if the frontend bell were rewired to call the API, a buyer would have no endpoint to call.

6. **No digital product delivery to the customer.** The `DigitalAsset` + `Fulfillment` models exist, and `createFulfillmentsForPaidOrder` auto-creates a `DIGITAL_ACCESS` fulfilment row with `accessUrl` on payment. BUT: no email is sent with the link, no notification is created, no secure signed-URL endpoint exists, and `maxDownloads` / `expiresAfterDays` are stored but never enforced. The customer would have to manually fetch their order and walk `fulfillments[].accessUrl`.

7. **`/users/me/notification-preferences` endpoint does not exist.** The marketplace's `/profile/notifications` page (which is actually a preferences page, not a notification list) calls `GET` / `PUT /api/v1/users/me/notification-preferences` — this endpoint is **not implemented** on the backend (0 grep matches). The Prisma schema has no `NotificationPreference` model. The page only works against the dummy-data API.

8. **No real-time notifications.** No WebSocket gateway in the NestJS API, no socket.io client in the marketplace frontend. The standalone `examples/websocket/server.ts` is an unrelated chat demo. The closest thing to real-time is web push (VAPID + PushService), which fires only on `notification.created` events — i.e. only on withdrawal/escrow/KYC events, NOT on order events.

9. **`EmailLog` table exists but is never written.** `EmailService.sendEmail()` logs to the NestJS logger but does not persist an `EmailLog` row. There is no DB-level audit trail of sent (or failed) emails.

10. **`EmailService.sendEmail()` does not accept attachments.** The `EmailOptions` interface defines an optional `attachments` array (line 11-15), but the public `sendEmail()` signature (line 120-125) does not accept or forward attachments. So even if a digital-delivery email were added, the current API cannot attach a file — only link to an `accessUrl`.

11. **Notification schema lacks relational metadata.** No `relatedEntityType` / `relatedEntityId` columns — the only link to the originating Order/Escrow/Withdrawal is via the untyped JSON `data` field. This makes "show me all notifications for order X" queries impossible without parsing JSON.

12. **No notification-type enum.** The `type` column is a free-form `String`. Each call site invents its own literal (`'PAYMENT_HELD'`, `'WITHDRAWAL_REQUESTED'`, etc.) with no compile-time guarantee of consistency. The frontend mock store has its own `NotificationTemplateKey` union type (`apps/marketplace/src/constants/order-workflow.ts:305-317`) with 12 keys (`QUOTATION_RECEIVED`, `PAYMENT_SUCCESS`, `ORDER_PROCESSING`, `ORDER_SHIPPED`, `OUT_FOR_DELIVERY`, `ORDER_DELIVERED`, `ESCROW_RELEASED`, `ESCROW_REFUNDED`, `DISPUTE_WINDOW_OPENED`, `DISPUTE_OPENED`, `DISPUTE_RESOLVED`, `ORDER_CANCELLED`) — none of which match the literals actually used on the backend.

### 9.3 What would close the gap (intended: every order stage → in-app notification + email)

To meet the spec ("every meaningful order stage should generate a real notification + email"), the following work is required:

1. **Wire the commerce/orders/order-operations/delivery modules to call `notificationService.create()` AND `emailService.sendEmail()`** on every status transition. The natural place is either:
   - Inline calls at the end of each `transitionOrderStatus` / `checkout` / `payOrder` method, OR
   - Emit `order.placed` / `order.paid` / `order.shipped` / `order.delivered` events via `eventEmitter.emit()` and add `@OnEvent` handlers that fire both notification + email (cleaner, decoupled).
2. **Add a buyer-facing `GET /api/v1/notifications` endpoint** (mirror of the existing vendor one) so the marketplace bell can fetch real notifications for any authenticated user.
3. **Rewire `apps/marketplace/src/components/layout/notification-bell.tsx`** to call the API (via React Query `useQuery(['notifications'])` polling, or a socket subscription) instead of reading the Zustand mock store. Delete `seedNotifications()` and the `notifications` slice from `order-workflow-store.ts`.
4. **Invoke the existing dead email templates** (`order-confirmed`, `order-shipped`, `order-delivered`, `order-cancelled`, `new-order-vendor`, `payment-failed`, `delivery-assigned`, `withdrawal-processed`, `kyc-approved`/`kyc-rejected`) at the corresponding call sites.
5. **Add a `notification-preferences` endpoint + Prisma model** (or migrate to a JSON column on `User`) so the `/profile/notifications` preferences page works against the real API.
6. **Add a digital-delivery email + customer-facing download endpoint** for `DIGITAL` products: send the buyer an email with their `accessUrl` (or a signed-URL download link) when `createFulfillmentsForPaidOrder` runs, and add `GET /api/v1/orders/:orderId/digital-assets` (or similar) so the buyer can fetch their purchases. Enforce `maxDownloads` and `expiresAfterDays`.
7. **Optionally add a WebSocket gateway** for true real-time notification push (the `examples/websocket/` chat demo can serve as a starting pattern but is otherwise unrelated).
8. **Persist `EmailLog` rows** in `EmailService.sendEmail()` for audit.
9. **Add a `NotificationType` Prisma enum** + `relatedEntityType` / `relatedEntityId` columns to the `Notification` model for queryability and type safety.

---

## Appendix A — File inventory

### Backend (apps/api/src/)

| File | Role |
|---|---|
| `prisma/schema.prisma:1734-1748` | `Notification` model |
| `prisma/schema.prisma:1750-1762` | `PushSubscription` model |
| `prisma/schema.prisma:1766-1775` | `EmailLog` model (defined, never written) |
| `prisma/schema.prisma:919-941` | `DigitalAsset` model |
| `prisma/schema.prisma:1309-1331` | `Fulfillment` model |
| `common/services/notification.service.ts` | `NotificationService` (create, list, markAsRead, markAllAsRead, getUnreadCount) |
| `common/services/notification-event.listener.ts` | `@OnEvent('notification.created')` → web-push dispatch |
| `common/services/email.service.ts` | `EmailService` (Nodemailer SMTP, 22 inline Handlebars templates) |
| `common/services/push.service.ts` | `PushService` (web-push via VAPID + web-push library) |
| `common/shared.module.ts` | `@Global` module exporting all shared services + EventEmitterModule |
| `app.module.ts:92-100` | `EventEmitterModule.forRoot()` config |
| `modules/notifications/notifications.module.ts` | Registers `VendorNotificationsController` |
| `modules/notifications/notifications.controller.ts` | `GET/PATCH/POST /api/v1/vendor/notifications` |
| `modules/notifications/push-notifications.controller.ts` | `GET/POST/DELETE /api/v1/notifications/push/*` |
| `payments/wallet.service.ts:91,353` | `notificationService.create()` for withdrawal |
| `payments/escrow.service.ts:82,212,522,757` | `notificationService.create()` for escrow events |
| `modules/users/users.service.ts:451,559` | `notificationService.create()` for KYC events |
| `modules/auth/auth.service.ts:335,402,624,795` | `emailService.sendEmail()` for auth OTP |
| `modules/auth/auth.controller.ts:287` | `emailService.sendEmail()` for email-change OTP |
| `modules/commerce/commerce.service.ts:1739-1752` | `addDigitalAsset` (vendor registers a digital asset) |
| `modules/commerce/commerce.service.ts:3036-3083` | `createFulfillmentsForPaidOrder` (auto-creates DIGITAL_ACCESS fulfilment) |
| `modules/commerce/commerce.controller.ts:266-268` | `POST /api/v1/vendor/digital-assets` |
| `modules/order-operations/order-operations.service.ts:104-166` | `transitionOrderStatus` (accept/reject/prepare/ready/cancel) — NO notification/email |
| `examples/websocket/server.ts` | Standalone Socket.io chat demo (port 3003) — NOT connected to the API |

### Frontend (apps/marketplace/src/)

| File | Role |
|---|---|
| `components/layout/marketplace-layout.tsx:23,466` | Imports & renders `NotificationBell` from `@/components/layout/notification-bell` |
| `components/layout/notification-bell.tsx` | ACTIVE header bell — reads from Zustand mock store |
| `components/landing/notification-bell.tsx:60-158` | Orphaned bell with hardcoded `sampleNotifications` (8 fake entries) |
| `stores/order-workflow-store.ts:522-562` | `seedNotifications()` — 3 mock notifications persisted to localStorage |
| `stores/notification-store.ts` | Unrelated toast store (transient success/error/info toasts, not the bell) |
| `app/profile/notifications/page.tsx` | Preferences page (channel toggles, DND, language) — calls non-existent `/users/me/notification-preferences` endpoint |
| `lib/order-api.ts:603-680` | `useNotificationPreferences` / `useUpdateNotificationPreferences` hooks (calls missing backend endpoint) |
| `lib/dummy-data/user.ts:624-720` | Dummy-data fallback for notification preferences |
| `components/order/order-notifications.tsx` | Per-order notification list (reads from the same Zustand mock store, not the API) |

---

**Audit complete.** No code was modified. Findings written to `/home/z/my-project/audit-notification-email.md`.
