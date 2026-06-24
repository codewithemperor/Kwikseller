# Task: vendor-rebuild — Rebuild vendor products list + pool browse + product form with shared components + RHF

Agent: full-stack-developer
Task ID: vendor-rebuild
Date: 2025-06-23

## Scope
Rebuild 4 files in the vendor app using shared `@kwikseller/ui` components:
1. `apps/vendor/src/app/dashboard/products/page.tsx` — products list (grid + table views)
2. `apps/vendor/src/app/dashboard/pool/page.tsx` — pool marketplace browse
3. `apps/vendor/src/components/products/product-form.tsx` — NEW single-file RHF + zod product form
4. `apps/vendor/src/app/dashboard/products/[id]/edit/page.tsx` — thin wrapper

## Work Log

### Context gathering
- Read `worklog.md` (prior phase-7 + phases-5-10 context). Confirmed vendor app has `QueryProvider` wired (phase-7), `vendorCommerceApi` (listProducts, updateProduct, listPoolCatalog, getDashboard, deletePoolSelection, createPoolSelection), `useVendorProductsStore`, `useVendorPoolStore`, `PoolCatalogItem` type, `poolItemRouteKey`/`poolSourcePrice`/`poolSourceName` helpers.
- Read all 4 existing target files + 5 sub-tab files (product-basic-tab, product-pricing-tab, product-inventory-tab, product-images-tab, product-visibility-tab) + product-form-schema.ts to understand the existing structure and API calls.
- Read shared UI components: `DataTable` (ColumnDef, DataTableRowAction, pagination, rowActions, compact), `MetricCard` (variant: default/solid/soft, format: number/currency), `PoolProductCard` (PoolProductCardProduct, onAddToStore/onViewDetail/onRemove), `VendorPageHeader`, `ConfirmDialog`, `AppSwitch`, `AppButton`, `FieldInput`/`FieldSelect` (plain HTML inputs), `TextInput`/`NumberInput`/`TextareaInput`/`SelectInput` (RHF Controller-based from form-inputs.tsx), `ImageUpload` (ImageUploadValue, onUpload callback, enableReorder), `EmptyState`, `Skeleton`/`SkeletonCard`, `PriceDisplay`, `StockBadge`, `VendorStatusBadge`.

### Step 1: product-form-schema.ts — trimmed to task spec
- Removed `tags: z.array(z.string())` and `costPrice: z.number().optional()` (not in the task schema spec).
- Kept: name (min 3), description (min 20), categoryId (required), price (min 1), comparePrice (optional), stock (min 0), lowStockThreshold (min 0), sku (optional), status (ACTIVE/DRAFT/ARCHIVED), images (min 1, ImageUploadValue[]).
- Kept `PRODUCT_CATEGORIES` and `PRODUCT_STATUS_OPTIONS` exports (used by products/page.tsx category filter + the form).

### Step 2: Deleted 5 orphaned sub-tab files
- `product-basic-tab.tsx`, `product-pricing-tab.tsx`, `product-inventory-tab.tsx`, `product-images-tab.tsx`, `product-visibility-tab.tsx` — all only imported by the old multi-file product-form.tsx. Confirmed via grep that nothing else imports them. Deleted to keep tsc clean (they referenced the now-removed `tags`/`costPrice` fields).

### Step 3: NEW product-form.tsx — single-file RHF + zod form (~448 lines)
- Consolidated all 5 tabs (Basic, Pricing, Inventory, Images, Visibility) inline — no sub-tab imports.
- Props: `{ productId?, onSubmit, isSubmitting?, title?, description?, submitLabel? }` (kept optional title/description/submitLabel for backwards-compat with `products/new/page.tsx` which passes them).
- RHF `useForm<ProductFormValues>` with `zodResolver(productFormSchema)`.
- Edit mode: `useQuery(['vendor-product', productId])` fetches via `vendorCommerceApi.listProducts()` + finds by id (same pattern as original). Loading → skeleton; not-found → empty state.
- Basic tab: `TextInput` (name), `TextareaInput` (description, 5000 char + count), `SelectInput` (categoryId, PRODUCT_CATEGORIES).
- Pricing tab: inline `PricingTab` sub-component using `useWatch` for price + comparePrice → live sale preview (strikethrough comparePrice + accent sale price) via `formatCurrency`.
- Inventory tab: `NumberInput` (stock, lowStockThreshold), `TextInput` (sku).
- Images tab: RHF `Controller` wrapping shared `ImageUpload` (maxImages=5, enableReorder, onUpload → `uploadApi.productImage` + `unwrapApiData` for URL extraction).
- Visibility tab: `SelectInput` (status) + `AppSwitch` (ACTIVE/DRAFT quick toggle, writes via `setValue`).
- Tab nav: 5 buttons with `aria-pressed`, error-dot indicator per tab (computed from `formState.errors`), jumps to first errored tab on invalid submit.
- Bottom action bar: "Save as Draft" (secondary, sets status=DRAFT) + primary submit (submitLabel). Fixed on mobile, static on desktop.
- Framer Motion page transition.
- **zodResolver type-skew fix**: Discovered a pre-existing type-level mismatch in the pnpm workspace — `@hookform/resolvers@5.4` resolves `zod/v4/core` from `zod@3.25.76` (transitional, `_zod.version.minor = 0`) while the app's schemas use `zod@4.4.3` (minor = 4). This affects ALL zodResolver calls in the vendor app (4 auth pages + product-form). Runtime is unaffected (zodResolver detects zod4 via the `_zod` property). Fixed in product-form.tsx with `zodResolver(productFormSchema as never) as never` + an explanatory comment. (The auth page errors are pre-existing and out of scope.)

