# MASTER AUDIT REPORT
## Product, Order, Kwikscrow & Checkout — Full Marketplace Audit

**Status:** READ-ONLY audit complete. No code was modified.
**Date:** Current session
**Scope:** Product, Order, Checkout/Cart, Kwikscrow (Escrow), Wallet, Vendor system, Notifications, Email, Digital Product delivery
**Sources:** 5 parallel deep-audit agents → `audit-product.md` (1011 lines), `audit-order.md` (700 lines), `audit-kwikscrow-wallet.md` (670 lines), `audit-vendor.md` (1090 lines), `audit-notification-email.md` (783 lines). All claims cited with file:line in those reports.

---

## 0. CRITICAL — API CANNOT BOOT (environment blocker, must be resolved before anything else)

The NestJS API on port 4000 is **not running**. Root cause:

- `apps/api/src/modules/upload/upload.module.ts`, `upload.service.ts`, `upload.controller.ts` were created in the previous session but are now **deleted from the working tree** (confirmed via `git status` → `deleted:`).
- `apps/api/src/app.module.ts:22` still has `import { UploadModule } from './modules/upload/upload.module';` and line 149 registers `UploadModule` in the imports array.
- Result: the API fails to start with a module-not-found error. **No backend endpoint works.** The marketplace (port 3000) is up but every API call fails.

The `vendor-store/` files exist but show as `modified` in git. The deleted upload files are recoverable via `git checkout HEAD -- apps/api/src/modules/upload/`.

**This is a prerequisite to any implementation work.**

---

## 1. EXECUTIVE SUMMARY

The intended order lifecycle is:

```
Place Order → Vendor Quote → Quote Agreement → Payment → Kwikscrow → Fulfillment → Confirmation → Release → Vendor Wallet
```

**The actual implemented lifecycle is:**

```
Place Order (frontend mock, localStorage) → [never reaches backend] 
                                            ↓
                          (if it did) Paystack payment immediately
                                            ↓
                              Order → PAID, inventory committed
                                            ↓
                          Escrow NEVER created (holdPayment never called)
                                            ↓
                          Wallet NEVER credited (releaseFunds unreachable)
                                            ↓
                          Vendor never paid. Dead end.
```

### The system has THREE disconnected layers that disagree:

| Layer | What it does | Problem |
|-------|-------------|---------|
| **Backend (NestJS + Prisma)** | Paystack-first checkout, multi-vendor split, inventory reservation, escrow service exists but inert | Escrow `holdPayment` is never called; wallet credit is unreachable; no quote stage; no customer-confirmation endpoint |
| **Marketplace frontend** | localStorage cart (`useCartStore`), localStorage order workflow (`order-workflow-store`), mock escrow (`lib/escrow.ts` Map) | Never syncs cart to backend; `POST /checkout` always "Cart is empty"; 13-state workflow is mock-only; notifications are 3 hardcoded entries |
| **Vendor dashboard** | Polls backend orders, has accept/reject/prepare/ready buttons | "Accept" sends `CONFIRMED` which the backend rejects; no quote UI; no polling interval; no real-time channel |

### Five headline findings:

1. **Kwikscrow is dead code.** `EscrowService.holdPayment()` (escrow.service.ts:32) has **zero callers** anywhere. The `Escrow` table is permanently empty. Money goes Customer → Paystack → (nothing). The vendor wallet is credited **nowhere** in the normal flow.
2. **No quote system exists.** No `Quote` model, no `quoteStatus` field, no `/orders/:id/quote` endpoint. The entire "Vendor Quote → Customer Review → Accept/Request Reduction → Agreement" loop is frontend mock only.
3. **The vendor wallet is never credited** — not at order creation, not at payment, not at delivery, not at confirmation. The only crediting path (`EscrowService.releaseFunds`) is unreachable because `holdPayment` never runs and there's no customer-confirmation endpoint.
4. **Marketplace cart and backend cart are fully disconnected.** Frontend uses `useCartStore` (localStorage). Backend has a DB `Cart` table. `POST /checkout` from the frontend sends an `items` array that the `CheckoutDto` doesn't even accept — backend looks at the empty DB cart and throws `BadRequestException("Cart is empty")`.
5. **`GET /api/v1/vendors` 404** because `PublicVendorsController` defines only `@Get(':slug')` routes — there is no bare `@Get()` list handler. The marketplace's `useStores()` hook calls the non-existent list endpoint.

---

## 2. ENTITY ARCHITECTURE — "What IS a Vendor?"

This was the core architectural question. The answer:

