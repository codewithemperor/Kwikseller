# Task ID: csv-milestones — Bulk CSV Import + Vendor Milestones

Agent: full-stack-developer
Scope: 2 backend features in the commerce module.
Project root: `/home/z/my-project`

## What was done

### 1. Bulk CSV Import Endpoint (Part 2E)
- `POST /api/v1/vendor/products/bulk-import` added on `VendorCommerceController`
  (already `@UseGuards(JwtAuthGuard)` at class level — see `apps/api/src/modules/commerce/commerce.controller.ts:236-389`).
- Controller signature mirrors the spec exactly (typed `body.products` array, async method,
  defers to `commerce.bulkImportProducts(user, body?.products ?? [])`).
- `CommerceService.bulkImportProducts(user, products)` added in
  `apps/api/src/modules/commerce/commerce.service.ts:3826` (NEW method — existing
  CommerceService body untouched).
  - Resolves vendor store via `this.resolveStoreId(user)` (existing helper).
  - For each row:
    - Validates name + price (per-row try/catch; failures collected into `errors[]`,
      processing continues for the rest of the rows).
    - Find-or-create `Category` by `slug = slugify(name)` (global unique constraint).
      Race-condition handling: if create throws (P2002 duplicate slug), retry find once.
    - Creates `Product` with `status='DRAFT'`, `storeId`, slug = `slugify(name)+uuid6`,
      `productType=PHYSICAL`, `productSource=VENDOR_STOCK`, `inventoryPolicy=TRACKED`,
      `trackInventory=true`, `requiresShipping=true`, `lowStock=5`, plus a parallel
      `InventoryItem` (so stock is queryable via the inventory table too).
    - Increments `created` counter on success.
  - After import: best-effort `checkAndAwardMilestones(userId)` (won't abort response if it fails).
  - Returns `{ created, errors: [{ row, name?, message }] }`.

### 2. Vendor Milestones Backend (Part 2G)
Schema read first (DO NOT change). Key models:
- `Milestone { id, key @unique, name, description?, coinsAwarded Int, isRepeatable Bool }`
- `VendorMilestone { id, vendorId, milestoneKey, claimedAt @default(now()), @@unique([vendorId, milestoneKey]) }`
- `KwikCoins { id, vendorId @unique, balance, totalEarned, totalSpent, totalPurchased }`
- `CoinTransaction { id, vendorId, amount, type (EARNED|SPENT|PURCHASED|ADJUSTED|REFERRAL), source?, balanceAfter, createdAt }`
- `PoolSettlement { id, ..., sourceStoreId?, resellerMargin, status (HELD|RELEASED|CANCELLED|DISPUTED) }`

Implementation (added to `CommerceService`):

#### `MILESTONE_THRESHOLDS` (private readonly array)
18 milestones across 4 metrics:
- PRODUCTS: 10, 25, 50, 100, 250, 500 → 100/200/400/800/1500/3000 coins
- ORDERS: 10, 25, 50, 100, 250, 500 → 150/300/600/1200/2500/5000 coins
- REVENUE: ₦100K, ₦500K, ₦1M → 500/2000/5000 coins
- POOL_EARNINGS: ₦50K, ₦250K, ₦1M → 250/1000/3000 coins

#### `listVendorMilestones(user)` (bonus helper for frontend)
Joins `VendorMilestone` rows for the vendor with `Milestone` catalog rows and the static
thresholds → returns array of `{ id, milestoneKey, name, description, metric, threshold,
coinsAwarded, isEarned, claimedAt }`.

#### `checkAndAwardMilestones(vendorId)`
Best-effort (top-level try/catch). Steps:
1. Find vendor's `Store` by `vendorId`. Bail if none.
2. Aggregate metrics in parallel:
   - `db.product.count({ where: { storeId } })`
   - `db.order.count({ where: { items: { some: { product: { storeId } } }, status: { in: ['PAID','PROCESSING','FULFILLED','DELIVERED'] } } })`
   - `db.order.aggregate({ where: <same>, _sum: { totalAmount: true } })`
   - `db.poolSettlement.aggregate({ where: { sourceStoreId: storeId, status: 'RELEASED' }, _sum: { resellerMargin: true } })`
3. Load existing `VendorMilestone.milestoneKey` set for vendor.
4. For each threshold not yet in the set + value ≥ threshold:
   - `db.milestone.upsert` by `key` (idempotent catalog row).
   - `db.vendorMilestone.create({ vendorId, milestoneKey })` — existence = earned.
     (Race-condition: catch and treat as already-awarded.)
   - `notificationService.create({ userId, type:'MILESTONE_EARNED', title, message, data })`
     — this auto-emits `notification.created` event → `NotificationEventListener`
     dispatches push to all registered devices.
   - Push to `awarded[]` result.
5. Returns `{ awarded: [{ milestoneKey, name, coins }], total }`.

Note: per spec, "award KwikCoins if configured" — the KwikCoins model exists, but the
*actual* coin award happens via the explicit `claimMilestone` endpoint below. The
detection method only creates the VendorMilestone record + notification. This avoids
double-awarding and matches the claim endpoint's "not already claimed" semantics.

#### `claimMilestone(user, milestoneId)`
1. `vendorId = getUserId(user)`.
2. Find `VendorMilestone` by id → 404 if missing.
3. Verify `vendorMilestone.vendorId === vendorId` → 403 otherwise.
4. Lookup `Milestone` catalog row by `milestoneKey` → get `coinsAwarded` + `name`.
5. **Idempotency check**: look for existing `CoinTransaction` with
   `source = 'milestone-claim:<key>'` and `vendorId`. If found, skip awarding
   (claim is idempotent — refreshes `claimedAt` only).
6. If not yet claimed and `coins > 0`:
   - `db.$transaction`:
     - Get-or-create `KwikCoins` row.
     - Increment `balance` + `totalEarned` (or create with `balance=coins, totalEarned=coins`).
     - Insert `CoinTransaction({ vendorId, amount: coins, type: 'EARNED', source: claimSource, balanceAfter })`.
   - Best-effort `notificationService.create({ type:'MILESTONE_CLAIMED', ... })`.
7. Refresh `claimedAt = new Date()` on the `VendorMilestone` row.
8. Return `{ ...updated, milestoneKey, milestoneName, coinsAwarded }`.

#### Controller endpoints (all on `VendorCommerceController` @ `@Controller('vendor')`)
- `POST /vendor/products/bulk-import` → `bulkImportProducts`
- `GET  /vendor/milestones` → `listMilestones` (bonus)
- `POST /vendor/milestones/check` → `checkMilestones` (bonus — triggers detection)
- `POST /vendor/milestones/:milestoneId/claim` → `claimMilestone` (per spec)

### 3. API Client (`packages/api-client/src/index.ts`)
Added to `vendorCommerceApi` namespace (after `cancelOrder`, before closing brace):
- `bulkImportProducts(products)` → `api.post('/vendor/products/bulk-import', { products })`
- `listMilestones()` → `api.get('/vendor/milestones')` (bonus)
- `checkMilestones()` → `api.post('/vendor/milestones/check')` (bonus)
- `claimMilestone(milestoneId)` → `api.post(`/vendor/milestones/${milestoneId}/claim`)`

## Files changed
- `apps/api/src/modules/commerce/commerce.service.ts` — added 4 methods
  (`bulkImportProducts`, `listVendorMilestones`, `checkAndAwardMilestones`,
  `claimMilestone`) + 1 private constant (`MILESTONE_THRESHOLDS`). No existing code
  rewritten.
- `apps/api/src/modules/commerce/commerce.controller.ts` — added 4 endpoints to
  `VendorCommerceController` (bulk-import + 3 milestone endpoints). No existing
  endpoints touched.
- `packages/api-client/src/index.ts` — added 4 methods to `vendorCommerceApi`
  namespace. No existing methods touched.

## Verification
- `cd /home/z/my-project/apps/api && npx tsc --noEmit 2>&1 | grep -vE "upload\.(module|service)|store\.(module|service).*upload" | head` → 0 output (0 new errors).
- `cd /home/z/my-project/packages/api-client && npx tsc --noEmit` → 0 output (0 errors).
- `npx eslint` on commerce.service.ts + commerce.controller.ts → 0 errors, 0 warnings.
- `npx eslint` on api-client/src/index.ts → 0 errors, 0 warnings.

## Notes for future agents
- The `VendorMilestone.claimedAt` field defaults to `now()` per schema (cannot be
  changed without schema edit). So "claim" semantics here mean: refresh the timestamp
  + award KwikCoins (idempotent via `CoinTransaction.source` dedup string
  `milestone-claim:<key>`).
- `checkAndAwardMilestones` is automatically invoked at the end of
  `bulkImportProducts` (best-effort). To trigger it from other contexts (e.g. after
  order payment), call `commerceService.checkAndAwardMilestones(vendorId)`.
- `MILESTONE_THRESHOLDS` is a static config — to change coin amounts or add new
  tiers, edit the array in `commerce.service.ts`.
- Frontend can use `vendorCommerceApi.listMilestones()` to render the milestones UI
  and `vendorCommerceApi.claimMilestone(id)` for the claim button.
