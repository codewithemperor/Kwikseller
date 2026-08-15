# NAV-4 — Product collection pages

**Agent:** Full-stack developer (Product collection pages)
**Task ID:** NAV-4
**Date:** 2025

## Task

Create three curated product-collection routes for the Kwikseller marketplace (Next.js 16 app at `apps/marketplace/`):

- `/products/trending`
- `/products/new-arrivals`
- `/products/top-rated`

All three share a single reusable `ProductCollectionPage` component (breadcrumb + header + client-side sort dropdown + responsive product grid + quick-view modal + loading / empty / error states). Each route is a thin wrapper that calls the matching React Query hook (`useTrending` / `useNewArrivals` / `useTopProducts`) with `limit=24` and passes the result to the shared component.

## Prior work referenced

- Read `/home/z/my-project/worklog.md` (NAV-1 + NAV-2 sections) for the marketplace architecture overview: dummy-mode API gateway, `useTrending` / `useTopProducts` / `useNewArrivals` hooks already exist in `apps/marketplace/src/lib/api-hooks.ts`, dummy handler exposes `GET /products/trending|top|new?limit=` as flat arrays.
- Read `apps/marketplace/src/app/categories/[id]/page.tsx` (~1007 lines) in full to extract the codebase's exact patterns for sort dropdown, sticky toolbar, breadcrumb, loading skeleton grid, empty state, and quick-view modal usage.
- Read `apps/marketplace/src/app/products/page.tsx` (the full browse experience) to confirm design language and the per-card motion stagger pattern.

## Files created

1. **`apps/marketplace/src/components/product/product-collection-page.tsx`** (~310 lines)
   - `"use client"` shared component.
   - Exports `ProductCollectionPage` and `ProductCollectionPageProps`.
   - Props: `title`, `description`, `icon: LucideIcon`, `queryResult: { data?, isLoading, isError }`, `breadcrumbLabel`.
   - Renders: breadcrumb (`Home > Products > {breadcrumbLabel}`), header (icon tile + title + description + live count), sticky toolbar (result count + sort dropdown), product grid (`grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5`), dynamic `QuickViewModal`, `ProductGridSkeleton` loading, bordered error state with CTA, `EmptyState` with "No products found yet" + CTA.
   - Client-side sort: `relevance` (default) / `price-asc` / `price-desc` / `rating` / `best-selling`.
   - `best-selling` uses defensive `readTotalSales()` helper (casts through `unknown`, returns 0 when absent) and falls back to `rating` per the task spec.
   - Sort dropdown styled to match `/categories/[id]` (button + `AnimatePresence` `motion.div` menu, `bg-kwik-orange-tint`/`text-kwik-orange` active row, click-away overlay).
   - Per-card `motion.div` stagger (`delay: Math.min(idx * 0.03, 0.3)`) — matches `/products` browse page.
   - Tailwind tokens only — no hardcoded hex, no gradients on page surfaces.

2. **`apps/marketplace/src/app/products/trending/page.tsx`**
   - `"use client"`, ~30 lines.
   - Calls `useTrending(24)`, passes `TrendingUp` icon, title "Trending Products", description "Hot products right now, ranked by sales", breadcrumb "Trending".

3. **`apps/marketplace/src/app/products/new-arrivals/page.tsx`**
   - `"use client"`, ~30 lines.
   - Calls `useNewArrivals(24)`, passes `Sparkles` icon, title "New Arrivals", description "The latest products added to the marketplace", breadcrumb "New Arrivals".

4. **`apps/marketplace/src/app/products/top-rated/page.tsx`**
   - `"use client"`, ~30 lines.
   - Calls `useTopProducts(24)`, passes `Star` icon, title "Top Rated Products", description "Highest-rated products from our vendors", breadcrumb "Top Rated".

## Files modified

None. The new routes are additive — they don't conflict with the existing `/products` browse page or `/products/[id]` detail page (Next.js App Router treats static segments like `products/trending` as taking precedence over the dynamic `products/[id]` segment).

## Key decisions

- **Shared component over triplication.** All three pages render through one `ProductCollectionPage`. Future collection routes can reuse it by passing a different hook + icon + copy.
- **Client-side sort over re-fetching.** The endpoints already apply canonical ordering server-side; the sort dropdown just re-orders the already-fetched batch. Keeps UX instant, avoids round-trips. `relevance` preserves the API's default order.
- **Single batch of 24, no pagination.** Endpoints return a flat array capped by `limit` (no pagination meta), so we fetch 24 up-front and show all of them. The grid handles 24 cards gracefully across breakpoints. If "Load more" is wanted later, swap to `useInfiniteQuery` — the shared component wouldn't need to change.
- **Defensive `totalSales` read.** `MarketplaceProduct` doesn't declare `totalSales`, but the underlying API Product model has it. `readTotalSales()` casts through `unknown` and returns 0 when absent, so "Best Selling" uses real sales data if the API surfaces it and falls back to `rating` otherwise (per the task spec).
- **No gradients on page surfaces.** Header, toolbar, and grid use only flat Tailwind tokens. The reused `EmptyState` component has an internal `bg-gradient-to-br` on its decorative icon tile — that's an opaque internal detail of a shared component I was instructed to reuse, not a gradient I introduced.
- **Dark-mode compliant.** Every color uses a token that has both light and dark values defined in `globals.css` (`:root` lines 128-141, `.dark` lines 243-256).

## Verification

- `bunx eslint <4 files> --max-warnings=0` → exit code 0, no warnings, no errors.
- `bun run check-types` (`tsc --noEmit` over the whole project) → zero type errors in any of the 4 new files. (Pre-existing errors in unrelated files like `brand-info-card.tsx`, `enhanced-search-overlay.tsx`, `home-feed-page.tsx`, `mega-menu.tsx`, `order-progress-bar.tsx`, etc. are out of scope for NAV-4 and were not touched.)
- `tail /home/z/my-project/dev.log` → `Next.js 16.2.1 (Turbopack) ✓ Ready in 348ms`, no compile errors.

## Self-caught bug fix

Initially wrote the toolbar's error string as `"Couldn&apos;t load products."` inside a JS string literal — `&apos;` would have rendered literally as text instead of as an apostrophe. Replaced with `"Couldn\u2019t load products."` (proper Unicode right single quote) so the rendered text is correct.
