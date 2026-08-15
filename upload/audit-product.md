# Product System Audit — Task 2-a

**Scope:** Read-only audit of the Product system in the KWIKSELLER NestJS + Prisma (SQLite) backend.
**Audited files:** `apps/api/prisma/schema.prisma`, `apps/api/src/modules/products/**`, `apps/api/src/modules/commerce/**` (overlapping inventory/order/digital logic), `apps/api/src/modules/reviews/**`, `apps/api/src/modules/deals/**`, `apps/api/src/modules/order-operations/**`, `apps/api/src/common/services/storage.service.ts`, `apps/marketplace/src/lib/api-hooks.ts`, marketplace PDP/card components.
**Date:** Snapshot of working tree at audit time.

---

## Relationship Map (ASCII)

```
                         ┌──────────────────────────────────────────────────┐
                         │                   User (role=VENDOR)             │
                         │   id  email  role  status  phone  passwordHash   │
                         └───────────────────────┬──────────────────────────┘
                                                 │ 1:1  (Store.vendorId @unique)
                                                 ▼
                                         ┌──────────────┐
                                         │     Store    │   id  vendorId  name  slug
                                         │              │   logoUrl  bannerUrl  isVerified
                                         │              │   deliverySetupComplete  bankCode...
                                         └──────┬───────┘
                                                │ 1:N  (Product.storeId — NOT nullable)
                                                ▼
   ┌──────────────────────────────────────────────────────────────────────────────────────┐
   │                                  Product                                              │
   │  id  storeId  poolProductId?  name  slug  shortDescription?  description?              │
   │  price  comparePrice?  sku?  barcode?                                                 │
   │  productType (PHYSICAL|DIGITAL)  productSource (VENDOR_STOCK|POOL_RESALE|GROUP_BUY)  │
   │  inventoryPolicy (TRACKED|UNLIMITED|LICENSE_LIMITED)                                  │
   │  requiresShipping  useStoreDeliveryZones  trackInventory                              │
   │  stock  lowStock  minOrderQuantity  maxOrderQuantity?  condition?                     │
   │  isPreorder  preorderDate?  weight?                                                   │
   │  status (ACTIVE|DRAFT|ARCHIVED|PENDING)  categoryId?  brandId?                        │
   │  isFeatured  isPoolProduct  poolEnabled  poolBasePrice?  poolMinSalePrice?            │
   │  poolMaxSelectableQuantity?  poolSourceStoreId?  poolSourceProductId?                  │
   │  poolSourceBasePrice?  poolMargin?                                                    │
   │  rating  reviewCount  totalSales  createdAt  updatedAt                                │
   │  @@unique([storeId, slug])                                                            │
   └──┬────────┬────────┬────────┬────────┬────────┬────────┬────────┬────────┬───────────┘
      │ 1:N    │ 1:N    │ 1:1    │ 1:1    │ 1:N    │ 1:N    │ 1:N    │ 1:N    │ 1:N
      ▼        ▼        ▼        ▼        ▼        ▼        ▼        ▼        ▼
 ProductMedia ProductVariant ProductDimension ProductSeo ProductDeliveryZone DigitalAsset InventoryItem ProductAttribute ProductTag
 (images[])   (id,name,price, (weight,length,  (meta...)  (stateId,lgaId,fee) (deliveryType, (available,   (attribute    (tagId)
              stock,sku)      width,height)                DOWNLOAD|          reserved,      → value)
              ↓ 1:N           ↓ 1:1                         LICENSE_KEY|        safetyStock,
              VariantValue    ProductDeliveryOverride       EXTERNAL_ACCESS,    lowStockThreshold,
                              (useStoreDefault,             fileUrl,accessUrl,  policy)
                              requiresShipping,             licenseKey,
                              provider,extraFee,            maxDownloads,
                              extraHandlingDays)            expiresAfterDays)
                                                                ↓ 1:N
                                                          InventoryReservation
                                                          (inventoryItemId, cartItemId?,
                                                           orderItemId?, quantity,
                                                           status: ACTIVE|COMMITTED|
                                                                   RELEASED|EXPIRED,
                                                           expiresAt)

   Product → Category?  (categoryId, nullable, self-referential hierarchy via parentId)
   Product → Brand?     (brandId, nullable)
   Product → DealProduct[] → Deal       (dealType, discountType, discountValue, dealPrice)
   Product → CouponProduct[] → Coupon
   Product → Review[]   (rating, comment, userId, orderId?, isVerifiedPurchase, helpfulCount, vendorReply)
   Product → CartItem[] → Cart → User
   Product → OrderItem[] → Order → (Payment, Escrow, Delivery, Commission, Fulfillment[])
   Product → RelatedProduct[] (RELATED | UPSELL | CROSS_SELL)
   Product → ProductQuestion[] (Q&A)
   Product → AdCampaign[]
   Product → VendorPoolOffer[] (pool resale)
```

**Exact Prisma relation chain from Product → Vendor:**
```
Product.storeId  ──►  Store.id
Store.vendorId   ──►  User.id      (User.role === 'VENDOR')
```
- `apps/api/prisma/schema.prisma:753` — `storeId  String` (NOT nullable)
- `apps/api/prisma/schema.prisma:796` — `store  Store  @relation(fields: [storeId], references: [id], onDelete: Cascade)`
- `apps/api/prisma/schema.prisma:199` — `vendorId  String  @unique` (on Store)
- `apps/api/prisma/schema.prisma:222` — `vendor  User  @relation(fields: [vendorId], references: [id], onDelete: Cascade)` (on Store)
- `apps/api/prisma/schema.prisma:73` — `store  Store?` (back-relation on User; 1:1)

So the "vendor" is a `User` row with `role = VENDOR`, accessed **through** the `Store` record. There is **no** `Seller`, `VendorProfile`, or direct `Product.vendorId` — every product is owned by a Store, and every Store belongs to a vendor User.

---

## 1. Product Schema & Relations

### 1.1 Product model — every field
Source: `apps/api/prisma/schema.prisma:751-835`

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | String | no | `cuid()` | PK |
| `storeId` | String | **no** | — | FK → Store.id (cascade delete) |
| `poolProductId` | String? | yes | — | FK → PoolProduct.id (pool resale link) |
| `name` | String | no | — | |
| `slug` | String | no | — | unique per store: `@@unique([storeId, slug])` |
| `shortDescription` | String? | yes | — | |
| `description` | String? | yes | — | |
| `price` | Float | no | — | selling price |
| `comparePrice` | Float? | yes | — | "was" price (for discount display) |
| `sku` | String? | yes | — | |
| `barcode` | String? | yes | — | |
| `productType` | ProductType | no | `PHYSICAL` | enum: `PHYSICAL \| DIGITAL` (schema:704-707) |
| `productSource` | ProductSource | no | `VENDOR_STOCK` | enum: `VENDOR_STOCK \| POOL_RESALE \| GROUP_BUY` (schema:709-713) |
| `inventoryPolicy` | InventoryPolicy | no | `TRACKED` | enum: `TRACKED \| UNLIMITED \| LICENSE_LIMITED` (schema:715-719) |
| `requiresShipping` | Boolean | no | `true` | |
| `useStoreDeliveryZones` | Boolean | no | `true` | |
| `trackInventory` | Boolean | no | `true` | |
| `stock` | Int | no | `0` | **denormalized** — see §5; canonical stock lives in `InventoryItem.available` |
| `lowStock` | Int | no | `5` | |
| `minOrderQuantity` | Int | no | `1` | |
| `maxOrderQuantity` | Int? | yes | — | |
| `condition` | ProductCondition? | yes | — | enum: `NEW \| USED \| REFURBISHED` (schema:734-738) |
| `isPreorder` | Boolean | no | `false` | |
| `preorderDate` | DateTime? | yes | — | |
| `weight` | Float? | yes | — | shipping weight (canonical dimensions in `ProductDimension`) |
| `status` | ProductStatus | no | `DRAFT` | enum: `ACTIVE \| DRAFT \| ARCHIVED \| PENDING` (schema:697-702) |
| `categoryId` | String? | yes | — | FK → Category.id |
| `brandId` | String? | yes | — | FK → Brand.id |
| `isFeatured` | Boolean | no | `false` | |
| `isPoolProduct` | Boolean | no | `false` | |
| `poolEnabled` | Boolean | no | `false` | |
| `poolBasePrice` | Float? | yes | — | |
| `poolMinSalePrice` | Float? | yes | — | |
| `poolMaxSelectableQuantity` | Int? | yes | — | |
| `poolSourceStoreId` | String? | yes | — | (no FK declared — plain string) |
| `poolSourceProductId` | String? | yes | — | (no FK declared — plain string) |
| `poolSourceBasePrice` | Float? | yes | — | |
| `poolMargin` | Float? | yes | — | |
| `rating` | Float | no | `0` | denormalized avg rating (maintained by `ReviewsService.refreshProductRating`) |
| `reviewCount` | Int | no | `0` | denormalized review count |
| `totalSales` | Int | no | `0` | denormalized sales count |
| `createdAt` | DateTime | no | `now()` | |
| `updatedAt` | DateTime | no | `updatedAt` | |

