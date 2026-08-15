# Task ID: NAV-3 — DealCard + Deals pages

**Agent:** Full-stack developer (DealCard + Deals pages)
**Date:** 2025-07-09 (session)

## Task

Create a reusable **DealCard** component and two new marketplace pages: `/deals` (listing) and `/deals/[id]` (detail), in the Next.js 16 marketplace app at `apps/marketplace/`. Must use the existing `useDeals`/`useDeal` hooks, the `MarketplaceProductCard`, the `toMarketplaceProduct` mapper, and the kwik-* Tailwind tokens. No gradients, dark-mode compliant, fully responsive.

## Files created

1. `apps/marketplace/src/components/landing/shared/deal-card.tsx`
   - `DealCard({ deal })` — image-only, `aspect-[4/5]` portrait, wrapped in `<Link href={/deals/${id}}>`.
   - `DealCardSkeleton` — 4:5 gray box with `animate-pulse`.
   - `dealTypeLabel(dealType)` — maps both dummy (`FLASH`/`FEATURED`/`DEAL_OF_THE_DAY`) and real-backend (`FLASH_DEAL`/`FEATURED_DEAL`/`DEAL_OF_THE_DAY`/`COUPON`) spellings to friendly labels.
   - Image resolver: prefers `deal.imageUrl`, else `deal.products?.[0]?.product.images?.[0]?.url`, else defensive flat-`image` field; uses `AppImage` with `fallbackVariant="product"`.

2. `apps/marketplace/src/app/deals/page.tsx`
   - `"use client"` page wrapped in `<Suspense>` (uses `useSearchParams`).
   - Breadcrumb `Home > Deals`, title "Deals", subtitle "Discover promotional campaigns and special offers".
   - Sticky filter-chip bar: All Deals | Flash Deals | Deals of the Day | Featured | Group Buy (link → `/group-buy`).
   - URL `?dealType=flash` is the single source of truth — `activeFilter` derived from `useSearchParams()` (no local state mirror).
   - Grid: 2 cols mobile → 3 sm → 4 lg → 5 xl. Loading skeletons, empty state with "Browse products" CTA → `/products`, error state.

3. `apps/marketplace/src/app/deals/[id]/page.tsx`
   - `"use client"` page using `useParams()` + `useDeal(id)`.
   - Breadcrumb: `Home > Deals > [title]`.
   - Hero section (image left / details right on `md+`, stacked on mobile): 4:3 hero image, type badge, discount badge, status badge (Active/Scheduled/Ended computed from dates), description, discount info pill, date range, CTAs.
   - "Products in this deal" grid: maps each `deal.products[]` row via `toMarketplaceProduct`, then overrides `price = dealPrice` / `comparePrice = original` so `MarketplaceProductCard` shows the deal price + strikethrough.
   - Quick-view modal: dynamic import (ssr:false), same pattern as `/categories/[id]`.
   - Loading skeleton, not-found state ("Deal not found" → `/deals`), error state.

## Key decisions

- **URL = source of truth for the listing filter.** First eslint pass flagged `react-hooks/set-state-in-effect` from a `useEffect` that mirrored `?dealType` into local state. Fixed by removing the local state entirely and deriving `activeFilter` from `useSearchParams()`. Clicking a chip calls `router.replace` to update the URL; the component re-renders with the new derived value. Keeps the page shareable/bookmarkable AND lint-clean.
- **dealTypeLabel covers both spellings.** The dummy handler returns `FLASH`/`FEATURED`/`DEAL_OF_THE_DAY`; the real NestJS backend returns `FLASH_DEAL`/`FEATURED_DEAL`/`DEAL_OF_THE_DAY`/`COUPON`. The label map + filter-chip matchers accept both so the UI reads identically in dummy mode and against the real API.
- **`toDealMarketplaceProduct()` overrides price/comparePrice.** The existing `MarketplaceProductCard` computes its own `-X%` badge from `price` vs `comparePrice`. By overriding `price = dealPrice` and `comparePrice = original (comparePrice ?? price)`, the card automatically shows the correct deal savings without any card-level changes.
- **"Group Buy" links out.** `PoolCampaign` is a separate entity from `Deal` (per NAV-2 research), so the Group Buy chip navigates to `/group-buy` instead of filtering.
- **No gradients.** The existing `EmptyState` component uses gradients internally, so the deals pages use a hand-rolled inline empty/error state (matching the pattern in `/categories/[id]`) to stay gradient-free.

## Verification

- `bunx eslint src/components/landing/shared/deal-card.tsx src/app/deals/page.tsx src/app/deals/[id]/page.tsx --max-warnings=0` → clean (0 errors, 0 warnings).
- `bunx tsc --noEmit` → 0 errors in the three new files (pre-existing errors in other files are unchanged and out of scope).
- Dev server was not running during this task, so the pages were not runtime-smoke-tested; the code follows the same patterns as the existing `/categories` and `/products` pages which are known to compile.

## What other agents can reuse

- `DealCard` and `DealCardSkeleton` from `@/components/landing/shared/deal-card` — drop into any grid that needs a deal poster.
- `dealTypeLabel(dealType)` from the same file — single source of truth for deal-type display strings.
- The URL-derived filter pattern in `/deals/page.tsx` — a clean way to do shareable client-side filtering without tripping the `set-state-in-effect` rule.
