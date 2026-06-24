# Task: phase-6 — Marketplace Buyer Order Experience

Agent: full-stack-developer
Scope: Build the marketplace buyer order journey — order list, order detail, dispute modal, real delivery tracker, + "My Orders" header link.

## Files Changed (5)

### Created (3)
1. `apps/marketplace/src/app/orders/page.tsx` (313 lines) — NEW buyer order list page
2. `apps/marketplace/src/app/orders/[id]/page.tsx` (829 lines) — NEW buyer order detail page
3. `apps/marketplace/src/components/checkout/dispute-modal.tsx` (179 lines) — NEW dispute modal

### Rewritten (1)
4. `apps/marketplace/src/components/landing/delivery-tracker.tsx` (482 → 376 lines) — replaced marketing mock with real delivery tracker

### Edited (1)
5. `apps/marketplace/src/components/layout/marketplace-layout.tsx` — added "My Orders" link to desktop header + mobile drawer

## Key Decisions

### Component selection
- Used the shared `@kwikseller/ui` primitives exclusively for the order UI: `OrderCard`, `OrderTimeline`, `OrderSummary`, `OrderStatusBadge`, `EmptyState`, `Skeleton`/`SkeletonCard`, `AppButton`, `AppModal`, `AppImage`, `FieldInput`/`FieldTextarea`. No custom order primitives were built — the shared ones covered every need.
- Used `@tanstack/react-query` (`useQuery` + `useMutation`) for all data fetching/mutations. The marketplace already has `QueryProvider` wired in `app/layout.tsx`, so no provider setup was needed.
- Used `framer-motion` for page-transition wrappers on both pages and the delivery-tracker entrance.

### AppButton vs HeroUI Button — critical distinction
- `AppButton` (from `@kwikseller/ui`) is a **plain `<button>` wrapper** — it uses `onClick`/`disabled`/`type`, NOT `onPress`.
- HeroUI `Button` (from `@heroui/react`, used in `marketplace-layout.tsx` header) uses `onPress`.
- The first `tsc` run flagged 7 errors from passing `onPress` to `AppButton`. Fixed by switching all 7 to `onClick`. The header buttons in `marketplace-layout.tsx` correctly kept `onPress` because they use HeroUI's `Button`.

### API response unwrapping
- The NestJS `ResponseInterceptor` wraps every response as `{ success, data, meta?, timestamp }`. The api-client's `api.get()` returns `res.data` (the axios body), so `ordersApi.list()` resolves to `{ success, data: Order[] }`.
- Wrote a defensive `unwrapOrders()` helper that handles 1- and 2-level nesting (matching the pattern in `vendor/[slug]/orders/page.tsx`), since some backend paths return `{ data: { orders: [...] } }` and others `{ data: [...] }`.

### Delivery tracker rewrite
- The old 482-line component was a pure marketing mock — hardcoded `timelineSteps`, fake rider "Emeka O.", decorative grid pattern, no real data. It was only defined, never imported anywhere (verified via grep).
- The new component is driven entirely by the `Delivery` + `Order` records. It builds 6 `OrderTimeline` steps from `delivery.status` + timestamps (`assignedAt`, `pickedUpAt`, `deliveredAt`) + the order's lifecycle stage.
- Uses the shared `Spinner` (not `KwiksellerLoader`) for the "waiting for vendor" state, per the task requirement.

### Dispute modal form submission
- The submit button lives in the modal's `footer` slot (outside the `<form>` element in the body). Used the HTML5 `form="dispute-form"` attribute on the submit `<button>` to associate it with the form by id — this triggers the form's `onSubmit` handler when clicked, even though the button is in a different DOM subtree. `AppButton` spreads `...props` to the underlying `<button>`, so `form` and `type="submit"` pass through correctly.

### Auth gating
- Both pages check `useAuth()` and redirect to `/login?redirect=/orders` (or `/orders/:id`) if not authenticated. The redirect runs in a `useEffect` after the auth check completes, and a skeleton is shown in the meantime to avoid a flash of unauthenticated content.

## Verification
- `npx tsc --noEmit -p apps/marketplace/tsconfig.json 2>&1 | grep -E "orders/page|orders/\[id\]|dispute-modal|delivery-tracker|marketplace-layout"` → **0 errors** in all 5 target files.
- Full `npx tsc --noEmit -p apps/marketplace/tsconfig.json` → **0 errors** (no regressions).
- `grep -rn "KwiksellerLoader" apps/marketplace/src/app/orders apps/marketplace/src/components/checkout/dispute-modal.tsx apps/marketplace/src/components/landing/delivery-tracker.tsx` → **empty** (0 matches — used Skeletons + Spinner instead).

## Stage Summary
- Buyer can now: view all their orders (filtered by status), open an order detail page, see a real-time delivery timeline, track rider progress, confirm delivery (triggers escrow release), open a dispute (freezes escrow), and access "My Orders" from the header user menu on both desktop and mobile.
- All 5 phase-6 deliverables complete with 0 TypeScript errors and 0 KwiksellerLoader references.