```
A "vendor" is a User with role = VENDOR, who owns exactly one Store record (1:1).
```

```
User (role: VENDOR)  ──1:1──  Store  ──1:N──  Product
       │                          │
       │                          ├── KycDocument[]
       │                          ├── Subscription
       │                          ├── KwikCoins
       │                          └── Wallet
       │
       └── (no Seller model, no VendorProfile model — those module names are route-only abstractions)
```

### The three "vendor-ish" backend modules all manage the SAME two entities:

| Module | Route prefix | Prisma models touched | Purpose |
|--------|-------------|----------------------|---------|
| `sellers/` | `/sellers` | `User` + `Store` | Admin-facing vendor onboarding/KYC list |
| `vendor-profile/` | `/vendor/profile` | `User` + `Store` | Vendor self-service profile |
| `vendor-store/` | `/vendor/shop` | `Store` | Vendor's shop branding (logo/banner) — renamed from `/store` last session |
| `commerce/` (PublicVendorsController) | `/vendors` | `Store` | Public storefront listing by slug |

**There is no `Seller` Prisma model and no `VendorProfile` Prisma model.** Both are route-layer abstractions over `User`+`Store`. The previous session's decision to keep the Prisma `Store` model name as an internal DB entity is **consistent at the data layer** but created route/client friction (see §6.4).

---

## 3. RELATIONSHIP MAP (the full data model)

```
User (customer or vendor, by role)
  │
  ├── 1:N ── Order (as customer, userId)
  │             ├── 1:N ── OrderItem
  │             │              ├── N:1 ── Product (productId, NO snapshot)
  │             │              └── N:1 ── ProductVariant (variantId, NO snapshot)
  │             ├── 1:1 ── Payment (Paystack)
  │             ├── 1:1 ── Escrow (EXISTS but never created)
  │             ├── 1:1 ── Fulfillment
  │             ├── 1:1 ── Delivery (has customerConfirmed field, never set)
  │             └── 1:1 ── Address (delivery)
  │
  ├── 1:1 ── Store (if role=VENDOR)
  │             ├── 1:N ── Product
  │             │             ├── N:1 ── Category
  │             │             ├── N:1 ── Brand
  │             │             ├── 1:N ── ProductVariant
  │             │             ├── 1:1 ── InventoryItem (available, reserved, safetyStock)
  │             │             ├── 1:N ── InventoryReservation (ACTIVE/COMMITTED/RELEASED/EXPIRED, 15min TTL)
  │             │             ├── 1:N ── ProductImage (OR JSON array — verify)
  │             │             ├── 1:N ── Review
  │             │             ├── 1:1 ── DigitalAsset (if digital: deliveryType, fileUrl, accessUrl, licenseKey)
  │             │             └── N:N ── Deal (through ProductDeal)
  │             ├── 1:1 ── Wallet (balance Int, NO WalletTransaction ledger model)
  │             ├── 1:N ── StoreDeliveryZone
  │             └── 1:N ── KycDocument
  │
  └── (no Seller, no VendorProfile, no Quote, no WalletTransaction, no Notification model linked to orders)
```

### Status dimensions (partially separated):

| Entity | Status fields | Values |
|--------|--------------|--------|
| Order | `status` (OrderStatus) | PENDING, PENDING_PAYMENT, PAID, PROCESSING, FULFILLED, DELIVERED, COMPLETED, CANCELLED, REFUNDED, DISPUTED + more |
| Order | `paymentStatus` (PaymentStatus) | UNPAID, PENDING, PAID, FAILED, REFUNDED |
| Order | `disputeStatus` (DisputeStatus) | NONE, OPENED, RESOLVED |
| Payment | `status` | PENDING, PAID, FAILED, REFUNDED |
| Escrow | `status` | HELD, PENDING_RELEASE, RELEASED, REFUNDED, DISPUTED, PARTIAL |
| Fulfillment | `status` | PENDING, READY, DISPATCHED, DELIVERED, CANCELLED |
| Delivery | `status` + `customerConfirmed` (bool, never set) | various |
| **Missing** | `quoteStatus` | does not exist |
| **Missing** | denormalized `escrowStatus`/`fulfillmentStatus` on Order | buyer's `/orders/:id` doesn't include escrow/delivery |

### Three competing OrderStatus vocabularies (only 5 values shared):
- Prisma enum: 11 values
- `order-api.ts` (frontend): 9 values
- `constants/order-workflow.ts` (frontend mock): 13 values

---

## 4. ACTUAL ORDER LIFECYCLE (as implemented) vs INTENDED

