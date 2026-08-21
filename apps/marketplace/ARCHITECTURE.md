# Kwikseller Marketplace — Architecture

> The Marketplace app is **fully standalone** with zero runtime dependencies on internal `packages/*` workspace packages.

## Architecture Overview

```
apps/marketplace/
├── src/
│   ├── app/                    # Next.js 16 App Router pages
│   ├── components/
│   │   ├── ui/                 # Local UI components (migrated from @kwikseller/ui)
│   │   │   ├── app-button.tsx
│   │   │   ├── app-modal.tsx
│   │   │   ├── confirm-dialog.tsx
│   │   │   ├── error-boundary.tsx
│   │   │   ├── feedback-empty-state.tsx
│   │   │   ├── form-inputs.tsx
│   │   │   ├── offline-banner.tsx
│   │   │   ├── otp-verification.tsx
│   │   │   ├── plain-inputs.tsx
│   │   │   ├── search-auto-suggest.tsx
│   │   │   ├── skeleton.tsx
│   │   │   └── submit-button.tsx
│   │   ├── auth/               # Authentication pages
│   │   ├── landing/            # Homepage sections
│   │   ├── checkout/           # Checkout flow
│   │   ├── compare/            # Product comparison
│   │   ├── layout/             # App shell & navigation
│   │   ├── product/            # Product detail & reviews
│   │   ├── pwa/                # PWA components
│   │   ├── search/             # Search UI
│   │   ├── vendor/             # Vendor storefront
│   │   └── brand/              # Brand pages
│   ├── hooks/                  # Custom React hooks
│   │   ├── index.ts
│   │   ├── use-mobile.ts
│   │   ├── use-pwa.ts
│   │   ├── use-push-notifications.ts  # Migrated from @kwikseller/utils
│   │   ├── use-recent-searches.ts
│   │   └── use-toast.ts
│   ├── lib/                    # Utilities & services
│   │   ├── api.ts              # API wrapper functions
│   │   ├── api-hooks.ts        # React Query hooks
│   │   ├── auth-context.tsx    # AuthProvider + useAuth (migrated from @kwikseller/utils)
│   │   ├── csv.ts
│   │   ├── escrow.ts
│   │   ├── fonts/              # Font configuration (migrated from @kwikseller/fonts)
│   │   │   ├── fonts.ts
│   │   │   ├── fonts.css
│   │   │   ├── tailwind.ts
│   │   │   └── index.ts
│   │   ├── heroui-provider.tsx # HeroUI provider (migrated from @kwikseller/utils)
│   │   ├── http-client.ts      # HTTP client adapter (migrated from @kwikseller/utils)
│   │   ├── marketplace-ranking.ts
│   │   ├── nigeria-locations.ts # Nigeria state/LGA data (migrated from @kwikseller/utils)
│   │   ├── notification-api.ts
│   │   ├── order-api.ts
│   │   ├── query-provider.tsx
│   │   ├── toast.ts            # kwikToast (migrated from @kwikseller/utils)
│   │   └── utils.ts            # cn, formatCurrency, formatDate, etc. (migrated from @kwikseller/ui)
│   ├── services/
│   │   └── api-client.ts       # Full API client (migrated from @kwikseller/api-client)
│   ├── stores/                 # Zustand stores
│   │   ├── auth-store.ts       # Auth store (migrated from @kwikseller/utils)
│   │   ├── cart-store.ts
│   │   ├── compare-store.ts
│   │   ├── home-feed-store.ts
│   │   ├── notification-store.ts
│   │   ├── order-workflow-store.ts
│   │   ├── price-drop-store.ts
│   │   ├── recently-viewed-store.ts
│   │   ├── review-store.ts
│   │   ├── user-preferences-store.ts
│   │   └── wishlist-store.ts
│   ├── types/                  # TypeScript types (migrated from @kwikseller/types)
│   │   ├── auth.ts             # Zod validation schemas
│   │   └── index.ts            # Domain types (Product, Order, Store, etc.)
│   └── constants/              # App constants
│       ├── auth.ts
│       ├── landing.ts
│       ├── marketplace.ts
│       ├── navigation.ts
│       └── order-workflow.ts
├── tailwind.config.ts          # Uses local font config from src/lib/fonts/tailwind.ts
├── tsconfig.json               # Fully self-contained (no workspace extends)
├── eslint.config.mjs           # Fully self-contained (no workspace config)
└── package.json                # Zero workspace:* dependencies
```

## Migrated Modules

### From `@kwikseller/types`