**Indexes:** `@@unique([storeId, slug])` and `@@index` on storeId, categoryId, brandId, status, isFeatured, productType, productSource, poolProductId, poolEnabled, poolSourceStoreId, poolSourceProductId.

### 1.2 Relations declared on Product
Source: `apps/api/prisma/schema.prisma:796-821`

| Relation | Type | Target | FK | onDelete |
|---|---|---|---|---|
| `store` | N:1 | Store | storeId | Cascade |
| `poolProduct` | N:1? | PoolProduct | poolProductId | (none — restrict) |
| `variants` | 1:N | ProductVariant | productId (back) | Cascade |
| `variantTypes` | 1:N | VariantType | productId (back) | Cascade |
| `images` | 1:N | **ProductMedia** | productId (back) | Cascade |
| `attributes` | 1:N | ProductAttribute | productId (back) | Cascade |
| `dimension` | 1:1? | ProductDimension | productId (back, @unique) | Cascade |
| `seo` | 1:1? | ProductSeo | productId (back, @unique) | Cascade |
| `deliveryZones` | 1:N | ProductDeliveryZone | productId (back) | Cascade |
| `digitalAssets` | 1:N | **DigitalAsset** | productId (back) | Cascade |
| `inventoryItems` | 1:N | **InventoryItem** | productId (back) | Cascade |
| `deliveryOverride` | 1:1? | ProductDeliveryOverride | productId (back, @unique) | Cascade |
| `vendorPoolOffers` | 1:N | VendorPoolOffer | productId (back) | SetNull |
| `sourcePoolOffers` | 1:N | VendorPoolOffer | productId (back, "PoolSourceProduct") | SetNull |
| `category` | N:1? | Category | categoryId | (none — restrict) |
| `brand` | N:1? | Brand | brandId | (none — restrict) |
| `cartItems` | 1:N | CartItem | productId (back) | Cascade |
| `orderItems` | 1:N | OrderItem | productId (back) | **(no onDelete — defaults to Restrict)** |
| `adCampaigns` | 1:N | AdCampaign | productId (back) | Cascade |
| `tags` | 1:N | ProductTag | productId (back) | Cascade |
| `dealProducts` | 1:N | DealProduct | productId (back) | Cascade |
| `couponProducts` | 1:N | CouponProduct | productId (back) | Cascade |
| `reviews` | 1:N | Review | productId (back) | Cascade |
| `questions` | 1:N | ProductQuestion | productId (back) | Cascade |
| `relatedProducts` | 1:N | RelatedProduct | productId (back, "ProductRelations") | Cascade |
| `relatedByProducts` | 1:N | RelatedProduct | productId (back, "RelatedProductRelations") | Cascade |

### 1.3 The "vendor" relation
- The relation field on Product is **`store`** (pointing to the `Store` model).
- The Store model in turn has **`vendorId`** pointing to `User`.
- The User is the "vendor" (`role = VENDOR`).
- There is **no** `Seller`, `VendorProfile`, or direct `Product.vendorId` field.
- `storeId` is **NOT nullable** — a Product cannot exist without a vendor/Store.
- When the frontend shows a vendor on a product card/PDP it reads `product.store` (an object `{id, name, slug}`) returned by the API. See `apps/marketplace/src/lib/api-hooks.ts:67` `store: p.store?.name || "Kwikseller"` and `apps/marketplace/src/components/landing/shared/marketplace-product-card.tsx:145` `<span>{product.store ?? "Verified vendor"}</span>`. The PDP links to `/vendor/${product.storeSlug}`.

### 1.4 ProductVariant model
Source: `apps/api/prisma/schema.prisma:852-870`

```
model ProductVariant {
  id          String   @id @default(cuid())
  productId   String
  name        String
  price       Float
  stock       Int      @default(0)            // ← denormalized stock (canonical is InventoryItem)
  sku         String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  product   Product    @relation(...)
  values    VariantValue[] @relation("VariantValueMap")
  cartItems CartItem[]
  orderItems OrderItem[]
  digitalAssets DigitalAsset[]     // ← variants can have their own digital assets
  inventoryItems InventoryItem[]   // ← variants can have their own inventory rows
  @@index([productId])
}
```

Supporting models:
- `VariantType` (schema:872-882) — defines a variant axis (e.g. "Color", "Size") for a product.
- `VariantValue` (schema:884-896) — possible values for a type (e.g. "Red", "Large"), with optional `hexCode` and `imageUrl`.
- `VariantValue` ↔ `ProductVariant` is many-to-many via the `"VariantValueMap"` relation (a variant can have multiple values, e.g. "Red / Large").

### 1.5 Product images — separate model
Source: `apps/api/prisma/schema.prisma:992-1006`

Images are **NOT** a JSON/string array on Product. They live in a dedicated `ProductMedia` table:

```
model ProductMedia {
  id           String    @id @default(cuid())
  productId    String
  url          String
  mediaType    MediaType @default(IMAGE)      // enum: IMAGE | VIDEO (schema:740-743)
  thumbnailUrl String?
  alt          String?
  position     Int       @default(0)
  isMain       Boolean   @default(false)
  createdAt    DateTime  @default(now())
  product Product @relation(...)
  @@index([productId])
}
```

The service always fetches them via `images: { orderBy: { position: 'asc' } }` (`products.service.ts:31`).

### 1.6 Inventory / quantity — separate model with reservation
Source: `apps/api/prisma/schema.prisma:943-990`

There are **two layers**:

**Layer 1 — `InventoryItem`** (canonical stock record):
```
model InventoryItem {
  id                String          @id @default(cuid())
  productId         String?
  variantId         String?
  storeId           String?
  poolProductId     String?
  sku               String?
  available         Int             @default(0)    ← on-hand units
  reserved          Int             @default(0)    ← allocated to pending orders
  safetyStock       Int             @default(0)
  lowStockThreshold Int             @default(5)
  policy            InventoryPolicy @default(TRACKED)
  ...
}
```

**Layer 2 — `InventoryReservation`** (per-cartitem/orderitem allocation):
```
model InventoryReservation {
  id              String                     @id @default(cuid())
  inventoryItemId String
  cartItemId      String?
  orderItemId     String?
  quantity        Int
  status          InventoryReservationStatus @default(ACTIVE)
  expiresAt       DateTime                              ← 15-min TTL
  ...
}
```
`InventoryReservationStatus` enum: `ACTIVE | COMMITTED | RELEASED | EXPIRED` (schema:727-732).

**Yes**, there IS a reservation/allocation concept. There is **no** `soldQuantity` field; the equivalent is `InventoryItem.reserved`. There is **no** `allocatedQuantity` field (same concept — `reserved`).

The Product table also has a denormalized `stock Int @default(0)` field (schema:769) and `lowStock Int @default(5)` (schema:770). These are legacy/fallback — `ProductsService.mapPublicProduct` (line 1084-1090) sums `inventoryItems[].available` and only falls back to `product.stock` if no inventory items exist.

### 1.7 productType — physical vs digital
Source: `apps/api/prisma/schema.prisma:704-707`

```
enum ProductType {
  PHYSICAL
  DIGITAL
}
```

The field on Product is `productType ProductType @default(PHYSICAL)` (schema:763). It is indexed (`@@index([productType])`).

### 1.8 Digital-product fields
Source: `apps/api/prisma/schema.prisma:919-941`

All digital-product data lives in a separate `DigitalAsset` model (NOT on Product itself):

