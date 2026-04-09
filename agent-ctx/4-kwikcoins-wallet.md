# Task 4 - KwikCoins Wallet Component

## Summary
Created `src/components/landing/kwikcoins-wallet.tsx` — a mini wallet dashboard section showing a vendor's KwikCoins wallet interface.

## File Created
- `src/components/landing/kwikcoins-wallet.tsx`

## Component Structure

### `KwikCoinsWallet` (named export)
A `'use client'` component featuring:

1. **Section Layout**: `py-20 bg-background relative` with decorative background blobs, container `mx-auto px-4 max-w-5xl`, centered header with Chip + heading + description.

2. **Left Column (`lg:col-span-2`)** — Wallet Card:
   - Full `kwik-gradient` background (navy → orange)
   - Decorative dot pattern overlay at 6% opacity
   - Floating coin emoji decorations with `animate-float-slow/medium/fast`
   - Coin icon with sparkle badge
   - "Available Balance" label (white/80)
   - Animated count-up balance: "2,450 KwikCoins" (text-3xl font-bold)
   - ₦ equivalent value that updates with count-up (white/60)
   - Gold Tier badge with star icon + "Next: Platinum" text
   - 65% progress bar with animated width

3. **Right Column (`lg:col-span-3`)** — Activity + Actions:
   - **Quick Actions Row**: 3 isPressable Cards (Earn Coins/Zap purple, Redeem/Gift green, Transfer/ArrowRightLeft blue) with pop-in scale animation
   - **Recent Transactions**: 5 items with colored icons, descriptions, dates, green/red coin amounts
   - **Coin Value Calculator**: Conversion rates, tier multiplier info, "Learn more" link

4. **Animations** (Framer Motion):
   - Wallet card slides in from left (`x: -60 → 0`)
   - Action buttons pop in with `backOut` easing + stagger
   - Transaction items stagger in from right (`x: 40 → 0`)
   - Balance count-up effect via custom `useCountUp` hook (ease-out cubic, 1.4s)
   - Calculator card fades up with delay
   - All scroll-triggered via `useInView`

## Technical Details
- Uses HeroUI v3: `Card`, `Chip` (with `isPressable`, `variant="soft"`)
- Uses `cn()` from `@kwikseller/ui` for conditional classes
- All icons from `lucide-react`
- Dark mode supported via HeroUI CSS variables (`text-default-500`, `bg-default-50`, etc.)
- ESLint: **0 errors, 0 warnings**
