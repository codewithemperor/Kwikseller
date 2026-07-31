# Task ID 3 — Reusable Cards Agent

## Scope
Create a set of generic, configurable card components in `packages/ui/src/cards/`:
- `ProductCard` (3 variants: default / compact / horizontal)
- `CategoryCard` (image with gradient overlay, item count)
- `VendorCard` (cover + overlapping logo + stats + Visit Store CTA)
- `BrandCard` (centered logo + product count)
- `DealCard` (flash deal with optional live countdown timer)
- `index.ts` barrel export

Register them in `packages/ui/src/index.ts` so they're available from
`@kwikseller/ui` and reusable across marketplace / vendor / admin / rider apps.

## Prior context read
- `worklog.md` Task IDs 1–2 (monorepo setup, unified OKLCH color system:
  primary=blue, secondary=orange CTA, gray=blue-gray, no hex).
- `packages/ui/src/styles.css` — canonical `.kwik-gradient` (navy→blue→orange).
- `apps/marketplace/src/app/globals.css` — `:root` + `.dark` tokens + the
  `@theme inline` mappings that turn them into Tailwind classes
  (`bg-primary-500`, `bg-secondary-600`, `text-gray-500`, `bg-danger`, etc.).
- `packages/ui/src/vendor/vendor-metric-card.tsx` + `vendor-stat-card.tsx` —
  the framer-motion pattern (`initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}`
  `transition={{duration:0.3,ease:"easeOut"}}` `whileHover={{scale:1.02}}`).
- `packages/ui/src/lib/utils.ts` — `cn`, `formatCurrency`, `truncate`,
  `getInitials`, etc.

## Decisions
- **No HeroUI dependency in cards.** Plain HTML + framer-motion + lucide-react
  so the cards stay app-agnostic (the task explicitly forbids `AppImage`).
- **Plain `<img loading="lazy">` with `ImageIcon` placeholder fallback** for
  every card that shows an image.
- **Color tokens only** — no hex / raw oklch anywhere in the cards. CTA
  buttons = `bg-secondary-500 hover:bg-secondary-600 text-white`. Discount
  badges = `bg-danger text-danger-foreground`. "New" badge =
  `bg-primary-500 text-primary-foreground`. Star rating =
  `fill-warning text-warning`. Cover fallback = `.kwik-gradient` (defined
  globally in `packages/ui/src/styles.css`).
- **Naming clash with the legacy commerce `ProductCard`**: the new generic
  `ProductCard` is re-exported from the package root as `GenericProductCard`
  (and its props as `GenericProductCardProps`) to avoid clashing with the
  legacy `export { ProductCard } from "./commerce/product-card"` already in
  `index.ts`. The other 4 cards are re-exported under their canonical names.
  Verified that NO consumer in the monorepo imports the legacy
  `ProductCard` from `@kwikseller/ui`, so this is fully backward-compatible.
- **Countdown hydration safety**: `useCountdown` returns `null` on first
  render (server + first client render match), then sets real digits in
  `useEffect` to avoid hydration mismatch on the displayed numbers.

## Files created / modified
- `packages/ui/src/cards/product-card.tsx` (412 lines)
- `packages/ui/src/cards/category-card.tsx` (96 lines)
- `packages/ui/src/cards/vendor-card.tsx` (164 lines)
- `packages/ui/src/cards/brand-card.tsx` (86 lines)
- `packages/ui/src/cards/deal-card.tsx` (282 lines)
- `packages/ui/src/cards/index.ts` (27 lines — barrel)
- `packages/ui/src/index.ts` — appended a new "Generic Card Components"
  block re-exporting the 5 cards + their prop types.

## Verification
- `tail -5 dev.log` → `✓ Compiled in 2.1s`, `GET / 200 in 1106ms`
  (after fixing an initial `Lightning` → `Zap` lucide-react import typo).
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/` → `200`.
- (The original sandbox dev server PID 951 had crashed mid-task; restarted
  with `bun run dev` writing to `dev.log` — marketplace is now serving
  HTTP 200 with the new cards package compiled in.)