```
model DigitalAsset {
  id               String              @id @default(cuid())
  productId        String
  variantId        String?                               ← variant-level assets supported
  deliveryType     DigitalDeliveryType @default(DOWNLOAD)
  name             String
  fileUrl          String?                               ← the downloadable file URL
  accessUrl        String?                               ← external access link
  licenseKey       String?                               ← for LICENSE_KEY delivery
  maxDownloads     Int?                                  ← NOT enforced anywhere
  expiresAfterDays Int?                                  ← NOT enforced anywhere
  isActive         Boolean             @default(true)
  createdAt        DateTime            @default(now())
  updatedAt        DateTime            @updatedAt
  product Product @relation(...)
  variant ProductVariant? @relation(...)
  fulfillments Fulfillment[]
  @@index([productId])
  @@index([variantId])
  @@index([isActive])
}

enum DigitalDeliveryType {
  DOWNLOAD
  LICENSE_KEY
  EXTERNAL_ACCESS
}
```

Additionally, on Product itself:
- `requiresShipping Boolean @default(true)` (schema:766) — for digital goods this should be `false`.
- `trackInventory Boolean @default(true)` (schema:768) — digital goods are typically `false`.
- `inventoryPolicy InventoryPolicy @default(TRACKED)` (schema:765) — digital goods default to `UNLIMITED` via the vendor create flow (see §7).

### 1.9 Delivery-related fields on Product
On Product itself:
- `requiresShipping Boolean @default(true)` (schema:766)
- `useStoreDeliveryZones Boolean @default(true)` (schema:767)
- `trackInventory Boolean @default(true)` (schema:768)
- `weight Float?` (schema:776) — shipping weight

Separate delivery-related models:
- **`ProductDeliveryZone`** (schema:619-640) — per-product per-state/LGA delivery fee + days.
- **`ProductDeliveryOverride`** (schema:837-850) — per-product override of store-default delivery: `useStoreDefault`, `requiresShipping`, `provider` (MANUAL/KWIKSELLER), `extraFee`, `extraHandlingDays`, `dispatchNote`.
- **`ProductDimension`** (schema:898-907) — per-product `weight`, `length`, `width`, `height` (1:1).
- Store-level: `StoreDeliverySetting` (schema:559-574), `StoreDeliveryArea` (576-594), `StoreDeliveryZone` (596-617).
- Legacy: `DeliveryRate` (schema:508-522) — global state+LGA → fee table (fallback used in `resolveDeliveryQuote`).

**Note:** there is no `deliveryOptions` JSON field, no `shippingClass`, no `pickupAvailable` / `deliveryAvailable` booleans on Product. The pickup/delivery distinction is implicit via `StoreDeliverySetting.manualDeliveryEnabled` / `kwiksellerDeliveryEnabled`.

### 1.10 Product status fields
Source: `apps/api/prisma/schema.prisma:697-702, 777`

```
enum ProductStatus {
  ACTIVE
  DRAFT
  ARCHIVED
  PENDING
}
```
Field: `status ProductStatus @default(DRAFT)` (schema:777), indexed.

There is **no** `published`, `isActive`, or `availability` field on Product. `isFeatured` (schema:780) is the only visibility-related boolean besides `status`.

### 1.11 Pricing fields
On Product:
- `price Float` (schema:759) — current selling price.
- `comparePrice Float?` (schema:760) — "was" price for discount display.

There is **no** `salePrice`, `currency`, or `taxRate` field on Product. The `Currency` model (schema:1867-1880) exists but is **not linked** to Product — it's a standalone reference table. All prices are implicitly in a single currency (assumed NGN).

### 1.12 Slug, SKU, barcode
- `slug String` (schema:756) — unique per store: `@@unique([storeId, slug])`. Generated by `slugify(name) + '-' + randomUUID().slice(0,6)` in `createVendorProduct` (commerce.service.ts:1513).
- `sku String?` (schema:761).
- `barcode String?` (schema:762).

---

## 2. Product Service & Controller

### 2.1 Endpoints exposed
Source: `apps/api/src/modules/products/products.controller.ts` (full file, 253 lines). All routes are under `/api/v1/products` (global prefix + `@Controller('products')`).

**Public endpoints** (decorated `@Public()`, no auth):
| Method | Path | Handler | Service method |
|---|---|---|---|
| GET | `/search` | `search` (line 46) | `search(dto)` |
| GET | `/trending` | `getTrending` (line 54) | `getTrending(limit)` |
| GET | `/top` | `getTop` (line 62) | `getTop(limit)` |
| GET | `/new` | `getNewArrivals` (line 70) | `getNewArrivals(limit)` |
| GET | `/deals` | `getDeals` (line 78) | `getDeals(limit)` |
| GET | `/categories/list` | `getCategories` (line 86) | `search(new SearchProductsDto())` |
| GET | `/categories/:slug` | `getCategoryProducts` (line 95) | `getCategoryDetail(slug, limit)` |
| GET | `/category/:slug` | `getProductsByCategory` (line 114) | `getCategoryDetail(slug, limit)` (duplicate of above) |
| GET | `/` | `list` (line 132) | `search(dto)` |
| GET | `/home-feed` | `getHomeFeed` (line 140) | `getHomeFeed()` |
| GET | `/home-feed/more` | `getHomeFeedMore` (line 148) | `getHomeFeedMore(dto)` |
| GET | `/slug/:slug` | `getBySlug` (line 157) | `getBySlug(slug)` |
| GET | `/:id` | `getById` (line 170) | `getById(id)` |

**Admin endpoints** (`@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)` — jwt-auth guard + roles guard):
| Method | Path | Handler | Service method |
|---|---|---|---|
| POST | `/` | `create` (line 183) | `create(dto)` |
| PATCH | `/:id` | `update` (line 190) | `update(id, dto)` |
| PATCH | `/:id/status` | `updateStatus` (line 197) | `updateStatus(id, dto)` |
| PATCH | `/:id/featured` | `toggleFeatured` (line 204) | `toggleFeatured(id)` |
| DELETE | `/:id` | `remove` (line 211) | `remove(id)` |
| POST | `/:id/images` | `addImage` (line 218) | `addImage(id, dto)` |
| DELETE | `/:id/images/:imageId` | `removeImage` (line 225) | `removeImage(id, imageId)` |
| POST | `/:id/variants` | `addVariant` (line 232) | `addVariant(id, dto)` |
| PATCH | `/:id/variants/:variantId` | `updateVariant` (line 239) | `updateVariant(id, variantId, dto)` |
| DELETE | `/:id/variants/:variantId` | `removeVariant` (line 250) | `removeVariant(id, variantId)` |

Note: there is **no** `findAllAdmin` route wired in the controller (the service method exists at line 1274 but no `@Get('admin')` calls it). The admin app uses `commerce.service.listVendorProducts` via `/vendor/products` instead.

### 2.2 How products are created (admin path)
Source: `apps/api/src/modules/products/products.service.ts:1344-1403` (`create` method).

```ts
async create(dto: CreateProductDto) {
  if (dto.status === 'ACTIVE') {
    await this.assertStoreDeliverySetupComplete(dto.storeId);   // ← blocks if store.deliverySetupComplete=false
  }
  const slug = dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const product = await this.prisma.product.create({
    data: {
      name: dto.name, slug, storeId: dto.storeId,
      description: dto.description, price: dto.price, comparePrice: dto.comparePrice,
      sku: dto.sku, stock: dto.stock ?? 0, lowStock: dto.lowStock ?? 5,
      status: dto.status || 'DRAFT',
      categoryId: dto.categoryId, brandId: dto.brandId, isFeatured: dto.isFeatured ?? false,
      images: dto.images ? { create: dto.images.map((url, i) => ({ url, position: i, isMain: i === 0 })) } : undefined,
      variants: dto.variants ? { create: dto.variants.map(v => ({ name: v.name, price: v.price, stock: v.stock ?? 0, sku: v.sku, values: v.variantValueIds?.length ? { connect: v.variantValueIds.map(id => ({ id })) } : undefined })) } : undefined,
    },
    include: { images, variants, category, brand, store },
  });
  return product;
}
```

The admin path:
- **Requires a `storeId`** (DTO field `storeId: string`, validated) — so even the admin must specify which vendor's store the product belongs to.
- Does **NOT** create an `InventoryItem` — only sets the denormalized `Product.stock` (this is a divergence from the vendor path which DOES create an InventoryItem — see §7).
- Does **NOT** set `productType` (defaults to `PHYSICAL`), `requiresShipping` (defaults to `true`), `inventoryPolicy` (defaults to `TRACKED`). The admin `CreateProductDto` (product-admin.dto.ts:15-88) has **no** `productType` field at all.
- Variants ARE created in the same request (if `dto.variants` provided).