### Implemented (backend):

```
Cart (DB, empty from frontend) 
   → POST /checkout (throws "Cart is empty" because frontend never populates DB cart)
   
   [IF cart were populated:]
   → groupCartItemsByStore → one Order per Store under one ParentCheckout + one Payment
   → Order.status = PENDING_PAYMENT, Payment gateway = PAYSTACK
   → Paystack initialized IMMEDIATELY (no quote stage)
   → Inventory reserved (InventoryReservation ACTIVE, 15min TTL)
   → Customer pays on Paystack
   → Webhook → processSuccessfulPayment:
        - Payment.status = PAID
        - Order.status = PAID
        - Inventory committed (InventoryReservation → COMMITTED)
        - Fulfillment created (type PACKAGING, status READY) — and DIGITAL_ACCESS if digital
        - Escrow NOT created (holdPayment never called)
        - Wallet NOT credited
        - Notification NOT sent
        - Email NOT sent
   → Vendor sees PAID order, can call accept/reject/prepare/ready
   → ready → Fulfillment.status=READY, Order.status=FULFILLED (these DISAGREE)
   → ...dead end. No delivery confirmation. No escrow release. No wallet credit.
```

### Intended (per user spec):

```
Place Order → Order CREATED (auto, no vendor action needed)
   → Vendor quotes delivery (for Standard Delivery)
   → Customer reviews quote → Accept / Request Reduction
   → Quote negotiation loop
   → Agreement reached
   → Payment → Kwikscrow HOLDS funds
   → Fulfillment (Pickup: customer clicks "Picked Up" / Delivery: vendor delivers, customer confirms)
   → Kwikscrow RELEASE (minus 1% processing fee)
   → Vendor Wallet credited (idempotent)
   → Notifications + emails at every stage
```

### Gap table:

| Intended stage | Implemented? | Where it breaks |
|---------------|-------------|-----------------|
| Place Order (auto, no vendor action) | ❌ Partial — checkout works but frontend cart never reaches backend | `POST /checkout` → "Cart is empty" |
| Vendor Quote | ❌ Does not exist | No Quote model, no endpoint, no UI |
| Quote negotiation (accept/reduce/revise) | ❌ Does not exist | Frontend mock only (`QuotationCard`, `useQuoteOrder` → 404) |
| Payment AFTER quote agreement | ❌ Payment is FIRST, not after quote | Paystack initialized at checkout |
| Kwikscrow holds funds | ❌ Escrow never created | `holdPayment` has 0 callers |
| Customer confirms pickup/delivery | ❌ No endpoint | `Delivery.customerConfirmed` never set |
| Kwikscrow release | ❌ Unreachable | `releaseFunds` only callable from dead controllers |
| Vendor wallet credited | ❌ Never | 0 reachable credit call sites |
| Processing fee (1%) | ❌ 5% hardcoded, never applied | `DEFAULT_COMMISSION_RATE = 0.05`, inert |
| Notifications per stage | ❌ Only escrow/wallet/KYC | Order events emit 0 notifications |
| Emails per stage | ❌ Only auth (verify/reset) | 5 order templates exist but are dead code |
| Digital product delivery | ⚠️ Partial | URL copied to Fulfillment, but no email/download/signing |

---

## 5. ACTUAL MONEY FLOW (as implemented) vs INTENDED

### Implemented:

```
Customer
   │
   │ Paystack checkout (immediate, no quote)
   ▼
Paystack (external)
   │
   │ webhook: processSuccessfulPayment
   ▼
Order.status = PAID
Payment.status = PAID
Inventory committed
Fulfillment created
   │
   │ (Escrow NOT created — holdPayment never called)
   │ (Wallet NOT credited — releaseFunds unreachable)
   ▼
   ╳ DEAD END ╳
   
Vendor wallet balance: ₦0 (forever)
Escrow table: empty (forever)
```

### Intended:

```
Customer pays (after quote agreement)
   ↓
Kwikscrow HOLDS funds (Escrow.status = HELD)
   ↓
Release condition met:
   - Pickup: customer clicks "Picked Up"
   - Delivery: customer confirms delivery
   - Digital: fulfillment delivered + auto-release window
   ↓
Deduct 1% processing fee
   ↓
Kwikscrow RELEASE (Escrow.status = RELEASED)
   ↓
Vendor Wallet credited (idempotent, in $transaction)
   ↓
WalletTransaction ledger entry (reference = orderId+releaseId)
```

### Wallet credit call sites (all 6 found, ALL unreachable or inert):