| Local Path | Contents |
|---|---|
| `src/types/auth.ts` | Zod schemas: loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema, etc. |
| `src/types/index.ts` | Domain types: Product, Order, Store, User, Cart, Payment, Escrow, etc. |

### From `@kwikseller/api-client`

| Local Path | Contents |
|---|---|
| `src/services/api-client.ts` | Complete Axios client with interceptors, token refresh, token manager, and all API endpoint objects (authApi, usersApi, productsApi, marketplaceApi, marketplaceStoresApi, checkoutApi, cartApi, deliveryRatesApi, ordersApi, notificationsApi, etc.) |

### From `@kwikseller/utils`

| Local Path | Contents |
|---|---|
| `src/lib/toast.ts` | kwikToast (success, error, warning, info, promise) |
| `src/lib/auth-context.tsx` | AuthProvider, useAuth (React Context + Zustand bridge) |
| `src/stores/auth-store.ts` | useAuthStore, useUser, usePendingResetEmail, UserRole type |
| `src/hooks/use-push-notifications.ts` | usePushNotifications |
| `src/lib/heroui-provider.tsx` | HeroUIProviderWrapper |
| `src/lib/nigeria-locations.ts` | NIGERIA_STATES, getLgasForState |
| `src/lib/http-client.ts` | ApiError class, flat-response api wrapper, token management delegation |

### From `@kwikseller/ui`

| Local Path | Contents |
|---|---|
| `src/components/ui/app-button.tsx` | AppButton with variants (primary/secondary/ghost/danger) |
| `src/components/ui/form-inputs.tsx` | TextInput, PasswordInput, NumberInput, TextareaInput, DatePickerInput, etc. |
| `src/components/ui/plain-inputs.tsx` | FieldInput, FieldAutocomplete, FieldTextarea, FieldSelect |
| `src/components/ui/submit-button.tsx` | SubmitButton |
| `src/components/ui/search-auto-suggest.tsx` | SearchAutoSuggest, SearchAutoSuggestItem type |
| `src/components/ui/otp-verification.tsx` | OTPVerification form |
| `src/components/ui/feedback-empty-state.tsx` | EmptyState with variants |
| `src/components/ui/skeleton.tsx` | Skeleton, SkeletonText, SkeletonCard, etc. |
| `src/components/ui/error-boundary.tsx` | ErrorBoundary, ErrorFallback |
| `src/components/ui/offline-banner.tsx` | OfflineBanner, ConnectionStatus |
| `src/components/ui/confirm-dialog.tsx` | ConfirmDialog |
| `src/components/ui/app-modal.tsx` | AppModal |
| `src/lib/utils.ts` | cn, formatCurrency, formatDate, formatRelativeTime, truncate, slugify, capitalize, getInitials, generateId, maskEmail |

### From `@kwikseller/fonts`

| Local Path | Contents |
|---|---|
| `src/lib/fonts/fonts.ts` | All Next.js Google font configs (Sora, Figtree, JetBrains Mono, Inter, Poppins, etc.) |
| `src/lib/fonts/tailwind.ts` | Tailwind font/typography configuration |
| `src/lib/fonts/fonts.css` | CSS fallback font definitions |
| `src/lib/fonts/index.ts` | Re-exports |

## What Remains External

All external npm dependencies (no internal workspace packages):

- **Framework**: next, react, react-dom
- **UI Library**: @heroui/react, @heroui/styles, lucide-react, framer-motion
- **State**: zustand, @tanstack/react-query
- **Forms**: react-hook-form, @hookform/resolvers, zod
- **Styling**: tailwindcss, clsx, tailwind-merge, next-themes
- **HTTP**: axios
- **Other**: sonner, embla-carousel-react, @internationalized/date

## API Communication

The Marketplace communicates with the backend API exclusively through HTTP:

```
Marketplace Components
       ↓
@/lib/api-hooks.ts (React Query hooks)
       ↓
@/services/api-client.ts (Axios + interceptors + token management)
       ↓
HTTP (Bearer token auth)
       ↓
apps/api (NestJS Backend on port 4000)
```

**No direct imports from `apps/api` source code.**
**No shared package dependencies.**

## Dependency Verification

```bash
# Verify zero workspace runtime imports
grep -r "from.*@kwikseller/" apps/marketplace/src/ --include="*.ts" --include="*.tsx"
# Expected: (no results)

# Verify zero workspace dependencies in package.json
grep "workspace:\*" apps/marketplace/package.json
# Expected: (no results)
```
