# Vendor System Audit — Task 2-d (READ-ONLY)

**Scope**: Vendor backend modules, the `GET /api/v1/vendors` 404, Prisma vendor entity, marketplace↔vendor communication.
**Method**: READ-ONLY audit. No code modified. Every claim cites exact file:line.

---

## TL;DR (Executive Summary)

1. **`GET /api/v1/vendors` 404 root cause** — `PublicVendorsController` (`apps/api/src/modules/commerce/commerce.controller.ts:40-72`) is registered at `@Controller('vendors')` but defines ONLY three parametric routes: `GET :slug`, `GET :slug/products`, `GET :slug/products/:productSlug`. There is **no `@Get()` (LIST, no-params) handler**. The marketplace calls `GET /api/v1/vendors` via `useStores()` (`apps/marketplace/src/lib/api-hooks.ts:468-477`) → 404. **Fix (do NOT implement, document only)**: add a `@Public() @Get()` handler on `PublicVendorsController` that lists verified/onboarded stores (the query already exists in `SellersController.list()` at `apps/api/src/modules/sellers/sellers.controller.ts:11-59` — it queries the same `Store` model and could be lifted verbatim).

2. **A `GET /vendors` LIST route exists NOWHERE** in the API source — confirmed by exhaustive grep (`@Controller('vendors')` appears exactly once, at `commerce.controller.ts:40`; that controller has no `@Get()` root handler). The closest existing LIST is `GET /api/v1/sellers` (SellersController) which queries the same `Store` table but at a different URL.

3. **What the Prisma "vendor" actually is**: a `User` with `role = VENDOR` (schema:15-21, 59-100) who owns exactly one `Store` (schema:197-234, `Store.vendorId @unique` → `User.id`). There is **no `Seller` Prisma model** and **no `VendorProfile` Prisma model** — both module names are misnomers. `Seller` is just a public list of `Store` rows; `VendorProfile` is a controller that patches `User.profile` + `Store` together. So a "vendor" = `User(role=VENDOR)` + `Store` (1:1) + optionally `KycDocument[]`, `Subscription`, `KwikCoins`, `Wallet`.

4. **Marketplace↔vendor communication break**:
   - **No real-time channel**: there is NO `@WebSocketGateway` and NO socket.io anywhere in `apps/api/src` (grep returned zero matches). Notifications are written to the `Notification` table + a best-effort web-push fan-out (`notification-event.listener.ts:24-71`), but `processSuccessfulPayment` (`commerce.service.ts:2706-2825`) **never calls `notificationService.create()`** for the vendor when a buyer pays — so the vendor receives neither a push nor a notification row.
   - **No polling on the vendor side**: the vendor dashboard orders list (`apps/vendor/src/app/dashboard/orders/page.tsx:167-179`) uses `useQuery` with **no `refetchInterval`** — so the dashboard will not see a newly-placed order until the vendor manually refreshes or the query is invalidated by navigation.
   - **Vendor "Accept order" button is broken**: the vendor dashboard calls `vendorCommerceApi.updateOrderStatus(id, "CONFIRMED")` (`apps/vendor/src/app/dashboard/orders/[id]/page.tsx:139-143, 358`) → `PATCH /vendor/orders/:id/status {status:"CONFIRMED"}`. The backend `transitionOrderStatus` (`commerce.service.ts:3360-3363`) rejects this: `ORDER_TRANSITIONS.PAID = ['PROCESSING','FULFILLED','CANCELLED','REFUNDED']` — `CONFIRMED` is not allowed from `PAID`. So when a buyer pays, the order becomes `PAID`; the vendor clicks "Accept order" → backend throws `Cannot move order from PAID to CONFIRMED` → the action silently fails for the vendor. The vendor dashboard never calls the alternative `PATCH /vendor/orders/:id/accept` route (orders.controller.ts:184) which DOES allow `PAID → CONFIRMED`.

---

## 1. Vendor-ish Backend Module Map

### 1.1 `apps/api/src/modules/sellers/` — `@Controller('sellers')`

**Files**: `sellers.controller.ts` (60 lines), `sellers.module.ts` (10 lines). No service file (controller talks to Prisma directly).

**Routes**:
- `GET /sellers` (`sellers.controller.ts:12-14`) — public, no auth. Query `?limit` (max 100, default 10).

**Prisma model**: `Store` (NOT a `Seller` model — no such Prisma model exists).

**Behavior** (`sellers.controller.ts:17-56`): queries `prisma.store.findMany` with `where: { isVerified: true, onboardingComplete: true }`, includes `vendor` (User with profile) and `_count` of products+orders. Returns a shaped list `{id, name, slug, description, logo, banner, isVerified, productCount, orderCount, vendor:{name, avatar}}`.

**Purpose**: public "top sellers" leaderboard for the marketplace homepage / discovery surfaces.

**Overlaps with**: `PublicVendorsController` (both read the `Store` model). The previous session renamed `/stores` → `/vendors` but left `/sellers` untouched, so there are now TWO public Store-listing controllers at different URLs with different shapes:
- `GET /sellers` — exists, returns `{data: [...]}` shape
- `GET /vendors` — does NOT exist (404)

### 1.2 `apps/api/src/modules/vendor-profile/` — `@Controller('vendor/profile')`

**Files**: `vendor-profile.controller.ts` (131 lines), `vendor-profile.module.ts` (10 lines). No service file (controller talks to Prisma directly).

**Routes**:
- `PATCH /vendor/profile` (`vendor-profile.controller.ts:38-129`) — authenticated (JwtAuthGuard). Updates `User.phone`, `UserProfile.{firstName,lastName}`, and `Store.{name,slug,description}` in a single transaction. DTO `UpdateVendorProfileDto` (lines 16-23) accepts `storeName, storeSlug, storeDescription, phone, firstName, lastName`.

**Prisma models**: `User` + `UserProfile` + `Store` (NOT a `VendorProfile` model — no such Prisma model exists).

**Purpose**: a single endpoint that lets the vendor update both their personal profile AND their store profile in one PATCH. Resolves the store via `prisma.store.findUnique({where:{vendorId:userId}})` (line 46).

**Overlaps with**: `VendorStoreController` (`/vendor/shop`) which also updates `Store.{name,slug,description}`. Two different controllers can mutate the same Store row via different routes and different DTO shapes.

### 1.3 `apps/api/src/modules/vendor-store/` — `@Controller('vendor/shop')`

**Files**: `vendor-store.controller.ts` (47 lines), `vendor-store.service.ts` (177 lines), `vendor-store.module.ts` (12 lines).

**Routes** (`vendor-store.controller.ts:15-46`):
- `GET /vendor/shop` — get the authenticated vendor's store (requires `role=VENDOR`)
- `POST /vendor/shop` — create store (idempotent: if exists, falls through to update)
- `PATCH /vendor/shop` — update store fields `{name, slug, description, category, logoUrl, bannerUrl}`
- `POST /vendor/shop/logo` (multipart) — upload logo, calls `UploadService.uploadImage` to `vendors/logos` folder
- `POST /vendor/shop/banner` (multipart) — upload banner, calls `UploadService.uploadImage` to `vendors/banners` folder

**Prisma model**: `Store` (and side-creates `StorefrontDesign` + `StoreDeliverySetting` rows in `createStore` at `vendor-store.service.ts:115-127`).

**Service behavior** (`vendor-store.service.ts:38-177`): `userId()` enforces `role === 'VENDOR'` (lines 52-54). `uniqueSlug()` (lines 67-77) appends `-2`, `-3` etc. on collisions. `include()` (lines 79-84) eager-loads `storefrontDesign` and `deliverySetting.areas`.

**Purpose**: vendor dashboard's "store setup" CRUD. Renamed from `/store` → `/vendor/shop` in the previous session (worklog lines 70-71).

**Overlaps with**: `VendorProfileController.PATCH /vendor/profile` (also updates Store.{name,slug,description}). The two controllers have **non-overlapping route prefixes** so no NestJS conflict — but they duplicate business logic and the previous session did NOT update the api-client `storeApi` to point at `/vendor/shop` (see §5).

### 1.4 `apps/api/src/modules/commerce/` — `PublicVendorsController` + `VendorCommerceController`

**Files**: `commerce.controller.ts` (463 lines, 9 controllers), `commerce.service.ts` (3845 lines), `commerce.module.ts` (33 lines), `commerce.dto.ts` (591 lines), `paystack.service.ts`.

**`PublicVendorsController`** (`commerce.controller.ts:40-72`):
- `@Controller('vendors')` — the public-facing vendor storefront.
- `GET :slug` → `commerce.getPublicStore(slug)` — returns the Store + storefrontDesign + first 8 active products + 6 active poolOffers (`commerce.service.ts:1317-1345`).
- `GET :slug/products` → `commerce.listPublicStoreProducts(slug, {limit,search,category,source})` (`commerce.service.ts:1347-1396`).
- `GET :slug/products/:productSlug` → `commerce.getPublicStoreProduct(slug, productSlug)` (`commerce.service.ts:1398-1429`).
- **NO `@Get()` root handler** — this is the 404 cause (see §3).

**`VendorCommerceController`** (`commerce.controller.ts:222-351`):
- `@Controller('vendor')` (singular) — the authenticated vendor's commerce ops.
- `GET /vendor/dashboard` (line 227-230)
- `GET /vendor/products`, `POST /vendor/products`, `PATCH /vendor/products/:productId` (lines 232-249)
- `GET /vendor/delivery-settings`, `PATCH /vendor/delivery-settings` (lines 251-259)
- `POST /vendor/inventory/adjustments` (line 261), `POST /vendor/digital-assets` (line 266)
- `GET /vendor/orders` (line 271) — LIST, paginated, filtered by status/search/dateRange
- `GET /vendor/orders/:orderId` (line 283) — single order detail
- `PATCH /vendor/orders/:orderId/status` (line 288) — generic status transition via `commerce.updateVendorOrderStatus`
- `GET /vendor/pool/catalog`, `POST /vendor/pool/offers`, `POST /vendor/pool/selections`, `PATCH/DELETE /vendor/pool/selections/:offerId`, `PATCH /vendor/pool/offers/:offerId` (lines 297-340)
- `GET /vendor/storefront-design`, `PATCH /vendor/storefront-design` (lines 342-350)

**Prisma models**: `Store`, `Product`, `Order`, `OrderItem`, `Payment`, `ParentCheckout`, `Fulfillment`, `Escrow`, `StorefrontDesign`, `StoreDeliverySetting`, `VendorPoolOffer`, `PoolProduct`, `InventoryItem`, `DigitalAsset`, `Coupon`, `DeliveryRate`, `Address`.

**Purpose**: the main vendor commerce brain (dashboard, products, orders, pool, storefront design, delivery settings).