| File:Line | Trigger | Live? |
|-----------|---------|-------|
| `auth.service.ts:291` | Vendor registration → creates EMPTY wallet (₦0) | ✅ live (not a credit) |
| `wallet.service.ts:248` (`creditWallet`) | nothing | ❌ dead code |
| `wallet.service.ts:332` (withdrawal failed reversal) | `POST /admin/escrow/withdrawals/:id/process` | ❌ controller not registered |
| `escrow.service.ts:181,192` (`releaseFunds`) | dead `PaymentsAdminController` + dead `EscrowSchedulerService` | ❌ unreachable |
| `escrow.service.ts:338,349,409,420` (`resolveDispute`) | dead `PaymentsAdminController.resolveDispute` | ❌ unreachable |
| `delivery.service.ts:488` (`manualEscrowRelease`) | live route but **always throws "No escrow found"** | ⚠️ broken |

**Net reachable wallet credits in the running system: ZERO.**

---

## 6. DOMAIN FINDINGS

### 6.1 Product

**Schema is well-modelled.** Product has: `storeId` (→ Store, NOT nullable), `categoryId`, `brandId`, price/comparePrice, slug, SKU, status, `InventoryItem` (1:1) with `available`/`reserved`/`safetyStock`/`policy`, `InventoryReservation` (1:N) with 15-min TTL and ACTIVE/COMMITTED/RELEASED/EXPIRED states, `DigitalAsset` (1:1) with deliveryType DOWNLOAD/LICENSE_KEY/EXTERNAL_ACCESS.

**Inventory reservation system EXISTS and is correct in design** — reserve at checkout, commit on payment, release on failure/expiry. But: expired reservations are never auto-released (cron not registered), and `Product.stock` is a denormalized legacy field that drifts.