### 2.3 How products are listed / filtered / searched
Source: `apps/api/src/modules/products/products.service.ts` — `search` method (the central listing path; called by `/`, `/search`, `/categories/list`).

The flow:
1. Build a Prisma `where` clause from `SearchProductsDto` filters: `q`/`search` (freetext via `contains` on name + description + shortDescription + sku), `category`/`categoryId`, `brandId`, `storeId`, `minPrice`/`maxPrice`, `rating` (via `rating: { gte }`), `state` (via Store → StoreDeliveryZone subquery). Always restricts to `status: 'ACTIVE'`. (`buildSearchWhere`, lines ~600-700.)
2. Always restricts to `status: 'ACTIVE'`.
3. Fetches a candidate set (capped at 200) with `publicProductInclude` (images, variants, category, store, brand, inventoryItems — line 30-41).
4. If `sort === 'relevance'` and a `q` is present, runs a TypeScript relevance ranker (`rankProducts`, lines 763-858) that scores each product by weighted token matches across name / shortDescription / description / sku / category / store / brand / tags.
5. Applies offset or cursor pagination after ranking.
6. Returns `meta.facets` (categories, brands, stores, states, priceRange) computed by separate `groupBy`/`aggregate` queries (lines 863-1056) — each facet excludes the currently-applied filter so the UI can show "other options".

### 2.4 Product detail fetch
Source: `products.service.ts:1105-1161` — `getById` and `getBySlug`.

Both use the same include shape:
```ts
include: {
  images: { orderBy: { position: 'asc' } },
  variants: { orderBy: { createdAt: 'asc' } },
  category: { select: { id, name, slug } },
  store:    { select: { id, name, slug } },
  brand:    { select: { id, name, slug } },
  attributes: { include: { attribute: true } },
  reviews: {
    where: { isApproved: true },
    include: { user: { select: { id, profile: { select: { firstName, lastName, avatarUrl } } } } },
    orderBy: [{ helpfulCount: 'desc' }, { createdAt: 'desc' }],
  },
  inventoryItems: { select: { available, reserved, lowStockThreshold } },
}
```

Notable: `digitalAssets`, `deliveryZones`, `deliveryOverride`, `dimension`, `seo`, `tags` are **NOT** included on the public detail endpoint. The frontend cannot see digital asset URLs via this path — only via the vendor storefront endpoint (`getPublicStoreProduct`, commerce.service.ts:1398-1429, which DOES include `digitalAssets`).

