# Audit Report — Kwikscrow (Escrow) + Wallet + Transactions

**Task ID:** 2-c
**Scope:** `apps/api/` (NestJS + Prisma + SQLite)
**Audit mode:** READ-ONLY (no code modified)
**Date:** 2025 audit pass

---

## TL;DR (Executive Summary)

A `Kwikscrow`-style escrow **does exist as a Prisma model and as a service** (`Escrow`, `EscrowService`, `Wallet`, `WalletService`, `Commission`, `Withdrawal`), **but the entire mechanism is disconnected from the payment flow**. The single most important fact:

> **`EscrowService.holdPayment()` is never called anywhere in the codebase.** No `Escrow` row is ever created when a customer pays. Because every wallet-crediting code path requires an `Escrow` row to pre-exist, **the vendor wallet is never credited in any live code path** — it stays at its initialization value of ₦0 forever, even after successful orders and Paystack payments.

Secondary critical issues:

1. **`PaymentsAdminController`** (`apps/api/src/payments/payments-admin.controller.ts`) is defined but **NOT registered** in `payments.module.ts` → all its routes (`/admin/escrow/:id`, `/:deliveryId/release`, `/:deliveryId/refund`, `/:deliveryId/dispute/resolve`, `/pending-release`, `/disputes`, `/withdrawals/:withdrawalId/process`) are dead. There is **no live API to mark a withdrawal PROCESSED/FAILED**.
2. **`EscrowSchedulerService`** (`apps/api/src/payments/escrow-scheduler.service.ts`) is **NOT registered** as a provider, and `ScheduleModule.forRoot()` is **NOT imported** in `app.module.ts` → the `@Cron(EVERY_HOUR)` auto-release never fires.
3. **Two parallel, inconsistent escrow implementations** exist: `EscrowService.releaseFunds` (credits `commission.vendorEarnings` — *after* 5% fee) and `DeliveryService.manualEscrowRelease` (credits `escrow.amount` — *full amount, no fee*).
4. **`WalletService.creditWallet` / `debitWallet` are dead code** — never called; the actual wallet mutations are done inline in `EscrowService` and `DeliveryService`.
5. **No `WalletTransaction` ledger model** — "transaction history" is derived on-the-fly by unioning `Escrow` (RELEASED/REFUNDED) + `Withdrawal` rows. No append-only ledger, no `reference`/idempotency column on wallet credits.
6. **No customer "confirm delivery" endpoint** and **no rider "mark delivered" endpoint** — `Delivery.customerConfirmed` is read by (dead) auto-release code but **never set** by any code.
7. **`refundPayment` does NOT call the Paystack refund API** and does NOT touch escrow/wallet — it only flips status flags.
8. **Duplicate route prefixes** `admin/escrow` and `vendor/wallet` across two modules (one dead, one live; `GET /vendor/wallet/escrow-holdings` is registered twice).

---

## 1. Escrow / Kwikscrow Search

### 1.1 Schema models found

**`model Escrow`** — `apps/api/prisma/schema.prisma:1424-1441`

```prisma
enum EscrowStatus {        // schema.prisma:1415-1422
  HELD
  PENDING_RELEASE
  RELEASED
  REFUNDED
  DISPUTED
  PARTIAL
}

model Escrow {
  id             String        @id @default(cuid())
  orderId        String        @unique          // 1:1 with Order
  vendorId       String
  amount         Float
  status         EscrowStatus  @default(HELD)
  releaseAt      DateTime?                      // when auto-release may fire
  releasedAt     DateTime?
  disputeReason  String?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([orderId])
  @@index([vendorId])
  @@index([status])
}
```

Fields present: `id, orderId, vendorId, amount, status, releaseAt, releasedAt, disputeReason, createdAt, updatedAt`.
Fields **MISSING** vs. the spec's expectation: **no `heldAt`** (relies on `createdAt`), **no `refundedAt`** (uses `updatedAt`), **no `transactionRef`** (no FK back to `Payment.reference`). There is no link from `Escrow` to the `Payment` row that funded it — reconciliation would have to go via `Order → Payment`.

**Order ↔ Escrow relation** — `schema.prisma:1170` (`escrow Escrow?` on `Order`).

### 1.2 No "Kwikscrow" name

A grep for `kwikscrow` / `Kwikscrow` / `KWIKSCROW` across `apps/api/src` returns **zero** matches. The product's escrow feature is called "Escrow" in every code path; "Kwikscrow" is a marketing/spec name only.

### 1.3 Escrow module / service files

| File | Purpose | Status |
|---|---|---|
| `apps/api/src/payments/escrow.service.ts` (816 lines) | `EscrowService` — holdPayment, initiateRelease, releaseFunds, freezeForDispute, resolveDispute, refundToCustomer, getVendorHoldings, getById, getByDeliveryId, getPendingRelease, listDisputes, processEscrowAutoRelease | **Mostly dead** (see §3) |
| `apps/api/src/payments/escrow-scheduler.service.ts` (31 lines) | `EscrowSchedulerService` — `@Cron(EVERY_HOUR)` calling `processEscrowAutoRelease` | **Dead** — not registered, no `ScheduleModule` |
| `apps/api/src/payments/payments.module.ts` (13 lines) | declares `EscrowService`, `WalletService`, `PaymentsController` only | `PaymentsAdminController` & `EscrowSchedulerService` missing |
| `apps/api/src/payments/payments.controller.ts` | `@Controller('vendor/wallet')` — balance, transactions, withdraw, withdrawals, escrow-holdings | Live |
| `apps/api/src/payments/payments-admin.controller.ts` | `@Controller('admin/escrow')` — release, refund, dispute/resolve, pending-release, disputes, withdrawals/:id/process | **Dead** — not registered in module |
| `apps/api/src/modules/delivery/delivery.service.ts` | **Second** escrow impl: `manualEscrowRelease`, `refundEscrow`, `processEscrowAutoRelease`, `getEscrowHoldings` | Live (manual-release & refund routes) but unreachable in practice (no escrows exist) |
| `apps/api/src/modules/delivery/delivery.controllers.ts` | `AdminEscrowController @Controller('admin/escrow')` + `VendorEscrowController @Controller('vendor/wallet')` | Live (but conflict with payments controllers) |

---

## 2. Wallet Search

### 2.1 Schema models

**`model Wallet`** — `apps/api/prisma/schema.prisma:1445-1456`

```prisma
model Wallet {
  id                String   @id @default(cuid())
  vendorId          String   @unique
  availableBalance  Float    @default(0)
  pendingBalance    Float    @default(0)
  totalEarned       Float    @default(0)
  totalWithdrawn    Float    @default(0)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  vendor User @relation(fields: [vendorId], references: [id], onDelete: Cascade)
}
```

The wallet is tied to **`User` (vendor)**, *not* to `Store`. One wallet per vendor (`vendorId @unique`). `Store.vendorId` is also unique, so there's an effective 1:1 between Store and Wallet via the vendor User.