**Overlaps with**:
- `VendorOrdersController` (`orders.controller.ts:53`) at `@Controller('vendor/orders')` — **route conflict** on `GET /vendor/orders/:id` (see §3.5).
- `VendorStoreController` at `/vendor/shop` — manages the same Store row's profile fields.
- `VendorProfileController` at `/vendor/profile` — also manages Store.{name,slug,description}.

### 1.5 Other vendor-prefixed controllers

Grep `@Controller('vendor|seller|store` across `apps/api/src` returned 14 controllers. Full table:

| Module | File:Line | Controller decorator | Prisma model(s) | Purpose | Overlaps |
|---|---|---|---|---|---|
| sellers | `sellers.controller.ts:7` | `@Controller('sellers')` | `Store` | Public list of verified stores | PublicVendorsController (same data, different URL/shape) |
| vendor-profile | `vendor-profile.controller.ts:33` | `@Controller('vendor/profile')` | `User`+`UserProfile`+`Store` | Update vendor's personal + store info | VendorStoreController (also updates Store) |
| vendor-store | `vendor-store.controller.ts:15` | `@Controller('vendor/shop')` | `Store` (+`StorefrontDesign`, `StoreDeliverySetting`) | Vendor's own store CRUD + logo/banner | VendorProfileController (also updates Store) |
| commerce | `commerce.controller.ts:40` | `@Controller('vendors')` | `Store`+`Product` | Public storefront + product listing | sellers (same Store data; missing LIST route) |
| commerce | `commerce.controller.ts:74` | `@Controller('cart')` | `Cart`+`CartItem` | Cart CRUD | — |
| commerce | `commerce.controller.ts:133` | `@Controller('delivery-rates')` | `DeliveryRate` | Public delivery fee lookup | — |
| commerce | `commerce.controller.ts:143` | `@Controller('checkout')` | `Order`+`Payment`+`ParentCheckout` | Checkout + payment verify | — |
| commerce | `commerce.controller.ts:159` | `@Controller('payments')` | `Payment` | Paystack intents + webhooks | — |
| commerce | `commerce.controller.ts:191` | `@Controller('orders')` | `Order` | Buyer's own orders list/detail (only GET, no actions) | VendorOrdersController at `/vendor/orders` (different prefix, no conflict) |
| commerce | `commerce.controller.ts:207` | `@Controller('pool')` | `VendorPoolOffer`+`PoolCampaign` | Public pool offers/campaigns | — |
| commerce | `commerce.controller.ts:222` | `@Controller('vendor')` | `Store`+`Product`+`Order` | Vendor commerce ops (dashboard, products, orders, pool, storefront-design) | VendorOrdersController (route conflict on `GET /vendor/orders/:id` — see §3.5) |
| commerce | `commerce.controller.ts:353` | `@Controller('admin')` | many | Admin commerce overview, payments, pool, orders, delivery rates | — |
| orders | `orders.controller.ts:53` | `@Controller('vendor/orders')` | `Order`+`Store` | Vendor order detail + accept/reject/prepare/ready/cancel actions | VendorCommerceController (route conflict on `GET /vendor/orders/:id`); also `updateOrderStatus` duplicates the actions semantically |
| order-operations | `order-operations.controller.ts:36` | `@Controller('vendor/orders')` | `Order`+`OrderNote` | Add internal note to order (`POST :id/note`) | Same prefix as VendorOrdersController but unique sub-path — no conflict |
| payments | `payments.controller.ts:24` | `@Controller('vendor/wallet')` | `Wallet`+`Transaction`+`Withdrawal`+`Escrow` | Vendor wallet balance, transactions, withdrawals, escrow-holdings | VendorEscrowController (route conflict on `GET /vendor/wallet/escrow-holdings` — see §3.6) |
| notifications | `notifications.controller.ts:21` | `@Controller('vendor/notifications')` | `Notification` | Vendor notifications list, unread-count, mark-read | — |
| notifications | `push-notifications.controller.ts:10` | `@Controller('notifications/push')` | `PushSubscription` | Web-push subscribe/unsubscribe/vapid-key | — |
| delivery | `delivery.controllers.ts:27` | `@Controller('vendor/deliveries')` | `Delivery` | Vendor delivery list + preparing/ready/pickup-confirm transitions | — |
| delivery | `delivery.controllers.ts:85` | `@Controller('vendor/wallet')` | `Escrow` | `GET /vendor/wallet/escrow-holdings` (duplicate of payments route) | PaymentsController (route conflict — see §3.6) |
| delivery | `delivery.controllers.ts:101` | `@Controller('admin/deliveries')` | `Delivery`+`Rider` | Admin assign/reassign rider, list all deliveries | — |
| delivery | `delivery.controllers.ts:152` | `@Controller('admin/escrow')` | `Escrow` | Admin manual escrow release/refund | — |
| analytics | `analytics.controller.ts:16` | `@Controller('vendor/analytics')` | `Order`+`Product`+`User` | Vendor analytics overview/revenue/products/orders/customers | — |
| subscriptions | `subscriptions.controller.ts:124` | `@Controller('vendor/subscription')` | `Subscription` | Vendor subscription current/plans/change-plan/cancel/invoices | api-client `subscriptionsApi` calls `/subscriptions/*` (plural, no `vendor/` prefix) — every call 404s |
| kyc | `kyc.controller.ts:36` | `@Controller('vendor/kyc')` | `KycDocument`+`Store` | Vendor KYC status/submit/submissions | — |

---

## 2. The Prisma "Vendor" Entity

### 2.1 `UserRole` enum (`schema.prisma:15-21`)

```prisma
enum UserRole {
  BUYER
  VENDOR
  ADMIN
  RIDER
  SUPER_ADMIN
}
```

**No `SELLER`, `MERCHANT`, or `STORE_OWNER` role exists.** A vendor is identified solely by `role = VENDOR`.

### 2.2 `User` model (`schema.prisma:59-100`)

Key fields: `id`, `email`, `phone`, `passwordHash`, `role UserRole @default(BUYER)`, `status UserStatus @default(PENDING)`, `emailVerified`. `@@unique([email, role])` — the same email can register under different roles.

Relations to vendor-side entities:
- `profile UserProfile?` (1:1) — `schema.prisma:70`
- `store Store?` (1:1) — `schema.prisma:73` — **a vendor (User with role=VENDOR) owns exactly one Store**
- `subscription Subscription?` (1:1) — `schema.prisma:74`
- `kwikCoins KwikCoins?` (1:1) — `schema.prisma:75`
- `kycDocuments KycDocument[]` (1:N) — `schema.prisma:72`
- `wallet Wallet?` (1:1) — `schema.prisma:87`
- `withdrawals Withdrawal[]` — `schema.prisma:88`
- `vendorMilestones VendorMilestone[]` — `schema.prisma:77`
- `adminPermission AdminPermission?` — `schema.prisma:89` (for admin role)

### 2.3 `Store` model (`schema.prisma:197-234`)

```prisma
model Store {
  id                      String             @id @default(cuid())
  vendorId                String             @unique        // ← FK to User.id (1:1)
  name                    String
  slug                    String             @unique
  description             String?
  logoUrl                 String?
  bannerUrl               String?
  category                String?
  isVerified              Boolean            @default(false)
  onboardingComplete      Boolean            @default(false)
  onboardingStep          OnboardingStep     @default(NOT_STARTED)
  verificationStatus      VerificationStatus @default(NOT_SUBMITTED)
  bankCode                String?
  bankName                String?
  accountNumber           String?
  accountName             String?
  deliverySetupComplete   Boolean            @default(false)
  // ...timestamps
  vendor      User          @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  products    Product[]
  orders      Order[]       @relation("StoreOrders")
  poolOffers  VendorPoolOffer[]
  storefrontDesign StorefrontDesign?
  deliverySetting StoreDeliverySetting?
  deliveryZones StoreDeliveryZone[]
}
```

This is the de-facto "vendor profile" — name, slug, description, logo, banner, KYC verification flags, bank details, onboarding state. **The previous session decided to KEEP this model name as an internal DB entity** (worklog lines 114-116) and only rename the HTTP routes. That decision is internally consistent: no Prisma migration was needed, no `prisma.store.*` call across 15+ services had to change. The friction it creates is purely semantic — devs reading the code see `Store` everywhere but the URL/frontend says "vendor".

### 2.4 No `Seller` Prisma model

Grep confirms: the word `model Seller` does not appear in `schema.prisma`. The `sellers` module (`apps/api/src/modules/sellers/`) is a route-only abstraction that lists `Store` rows. "Seller" is a marketing/surface term for "a Store that has products for sale".

### 2.5 No `VendorProfile` Prisma model

Grep confirms: the word `model VendorProfile` does not appear in `schema.prisma`. The `vendor-profile` module (`apps/api/src/modules/vendor-profile/`) is a route-only convenience that patches `User.profile` + `Store` in one transaction.

### 2.6 `UserProfile` model (`schema.prisma:102-114`)

