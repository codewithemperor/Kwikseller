# Task: phase-7 — Vendor Order Management Enhancements

Agent: full-stack-developer
Scope: Real-API deliveries page rewrite + surgical enhancement of the vendor order detail page with shared timeline/summary/escrow/dispute UI.

## Files Changed (4)

### Created (1)
1. `apps/vendor/src/lib/query-provider.tsx` — NEW TanStack Query provider wrapper (1-minute staleTime, 5-minute gcTime, 1 retry). Used by the deliveries page's `useQuery`/`useMutation`.

### Rewritten (1)
2. `apps/vendor/src/app/dashboard/deliveries/page.tsx` (1150 → ~470 lines) — replaced the localStorage/demo-data version with a real-API-driven page using `vendorDeliveriesApi` + react-query.

### Surgically Edited (1)
3. `apps/vendor/src/app/dashboard/orders/[id]/page.tsx` (~740 → ~890 lines) — added shared `OrderTimeline`, `OrderSummary` sidebar, escrow status card, dispute status display, "View delivery" link, and the FULFILLED rider-assignment info note.

### Edited (1)
4. `apps/vendor/src/app/layout.tsx` — wrapped children in `<QueryProvider>` (inside `<AuthProvider>`, outside `<ThemeProvider>`).

## Key Decisions

