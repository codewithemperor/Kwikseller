# Vendor App — Standalone Architecture

## Overview

The Vendor app (`apps/vendor`) is a **fully standalone** Next.js 16 application with **zero runtime dependencies** on any shared workspace package (`packages/*`). All formerly shared code has been copied locally into `src/lib/`.

## Directory Structure

```
apps/vendor/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout (fonts, providers)
│   │   ├── page.tsx            # Landing/redirect page
│   │   ├── (auth)/             # Auth route group
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   ├── dashboard/          # Main vendor dashboard
│   │   │   ├── analytics/
│   │   │   ├── delivery/
│   │   │   ├── deliveries/
│   │   │   ├── help/
│   │   │   ├── inventory/
│   │   │   ├── kyc/
│   │   │   ├── messages/
│   │   │   ├── notifications/
│   │   │   ├── onboarding/
│   │   │   ├── orders/
│   │   │   ├── pool/
│   │   │   ├── products/
│   │   │   ├── profile/
│   │   │   ├── search/
│   │   │   ├── settings/
│   │   │   ├── storefront/
│   │   │   ├── subscriptions/
│   │   │   └── wallet/
│   │   └── unauthorized/
│   ├── components/             # App-specific components
│   │   ├── auth/               # Auth pages (login, register, etc.)
│   │   ├── dashboard/          # Dashboard-specific components
│   │   ├── layout/             # Header, drawer, mobile nav
│   │   ├── pool/               # Pool/product components
│   │   └── products/           # Product form, CSV import
│   ├── hooks/                  # Custom hooks
│   ├── lib/                    # ** Local standalone libraries **
│   │   ├── ui/                 # ← Copied from packages/ui
│   │   ├── types/              # ← Copied from packages/types
│   │   ├── utils/              # ← Copied from packages/utils
│   │   ├── api-client/         # ← Copied from packages/api-client
│   │   ├── fonts/              # ← Copied from packages/fonts
│   │   ├── pool.ts             # Vendor-specific pool utilities
│   │   ├── query-provider.tsx  # React Query provider
│   │   └── vendor-format.ts    # Vendor-specific formatters
│   └── stores/                 # Zustand stores
├── package.json                # No workspace:* dependencies
├── tsconfig.json               # No @kwikseller/* path mappings
├── tailwind.config.ts          # Points to local src/lib/ui
└── next.config.ts              # API proxy to NestJS backend
```

## Local Libraries (Formerly `@kwikseller/*`)

| Local Path | Former Package | Imports Used |
|---|---|---|
| `src/lib/ui/` | `@kwikseller/ui` | 36 components (AppButton, AppModal, Skeleton, VendorPageHeader, etc.) |
| `src/lib/types/` | `@kwikseller/types` | 22 exports (schemas + domain types) |
| `src/lib/utils/` | `@kwikseller/utils` | 10 exports (cn, kwikToast, useAuth, useAuthStore, etc.) |
| `src/lib/api-client/` | `@kwikseller/api-client` | 9 API namespaces (vendorCommerceApi, uploadApi, storeApi, etc.) |
| `src/lib/fonts/` | `@kwikseller/fonts` | 0 (declared but never imported; fonts defined inline in layout.tsx) |

## Import Convention

All formerly shared imports now use the `@/lib/*` alias:

```typescript
// Before (workspace dependency)
import { AppButton } from "@kwikseller/ui";
import { Product } from "@kwikseller/types";
import { kwikToast } from "@kwikseller/utils";
import { vendorCommerceApi } from "@kwikseller/api-client";

// After (local standalone)
import { AppButton } from "@/lib/ui";
import { Product } from "@/lib/types";
import { kwikToast } from "@/lib/utils";
import { vendorCommerceApi } from "@/lib/api-client";
```

## Internal Cross-Dependencies

The copied libraries retain their internal dependencies, resolved via relative paths:

- `src/lib/api-client/` → `src/lib/types/` (via `../types`)
- `src/lib/utils/http/` → `src/lib/api-client/` (via `../../api-client`)
- `src/lib/utils/hooks/` → `src/lib/api-client/` (via `../../api-client`)

## Technology Stack

- **Framework**: Next.js 16.2.1 with Turbopack
- **React**: v19
- **UI Library**: HeroUI v3 + Tailwind CSS v4
- **State**: Zustand v5 + TanStack Query v5
- **Forms**: react-hook-form v7 + Zod v4
- **API Client**: Axios (via local api-client)
- **Port**: 3001 (default) / 3000 (sandbox dev)

## Independence Guarantee

This app has **zero** `workspace:*` dependencies in `package.json` and **zero** `@kwikseller/*` import statements in source code. It can be extracted from the monorepo and run independently with only its own `node_modules`.
