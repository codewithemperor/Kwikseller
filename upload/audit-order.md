# Audit — Order + Checkout + Cart System (Task 2-b)

**Scope:** NestJS + Prisma (SQLite) backend at `apps/api/`, Next.js marketplace frontend at `apps/marketplace/`. Read-only audit — no code changes.
**Audit date:** Current session. **Auditor:** sub-agent 2-b.
**Verdict:** The intended "Place Order → Vendor Quote → Quote Agreement → Payment → KwisCrow → Fulfillment → Confirmation → Release → Vendor Wallet" flow is **NOT implemented end-to-end on the backend**. The backend implements a *different* (Paystack-first, no-quote) flow, while the marketplace frontend ships a *third* (mock-only) workflow in localStorage. The three layers disagree on order-status vocabulary, escrow ownership, and who triggers each transition.

---

## 1. Order Schema — `apps/api/prisma/schema.prisma`

### 1.1 The `Order` model — lines 1139–1188

```prisma
model Order {
  id            String        @id @default(cuid())
  buyerId       String
  storeId       String
  parentCheckoutId String?
  status        OrderStatus   @default(PENDING_PAYMENT)          // ← single dimension
  subtotal      Float
  shippingFee   Float         @default(0)
  discount      Float         @default(0)
  totalAmount   Float
  paymentStatus PaymentStatus @default(PENDING)                   // ← second dimension
  addressId     String?
  checkoutReference String?    @unique
  idempotencyKey String?
  poolOrderId   String?
  couponId      String?
  deliveryRateId String?
  deliveryState String?
  deliveryLocalGovernment String?
  estimatedDeliveryStart DateTime?
  estimatedDeliveryEnd DateTime?
  deliveryRateSnapshot String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  buyer       User        @relation("BuyerOrders", fields: [buyerId], references: [id])
  store       Store       @relation("StoreOrders", fields: [storeId], references: [id])
  parentCheckout ParentCheckout? @relation(fields: [parentCheckoutId], references: [id], onDelete: Cascade)
  address     Address?    @relation(fields: [addressId], references: [id])
  items       OrderItem[]
  payment     Payment?
  escrow              Escrow?
  delivery            Delivery?
  commission          Commission?
  fulfillments       Fulfillment[]
  reviews            Review[]
  disputeStatus      DisputeStatus  @default(NONE)                // ← third dimension (disputes only)
  disputeReason      String?
  disputeEvidence    String?
  disputeResolvedAt  DateTime?
  disputeResolvedBy  String?
  disputeResolution  String?

  @@index([buyerId])
  @@index([storeId])
  @@index([parentCheckoutId])
  @@index([status])
  @@index([paymentStatus])
  @@index([idempotencyKey])
}
```

**Key observations on the Order model**