**`model Withdrawal`** — `schema.prisma:1458-1475` (vendorId, amount, bankCode, accountNumber, accountName, status `WithdrawalStatus` {PENDING, PROCESSED, FAILED}, reference?, processedAt?).

**`model Commission`** — `schema.prisma:1485-1500` (orderId @unique, vendorId, saleAmount, platformFeePercent, platformFeeAmount, vendorEarnings, plan, settledAt?).

### 2.2 NO `WalletTransaction` model

A grep for `WalletTransaction` in `schema.prisma` returns **zero** matches. There is **no append-only ledger**. "Transaction history" is fabricated at read-time in `WalletService.getTransactionHistory` (`wallet.service.ts:146-234`) by unioning three separate queries:

```ts
// wallet.service.ts:156-220 (excerpt)
const releasedEscrows   = await db.escrow?.findMany({ where: { vendorId, status: 'RELEASED' }, ... });
const withdrawals       = await db.withdrawal?.findMany({ where: { vendorId }, ... });
const refundedEscrows   = await db.escrow?.findMany({ where: { vendorId, status: 'REFUNDED' }, ... });
// ...mapped into a combined array, sorted, paginated in memory
```

Consequences:
- **No `reference` / `referenceId` idempotency column** on wallet movements — the only idempotency is the upstream `Escrow.status` guard.
- **No `reason` / `source` / `description` column** persisted — descriptions are generated on the fly (`Escrow release — Order #…`, `Withdrawal to …`).
- No `credit`/`debit`/`refund`/`escrow-release`/`commission`/`withdrawal` enum persisted — only inferred from the source row.

### 2.3 Transaction "types" (inferred, not stored)

From `wallet.service.ts:185-213` and `getTransactionHistory`:

| Inferred type | Source | Direction | Stored? |
|---|---|---|---|
| `escrow_release` | `Escrow` row with `status=RELEASED` | credit (+) | derived |
| `refund` | `Escrow` row with `status=REFUNDED` | debit (−) | derived |
| `withdrawal` | `Withdrawal` row | debit (−) | stored (Withdrawal table) |

No `commission` transaction type is surfaced to the vendor (the 5% fee is implicit — vendor only sees the net `vendorEarnings`).

### 2.4 Related but separate: `KwikCoins` / `CoinTransaction`

`schema.prisma:296-329` — a *separate* loyalty-points wallet (`KwikCoins`, integer `balance`) with its own `CoinTransaction` ledger (`CoinTransactionType`: EARNED, SPENT, PURCHASED, ADJUSTED, REFERRAL; has `source` and `balanceAfter`). This is **not** the money wallet — it's a rewards/points system. Created on vendor registration alongside the money wallet (`auth.service.ts:283-295`).

---

## 3. Wallet Service & Every Wallet-Credit Call Site

### 3.1 `WalletService` methods — `apps/api/src/payments/wallet.service.ts`

| Method | Line | Live? | Notes |
|---|---|---|---|
| `getVendorBalance(vendorId)` | 30-41 | ✅ live | reads `availableBalance`, `pendingBalance`, `totalEarned` |
| `requestPayout(vendorId, dto)` | 45-113 | ✅ live | debits `availableBalance`, increments `totalWithdrawn`, creates `Withdrawal` row — all in `$transaction` (line 65-87) |
| `getPayoutHistory(vendorId, params)` | 117-142 | ✅ live | paginated `Withdrawal` query |
| `getTransactionHistory(vendorId, params)` | 146-234 | ✅ live | derived union (see §2.2) |
| **`creditWallet(vendorId, amount, type, reference)`** | 238-264 | ❌ **DEAD** | never called anywhere |
| **`debitWallet(vendorId, amount, reference)`** | 268-285 | ❌ **DEAD** | never called; `requestPayout` does its own inline debit |
| `getOrCreateWallet(vendorId)` | 289-306 | ✅ live | used by `getVendorBalance`, `requestPayout` |
| `processWithdrawal(withdrawalId, status)` | 310-371 | ❌ **unreachable via API** | only caller is `PaymentsAdminController:127` which is not registered |

### 3.2 `creditWallet` idempotency & transactional integrity

`WalletService.creditWallet` (`wallet.service.ts:238-264`):

```ts
async creditWallet(vendorId, amount, type, reference): Promise<void> {
  const db = this.db();
  await db.$transaction(async (tx) => {
    const wallet = await tx.wallet?.findUnique({ where: { vendorId } });
    if (wallet) {
      await tx.wallet?.update({
        where: { vendorId },
        data: {
          availableBalance: { increment: amount },
          pendingBalance: { decrement: Math.min(wallet.pendingBalance ?? 0, amount) },
          totalEarned: { increment: amount },
        },
      });
    } else {
      await tx.wallet?.create({ data: { vendorId, availableBalance: amount, totalEarned: amount } });
    }
  });
  this.logger.log(`Wallet credited: ₦${amount} to vendor ${vendorId} (${type}, ref: ${reference})`);
}
```

