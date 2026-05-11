# KWIKSELLER Commerce Rebuild Report

## Executive Summary

KWIKSELLER is intended to be a multi-platform commerce operating system with a buyer Marketplace, Vendor Dashboard, Super Admin Panel, and a future Rider app. The current repository has useful foundations: authentication, catalog pages, admin CRUD surfaces, shared packages, PWA scaffolding, Prisma models for several domains, and a strong visual marketplace direction. It is not yet a standard e-commerce core.

The main gap is that commerce-critical behavior is not fully modeled or implemented. Products are still shaped like simple catalog records, inventory is not the source of truth, checkout is not live, vendor operations are mostly mocked, Pool commerce is mostly explanatory UI/schema, and admin governance is catalog-heavy rather than commerce-operations-heavy.

This rebuild should start with the commerce core and suspend Rider automation for v1. Delivery remains manually managed by admin and vendor workflows until the order, payment, inventory, and Pool foundations are trustworthy.

## Current-State Audit

### What Exists

- Marketplace has product/category/search/cart-facing pages and a rich Pool marketing page.
- Vendor app has auth and a dashboard shell, but operational data is mocked.
- Admin app has dashboards and CRUD flows for products, categories, brands, banners, coupons, and deals.
- API has modules for auth, users, products, categories, brands, banners, deals, coupons, upload, dashboard, admin, and sellers.
- Prisma schema already includes early models for product, variants, cart, order, payment, escrow, wallet, Pool, riders, notifications, reviews, wishlist, and system config.
- Shared packages exist for types, API client, UI, utilities, fonts, and TypeScript config.

### Main Gaps

- Product model does not clearly distinguish physical and digital goods.
- Product `stock` and variant `stock` are direct counters, not inventory ledgers or reservation-backed stock.
- Cart and checkout are not implemented as backend-owned workflows.
- Marketplace checkout currently stops at a “coming soon” toast.
- Vendor dashboard does not reflect real orders, revenue, inventory alerts, fulfillment, or Pool earnings.
- Pool is described visually but not implemented as a real vendor opt-in/resale/group-buy engine.
- Admin has product CRUD but not full commerce operations: payment oversight, manual logistics, fulfillment queue, Pool governance, and risk flags.
- API client exposes many promised endpoints that the backend does not yet implement.
- Security posture needs stronger ownership checks, webhook verification, admin permission enforcement, and audit logging on commerce mutations.

## Target Commerce Model

### Active Platforms

- Marketplace: public buyer storefront and buyer account flows.
- Vendor: seller operations, catalog, inventory, orders, digital fulfillment, Pool participation.
- Admin: governance, moderation, Pool catalog/campaigns, payments, refunds, manual logistics, KYC, and permissions.
- Rider: suspended for v1; delivery is manually tracked.

### Product Types

`PHYSICAL`
- Requires inventory tracking.
- Requires shipping or pickup fulfillment.
- Can have variants with independent inventory.
- Can be normal vendor stock or Pool-backed resale stock.

`DIGITAL`
- Does not require shipping address.
- Requires digital asset metadata.
- Fulfillment means access delivery after payment.
- Inventory can be unlimited or license-limited.

Services/bookings are out of scope for v1.

### Pool Commerce

KWIKSELLER should support a hybrid Pool model long-term:

- Admin Pool Catalog: admin or approved suppliers create Pool products. Vendors opt in, set markup, and publish Pool-backed offers. This is the first implementation target.
- Group Buy Pool: buyers join demand pools to unlock bulk pricing. This comes after normal checkout and admin Pool catalog are stable.

Marketplace must label Pool items clearly:

- `Vendor Stock`: vendor-owned inventory.
- `Pool Resale`: vendor resells admin/supplier Pool catalog item.
- `Group Buy`: buyer joins an active campaign with thresholds.

## Data Model Direction

The schema should move from simple counters to transaction-safe commerce records.

Core records:

- `Product`: catalog identity, product type, source, moderation status, fulfillment settings.
- `ProductVariant`: sellable option combinations.
- `DigitalAsset`: protected digital delivery metadata.
- `InventoryItem`: source of truth for available/reserved/safety stock.
- `InventoryReservation`: temporary holds during checkout/payment.
- `Cart` and `CartItem`: backend-owned cart state for logged-in users and guests.
- `Order` and `OrderItem`: immutable sales record after checkout begins.
- `Payment`: Paystack-first payment intent, verification, and webhook state.
- `Fulfillment`: physical/manual delivery or digital access delivery state.
- `PoolProduct`: admin/supplier Pool catalog product.
- `VendorPoolOffer`: vendor opt-in/markup listing for Pool products.
- `PoolCampaign`: future group-buy demand campaign.
- `AuditLog`: append-only record for admin/vendor/payment/inventory/order changes.

Important rules:

- Product `stock` should become a compatibility/display field only until fully migrated.
- Checkout must reserve inventory before payment initialization.
- Payment webhook verification must be idempotent.
- Failed or expired payments must release reservations.
- Digital products are fulfilled only after payment is verified.
- Physical order fulfillment can be manually managed without rider assignment.