| Concern | Finding |
|---|---|
| Status dimensions | **3 fields**, not one: `status` (OrderStatus), `paymentStatus` (PaymentStatus), `disputeStatus` (DisputeStatus). No separate `escrowStatus` or `fulfillmentStatus` on the Order itself — those live on the related `Escrow`/`Fulfillment`/`Delivery` rows. |
| Money fields | `subtotal`, `shippingFee`, `discount`, `totalAmount` — all `Float` (no `Decimal`, no `Int`). No `tax`, `processingFee`, `grandTotal`, `platformFee`, `deliveryFee` (the model uses `shippingFee`, not `deliveryFee`). |
| Delivery method | **No `deliveryMethod` / `deliveryType` field.** Only `deliveryRateId`, `deliveryState`, `deliveryLocalGovernment`, `estimatedDeliveryStart`, `estimatedDeliveryEnd`, `deliveryRateSnapshot`. There is no pickup/delivery enum on Order. |
| Snapshots | **No product/vendor snapshots on Order or OrderItem.** `OrderItem` stores only `productId`/`variantId` FKs (see §2). `deliveryRateSnapshot` is a JSON string of the rate, not a product snapshot. |
| Timestamps | Only `createdAt`, `updatedAt` on Order. No `quotedAt`, `paidAt` (that's on `Payment.paidAt`), `deliveredAt` (on `Delivery`/`Fulfillment`), `completedAt`, `cancelledAt`. |
| Quote fields | **None.** No `quoteAmount`, `quoteStatus`, `quoteNegotiation`, `quoteId`, `quotedAt`. The quote concept does not exist in the schema. |
| Parent/child | **Yes** — `parentCheckoutId` + the `ParentCheckout` model (lines 1190–1213). One `ParentCheckout` row owns N `Order` rows (one per vendor store). |
| Relations | Order → User (buyer), Order → Store (vendor), Order → ParentCheckout, Order → Address, Order → OrderItem[], Order → Payment (1:1), Order → Escrow (1:1), Order → Delivery (1:1), Order → Commission (1:1), Order → Fulfillment[], Order → Review[]. **No Order → Quote relation (no Quote model exists).** |

### 1.2 All order-related enums

| Enum | Location (line) | Values |
|---|---|---|
| `OrderStatus` | schema.prisma:1094–1106 | `DRAFT`, `PENDING_PAYMENT`, `PENDING`, `PAID`, `CONFIRMED`, `PROCESSING`, `FULFILLED`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `REFUNDED` (11 values) |
| `PaymentStatus` | schema.prisma:1108–1114 | `PENDING`, `AUTHORIZED`, `PAID`, `FAILED`, `REFUNDED` (5 values) |
| `ParentCheckoutStatus` | schema.prisma:1116–1122 | `PENDING_PAYMENT`, `PAID`, `FAILED`, `CANCELLED`, `REFUNDED` (5 values) |
| `FulfillmentStatus` | schema.prisma:1124–1132 | `PENDING`, `PROCESSING`, `READY`, `FULFILLED`, `DELIVERED`, `FAILED`, `CANCELLED` (7 values) |
| `FulfillmentType` | schema.prisma:1134–1137 | `PHYSICAL_MANUAL`, `DIGITAL_ACCESS` |
| `PaymentGateway` | schema.prisma:1252–1257 | `PAYSTACK`, `FLUTTERWAVE`, `CASH_ON_DELIVERY`, `WALLET` |
| `PaymentType` | schema.prisma:1259–1264 | `CHECKOUT`, `ORDER`, `SUBSCRIPTION`, `CREDIT_PURCHASE` |
| `DeliveryStatus` | schema.prisma:1335–1349 | `PENDING`, `ASSIGNED`, `ACCEPTED`, `PREPARING`, `READY_FOR_PICKUP`, `PICKED_UP`, `IN_TRANSIT`, `ARRIVED`, `DELIVERED`, `COMPLETED`, `CANCELLED`, `RETURNED`, `FAILED` (13 values) |
| `DisputeStatus` | schema.prisma:1351–1356 | `NONE`, `OPENED`, `UNDER_REVIEW`, `RESOLVED` |
| `EscrowStatus` | schema.prisma:1415–1422 | `HELD`, `PENDING_RELEASE`, `RELEASED`, `REFUNDED`, `DISPUTED`, `PARTIAL` (6 values) |
| `WithdrawalStatus` | schema.prisma:1477–1481 | `PENDING`, `PROCESSED`, `FAILED` |

**Critical:** There is **no `QuoteStatus` enum and no Quote model**. The intended "vendor submits quote → buyer accepts/rejects" lifecycle has no schema backing.

### 1.3 Related models at a glance

- **`ParentCheckout`** (1190–1213): parent of multi-vendor split — has `buyerId`, `status`, `subtotal`, `shippingFee`, `discount`, `totalAmount`, `paymentStatus`, `checkoutReference`, `idempotencyKey`, `couponId`. 1 Payment per parent.
- **`OrderItem`** (1215–1248) — see §2 below.
- **`Payment`** (1266–1289): 1:1 with either `Order` OR `ParentCheckout` (both have `@unique` FKs). Holds `gateway`, `reference`, `authorizationUrl`, `paidAt`, `verifiedAt`.
- **`Escrow`** (1424–1441): 1:1 with Order. `vendorId`, `amount`, `status`, `releaseAt`, `releasedAt`, `disputeReason`. **No `heldAt` timestamp** (only `createdAt`/`releasedAt`).
- **`Wallet`** (1445–1456): per-vendor. `availableBalance`, `pendingBalance`, `totalEarned`, `totalWithdrawn` (all Float).
- **`Commission`** (1485–1500): per-Order. `saleAmount`, `platformFeePercent`, `platformFeeAmount`, `vendorEarnings`, `plan`, `settledAt`.
- **`Delivery`** (1358–1411): 1:1 with Order. Has `customerConfirmed` Boolean, `customerConfirmedAt`, `customerRejected`, `customerRejectReason`. This is the only customer-receipt surface.
- **`Fulfillment`** (1309–1331): per-Order, optionally per-OrderItem. `type` (PHYSICAL_MANUAL/DIGITAL_ACCESS), `status`, `trackingNumber`, `digitalAssetId`, `accessUrl`, `deliveredAt`.

---

## 2. OrderItem Schema — `apps/api/prisma/schema.prisma:1215-1248`

```prisma
model OrderItem {
  id          String   @id @default(cuid())
  orderId     String
  productId   String
  variantId   String?
  poolOfferId String?
  quantity    Int
  unitPrice   Float
  totalPrice  Float
  isPoolItem  Boolean  @default(false)
  productType ProductType   @default(PHYSICAL)
  productSource ProductSource @default(VENDOR_STOCK)
  sellerStoreId String?
  sourceStoreId String?
  sourceProductId String?
  sourceBasePrice Float?
  resellerMargin Float?
  platformFeeAmount Float?
  fulfillmentStatus FulfillmentStatus @default(PENDING)
  createdAt   DateTime @default(now())

  order   Order          @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product        @relation(fields: [productId], references: [id])
  variant ProductVariant? @relation(fields: [variantId], references: [id])
  poolOffer VendorPoolOffer? @relation(fields: [poolOfferId], references: [id], onDelete: SetNull)
  reservations InventoryReservation[]
  fulfillments Fulfillment[]
}
```

**Key findings:**
- **No product snapshot.** No `productName`, `productPrice`, `productImage`, `sku`, `vendorName` columns. The order item stores only `productId` (FK to live `Product`); if the product is later renamed, deleted, or its price changes, the historical order mutates with it. This is a data-integrity hazard.
- **No variant snapshot.** Only `variantId` FK.
- **Money fields:** `unitPrice`, `totalPrice`, `sourceBasePrice`, `resellerMargin`, `platformFeeAmount` — all `Float`.
- **Digital-product-specific field:** None directly. `productType` enum (`PHYSICAL`/`DIGITAL`) + the related `Fulfillment.type = DIGITAL_ACCESS` row is the only signal. The digital asset link lives on `Fulfillment.digitalAssetId`/`accessUrl`, not on OrderItem.
- **Pool-specific fields:** `isPoolItem`, `sellerStoreId`, `sourceStoreId`, `sourceProductId`, `sourceBasePrice`, `resellerMargin` — these only matter for the pool-resale feature.

---

## 3. Order Service + Controller

### 3.1 Endpoints exposed

There are **three** order-related controllers. The actual order *creation* does NOT happen here — it lives in `CommerceService.checkout` (see §4). The two controllers below only handle vendor-side status transitions.

#### A) `VendorOrdersController` — `apps/api/src/modules/orders/orders.controller.ts:51-237`
**Route prefix:** `vendor/orders` (all auth-guarded by `JwtAuthGuard`, no role guard — any authenticated user can call, but `findAndVerifyOrder` checks the user owns the store).

| Method | Path | Action | Allowed from | Goes to |
|---|---|---|---|---|
| GET | `/vendor/orders/:id` | Get order detail | any | — |
| PATCH | `/vendor/orders/:id/accept` | Accept order | `PENDING` or `PAID` | `CONFIRMED` |
| PATCH | `/vendor/orders/:id/reject` | Reject order (requires `reason`) | `PENDING` or `PAID` | `CANCELLED` |
| PATCH | `/vendor/orders/:id/prepare` | Start preparing | `CONFIRMED` | `PROCESSING` |
| PATCH | `/vendor/orders/:id/ready` | Mark ready for pickup | `PROCESSING` | `FULFILLED` (also creates a `Fulfillment` row with `status=READY`, `type=PHYSICAL_MANUAL`) |
| PATCH | `/vendor/orders/:id/cancel` | Cancel (requires `reason`) | `PENDING`, `CONFIRMED`, or `PROCESSING` | `CANCELLED` |

Source — the transition table (lines 33–47):
```ts
const VALID_TRANSITIONS: Record<string, OrderStatus> = {
  accept: 'CONFIRMED', reject: 'CANCELLED', prepare: 'PROCESSING',
  ready: 'FULFILLED', cancel: 'CANCELLED',
};
const REQUIRED_CURRENT_STATUS: Record<string, OrderStatus[]> = {
  accept: ['PENDING', 'PAID'], reject: ['PENDING', 'PAID'],
  prepare: ['CONFIRMED'], ready: ['PROCESSING'],
  cancel: ['PENDING', 'CONFIRMED', 'PROCESSING'],
};
```

#### B) `VendorOrderOperationsController` — `apps/api/src/modules/order-operations/order-operations.controller.ts:34-59`
**Route prefix:** `vendor/orders` (same prefix as A — splits routing by verb). Only one endpoint:

| Method | Path | Action |
|---|---|---|
| POST | `/vendor/orders/:id/note` | Add an internal note (audit-logged, no DB table) |

The corresponding service (`order-operations.service.ts:85-99`) duplicates the same `VALID_TRANSITIONS` / `REQUIRED_STATUS` maps as controller A — but **never exposes them via HTTP**. It's effectively dead transition code (only `addOrderNote` is called).

#### C) `OrdersController` (buyer-facing) — `apps/api/src/modules/commerce/commerce.controller.ts:191-205`
**Route prefix:** `orders` (JwtAuthGuard).

| Method | Path | Action |
|---|---|---|
| GET | `/orders` | List buyer's orders (commerce.service.ts:1018 `listOrders`) |
| GET | `/orders/:orderId` | Get a single buyer order (commerce.service.ts:1031 `getOrder`) |

Both include `items`, `payment`, `fulfillments` — but NOT `escrow`, `delivery`, `store`, or `address`.

### 3.2 The order creation flow — `CommerceService.checkout` (commerce.service.ts:580-870)

Step-by-step, when `POST /api/v1/checkout` is called:

1. **Resolve cart from DB** (lines 628-632): `tx.cart.findFirst({ where: { userId } | { id: dto.cartId, userId } })`. If `dto.storeSlug` is sent, the cart is scoped to that vendor (lines 634-647, `scopeCartToStore`). **If the cart is empty, throws `BadRequestException("Cart is empty")`**.
2. **Validate cart** (line 653, `buildCartValidation`): checks stock, variants, product availability. Throws on failure.
3. **Group items by store** (line 662, `groupCartItemsByStore`): one group per vendor → one `Order` per group. **Multi-vendor split is supported.**
4. **Delivery quote** (lines 669-676, `resolveDeliveryQuote`): for each group with physical items, looks up `StoreDeliveryZone`/`ProductDeliveryZone`/legacy `DeliveryRate` by `state` + `localGovernment` from the shipping address. Throws `DELIVERY_RATE_UNAVAILABLE` if no zone matches.
5. **Create Address** (lines 678-692): persists a new `Address` row of `type='SHIPPING'` linked to the buyer.
6. **Compute totals** (line 694, `withCartTotals`): `subtotal = Σ (price × qty)`, plus `shippingFee` (sum of per-group delivery fees), minus `discount` (from coupon if any). `totalAmount = max(0, subtotal + shippingFee - discount)`.
7. **Create ParentCheckout** (lines 707-720): `status=PENDING_PAYMENT`, `paymentStatus=PENDING`, `checkoutReference` freshly generated.
8. **Create one Order per vendor group** (lines 722-782):
   - `status = 'PENDING_PAYMENT'`, `paymentStatus = 'PENDING'`.
   - `checkoutReference = ${parentRef}-${index+1}`.
   - `idempotencyKey = ${dto.idempotencyKey}:${storeId}` (if provided).
   - Items created inline with `unitPrice = cartItem.price`, `totalPrice = price × qty`, `productType` / `productSource` / `sellerStoreId` / `sourceStoreId` / `sourceBasePrice` / `resellerMargin` / `platformFeeAmount=0` / `fulfillmentStatus=PENDING`.
9. **Reserve inventory** (line 777, `reserveInventoryForOrderItem` — see lines 2627-2677): for each OrderItem, finds an `InventoryItem` with `available >= quantity`, decrements `available`, increments `reserved`, and creates an `InventoryReservation` row with `status=ACTIVE`, `expiresAt = now + RESERVATION_MINUTES` (defined elsewhere). **Inventory is reserved (not deducted) at order creation.**
10. **Pool settlement** (line 778, `createPoolSettlementForOrderItem`): no-op for non-pool items.
11. **Create Payment** (lines 784-794): single `Payment` row linked to `parentCheckoutId`, `entityType=CHECKOUT`, `gateway=PAYSTACK`, `status=PENDING`.
12. **Delete cart items** (lines 796-800): the bought items are removed from the DB cart.
13. **Audit log** (lines 801-816).
14. **Initialize Paystack transaction** (lines 831-855): calls `paystack.initializeTransaction` with `amount = parentCheckout.totalAmount`, `reference`, `callbackUrl = /checkout/verify?reference=...`. Stores `authorizationUrl` on the Payment.
15. **Return** `{ parentCheckout, orders, order: orders[0], payment, authorizationUrl, reference, requiresShipping }`.

**Critical findings on creation flow:**

| Question | Answer |
|---|---|
| Is inventory reserved/deducted at creation? | **Reserved** (not deducted) at creation via `InventoryReservation{status=ACTIVE}`. Reservation is *committed* (decrement `reserved`) only on payment success (line 2774, `commitReservations`). Reservation is *released* (restore `available`, decrement `reserved`) on payment failure (line 2962, `releaseReservations`) or expiry. |
| Is a quote created? | **NO.** No Quote model exists. The vendor is never asked to quote. The delivery fee is computed **at checkout time** from `StoreDeliveryZone` / `ProductDeliveryZone` — not from a vendor quote. |
| Is payment required at creation? | **YES — immediately.** The checkout endpoint creates the ParentCheckout + Orders + Payment, then synchronously calls Paystack `initializeTransaction` and returns `authorizationUrl`. There is no "wait for vendor quote → then pay" step. |
| Is escrow created at creation? | **NO.** No `Escrow` row is created at checkout or on payment success. See §Critical Breaks #1. |
| Is the vendor wallet credited at creation? | **NO.** The wallet is never touched at creation or at payment. See §Critical Breaks #1. |
| Initial statuses? | Order: `PENDING_PAYMENT` + Payment: `PENDING`. ParentCheckout: `PENDING_PAYMENT`. On Paystack success (webhook or verify), all three flip to `PAID`. |
| Is the vendor required to do something at order CREATION that should be automatic? | **NO** — the vendor's first touchpoint is the `accept` action, which they may do after the buyer has already paid. |

### 3.3 The quote flow

**There is no quote flow.** No `POST /orders/:id/quote` endpoint exists on the backend (verified by `Grep` — zero matches for `quote` in any controller or service). The frontend hook `useQuoteOrder()` in `apps/marketplace/src/lib/order-api.ts:235-261` POSTs to `orders/${orderId}/quote` but **the route does not exist** — the call will 404.

### 3.4 The payment flow

- **Trigger:** `POST /api/v1/checkout` (commerce.controller.ts:148) creates the Payment row AND initializes Paystack in one shot. Alternatively `POST /api/v1/payments/intents` (line 163) or `POST /api/v1/payments/initialize` (line 169) creates an intent for an existing single order (not a ParentCheckout).
- **Verification:** `GET /api/v1/checkout/payments/:reference` (line 153) or `GET /api/v1/payments/verify/:reference` (line 175) → `commerce.verifyPayment` (commerce.service.ts:929-975). If the payment is still `PENDING`, it calls `paystack.verifyTransaction(reference)` and dispatches to `processSuccessfulPayment` or `failPaymentReference`.
- **Webhook:** `POST /api/v1/payments/webhooks/paystack` (line 185) → `commerce.handlePaystackWebhook` (lines 977-1016). Verifies HMAC signature, deduplicates by idempotency key, dispatches to `processSuccessfulPayment`.
- **On success** (`processSuccessfulPayment`, lines 2706-2833): flips Payment → `PAID`, ParentCheckout → `PAID`, all child Orders → `PAID` + `paymentStatus=PAID`, calls `commitReservations` (decrement `reserved` on inventory, mark reservation `COMMITTED`), calls `createFulfillmentsForPaidOrder` (one `Fulfillment` row per OrderItem: `DIGITAL_ACCESS` for digital items, `PHYSICAL_MANUAL` with `status=PENDING` for physical items). **Does NOT create an Escrow row. Does NOT call `EscrowService.holdPayment`. Does NOT touch the vendor Wallet.**

### 3.5 The delivery / fulfillment flow

- **Fulfillment row** is created automatically on payment success (`createFulfillmentsForPaidOrder`, commerce.service.ts:3036-3083) with `status=PENDING` for physical, `status=READY` (with `digitalAssetId`/`accessUrl`) for digital.
- **Vendor delivery endpoints** (delivery.controllers.ts:23-79):
  - `POST /vendor/deliveries/:id/preparing` (ACCEPTED → PREPARING)
  - `POST /vendor/deliveries/:id/ready` (PREPARING → READY_FOR_PICKUP)
  - `POST /vendor/deliveries/:id/pickup-confirm` (READY_FOR_PICKUP → PICKED_UP)
- **Delivery record creation:** `POST /admin/deliveries/:orderId/assign` (line 118) — admin-only, creates the Delivery row by hand. **Not automatic.** If admin never assigns a rider, no Delivery row exists, no `customerConfirmed` can ever be set, no escrow can ever release.
- **Customer confirmation endpoint:** **DOES NOT EXIST.** The `Delivery.customerConfirmed` Boolean (schema:1391) is read by `EscrowService.processEscrowAutoRelease` (escrow.service.ts:718) but **no controller endpoint ever sets it**. The frontend mock store (`order-workflow-store.ts:863 confirmReceipt`) only updates local Zustand state.

### 3.6 The confirmation flow (receipt)

**Backend:** none. No `POST /orders/:id/confirm` or `POST /deliveries/:id/confirm` endpoint exists. The buyer has no API to confirm receipt.

**Frontend:** `useOrderWorkflowStore.confirmReceipt(orderId)` (order-workflow-store.ts:863-886) — purely local state mutation. Calls `releaseToVendor` from `lib/escrow.ts` (an in-memory Map update) and sets status to `RECEIVED`. Does NOT call any backend endpoint.

### 3.7 The cancellation flow

**Vendor cancel** (orders.controller.ts:225-236, action `cancel`): allowed from `PENDING`, `CONFIRMED`, `PROCESSING`. Just flips `status=CANCELLED`. **Does NOT release inventory reservations, does NOT refund the Payment, does NOT touch escrow.** No side effects.

**Admin manual-status** (commerce.controller.ts:382, `updateManualDelivery` → commerce.service.ts:2511): admin can set any `OrderStatus` on any order + optional tracking code. Pure status update, no side effects.

**Payment failure path** (`failPaymentReference`, commerce.service.ts:2926-2997): on Paystack failure, releases reservations, marks Payment `FAILED`, ParentCheckout `FAILED`, all child Orders `CANCELLED` + `paymentStatus=FAILED`. This is the only path that actually undoes inventory.

### 3.8 Timeline / history endpoint

**No dedicated timeline endpoint.** `OrderTimelineEvent` exists only as a frontend type (types/order-workflow.ts:109). The backend stores change history via `AuditLog` rows written by `AuditService.log()` (e.g. order-operations.service.ts:145, commerce.service.ts:801), but there is no public endpoint to read them per-order.

---

## 4. Cart / Checkout — `apps/api/src/modules/commerce/`

### 4.1 Cart model — `apps/api/prisma/schema.prisma:1053-1090`

```prisma
model Cart {
  id          String     @id @default(cuid())
  userId      String?
  sessionId   String?
  expiresAt   DateTime?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  user  User?      @relation(fields: [userId], references: [id], onDelete: Cascade)
  items CartItem[]
  @@index([userId])
  @@index([sessionId])
}

model CartItem {
  id          String   @id @default(cuid())
  cartId      String
  productId   String
  variantId   String?
  poolOfferId String?
  quantity    Int
  price       Float
  productType ProductType   @default(PHYSICAL)
  productSource ProductSource @default(VENDOR_STOCK)
  requiresShipping Boolean  @default(true)
  ...
}
```

**Cart is DB-backed** (Cart + CartItem tables). It supports anonymous (`sessionId`) and authenticated (`userId`) carts.

### 4.2 Cart endpoints — `apps/api/src/modules/commerce/commerce.controller.ts:74-131`

| Method | Path | Action |
|---|---|---|
| GET | `/cart` | Get current user's cart |
| GET | `/cart/validate` | Validate cart (stock, etc.) |
| POST | `/cart/coupon` | Validate a coupon code against the cart |
| POST | `/cart/items` | Add an item (`AddCartItemDto`: productId, variantId?, poolOfferId?, quantity) |
| POST | `/cart/pool-offers/:poolOfferId` | Add a pool offer |
| PATCH | `/cart/items/:itemId` | Update quantity |
| DELETE | `/cart/items/:itemId` | Remove an item |
| DELETE | `/cart/vendors/:vendorSlug` | Clear items for one vendor |
| DELETE | `/cart` | Clear entire cart |

### 4.3 The checkout endpoint — `commerce.controller.ts:148-151`

```ts
@Controller('checkout')
@UseGuards(JwtAuthGuard)
export class CheckoutController {
  @Post()
  checkout(@CurrentUser() user: any, @Body() dto: CheckoutDto) {
    return this.commerce.checkout(user, dto);
  }
}
```

**`CheckoutDto`** (commerce.dto.ts:94-115):
```ts
export class CheckoutDto {
  @IsOptional() @IsString() cartId?: string;
  @IsOptional() @IsString() storeSlug?: string;
  @IsOptional() @ValidateNested() @Type(() => ShippingAddressDto) shippingAddress?: ShippingAddressDto;
  @IsOptional() @IsString() couponCode?: string;
  @IsOptional() @IsString() idempotencyKey?: string;
}
```

### 4.4 Critical checkout facts

| Question | Answer |
|---|---|
| Does checkout support multi-vendor? | **YES.** `groupCartItemsByStore` (commerce.service.ts:3680) splits the cart by `storeId`, and one `Order` is created per store, all linked to a single `ParentCheckout`. |
| Does it split into sub-orders? | **YES** — each vendor gets its own `Order` row with its own subtotal/shippingFee/totalAmount, all under one `ParentCheckout` and one `Payment`. |
| What does checkout require? | A non-empty DB cart (looked up by `userId` or `cartId`), a `shippingAddress` (required only if any item `requiresShipping`), and optionally `couponCode`/`idempotencyKey`/`storeSlug`. **Does NOT require `paymentMethod` or `deliveryType`** — those fields are not in the DTO. |
| Does it charge a delivery fee? | **YES.** `shippingFee` is computed from `StoreDeliveryZone` / `ProductDeliveryZone` / legacy `DeliveryRate` based on the shipping address's state + LGA (commerce.service.ts:3085 `resolveDeliveryQuote`). The fee is **NOT** from a vendor quote — it's a static zone rate looked up at checkout. |
| Where does the fee come from? | The vendor's `StoreDeliveryZone` table (or `ProductDeliveryZone` if the product overrides), falling back to a global `DeliveryRate` table. **Hardcoded by the vendor's zone config — no per-order negotiation.** |
| Is there a processing/platform fee? | **NO platform fee is charged at checkout.** `platformFeeAmount` on OrderItem is hardcoded to `0` (line 767). The `Commission` row created by `EscrowService.holdPayment` (escrow.service.ts:62-78) uses `DEFAULT_COMMISSION_RATE = 0.05` (5%) — but since `holdPayment` is never called, no commission is ever recorded either. |
| Does checkout validate prices server-side? | **PARTIAL.** The server reads `unitPrice` from the `CartItem.price` column (which was set when the item was added to the cart via `addCartItem`). The cart item's price was NOT validated against the live `Product.price` at add time — see `addCartItem` (commerce.service.ts:333). The `buildCartValidation` (line 3507) checks stock and product availability, but does NOT re-check prices. **A stale cart item price (after a product price change) will be used as-is.** The `assertGatewayAmountMatchesOrder` (commerce.service.ts:2898) only checks the Paystack amount matches `Payment.amount` — not that prices match the live catalog. |

---

## 5. Marketplace Frontend Checkout

### 5.1 The checkout page — `apps/marketplace/src/app/checkout/page.tsx` (999 lines)

**Cart source:** `useCartStore` (Zustand + localStorage, `apps/marketplace/src/stores/cart-store.ts`). **The marketplace NEVER calls `/api/v1/cart` endpoints.** The DB cart and the localStorage cart are completely separate.

**What the UI shows:**

1. **Hero header** (lines 403-447) with a 5-step strip: "1. Place order → 2. Vendor quotes → 3. Pay (escrow) → 4. Delivery → 5. Confirm". Copy says *"No payment now — the vendor will send a quotation with the delivery fee and ETA. Your funds stay protected by KwisCrow escrow until you confirm receipt."*
2. **Delivery address form, permanent on page** (lines 454-529): fullName, phone, addressLine, city, state (select from 16 Nigerian states), landmark. No modal.
3. **Delivery options** (lines 532-…, `DELIVERY_OPTIONS` array at lines 52-88): three cards — STANDARD (₦1,500 Lagos / ₦2,000 other), EXPRESS (₦3,500 Lagos / ₦4,500 other), PICKUP (Free). Prices are **hardcoded on the frontend** by `deliveryFeeByStateAndType` (lines 95-107).
4. **Payment method selection UI** (PAYSTACK / FLUTTERWAVE / WALLET) — `PAYMENT_PROVIDERS` from constants/order-workflow.ts:403-420. Selected via `useState<PaymentProviderKey>` (line 154).
5. **Coupon input** (lines 176-233) — calls `POST /api/v1/cart/coupon` (one of the only real backend calls from the checkout page).
6. **Order summary** with `subtotal`, `couponDiscount`, `estimatedProcessingFee = Math.round(subtotal * 0.015)` (1.5% platform fee — frontend-only), `effectiveDeliveryFee`, `totalDueNow = max(0, subtotal - couponDiscount + estimatedProcessingFee + effectiveDeliveryFee)`.

**Multiple delivery options beyond pickup + standard?** YES — three options (STANDARD, EXPRESS, PICKUP). But the selection is **never sent to the backend** (the `CheckoutDto` does not accept `deliveryType`).

**Delivery price before vendor quote?** **YES.** The frontend shows a hardcoded price (₦1,500–₦4,500 by state + type) BEFORE any vendor quote. But since no vendor quote step exists in the backend, this is also the *only* delivery price ever shown.

**Payment-method selection UI shown prematurely?** **YES.** The UI shows Paystack/Flutterwave/Wallet radio buttons at checkout time even though the page header says "No payment now — the vendor will send a quotation." The backend immediately initializes Paystack on `POST /checkout` regardless of the user's selection (`paymentProvider` from the frontend is mapped to `PAYMENT_PROVIDERS[paymentProvider]?.id ?? "CARD"` at line 327 — but `PAYMENT_PROVIDERS` entries have no `id` field, so this is always `"CARD"`, and the backend ignores it anyway since `paymentMethod` is not in the DTO).

### 5.2 API calls from checkout

```ts
// apps/marketplace/src/app/checkout/page.tsx:313-330
const result = await checkout.mutateAsync({
  items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
  shippingAddress: { fullName, phone, addressLine1, addressLine, city, state, country: "Nigeria" },
  paymentMethod: PAYMENT_PROVIDERS[paymentProvider]?.id ?? "CARD",
  deliveryType,                                  // "STANDARD" | "EXPRESS" | "PICKUP"
  couponCode: appliedCoupon?.code,
});
```

The `useCheckout` hook (`apps/marketplace/src/lib/order-api.ts:222-233`):
```ts
export function useCheckout() {
  return useMutation({
    mutationFn: async (payload: CheckoutPayload) => {
      const res = await api.post<CheckoutResult>("checkout", payload);
      return res.data;
    },
  });
}
```

**Mismatch with backend:** The frontend sends `{ items, shippingAddress, paymentMethod, deliveryType, couponCode }`. The backend `CheckoutDto` only accepts `{ cartId?, storeSlug?, shippingAddress?, couponCode?, idempotencyKey? }`. The `items`, `paymentMethod`, and `deliveryType` fields are silently dropped by class-validator. The backend then queries the DB cart by `userId` — **which is empty** because the marketplace never POSTs to `/cart/items`. **Result:** `POST /checkout` from the marketplace will always throw `BadRequestException("Cart is empty")` against the real backend. (See §Critical Breaks #5.)

### 5.3 Frontend order total computation

`apps/marketplace/src/app/checkout/page.tsx:254-282`:
```ts
const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items]);
const estimatedProcessingFee = Math.round(subtotal * 0.015);                  // 1.5% platform fee
const couponDiscount = /* PERCENT | AMOUNT | FREE_DELIVERY logic */;
const deliveryFee = useMemo(() => deliveryFeeByStateAndType(address.state, deliveryType), ...);
const effectiveDeliveryFee = appliedCoupon?.discountType === "FREE_DELIVERY" ? 0 : deliveryFee;
const totalDueNow = Math.max(0, subtotal - couponDiscount + estimatedProcessingFee + effectiveDeliveryFee);
```

**The frontend total (`subtotal - discount + 1.5% + deliveryFee`) is never sent to the backend** (the backend recomputes everything from the DB cart + zone rates). The 1.5% processing fee exists only in the frontend.

### 5.4 The order detail page — `apps/marketplace/src/app/orders/[id]/page.tsx`

Renders one of three views depending on what it can find:
1. `MockOrderWorkflow` (line 182) — if the order ID matches a mock order in `useOrderWorkflowStore`. Uses the full intended workflow UI: timeline, quotation card, escrow badge, dispute timer, action buttons (Pay, Cancel, Confirm Receipt, Request Return, Report Issue).
2. `LiveOrderDetail` (line 525) — for orders fetched from `ordersApi.get(orderId)` (buyer's live order). Plain display: payment status, delivery status, vendor, items, address. No workflow UI.
3. `ApiOrderDetail` (line 648) — for orders fetched from `useOrder(id)` (the `ApiOrder` type from `order-api.ts`). Shows a "Vendor Quotation" card with subtotal/deliveryFee/discount/platformFee/total — but this data shape does not match the backend `Order` (the backend has no `platformFee`, no `deliveryFee` field — it's `shippingFee`).

The page polls every 4 seconds while the order is in `PENDING` status (line 138: `refetchInterval: 4000 if status === "PENDING"`), expecting the vendor to flip it via a quote endpoint that does not exist.

---

## 6. Order Status Lifecycle (as actually Implemented)

### 6.1 All possible `Order.status` values (backend Prisma enum)

```
DRAFT, PENDING_PAYMENT, PENDING, PAID, CONFIRMED, PROCESSING, FULFILLED, SHIPPED, DELIVERED, CANCELLED, REFUNDED
```

### 6.2 Transitions actually wired in code

| Trigger | From | To | Where |
|---|---|---|---|
| `POST /checkout` (creates order) | (none) | `PENDING_PAYMENT` | commerce.service.ts:745 |
| Paystack success (webhook or verify) | `PENDING_PAYMENT` | `PAID` | commerce.service.ts:2772, 2807 |
| Paystack failure | `PENDING_PAYMENT` | `CANCELLED` (+ `paymentStatus=FAILED`) | commerce.service.ts:2979, 2985 |
| `PATCH /vendor/orders/:id/accept` | `PENDING` or `PAID` | `CONFIRMED` | orders.controller.ts:184 |
| `PATCH /vendor/orders/:id/reject` | `PENDING` or `PAID` | `CANCELLED` | orders.controller.ts:194 |
| `PATCH /vendor/orders/:id/prepare` | `CONFIRMED` | `PROCESSING` | orders.controller.ts:207 |
| `PATCH /vendor/orders/:id/ready` | `PROCESSING` | `FULFILLED` (+ creates Fulfillment{status=READY}) | orders.controller.ts:216 |
| `PATCH /vendor/orders/:id/cancel` | `PENDING` / `CONFIRMED` / `PROCESSING` | `CANCELLED` | orders.controller.ts:225 |
| `PATCH /vendor/orders/:orderId/status` (vendor via commerce) | any | any of `ORDER_STATUSES` DTO list | commerce.controller.ts:288, commerce.service.ts:1882 `updateVendorOrderStatus` |
| `PATCH /admin/orders/manual-status` | any | any of `ORDER_STATUSES` DTO list + optional trackingCode | commerce.controller.ts:382, commerce.service.ts:2511 |
| `EscrowService.refundToCustomer` | (any) | `REFUNDED` + `paymentStatus=REFUNDED` | escrow.service.ts:489, 516 |
| `EscrowService.resolveDispute` (refund branch) | (disputed) | `REFUNDED` + `paymentStatus=REFUNDED` | escrow.service.ts:382 |

**Note:** `DRAFT`, `SHIPPED`, and `DELIVERED` are valid enum values but **no code path ever sets them on `Order.status`**. `SHIPPED` and `DELIVERED` appear only on the `Delivery.status` and `Fulfillment.status` enums. `DRAFT` is never used.

The `ORDER_STATUSES` constant in commerce.dto.ts:19-29 is **missing `PENDING` and `CONFIRMED`** — it only allows `DRAFT, PENDING_PAYMENT, PAID, PROCESSING, SHIPPED, FULFILLED, DELIVERED, CANCELLED, REFUNDED`. So a vendor calling `PATCH /vendor/orders/:orderId/status` with `status: "CONFIRMED"` will be rejected by class-validator, even though `CONFIRMED` is a valid Prisma enum value. (The dedicated `/accept` endpoint is the only way to reach `CONFIRMED`.)

### 6.3 State machine vs ad-hoc

There is **no formal state machine**. Two parallel transition maps exist:
- `VALID_TRANSITIONS` / `REQUIRED_CURRENT_STATUS` in `orders.controller.ts:33-47` (used by `/vendor/orders/:id/{accept,reject,prepare,ready,cancel}`).
- The same maps duplicated in `order-operations.service.ts:85-99` (used by no HTTP route — dead code).
- The vendor `/vendor/orders/:orderId/status` endpoint (commerce.service.ts:1882) and admin `/admin/orders/manual-status` (commerce.service.ts:2511) **bypass the state machine entirely** — they accept any status from `ORDER_STATUSES` and apply it with no transition validation. This means an admin could flip a `CANCELLED` order directly to `DELIVERED`, etc.

### 6.4 Actual state diagram (as implemented)

```
                        ┌─────────────────────────────────────────────────────────────┐
                        │                                                             │
                        ▼                                                             │
                  ┌──────────────────┐                                                │
                  │ PENDING_PAYMENT  │  ← created by POST /checkout                   │
                  └──────────────────┘                                                │
                     │           │                                                    │
        Paystack     │           │  Paystack                                          │
        success      │           │  failure                                           │
                     ▼           ▼                                                     │
                  ┌──────┐  ┌───────────┐                                             │
                  │ PAID │  │ CANCELLED │  (+ paymentStatus=FAILED,                  │
                  └──────┘  └───────────┘   reservations released)                   │
                     │                                                           │     │
        vendor       │                                                           │     │
        accept       ▼                                                           │     │
                  ┌───────────┐                                                  │     │
                  │ CONFIRMED │                                                  │     │
                  └───────────┘                                                  │     │
                     │                                                           │     │
        vendor       │                                                           │     │
        prepare      ▼                                                           │     │
                  ┌────────────┐                                                 │     │
                  │ PROCESSING │                                                 │     │
                  └────────────┘                                                 │     │
                     │                                                           │     │
        vendor       │  (creates Fulfillment{status=READY})                      │     │
        ready        ▼                                                           │     │
                  ┌───────────┐                                                  │     │
                  │ FULFILLED │  ← terminal in vendor flow                        │     │
                  └───────────┘                                                  │     │
                                                                                   │     │
        Admin /vendor/orders/:id/status OR /admin/orders/manual-status ───────────┘     │
        can force-jump to ANY of: DRAFT, PENDING_PAYMENT, PAID, PROCESSING,              │
        SHIPPED, FULFILLED, DELIVERED, CANCELLED, REFUNDED                               │
        (NOT PENDING, NOT CONFIRMED — those are blocked by ORDER_STATUSES DTO)            │
                                                                                         │
        EscrowService.refundToCustomer / resolveDispute(refund) ─────────────────────────┘
        can flip any order to REFUNDED + paymentStatus=REFUNDED
        (but only if an Escrow row exists — and none is ever auto-created)

   UNUSED enum values: DRAFT, SHIPPED, DELIVERED  (never written to Order.status by any code path)
```

**Note:** `DELIVERED` IS a valid `Order.status` enum value, but the only place it's set is via the admin manual-status endpoint or the unrestricted `/vendor/orders/:orderId/status` endpoint. The vendor delivery flow (`/vendor/deliveries/:id/...`) updates `Delivery.status`, not `Order.status` — so the order itself never becomes `DELIVERED` automatically when the delivery is completed.

---

## 7. Multi-Vendor Support

### 7.1 Backend — fully supported

- `Cart` can hold items from any number of stores. The `CartItem` model has no `storeId` column (it's resolved through `product.storeId`).
- `groupCartItemsByStore` (commerce.service.ts:3680) buckets cart items by `storeId`.
- `checkout` (commerce.service.ts:722-782) creates **one Order per store group**, all linked to one `ParentCheckout`.
- One `Payment` is created per `ParentCheckout` (i.e. one Paystack transaction for the entire multi-vendor cart).
- The buyer's `/orders` endpoint returns a flat list of Orders (no ParentCheckout grouping in the response).

### 7.2 Frontend cart — multi-vendor in localStorage only

- `useCartStore` (cart-store.ts) allows items from any store. Items carry `storeSlug`/`storeId`/`storeName`.
- `clearStoreCart(storeSlug)` and `getItemsByStore(storeSlug)` exist.
- The checkout page groups items by `storeSlug` for display (line 236) and calls `placeOrder` once per group on the **mock** workflow store (line 336).
- For the real backend call (line 313), it sends a flat `items` array — but the backend ignores it.

### 7.3 Net effect

The marketplace cart CAN hold multi-vendor items, but the only way to actually checkout against the backend is to first POST each item to `/api/v1/cart/items` (which the marketplace never does). So in practice, multi-vendor checkout is **not functional** end-to-end.

---

## 8. Gaps & Observations — "Intended vs Actual"

### 8.1 Intended vs Actual gap table

| # | Intended step (per task description) | Actual implementation | Gap |
|---|---|---|---|
| 1 | **Place Order** (no payment, vendor receives order in `PENDING_QUOTE`) | `POST /checkout` creates Order in `PENDING_PAYMENT` AND immediately initializes Paystack. Buyer is sent to Paystack before the vendor ever sees the order. | No "pending quote" state. Payment is demanded at creation. |
| 2 | **Vendor Quote** (vendor submits deliveryFee + ETA + optional discount) | **No endpoint exists.** No `Quote` model, no `quoteAmount` field, no `/orders/:id/quote` route. The delivery fee is computed from `StoreDeliveryZone` at checkout. | Quote flow is entirely missing on the backend. Frontend `useQuoteOrder()` hook 404s. |
| 3 | **Quote Agreement** (buyer accepts/rejects/requests reduction) | No endpoint. No `QuoteStatus` enum. | Missing entirely. |
| 4 | **Payment** (triggered after quote agreement) | Triggered at checkout creation, before any quote. Paystack-only (Flutterwave/Wallet/COD declared in `PaymentGateway` enum but never selected by code — `gateway: 'PAYSTACK'` is hardcoded at commerce.service.ts:790). | Payment happens at the wrong stage and only one gateway is wired. |
| 5 | **KwisCrow (escrow held)** | `EscrowService.holdPayment(orderId)` exists (escrow.service.ts:32) but is **NEVER CALLED**. The `processSuccessfulPayment` flow (commerce.service.ts:2706) does not invoke it. `PaymentsModule.exports: [EscrowService]` (payments.module.ts:11) has a comment "Exported so CommerceModule can call holdPayment on checkout" — but `CommerceModule` does not import `PaymentsModule` and `CommerceService` does not inject `EscrowService`. | **Escrow is never created automatically.** The `Escrow` table is always empty unless an admin manually calls the (non-existent) holdPayment endpoint. |
| 6 | **Fulfillment** (vendor prepares + ships + delivers) | Vendor endpoints exist for `preparing`, `ready`, `pickup-confirm` on the `Delivery` record. No "ship" or "deliver" endpoint exposed to vendors — only admin can assign a rider. The `Order.status` never auto-advances to `SHIPPED` or `DELIVERED` from delivery events. | Partial. Delivery-side lifecycle is wired but disconnected from Order.status. |
| 7 | **Confirmation** (buyer confirms receipt) | **No backend endpoint.** `Delivery.customerConfirmed` Boolean is read by `EscrowService.processEscrowAutoRelease` (escrow.service.ts:718) but nothing writes it. The marketplace's `confirmReceipt` action is local-only. | Buyer cannot confirm receipt via API. |
| 8 | **Release** (escrow released to vendor) | `EscrowService.releaseFunds` (escrow.service.ts:133) exists, called only by: (a) admin `POST /admin/escrow/:deliveryId/release`, (b) the cron `EscrowSchedulerService.processEscrowAutoRelease`. **The scheduler is never registered** — `EscrowSchedulerService` is not in any module's `providers` array, and `ScheduleModule.forRoot()` is not imported in `app.module.ts`. So the cron never fires. | Release path exists but is unreachable from the normal flow. |
| 9 | **Vendor Wallet credited** | `WalletService.creditWallet` (wallet.service.ts:238) exists. Called only by `EscrowService.releaseFunds` (escrow.service.ts:179-198) and `resolveDispute`. Since releaseFunds is never reached (see #5, #7, #8), the wallet is **never credited** from the order flow. | Vendor is never paid. The only way money reaches a vendor wallet is via admin manually POSTing to `/admin/escrow/:deliveryId/release` AND a Delivery row existing AND an Escrow row existing — none of which happen automatically. |

### 8.2 Specific critical breaks

#### Critical Break #1 — Escrow system is dead code
- `EscrowService.holdPayment` (escrow.service.ts:32-94) is **never called** from anywhere in the codebase (verified via `Grep` for `holdPayment` — only the definition appears, no callers).
- `CommerceModule` (commerce.module.ts) does not import `PaymentsModule`. `CommerceService` does not inject `EscrowService`. The export comment in `payments.module.ts:11` ("Exported so CommerceModule can call holdPayment on checkout") is aspirational — the wiring was never done.
- `processSuccessfulPayment` (commerce.service.ts:2706-2833) updates `Order.status=PAID`, commits reservations, creates Fulfillments — but creates no Escrow row and calls no EscrowService method.
- **Consequence:** The `Escrow` table is permanently empty. `Wallet.availableBalance` is permanently 0 for all vendors (unless an admin manually triggers release via `/admin/escrow/:deliveryId/release`, which itself requires an Escrow row to exist).

#### Critical Break #2 — EscrowSchedulerService is never registered
- `apps/api/src/payments/escrow-scheduler.service.ts` declares `@Cron(CronExpression.EVERY_HOUR) processAutoRelease()`.
- But the class is **not in any module's `providers` array** (verified — only `EscrowService` and `WalletService` are in `PaymentsModule.providers`, payments.module.ts:10).
- `ScheduleModule.forRoot()` from `@nestjs/schedule` is **not imported** in `app.module.ts` (verified — no `ScheduleModule` reference anywhere in src).
- **Consequence:** Even if escrows existed, the auto-release cron would never fire.

#### Critical Break #3 — Customer receipt confirmation has no API
- `Delivery.customerConfirmed` Boolean exists in the schema (schema.prisma:1391).
- It is read by `EscrowService.processEscrowAutoRelease` (escrow.service.ts:718: `if (!delivery || !delivery.customerConfirmed) continue;`).
- But **no controller endpoint writes it**. The only writes to `Delivery` are: `assignRider`, `markPreparing`, `markReady`, `confirmPickup`, `reassignRider` (delivery.service.ts). None of these set `customerConfirmed = true`.
- The marketplace's `confirmReceipt` (order-workflow-store.ts:863) updates only the local Zustand store — no API call.
- **Consequence:** Even if escrow + delivery rows existed, the auto-release cron (which checks `customerConfirmed`) would skip them.

#### Critical Break #4 — Three competing OrderStatus vocabularies
1. **Prisma backend enum** (schema.prisma:1094): `DRAFT, PENDING_PAYMENT, PENDING, PAID, CONFIRMED, PROCESSING, FULFILLED, SHIPPED, DELIVERED, CANCELLED, REFUNDED` (11 values).
2. **Frontend `order-api.ts` OrderStatus** (line 38): `PENDING, CONFIRMED, PROCESSING, READY, SHIPPED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED, REJECTED` (9 values — note `READY` and `REJECTED` don't exist in Prisma, and `PAID` is missing here).
3. **Frontend `constants/order-workflow.ts` OrderStatus** (line 26): `PENDING_QUOTE, QUOTED, TO_PAY, PAID, PROCESSING, SHIPPED, OUT_FOR_DELIVERY, DELIVERED, RECEIVED, COMPLETED, DISPUTED, CANCELLED, RETURNED` (13 values — only `PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED` overlap with the backend).

The three layers cannot agree on what an "order status" is. The marketplace renders whichever value it last received, frequently producing badges like `"PENDING_PAYMENT"` (from the live API) that don't match the constants dictionary and fall through to default styling.

#### Critical Break #5 — Marketplace cart and backend cart are disconnected
- Marketplace uses `useCartStore` (Zustand + localStorage) — see `apps/marketplace/src/stores/cart-store.ts`.
- The backend has full `/api/v1/cart` CRUD endpoints (commerce.controller.ts:74-131) backed by `Cart` + `CartItem` tables.
- The marketplace **never calls** any `/cart` endpoint (verified via Grep for `api.post("cart` and `api.get("cart` — zero matches in marketplace source). The only cart-related API call from the marketplace is `POST /cart/coupon` (checkout/page.tsx:203).
- The checkout page sends `{items: [...]}` to `POST /checkout`, but the backend `CheckoutDto` (commerce.dto.ts:94) has no `items` field — class-validator silently drops it.
- The backend then queries `tx.cart.findFirst({ where: { userId } })` (commerce.service.ts:628-632) and finds nothing (the DB cart was never populated).
- **Consequence:** `POST /checkout` from the marketplace always throws `BadRequestException("Cart is empty")`. Checkout against the live backend is non-functional. The marketplace can only complete a checkout via the mock workflow store (which is what the page does on success — it mirrors into the local store and redirects to `/orders/[id]`, which then renders the `MockOrderWorkflow` view).

#### Critical Break #6 — Delivery fee charged before vendor quote (and there is no vendor quote)
- The checkout page shows a hardcoded delivery fee (₦1,500–₦4,500 by state + type) and computes `totalDueNow` including this fee.
- The backend computes `shippingFee` from `StoreDeliveryZone` at checkout time.
- **Neither matches a vendor quote** because the vendor quote concept does not exist.
- The page header literally says "No payment now — the vendor will send a quotation with the delivery fee and ETA" (checkout/page.tsx:417-421), but the page then immediately demands payment via Paystack with a pre-computed fee. The copy and the behavior directly contradict each other.

#### Critical Break #7 — Payment-method UI shown prematurely
- The checkout page renders radio buttons for Paystack / Flutterwave / Wallet (checkout/page.tsx, payment-provider section, lines ~549+).
- The selection is sent to the backend as `paymentMethod` (line 327), but the field is not in `CheckoutDto` and is silently dropped.
- The backend always uses `gateway: 'PAYSTACK'` (commerce.service.ts:790) regardless.
- The `PaymentGateway` enum has 4 values (`PAYSTACK, FLUTTERWAVE, CASH_ON_DELIVERY, WALLET`) but only `PAYSTACK` is ever written.
- **Consequence:** The buyer's payment-method choice is decorative. Selecting "Wallet" or "Cash on Delivery" has no effect.

#### Critical Break #8 — Vendor wallet is NOT credited at order creation, NOR at payment, NOR at delivery
- Order creation (commerce.service.ts:728-773): wallet untouched.
- Payment success (commerce.service.ts:2769-2776): wallet untouched.
- Delivery completion (no endpoint sets `Order.status=DELIVERED` automatically): wallet untouched.
- Wallet credit happens ONLY in `EscrowService.releaseFunds` / `resolveDispute` (escrow.service.ts:179, 338, 409) — which are unreachable from the normal flow (see Breaks #1, #2, #3).
- The task asked specifically: "Is the vendor wallet credited too early (at order creation/payment instead of release)?" — Answer: **No, it's the opposite problem. The vendor wallet is NEVER credited at any stage of the normal order flow.**

#### Critical Break #9 — Inventory deducted at the wrong stage
- Reservations are created at order creation (commerce.service.ts:2668, `reserveInventoryForOrderItem`) — `available` decremented, `reserved` incremented, `expiresAt = now + RESERVATION_MINUTES`.
- Reservations are committed on payment success (commerce.service.ts:2999, `commitReservations`) — `reserved` decremented (so stock is permanently consumed).
- Reservations are released on payment failure (commerce.service.ts:3014, `releaseReservations`) — `available` restored, `reserved` decremented.
- **Issue:** There is no endpoint to release expired reservations automatically. `releaseExpiredReservations` exists (commerce.service.ts:2536) and is exposed at `POST /admin/inventory/reservations/release-expired` (commerce.controller.ts:396) — but it's admin-only and not cron-scheduled. **Expired reservations leak stock forever unless an admin manually triggers cleanup.**

#### Critical Break #10 — Statuses collapsed into one field when they should be separate dimensions
- The Order model has 3 status fields (`status`, `paymentStatus`, `disputeStatus`) but **no `escrowStatus` and no `fulfillmentStatus` on Order itself** — those live on separate tables.
- The intended workflow has 5+ dimensions (order/payment/escrow/fulfillment/delivery/dispute/quote). The backend has 3 (order/payment/dispute), with escrow/fulfillment/delivery as separate 1:1 rows that aren't loaded by default in `/orders/:id`.
- The buyer `/orders/:id` endpoint (commerce.service.ts:1031-1047) includes `items`, `payment`, `fulfillments` — but NOT `escrow`, `delivery`, `store`, or `address`. So the frontend cannot render the escrow badge or delivery status from the live API response without making additional calls (which don't exist).

#### Critical Break #11 — No quote negotiation system at all
- The task asks: "Is there a quote negotiation system at all?" — **NO.**
- No `Quote` model, no `QuoteStatus` enum, no `quoteAmount`/`quoteStatus`/`quoteNegotiation` fields on Order, no `/orders/:id/quote` endpoint, no "vendor submits quote" or "buyer accepts/rejects quote" endpoint.
- The frontend `useQuoteOrder` hook (order-api.ts:235) calls `POST /orders/:id/quote` — this route does not exist and will return 404.
- The marketplace's `QuotationCard` component (`apps/marketplace/src/components/order/quotation-card.tsx`) is purely presentational and reads from the mock store.
- The intended 1688-style "place order → vendor quotes → buyer accepts → pay" flow is **a frontend-only mock** with zero backend support.

#### Critical Break #12 — Vendor `ready` endpoint creates a Fulfillment with status `READY`, but `Order.status` becomes `FULFILLED`
- `orders.controller.ts:148-156`: when `action === 'ready'`, creates `Fulfillment{type:'PHYSICAL_MANUAL', status:'READY'}` AND sets `Order.status = 'FULFILLED'`.
- This is confusing: `Fulfillment.status=READY` while `Order.status=FULFILLED`. The two statuses disagree on whether the order is "ready" or "fulfilled".
- The `FULFILLED` value in the `OrderStatus` enum is supposed to mean "completed" but is being used to mean "ready for pickup".

#### Critical Break #13 — `idempotencyKey` on ParentCheckout is not `@unique`
- `ParentCheckout.idempotencyKey` is `String?` with `@@index([idempotencyKey])` but **no `@unique`** constraint (schema.prisma:1200).
- The checkout code (commerce.service.ts:588-610) does a manual `findFirst({ where: { buyerId, idempotencyKey } })` to detect duplicates. Without a DB unique constraint, concurrent identical requests can both succeed and create duplicate ParentCheckouts before the `findFirst` returns. Race condition.

---

## 9. Summary of File Locations

### Backend
| File | What's in it |
|---|---|
| `apps/api/prisma/schema.prisma:1053-1500` | Cart, CartItem, Order, ParentCheckout, OrderItem, Payment, Fulfillment, Delivery, Escrow, Wallet, Withdrawal, Commission models + all related enums |
| `apps/api/src/modules/commerce/commerce.controller.ts` | Cart, Checkout, Payments, Orders (buyer), Pool, Vendor, Admin controllers |
| `apps/api/src/modules/commerce/commerce.service.ts:580-870` | `checkout()` — full order-creation flow |
| `apps/api/src/modules/commerce/commerce.service.ts:2706-2833` | `processSuccessfulPayment()` — Paystack success handler (missing escrow creation) |
| `apps/api/src/modules/commerce/commerce.service.ts:2627-2677` | `reserveInventoryForOrderItem()` — inventory reservation at creation |
| `apps/api/src/modules/commerce/commerce.service.ts:3085-3210` | `resolveDeliveryQuote()` — zone-based delivery fee lookup |
| `apps/api/src/modules/commerce/commerce.dto.ts:94-115` | `CheckoutDto` (missing `items`, `paymentMethod`, `deliveryType`) |
| `apps/api/src/modules/orders/orders.controller.ts` | `VendorOrdersController` — accept/reject/prepare/ready/cancel |
| `apps/api/src/modules/order-operations/order-operations.controller.ts` | `VendorOrderOperationsController` — only `/note` endpoint exposed |
| `apps/api/src/modules/order-operations/order-operations.service.ts:85-99` | Duplicate (dead) transition map |
| `apps/api/src/payments/escrow.service.ts:32-94` | `holdPayment()` — NEVER CALLED |
| `apps/api/src/payments/escrow.service.ts:133-244` | `releaseFunds()` — only reachable via admin endpoint or dead cron |
| `apps/api/src/payments/escrow-scheduler.service.ts` | `@Cron`-decorated but never registered, no ScheduleModule |
| `apps/api/src/payments/payments.module.ts:11` | Comment "Exported so CommerceModule can call holdPayment on checkout" — aspirational, not wired |
| `apps/api/src/payments/payments.controller.ts` | `PaymentsController` at `/vendor/wallet` — wallet balance, transactions, withdrawals, escrow holdings |
| `apps/api/src/payments/payments-admin.controller.ts` | `PaymentsAdminController` at `/admin/escrow` — manual release/refund/dispute/withdrawal |
| `apps/api/src/modules/delivery/delivery.controllers.ts` | Vendor + Admin delivery endpoints; NO customer confirmation endpoint |
| `apps/api/src/modules/delivery/delivery.service.ts:248-329` | `assignRider` — only way to create a `Delivery` row (admin-only) |

### Frontend (marketplace)
| File | What's in it |
|---|---|
| `apps/marketplace/src/stores/cart-store.ts` | Zustand cart in localStorage — NOT synced to backend |
| `apps/marketplace/src/stores/order-workflow-store.ts` | Zustand mock order workflow store (the "intended" flow, frontend-only) |
| `apps/marketplace/src/lib/escrow.ts` | In-memory `Map<string, EscrowRecord>` — mock escrow service, no API calls |
| `apps/marketplace/src/lib/order-api.ts:84-110` | `CheckoutPayload` / `CheckoutResult` types (don't match backend DTO) |
| `apps/marketplace/src/lib/order-api.ts:222-274` | `useCheckout`, `useQuoteOrder` (404s), `useVendorOrderAction` (uses `ship` action that 404s) |
| `apps/marketplace/src/constants/order-workflow.ts:26-53` | 13-value OrderStatus (intended workflow) — does not match Prisma enum |
| `apps/marketplace/src/types/order-workflow.ts` | `Quotation`, `EscrowRecord`, `Dispute`, `OrderWorkflowState` types — all frontend-only |
| `apps/marketplace/src/app/checkout/page.tsx` | Checkout UI (address form, delivery options, payment-method picker, coupon, summary) |
| `apps/marketplace/src/app/checkout/verify/page.tsx` | Paystack callback verification page |
| `apps/marketplace/src/app/orders/[id]/page.tsx` | Order detail — renders one of MockOrderWorkflow / LiveOrderDetail / ApiOrderDetail |
| `apps/marketplace/src/components/order/quotation-card.tsx` | Presentational quotation card (reads from mock store) |
| `apps/marketplace/src/components/order/order-actions.tsx` | Action buttons (Pay, Cancel, Confirm Receipt, Return, Report) — all call mock store actions |

---

## 10. Concise Answers to the Task's Closing Questions

| Question | Answer |
|---|---|
| Does order have separate status dimensions or one field? | **Three fields on `Order`**: `status` (OrderStatus), `paymentStatus` (PaymentStatus), `disputeStatus` (DisputeStatus). Plus `Escrow.status`, `Fulfillment.status`, `Delivery.status`, `Payment.status` on separate 1:1 rows. **No `escrowStatus` or `fulfillmentStatus` is denormalized onto `Order` itself** — the buyer's `/orders/:id` endpoint doesn't even include `escrow` or `delivery` in the response. |
| Is the vendor wallet credited at order creation? | **NO.** It is not credited at order creation, nor at payment success, nor at delivery. It is only credited inside `EscrowService.releaseFunds` — which is never reached from the normal flow because `holdPayment` is never called, the cron is never registered, and there is no customer-confirmation endpoint. **The vendor wallet is effectively never credited.** |
| Does a quote negotiation system exist? | **NO.** No `Quote` model, no `QuoteStatus` enum, no quote fields on `Order`, no `/orders/:id/quote` endpoint. The marketplace's `useQuoteOrder` hook will 404. The frontend's `Quotation` type and `QuotationCard` component operate entirely on local mock state. |
| Is multi-vendor supported? | **Backend: YES** — `groupCartItemsByStore` splits the cart and creates one Order per store under one ParentCheckout. **Frontend: YES in localStorage** — the cart-store allows items from any store. **End-to-end: NO** — the marketplace never POSTs cart items to the backend, so the backend's cart is always empty and `POST /checkout` always throws "Cart is empty". |
| Does checkout charge a delivery fee before vendor quote? | **YES — and there is no vendor quote stage at all.** The checkout page shows a hardcoded fee (₦1,500–₦4,500 by state + delivery type) and the backend computes `shippingFee` from `StoreDeliveryZone` at checkout time. Both happen *before* (and instead of) any vendor quote. The page header copy ("No payment now — the vendor will send a quotation") directly contradicts the actual behavior (immediate Paystack initialization). |