```prisma
model UserProfile {
  id          String   @id @default(cuid())
  userId      String   @unique
  firstName   String?
  lastName    String?
  avatarUrl   String?
  bio         String?
  dateOfBirth DateTime?
  // ...
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

This holds the human-side personal info for any User (not vendor-specific). The `vendor-profile` controller updates this alongside `Store`.

### 2.7 Vendor Entity Architecture Diagram

```
                       ┌─────────────────────┐
                       │      User           │  schema.prisma:59-100
                       │  role = VENDOR      │  (1:1 with Store via Store.vendorId @unique)
                       │  status = ACTIVE    │
                       └──────────┬──────────┘
                                  │
            ┌─────────────────────┼─────────────────────────────┐
            │                     │                              │
            ▼                     ▼                              ▼
   ┌────────────────┐   ┌──────────────────┐          ┌────────────────────┐
   │  UserProfile   │   │      Store       │          │  KycDocument[]     │
   │  schema:102    │   │  schema:197-234  │          │  schema:142        │
   │  (personal)    │   │  (the "vendor    │          │  (KYC docs: NIN,   │
   │                │   │   profile" row)  │          │   CAC, TIN, etc.)  │
   └────────────────┘   └────────┬─────────┘          └────────────────────┘
                                 │
        ┌────────────────────────┼────────────────────────────┐
        │                        │                            │
        ▼                        ▼                            ▼
  ┌───────────┐         ┌─────────────────┐         ┌─────────────────────┐
  │ Product[] │         │  Order[]        │         │ VendorPoolOffer[]   │
  │ schema:751│         │  schema:1139    │         │ (pool-resale links) │
  │ storeId   │         │  storeId        │         └─────────────────────┘
  └─────┬─────┘         │  buyerId → User │
        │               │  paymentStatus  │
        ▼               │  fulfillments[] │
  ┌──────────────┐      └─────────────────┘
  │ ProductMedia │
  │ Variant[]    │
  │ InventoryItem│
  └──────────────┘

  Also 1:1 on User (vendor): Subscription, KwikCoins, Wallet, AdminPermission(n/a)
```

### 2.8 Answer: What IS a "vendor"?

A **vendor** in this system = a `User` row with `role = VENDOR` + its associated `Store` row (1:1 via `Store.vendorId @unique`). The `Store` row carries the business identity (name, slug, logo, banner, verification, bank). Optional satellites: `KycDocument[]`, `Subscription`, `KwikCoins`, `Wallet`. The fragmentation across module names (`sellers`, `vendor-profile`, `vendor-store`, `commerce`) is purely a route/controller organization issue — they ALL read/write the same `User`+`Store` Prisma entities. There is no separate "Seller" or "VendorProfile" table.

---

## 3. The `GET /api/v1/vendors` 404 Root Cause

### 3.1 The controller

`apps/api/src/modules/commerce/commerce.controller.ts:40-72`:

```typescript
@Controller('vendors')
export class PublicVendorsController {
  constructor(private readonly commerce: CommerceService) {}

  @Public()
  @Get(':slug')
  getVendor(@Param('slug') slug: string) {
    return this.commerce.getPublicStore(slug);
  }

  @Public()
  @Get(':slug/products/:productSlug')
  getStoreProduct(@Param('slug') slug: string, @Param('productSlug') productSlug: string) {
    return this.commerce.getPublicStoreProduct(slug, productSlug);
  }

  @Public()
  @Get(':slug/products')
  getStoreProducts(
    @Param('slug') slug: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('source') source?: string,
  ) {
    return this.commerce.listPublicStoreProducts(slug, { limit: limit ? Number(limit) : undefined, search, category, source });
  }
}
```

**Three routes, all parametric on `:slug`.** There is **no `@Get()` (no-param) handler**. When the request `GET /api/v1/vendors` arrives, NestJS's router tries to match `/vendors` against:
- `:slug` — would match `/vendors/{X}` where X is the slug; the empty path after `/vendors` does NOT match `:slug` because `:slug` requires a non-empty segment.
- `:slug/products` and `:slug/products/:productSlug` — also require a `:slug` segment.

No route matches → NestJS returns 404.

### 3.2 The frontend caller

`apps/marketplace/src/lib/api-hooks.ts:468-477`:

```typescript
export function useStores() {
  return useQuery({
    queryKey: ["stores"],
    queryFn: async () => {
      const res = await api.get<unknown[]>("vendors");
      return res.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}
```

This hook is consumed by the `/vendors` page (`apps/marketplace/src/app/vendors/page.tsx:46, 649-674`):

```typescript
import { useStores } from "@/lib/api-hooks";
// ...
const storesQuery = useStores();
const isLoadingVendors = storesQuery.isLoading;
const apiVendors = useMemo<VendorData[]>(
  () => ((storesQuery.data ?? []) as Array<Record<string, unknown>>).map(...),
  [storesQuery.data],
);
```

The page silently renders an empty state ("No vendors found") because `useQuery` swallows the 404 into `isError=true` + `data=undefined`.

### 3.3 Module registration check

`apps/api/src/app.module.ts:164` imports `CommerceModule`, which `commerce.module.ts:18-28` registers `PublicVendorsController` in its `controllers: [...]` array. So the controller IS registered — the 404 is NOT a missing-module issue, it's a missing-route issue.

### 3.4 No alternative controller conflicts

Grep confirms there is exactly **one** `@Controller('vendors')` in the entire `apps/api/src` tree (`commerce.controller.ts:40`). No other controller would intercept `GET /vendors`. The 404 is purely because no `@Get()` root handler exists on the one registered controller.

### 3.5 Route conflict: `GET /vendor/orders/:id` (related)

`VendorCommerceController` (`commerce.controller.ts:222`) at `@Controller('vendor')` registers `GET /vendor/orders/:orderId` (line 283). `VendorOrdersController` (`orders.controller.ts:53`) at `@Controller('vendor/orders')` registers `GET /vendor/orders/:id` (line 174). Both resolve to the URL pattern `/vendor/orders/{param}`.

`CommerceModule` is imported at `app.module.ts:164` (before `OrdersModule` at line 182), and within `CommerceModule`'s controllers array `VendorCommerceController` appears before... actually NestJS explores modules in import order. The first-registered route wins. **The practical effect**: `GET /vendor/orders/:id` is handled by `VendorCommerceController.getOrder` → `commerce.getVendorOrder` (returns order with escrow, delivery, fulfillments). `VendorOrdersController.getOrderDetail` is **shadowed / dead**.

This is not the cause of the `/vendors` 404, but it's the same class of bug (overlapping route prefixes between `@Controller('vendor')` and `@Controller('vendor/orders')`).

### 3.6 Route conflict: `GET /vendor/wallet/escrow-holdings` (related)

`PaymentsController` (`payments.controller.ts:24`) at `@Controller('vendor/wallet')` registers `GET /vendor/wallet/escrow-holdings` (line 88). `VendorEscrowController` (`delivery.controllers.ts:85`) at `@Controller('vendor/wallet')` ALSO registers `GET /vendor/wallet/escrow-holdings` (line 90).

`PaymentsModule` (`app.module.ts:167`) is imported before `DeliveryModule` (line 188), so `PaymentsController.getEscrowHoldings` (calling `escrowService.getVendorHoldings`) wins. `VendorEscrowController.getEscrowHoldings` (calling `deliveryService.getEscrowHoldings`) is **shadowed / dead**.

### 3.7 Exact 404 Root Cause + Fix (DOCUMENT ONLY — DO NOT IMPLEMENT)

**Root cause**: `PublicVendorsController` (`apps/api/src/modules/commerce/commerce.controller.ts:40-72`) defines only parametric `:slug` routes; there is no `@Public() @Get()` root handler. The marketplace's `useStores()` hook calls `GET /api/v1/vendors` (no params) and gets a 404 because no route matches the bare `/vendors` path.

**Fix (documented, not implemented)**: Add a `@Public() @Get()` handler on `PublicVendorsController` that lists verified, onboarded stores. The exact query already exists in `SellersController.list()` (`apps/api/src/modules/sellers/sellers.controller.ts:11-59`) and can be lifted verbatim or delegated:

```typescript
// In PublicVendorsController (commerce.controller.ts:40-72)
@Public()
@Get()
listVendors(@Query('limit') limit?: string) {
  return this.commerce.listPublicStores({ limit }); // new service method
}
```

Where `CommerceService.listPublicStores()` would query `prisma.store.findMany({ where: { isVerified: true, onboardingComplete: true }, ... })` — mirroring `sellers.controller.ts:17-38`.

**Alternative (smaller fix, NOT recommended long-term)**: change the marketplace `useStores()` hook (`api-hooks.ts:472`) from `api.get("vendors")` to `api.get("sellers")`. This re-routes the marketplace to the existing `/sellers` endpoint, but re-introduces "sellers" terminology into a codebase the user wants to be vendor-only. **Recommendation: implement the `@Get()` handler on `PublicVendorsController` instead.**

---

## 4. Product → Vendor Prisma Relation Chain

### 4.1 The exact chain

`Product.storeId → Store.vendorId → User` (with `User.role = VENDOR`).

`schema.prisma:751-835` — `Product` model:
```prisma
model Product {
  id              String        @id @default(cuid())
  storeId         String        // ← FK to Store.id
  // ...
  store       Store           @relation(fields: [storeId], references: [id], onDelete: Cascade)
  // ...
  @@unique([storeId, slug])
  @@index([storeId])
}
```

`schema.prisma:197-234` — `Store` model:
```prisma
model Store {
  vendorId   String  @unique       // ← FK to User.id (1:1)
  // ...
  vendor     User    @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  products   Product[]
}
```

So: **`Product.storeId → Store.id`, `Store.vendorId → User.id` (vendor)**. There is no direct `Product.vendorId` and no `Product.sellerId`. The product's vendor is reached ONLY through its `Store`.

### 4.2 Implication for "GET /vendors"

A `GET /vendors` LIST endpoint should return `Store` rows (with optional `vendor: { id, email, profile: { firstName, lastName, avatarUrl } }` and `_count: { products, orders }`), filtered to `isVerified: true, onboardingComplete: true` for public visibility. This is exactly what `SellersController.list()` already does at `sellers.controller.ts:17-56`.

### 4.3 OrderItem seller fields

`schema.prisma:1215-1248` — `OrderItem` has `sellerStoreId String?`, `sourceStoreId String?`, `sourceProductId String?`, `sourceBasePrice Float?`, `resellerMargin Float?`. These are denormalized fields for pool-resale scenarios (when the buyer's order item was sourced from a different vendor's store via the pool mechanism). They are NOT separate FKs to a `Seller` model — they're snapshot strings written at checkout time (`commerce.service.ts:760-766`).

---

## 5. Marketplace Frontend Vendor Calls

### 5.1 `apps/marketplace/src/lib/api-hooks.ts`

| Hook | Line | HTTP call | Backend route | Status |
|---|---|---|---|---|
| `useStores()` | 468-477 | `api.get("vendors")` | `GET /api/v1/vendors` | **404 — no LIST route on PublicVendorsController** |
| `useStore(slug)` | 479-489 | `api.get("vendors/${slug}")` | `GET /api/v1/vendors/:slug` | ✅ works (commerce.controller.ts:45) |
| `useStoreProducts(slug)` | 491-501 | `api.get("vendors/${slug}/products")` | `GET /api/v1/vendors/:slug/products` | ✅ works (commerce.controller.ts:57) |

### 5.2 `apps/marketplace/src/lib/order-api.ts`

| Hook | Line | HTTP call | Backend route | Status |
|---|---|---|---|---|
| `useMyOrders(status)` | 115-123 | `api.get("orders", {params:{status}})` | `GET /api/v1/orders` | ✅ works (commerce.controller.ts:196 — buyer-scoped to `buyerId`) |
| `useOrder(id)` | 126-141 | `api.get("orders/${id}")` + poll 4s while PENDING | `GET /api/v1/orders/:id` | ✅ works (commerce.controller.ts:201) |
| `useVendorOrders(status)` | 144-153 | `api.get("vendor/orders", {params:{status}})` + poll 5s | `GET /api/v1/vendor/orders` | ✅ works (commerce.controller.ts:271) — but this is a **marketplace-page hook hitting a vendor-scoped route**; only works if the logged-in user is a Vendor with a Store |
| `useVendorAnalytics(period)` | 206-217 | `api.get("vendor/analytics", {params:{period}})` | `GET /api/v1/vendor/analytics` (no sub-path) | **404** — `VendorAnalyticsController` has only `overview`, `revenue`, `products`, `orders`, `customers` sub-paths; no root `@Get()` |
| `useCheckout()` | 222-233 | `api.post("checkout", payload)` | `POST /api/v1/checkout` | ✅ works (commerce.controller.ts:148) |
| `useQuoteOrder()` | 235-261 | `api.post("orders/${orderId}/quote", {deliveryFee,discount,discountType})` | `POST /api/v1/orders/:id/quote` | **404** — `OrdersController` (`@Controller('orders')`) has only `GET /` and `GET /:orderId`; no `POST /:id/quote` route exists anywhere |
| `useVendorOrderAction()` | 263-274 | `api.post("orders/${orderId}/${action}", ...)` (action ∈ accept/reject/ready/ship/cancel) | `POST /api/v1/orders/:id/:action` | **404** — no `POST /orders/:id/accept|reject|ready|ship|cancel` route exists. The actual vendor action routes are `PATCH /vendor/orders/:id/accept` etc. (orders.controller.ts:184-236) |
| `useVerifyPayment()` | 276-283 | `api.get("checkout/payments/${reference}")` | `GET /api/v1/checkout/payments/:reference` | ✅ works (commerce.controller.ts:153) |
| `useRedeemWallet()` | 314-325 | `api.post("wallet/redeem", payload)` | `POST /api/v1/wallet/redeem` | **404** — no `@Controller('wallet')` with a `redeem` route exists |
| `useVendorReviews(storeId)` | 361-371 | `api.get("reviews/vendor/${storeId}")` | `GET /api/v1/reviews/vendor/:storeId` | **404** — `ReviewsController` (`reviews.controller.ts:21`) has only `summary/:productId`, `:productId`, `eligibility/:productId`, `POST /`, `POST /:id/helpful`. No `vendor/:storeId` route |
| `useReplyToReview()` | 377-388 | `api.post("reviews/${reviewId}/reply", {text, authorName})` | `POST /api/v1/reviews/:id/reply` | **404** — no such route |
| `useDeleteReviewReply()` | 394-405 | `api.delete("reviews/${reviewId}/reply")` | `DELETE /api/v1/reviews/:id/reply` | **404** — no such route |
| `useDeliveryAgentLeaderboard()` | 452-461 | `api.get("delivery-agents")` | `GET /api/v1/delivery-agents` | **404** — no `@Controller('delivery-agents')` exists |
| `useDeliveryAgent(agentId)` | 466-482 | `api.get("delivery-agents/${agentId}")` | `GET /api/v1/delivery-agents/:id` | **404** |
| `useDeliveryAgentRatings(agentId)` | 488-508 | `api.get("delivery-agents/${agentId}/ratings")` | `GET /api/v1/delivery-agents/:id/ratings` | **404** |
| `useDeliveryRating(orderId)` | 522-532 | `api.get("orders/${orderId}/delivery-rating")` | `GET /api/v1/orders/:id/delivery-rating` | **404** — no such route on `OrdersController` |
| `useRateDelivery()` | 538-563 | `api.post("orders/${orderId}/delivery-rating", {rating,comment,tags})` | `POST /api/v1/orders/:id/delivery-rating` | **404** |
| `useSubmitTicket()` | 590-601 | `api.post("support/tickets", payload)` | `POST /api/v1/support/tickets` | **404** — no `@Controller('support')` exists |
| `useNotificationPreferences()` | 630-641 | `api.get("users/me/notification-preferences")` | `GET /api/v1/users/me/notification-preferences` | likely **404** — would need to check UsersController |
| `useUpdateNotificationPreferences()` | 647-679 | `api.put("users/me/notification-preferences", patch)` | `PUT /api/v1/users/me/notification-preferences` | likely **404** |

### 5.3 Marketplace pages that consume vendor data

- **`/vendors` page** (`apps/marketplace/src/app/vendors/page.tsx:46, 649`): uses `useStores()` → **404**. Renders empty state.
- **`/vendor/[slug]` storefront page** (`apps/marketplace/src/app/vendor/[slug]/page.tsx:18, 83-84`): uses `useStore(slug)` + `useStoreProducts(slug)` → ✅ works.
- **`/vendor/[slug]/products`**, **`/vendor/[slug]/product/[productSlug]`**, **`/vendor/[slug]/cart`**, **`/vendor/[slug]/orders`**, **`/vendor/[slug]/checkout`**, **`/vendor/[slug]/details`**, **`/vendor/[slug]/more`** — all live under `apps/marketplace/src/app/vendor/[slug]/`. The product/PDP displays vendor name + link via the `VendorSummary` component (`apps/marketplace/src/components/product/shared/vendor-summary.tsx`).

### 5.4 Product card / PDP vendor display

`apps/marketplace/src/lib/api-hooks.ts:55-91` (`toMarketplaceProduct`):
```typescript
store: p.store?.name || "Kwikseller",
storeId: p.storeId,
storeSlug: p.store?.slug,
```

So the marketplace reads `product.store.name` and `product.store.slug` from the API Product response. The `VendorSummary` component (`vendor-summary.tsx:34`) links to `/vendors/${storeSlug}` when a slug is present:
```typescript
const href = storeSlug ? `/vendors/${storeSlug}` : storeId ? `/vendors?store=${storeId}` : "/vendors";
```

This works for the PDP vendor link (deep-linking to `/vendor/[slug]` — note: the storefront is at `/vendor/[slug]` singular, while the directory is at `/vendors` plural — a quirk but not a bug).

### 5.5 Marketplace `/vendor-orders` page (legacy vendor UI inside marketplace)

`apps/marketplace/src/app/vendor-orders/page.tsx` (834 lines) — uses `useVendorOrders`, `useQuoteOrder`, `useVendorOrderAction`, `useVendorReviews`, `useReplyToReview`, `useDeleteReviewReply`, `useStores`. Of these:
- `useVendorOrders` ✅ works
- `useStores` → 404
- `useQuoteOrder` → 404
- `useVendorOrderAction` → 404
- `useVendorReviews` → 404
- `useReplyToReview` → 404
- `useDeleteReviewReply` → 404

So this entire page is mostly non-functional against the live backend. It appears to be a legacy vendor-side UI that was built before the dedicated `apps/vendor/` dashboard. It uses `DEFAULT_STORE_ID = "store-zara"` (line 48) — a dummy-data identifier that doesn't exist in the real DB.

---

## 6. Vendor Dashboard Frontend (`apps/vendor/`)

### 6.1 Routes / pages

`apps/vendor/src/app/dashboard/`:
- `page.tsx` — dashboard home (metrics via `vendorCommerceApi.getDashboard`)
- `orders/page.tsx` — order list (uses `vendorCommerceApi.listOrders`)
- `orders/[id]/page.tsx` — order detail + status transitions (uses `vendorCommerceApi.getOrder` + `vendorCommerceApi.updateOrderStatus`)
- `products/page.tsx`, `products/new/page.tsx`, `products/[id]/edit/page.tsx`, `products/inventory/page.tsx` — product CRUD
- `inventory/page.tsx` — inventory view (uses `vendorCommerceApi`)
- `pool/page.tsx`, `pool/product/[productKey]/page.tsx` — pool catalog + offer management
- `storefront/page.tsx` — storefront design + logo/banner upload (**uses `storeApi` → 404**)
- `analytics/page.tsx` — analytics (uses `vendorCommerceApi.getStorefrontDesign` + `analyticsApi`)
- `wallet/page.tsx` — wallet + escrow (uses `paymentsApi` + `escrowApi`)
- `subscriptions/page.tsx` — subscription plans (uses `subscriptionsApi` → **404**)
- `kyc/page.tsx` — KYC submission (uses `usersApi` + `uploadApi`)
- `delivery/page.tsx`, `deliveries/page.tsx` — delivery management (uses `vendorCommerceApi`)
- `messages/page.tsx` — messages (likely stub)
- `notifications/page.tsx` — notifications (uses `notificationsApi` → **404**)
- `settings/page.tsx` — store settings (**uses `storeApi` → 404**)
- `profile/page.tsx` — vendor profile (**uses `storeApi` → 404**)
- `onboarding/page.tsx` — store onboarding wizard (**uses `storeApi` → 404**)
- `search/page.tsx` — vendor-scoped product search
- `help/page.tsx` — help center

### 6.2 `storeApi` is broken (api-client not updated after `/store` → `/vendor/shop` rename)

`packages/api-client/src/index.ts:575-613` — `storeApi` still uses the OLD `/store` paths:

```typescript
export const storeApi = {
  get: () => api.get('/store'),                                       // ← should be /vendor/shop
  create: (data) => api.post('/store', data),                         // ← should be /vendor/shop
  update: (data) => api.patch('/store', data),                        // ← should be /vendor/shop
  uploadLogo: (file) => api.post('/store/logo', formData, ...),       // ← should be /vendor/shop/logo
  uploadBanner: (file) => api.post('/store/banner', formData, ...),   // ← should be /vendor/shop/banner
  getAnalytics: (period) => api.get('/store/analytics', ...),         // ← no such route; analytics lives at /vendor/analytics/*
}
```

The previous session renamed the backend route `/store` → `/vendor/shop` (worklog lines 70-71) and updated `marketplace/src/lib/api-hooks.ts` + `order-api.ts` (worklog lines 80-81), but **did NOT update `packages/api-client/src/index.ts:storeApi`**. Every `storeApi.*` call from the vendor dashboard now 404s.

Vendor dashboard pages that use `storeApi` (confirmed via grep):
- `settings/page.tsx:222, 247, 319, 324, 343, 347, 364` — `storeApi.get()`, `storeApi.update()` (multiple)
- `profile/page.tsx:290, 424, 452, 481` — `storeApi.get()`, `uploadLogo()`, `uploadBanner()`, `update()`
- `onboarding/page.tsx:516, 698, 1459, 1478` — `storeApi.uploadLogo()`, `uploadBanner()`, `create()`, `update()`
- `storefront/page.tsx:603, 647, 655, 658` — `storeApi.get()`, `update()`, `uploadLogo()`, `uploadBanner()`

Plus `storefront/page.tsx:684` opens `/store/${slug}` in a new tab — but `apps/vendor/src/app/` has NO `/store/[slug]` page (only the marketplace has `/vendor/[slug]`). So the "View storefront" button links to a 404 in the vendor app.

### 6.3 Other broken vendor-dashboard API calls

| api-client object | Method | Calls | Backend route | Status |
|---|---|---|---|---|
| `storeApi` | all | `/store`, `/store/logo`, `/store/banner`, `/store/analytics` | renamed to `/vendor/shop`, `/vendor/shop/logo`, `/vendor/shop/banner`; `/store/analytics` never existed | **404** |
| `subscriptionsApi` | `getPlans` | `/subscriptions/plans` | backend at `/vendor/subscription/plans` (singular) | **404** |
| `subscriptionsApi` | `getCurrentPlan` | `/subscriptions/current` | backend at `/vendor/subscription/current` | **404** |
| `subscriptionsApi` | `subscribe` | `POST /subscriptions` | backend at `POST /vendor/subscription/change-plan` | **404** |
| `subscriptionsApi` | `cancel` | `POST /subscriptions/cancel` | backend at `POST /vendor/subscription/cancel` | **404** |
| `subscriptionsApi` | `renew` | `POST /subscriptions/renew` | no such route | **404** |
| `notificationsApi` | `list` | `/notifications` | backend at `/vendor/notifications` | **404** |
| `notificationsApi` | `markAsRead` | `PATCH /notifications/:id/read` | backend at `PATCH /vendor/notifications/:id/read` | **404** |
| `notificationsApi` | `markAllAsRead` | `POST /notifications/read-all` | backend at `POST /vendor/notifications/read-all` | **404** |
| `notificationsApi` | `getUnreadCount` | `/notifications/unread-count` | backend at `/vendor/notifications/unread-count` | **404** |
| `notificationsApi` | `subscribePush` / `unsubscribePush` / `getVapidKey` | `/notifications/push/*` | backend at `@Controller('notifications/push')` | ✅ works |
| `onboardingApi` | `getStatus` / `completeStep` / `complete` | `/vendor/onboarding/*` | **no `@Controller('vendor/onboarding')` exists** | **404** |
| `analyticsApi` | `getTopProducts` | `/vendor/analytics/top-products` | backend has `/vendor/analytics/products` instead | **404** |
| `analyticsApi` | `getCategories` | `/vendor/analytics/categories` | no such route | **404** |
| `analyticsApi` | `getOverview` / `getRevenue` / `getProducts` / `getOrders` / `getCustomers` | `/vendor/analytics/{overview,revenue,products,orders,customers}` | matches backend | ✅ works |
| `paymentsApi` | `getWallet` / `getWalletTransactions` / `requestWithdrawal` / `getWithdrawals` | `/vendor/wallet*` | matches backend | ✅ works |
| `escrowApi` | `getHoldings` | `/vendor/wallet/escrow-holdings` | matches backend (PaymentsController wins route conflict) | ✅ works |
| `vendorCommerceApi` | all | `/vendor/*` (dashboard, products, orders, pool, storefront-design, delivery-settings) | matches backend | ✅ works |
| `vendorProfileApi` | `update` | `PATCH /vendor/profile` | matches backend | ✅ works |
| `orderOperationsApi` | `addNote` | `POST /vendor/orders/:id/note` | matches backend (VendorOrderOperationsController) | ✅ works |
| `kycApi` | `getStatus` / `submitKyc` / `getSubmissions` | `/vendor/kyc/*` | matches backend | ✅ works |
| `vendorDeliveriesApi` | (check) | `/vendor/deliveries/*` | matches backend (VendorDeliveryController) | likely ✅ |

### 6.4 Quote-submission UI

**There is NO quote-submission UI in the vendor dashboard (`apps/vendor/`).** The vendor dashboard's order detail page (`apps/vendor/src/app/dashboard/orders/[id]/page.tsx:139-143, 347-360`) only has:
- A primary action button that calls `vendorCommerceApi.updateOrderStatus(id, nextStatus)` — cycling PENDING→CONFIRMED→PROCESSING→FULFILLED→SHIPPED→DELIVERED via `nextPrimaryAction()` (lines 71-78)
- A "Cancel order" button that calls `updateStatusMutation.mutate("CANCELLED")` (line 347)

The **quote-submission UI exists only in the marketplace's legacy `/vendor-orders` page** (`apps/marketplace/src/app/vendor-orders/page.tsx:80, 235-261`) — via `useQuoteOrder()` which calls `POST /orders/:id/quote` → **404** (no backend route).

So quote submission is broken end-to-end: no backend route + only the legacy marketplace page attempts to call it; the modern vendor dashboard has no quote UI at all.

### 6.5 Wallet UI

`apps/vendor/src/app/dashboard/wallet/page.tsx` exists and uses `paymentsApi` + `escrowApi`. These call:
- `paymentsApi.getWallet()` → `GET /vendor/wallet` ✅
- `paymentsApi.getWalletTransactions()` → `GET /vendor/wallet/transactions` ✅
- `paymentsApi.requestWithdrawal()` → `POST /vendor/wallet/withdraw` ✅
- `paymentsApi.getWithdrawals()` → `GET /vendor/wallet/withdrawals` ✅
- `escrowApi.getHoldings()` → `GET /vendor/wallet/escrow-holdings` ✅ (PaymentsController's handler wins the route conflict)

Wallet UI is fully wired and functional.

### 6.6 Order list with status transitions

`apps/vendor/src/app/dashboard/orders/page.tsx` (list) + `orders/[id]/page.tsx` (detail). The list uses `vendorCommerceApi.listOrders()` ✅. The detail page has the status transition buttons described in §6.4 — **but the "Accept order" button is broken** because the backend rejects `PAID → CONFIRMED` (see §7.3).

---

## 7. Marketplace ↔ Vendor Communication

### 7.1 The order placement flow (marketplace side)

1. Buyer adds to cart (`POST /api/v1/cart/items` — `commerce.controller.ts:94`).
2. Buyer checks out (`POST /api/v1/checkout` — `commerce.controller.ts:148`, service `commerce.service.ts:580-870`).
3. `checkout()` creates a `ParentCheckout` + one `Order` per store group (`commerce.service.ts:722-782`), with `status: 'PENDING_PAYMENT'` and `paymentStatus: 'PENDING'`.
4. Buyer is redirected to Paystack. On callback, marketplace hits `GET /api/v1/checkout/payments/:reference` → `verifyPayment()` (`commerce.service.ts:929-975`).
5. `verifyPayment` calls `processSuccessfulPayment` (`commerce.service.ts:2706-2825`) which:
   - Updates `Payment.status = PAID`
   - Updates `ParentCheckout.status = PAID, paymentStatus = PAID`
   - For each order: updates `Order.status = PAID, paymentStatus = PAID` (line 2770-2773)
   - Commits inventory reservations (`commitReservations`)
   - Creates `Fulfillment` rows (`createFulfillmentsForPaidOrder`)
   - **DOES NOT call `notificationService.create()` for the vendor** — the vendor is never notified.

### 7.2 Real-time channel — DOES NOT EXIST

Grep for `WebSocketGateway|socket.io|@WebSocket` across `apps/api/src` returned **zero matches**. The codebase has:
- `EventEmitterModule` (`app.module.ts:92-100`) for in-process events
- `NotificationService.create()` (`apps/api/src/common/services/notification.service.ts:23-`) which writes a `Notification` row + emits `notification.created` event
- `NotificationEventListener` (`apps/api/src/common/services/notification-event.listener.ts:24-71`) which listens for `notification.created` and dispatches a web-push (NOT websocket) to the user's registered `PushSubscription` devices.

There is **no real-time push to a logged-in vendor dashboard**. The vendor dashboard sees updates only when:
- The vendor manually refreshes the page
- A react-query cache invalidation happens (e.g., after a vendor-initiated mutation)
- The legacy marketplace `/vendor-orders` page polls every 5s (`order-api.ts:151`, `refetchInterval: 5000`)

The vendor dashboard's own orders list (`apps/vendor/src/app/dashboard/orders/page.tsx:167-179`) uses `useQuery` with **no `refetchInterval`** — so it doesn't poll.

### 7.3 The "vendor cannot accept order" bug

When a buyer pays, the order goes from `PENDING_PAYMENT` → `PAID` (`commerce.service.ts:2770-2773`).

The vendor dashboard's order detail page (`apps/vendor/src/app/dashboard/orders/[id]/page.tsx:71-78`) computes the next action:

```typescript
function nextPrimaryAction(status: OrderStatus): { label: string; status: OrderStatus } | null {
  if (status === "PENDING" || status === "PAID") return { label: "Accept order", status: "CONFIRMED" };
  if (status === "CONFIRMED") return { label: "Mark preparing", status: "PROCESSING" };
  if (status === "PROCESSING") return { label: "Mark ready to ship", status: "FULFILLED" };
  if (status === "FULFILLED") return { label: "Mark shipped", status: "SHIPPED" };
  if (status === "SHIPPED") return { label: "Mark delivered", status: "DELIVERED" };
  return null;
}
```

When the vendor clicks "Accept order", the dashboard calls `vendorCommerceApi.updateOrderStatus(id, "CONFIRMED")` (`orders/[id]/page.tsx:139-143, 358`):

```typescript
const updateStatusMutation = useMutation({
  mutationFn: async (status: OrderStatus) => {
    await vendorCommerceApi.updateOrderStatus(id, status);  // → PATCH /vendor/orders/:id/status {status:"CONFIRMED"}
  },
  ...
});
```

The backend handler is `VendorCommerceController.updateOrderStatus` (`commerce.controller.ts:288-295`) → `commerce.updateVendorOrderStatus` (`commerce.service.ts:1882-1900`) → `transitionOrderStatus` (`commerce.service.ts:3337-3391`).

`commerce.service.ts:80-92` — the transition map:
```typescript
const ORDER_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['PENDING_PAYMENT', 'CANCELLED'],
  PENDING_PAYMENT: ['PAID', 'CANCELLED'],
  PENDING: ['PAID', 'CANCELLED'],
  PAID: ['PROCESSING', 'FULFILLED', 'CANCELLED', 'REFUNDED'],   // ← NO 'CONFIRMED'
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['FULFILLED', 'SHIPPED', 'CANCELLED', 'REFUNDED'],
  FULFILLED: ['DELIVERED', 'REFUNDED'],
  SHIPPED: ['DELIVERED', 'REFUNDED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
};
```

`transitionOrderStatus` checks `allowed = ORDER_TRANSITIONS[order.status]` (line 3360) and throws `BadRequestException('Cannot move order from PAID to CONFIRMED')` if `CONFIRMED` is not in the allowed list (line 3361-3363).

**Effect**: when a buyer pays (order becomes PAID), the vendor clicks "Accept order" → backend returns 400 "Cannot move order from PAID to CONFIRMED" → the vendor dashboard shows an error toast and the order remains in PAID. The vendor cannot progress the order using the dashboard's primary action button.

**The alternative route that DOES work**: `PATCH /vendor/orders/:id/accept` (`orders.controller.ts:184-192`) — handled by `VendorOrdersController.transitionStatus` which uses its OWN `VALID_TRANSITIONS` map (lines 33-47) where `accept: ['PENDING', 'PAID'] → 'CONFIRMED'`. This route is registered and reachable. But:
1. The vendor dashboard does NOT call this route — it calls `PATCH /vendor/orders/:id/status` instead.
2. The api-client's `vendorCommerceApi.acceptOrder(orderId, note)` (line 745-746) DOES target this route correctly — but it's not invoked from the vendor dashboard's order detail page.

### 7.4 Where communication BREAKS — summary

| Stage | What should happen | What actually happens | Break point |
|---|---|---|---|
| Buyer places order | Order row created with `storeId` pointing to vendor's Store | ✅ works (`commerce.service.ts:728-773`) | — |
| Buyer pays | Order `status = PAID`, payment recorded | ✅ works (`commerce.service.ts:2770-2773`) | — |
| Vendor is notified of new paid order | Vendor receives push/email/in-app notification | ❌ `processSuccessfulPayment` never calls `notificationService.create()` for the vendor | `commerce.service.ts:2706-2825` — no notification call |
| Vendor dashboard sees the new order | Vendor dashboard's order list refreshes to show the new PAID order | ❌ No `refetchInterval` on `useQuery`; only refreshes on manual navigation | `apps/vendor/src/app/dashboard/orders/page.tsx:167-179` — no polling |
| Vendor clicks "Accept order" | Order transitions PAID → CONFIRMED; buyer sees status update | ❌ Backend rejects: `PAID → CONFIRMED` is not in `ORDER_TRANSITIONS.PAID` | `commerce.service.ts:84` — `PAID: ['PROCESSING', 'FULFILLED', 'CANCELLED', 'REFUNDED']` (missing `CONFIRMED`) + `apps/vendor/src/app/dashboard/orders/[id]/page.tsx:72` (frontend sends `CONFIRMED`) |
| Vendor submits a delivery quote | Buyer sees quote (delivery fee + discount) on order page | ❌ No backend route `POST /orders/:id/quote`; no quote UI in vendor dashboard | `apps/marketplace/src/lib/order-api.ts:235-261` calls non-existent route; vendor dashboard has no quote UI |
| Buyer sees vendor's status updates on order page | Marketplace order detail polls and reflects vendor's status changes | ✅ works for `useOrder(id)` (`order-api.ts:135-139` — polls every 4s while PENDING) but stops polling once status leaves PENDING | partial — polling stops too early (PAID, CONFIRMED, PROCESSING, etc. don't poll) |

---

## 8. The "Vendor" vs "Store" vs "Seller" Audit

### 8.1 Is "Store" (Prisma model) actually the vendor's shop/profile?

**YES.** `schema.prisma:197-234` — `Store` carries: `name`, `slug`, `description`, `logoUrl`, `bannerUrl`, `category`, `isVerified`, `onboardingComplete`, `verificationStatus`, `bankCode`, `bankName`, `accountNumber`, `accountName`, `deliverySetupComplete`. These are all vendor-business attributes. The `Store` row is the vendor's commercial identity on the platform.

The previous session's decision to **keep the Prisma `Store` model name as an internal DB entity** (worklog lines 114-116) is defensible — it avoided a schema migration and the cascading `prisma.store.*` call updates across 15+ service files. The trade-off is **semantic friction**: every developer reading the code sees `Store` everywhere but the URL, frontend, and discussion all say "vendor". A future rename to `Vendor` or `VendorStore` Prisma model would be cleaner but is non-trivial.

### 8.2 Is "Seller" a separate concept or a synonym for vendor?

**A synonym.** `sellers.controller.ts:17-38` queries `prisma.store.findMany({where:{isVerified:true, onboardingComplete:true}})` — there is no `Seller` Prisma model, no `sellerId` foreign key. "Seller" is purely a route name (`/sellers`) for the public "top sellers" leaderboard. It returns the same `Store` rows that the vendor system manages.

`OrderItem.sellerStoreId` (`schema.prisma:1227`) is a denormalized snapshot field for pool-resale scenarios — it's a String, not an FK to a Seller table. It points to the `Store.id` that "sold" the item (which may differ from the `Order.storeId` if the item was sourced from another vendor's pool).

### 8.3 Is "VendorProfile" the KYC/details side of a vendor?

**NO — the name is misleading.** `vendor-profile.controller.ts:33-130` is a single PATCH endpoint that updates `User.phone`, `UserProfile.{firstName,lastName}`, and `Store.{name,slug,description}` together. There is no `VendorProfile` Prisma model.

The KYC/details side of a vendor is spread across:
- `KycDocument[]` model (`schema.prisma:142-159`) — uploaded documents (NIN, CAC, TIN, etc.)
- `Store.verificationStatus`, `Store.isVerified`, `Store.rejectionReason`, `Store.verificationReviewedAt`, `Store.verificationReviewedBy` — KYC approval state on the Store row
- `Store.bankCode`, `Store.bankName`, `Store.accountNumber`, `Store.accountName` — payout details on the Store row
- `UserProfile.{firstName,lastName,avatarUrl,bio,dateOfBirth}` — personal info on the User's profile row

The `vendor-profile` controller is really a "update vendor's personal + store identity in one call" convenience endpoint, not a KYC/details endpoint. The KYC submission is handled by `kyc.controller.ts:36` (`@Controller('vendor/kyc')`).

### 8.4 Unification recommendation (DOCUMENT ONLY — DO NOT IMPLEMENT)

The fragmentation is purely at the **module/route layer**, not the data layer. All vendor data already lives in `User` + `Store` (+ satellites). The cleanest unification paths, in increasing order of invasiveness:

**Option A — consolidate routes (low effort, recommended next step)**:
- Move `SellersController.list()` query into `PublicVendorsController` as a new `@Get()` handler. Then either delete `SellersController` or make `/sellers` a 308 redirect to `/vendors`.
- Merge `VendorProfileController.updateProfile` into `VendorStoreController` (rename to `VendorStoreController.updateProfile` or split into `PATCH /vendor/shop/profile` and `PATCH /vendor/shop/store`). This eliminates the dual-write overlap on `Store.{name,slug,description}`.
- Move `VendorOrdersController` (orders module) routes into `VendorCommerceController` (commerce module) — they're at the same URL prefix and the route conflict on `GET /vendor/orders/:id` is currently resolved by accident (commerce wins by import order). Folding them together makes the intent explicit. The `accept/reject/prepare/ready/cancel` action routes (`PATCH /vendor/orders/:id/accept` etc.) should replace the generic `PATCH /vendor/orders/:id/status` route — OR the `ORDER_TRANSITIONS.PAID` map should be extended to include `'CONFIRMED'` so the generic route works.
- Resolve the `@Controller('vendor/wallet')` duplicate registration — `VendorEscrowController.getEscrowHoldings` (delivery module) is shadowed by `PaymentsController.getEscrowHoldings` (payments module). Either delete the dead route or move it to a unique path.

**Option B — unify the api-client (medium effort)**:
- Update `packages/api-client/src/index.ts:storeApi` to use `/vendor/shop*` paths (fixes vendor dashboard settings/profile/onboarding/storefront pages).
- Update `subscriptionsApi` to use `/vendor/subscription/*` (singular) + `change-plan` instead of `subscribe`.
- Update `notificationsApi` (list, markAsRead, markAllAsRead, getUnreadCount) to use `/vendor/notifications/*`.
- Either implement `onboardingApi` backend routes or remove the api-client stub.
- Fix `analyticsApi.getTopProducts` to call `/vendor/analytics/products`; remove `getCategories` or implement the backend route.

**Option C — rename the Prisma `Store` model to `Vendor` (high effort, NOT recommended now)**:
- Requires a Prisma migration (SQLite, so straightforward but touches the schema).
- Requires updating every `prisma.store.*` call across `commerce.service.ts` (≈30 call sites), `sellers.controller.ts`, `vendor-store.service.ts`, `vendor-profile.controller.ts`, `orders.controller.ts`, `analytics.service.ts`, `dashboard.service.ts`, `delivery.service.ts`, `escrow.service.ts`, `wallet.service.ts`, `kyc.controller.ts`, `subscriptions.controller.ts`, `seed.ts`.
- Not justified by current pain — the previous session correctly concluded the data layer is fine; only the route/UI layer needs cleanup.

**Consistency check on the previous session's decision**: the decision to keep `Store` as the Prisma model name while renaming routes is **internally consistent** at the data layer, but it created the friction documented in §5.2 and §6.3: the api-client `storeApi` was not updated, and several route renames (`/subscriptions` → `/vendor/subscription`, `/notifications` → `/vendor/notifications`) were never propagated to the api-client at all (these predate the previous session but were never fixed). The previous session's narrow scope ("rename `/store` → `/vendor/shop`") was correctly executed for the marketplace, but it left the vendor dashboard's `storeApi` calls dangling.

---

## 9. Gaps & Observations (consolidated)

### 9.1 The 404 root cause + exact fix (DOCUMENT ONLY)

- **Root cause**: `PublicVendorsController` (`apps/api/src/modules/commerce/commerce.controller.ts:40-72`) defines only `@Get(':slug')`, `@Get(':slug/products')`, `@Get(':slug/products/:productSlug')`. There is no `@Get()` (root, no-param) handler. The marketplace `useStores()` hook calls `GET /api/v1/vendors` (no params) → 404.
- **Fix**: add `@Public() @Get()` handler to `PublicVendorsController` that returns a list of verified, onboarded stores. The query already exists in `apps/api/src/modules/sellers/sellers.controller.ts:17-56` — lift it into a new `CommerceService.listPublicStores()` method (or have `PublicVendorsController` inject `PrismaService` directly and inline the query, matching the `SellersController` pattern).

### 9.2 Missing list endpoint for vendors

- `GET /api/v1/vendors` (LIST) — **MISSING**. Fix above.
- The closest existing LIST is `GET /api/v1/sellers` (`sellers.controller.ts:12`) which queries the same `Store` model with the same filters but at a different URL and with a different response shape.

### 9.3 Frontend calls to non-existent backend routes (404 waiting to happen)

Marketplace (`apps/marketplace/src/lib/order-api.ts` + `api-hooks.ts`):
- `useStores()` → `GET /vendors` → 404 (the headline bug)
- `useVendorAnalytics()` → `GET /vendor/analytics` (root) → 404 (backend only has sub-paths)
- `useQuoteOrder()` → `POST /orders/:id/quote` → 404 (no such route)
- `useVendorOrderAction()` → `POST /orders/:id/:action` → 404 (vendor actions are `PATCH /vendor/orders/:id/:action`, not `POST /orders/:id/:action`)
- `useRedeemWallet()` → `POST /wallet/redeem` → 404 (no `@Controller('wallet')` with redeem)
- `useVendorReviews()` → `GET /reviews/vendor/:storeId` → 404 (no such route on `ReviewsController`)
- `useReplyToReview()` → `POST /reviews/:id/reply` → 404
- `useDeleteReviewReply()` → `DELETE /reviews/:id/reply` → 404
- `useDeliveryAgentLeaderboard()` → `GET /delivery-agents` → 404 (no controller)
- `useDeliveryAgent()` → `GET /delivery-agents/:id` → 404
- `useDeliveryAgentRatings()` → `GET /delivery-agents/:id/ratings` → 404
- `useDeliveryRating()` → `GET /orders/:id/delivery-rating` → 404
- `useRateDelivery()` → `POST /orders/:id/delivery-rating` → 404
- `useSubmitTicket()` → `POST /support/tickets` → 404 (no `@Controller('support')`)

Vendor dashboard (via `packages/api-client/src/index.ts`):
- `storeApi.*` (all 6 methods) → 404 (route renamed to `/vendor/shop`)
- `subscriptionsApi.*` (all 5 methods) → 404 (backend at `/vendor/subscription/*`, singular)
- `notificationsApi.{list, markAsRead, markAllAsRead, getUnreadCount}` → 404 (backend at `/vendor/notifications/*`)
- `onboardingApi.*` (all 3 methods) → 404 (no `@Controller('vendor/onboarding')` exists)
- `analyticsApi.getTopProducts` → 404 (should be `/vendor/analytics/products`)
- `analyticsApi.getCategories` → 404 (no such route)

### 9.4 Backend routes with no frontend caller (dead routes)

- `VendorOrdersController.getOrderDetail` (`orders.controller.ts:174-182`) — `GET /vendor/orders/:id` is shadowed by `VendorCommerceController.getOrder` (commerce.controller.ts:283). The first-registered route wins; commerce is imported before orders.
- `VendorEscrowController.getEscrowHoldings` (`delivery.controllers.ts:90-94`) — `GET /vendor/wallet/escrow-holdings` is shadowed by `PaymentsController.getEscrowHoldings` (payments.controller.ts:88). PaymentsModule imported before DeliveryModule.
- `VendorOrdersController.{acceptOrder, rejectOrder, prepareOrder, readyOrder, cancelOrder}` (`orders.controller.ts:184-236`) — these `PATCH /vendor/orders/:id/accept|reject|prepare|ready|cancel` routes ARE reachable (no overlap with commerce's `PATCH /vendor/orders/:orderId/status`), but the vendor dashboard never calls them. The api-client's `vendorCommerceApi.acceptOrder/rejectOrder/prepareOrder/readyOrder/cancelOrder` (lines 745-758) DO target them correctly — but no vendor dashboard page invokes these api-client methods (the dashboard uses `updateOrderStatus` instead). So the routes + their api-client wrappers are both technically dead.
- `SellersController.list()` (`sellers.controller.ts:12`) — if the marketplace `/vendors` page is fixed to call `GET /vendors` (with the new LIST handler), then `/sellers` becomes orphaned unless something else still calls it. Grep the marketplace for `sellers` would confirm — but the worklog says the marketplace was migrated to use `vendors` exclusively (worklog line 80).

### 9.5 Communication break between marketplace and vendor dashboard

See §7.4 for the full table. The three concrete breaks:

1. **No vendor notification on buyer payment** — `processSuccessfulPayment` (`commerce.service.ts:2706-2825`) never calls `notificationService.create()` for the vendor. The vendor learns about a new order only by manually refreshing the dashboard.

2. **No polling on the vendor dashboard orders list** — `apps/vendor/src/app/dashboard/orders/page.tsx:167-179` uses `useQuery` with no `refetchInterval`. The legacy marketplace `/vendor-orders` page DOES poll every 5s (`order-api.ts:151`), but the modern vendor dashboard does not.

3. **Vendor "Accept order" button is broken** — the dashboard sends `PATCH /vendor/orders/:id/status {status:"CONFIRMED"}` but `ORDER_TRANSITIONS.PAID` (`commerce.service.ts:84`) does not include `'CONFIRMED'`. The backend throws `Cannot move order from PAID to CONFIRMED`. The vendor dashboard should either:
   - Call `vendorCommerceApi.acceptOrder(id)` (which hits `PATCH /vendor/orders/:id/accept` — the orders-module route that DOES allow `PAID → CONFIRMED`), OR
   - The `ORDER_TRANSITIONS.PAID` map should be extended to include `'CONFIRMED'`.

4. **No quote-submission flow** — the marketplace has a `useQuoteOrder()` hook that calls `POST /orders/:id/quote` (404 — no backend route), and the vendor dashboard has no quote UI at all. So vendors cannot quote delivery fees or discounts to buyers.

5. **No real-time channel** — there is no `@WebSocketGateway` or socket.io server. All "real-time" updates rely on react-query polling (which the vendor dashboard doesn't do) or web-push notifications (which aren't sent on buyer payment).

---

## Appendix A — Vendor Module Map (quick reference)

| Module | File | Controller decorator | Prisma model(s) | Routes | Purpose | Overlap |
|---|---|---|---|---|---|---|
| sellers | `modules/sellers/sellers.controller.ts:7` | `@Controller('sellers')` | `Store` | `GET /sellers` | Public list of verified stores (top sellers) | PublicVendorsController (same data, different URL/shape; missing LIST route on /vendors) |
| vendor-profile | `modules/vendor-profile/vendor-profile.controller.ts:33` | `@Controller('vendor/profile')` | `User`+`UserProfile`+`Store` | `PATCH /vendor/profile` | Update vendor's personal + store identity in one call | VendorStoreController (also updates Store.{name,slug,description}) |
| vendor-store | `modules/vendor-store/vendor-store.controller.ts:15` | `@Controller('vendor/shop')` | `Store` (+`StorefrontDesign`, `StoreDeliverySetting`) | `GET/POST/PATCH /vendor/shop`, `POST /vendor/shop/logo`, `POST /vendor/shop/banner` | Vendor's own store CRUD + logo/banner uploads | VendorProfileController (also updates Store); api-client `storeApi` was NOT updated and still calls `/store/*` → 404 |
| commerce (public vendors) | `modules/commerce/commerce.controller.ts:40` | `@Controller('vendors')` | `Store`+`Product` | `GET /vendors/:slug`, `GET /vendors/:slug/products`, `GET /vendors/:slug/products/:productSlug` | Public storefront + product listing | **MISSING `GET /vendors` LIST route** → marketplace `/vendors` page 404s |
| commerce (vendor) | `modules/commerce/commerce.controller.ts:222` | `@Controller('vendor')` | `Store`+`Product`+`Order`+`Payment`+`Fulfillment`+`Escrow`+`VendorPoolOffer`+`StorefrontDesign`+`StoreDeliverySetting` | `GET /vendor/dashboard`, `GET/POST/PATCH /vendor/products[/:id]`, `GET/PATCH /vendor/delivery-settings`, `POST /vendor/inventory/adjustments`, `POST /vendor/digital-assets`, `GET /vendor/orders`, `GET /vendor/orders/:orderId`, `PATCH /vendor/orders/:orderId/status`, `GET /vendor/pool/catalog`, `POST /vendor/pool/offers`, `POST/POST/PATCH/DELETE /vendor/pool/selections[/:id]`, `PATCH /vendor/pool/offers/:id`, `GET/PATCH /vendor/storefront-design` | Vendor commerce brain | VendorOrdersController (route conflict on `GET /vendor/orders/:id` — commerce wins by import order) |
| orders (vendor) | `modules/orders/orders.controller.ts:53` | `@Controller('vendor/orders')` | `Order`+`Store` | `GET /vendor/orders/:id`, `PATCH /vendor/orders/:id/{accept,reject,prepare,ready,cancel}` | Vendor order detail + status-action transitions | VendorCommerceController (route conflict on `GET /vendor/orders/:id`); the action routes ARE unique but unused by the vendor dashboard |
| order-operations | `modules/order-operations/order-operations.controller.ts:36` | `@Controller('vendor/orders')` | `Order`+`OrderNote` | `POST /vendor/orders/:id/note` | Add internal note to order | Same prefix as orders module; unique sub-path — no conflict |
| payments (vendor wallet) | `payments/payments.controller.ts:24` | `@Controller('vendor/wallet')` | `Wallet`+`Transaction`+`Withdrawal`+`Escrow` | `GET /vendor/wallet`, `GET /vendor/wallet/transactions`, `POST /vendor/wallet/withdraw`, `GET /vendor/wallet/withdrawals`, `GET /vendor/wallet/escrow-holdings` | Vendor wallet + escrow holdings | VendorEscrowController (route conflict on `GET /vendor/wallet/escrow-holdings` — payments wins) |
| delivery (vendor) | `modules/delivery/delivery.controllers.ts:27` | `@Controller('vendor/deliveries')` | `Delivery` | `GET /vendor/deliveries`, `POST /vendor/deliveries/:id/{preparing,ready,pickup-confirm}`, `GET /vendor/deliveries/:id/tracking` | Vendor delivery lifecycle | — |
| delivery (vendor escrow — DEAD) | `modules/delivery/delivery.controllers.ts:85` | `@Controller('vendor/wallet')` | `Escrow` | `GET /vendor/wallet/escrow-holdings` | Vendor escrow holdings (duplicate) | PaymentsController (shadowed — DEAD route) |
| notifications (vendor) | `modules/notifications/notifications.controller.ts:21` | `@Controller('vendor/notifications')` | `Notification` | `GET /vendor/notifications`, `GET /vendor/notifications/unread-count`, `PATCH /vendor/notifications/:id/read`, `POST /vendor/notifications/read-all` | Vendor notifications | api-client `notificationsApi` calls `/notifications/*` (no `vendor/` prefix) → 404 |
| notifications (push) | `modules/notifications/push-notifications.controller.ts:10` | `@Controller('notifications/push')` | `PushSubscription` | `GET /notifications/push/vapid-public-key`, `POST /notifications/push/subscribe`, `DELETE /notifications/push/unsubscribe` | Web-push subscription | — |
| analytics | `modules/analytics/analytics.controller.ts:16` | `@Controller('vendor/analytics')` | `Order`+`Product`+`User` | `GET /vendor/analytics/{overview,revenue,products,orders,customers}` | Vendor analytics | api-client `analyticsApi.getTopProducts` calls `/vendor/analytics/top-products` (no such route); `getCategories` calls `/vendor/analytics/categories` (no such route); marketplace `useVendorAnalytics` calls `/vendor/analytics` (root, no sub-path) → 404 |
| subscriptions | `modules/subscriptions/subscriptions.controller.ts:124` | `@Controller('vendor/subscription')` (singular) | `Subscription` | `GET /vendor/subscription/{current,plans,invoices}`, `POST /vendor/subscription/change-plan`, `POST /vendor/subscription/cancel` | Vendor subscription management | api-client `subscriptionsApi` calls `/subscriptions/*` (plural, no `vendor/` prefix) → 404 on every method |
| kyc | `modules/kyc/kyc.controller.ts:36` | `@Controller('vendor/kyc')` | `KycDocument`+`Store` | `GET /vendor/kyc/status`, `POST /vendor/kyc/submit`, `GET /vendor/kyc/submissions` | Vendor KYC submission + status | — |
| onboarding (MISSING) | — | (no `@Controller('vendor/onboarding')` exists) | — | — | — | api-client `onboardingApi` calls `/vendor/onboarding/{status,step,complete}` → 404 |

---

## Appendix B — Vendor Entity Architecture Diagram (text)

```
   ┌──────────────────────────────────────────────────────────────────────┐
   │                            USER (schema.prisma:59)                    │
   │  id • email • phone • passwordHash • role=VENDOR • status=ACTIVE     │
   │  @@unique([email, role])                                              │
   └──────────────┬───────────────────────────────────────────────────────┘
                  │ 1:1 (Store.vendorId @unique)
                  │ 1:1 (UserProfile.userId @unique)
                  │ 1:1 (Subscription.vendorId @unique)
                  │ 1:1 (KwikCoins.vendorId @unique)
                  │ 1:1 (Wallet.userId)
                  │ 1:N (KycDocument.userId)
                  │ 1:N (VendorMilestone.vendorId)
                  ▼
   ┌──────────────────────────────────────────────────────────────────────┐
   │                          STORE (schema.prisma:197)                    │
   │  id • vendorId • name • slug • description • logoUrl • bannerUrl     │
   │  category • isVerified • onboardingComplete • verificationStatus     │
   │  bankCode • bankName • accountNumber • accountName                  │
   │  deliverySetupComplete                                               │
   │                                                                        │
   │  ← 1:1 User (vendor)                                                  │
   │  → 1:N Product          (Product.storeId → Store.id)                  │
   │  → 1:N Order            (Order.storeId → Store.id, "StoreOrders")     │
   │  → 1:N VendorPoolOffer                                                 │
   │  → 1:1 StorefrontDesign                                                │
   │  → 1:1 StoreDeliverySetting → 1:N StoreDeliveryArea                    │
   │  → 1:N StoreDeliveryZone                                               │
   └──────────────┬───────────────────────────────────────────────────────┘
                  │ 1:N (Product.storeId)
                  ▼
   ┌──────────────────────────────────────────────────────────────────────┐
   │                       PRODUCT (schema.prisma:751)                     │
   │  id • storeId • name • slug • price • status • productSource         │
   │  ← 1:1 Store                                                           │
   │  → 1:N ProductMedia, ProductVariant, InventoryItem, DigitalAsset      │
   │  → 1:N Review, ProductQuestion                                         │
   │  → 1:N CartItem, OrderItem                                             │
   └──────────────────────────────────────────────────────────────────────┘

   Other 1:1 satellites on User (vendor):
     • UserProfile (schema:102)  — firstName, lastName, avatarUrl, bio, dob
     • Subscription (schema:277) — plan, status, productLimit, adCredits
     • KwikCoins (schema:296)    — balance, totalEarned, totalSpent
     • Wallet                    — availableBalance, pendingBalance, totalEarned
     • AdminPermission           — n/a (admin role only)

   KYC documents (1:N on User):
     • KycDocument (schema:142) — type (NIN/CAC/TIN/...), status, documentUrl
```

---

## Appendix C — `GET /api/v1/vendors` 404 Root Cause + Fix (DOCUMENT ONLY)

### Root cause (precise)

**File**: `apps/api/src/modules/commerce/commerce.controller.ts`
**Lines**: 40-72

```typescript
@Controller('vendors')                                    // line 40
export class PublicVendorsController {
  constructor(private readonly commerce: CommerceService) {}

  @Public()
  @Get(':slug')                                            // line 45  → GET /vendors/:slug
  getVendor(@Param('slug') slug: string) { ... }

  @Public()
  @Get(':slug/products/:productSlug')                      // line 51  → GET /vendors/:slug/products/:productSlug
  getStoreProduct(...) { ... }

  @Public()
  @Get(':slug/products')                                   // line 57  → GET /vendors/:slug/products
  getStoreProducts(...) { ... }
}
```

There is **no `@Get()` (no-param) handler**. NestJS route matching for `GET /api/v1/vendors` (no path segments after `/vendors`) finds no match → returns 404.

### Caller (marketplace)

**File**: `apps/marketplace/src/lib/api-hooks.ts`
**Lines**: 468-477

```typescript
export function useStores() {
  return useQuery({
    queryKey: ["stores"],
    queryFn: async () => {
      const res = await api.get<unknown[]>("vendors");     // line 472  → GET /api/v1/vendors → 404
      return res.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}
```

### Consumer (marketplace `/vendors` page)

**File**: `apps/marketplace/src/app/vendors/page.tsx`
**Lines**: 46, 649-674

```typescript
import { useStores } from "@/lib/api-hooks";              // line 46
// ...
const storesQuery = useStores();                           // line 649
const apiVendors = useMemo<VendorData[]>(                 // line 651-674
  () => ((storesQuery.data ?? []) as Array<Record<string, unknown>>).map(...),
  [storesQuery.data],
);
```

### Fix (DOCUMENT ONLY — DO NOT IMPLEMENT)

Add a `@Public() @Get()` root handler to `PublicVendorsController` that lists verified, onboarded stores. The query already exists in `apps/api/src/modules/sellers/sellers.controller.ts:17-56` and can be lifted into a new `CommerceService.listPublicStores()` method:

```typescript
// In PublicVendorsController (commerce.controller.ts:40-72)
@Public()
@Get()                                                     // NEW: GET /vendors (LIST)
listVendors(@Query('limit') limit?: string) {
  return this.commerce.listPublicStores({ limit });
}
```

```typescript
// In CommerceService
async listPublicStores(options: { limit?: string } = {}) {
  const take = options.limit ? Math.min(Number(options.limit), 100) : 10;
  const stores = await this.db().store.findMany({
    where: { isVerified: true, onboardingComplete: true },
    take,
    orderBy: { createdAt: 'desc' },
    include: {
      vendor: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
      _count: { select: { products: true, orders: true } },
    },
  });
  return { data: stores };  // match SellersController response shape
}
```

This mirrors `SellersController.list()` exactly and unblocks the marketplace `/vendors` page. After this fix, the `SellersController` (`/sellers` route) becomes redundant and can be deleted or redirected.

---

## Appendix D — Marketplace ↔ Vendor Communication Break (precise)

### D.1 No vendor notification on buyer payment

**File**: `apps/api/src/modules/commerce/commerce.service.ts`
**Method**: `processSuccessfulPayment` (lines 2706-2825)
**Issue**: The method updates `Payment.status = PAID`, `ParentCheckout.status = PAID`, `Order.status = PAID`, commits reservations, creates fulfillments — but **never calls `this.notificationService.create()` for the vendor** (the store's `vendorId`).

Compare to `escrow.service.ts:82` (PAYMENT_HELD), `wallet.service.ts:91` (WITHDRAWAL_REQUESTED), `users.service.ts:451` (KYC_STATUS) — these all create notifications. But `processSuccessfulPayment` does not.

**Fix (DOCUMENT ONLY)**: After the `Order.status = PAID` update (line 2772), call:
```typescript
await this.notificationService.create({
  userId: order.store?.vendorId ?? /* resolve vendorId from storeId */,
  type: 'ORDER_RECEIVED',
  title: 'New order received',
  message: `Order ${order.checkoutReference} for ₦${order.totalAmount} was just paid.`,
  data: { orderId: order.id, storeId: order.storeId },
});
```

(Requires injecting `NotificationService` into `CommerceService`, and the `Notification` model may need an `ORDER_RECEIVED` type added to its enum if it's an enum — check `schema.prisma` Notification model.)

### D.2 No polling on vendor dashboard orders list

**File**: `apps/vendor/src/app/dashboard/orders/page.tsx`
**Lines**: 167-179

```typescript
const ordersQuery = useQuery({
  queryKey: ["vendor-orders", page, activeTab.queryStatus ?? "ALL", deferredSearch, dateRange],
  queryFn: async () => {
    const response = await vendorCommerceApi.listOrders({ ... });
    return unwrapApiData<OrderListResponse>(response.data);
  },
  placeholderData: keepPreviousData,
  // ← NO refetchInterval
});
```

**Fix (DOCUMENT ONLY)**: add `refetchInterval: 10_000` (10s) to keep the dashboard fresh, or implement a websocket push.

### D.3 Vendor "Accept order" button is broken

**File (frontend)**: `apps/vendor/src/app/dashboard/orders/[id]/page.tsx`
**Lines**: 71-78 (action map), 139-143 (mutation), 358 (button click)

```typescript
function nextPrimaryAction(status: OrderStatus): { label: string; status: OrderStatus } | null {
  if (status === "PENDING" || status === "PAID") return { label: "Accept order", status: "CONFIRMED" };  // line 72
  // ...
}

const updateStatusMutation = useMutation({
  mutationFn: async (status: OrderStatus) => {
    await vendorCommerceApi.updateOrderStatus(id, status);  // → PATCH /vendor/orders/:id/status {status:"CONFIRMED"}
  },
  // ...
});
```

**File (backend)**: `apps/api/src/modules/commerce/commerce.service.ts`
**Lines**: 80-92 (transition map), 3360-3363 (validation)

```typescript
const ORDER_TRANSITIONS: Record<string, string[]> = {
  // ...
  PAID: ['PROCESSING', 'FULFILLED', 'CANCELLED', 'REFUNDED'],   // line 84 — 'CONFIRMED' is MISSING
  // ...
};
```

`transitionOrderStatus` throws `BadRequestException('Cannot move order from PAID to CONFIRMED')` when the vendor clicks "Accept order" on a PAID order.

**Fix (DOCUMENT ONLY)** — two options:
- **Option 1 (backend)**: add `'CONFIRMED'` to `ORDER_TRANSITIONS.PAID` (line 84). Minimal change, unblocks the dashboard's existing call.
- **Option 2 (frontend)**: change `apps/vendor/src/app/dashboard/orders/[id]/page.tsx:358` to call `vendorCommerceApi.acceptOrder(id)` (which hits `PATCH /vendor/orders/:id/accept` — the orders-module route with its own permissive `VALID_TRANSITIONS` map at `orders.controller.ts:41-47`). This uses the existing dedicated action route instead of the generic status route.

### D.4 No quote-submission flow

- **Marketplace side**: `apps/marketplace/src/lib/order-api.ts:235-261` — `useQuoteOrder()` calls `POST /api/v1/orders/:id/quote`. **No such backend route exists.** Grep `@Post('quote')` and `orders/:id/quote` in `apps/api/src` returns zero matches.
- **Vendor dashboard side**: no quote UI exists. `apps/vendor/src/app/dashboard/orders/[id]/page.tsx` has only Accept/Cancel/Mark preparing/Mark ready/Mark shipped/Mark delivered buttons — no "Submit quote" form.
- **Fix (DOCUMENT ONLY)**: either implement `POST /vendor/orders/:id/quote` on the backend (with a new `Quote` DTO and `commerce.quoteOrder()` method that updates `Order.shippingFee` + `Order.discount` + `Order.totalAmount`), or remove the `useQuoteOrder` hook + the marketplace `/vendor-orders` page entirely (since the modern vendor dashboard doesn't use quotes).

### D.5 No real-time channel

Grep `WebSocketGateway|socket.io|@WebSocket` in `apps/api/src` returned zero matches. The system relies on:
- react-query polling (marketplace `/vendor-orders` polls every 5s — `order-api.ts:151`; vendor dashboard does NOT poll)
- web-push (only on `notification.created` events, which are NOT emitted on buyer payment)

**Fix (DOCUMENT ONLY)**: either add `refetchInterval` to the vendor dashboard queries (cheap), or introduce a `@WebSocketGateway` on the API + a socket.io client in the vendor dashboard (expensive but proper real-time).

---

**End of audit.**
