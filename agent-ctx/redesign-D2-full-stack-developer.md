# Task: redesign-D2 — Redesign storefront/messages/notifications/help pages

Agent: full-stack-developer
Scope: 4 vendor dashboard pages — dark-mode gap fixes, raw `<h1>` → `VendorPageHeader`, motion.div wrappers, raw `<select>` → `FieldSelect` (notifications only), KwiksellerLoader overlay removal (storefront only).

## Files Changed (4)
- `apps/vendor/src/app/dashboard/storefront/page.tsx` (1161 → 1160 LOC)
- `apps/vendor/src/app/dashboard/messages/page.tsx` (903 → 909 LOC)
- `apps/vendor/src/app/dashboard/notifications/page.tsx` (636 → 637 LOC)
- `apps/vendor/src/app/dashboard/help/page.tsx` (1833 → 1833 LOC)

## Key Decisions
- Strictly followed the user-provided DARK-MODE TOKEN MAP (did not touch `bg-gray-900`, `border-gray-900`, `bg-gray-800`, `bg-gray-700`, `bg-gray-500`, `bg-gray-400` — they're either intentional button/accent colors or avatar color choices).
- `text-white` left as-is in all 4 files (always on `bg-gray-900` active pill buttons or `bg-foreground` vendor chat bubbles — per the rule "leave as-is if on a colored bg").
- For `text-gray-800` in help/page.tsx (bold text inside expanded article body, 2 instances), followed precedent from B worklog: replaced with `text-foreground` for dark-mode visibility (article body was `text-gray-600` → `text-muted-foreground`, so bold parts use `text-foreground` for hierarchy).
- For `text-gray-300` (empty-state icons in messages + notifications + help), used `text-muted-foreground/50` per B worklog precedent (faint icon look in dark mode).
- For `hover:border-gray-400` and `hover:border-gray-500` (interactive hover borders), used `hover:border-accent` per B worklog precedent.
- For `focus:border-gray-500` (search inputs in messages + help), used `focus:border-accent`.
- For `hover:border-gray-300` (notifications pagination button hover, 1 instance), used `hover:border-accent` (after `border-gray-300 → border-kwik-border` had already transformed `hover:border-gray-300` → `hover:border-kwik-border`; manually fixed this single occurrence back to `hover:border-accent` for interactive feedback).
- Messages page: replaced left-panel compact header (`<h1>Messages</h1>` + unread count + compose button) with `VendorPageHeader` — kept the unread count span and compose button as `actions`. VendorPageHeader's larger heading (text-xl vs original text-lg) is a deliberate redesign choice per the task instructions.
- Notifications page: replaced raw `<select>` with `FieldSelect`, passing `className="h-9"` (override baseControl's h-11) and `wrapperClassName="w-auto"` (prevent the wrapper label from stretching full-width in the flex filter bar). Kept all `<option>` children intact.
- Storefront page: removed `{isSaving && <KwiksellerLoader overlay />}` save-state overlay (save button's `isLoading` already covers it per task instructions). Page-level loading state was already using `Skeleton` (no changes needed there).

## MultiEdit Atomicity Caveat
Encountered an issue where MultiEdit applies edits IN SEQUENCE and stops at the first failure (NOT truly atomic as docs claim). When `border-gray-300 → border-kwik-border` (replace_all) ran BEFORE `hover:border-gray-300 → hover:border-accent`, the latter failed because `border-gray-300` is a substring of `hover:border-gray-300` and had already been transformed. Fix: order edits so more specific patterns (with prefixes like `hover:`, `focus:`, `placeholder:`) run BEFORE the bare token replace_all.

## Verification
- `npx tsc --noEmit -p apps/vendor/tsconfig.json 2>&1 | grep -E "storefront/page|messages/page|notifications/page|help/page"` → **0 errors** in all 4 target files.
- `npx tsc --noEmit -p apps/vendor/tsconfig.json` (full check) → **0 errors overall** (no regressions introduced).
- Could not run `bun run lint` — ESLint binary missing in sandbox (same environment issue noted in redesign-B and redesign-C2 worklogs).
- Verified zero remaining light-only `bg-gray-*` / `text-gray-*` / `border-gray-*` / `divide-gray-*` / `hover:*-gray-*` / `focus:*-gray-*` / `placeholder:text-gray-*` / `bg-white` patterns in all 4 files (the single `bg-gray-50: 1` count in messages is a false-positive grep match on `"bg-gray-500"` in the AVATAR_COLORS array — intentional avatar color choice, not a dark-mode gap).
- Verified zero remaining raw `<h1>` in all 4 files (all replaced with `VendorPageHeader`).
- Verified zero remaining raw `<select>` in notifications (replaced with `FieldSelect`).
- Verified zero remaining `KwiksellerLoader` references in storefront (both import and overlay usage removed).
- Verified all 4 main returns are wrapped in `<motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.3}}>` with matching closing `</motion.div>`.

## Stage Summary
- 4 vendor dashboard pages now have Framer Motion page transitions.
- 4 raw `<h1>` page headers → `VendorPageHeader` from `@kwikseller/ui`.
- 1 raw `<select>` → `FieldSelect` (notifications filter).
- 1 `KwiksellerLoader` overlay removed (storefront save-state — covered by AppButton `isLoading`).
- ~273 total dark-mode gap occurrences fixed across the 4 files using only semantic tokens with dark-mode support (`bg-default-100`, `bg-default-200`, `bg-surface`, `text-foreground`, `text-muted-foreground`, `text-muted-foreground/50`, `border-kwik-border`, `divide-kwik-border`, `hover:border-accent`, `focus:border-accent`, `hover:bg-default-100`, `placeholder:text-muted-foreground`).
- No API calls, store logic, business logic, or still-used imports changed. All edits surgical via Edit/MultiEdit with replace_all where safe.