### 2.5 How inventory / quantity is read
`mapPublicProduct` (products.service.ts:1058-1103) computes the public `stock` field as:
```ts
stock: product.inventoryItems?.reduce(
  (sum, item) => sum + (item.available ?? 0), 0
) || product.stock
```
So it sums `InventoryItem.available` across all inventory rows for the product, falling back to the denormalized `Product.stock` only if no inventory items exist. `reserved` is fetched but **not** exposed in the public shape (it's used internally for "available for purchase" = available − reserved checks during cart validation).

### 2.6 How inventory is modified — NOT in products.service.ts
`products.service.ts` only mutates `Product.stock` (denormalized) via:
- `create` (line 1364): `stock: dto.stock ?? 0`
- `update` (line 1420): `if (dto.stock !== undefined) data.stock = dto.stock;`
- `addVariant` (line 1534): `stock: dto.stock ?? 0` (on the variant, not product)
- `updateVariant` (line 1557): `if (dto.stock !== undefined) data.stock = dto.stock;`

These all touch the **denormalized** `stock` field — none of them touch `InventoryItem` or `InventoryReservation`. The canonical inventory mutations all live in `commerce.service.ts` (see §5).

### 2.7 Digital vs physical handling in products.service.ts
**None.** There is no occurrence of `digital`, `download`, `accessLink`, `fulfillment`, `DigitalAsset`, `deliveryType`, or `productType === 'DIGITAL'` anywhere in `apps/api/src/modules/products/` (verified via grep — 0 matches). The `productType` field is passed through unchanged by `mapPublicProduct` (line 1079) but no service logic branches on it.

### 2.8 Snapshot logic
**No product snapshot is taken when a product is added to cart or ordered.** The only snapshot in the system is `Order.deliveryRateSnapshot` (a JSON string capturing delivery fee/days/location at checkout — commerce.service.ts:744, 3155, 3197).

The OrderItem stores `unitPrice` and `totalPrice` (commerce.service.ts:755-756) which ARE captured from the cart item's price at checkout time. But there is **no** snapshot of product name, image, slug, description, or any other product field on OrderItem — only the FK `productId` (with `onDelete` defaulting to Restrict, so a product with order items cannot be deleted).

The cart item's price is set at add-to-cart time (commerce.service.ts:405):
```ts
price: product.salePrice ?? product.price,
```
**Bug:** `product.salePrice` does not exist on the Product model. The `??` operator means this silently falls back to `product.price` always. So the cart item price = the live product price at the moment of adding to cart. If the vendor later changes the price, the cart item keeps the old price (until the cart is re-evaluated).

---

## 3. Product → Vendor Relationship

### 3.1 Exact Prisma relation chain
```
Product.storeId  ──►  Store.id        (schema:753, 796)
Store.vendorId   ──►  User.id         (schema:199, 222)   ← User.role === 'VENDOR'
```

### 3.2 Is the vendor a User, Seller, Store, or VendorProfile?
The vendor is a **`User`** row with `role = VENDOR` (schema:64 `role UserRole @default(BUYER)`; enum `VENDOR` at schema:17). It is accessed **through** the `Store` record — there is no direct `Product.vendorId`.

- **`Store`** (schema:197-234) is the vendor's shop/profile record. One Store per vendor (`vendorId String @unique`). Holds name, slug, logoUrl, bannerUrl, isVerified, onboardingComplete, deliverySetupComplete, bank details, etc.
- There is **no** `Seller` model.
- There is **no** `VendorProfile` model. The `apps/api/src/modules/vendor-profile/` directory exists but `vendor-profile.controller.ts` and `vendor-profile.module.ts` only — it does not define a separate Prisma model; it appears to be a thin REST wrapper around the Store/User data.
- The `apps/api/src/modules/vendor-store/` module (renamed from `store/` per worklog VENDOR-RENAME-UPLOAD-FIX) manages the `Store` Prisma model via the `@Controller('vendor/shop')` route (no "store" in the URL).

### 3.3 Can a product exist without a vendor?
**No.** `storeId String` (schema:753) is NOT nullable. `Product.store` is a required N:1 relation with `onDelete: Cascade` — if the Store is deleted, all its Products are deleted.

### 3.4 What field/relation does the frontend read for the vendor?
The frontend reads `product.store` — an object `{id, name, slug}` returned by the API. Specifically:
- `apps/marketplace/src/lib/api-hooks.ts:67` — `store: p.store?.name || "Kwikseller"` (flattens to a string for the MarketplaceProduct type).
- `apps/marketplace/src/lib/api-hooks.ts:68-69` — `storeId: p.storeId`, `storeSlug: p.store?.slug`.
- `apps/marketplace/src/components/landing/shared/marketplace-product-card.tsx:145` — `<span className="line-clamp-1">{product.store ?? "Verified vendor"}</span>`.
- `apps/marketplace/src/components/product/product-detail-page.tsx:530-532` — renders `product.store` (the name) and links to `/vendor/${product.storeSlug}` (the VendorSummary component at line 649-654 receives `storeName`/`storeSlug`/`storeId`).

So although the API exposes `store` (the Store object), the marketplace UI consistently labels it as the "vendor" in user-facing copy.

---

## 4. Product → Category, Brand, Deals, Reviews

### 4.1 Category
Source: `apps/api/prisma/schema.prisma:1030-1049`

```
model Category {
  id          String     @id @default(cuid())
  name        String
  slug        String     @unique
  parentId    String?                              ← hierarchical (self-relation)
  imageUrl    String?
  icon        String?
  isActive    Boolean    @default(true)
  position    Int        @default(0)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  parent   Category?  @relation("CategoryTree", fields: [parentId], references: [id])
  children Category[] @relation("CategoryTree")
  products Product[]
  couponCategories CouponCategory[]
  @@index([parentId])
  @@index([isActive])
}
```

- **Single category per product** (`Product.categoryId String?`, schema:778 — nullable).
- **Hierarchical** via `parentId` self-relation named `"CategoryTree"` — a category can have a parent and many children. There's no depth limit enforced in schema.
- A product references exactly one category (or none); there is no ProductCategory join table for many-to-many.

### 4.2 Brand
Source: `apps/api/prisma/schema.prisma:365-377`

```
model Brand {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  image       String?
  status      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  products Product[]
  @@index([status])
}
```

- **Single brand per product** (`Product.brandId String?`, schema:779 — nullable).
- Brand is a flat list (no hierarchy, no parent brand).
- `status Boolean` (not an enum) — `true` = active.

### 4.3 Deals / Discounts
Source: `apps/api/prisma/schema.prisma:408-458`

```
enum DealType {
  FLASH_DEAL
  DEAL_OF_THE_DAY
  FEATURED_DEAL
  COUPON
}

enum DiscountType {
  PERCENTAGE
  FIXED_AMOUNT
}

model Deal {
  id            String       @id @default(cuid())
  title         String
  description   String?
  imageUrl      String?
  dealType      DealType     @default(FLASH_DEAL)
  discountType  DiscountType @default(PERCENTAGE)
  discountValue Float        @default(0)
  startDate     DateTime
  endDate       DateTime?
  minOrderValue Float        @default(0)
  maxUses       Int?
  usedCount     Int          @default(0)
  isActive      Boolean      @default(true)
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  products DealProduct[]
  @@index([dealType])
  @@index([isActive])
  @@index([startDate])
}

model DealProduct {
  id         String   @id @default(cuid())
  dealId     String
  productId  String
  dealPrice  Float                                      ← per-product deal price
  createdAt  DateTime @default(now())
  deal    Deal    @relation(...)
  product Product @relation(...)
  @@unique([dealId, productId])                          ← one product per deal
  @@index([dealId])
}
```

- A Deal applies to a product via the `DealProduct` join table (many-to-many).
- Each DealProduct has its own `dealPrice` — the deal price for that specific product.
- The Deal itself has `discountType` (PERCENTAGE or FIXED_AMOUNT) and `discountValue` — these are global to the deal, while `dealPrice` is per-product.
- **No automatic application**: there is no service code that computes "the current deal price for product X" by checking active deals. The `ProductsService.getDeals` method (line 1207-1230) just filters products that have a `comparePrice > price` and computes `discountPercent` from those two fields — it does NOT consult the Deal/DealProduct tables. The Deal module (`deals.service.ts`) is admin-only CRUD; no consumer-facing "apply deal to cart" logic exists in `commerce.service.ts` checkout.

### 4.4 Reviews
Source: `apps/api/prisma/schema.prisma:1796-1820`

```
model Review {
  id          String   @id @default(cuid())
  productId   String
  userId      String
  orderId     String?                              ← optional purchase verification
  rating      Int                                   ← 1-5
  title       String?
  comment     String?
  images      String?                              ← JSON-encoded string[] (parsed by ReviewsService.parseImages)
  isApproved  Boolean  @default(false)
  isVerifiedPurchase Boolean @default(false)
  helpfulCount Int     @default(0)
  vendorReply String?
  vendorRepliedAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  product Product @relation(...)
  user    User    @relation(...)
  order   Order?  @relation(...)
  @@index([productId])
  @@index([userId])
  @@index([orderId])
}
```

- A Review links to Product (required), User (required), and optionally Order (for purchase verification).
- `rating` is an Int (1-5, enforced by DTO `@Min(1) @Max(5)` in `reviews/dto/review.dto.ts`).
- `images` is a JSON-encoded string column (NOT a separate table) — `ReviewsService.parseImages` (line 71-82) parses it to `string[]` for the client.
- `isVerifiedPurchase` is set to `true` only when the user has a DELIVERED order containing the product (`ReviewsService.createReview` line 217-284 calls `userHasPurchasedProduct` which checks `Order.status === 'DELIVERED'`).
- `isApproved` is set to `true` immediately (auto-approve, line 270).
- After creating a review, `refreshProductRating` (line 338-352) recomputes and updates `Product.rating` and `Product.reviewCount`.
- `vendorReply` + `vendorRepliedAt` exist for vendor responses — but no endpoint to add a vendor reply was found in `reviews.controller.ts` (only the buyer-facing create + helpful endpoints are exposed; vendor reply may be in another module).

---

## 5. Inventory / Quantity Model

### 5.1 Reservation vs single integer
**Yes, there is a full reservation/allocation concept.** Two layers:

1. **`InventoryItem`** (schema:943-968) — the stock record. Has:
   - `available Int` — on-hand units not allocated to any order.
   - `reserved Int` — units allocated to pending (unpaid) orders.
   - `safetyStock Int` — buffer (not currently enforced in any logic).
   - `lowStockThreshold Int` — for low-stock alerts.
   - `policy InventoryPolicy` — TRACKED / UNLIMITED / LICENSE_LIMITED.
   - Linked to one of: `productId`, `variantId`, `poolProductId`, `storeId` (all nullable — at least one should be set).

2. **`InventoryReservation`** (schema:970-990) — the per-line-item allocation record. Has:
   - `inventoryItemId` (FK).
   - `cartItemId?` (FK, nullable — SetNull on delete).
   - `orderItemId?` (FK, nullable — SetNull on delete).
   - `quantity Int`.
   - `status InventoryReservationStatus` — ACTIVE / COMMITTED / RELEASED / EXPIRED.
   - `expiresAt DateTime` — TTL (15 minutes, see `RESERVATION_MINUTES = 15` at commerce.service.ts:78).

The flow:
1. **Add to cart** — no reservation created (cart is just a wishlist with prices until checkout).
2. **Checkout / order creation** (commerce.service.ts:749-779) — for each OrderItem, `reserveInventoryForOrderItem` (line 2627-2677) is called: it finds an InventoryItem with `available >= quantity`, decrements `available`, increments `reserved`, and creates an ACTIVE InventoryReservation with a 15-min expiry.
3. **Payment success** (commerce.service.ts:2706 `processSuccessfulPayment`) — calls `commitReservations` (line 2999-3012): for each ACTIVE reservation, decrements `reserved` (the units are now truly "sold" — they were already removed from `available` at reserve time) and marks the reservation COMMITTED.
4. **Payment failure / cancellation** — calls `releaseReservations` (line 3014-3034): for each ACTIVE reservation, increments `available`, decrements `reserved`, marks RELEASED.
5. **Expiry sweep** (commerce.service.ts:~2540 `releaseExpiredReservations`) — finds ACTIVE reservations past their `expiresAt`, releases them (same as above), and cancels the parent order if it was PENDING_PAYMENT or PENDING. Triggered manually via `POST /admin/inventory/reservations/release-expired` (commerce.controller.ts:396-399).

### 5.2 Where is quantity deducted?
- **Reserve (decrement `available`, increment `reserved`):** at order creation (checkout), in `reserveInventoryForOrderItem` (commerce.service.ts:2660-2666).
- **Commit (decrement `reserved`):** on payment success, in `commitReservations` (commerce.service.ts:3002-3005).
- **Release (increment `available`, decrement `reserved`):** on payment failure (commerce.service.ts:3021-3027) or expiry (commerce.service.ts:2553-2559).
- **Manual adjust (increment/decrement `available`):** vendor endpoint `POST /vendor/inventory/adjustments` → `adjustInventory` (commerce.service.ts:1706-1737) — adds `quantityDelta` (can be negative) to `available`.

### 5.3 Are there `reservedQuantity` / `allocatedQuantity` / `soldQuantity` fields?
- `reservedQuantity` → equivalent is `InventoryItem.reserved` (schema:951).
- `allocatedQuantity` → same field, `InventoryItem.reserved`.
- `soldQuantity` → **does not exist**. Once a reservation is COMMITTED, the units are simply gone from both `available` and `reserved` (they were decremented from `available` at reserve time and from `reserved` at commit time). There's no cumulative "units sold" counter on InventoryItem. (`Product.totalSales` exists at schema:792 but is never incremented anywhere in the audited code — it's a dead field.)

### 5.4 Every place inventory is mutated (full enumeration)
Searched `apps/api/src/` for `inventoryItem.update` / `inventoryItem.create` and stock-mutating patterns. All mutations live in `apps/api/src/modules/commerce/commerce.service.ts`:

| Line | Method | Operation | Context |
|---|---|---|---|
| 1719 | `adjustInventory` | `inventoryItem.create` (if no existing row) | Vendor manual adjustment via POST /vendor/inventory/adjustments |
| 1731 | `adjustInventory` | `inventoryItem.update` (`available: inventory.available + dto.quantityDelta`) | Vendor manual adjustment (existing row) |
| 2553 | `releaseExpiredReservations` | `inventoryItem.update` (`available: { increment }, reserved: { decrement }`) | Expiry sweep (ACTIVE → EXPIRED) |
| 2660 | `reserveInventoryForOrderItem` | `inventoryItem.update` (`available: { decrement }, reserved: { increment }`) | Order creation (reserve stock) |
| 3002 | `commitReservations` | `inventoryItem.update` (`reserved: { decrement }`) | Payment success (commit reservation) |
| 3021 | `releaseReservations` | `inventoryItem.update` (`available: { increment }, reserved: { decrement }`) | Payment failure/cancel (release reservation) |

Plus the InventoryItem is **created** (not mutated) in:
- `createVendorProduct` (commerce.service.ts:1543-1555) — when a vendor creates a tracked product, an initial InventoryItem is created with `available: initialStock, reserved: 0`.

The denormalized `Product.stock` field is mutated separately (and inconsistently) in `products.service.ts`:
- Line 1364: `create` — `stock: dto.stock ?? 0`
- Line 1420: `update` — `if (dto.stock !== undefined) data.stock = dto.stock;`
And in `commerce.service.ts`:
- Line 1526: `createVendorProduct` — `stock: initialStock`

These product-stock writes are **never reconciled** with the canonical InventoryItem.available. After creation, only InventoryItem is touched by the reserve/commit/release flow — `Product.stock` drifts and becomes stale.

---

## 6. Digital Product Handling

### 6.1 Existing logic for digital delivery
**Yes, but minimal.** The schema is well-modelled (`DigitalAsset` + `Fulfillment` with `type=DIGITAL_ACCESS`), and there is exactly one piece of runtime logic:

**`createFulfillmentsForPaidOrder`** (commerce.service.ts:3036-3083):
```ts
for (const item of order.items ?? []) {
  if (existingByItem.has(item.id)) continue;
  if (item.productType === 'DIGITAL') {
    const digitalAsset = item.product?.digitalAssets?.find((asset) => asset.isActive);
    if (!digitalAsset) {
      await tx.fulfillment.create({
        data: { orderId, orderItemId: item.id, type: 'DIGITAL_ACCESS', status: 'FAILED' },
      });
      continue;
    }
    await tx.fulfillment.create({
      data: {
        orderId, orderItemId: item.id, type: 'DIGITAL_ACCESS', status: 'READY',
        digitalAssetId: digitalAsset.id,
        accessUrl: digitalAsset.accessUrl ?? digitalAsset.fileUrl,   // ← copied at fulfillment time
      },
    });
    await tx.orderItem.update({
      where: { id: item.id }, data: { fulfillmentStatus: 'READY' },
    });
  } else {
    await tx.fulfillment.create({
      data: { orderId, orderItemId: item.id, type: 'PHYSICAL_MANUAL', status: 'PENDING' },
    });
  }
}
```

So on successful payment, for each DIGITAL order item, the service:
1. Finds the first active `DigitalAsset` linked to the product.
2. Creates a `Fulfillment` row with `type=DIGITAL_ACCESS`, `status=READY`, and copies the `accessUrl` (or `fileUrl` as fallback) onto the fulfillment.
3. Marks the OrderItem's `fulfillmentStatus` as `READY`.