## Target User Flows

### Marketplace Flow

1. Buyer browses catalog.
2. Product cards show product type, stock state, and Pool badge where relevant.
3. Buyer adds item to cart.
4. Backend validates product status, purchasability, inventory, Pool offer state, and quantity.
5. Buyer checks out with address only if cart contains physical items.
6. Backend creates order, reserves inventory, initializes Paystack payment, and returns authorization URL/reference.
7. Webhook verifies payment and marks order paid.
8. Fulfillment is created:
   - Physical: manual vendor/admin fulfillment.
   - Digital: digital access delivery.
9. Buyer sees payment and order tracking state.

### Vendor Flow

1. Vendor dashboard loads real analytics and operational queues.
2. Vendor creates physical or digital products.
3. Physical products require inventory setup.
4. Digital products require digital asset setup.
5. Vendor manages orders by fulfillment state.
6. Vendor views low-stock alerts and adjusts inventory.
7. Vendor browses Admin Pool Catalog, opts into products, sets markup, and publishes offers.
8. Vendor sees Pool sales and earnings.

### Admin Flow

1. Admin manages product moderation and catalog taxonomy.
2. Admin manages Pool catalog and future Pool campaigns.
3. Admin monitors orders, payments, refunds, manual delivery, and fulfillment exceptions.
4. Admin reviews vendor KYC and permissions.
5. Admin sees risk flags: low stock, failed webhooks, delayed fulfillment, suspicious checkout activity, and pending digital delivery issues.

## API Surface

Marketplace APIs:

- `GET /products`, `GET /products/:id`, `GET /products/search`
- `GET /pool/offers`, `GET /pool/campaigns`
- `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:id`, `DELETE /cart/items/:id`
- `POST /checkout`
- `GET /orders`, `GET /orders/:id`
- `GET /payments/verify/:reference`

Vendor APIs:

- `GET /vendor/dashboard`
- `GET/POST/PATCH /vendor/products`
- `POST /vendor/products/:id/inventory/adjust`
- `POST /vendor/products/:id/digital-assets`
- `GET /vendor/orders`, `PATCH /vendor/orders/:id/status`
- `GET /vendor/pool/catalog`
- `POST /vendor/pool/offers`
- `PATCH /vendor/pool/offers/:id`

Admin APIs:

- `GET /admin/commerce/overview`
- `GET/PATCH /admin/orders`
- `GET /admin/payments`, `POST /admin/payments/:id/refund`
- `GET/POST/PATCH /admin/pool/products`
- `GET/POST/PATCH /admin/pool/campaigns`
- `GET /admin/fulfillments`
- `PATCH /admin/fulfillments/:id/manual-status`
- Existing admin catalog APIs should stay, but use the richer product model.

## Security and Reliability

- Validate every DTO with strict whitelist behavior for commerce endpoints.
- Enforce ownership: vendors can mutate only their store/products/orders/offers.
- Enforce admin permissions for all admin commerce endpoints.
- Verify Paystack webhook signatures before mutating payment/order state.
- Use idempotency keys for checkout and payment webhook processing.
- Use database transactions for checkout, reservations, order creation, and payment records.
- Audit all admin/vendor commerce mutations.
- Keep production secrets required; no insecure default JWT or webhook secrets in production.
- Rate-limit auth, checkout, payment verification, and webhook-sensitive paths.

## Implementation Phases

### Phase 1: Commerce Foundation

- Extend shared types and API client contracts.
- Refactor Prisma schema for product type, inventory, reservations, digital assets, fulfillment, Pool offers, and Pool campaigns.
- Add module boundaries for inventory, cart, checkout, orders, payments, pool, and vendor commerce.
- Keep endpoints minimal but typed.

### Phase 2: Backend Workflows

- Implement transaction-safe cart validation.
- Implement checkout with reservation, order creation, Paystack initialization, and payment records.
- Implement webhook verification and order state transitions.
- Implement vendor product/inventory/digital asset workflows.
- Implement Admin Pool Catalog and vendor opt-in.

### Phase 3: Platform UX

- Replace marketplace checkout placeholder with real checkout flow.
- Replace vendor dashboard mock data with real API data.
- Add vendor pages for products, inventory, orders, digital assets, and Pool offers.
- Expand admin to commerce operations: Pool, orders, payments, manual logistics, risk flags.

### Phase 4: Quality and Hardening

- Add unit and e2e tests for commerce workflows.
- Add frontend flow tests for marketplace/vendor/admin.
- Add security tests for ownership, permissions, webhook signatures, duplicate callbacks, and checkout races.
- Add observability for failed payments, low stock, delayed fulfillment, and webhook failures.

## Acceptance Criteria

- A buyer can purchase a physical product through Paystack and see order tracking.
- A buyer can purchase a digital product without a shipping address and receive digital access after payment.
- Inventory is reserved during checkout and released on failed/expired payment.
- Vendor dashboard shows real revenue, orders, low-stock alerts, fulfillment tasks, and Pool earnings.
- Admin can manage Pool products, orders, payments, manual fulfillment status, and commerce risk flags.
- TypeScript checks pass across the workspace.