- It IS wrapped in `$transaction` ✅
- It is **NOT idempotent** ❌ — the `reference` parameter is only used in a log string; there is no lookup to prevent double-credit. (Moot, since it's dead code.)
- It does **not** write any ledger row (no `WalletTransaction` to insert).

### 3.3 EVERY wallet-mutation call site (the key question)

Grep for `wallet.*\.(create|update|upsert)` and `tx.wallet` across `apps/api/src` returns these call sites:

| # | File:line | Operation | Trigger | Stage | Live? |
|---|---|---|---|---|---|
| 1 | `auth.service.ts:291` | `tx.wallet.create({ data: { vendorId } })` | Vendor registration | Onboarding | ✅ live — **initializes empty wallet (0 balances), NOT a credit** |
| 2 | `wallet.service.ts:67-73` | `tx.wallet.update({ decrement availableBalance, increment totalWithdrawn })` | `POST /vendor/wallet/withdraw` → `requestPayout` | Withdrawal request | ✅ live **debit** |
| 3 | `wallet.service.ts:248-260` | `tx.wallet.update({ increment availableBalance, increment totalEarned })` (inside `creditWallet`) | — | — | ❌ **DEAD** (never called) |
| 4 | `wallet.service.ts:276-282` | `db.wallet.update({ decrement, increment })` (inside `debitWallet`) | — | — | ❌ **DEAD** |
| 5 | `wallet.service.ts:294` | `db.wallet.create` (inside `getOrCreateWallet`) | lazy wallet creation | read/payout | ✅ live (rare; usually already exists from registration) |
| 6 | `wallet.service.ts:332-338` | `tx.wallet.update({ increment availableBalance, decrement totalWithdrawn })` (inside `processWithdrawal`, FAILED reversal) | `POST /admin/escrow/withdrawals/:id/process` (status=FAILED) | Withdrawal failure reversal | ❌ **unreachable** — controller not registered |
| 7 | `escrow.service.ts:181-190` | `tx.wallet.update({ increment availableBalance, increment totalEarned })` (inside `releaseFunds`) | `EscrowService.releaseFunds` ← dead `PaymentsAdminController` + dead `EscrowSchedulerService` + self-call in `processEscrowAutoRelease` | Escrow release | ❌ **unreachable** (no caller is live; and requires Escrow row that never exists) |
| 8 | `escrow.service.ts:192-198` | `tx.wallet.create` (inside `releaseFunds`, wallet-missing branch) | same | Escrow release | ❌ **unreachable** |
| 9 | `escrow.service.ts:338-347` | `tx.wallet.update` (inside `resolveDispute` "release_to_vendor") | dead `PaymentsAdminController.resolveDispute` | Dispute resolution | ❌ **unreachable** |
| 10 | `escrow.service.ts:349-356` | `tx.wallet.create` (same branch, wallet-missing) | same | Dispute resolution | ❌ **unreachable** |
| 11 | `escrow.service.ts:409-418` | `tx.wallet.update` (inside `resolveDispute` "partial") | same | Dispute resolution | ❌ **unreachable** |
| 12 | `escrow.service.ts:420-427` | `tx.wallet.create` (same branch, wallet-missing) | same | Dispute resolution | ❌ **unreachable** |
| 13 | `delivery.service.ts:488-499` | `tx.wallet.upsert({ create: { availableBalance: escrow.amount, totalEarned }, update: { increment availableBalance, increment totalEarned } })` (inside `manualEscrowRelease`) | `POST /admin/escrow/:deliveryId/manual-release` → `AdminEscrowController` | **Manual escrow release** | ⚠️ route is live, but **credits FULL `escrow.amount` (no 5% fee deduction)** and **always throws "No escrow found"** because no Escrow row ever exists |
| 14 | `delivery.service.ts:595-606` | `tx.wallet.upsert(...)` (inside `DeliveryService.processEscrowAutoRelease`) | nothing — method is never called | Auto-release | ❌ **DEAD** (never called; also credits full amount, no fee) |

**Read-only wallet reads** (not credits): `commerce.service.ts:1104` (vendor dashboard), `delivery.service.ts:220` (escrow-holdings summary), `escrow.service.ts:179/336/407` (findUnique inside release paths).

### 3.4 Net reachability of wallet credits

Filtering the table above to **only call sites that can actually fire in a running system**:

| Call site | Trigger | Will it credit the wallet? |
|---|---|---|
| `delivery.service.ts:488` (`manualEscrowRelease`) | admin `POST /admin/escrow/:deliveryId/manual-release` | **No** — throws `No escrow found for delivery` because `holdPayment` is never called, so no `Escrow` row exists. |

**Conclusion: there is no code path in the current running system that ever increments a vendor's `Wallet.availableBalance` above 0.** The vendor wallet is created at ₦0 on registration (`auth.service.ts:291`) and stays at ₦0 forever.

---

## 4. Escrow Hold / Release / Refund Logic

### 4.1 `EscrowService.holdPayment(orderId)` — `escrow.service.ts:32-94`

This is the method that *should* be called when a customer pays, to create the escrow record. It:

1. Looks up the order (with `store` and `escrow`).
2. If `order.escrow` already exists → logs a warning and returns (idempotent guard, line 43-46).
3. Computes `releaseAt = now + 24h` (`DEFAULT_HOLD_HOURS = 24`, line 12).
4. Creates the `Escrow` row (`status: HELD`, `amount: order.totalAmount`, `vendorId: order.store?.vendorId ?? order.storeId`) — lines 52-60.
5. Creates a `Commission` row with `platformFeePercent = 0.05` (5%), `platformFeeAmount = round(saleAmount * 0.05 * 100) / 100`, `vendorEarnings = saleAmount − feeAmount` — lines 62-78.
6. Sends a `PAYMENT_HELD` notification to the vendor.

```ts
// escrow.service.ts:11
const DEFAULT_COMMISSION_RATE = 0.05; // 5%
const DEFAULT_HOLD_HOURS = 24;
```

**CRITICAL: this method is never called.** Grep across all of `apps/api/src` for `holdPayment` returns only:
- `escrow.service.ts:32` (the definition)
- `payments.module.ts:11` (a comment: *"Exported so CommerceModule can call holdPayment on checkout"* — but `CommerceModule` never imports `PaymentsModule` and `CommerceService` never injects `EscrowService`).

`CommerceModule` (`apps/api/src/modules/commerce/commerce.module.ts:17-32`) only imports `PrismaService` and provides `CommerceService` + `PaystackService`. **`PaymentsModule` is not imported**, so `EscrowService` is not even injectable into `CommerceService`.

### 4.2 `EscrowService.initiateRelease(deliveryId)` — `escrow.service.ts:98-129`

Marks escrow `HELD → PENDING_RELEASE`, sets `releaseAt = now`. **Never called** by any code. No route triggers it.

### 4.3 `EscrowService.releaseFunds(deliveryId)` — `escrow.service.ts:133-244`

The "release escrow → credit wallet" path. Logic:

1. Load delivery + order + escrow + commission.
2. If `escrow.status === RELEASED || REFUNDED` → warn and return (**idempotent guard**, line 153-158). ✅ prevents double-credit.
3. If status not in `{HELD, PENDING_RELEASE}` → throw.
4. `vendorEarnings = commission?.vendorEarnings ?? escrow.amount` (line 167) — **uses the post-fee amount** if a Commission row exists.
5. Inside `db.$transaction` (line 171-208):
   - `tx.escrow.update → status: RELEASED, releasedAt: now`
   - `tx.wallet.findUnique({ where: { vendorId } })` → if exists, `update` incrementing `availableBalance` and `totalEarned` by `vendorEarnings`, decrementing `pendingBalance`; else `create` with `availableBalance = vendorEarnings`.
   - `tx.commission.update → settledAt: now`.
6. Sends `FUNDS_RELEASED` notification + audit log.

**Callers** (grep `releaseFunds`):
- `payments-admin.controller.ts:50` — `PaymentsAdminController.releaseEscrow` (`POST /admin/escrow/:deliveryId/release`) — **DEAD controller** (not registered).
- `escrow.service.ts:700, 724` — self-calls inside `processEscrowAutoRelease`, which is only called by the dead scheduler.

**So `releaseFunds` is unreachable in production.**

### 4.4 `EscrowService.freezeForDispute(orderId, reason)` — `escrow.service.ts:248-285`

Sets escrow `HELD/PENDING_RELEASE → DISPUTED`, sets `order.disputeStatus = OPENED`. **Never called** — no "open dispute" endpoint exists.

### 4.5 `EscrowService.resolveDispute(...)` — `escrow.service.ts:289-467`

Three branches (`release_to_vendor`, `refund_to_customer`, `partial`). The `release_to_vendor` and `partial` branches credit the wallet inline (call sites #9-12 in §3.3). The `refund_to_customer` branch only marks escrow `REFUNDED` + order `REFUNDED` — **no actual refund to the customer's payment method** and **no customer wallet credit** (there is no customer wallet model).

**Caller:** `payments-admin.controller.ts:85` (`POST /admin/escrow/:deliveryId/dispute/resolve`) — **DEAD controller**.

### 4.6 `EscrowService.refundToCustomer(orderId, reason?)` — `escrow.service.ts:471-542`

- If no escrow → just marks order `REFUNDED` (line 487-491).
- If escrow already `RELEASED` → throws.
- If already `REFUNDED` → returns (idempotent, line 500-503).
- Else, in `$transaction`: escrow → `REFUNDED`, order → `REFUNDED`.

**No actual refund to Paystack / customer.** Only status flags. **Caller:** `payments-admin.controller.ts:69` — **DEAD controller**.

### 4.7 `EscrowService.processEscrowAutoRelease()` — `escrow.service.ts:677-735`

Two passes:
1. Release `PENDING_RELEASE` escrows whose `releaseAt <= now` (calls `releaseFunds`).
2. Release `HED` escrows whose `delivery.customerConfirmed === true` (sets `PENDING_RELEASE` then calls `releaseFunds`).

**Caller:** `escrow-scheduler.service.ts:18` (`@Cron(EVERY_HOUR)`) — **NOT registered** (`EscrowSchedulerService` is absent from `payments.module.ts` providers, and `ScheduleModule.forRoot()` is absent from `app.module.ts`). The cron never fires.

Also: pass 2 depends on `delivery.customerConfirmed`, but **no code ever sets `customerConfirmed = true`** (grep `customerConfirmed` returns only this read site). So even if the cron ran, pass 2 would release nothing.

### 4.8 The SECOND escrow implementation — `DeliveryService`

`apps/api/src/modules/delivery/delivery.service.ts` duplicates the release/refund logic with **different semantics**:

**`manualEscrowRelease(deliveryId)`** (line 451-517) — called by live `AdminEscrowController` (`POST /admin/escrow/:deliveryId/manual-release`):

```ts
// delivery.service.ts:477-510 (excerpt)
const result = await this.prisma.$transaction(async (tx) => {
  const updatedEscrow = await tx.escrow.update({
    where: { id: escrow.id },
    data: { status: EscrowStatus.RELEASED, releasedAt: new Date() },
  });
  const wallet = await tx.wallet.upsert({
    where: { vendorId: escrow.vendorId },
    create: { vendorId: escrow.vendorId, availableBalance: escrow.amount, totalEarned: escrow.amount },  // ⚠️ FULL amount
    update: { availableBalance: { increment: escrow.amount }, totalEarned: { increment: escrow.amount } }, // ⚠️ FULL amount
  });
  await tx.delivery.update({ where: { id: deliveryId }, data: { status: DeliveryStatus.COMPLETED } });
  return { escrow: updatedEscrow, wallet };
});
```

Key differences vs `EscrowService.releaseFunds`:
- **Credits `escrow.amount` (full order total), NOT `commission.vendorEarnings`** → **no 5% fee deducted**.
- **Does not update the `Commission` row** (`settledAt` stays null).
- Checks `escrow.status === RELEASED` → throws `BadRequestException` (line 468-470) — also idempotent, but throws instead of silently returning.
- **Always fails in practice** because no `Escrow` row exists (`holdPayment` never called) → throws `No escrow found for delivery` at line 464-466.

**`refundEscrow(deliveryId)`** (line 522-568) — called by live `AdminEscrowController` (`POST /admin/escrow/:deliveryId/refund`):
- Marks escrow `REFUNDED`, **sets `releasedAt = new Date()` (line 551)** — semantically wrong (it's a refund, not a release; the schema has no `refundedAt`).
- Marks delivery `CANCELLED`.
- **No actual refund to customer.** Returns a note: *"Payment gateway refund should be processed separately."*

**`processEscrowAutoRelease()`** (line 573-633) — **DEAD** (never called). Same full-amount-no-fee credit pattern as `manualEscrowRelease`.

### 4.9 Fee / commission

- **Fee rate is hardcoded**: `DEFAULT_COMMISSION_RATE = 0.05` (5%) at `escrow.service.ts:11`. Not configurable via env, not per-vendor-plan.
- Fee is computed **only inside `holdPayment`** (line 62-66) — since `holdPayment` is dead, **no `Commission` row is ever created** either.
- `DeliveryService.manualEscrowRelease` ignores commission entirely → would credit the full amount if it ever ran.
- At order creation, `OrderItem.platformFeeAmount` is hardcoded to `0` (`commerce.service.ts:767`), and `PoolSettlement.platformFeeAmount` is `0` (`commerce.service.ts:2700`). No fee is captured at the line-item level.

---

## 5. Payment Integration

### 5.1 Provider

**Paystack** is the only fully-wired provider. `apps/api/src/modules/commerce/paystack.service.ts` (88 lines):
- `initializeTransaction(input)` → `POST https://api.paystack.co/transaction/initialize` (line 31).
- `verifyTransaction(reference)` → `GET https://api.paystack.co/transaction/verify/:reference` (line 70).
- **No `refund` endpoint** is implemented.

A second, **legacy `PaymentService`** at `apps/api/src/common/services/payment.service.ts` (200 lines) wraps both Paystack and Flutterwave initialize/verify but returns **mock URLs** when secret keys are missing (`status: 'success', amount: 0` at line 149, 178). It does **not** appear to be injected into any active checkout flow — `CommerceService` uses `PaystackService` directly.

### 5.2 Payment initiation

`CommerceService` (commerce.service.ts) — checkout at `POST /checkout` creates `ParentCheckout` + child `Order`s + `Payment` (status PENDING) + `InventoryReservation`s + `PoolSettlement`s, then `PaystackService.initializeTransaction` returns an `authorizationUrl`. The `Payment` row stores `reference`, `gateway: PAYSTACK`, `authorizationUrl`.

### 5.3 Payment confirmation / webhook

**Two entry points** both funnel into `processSuccessfulPayment`:

1. **Webhook** — `POST /payments/webhooks/paystack` (`commerce.controller.ts:185`) → `CommerceService.handlePaystackWebhook` (line 977-1016):
   - Verifies HMAC-SHA512 signature.
   - Records `PaymentWebhookEvent` (idempotency via `idempotencyKey @unique` — `recordWebhookEvent`, line 2842-2869, catches P2002). ✅ **idempotent**.
   - Calls `processSuccessfulPayment(reference, …)`.
2. **Polling verify** — `GET /checkout/payments/:reference` or `GET /payments/verify/:reference` (`commerce.controller.ts:153, 177`) → `CommerceService.verifyPayment` (line 929-975): if `payment.status === PENDING`, calls `paystack.verifyTransaction` and, on `success`, calls `processSuccessfulPayment`. ✅ also idempotent (see below).

**`processSuccessfulPayment(reference, gateway)`** — `commerce.service.ts:2706-2833`, wrapped in `db.$transaction`:

1. `payment.status === 'PAID'` → return `{ idempotent: true }` immediately (line 2747-2749). ✅ **idempotent**.
2. `assertGatewayAmountMatchesOrder` — verifies Paystack amount (kobo) === `payment.amount * 100` (line 2898-2917).
3. `tx.payment.update → status: PAID, paidAt, verifiedAt`.
4. If `parentCheckout`: mark `ParentCheckout.status = PAID`, loop child orders → `Order.status = PAID, paymentStatus = PAID`, `commitReservations` (decrement inventory), `createFulfillmentsForPaidOrder` (PHYSICAL_MANUAL PENDING or DIGITAL_ACCESS READY), increment `coupon.usedCount`.
5. Else (single order): same for the single order.
6. `writeAudit`.

### 5.4 Does payment success → escrow funding?

**NO.** `processSuccessfulPayment` does **not** call `escrowService.holdPayment()` (or any escrow method). It does **not** create a `Commission` row. It does **not** credit any wallet. Money is captured by Paystack (settles to the merchant's Paystack account) and the platform records `Payment.status = PAID` — that's where the money trail in the DB ends.

The intended flow `Pay → Kwikscrow holds → Release condition → Wallet credit` is implemented as **Pay → (Kwikscrow hold never fires) → Wallet never credited**.

---

## 6. Actual Money Flow (as implemented)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 1. CUSTOMER CHECKS OUT                                                       │
│    POST /api/v1/checkout  (commerce.service.ts checkout ~line 690-810)       │
│    └─ $transaction:                                                          │
│       ├─ ParentCheckout.create  (status: PENDING_PAYMENT)                    │
│       ├─ Order.create (per store) (status: PENDING_PAYMENT,                  │
│       │                     paymentStatus: PENDING, platformFeeAmount: 0)    │
│       ├─ OrderItem.create (platformFeeAmount: 0)                             │
│       ├─ InventoryReservation.create (status: ACTIVE)                        │
│       ├─ PoolSettlement.create (status: HELD)  ← only for pool/resale items  │
│       └─ Payment.create (gateway: PAYSTACK, status: PENDING, reference)      │
│    → PaystackService.initializeTransaction → returns authorizationUrl        │
│    ❌ NO Escrow row created                                                   │
│    ❌ NO Commission row created                                               │
│    ❌ NO Wallet mutation                                                      │
└──────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ 2. CUSTOMER PAYS ON PAYSTACK                                                 │
│    Paystack captures funds → settles to merchant's Paystack account          │
│    (NOT to any "Kwikscrow" / platform-held sub-account)                      │
└──────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ 3. PAYMENT CONFIRMATION (two idempotent paths)                               │
│    a) Paystack webhook → POST /payments/webhooks/paystack                    │
│       → handlePaystackWebhook (commerce.service.ts:977-1016)                 │
│         ├─ HMAC-SHA512 signature verify                                      │
│         ├─ PaymentWebhookEvent.create (idempotencyKey @unique) ✅ idempotent  │
│         └─ processSuccessfulPayment(reference, …)                            │
│    b) Client polling → GET /payments/verify/:reference                       │
│       → verifyPayment (commerce.service.ts:929-975)                          │
│         └─ if PENDING: PaystackService.verifyTransaction →                   │
│            processSuccessfulPayment(reference, …)                            │
│                                                                              │
│    processSuccessfulPayment (commerce.service.ts:2706-2833)  [$transaction]: │
│       ├─ if payment.status === 'PAID' → return {idempotent:true} ✅          │
│       ├─ assertGatewayAmountMatchesOrder (kobo check)                        │
│       ├─ Payment.update → status: PAID, paidAt, verifiedAt                   │
│       ├─ ParentCheckout.update → status: PAID                                │
│       ├─ Order.update(s) → status: PAID, paymentStatus: PAID                 │
│       ├─ commitReservations (decrement inventory.reserved)                   │
│       ├─ createFulfillmentsForPaidOrder (PHYSICAL_MANUAL PENDING /           │
│       │                                       DIGITAL_ACCESS READY)          │
│       └─ coupon.usedCount++                                                  │
│    ❌ NO EscrowService.holdPayment() call                                    │
│    ❌ NO Commission row created                                              │
│    ❌ NO Wallet credit                                                       │
└──────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ 4. POST-PAYMENT FULFILLMENT (status flags only; no money movement)           │
│    Vendor: PATCH /vendor/orders/:id/accept|prepare|ready  (orders.controller)│
│            POST /vendor/deliveries/:id/preparing|ready|pickup-confirm        │
│            (delivery.controllers.ts VendorDeliveryController)                │
│    Admin:  POST /admin/deliveries/:orderId/assign  → creates Delivery        │
│            (Delivery.status: ASSIGNED, riderId set)                          │
│    ❌ NO rider "mark delivered" endpoint  → deliveredAt never set            │
│    ❌ NO customer "confirm receipt" endpoint → customerConfirmed never set   │
│    ❌ NO EscrowService.initiateRelease() call                                │
└──────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ 5. ESCROW RELEASE  (intended: delivery confirmed → wallet credit)            │
│                                                                              │
│    Intended path (DEAD):                                                     │
│       EscrowSchedulerService @Cron(EVERY_HOUR)                               │
│         → processEscrowAutoRelease → releaseFunds(deliveryId)                │
│           → $transaction: escrow.RELEASED + wallet.credit(vendorEarnings)    │
│           (credits vendorEarnings = saleAmount − 5% fee)                     │
│       ❌ EscrowSchedulerService NOT registered in payments.module.ts          │
│       ❌ ScheduleModule.forRoot() NOT imported in app.module.ts              │
│       ❌ cron never fires                                                     │
│                                                                              │
│    Live admin path (UNREACHABLE in practice):                                │
│       POST /admin/escrow/:deliveryId/manual-release                          │
│         → DeliveryService.manualEscrowRelease (delivery.service.ts:451)      │
│           → $transaction: escrow.RELEASED + wallet.upsert(escrow.amount)     │
│           (credits FULL escrow.amount, NO 5% fee, NO Commission settle)      │
│       ❌ throws "No escrow found for delivery" — because holdPayment          │
│          was never called, so no Escrow row exists for the order             │
│                                                                              │
│    RESULT: vendor Wallet.availableBalance stays at ₦0 (init value from       │
│    auth.service.ts:291) forever. Vendors are never paid through the system.  │
└──────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ 6. REFUND PATH                                                               │
│    Admin: POST /admin/payments/refund  (commerce.controller.ts:368)          │
│           → CommerceService.refundPayment (commerce.service.ts:2326-2405)    │
│             [$transaction]:                                                  │
│             ├─ Payment.update → status: REFUNDED (or keep PAID if orderId)   │
│             ├─ Order.update(s) → status: REFUNDED                            │
│             ├─ releaseReservations (increment inventory.available)           │
│             └─ audit log                                                     │
│    ❌ Does NOT call Paystack refund API (no such method exists)              │
│    ❌ Does NOT touch Escrow (none exists)                                    │
│    ❌ Does NOT credit any customer wallet (no customer wallet model)         │
│    Customer never receives money back through the system.                    │
│                                                                              │
│    Alt path (DEAD controller): PaymentsAdminController.refundEscrow          │
│       → EscrowService.refundToCustomer — same status-flag-only behavior      │
│    Alt path (live route, unreachable): POST /admin/escrow/:deliveryId/refund │
│       → DeliveryService.refundEscrow — marks escrow REFUNDED + delivery      │
│         CANCELLED, sets releasedAt(!!), no actual refund                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Idempotency

| Operation | Idempotent? | Mechanism | Location |
|---|---|---|---|
| Paystack webhook | ✅ yes | `PaymentWebhookEvent.idempotencyKey @unique`; P2002 → return existing | `commerce.service.ts:2842-2869` (`recordWebhookEvent`) |
| `processSuccessfulPayment` | ✅ yes | `if (payment.status === 'PAID') return { idempotent: true }` | `commerce.service.ts:2747-2749` |
| `verifyPayment` polling | ✅ yes | delegates to `processSuccessfulPayment` (idempotent); only acts if `payment.status === PENDING` | `commerce.service.ts:943-955` |
| `EscrowService.holdPayment` | ✅ yes (if called) | `if (order.escrow) { warn; return; }` | `escrow.service.ts:43-46` — **but never called** |
| `EscrowService.releaseFunds` | ✅ yes (if called) | `if (escrow.status === RELEASED \|\| REFUNDED) return` | `escrow.service.ts:153-158` — **unreachable** |
| `EscrowService.refundToCustomer` | ✅ yes (if called) | `if (escrow.status === REFUNDED) return` | `escrow.service.ts:500-503` — **unreachable** |
| `DeliveryService.manualEscrowRelease` | ⚠️ partial | throws `BadRequestException` if `escrow.status === RELEASED` (prevents double-credit) but no reference/idempotency key | `delivery.service.ts:468-470` — **unreachable in practice** |
| `WalletService.creditWallet` | ❌ no | `reference` param only used in log; no dedup lookup | `wallet.service.ts:238-264` — **dead code** |
| `WalletService.requestPayout` (debit) | ❌ no idempotency on the debit | generates `reference = WDR-<ts>-<vendorId>` but does not check uniqueness before debiting; double-POST of the same payout would debit twice | `wallet.service.ts:62-87` |
| Order checkout | ✅ yes | `Order.idempotencyKey` + `ParentCheckout.idempotencyKey` (schema `Order.idempotencyKey` line 1152) | `commerce.service.ts:718, 748` |

**What happens if the release endpoint is called twice?** In the live `manualEscrowRelease` path: first call throws "No escrow found" (no effect); Nth call same. If an escrow *did* exist: first call credits wallet + sets `escrow.status = RELEASED`; second call throws `Escrow has already been released` (line 468-470). So double-credit is prevented by the status guard — but only because the status is flipped in the same transaction as the credit.

**What happens if a payment webhook fires twice?** First webhook creates `PaymentWebhookEvent` (status RECEIVED), processes payment, marks webhook PROCESSED. Second webhook: `recordWebhookEvent` hits P2002 on `idempotencyKey @unique`, returns `{ idempotent: true }`, handler returns early (`commerce.service.ts:1001-1003`). Even if it reached `processSuccessfulPayment` again, the `payment.status === 'PAID'` guard would no-op. ✅ Robust.

---

## 8. Transactional Integrity

| Multi-write operation | Wrapped in `$transaction`? | File:line |
|---|---|---|
| Checkout (ParentCheckout + Orders + Items + Reservations + PoolSettlements + Payment) | ✅ yes | `commerce.service.ts` checkout method (the `return this.db().$transaction(async (tx) => {` at the top of the checkout flow) |
| `processSuccessfulPayment` (Payment.update + Order.update + commitReservations + createFulfillments + coupon) | ✅ yes | `commerce.service.ts:2710` |
| `failPaymentReference` (Payment.update + Order.update + releaseReservations) | ✅ yes | `commerce.service.ts:2927` |
| `refundPayment` (Payment.update + Order.update + releaseReservations + ParentCheckout.update) | ✅ yes | `commerce.service.ts:2328` |
| `EscrowService.holdPayment` (escrow.create + commission.create) | ❌ **NO** — two separate `await`s, not wrapped | `escrow.service.ts:52` and `:68` — **dead anyway** |
| `EscrowService.releaseFunds` (escrow.update + wallet.update + commission.update) | ✅ yes | `escrow.service.ts:171` — **unreachable** |
| `EscrowService.resolveDispute` (escrow.update + wallet.update + commission.update) | ✅ yes (per branch) | `escrow.service.ts:329, 374, 401` — **unreachable** |
| `EscrowService.refundToCustomer` (escrow.update + order.update) | ✅ yes | `escrow.service.ts:505` — **unreachable** |
| `DeliveryService.manualEscrowRelease` (escrow.update + wallet.upsert + delivery.update) | ✅ yes | `delivery.service.ts:477` |
| `DeliveryService.refundEscrow` (escrow.update + delivery.update) | ❌ **NO** — two separate `await`s | `delivery.service.ts:547` and `:556` — escrow could be REFUNDED while delivery update fails, leaving inconsistent state |
| `DeliveryService.processEscrowAutoRelease` (per-escrow: escrow.update + wallet.upsert) | ✅ yes (per iteration) | `delivery.service.ts:586` — **dead** |
| `WalletService.requestPayout` (wallet.update + withdrawal.create) | ✅ yes | `wallet.service.ts:65` |
| `WalletService.processWithdrawal` (withdrawal.update + optional wallet.update reversal) | ✅ yes | `wallet.service.ts:324` — **unreachable via API** |
| `WalletService.creditWallet` (wallet.findUnique + wallet.update/create) | ✅ yes | `wallet.service.ts:245` — **dead** |
| Vendor registration (user + profile + subscription + kwikCoins + wallet) | ✅ yes | `auth.service.ts` (the `tx.wallet.create` at line 291 is inside a larger `$transaction`) |

**Key gap:** if `holdPayment` were ever wired in, its escrow.create + commission.create are **NOT** in a single transaction (`escrow.service.ts:52` and `:68` are separate awaits) — a crash between them would leave an escrow with no commission, causing `releaseFunds` to fall back to `escrow.amount` (full amount, no fee) at line 167. Also, `holdPayment`'s notification + the escrow/commission writes are not atomic with the upstream `processSuccessfulPayment` transaction (they'd be a separate call).

---

## 9. Gaps & Observations

### 9.1 Does Kwikscrow (escrow) exist at all?

**Partially.** The `Escrow` Prisma model exists (`schema.prisma:1424`). The `EscrowService` exists with a full hold/release/refund/dispute API surface (`escrow.service.ts`, 816 lines). **But it is completely disconnected from the payment flow** — `holdPayment` is never called, so no `Escrow` row is ever created, so none of the release/refund/dispute code can ever affect anything. The escrow subsystem is, in production terms, **inert scaffolding**.

### 9.2 Is the vendor wallet credited at the WRONG stage?

**No** — and that's actually the bug. The vendor wallet is **never credited at any stage**. There is no premature crediting (the order-creation and payment-success paths correctly avoid touching the wallet), but there is also no crediting at the release stage because the release trigger is dead and the escrow row never exists. The system correctly avoids the "credit at order placement" anti-pattern but fails to implement the "credit at release" half of the spec.

### 9.3 Idempotency

- **Payment side: robust.** `PaymentWebhookEvent.idempotencyKey @unique` + `payment.status === 'PAID'` guard. Double webhook = no-op. ✅
- **Escrow side: present but unreachable.** `holdPayment` guards on `order.escrow` existing; `releaseFunds`/`refundToCustomer` guard on `escrow.status`. ✅ in theory.
- **Wallet side: missing.** No `WalletTransaction` ledger, no `reference`/idempotency column on the `Wallet` table. If `releaseFunds` ever had a bug where the status guard was bypassed, there is no second line of defense. `WalletService.creditWallet`'s `reference` param is cosmetic.
- **Withdrawal request: no idempotency.** Double-POST of `POST /vendor/wallet/withdraw` with the same amount would create two `Withdrawal` rows and debit twice (only constrained by `availableBalance` going negative, which Prisma's `decrement` does not prevent — it would produce a negative balance).

### 9.4 Fee deduction

- **Intended:** 5% platform fee, hardcoded as `DEFAULT_COMMISSION_RATE = 0.05` at `escrow.service.ts:11`, computed in `holdPayment` (line 62-66), stored in `Commission.vendorEarnings`, credited to wallet at release (`releaseFunds` line 167).
- **Actual:** `holdPayment` is dead → no `Commission` row is ever created → no fee is ever deducted → no earnings are ever credited.
- **Inconsistency:** if `DeliveryService.manualEscrowRelease` (the live admin route) ever fired on a magically-existing escrow, it would credit the **full** `escrow.amount` and ignore the `Commission` row entirely — a 100% payout with 0% platform fee, contradicting the `EscrowService` path's 95%/5% split.

### 9.5 Refund path

- **`CommerceService.refundPayment`** (the live admin refund): flips `Payment`/`Order`/`ParentCheckout` status to REFUNDED, releases inventory reservations. **Does not call Paystack refund API, does not touch escrow, does not credit any customer wallet.** Customer never sees money back through the platform.
- **`EscrowService.refundToCustomer`** (dead): same status-flag behavior, plus marks escrow REFUNDED.
- **`DeliveryService.refundEscrow`** (live route, unreachable): marks escrow REFUNDED + delivery CANCELLED, sets `releasedAt` (semantically wrong), returns a note saying the gateway refund should be processed separately.
- **No customer wallet model exists** — there is nowhere for a refund-to-wallet to go. Customers can only be refunded via the payment gateway (Paystack), and that API call is not implemented.

### 9.6 Gap between current implementation and intended spec

| Intended (spec) | Current implementation | Gap |
|---|---|---|
| Customer pays → Kwikscrow holds funds | Customer pays → Paystack captures; `holdPayment` is never called; no `Escrow` row created | **Fatal** — escrow never holds anything |
| Release condition met (pickup confirmed / delivery confirmed) → vendor wallet credited | No code path credits the wallet; release triggers are dead or unreachable | **Fatal** — vendor never paid |
| Fees deducted before release | 5% fee computed in dead `holdPayment`; `Commission` row never created | Fee logic exists but is inert |
| Refund path | Status flags only; no gateway refund; no customer wallet | Customer cannot be refunded via system |
| Idempotency on wallet credits | No ledger, no reference dedup; only the (dead) escrow status guard | Double-credit risk if escrow guard ever bypassed |
| Append-only transaction ledger | Derived on-the-fly from Escrow + Withdrawal tables | No audit trail of wallet movements; cannot reconstruct balance from a ledger |

### 9.7 Additional structural issues

1. **`PaymentsAdminController` is not registered.** `payments.module.ts:9` lists only `controllers: [PaymentsController]`. The `PaymentsAdminController` class (with 7 routes including `/withdrawals/:withdrawalId/process`) is dead code. Consequence: **there is no live API endpoint to mark a `Withdrawal` as PROCESSED or FAILED** — `WalletService.processWithdrawal` is unreachable. Withdrawals stay PENDING forever in the DB.
2. **`EscrowSchedulerService` is not registered** and `ScheduleModule.forRoot()` is not imported. The `@Cron(CronExpression.EVERY_HOUR)` decorator is a no-op. Auto-release never runs.
3. **Duplicate `@Controller('admin/escrow')`**: `PaymentsAdminController` (dead) and `AdminEscrowController` (live, in `delivery.controllers.ts:152`). If the dead one were ever registered, NestJS would throw a route conflict on overlapping paths.
4. **Duplicate `@Controller('vendor/wallet')`**: `PaymentsController` (live, `payments.controller.ts:24`) and `VendorEscrowController` (live, `delivery.controllers.ts:85`). Both register `GET /api/v1/vendor/wallet/escrow-holdings` — a real route conflict; one handler shadows the other non-deterministically. The two implementations (`WalletService` vs `DeliveryService`) return different shapes.
5. **`WalletService.creditWallet` / `debitWallet` are dead code** — the live wallet mutations are done inline in `EscrowService` and `DeliveryService`, duplicating the logic with different fee semantics.
6. **No rider delivery-completion endpoint.** The `Delivery` model has `deliveredAt`, `customerConfirmed`, `customerRejected` fields, but no controller sets them. Vendor can only move delivery through `preparing → ready → pickup-confirm (PICKED_UP)`. There is no `PICKED_UP → IN_TRANSIT → ARRIVED → DELIVERED` rider-side transition, and no customer-side confirm-receipt endpoint. The auto-release condition (`customerConfirmed === true`) can therefore never become true.
7. **`DeliveryService.refundEscrow` sets `releasedAt` on a refund** (`delivery.service.ts:551`) — semantically wrong; the schema has no `refundedAt`.
8. **Two `processEscrowAutoRelease` implementations** (`escrow.service.ts:677` and `delivery.service.ts:573`) with different credit semantics (fee-deducted vs full-amount).
9. **`PoolSettlement` is a separate, also-inert holding mechanism** (`commerce.service.ts:2688-2703`, created with `status: 'HELD'` at checkout for pool/resale items). There is no code that ever settles/releases a `PoolSettlement` to any wallet — grep for `poolSettlement.update` returns zero matches. Another orphaned hold-and-release concept.

---

## 10. Wallet Credit Call Sites (consolidated table)

| # | File:Line | Trigger | Stage | Live? | Amount credited | Fee deducted? |
|---|---|---|---|---|---|---|
| 1 | `auth.service.ts:291` | Vendor registration | Onboarding | ✅ live | ₦0 (empty wallet create) | n/a |
| 2 | `wallet.service.ts:67` | `POST /vendor/wallet/withdraw` | Withdrawal request | ✅ live (DEBIT) | −amount | n/a |
| 3 | `wallet.service.ts:248` (`creditWallet`) | nothing | — | ❌ dead | — | — |
| 4 | `wallet.service.ts:276` (`debitWallet`) | nothing | — | ❌ dead | — | — |
| 5 | `wallet.service.ts:294` (`getOrCreateWallet`) | lazy create on first read/payout | read/payout | ✅ live | ₦0 (empty create) | n/a |
| 6 | `wallet.service.ts:332` (`processWithdrawal` FAILED) | `POST /admin/escrow/withdrawals/:id/process` (DEAD controller) | Withdrawal failure reversal | ❌ unreachable | +amount (reversal) | n/a |
| 7 | `escrow.service.ts:181` (`releaseFunds`) | dead `PaymentsAdminController` + dead `EscrowSchedulerService` | Escrow release | ❌ unreachable | +vendorEarnings | ✅ 5% (if Commission exists) |
| 8 | `escrow.service.ts:192` (`releaseFunds`, create branch) | same | Escrow release | ❌ unreachable | +vendorEarnings | ✅ 5% |
| 9 | `escrow.service.ts:338` (`resolveDispute` release_to_vendor) | dead `PaymentsAdminController.resolveDispute` | Dispute resolution | ❌ unreachable | +vendorEarnings | ✅ 5% |
| 10 | `escrow.service.ts:349` (same, create branch) | same | Dispute resolution | ❌ unreachable | +vendorEarnings | ✅ 5% |
| 11 | `escrow.service.ts:409` (`resolveDispute` partial) | same | Dispute resolution | ❌ unreachable | +vendorAmount (partial) | implicit |
| 12 | `escrow.service.ts:420` (same, create branch) | same | Dispute resolution | ❌ unreachable | +vendorAmount | implicit |
| 13 | `delivery.service.ts:488` (`manualEscrowRelease`) | `POST /admin/escrow/:deliveryId/manual-release` (LIVE route) | Manual escrow release | ⚠️ route live, **always throws "No escrow found"** | +escrow.amount (full) | ❌ NO fee |
| 14 | `delivery.service.ts:595` (`processEscrowAutoRelease`) | nothing | Auto-release | ❌ dead | +escrow.amount (full) | ❌ NO fee |

**Live, reachable wallet credits in the current running system: ZERO.**

---

## 11. Critical Gaps (ranked)

1. **【FATAL】`EscrowService.holdPayment` is never called.** No `Escrow` row is ever created. The entire Kwikscrow hold-and-release mechanism is inert. Money goes Paystack → merchant account; the platform DB has no record of "held" funds. *Fix: call `holdPayment(orderId)` (or its equivalent) inside `processSuccessfulPayment`'s `$transaction`, for each paid order.*

2. **【FATAL】Vendor wallet is never credited.** Because no escrow ever exists, every release path throws or no-ops. Vendors accumulate orders but their `Wallet.availableBalance` stays ₦0. *Fix: wire `holdPayment` (gap #1) and ensure the release trigger (delivery confirmed / customer confirmed / admin manual) actually invokes a working `releaseFunds`.*

3. **【HIGH】`EscrowSchedulerService` is not registered & `ScheduleModule` is not imported.** Auto-release cron never fires. *Fix: add `ScheduleModule.forRoot()` to `app.module.ts` imports and add `EscrowSchedulerService` to `payments.module.ts` providers.*

4. **【HIGH】`PaymentsAdminController` is not registered.** All 7 admin escrow/wallet routes are dead, including `POST /withdrawals/:id/process` — there is no way to mark a withdrawal PROCESSED/FAILED via API. *Fix: add `PaymentsAdminController` to `payments.module.ts` controllers (and resolve the `@Controller('admin/escrow')` collision with `AdminEscrowController`).*

5. **【HIGH】No customer "confirm receipt" endpoint and no rider "mark delivered" endpoint.** `Delivery.customerConfirmed` is never set, so even a working auto-release cron's pass-2 (customer-confirmed release) would never fire. *Fix: add rider delivery-completion endpoints and a customer confirm/reject endpoint that sets `customerConfirmed`/`deliveredAt`.*

6. **【HIGH】Two inconsistent escrow implementations.** `EscrowService.releaseFunds` credits `vendorEarnings` (after 5% fee) and settles `Commission`; `DeliveryService.manualEscrowRelease` credits full `escrow.amount` and ignores `Commission`. *Fix: pick one (preferably `EscrowService`), delete the other, have the live admin route call the canonical service.*

7. **【MEDIUM】No `WalletTransaction` ledger.** Transaction history is derived from `Escrow` + `Withdrawal` rows; no append-only ledger with `reference`/idempotency. *Fix: add a `WalletTransaction` model with a unique `reference` and write a row inside every credit/debit transaction.*

8. **【MEDIUM】No idempotency on withdrawal requests.** `POST /vendor/wallet/withdraw` debits the wallet and creates a `Withdrawal` row with no idempotency key; a double-submit debits twice. *Fix: accept an idempotency key on the payout DTO and dedup.*

9. **【MEDIUM】No Paystack refund API integration.** `refundPayment` only flips status; the customer never receives money back via the gateway. *Fix: add `PaystackService.refund(reference, amount?)` and call it from `refundPayment`.*

10. **【MEDIUM】5% commission rate is hardcoded** (`escrow.service.ts:11`). Not per-vendor, not per-plan, not env-configurable. *Fix: load from a vendor-plan / config table.*

11. **【LOW】`DeliveryService.refundEscrow` sets `releasedAt` on a refund** (`delivery.service.ts:551`) — semantically wrong. *Fix: add `refundedAt` to the schema or stop overloading `releasedAt`.*

12. **【LOW】`holdPayment` escrow.create + commission.create are not in a single `$transaction`** (`escrow.service.ts:52` and `:68`). A crash between them leaves an escrow with no commission, causing `releaseFunds` to credit the full amount. *Fix: wrap both in one `$transaction`.*

13. **【LOW】Duplicate `@Controller('vendor/wallet/escrow-holdings')`** across `PaymentsController` and `VendorEscrowController` — non-deterministic handler resolution. *Fix: remove one (the `VendorEscrowController` is a single-route duplicate).*

14. **【LOW】`PoolSettlement` is another orphaned hold-and-release concept** — created as HELD at checkout, never released to any wallet. *Fix: either implement pool-settlement release or remove the model.*

15. **【LOW】`WalletService.creditWallet` / `debitWallet` are dead code** — should be deleted or made the single canonical wallet-mutation path.

---

*End of audit report.*