If no active digital asset exists, it creates a `FAILED` fulfillment (the buyer gets nothing — there's no retry mechanism or notification).

### 6.2 What's MISSING for digital delivery
- **No email/notification to the buyer.** The `accessUrl` is written to the Fulfillment row but nothing pushes it to the buyer (no email, no in-app notification, no push). The buyer would have to poll their order to discover the access URL.
- **No signed/expiring URL.** `digitalAsset.accessUrl` / `fileUrl` are plain strings — whoever has the URL has it forever. The `StorageService.generateSignedUrl` method exists (storage.service.ts:268-281) but is **never called** by the digital-asset flow.
- **No download counter.** `DigitalAsset.maxDownloads` exists (schema:928) but is never checked or decremented. A buyer (or anyone with the URL) can download unlimited times.
- **No expiry enforcement.** `DigitalAsset.expiresAfterDays` exists (schema:929) but is never compared against the fulfillment date or "now". Access never expires.
- **No license-key issuance.** For `deliveryType=LICENSE_KEY`, the `licenseKey` field exists on DigitalAsset but the fulfillment flow just copies `accessUrl ?? fileUrl` — it does NOT surface the `licenseKey` on the Fulfillment row, and there's no logic to "consume" a key from a pool.
- **No variant-specific asset selection.** DigitalAsset has a `variantId` field, but `createFulfillmentsForPaidOrder` only does `item.product?.digitalAssets?.find(asset => asset.isActive)` — it ignores the order item's `variantId` and may pick a variant-agnostic asset when a variant-specific one exists.

### 6.3 File storage / upload mechanism tied to digital products
**No.** There is no `uploadDigitalAsset` method anywhere. The `StorageService` (apps/api/src/common/services/storage.service.ts) has:
- `uploadFile` (generic)
- `uploadImage` (with sharp resize)
- `uploadProfileImage`
- `uploadKycDocument`
- `uploadStoreAsset` (logo/banner)
- `uploadProductImage` (line 350-378 — uploads to `stores/${storeId}/products/${productId}/image-${position}`)

There is **no** `uploadDigitalAsset` / `uploadDigitalFile` method. A vendor wanting to attach a downloadable file to a digital product would have to manually host it somewhere and pass the URL to `POST /vendor/digital-assets` (commerce.controller.ts:266-269 → `addDigitalAsset` → commerce.service.ts:1739-1752), which just stores the URL string.

### 6.4 CRITICAL: The Upload module is missing
The `apps/api/src/modules/upload/` directory **does not exist** on disk (verified via `ls` — `No such file or directory`). However:
- `apps/api/src/app.module.ts:22` imports `UploadModule` from `'./modules/upload/upload.module'`
- `apps/api/src/app.module.ts:149` registers `UploadModule` in the imports array
- `apps/api/src/app.module.ts:234` logs `'📤 UploadModule loaded'`
- `apps/api/src/modules/vendor-store/vendor-store.module.ts:2,7` imports `UploadModule`
- `apps/api/src/modules/vendor-store/vendor-store.service.ts:9,42` imports `UploadService`

This means **the API cannot boot** — the import will fail at startup with `Cannot find module './modules/upload/upload.module'`. The worklog entry `VENDOR-RENAME-UPLOAD-FIX` claims the upload module was restored, but the files are not present in the current working tree. This blocks every API request, including all product endpoints.

(The marketplace dev.log shows the Next.js frontend running on port 3000, but no API log was found — consistent with the API being unable to start.)

---

## 7. Product Creation Flow (Vendor side)

### 7.1 Endpoint
`POST /api/v1/vendor/products` (commerce.controller.ts:237-240, guarded by `JwtAuthGuard` — no `@Roles` decorator, so any authenticated user can call it; the service enforces the VENDOR role internally via `resolveStoreId`).

### 7.2 Service method
`CommerceService.createVendorProduct` (commerce.service.ts:1478-1561).

### 7.3 Required vs optional fields
Source: `CreateVendorProductDto` (commerce.dto.ts:192-275).

**Required:**
- `name: string`
- `price: number` (≥ 0)
- `productType: 'PHYSICAL' | 'DIGITAL'` (validated against `PRODUCT_TYPES` constant, commerce.dto.ts:14)

**Optional:**
- `description`, `comparePrice`, `sku`, `categoryId`, `brandId`
- `productSource` (VENDOR_STOCK | POOL_RESALE | GROUP_BUY)
- `requiresShipping`, `trackInventory`
- `inventoryPolicy` (TRACKED | UNLIMITED | LICENSE_LIMITED)
- `status` (ACTIVE | DRAFT | ARCHIVED | PENDING) — defaults to DRAFT
- `initialStock`, `lowStock`
- `images: string[]` (URLs)
- `poolEnabled`, `poolBasePrice`, `poolMinSalePrice`, `poolMaxSelectableQuantity`

### 7.4 Is productType selectable?
**Yes** — `productType` is a required field on `CreateVendorProductDto` (commerce.dto.ts:221-222, `@IsIn(PRODUCT_TYPES)` where `PRODUCT_TYPES = ['PHYSICAL', 'DIGITAL']`).

The service derives inventory behaviour from it (commerce.service.ts:1480-1483):
```ts
const isPhysical = dto.productType === 'PHYSICAL';
const inventoryPolicy = dto.inventoryPolicy ?? (isPhysical ? 'TRACKED' : 'UNLIMITED');
const trackInventory = dto.trackInventory ?? inventoryPolicy === 'TRACKED';
const initialStock = isPhysical && trackInventory ? Number(dto.initialStock ?? 0) : 0;
```

So a DIGITAL product defaults to `inventoryPolicy=UNLIMITED`, `trackInventory=false`, `initialStock=0` — and no InventoryItem is created for it (line 1543-1545: `inventoryItems: !trackInventory ? undefined : { create: ... }`).

### 7.5 Vendor association
`resolveStoreId(user)` (commerce.service.ts:121-183):
1. If `user.storeId` is already on the JWT payload, use it.
2. Otherwise, look up `Store` by `vendorId = userId`.
3. If no Store exists, **auto-create one** with name = user's profile name (or email prefix or "Vendor Store"), slug = `slugify(name)-UUID6`, category = 'other'. Also auto-creates a `StorefrontDesign` and `StoreDeliverySetting` (manualDeliveryEnabled=true, kwiksellerDeliveryEnabled=false, processingDays=1).

So a vendor can create a product even without first setting up a store — the store is lazily created.

### 7.6 Publishing checks
If `dto.status === 'ACTIVE'` (i.e., the vendor wants to publish immediately), two checks run (commerce.service.ts:1499-1508):

1. `assertProductCanPublish` (line 250-267):
   - Requires `categoryId` (else: "Publishing requires a category").
   - Requires at least 1 image (else: "Publishing requires at least one product image").
   - Requires `price > 0` (else: "Publishing requires a valid price").
   - For tracked physical products, requires `stock ≥ 1` (else: "Publishing tracked physical products requires available stock").

2. `assertStoreDeliverySetupComplete` (line 3426-3434):
   - Loads `Store.deliverySetupComplete`.
   - If `false` (or null), throws "Complete store delivery zones before publishing products".

**Bug:** `Store.deliverySetupComplete` (schema:218, default `false`) is **never set to `true`** anywhere in the audited codebase. There is no endpoint in `vendor-store.controller.ts` or `commerce.controller.ts` that updates this field after the vendor configures delivery zones. This means **no vendor can publish a product** (status=ACTIVE) through the vendor flow — they can only save as DRAFT. (Products can still be made ACTIVE via the admin path, which has the same check but presumably an admin could manually flip the DB flag.)

### 7.7 Are variants created in the same request?
**No** — `CreateVendorProductDto` has **no** `variants` field (commerce.dto.ts:192-275). Variants can only be added via:
- Admin endpoint `POST /products/:id/variants` (products.controller.ts:229-234, `@Roles(ADMIN, SUPER_ADMIN)`).
- There is **no vendor-facing variant creation endpoint**. Vendors cannot create variants for their own products.

This is a significant gap — the vendor product form cannot create variants.

---

## 8. Gaps & Observations

### 8.1 Missing vs the intended product model

| Intended capability | Status | Notes |
|---|---|---|
| Physical vs digital distinction | ✅ Schema supports it | `productType PHYSICAL \| DIGITAL`, `DigitalAsset` model, `requiresShipping`, `inventoryPolicy` (UNLIMITED for digital). But see delivery gaps below. |
| Digital delivery (download link, access link, license key) | ⚠️ Partial | `DigitalAsset` + `Fulfillment.type=DIGITAL_ACCESS` exists, but no email/push delivery, no signed URLs, no maxDownloads enforcement, no expiry enforcement, no license-key issuance logic. |
| Digital file upload | ❌ Missing | No `uploadDigitalAsset` method; the entire `upload/` module is missing from disk and the API cannot boot. |
| Inventory reservation | ✅ Implemented | `InventoryItem.available` + `reserved` + `InventoryReservation` with 15-min TTL, commit on payment, release on failure/expiry. |
| Snapshots (product at order time) | ⚠️ Partial | Only `unitPrice`/`totalPrice` on OrderItem and `deliveryRateSnapshot` on Order. NO snapshot of product name/image/slug/description — historical orders will display whatever the live product shows (or break if product is renamed/deleted). |
| Delivery fields (deliveryOptions, shippingClass, pickupAvailable, deliveryAvailable, weight, dimensions) | ⚠️ Partial | `weight` on Product + `ProductDimension` (length/width/height) + `ProductDeliveryZone` + `ProductDeliveryOverride` + `StoreDeliverySetting`/`Zone`/`Area`. No `pickupAvailable`/`deliveryAvailable` booleans (implicit via StoreDeliverySetting flags). No `shippingClass` field. |
| Currency / taxRate per product | ❌ Missing | No `currency` or `taxRate` field on Product. Single-currency assumed. `Currency` model exists but is unlinked. |
| Vendor quote step (Place Order → Vendor Quote → Payment → …) | ❌ Missing | The current flow is: Add to Cart → Checkout (reserve inventory + create PENDING_PAYMENT order + Paystack intent) → Pay → commit reservations + create fulfillments. There is NO step where the vendor confirms or quotes before payment. The order goes straight to PENDING_PAYMENT. |
| Escrow (Kwikscrow) | ⚠️ Out of scope | `Escrow` model + `apps/api/src/payments/escrow.service.ts` exist, but the linkage from `processSuccessfulPayment` → escrow creation was not visible in commerce.service.ts. (Separate audit needed for the payments module.) |
| Wallet release to vendor | ⚠️ Out of scope | `Wallet` model + `apps/api/src/payments/wallet.service.ts` exist. Not audited here. |

### 8.2 Inconsistencies

1. **"store" vs "vendor" naming split.** The Prisma model is `Store` (and `Product.storeId`), but the frontend and routes consistently use "vendor" (`/vendor/:slug`, `product.store` rendered as "vendor"). The previous agent (VENDOR-RENAME-UPLOAD-FIX) renamed routes from `/stores` → `/vendors` and `/store` → `/vendor/shop` but kept the Prisma `Store` model. This is intentional (per the worklog) but creates a cognitive mismatch: the API returns `store` objects that the UI labels as "vendor".

2. **`Product.stock` is denormalized and drifts.** `createVendorProduct` sets BOTH `Product.stock = initialStock` AND creates an `InventoryItem.available = initialStock`. All subsequent mutations only touch `InventoryItem`. `mapPublicProduct` prefers the InventoryItem sum. So `Product.stock` is set-once-then-stale. The admin `products.service.ts` `create`/`update` methods ONLY touch `Product.stock` and never touch `InventoryItem` — so admin-created products have no canonical inventory row, and the public `stock` field will silently fall back to the denormalized value.

3. **`product.salePrice` referenced but doesn't exist.** `commerce.service.ts:405` (addCartItem): `price: product.salePrice ?? product.price`. There is no `salePrice` field on Product (verified in schema). The `??` operator silently falls back to `product.price` every time. This is dead code / latent bug — either `salePrice` was planned but never added, or it should be removed.

4. **`Store.deliverySetupComplete` is never set to true.** `assertStoreDeliverySetupComplete` blocks product publishing when this is false, but no code path sets it to true. Vendors cannot publish via the vendor flow.

5. **Digital asset selection ignores variant.** `createFulfillmentsForPaidOrder` (commerce.service.ts:3045) finds the first active DigitalAsset on the product, ignoring `item.variantId`. A vendor who sets up variant-specific digital assets (e.g., different download per variant) will have the wrong asset delivered.

6. **`Product.totalSales` is a dead field.** Schema:792, never incremented anywhere. `getTrending` (products.service.ts:1178) sorts by `totalSales: 'desc'` — so trending is effectively sorted by rating/updatedAt since all totalSales are 0.

7. **`safetyStock` is a dead field.** Schema:952 on InventoryItem. Never checked in any reserve/commit/release logic. Intended use would be "don't reserve below safetyStock" but that guard is absent.

8. **Two category endpoints with identical behavior.** `GET /products/categories/:slug` and `GET /products/category/:slug` (products.controller.ts:91-126) both call `getCategoryDetail`. One is redundant.

9. **Admin `CreateProductDto` has no `productType` field** (product-admin.dto.ts:15-88). Admin-created products always default to `PHYSICAL`. The admin cannot create digital products through the admin endpoint — only the vendor endpoint supports it.

10. **`ProductMedia.mediaType` supports VIDEO** (schema:740-743, enum IMAGE|VIDEO) but no upload endpoint or service logic handles video — `StorageService.uploadProductImage` only accepts `image/*` mimetypes (storage.service.ts:356-358).

### 8.3 Dead code / unused fields
- `Product.stock` — superseded by `InventoryItem.available` (kept as fallback).
- `Product.totalSales` — never incremented.
- `InventoryItem.safetyStock` — never checked.
- `DigitalAsset.maxDownloads` — never enforced.
- `DigitalAsset.expiresAfterDays` — never enforced.
- `Product.poolSourceStoreId`, `poolSourceProductId`, `poolSourceBasePrice`, `poolMargin` — stored on Product AND mirrored on `VendorPoolOffer`. The create flow (commerce.service.ts:1510-1542) does NOT set these on Product when creating a pool-enabled product; they're only set when a pool offer is created (separate flow). Potential for drift.
- `ProductsService.findAllAdmin` (line 1274) — service method exists but no controller route calls it.
- `ProductsController.getCategories` (line 86) — calls `search(new SearchProductsDto())` which returns products, not categories. The route name is misleading.

### 8.4 Blockers for the intended order flow
The user's intended flow: **Place Order → Vendor Quote → Payment → Kwikscrow → Delivery → Confirm → Release → Wallet**.

**Blockers:**

1. **API cannot boot** — the `apps/api/src/modules/upload/` directory is missing but is imported by `app.module.ts`, `vendor-store.module.ts`, and `vendor-store.service.ts`. Until the upload module is restored (or the imports removed), NO product endpoint works. This is the #1 blocker.

2. **No "Vendor Quote" step.** The current checkout creates an Order with `status=PENDING_PAYMENT` and immediately creates a Paystack payment intent. There is no intermediate state where the vendor reviews the order and provides a quote (adjusted price, delivery fee, availability confirmation). The schema's `OrderStatus` enum has `PENDING_PAYMENT` and `PENDING` but no `AWAITING_QUOTE` or `QUOTED` status. The `OrderOperationsService` (order-operations.service.ts:85-91) only supports transitions: accept (→CONFIRMED), reject (→CANCELLED), prepare (→PROCESSING), ready (→FULFILLED), cancel (→CANCELLED). The "accept" transition requires the order to be in `PENDING` or `PAID` — so the vendor can only accept AFTER payment, not before. To support a vendor-quote flow, you'd need a new status (e.g., `AWAITING_VENDOR_QUOTE`) between `PENDING_PAYMENT` and `PAID`, plus an endpoint for the vendor to submit a quote, plus buyer-accept-quote logic.

3. **`Store.deliverySetupComplete` blocks publishing.** Until a code path sets this flag to true (e.g., when the vendor saves at least one StoreDeliveryZone, or completes StoreDeliverySetting), no vendor can publish products via the vendor flow. This indirectly blocks the entire marketplace flow (no ACTIVE products = nothing to buy).

4. **No product snapshot on OrderItem.** If a vendor renames or re-prices a product after an order is placed, the historical order's display will change. For the escrow/dispute flow (where the order details matter for resolution), this is a risk. The `unitPrice` and `totalPrice` ARE captured (good), but product name, image, description, and digital-asset URL are NOT.

5. **Digital delivery has no buyer notification.** For digital products, the `accessUrl` is written to the Fulfillment row but never pushed to the buyer. The buyer must poll their order to discover the access URL. For the "Delivery → Confirm → Release" portion of the flow, digital products are stuck — there's no "delivered" event to trigger escrow release.

6. **`product.salePrice` bug** (commerce.service.ts:405) — silently always falls back to `product.price`. If a future "sale price" feature is added to the schema, this line will start using it without any other code changes — could be a surprise.

7. **No vendor variant creation endpoint.** Vendors cannot create product variants through the vendor app. Only admins can (via `POST /products/:id/variants`). If the vendor product form has a "variants" UI, it will not work.

---

## Appendix: Key file:line references (quick lookup)

| What | File:Line |
|---|---|
| Product model | `apps/api/prisma/schema.prisma:751-835` |
| ProductType enum | `apps/api/prisma/schema.prisma:704-707` |
| ProductStatus enum | `apps/api/prisma/schema.prisma:697-702` |
| InventoryPolicy enum | `apps/api/prisma/schema.prisma:715-719` |
| DigitalDeliveryType enum | `apps/api/prisma/schema.prisma:721-725` |
| InventoryReservationStatus enum | `apps/api/prisma/schema.prisma:727-732` |
| Store model (vendor's shop) | `apps/api/prisma/schema.prisma:197-234` |
| User → Store back-relation | `apps/api/prisma/schema.prisma:73` |
| ProductVariant model | `apps/api/prisma/schema.prisma:852-870` |
| ProductMedia model | `apps/api/prisma/schema.prisma:992-1006` |
| DigitalAsset model | `apps/api/prisma/schema.prisma:919-941` |
| InventoryItem model | `apps/api/prisma/schema.prisma:943-968` |
| InventoryReservation model | `apps/api/prisma/schema.prisma:970-990` |
| ProductDeliveryOverride | `apps/api/prisma/schema.prisma:837-850` |
| ProductDeliveryZone | `apps/api/prisma/schema.prisma:619-640` |
| ProductDimension | `apps/api/prisma/schema.prisma:898-907` |
| Deal / DealProduct | `apps/api/prisma/schema.prisma:422-458` |
| Review model | `apps/api/prisma/schema.prisma:1796-1820` |
| ProductsController (all endpoints) | `apps/api/src/modules/products/products.controller.ts:1-253` |
| ProductsService.search (listing) | `apps/api/src/modules/products/products.service.ts` (search method, ~line 600+) |
| ProductsService.mapPublicProduct | `apps/api/src/modules/products/products.service.ts:1058-1103` |
| ProductsService.getById | `apps/api/src/modules/products/products.service.ts:1105-1132` |
| ProductsService.getBySlug | `apps/api/src/modules/products/products.service.ts:1134-1161` |
| ProductsService.create (admin) | `apps/api/src/modules/products/products.service.ts:1344-1403` |
| CommerceService.createVendorProduct | `apps/api/src/modules/commerce/commerce.service.ts:1478-1561` |
| CommerceService.addDigitalAsset | `apps/api/src/modules/commerce/commerce.service.ts:1739-1752` |
| CommerceService.adjustInventory | `apps/api/src/modules/commerce/commerce.service.ts:1706-1737` |
| CommerceService.reserveInventoryForOrderItem | `apps/api/src/modules/commerce/commerce.service.ts:2627-2677` |
| CommerceService.commitReservations | `apps/api/src/modules/commerce/commerce.service.ts:2999-3012` |
| CommerceService.releaseReservations | `apps/api/src/modules/commerce/commerce.service.ts:3014-3034` |
| CommerceService.releaseExpiredReservations | `apps/api/src/modules/commerce/commerce.service.ts:~2540-2586` |
| CommerceService.createFulfillmentsForPaidOrder | `apps/api/src/modules/commerce/commerce.service.ts:3036-3083` |
| Order creation (checkout) | `apps/api/src/modules/commerce/commerce.service.ts:728-782` (order+items), `749-769` (OrderItem data) |
| Cart item price snapshot | `apps/api/src/modules/commerce/commerce.service.ts:405` (`product.salePrice ?? product.price`) |
| OrderItem model | `apps/api/prisma/schema.prisma:1215-1248` |
| Fulfillment model | `apps/api/prisma/schema.prisma:1309-1331` |
| OrderOperationsService transitions | `apps/api/src/modules/order-operations/order-operations.service.ts:85-99` |
| CreateVendorProductDto | `apps/api/src/modules/commerce/commerce.dto.ts:192-275` |
| DigitalAssetDto | `apps/api/src/modules/commerce/commerce.dto.ts:169-190` |
| SearchProductsDto | `apps/api/src/modules/products/dto/product.dto.ts:20-125` |
| Frontend: product.store → vendor display | `apps/marketplace/src/lib/api-hooks.ts:67-69` |
| Frontend: PDP vendor link | `apps/marketplace/src/components/product/product-detail-page.tsx:530-532, 649-654` |
| Upload module (MISSING — referenced but not on disk) | `apps/api/src/app.module.ts:22,149`; `apps/api/src/modules/vendor-store/vendor-store.module.ts:2,7`; `apps/api/src/modules/vendor-store/vendor-store.service.ts:9,42` |