### Step 4: REWRITE products/page.tsx (~447 lines)
- `VendorPageHeader`: "Products" + count in description + Refresh + "Add Product" → `/dashboard/products/new`.
- Toolbar: `FieldInput` (search by name/SKU), `FieldSelect` (category — PRODUCT_CATEGORIES), `FieldSelect` (status — All/Active/Draft/Archived), grid/table view toggle (LayoutGrid/TableIcon buttons with aria-pressed), Clear button when filters active.
- Grid view: `motion.div` stagger container → `VendorProductCard` per product (existing `@/components/vendor-product-card`) with image, name, category, PriceDisplay, stockLabel, statusLabel, onOpen/onEdit → edit page, onDelete → archive dialog. canDelete=false for POOL_RESALE products.
- Table view: `DataTable` with 5 columns (Product [image+name+category], Price [PriceDisplay], Stock [StockBadge], Status [AppSwitch ACTIVE/DRAFT toggle OR VendorStatusBadge for ARCHIVED], Added [formatDate]) + rowActions (Edit, View, Archive-danger). AppSwitch calls `handleQuickStatus` → `vendorCommerceApi.updateProduct(id, {status})` + `refreshProducts()`.
- Loading: 8× `SkeletonCard` (grid) or 6× `Skeleton` bars (table).
- Empty: `EmptyState` variant="search" (with filters) or "products" (no products, with Add Product CTA).
- Archive: `ConfirmDialog` (variant="danger") — blocks POOL_RESALE products, calls `updateProduct(id, {status: ARCHIVED})`.
- Framer Motion page transition.
- Store: `useVendorProductsStore` (fetchProducts, refreshProducts, products, isLoading) — same as original.

### Step 5: REWRITE pool/page.tsx (~297 lines)
- `VendorPageHeader`: "Pool Marketplace" + Refresh action.
- `MetricCard` (variant="soft", format="currency", icon=DollarSign): "Pool Earnings" from `vendorCommerceApi.getDashboard()` via `useQuery(['vendor-dashboard'])` → `poolEarnings`. Shows `isLoading` skeleton.
- Toolbar: `FieldInput` (search, Enter to apply), `FieldSelect` (source: All/Kwikseller/Vendors), `FieldSelect` (category — from store's categories), Search button. Below: `AppSwitch` "Already added" toggle (client-side filter `catalog.filter(alreadySelected)`) + Clear filters button.
- Grid: `motion.div` stagger → `PoolProductCard` per `PoolCatalogItem` (mapped via `toCardProduct` helper: wholesalePrice=poolSourcePrice, suggestedRetailPrice, sourceType, sourceStoreName, category, alreadySelected, linkedOfferId). onAddToStore/onViewDetail → `/dashboard/pool/product/${poolItemRouteKey(item)}`. onRemove → `vendorCommerceApi.deletePoolSelection(linkedOfferId)` + `markSelected` + toast.
- "Load More" `AppButton` (secondary) when `hasMore && !onlyAdded` → `loadMore()`.
- Loading: 8× `SkeletonCard` (aspect-3/4). Error: `EmptyState` variant="error". Empty: `EmptyState` variant="search" with Clear filters CTA.
- Framer Motion page transition.
- Store: `useVendorPoolStore` (catalog, categories, search, sourceType, categoryId, isLoading, isLoadingMore, hasMore, error, fetchPool, refreshPool, loadMore, markSelected).
- Lint fix: removed the `set-state-in-effect` sync effect (store→draft). Draft state initializes from store on mount via `useState(search)` etc.; explicit `setDraft*` calls in clearFilters handle resets. The sync was redundant for this page (store only changes via the page's own actions).

### Step 6: REWRITE products/[id]/edit/page.tsx (~62 lines)
- Thin wrapper: `use(params)` for id, `useMutation` → `vendorCommerceApi.updateProduct(id, {...})` with image URL extraction + lowStock mapping, `onSuccess` → toast + invalidate `['vendor-products']` + `['vendor-product', id]` + `router.push('/dashboard/products')`, `onError` → toast.
- Renders `<ProductForm productId={id} onSubmit={...} isSubmitting={mutation.isPending} title="Edit Product" submitLabel="Save Changes" />`.

### Step 7: packages/ui exports
- Added `PoolProductCard` + `PoolProductCardProduct` + `RatingStars`/`RatingStarsProps` exports to `packages/ui/src/index.ts` (they were in `commerce/index.ts` but not re-exported from the main barrel). `packages/ui` typechecks 0 errors.

## Verification
- `npx tsc --noEmit -p apps/vendor/tsconfig.json 2>&1 | grep -E "products/page|products/\[id\]/edit|pool/page|product-form"` → **0 matches (0 errors in all 4 target files)**. ✅
- Full vendor app tsc: 4 pre-existing errors (auth pages' zodResolver type-skew — not in scope, not in the grep filter).
- `npx eslint` on the 5 changed vendor files → **0 errors, 0 warnings**. ✅
- `npx tsc --noEmit -p packages/ui/tsconfig.json` → 0 errors. ✅

## Files
- Created: `agent-ctx/vendor-rebuild-full-stack-developer.md` (this file)
- Rewritten (5): `apps/vendor/src/components/products/product-form.tsx`, `apps/vendor/src/app/dashboard/products/page.tsx`, `apps/vendor/src/app/dashboard/pool/page.tsx`, `apps/vendor/src/app/dashboard/products/[id]/edit/page.tsx`, `apps/vendor/src/components/products/product-form-schema.ts`
- Deleted (5): `apps/vendor/src/components/products/product-basic-tab.tsx`, `product-pricing-tab.tsx`, `product-inventory-tab.tsx`, `product-images-tab.tsx`, `product-visibility-tab.tsx`
- Edited (1): `packages/ui/src/index.ts` (added PoolProductCard + RatingStars exports)
