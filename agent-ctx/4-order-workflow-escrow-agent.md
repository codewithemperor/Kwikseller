# Task 4 — Order Workflow & Escrow Agent

Agent: Order Workflow & Escrow Agent
Task ID: 4
Scope: 1688-style order workflow + KwisCrow escrow + returns/disputes + clean payment callback (marketplace app only)

## Files Created (12)

### constants/types/lib/store
1. `apps/marketplace/src/constants/order-workflow.ts` (440L) — single source of truth:
   - `OrderStatus` const enum (13 statuses: PENDING_QUOTE → … → RETURNED), `EscrowStatus` (HELD|RELEASED|REFUNDED), `DisputeStatus` (OPEN|UNDER_REVIEW|RESOLVED), `DisputeType` (RETURN_REQUEST|ISSUE_REPORT).
   - Ordered lists: `FULFILMENT_STEPS`, `PRE_PAYMENT_STEPS`, `ACTIVE_ORDER_STATUSES`, `COMPLETED_ORDER_STATUSES`, `CANCELLED_ORDER_STATUSES`.
   - Display metadata maps: `ORDER_STATUS_META`, `ESCROW_STATUS_META`, `DISPUTE_TYPE_META` (label/hint/tone).
   - `KwisCrow` config: `DISPUTE_WINDOW_HOURS = 24`, `DISPUTE_WINDOW_MS`, `PLATFORM_FEE_BPS`, brand NAME/TAGLINE.
   - Reason presets: `RETURN_REASON_PRESETS` (8), `ISSUE_REASON_PRESETS` (8).
   - Notification templates (12 keys) with `{{orderRef}}/{{vendorName}}/{{amount}}` interpolation.
   - Payment provider config: `PAYMENT_PROVIDERS` (PAYSTACK/FLUTTERWAVE/WALLET) + `DEFAULT_PAYMENT_PROVIDER`.
   - `MOCK_VENDOR`, `CURRENCY_CODE`/`CURRENCY_LOCALE`, `DISPUTE_DESCRIPTION_MAX_LENGTH`.

2. `apps/marketplace/src/types/order-workflow.ts` (185L) — types derived from the runtime constants (one source of truth): `OrderStatus`, `EscrowStatus`, `DisputeStatus`, `DisputeType`, plus `Quotation`, `EscrowRecord`, `Dispute`, `FulfilmentStep`, `OrderTimelineEvent`, `OrderLineItem`, `OrderWorkflowState`, `OrderCostBreakdown`.