**Critical gaps:**
- `Store.deliverySetupComplete` is never set to `true` anywhere → `assertStoreDeliverySetupComplete` (commerce.service.ts:3426) blocks vendors from publishing products (status=ACTIVE). Vendors are stuck.
- No vendor variant creation endpoint — only admin can create variants (`@Roles(ADMIN, SUPER_ADMIN)`). `CreateVendorProductDto` has no `variants` field.
- **No product snapshot on OrderItem** — only `unitPrice`/`totalPrice` captured. If a vendor renames a product, historical orders change. (No onDelete cascade, so product can't be deleted if it has order items, but CAN be edited.)
- `product.salePrice` is referenced in commerce.service.ts:405 but **doesn't exist** on the Product model — silently falls back to `product.price` every time (latent bug).
- Digital delivery: `createFulfillmentsForPaidOrder` copies `accessUrl ?? fileUrl` to a Fulfillment row on payment, but **no email to buyer, no signed URL, no `maxDownloads`/`expiresAfterDays` enforcement, no `uploadDigitalAsset` method** (vendor must host externally).

### 6.2 Order + Checkout + Cart

- **Cart is fully disconnected.** Frontend `useCartStore` (Zustand + localStorage) never POSTs to `/api/v1/cart/items`. Backend `Cart` table stays empty. `POST /checkout` from frontend sends `items` in body, but `CheckoutDto` has no `items` field → backend reads empty DB cart → `BadRequestException("Cart is empty")`.
- **Multi-vendor IS supported on the backend** (`groupCartItemsByStore` splits by storeId → one Order per Store under one `ParentCheckout` + one `Payment`). But it's unreachable because the cart never syncs.
- **Delivery fee charged before vendor quote** — and there IS no vendor quote. Frontend hardcodes ₦1,500–₦4,500 by state + STANDARD/EXPRESS/PICKUP type (checkout/page.tsx:95). Backend computes `shippingFee` from `StoreDeliveryZone`. The page header says "No payment now — the vendor will send a quotation" which **directly contradicts** the immediate Paystack initialization.
- **Payment-method UI is decorative** — Paystack/Flutterwave/Wallet radio buttons shown, but backend always uses `gateway: 'PAYSTACK'`.
- **Vendor "Accept order" button is broken** — dashboard sends `PATCH /vendor/orders/:id/status {status:"CONFIRMED"}` but `ORDER_TRANSITIONS.PAID` = `['PROCESSING','FULFILLED','CANCELLED','REFUNDED']` — `CONFIRMED` is missing. Backend throws "Cannot move order from PAID to CONFIRMED". The unused `PATCH /vendor/orders/:id/accept` route DOES allow this but the dashboard never calls it.
- **Status disagreement:** vendor `ready` endpoint sets `Fulfillment.status=READY` AND `Order.status=FULFILLED` simultaneously — these two statuses disagree semantically.
- `ParentCheckout.idempotencyKey` is NOT `@unique` → race condition on concurrent identical checkouts.

### 6.3 Kwikscrow (Escrow) + Wallet

- **`EscrowService.holdPayment()` is never called anywhere.** This is the #1 critical finding. The `Escrow` table is permanently empty. (payments.module.ts:11 has a comment "Exported so CommerceModule can call holdPayment on checkout" — but CommerceModule never imports PaymentsModule and never calls it.)
- **`EscrowSchedulerService` is never registered** — not in any module's providers array, AND `ScheduleModule.forRoot()` is not imported in app.module.ts. The `@Cron(EVERY_HOUR)` auto-release never fires.
- **`PaymentsAdminController` is not registered** in `payments.module.ts` → 7 admin routes dead, including the only withdrawal-process endpoint (withdrawals stay PENDING forever).
- **No customer "confirm receipt" endpoint** and no rider "mark delivered" endpoint → `Delivery.customerConfirmed` is never set → auto-release can never trigger.
- **Two parallel, inconsistent escrow implementations:** `EscrowService.releaseFunds` credits `vendorEarnings` (after 5% fee), while `DeliveryService.manualEscrowRelease` credits full `escrow.amount` (no fee). Different fee semantics.
- **No `WalletTransaction` ledger model** — only `Wallet` with a `balance` Int. No `reference`/idempotency column. `WalletService.creditWallet`'s `reference` param is log-only. Double-release would double-credit.
- **No Paystack refund API** — `refundPayment` only flips status flags; customer never gets money back via gateway.
- **Duplicate `@Controller('vendor/wallet/escrow-holdings')`** across two live controllers (PaymentsController + VendorEscrowController) → non-deterministic handler resolution.
- **5% commission** hardcoded as `DEFAULT_COMMISSION_RATE = 0.05` (escrow.service.ts:11) — user wants 1%, configurable by Admin. Stored in a `Commission` model that's never created because `holdPayment` never runs.

### 6.4 Vendor System + 404

- **`GET /api/v1/vendors` 404 root cause:** `PublicVendorsController` (`@Controller('vendors')`) defines only `@Get(':slug')`, `@Get(':slug/products')`, `@Get(':slug/products/:productSlug')`. **No bare `@Get()` list handler.** The controller IS registered, but no route matches `/vendors` (no params). Fix: add `@Public() @Get()` that lists verified/onboarded stores — the query already exists in `SellersController.list()`.
- **`storeApi` in `packages/api-client/src/index.ts:575-613` is broken** — still calls `/store`, `/store/logo`, `/store/banner`, `/store/analytics` after the previous session renamed backend routes to `/vendor/shop`. Affects vendor dashboard settings/profile/onboarding/storefront pages (all 404).
- **Multiple dead frontend API calls:** `subscriptionsApi`, `notificationsApi` (list/markAsRead/unread-count), `onboardingApi`, `analyticsApi.getTopProducts/getCategories`, `useVendorAnalytics()` (calls `/vendor/analytics` root but backend only has sub-paths).
- **Route conflicts:**
  - `GET /vendor/orders/:id` registered on BOTH `VendorCommerceController` (commerce) and `VendorOrdersController` (orders) — commerce wins by import order, shadowing the orders-module handler.
  - `GET /vendor/wallet/escrow-holdings` on BOTH `PaymentsController` and `VendorEscrowController`.
- **5 marketplace↔vendor communication breaks:**
  1. No vendor notification on buyer payment (`processSuccessfulPayment` never calls `notificationService.create`).
  2. No polling on vendor dashboard orders list (`useQuery` with no `refetchInterval`).
  3. Vendor "Accept order" button sends a status the backend rejects.
  4. No quote-submission flow (endpoint doesn't exist).
  5. No real-time channel (zero `@WebSocketGateway` or socket.io in the API).

### 6.5 Notification + Email + Digital Delivery

- **Header notification dropdown uses DUMMY data.** `notification-bell.tsx:32` reads from `useOrderWorkflowStore` (order-workflow-store.ts:522-562) which is seeded with 3 hardcoded mock notifications (`ntf-001/002/003`, fake order refs `KW-AUR-001/002`) persisted to localStorage. The store comment literally says *"no live API"*. The backend `GET /api/v1/vendor/notifications` endpoint EXISTS but the marketplace never calls it.
- **Notifications are NOT created on order events.** `notificationService.create()` is called from only 3 places: wallet (withdrawals), escrow (hold/release/refund — but escrow is dead), users (KYC). **Zero** calls in commerce/orders/order-operations/delivery modules. Order placement, quoting, accept/reject, dispatch, delivery, confirmation → zero notifications.
- **Email service is REAL** (Nodemailer + SendGrid SMTP at `smtp.sendgrid.net:587`), 22 inline Handlebars templates loaded. **But only 2 templates are ever invoked**: `email-verify` and `password-reset` (auth module only). The 5 order templates (`order-confirmed`, `order-shipped`, `order-delivered`, `order-cancelled`, `new-order-vendor`) are **dead code** — defined, never called.
- **Only ONE `@OnEvent` handler exists** in the entire API: `notification.created` → web-push. No order domain events (`order.placed`, `order.paid`, etc.) are emitted anywhere. No `EventEmitterModule`.
- **No WebSocket gateway, no socket.io client** in marketplace. `examples/websocket/` is an unrelated chat demo.
- **Digital product delivery is DB-only.** `DigitalAsset` model exists with `deliveryType`/`fileUrl`/`accessUrl`/`licenseKey`/`maxDownloads`/`expiresAfterDays`. `createFulfillmentsForPaidOrder` copies the URL to a Fulfillment row on payment. **But:** no email to buyer, no in-app notification, no secure signed-URL download endpoint, no `maxDownloads`/`expiresAfterDays` enforcement, `EmailService.sendEmail()` doesn't accept attachments.
- **`/profile/notifications` page** calls `GET/PUT /api/v1/users/me/notification-preferences` — endpoint doesn't exist (404).
- **`EmailLog` Prisma model exists** but `EmailService.sendEmail()` never writes to it — no audit trail.

---

## 7. THE FIVE CRITICAL DISCONNECTIONS

These are the architectural breaks that must be resolved to achieve one source of truth for an Order:

### Disconnection 1: Cart (frontend localStorage) ↔ Cart (backend DB)
Frontend never syncs. `POST /checkout` always fails. **Fix:** either (a) sync frontend cart to backend `Cart`/`CartItem` on every mutation, or (b) accept `items[]` in `CheckoutDto` and build the order from the payload (with server-side price/stock validation).

### Disconnection 2: Payment ↔ Escrow
`processSuccessfulPayment` marks PAID but never calls `holdPayment`. Escrow table stays empty. **Fix:** in `processSuccessfulPayment`, after marking PAID, call `escrowService.holdPayment(orderId)` inside the same `$transaction` that commits inventory.

### Disconnection 3: Escrow ↔ Wallet (release path)
`releaseFunds` exists but is unreachable — no caller, no scheduler, no customer-confirmation endpoint. **Fix:** add `POST /orders/:id/confirm-receipt` (customer) and wire it to `releaseFunds`; register `EscrowSchedulerService` + `ScheduleModule.forRoot()` for auto-release after N days; register `PaymentsAdminController`.

### Disconnection 4: Order events ↔ Notifications/Emails
Zero notification/email calls in order modules. **Fix:** introduce `EventEmitterModule`, emit `order.placed`, `order.quoted`, `order.paid`, `order.dispatched`, `order.delivered`, `order.confirmed`, `order.released`, `order.cancelled` events; add `@OnEvent` handlers that create in-app notifications + send the 5 existing (but dead) order email templates. Replace the dummy notification bell with a real `GET /notifications` fetch.

### Disconnection 5: Quote stage (entirely missing)
No Quote model, no endpoint, no UI, no status. The "Vendor Quote → Customer Review → Accept/Reduce → Agreement" loop doesn't exist. **Fix:** add `Quote` model (or `quoteAmount`/`quoteStatus`/`quoteHistory` fields on Order) + endpoints: `POST /vendor/orders/:id/quote`, `POST /orders/:id/quote/accept`, `POST /orders/:id/quote/request-reduction`, `POST /vendor/orders/:id/quote/revise`. Move Paystack initialization to AFTER `quoteStatus = AGREED`.

---

## 8. RECOMMENDED CORRECTION PLAN (phased, per user's Phase 1–9)

### Phase 0 — Environment recovery (BLOCKER)
- Restore deleted `apps/api/src/modules/upload/` files via `git checkout HEAD -- apps/api/src/modules/upload/`.
- Verify `vendor-store/` modified files are consistent.
- Start API on port 4000, confirm boot.
- Verify marketplace ↔ API connectivity.

### Phase 1 — Fix the 404 + dead routes (quick wins)
- Add `@Public() @Get()` list handler to `PublicVendorsController` (reuse `SellersController.list()` query).
- Fix `packages/api-client/src/index.ts` `storeApi` → `/vendor/shop/*` routes.
- Fix `useVendorAnalytics()` → `/vendor/analytics/overview`.
- Resolve the two route conflicts (`/vendor/orders/:id`, `/vendor/wallet/escrow-holdings`).
- Fix vendor "Accept order" button → call `PATCH /vendor/orders/:id/accept` (which exists) instead of the status-update endpoint.

### Phase 2 — Connect the cart
- Decide: sync-to-DB-cart OR accept-`items[]`-in-CheckoutDto. (Recommendation: accept `items[]` with server-side validation — simpler, matches frontend reality, avoids a sync round-trip per mutation.)
- Add `items[]` to `CheckoutDto`, validate each item's price/stock/vendor server-side, build OrderItems from payload.
- Remove the "Cart is empty" failure path when `items[]` is provided.

### Phase 3 — Implement the Quote stage
- Add `Quote` model (or fields on Order): `quoteAmount`, `quoteStatus` (PENDING/QUOTED/ACCEPTED/REDUCTION_REQUESTED/REVISED/AGREED/REJECTED), `quoteHistory` (JSON), `quotedAt`, `agreedAt`.
- Endpoints: `POST /vendor/orders/:id/quote`, `POST /orders/:id/quote/accept`, `POST /orders/:id/quote/request-reduction`, `POST /vendor/orders/:id/quote/revise`.
- For Pickup: quote may be optional (no delivery fee) — order can go straight to payment.
- For Standard Delivery: order stays in `quoteStatus=PENDING` until `AGREED`. Move Paystack init to after agreement.
- Update checkout UI: delivery fee = "To be determined by vendor" for Standard Delivery.

### Phase 4 — Wire Escrow (Kwikscrow) into the payment flow
- In `processSuccessfulPayment`, call `escrowService.holdPayment(orderId)` inside the existing `$transaction`.
- Register `PaymentsAdminController` in `payments.module.ts`.
- Register `ScheduleModule.forRoot()` + `EscrowSchedulerService` for auto-release.
- Add `POST /orders/:id/confirm-receipt` (customer) → triggers `releaseFunds`.
- Add rider/delivery "mark delivered" endpoint → sets `Delivery.customerConfirmed` path or triggers auto-release window.
- Ensure `releaseFunds` credits wallet inside `$transaction` with idempotency guard.

### Phase 5 — Wallet ledger + idempotency
- Add `WalletTransaction` model: `walletId`, `type` (CREDIT/DEBIT), `amount`, `reference` (@unique), `orderId`, `escrowId`, `reason`, `createdAt`.
- Rewrite `WalletService.creditWallet/debitWallet` to create a `WalletTransaction` row + update `Wallet.balance` in one `$transaction`, with `reference` uniqueness as idempotency key.
- Migration: backfill existing wallet balances as opening-balance transactions.

### Phase 6 — Processing fee configuration
- Add `PlatformSetting` model (or reuse existing config) with `processingFeePercent` (default 1.0).
- Replace hardcoded `DEFAULT_COMMISSION_RATE = 0.05` with a configurable service.
- Apply fee in `releaseFunds`: `vendorEarnings = escrow.amount - (escrow.amount * feePercent)`.
- Admin endpoint to update the fee.

### Phase 7 — Inventory correctness
- Register a cron to auto-release EXPIRED `InventoryReservation` rows (the TTL logic exists, the cron doesn't).
- Reconcile `Product.stock` from `InventoryItem.available` (or deprecate `Product.stock`).
- Verify reserve→commit→release works end-to-end once cart is connected (Phase 2).

### Phase 8 — Notifications + Emails + Digital delivery
- Introduce `EventEmitterModule.forRoot()`.
- Emit domain events in order/escrow/wallet services.
- Add `@OnEvent` handlers → `notificationService.create()` + `emailService.sendEmail()` using the 5 existing order templates.
- Replace dummy notification bell with real `GET /notifications` fetch (endpoint exists, just unused).
- Digital delivery: on payment success for digital products, send email with access link + create in-app notification. Add signed-URL download endpoint with `maxDownloads`/`expiresAfterDays` enforcement. Add `EmailService` attachment support.

### Phase 9 — Checkout UI simplification
- Structure: Products → Delivery Option (Pickup/Standard only) → Order Summary (subtotal, delivery TBD, 1% fee, total) → Place Order.
- Remove payment-method selection UI (comment out).
- Delivery address as MODAL (prefill name/phone from auth, disabled).
- Remove EXPRESS delivery option (user wants only Pickup + Standard).
- Remove hardcoded delivery fee display.

### Phase 10 — Real-time (optional, later)
- Add NestJS WebSocket gateway or socket.io mini-service for order updates.
- Vendor dashboard subscribes for new-order push.
- Marketplace order page subscribes for status updates.

---

## 9. ARCHITECTURAL DECISIONS REQUIRED

Before implementation, these decisions need confirmation:

1. **Cart strategy:** Sync frontend cart to backend DB cart on every mutation, OR accept `items[]` in checkout payload? *(Recommendation: accept `items[]` — simpler, fewer round-trips, server validates.)*
2. **Quote model:** Separate `Quote` model with history, OR `quoteAmount`/`quoteStatus`/`quoteHistory` JSON fields on Order? *(Recommendation: separate `Quote` model + `QuoteRevision` child for audit trail.)*
3. **Processing fee source:** New `PlatformSetting` model, or reuse an existing config mechanism? Need to inspect if one exists.
4. **Wallet ledger:** Add `WalletTransaction` model (breaking schema change) — confirm acceptable. This is additive, not destructive.
5. **Digital delivery mechanism:** Email-with-link (simplest, uses existing email service) vs signed-URL download endpoint (more secure, needs new endpoint + storage). *(Recommendation: start with email+access-link, add signed-URL endpoint next.)*
6. **Real-time:** WebSocket gateway in NestJS, or socket.io mini-service? The project has an `examples/websocket/` demo and the instructions allow mini-services.
7. **Multi-vendor checkout:** Keep the `ParentCheckout` → multiple `Order` split (backend already does this), and ensure each vendor quotes/fulfills/releases independently. Confirm this is the intended model.
8. **Status dimensions:** Keep separate `Order.status` + `paymentStatus` + `disputeStatus` + `Escrow.status` + `Fulfillment.status` + `Delivery.status` + new `quoteStatus`, OR denormalize key ones onto Order for the buyer-facing API? *(Recommendation: keep separate, but ADD `quoteStatus` + `escrowStatus` + `fulfillmentStatus` to the `/orders/:id` response payload.)*

---

## 10. SUMMARY OF WHAT EXISTS (reusable) vs WHAT'S MISSING

### Exists and is correct (reuse):
- `Product` + `Store` + `User(role=VENDOR)` entity model
- `InventoryItem` + `InventoryReservation` (reserve/commit/release design)
- `DigitalAsset` model (deliveryType, fileUrl, accessUrl, licenseKey, limits)
- `Escrow` model + `EscrowService` (hold/release/refund/dispute methods — just not wired)
- `Wallet` model (needs `WalletTransaction` ledger added)
- `Payment` model + Paystack integration + webhook (idempotent)
- `EmailService` (Nodemailer + SendGrid, 22 templates — 20 unused)
- `NotificationService` + `Notification` model + endpoints (just not called from orders)
- Multi-vendor checkout split (`groupCartItemsByStore`)
- `ParentCheckout` + `idempotencyKey` concept (needs `@unique`)

### Exists but is dead/broken (wire it up, don't rebuild):
- `EscrowService.holdPayment` — never called
- `EscrowSchedulerService` — never registered
- `PaymentsAdminController` — never registered
- `WalletService.creditWallet/debitWallet` — never called
- 5 order email templates — never invoked
- `notificationService.create` — never called from orders
- `createFulfillmentsForPaidOrder` (digital) — runs but no buyer notification
- `Delivery.customerConfirmed` — never set
- `PATCH /vendor/orders/:id/accept` — exists but dashboard calls wrong endpoint

### Missing (must build):
- `Quote` model + quote negotiation endpoints + UI
- `WalletTransaction` ledger model + idempotency
- `POST /orders/:id/confirm-receipt` (customer confirmation)
- `EventEmitterModule` + order domain events + `@OnEvent` handlers
- `GET /api/v1/vendors` list endpoint
- Cart sync OR `items[]` in CheckoutDto
- Signed-URL digital download endpoint (optional)
- Configurable processing fee (1%) service
- Cron for expired inventory reservation release
- Real-time order updates (WebSocket or socket.io)

---

**END OF MASTER AUDIT REPORT**

The detailed per-domain reports with exact file:line citations for every claim are in:
- `audit-product.md` (1011 lines)
- `audit-order.md` (700 lines)
- `audit-kwikscrow-wallet.md` (670 lines)
- `audit-vendor.md` (1090 lines)
- `audit-notification-email.md` (783 lines)

No code was modified during this audit.