### React Query setup
- The vendor app had `@tanstack/react-query` in its dependencies but no `QueryClientProvider` wired anywhere. Created `apps/vendor/src/lib/query-provider.tsx` (simple version without devtools — `@tanstack/react-query-devtools` isn't in the vendor package.json) and added `<QueryProvider>` to the root layout.
- All existing vendor dashboard pages still use `useState + useEffect` for fetching. Upgrading them all to react-query was out of scope; only the deliveries page (the explicit rewrite target) uses it.

### API client naming
- The task brief referenced `vendorOrdersApi`, but the actual exported client from `@kwikseller/api-client` is `vendorCommerceApi` (it has `listOrders`, `getOrderDetail`, `acceptOrder`, `rejectOrder`, `prepareOrder`, `readyOrder`, `cancelOrder`). The existing `orders/[id]/page.tsx` was already using `vendorCommerceApi.updateOrderStatus` + `vendorCommerceApi.listOrders`, so for surgical edits I matched that existing pattern rather than introduce a new client name.
- `vendorDeliveriesApi` IS the correct export name (with `list`, `markPreparing`, `markReady`, `confirmPickup`, `getTracking`). Used it directly in the deliveries rewrite.

### API response shape (deliveries)
- The vendor deliveries controller (`VendorDeliveryController.listVendorDeliveries`) returns the service result directly — `{ data: Delivery[], meta: {...} }` — without the NestJS `ApiResponse` interceptor wrapping it again. The api-client's `api.get()` returns `res.data` (axios body), so `vendorDeliveriesApi.list()` resolves to `{ data: Delivery[], meta }`.
- Wrote a defensive unwrap in the `queryFn` that handles both `Array.isArray(payload)` and `payload.data` shapes, plus falls back to `unwrapApiData()` from `@/lib/vendor-format` for any double-nested edge case.

### deliveries/page.tsx — full rewrite
- Removed ALL localStorage fallbacks (no `DELIVERIES_KEY`, no `loadDeliveries`/`saveDeliveries`, no `createDemoDeliveries`, no `localStorage.getItem`).
- Status tabs: All, Pending, Preparing, Ready, In Transit, Delivered — mapped to the `DeliveryStatus` enum values (PENDING, PREPARING, READY_FOR_PICKUP, IN_TRANSIT, DELIVERED).
- Each delivery rendered as a clickable card: order ref (last 8 of `orderId`), VendorStatusBadge, pickup + delivery addresses, rider name (if assigned) + phone link, ETA, order total.
- Action button per card based on `delivery.status`:
  - `PENDING`/`ASSIGNED`/`ACCEPTED` → "Start Preparing" (`vendorDeliveriesApi.markPreparing`)
  - `PREPARING` → "Mark Ready" (`vendorDeliveriesApi.markReady`)
  - `READY_FOR_PICKUP` → "Confirm Pickup" (`vendorDeliveriesApi.confirmPickup`)
- Single `useMutation` handles all three actions (switched on `action` field); on success it invalidates the entire `['vendor-deliveries']` query key family so all tabs refresh.
- Click a card → expands inline tracking using the shared `OrderTimeline` driven by `buildDeliveryTimeline(delivery)` (7 steps: Order Placed, Accepted, Preparing, Ready for Pickup, Picked Up, In Transit, Delivered). Uses local delivery data only — no separate `getTracking` call needed for the inline view (keeps the UX snappy and avoids an extra round-trip per expansion).
- Loading: 5 skeleton cards (NOT KwiksellerLoader — verified via grep).
- Empty: `EmptyState` variant="orders" with a "View orders" CTA.
- Wrapped in Framer Motion page transition; cards also use `motion.article` with `layout` for smooth expand/collapse.

### orders/[id]/page.tsx — surgical edits only
- **Imports**: Added `OrderTimeline`, `OrderSummary`, `OrderTimelineStep`, `OrderSummaryItem` from `@kwikseller/ui`. Added `Info`, `ShieldAlert`, `ShieldCheck` from lucide-react. Added `EscrowStatus` type from `@kwikseller/types`. Removed unused `CheckCircle2`, `Loader2` imports. Removed `deliveryStages`/`allStages`/`stageLabels`/`getStageIndex` helpers (now dead code after replacing the progress stages UI with `<OrderTimeline />`). Removed unused `DisputeStatus` import after dropping the `DISPUTE_STATUS_LABEL` const.
- **OrderTimeline** (Phase 7B #1): Added `buildOrderTimelineSteps(order)` helper that derives 6 steps (Order Placed → Confirmed → Processing → Ready for Pickup → Shipped → Delivered) from `order.status` rank. Replaced the custom progress-stages UI (the dots + CheckCircle2 row) with `<OrderTimeline steps={timelineSteps} />`. Kept the "Order cancelled" red indicator for `isCancelled` orders.
- **OrderSummary sidebar** (Phase 7B #2): Added `buildOrderSummaryItems(order)` helper that maps `order.items` to `OrderSummaryItem[]` (name, quantity, unitPrice, image from product.images[isMain]). Inserted `<OrderSummary>` at the top of the right sidebar (before Delivery Tracking). The page was already 2-column (`lg:grid-cols-[1fr_380px]`), so no grid layout change was needed.
- **Escrow display** (Phase 7B #3): Kept the existing amber "HELD" banner for backwards compat, and ADDED a comprehensive escrow card that shows for all other statuses (PENDING_RELEASE/RELEASED/DISPUTED/REFUNDED/PARTIAL) with `<VendorStatusBadge status={escrow.status} />` and a status-specific caption (e.g. "Released on {date}." for RELEASED, "Funds are frozen pending dispute review." for DISPUTED).
- **View Delivery link** (Phase 7B #4): Added a `<Link href="/dashboard/deliveries">` card (Truck icon + "View delivery details" + ChevronRight) inside the Delivery Tracking section, shown only when `order.delivery` exists.
- **AppButton conversion** (Phase 7B #5): Verified the existing Accept/Reject/Prepare/Ready/Cancel buttons already use `AppButton` with the right variants (`variant="primary"` for accept/prepare/ready, `variant="secondary"` for reject/cancel). No conversion needed.
- **Rider assignment note** (Phase 7C #6): Added an info-style card (`bg-blue-500/5 border-blue-500/20 text-blue-700 dark:text-blue-300`) inside the Delivery Tracking section, shown only when `order.status === "FULFILLED"`, with the exact specified text: "🚚 Kwikseller operations will assign a dispatch rider. You'll be notified when a rider is assigned."
- **Dispute status** (Phase 7C #7): Added two dispute indicators.
  - Status meta row (top): `<ShieldAlert>` "Dispute opened" red badge when `disputeStatus === "OPENED"`, `<ShieldCheck>` "Dispute resolved" emerald badge when RESOLVED.
  - Right sidebar: red "Dispute opened by buyer" card with `order.disputeReason` + evidence note when OPENED. Emerald "Dispute resolved" card with `order.disputeResolution` when RESOLVED.

### orders/page.tsx — left alone (decision)
- The existing page is a vendor queue-management view (not a "list of order cards"): each row has an inline `FieldSelect` status updater, three metric tiles (Total/Payment/Delivery), and item-name badges, all inside a `VendorSoftPanel` titled "Order queue".
- Replacing it with `OrderCard` would lose the inline status updater and metric tiles (OrderCard's `actions` slot can hold the FieldSelect, but the metric tiles would be lost). The task explicitly says "Don't force a rewrite" — so the existing layout was left as-is.

## Verification

- `npx tsc --noEmit -p apps/vendor/tsconfig.json` → **0 errors** (entire vendor app).
- Task-specified filter `grep -E "deliveries/page|orders/\[id\]/page|orders/page"` → **0 matches** (no errors in any of the three target files).
- `grep -rn "KwiksellerLoader" apps/vendor/src/app/dashboard/deliveries/page.tsx` → **empty** (uses Skeleton cards instead).
- `grep -rn "localStorage" apps/vendor/src/app/dashboard/deliveries/page.tsx` → **empty** (all localStorage demo-data fallbacks removed).
- `grep -rn "createDemoDeliveries|DELIVERIES_KEY|demoDeliveries" apps/vendor/src/app/dashboard/deliveries/page.tsx` → **empty** (all demo data removed).
- `eslint` on the four modified/created files → 0 errors. (The single pre-existing lint error in `orders/page.tsx` line 60 — `react-hooks/set-state-in-effect` — was untouched; that file was not modified by this task.)
- Vendor app remains on port 3001 (no port changes; `package.json` `"dev": "next dev -p 3001"` unchanged).