3. `apps/marketplace/src/lib/escrow.ts` (328L) — KwisCrow escrow service:
   - In-memory `Map<orderId, EscrowRecordInternal>` (mock; designed to delegate to `escrowApi` in `@kwikseller/api-client` — confirmed `escrowApi` exists in `packages/api-client/src/index.ts` at line 1073: `getHoldings`, `manualRelease`, `refund`, `getEscrowDetail`, `openDispute`).
   - Pure functions: `holdInEscrow`, `releaseToVendor`, `refundToBuyer`, `enterDisputeWindow`, `autoReleaseIfWindowExpired`, `getEscrowStatus`, `getEscrowRecord`, `isWithinDisputeWindow`, `formatDisputeCountdown`.
   - Hydration helpers: `hydrateEscrowStore`, `snapshotEscrowStore`, `resetEscrowStore`, `registerEscrowChangeListener` (lets the Zustand store mirror mutations without this module importing zustand).
   - All mutations idempotent + state-guarded (e.g. can't release a refunded record).
   - JSDoc ASCII diagram of the full lifecycle.

4. `apps/marketplace/src/stores/order-workflow-store.ts` (1113L) — Zustand persisted store (`kwikseller-order-workflow-store` v2 with migrate-on-version-bump reseed):
   - State: `orders: OrderWorkflowState[]`, `notifications: WorkflowNotification[]`, `hydrated: boolean`.
   - Selectors: `getOrder`, `getCostBreakdown`; exported helper `computeCostBreakdown(items, quotation)` + hook `useOrder(orderId)`.
   - Actions: `placeOrder`, `submitQuotation`, `markToPay`, `payOrder` (calls `holdInEscrow`), `advanceFulfilment` (PAID→PROCESSING→SHIPPED→OUT_FOR_DELIVERY→DELIVERED, and enters dispute window on DELIVERED), `confirmReceipt` (calls `releaseToVendor`), `cancelOrder`, `openDispute`, `resolveDispute` (BUYER→refundToBuyer+RETURNED, VENDOR→releaseToVendor+COMPLETED), `autoReleaseEscrow` (sweep), `markNotificationRead`, `clearNotifications`, `_init` (hydrate+register listener+sweep), `resetToSeed`.
   - 3 seed orders at distinct stages:
     - `order-aurora-001` — TO_PAY (vendor quoted, awaiting payment) — exercises QuotationCard + Pay CTA.
     - `order-aurora-002` — DELIVERED with escrow HELD, dispute window open (`autoReleaseAt = now + 16h`) — exercises DisputeTimer countdown + Confirm receipt / Request return / Report issue actions.
     - `order-aurora-003` — RECEIVED with escrow RELEASED — exercises settled escrow badge.

### Components (6)
5. `components/order/order-status-timeline.tsx` (230L) — vertical timeline of PRE_PAYMENT_STEPS + FULFILMENT_STEPS; brand `bg-primary-500` dots + check icons for reached steps, `bg-gray-200` clock icons for pending; "Current" pill on the active step; ETA strip from `quotation.deliveryDateMin/Max`. framer-motion staggered reveal. Handles DISPUTED/CANCELLED/RETURNED edge cases.

6. `components/order/quotation-card.tsx` (206L) — `kwik-gradient` header strip with vendor name + ETA pill; items list; cost breakdown card (`bg-gray-50`): subtotal + delivery fee (Truck icon, primary) − discount (Tag icon, secondary, success tone) = total; vendor note in `bg-primary-50`; orange CTA "Pay ₦X now" (`bg-secondary-500 hover:bg-secondary-600`) with spinner state; "Decline & cancel" ghost button. KwisCrow protection footer line.

7. `components/order/escrow-badge.tsx` (272L) — two modes (compact pill / full card). Pill: shield icon + status label + Info icon, opens KwisCrow explainer dialog. Full card: shield avatar, amount held, held-since, released/refunded timestamps. Dialog: `kwik-gradient` header + lifecycle bullets (confirm receipt / 24h auto-release / dispute freezes) + "Got it" CTA. Tones: HELD=primary, RELEASED=success, REFUNDED=gray.

8. `components/order/dispute-timer.tsx` (197L) — re-renders every second via `useReducer`+`setInterval`. States: dispute OPEN → red "frozen" card; escrow RELEASED → success card; REFUNDED → gray card; HELD + window expired → warning "Dispute window expired"; HELD + window open → primary "Dispute window open — Auto-releases to vendor in HH:MM:SS" (live `formatDisputeCountdown`).

9. `components/order/order-actions.tsx` (263L) — context-aware button bar per status: PENDING_QUOTE=[Cancel], QUOTED/TO_PAY=[Pay now, Cancel], PAID…OUT_FOR_DELIVERY=[Track, View escrow], DELIVERED=[Confirm receipt, Request return, Report issue, View escrow], RECEIVED/COMPLETED=[Request return, View escrow], DISPUTED=[View dispute], CANCELLED/RETURNED=[]. Variants: primary=`bg-secondary-500`, secondary=border, ghost=`text-primary-700`, danger=`bg-danger/5 text-danger`. Exports `disputeTypeFromKey` helper.

10. `components/order/return-dispute-dialog.tsx` (345L) — full modal: `kwik-gradient` header with order ref; type selector (Return request / Issue report) as 2-col cards; reason presets as chip buttons (pulls RETURN_REASON_PRESETS or ISSUE_REASON_PRESETS from constants) + free-form input; description textarea with `DISPUTE_DESCRIPTION_MAX_LENGTH` counter; warning callout that submitting freezes the escrow; "Submit return/report" CTA (`bg-danger`); trust footer.

### Routes (2 edited + 1 new)
11. `app/orders/[id]/page.tsx` (662L) — wraps in `ErrorBoundary`; uses `useOrderWorkflowStore` mock as primary source, falls back to live `ordersApi.get()` only when authenticated and no mock match; falls back to `OrderNotFound` on API failure. Hydration guard (renders `Skeleton` until mounted) to avoid SSR/persisted-store mismatch. `MockOrderWorkflow` renders: back link, `kwik-gradient` header with status label + escrow pill + hint strip, `DisputeTimer`, `QuotationCard` (QUOTED/TO_PAY only), two-column grid (`OrderStatusTimeline` + items list ‖ `EscrowBadge` full card + payment/vendor/delivery mini-cards), `OrderActions`, delivery address, `ReturnDisputeDialog`. `LiveOrderDetail` (kept from original) for real API orders.

12. `app/checkout/verify/page.tsx` (571L) — clean payment callback. Reads `reference`/`trxref`/`ref` + `status` + optional `orderId`/`provider` from search params. States: loading→pending→success→failed. Fast-paths `?status=success|pending|failed` for sandbox (no Paystack roundtrip needed); otherwise calls `checkoutApi.verifyPayment(reference)` and maps `PAID|SUCCESS`→success, `PENDING`→pending, else→failed. On success, calls store `markToPay` (if QUOTED) + `payOrder` (wires escrow hold). UI: `kwik-gradient` brand strip + KwisCrow tagline; hero banner with state-specific icon (spinner/CheckCircle2/Clock/XCircle) + headline + message; reference + provider strip; state-specific body (LoadingBody/PendingBody/SuccessBody with order summary + Track-this-order CTA / FailedBody with retry). All semantically colored (primary/success/warning/danger), no hex.

13. `app/checkout/verify/loading.tsx` (51L) — Next.js loading skeleton mirroring the verify page layout (gradient brand strip + hero skeleton + reference/provider skeleton + body skeleton) so the swap is invisible.

## Status flow implemented
```
PENDING_QUOTE → QUOTED → TO_PAY → PAID → PROCESSING → SHIPPED → OUT_FOR_DELIVERY → DELIVERED → RECEIVED → COMPLETED
                                  ↘ DISPUTED → RETURNED (buyer refund) or COMPLETED (vendor favor)
Any pre-PAID → CANCELLED
```

## Escrow (KwisCrow) lifecycle
```
PAID      → holdInEscrow()              → HELD
DELIVERED → enterDisputeWindow()        → autoReleaseAt = now + 24h (still HELD)
RECEIVED  → releaseToVendor()           → RELEASED   (buyer confirmed)
24h pass  → autoReleaseIfWindowExpired()→ RELEASED   (auto, no dispute)
DISPUTED  → escrow frozen
  resolve BUYER  → refundToBuyer()      → REFUNDED
  resolve VENDOR → releaseToVendor()    → RELEASED
```

## Color tokens used (NO hex / raw oklch anywhere)
- Primary blue: `bg-primary-500`, `text-primary-600/700/800/900`, `bg-primary-50/100`, `border-primary-100/200`, `ring-primary-500`, `focus-visible:ring-primary-500`.
- Secondary orange (CTA): `bg-secondary-500`, `hover:bg-secondary-600`, `text-secondary-600`, `text-white`.
- Gray (blue-gray): `bg-gray-50/100/950`, `text-gray-400/500/600`, `border-gray-100/200/300`, `divide-gray-100`, `ring-gray-200`, dark-mode gradients `from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900`.
- Semantic: `bg-surface`, `text-foreground`, `border-border`, `bg-success/5/10`, `text-success`, `border-success/30`, `bg-warning/5/10`, `text-warning`, `border-warning/30`, `bg-danger/5/10`, `text-danger`, `border-danger/30`.
- Brand: `kwik-gradient` (header strips, avatar fallbacks, brand pills), no manual gradient definitions.

## Verification
1. `curl http://localhost:3000/` → **200**
2. `curl http://localhost:3000/orders/order-aurora-002` → **200** (DELIVERED seed order)
3. `curl "http://localhost:3000/checkout/verify?reference=test123&status=success"` → **200**
4. `tail -20 dev.log` → only `200` responses, no errors:
   ```
   GET / 200 in 98ms
   GET /orders/order-aurora-002 200 in 288ms
   GET /checkout/verify?reference=test123&status=success 200 in 281ms
   GET /orders/order-aurora-001 200 in 764ms
   ```
5. `bun run lint` → 0 errors in any task file (14 pre-existing errors are in `marketplace-layout.tsx` + `vendor-storefront.tsx`, both outside this task's scope — all `react-hooks/set-state-in-effect` and `@next/next/no-img-element` warnings).
6. agent-browser snapshot of `/orders/order-aurora-002` (DELIVERED): renders "Delivered" H1, "KwisCrow: HELD" pill, dispute-timer status, "ORDER TIMELINE" region, "Items in this order", "KwisCrow escrow status" region with "How it works" button, "Order actions" region with **Confirm receipt / Request return / Report issue / View escrow** buttons, delivery address.
7. agent-browser snapshot of `/orders/order-aurora-001` (TO_PAY): renders "To pay" H1, "Vendor quotation" region with "Aurora General Trading" + ETA "29 Jul 2026 – 1 Aug 2026" + ITEMS list + DescriptionList (cost breakdown) + vendor note + **"Pay ₦34,000 now"** CTA + "Decline & cancel"; "Order actions" with Pay now / Cancel order.
8. agent-browser snapshot of `/checkout/verify?reference=test123&status=success`: renders KWISCROW brand strip + "BUYER PROTECTION ESCROW" tagline + **"Payment confirmed"** H1 + body paragraphs + **"View orders"** + "Continue shopping" CTAs.

## Notes
- `escrowApi` already exists in `packages/api-client/src/index.ts` (line 1073) — the in-memory `lib/escrow.ts` mirrors its surface so the swap is a 1:1 function-body replacement later.
- All workflow constants live in `constants/order-workflow.ts` — zero magic strings in any component (every status/tone/label comes from the metadata maps).
- Store is persisted to `localStorage` under `kwikseller-order-workflow-store` (v2); `migrate()` reseeds from `seedOrders()` when the version bumps so demo data stays fresh.
- Hydration guard on `/orders/[id]` prevents SSR/persisted-state mismatch warnings (seed timestamps use `Date.now()`).
- `/checkout/verify` soft-fails to "pending" when the live `checkoutApi.verifyPayment` call errors (sandbox has no backend) — never blocks the user.
