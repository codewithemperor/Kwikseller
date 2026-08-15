# Task SEARCH-1 — full-stack-developer (NestJS search service)

## Task
Rewrite the NestJS `products.service.search()` (in `apps/api/src/modules/products/`)
to be a production-grade e-commerce search with relevance ranking, server-side
filters, facets, and pagination. Extend `SearchProductsDto` accordingly.

Prior context: read `worklog.md` (esp. PROD-2b Reviews module for the same
patterns) and the existing `products.service.ts` / `product.dto.ts`.

## Work Log
1. Read `worklog.md` (PROD-2b Reviews module — same DTO/service/module patterns).
2. Inspected existing `products.service.ts` search() (~lines 427-477) and
   `product.dto.ts` SearchProductsDto (only q/search/category/limit/sortBy/
   sortOrder).
3. Verified Prisma schema for all referenced models:
   - `Product` (schema line 751) — has totalSales, rating, reviewCount,
     isFeatured, sku, shortDescription, description, brandId, categoryId,
     storeId.
   - `Category` (1030), `Brand` (365), `Store` (197) — all have id+slug+name.
   - `StoreDeliveryZone` (596) — has storeId, stateId, isActive.
   - `State` (524) — has id, name, code.
   - `ProductTag` (1020), `Tag` (685) — for tag-based search.
4. Verified `ResponseInterceptor` wraps `{ data, meta }` →
   `{ success, data, meta, timestamp }`, so the new search response shape
   flows through unchanged.
5. Verified the controller's `/products/categories/list` route calls
   `search(new SearchProductsDto())` — so search() must handle a fully-empty
   DTO (returns first page of all ACTIVE products with facets).
6. Baseline `bunx tsc --noEmit -p apps/api/tsconfig.json` = 526 errors, ALL
   pre-existing (`Cannot find module` + `Property 'X' does not exist on type
   'PrismaService'` — apps/api deps not installed in sandbox per worklog
   Task 1; Prisma client not generated).
7. Rewrote `SearchProductsDto` with 11 new fields: categoryId, brandId,
   storeId, minPrice, maxPrice, rating, state, sort, page, cursor (+ retained
   legacy sortBy/sortOrder).
8. Added `brand: { select: { id, name, slug } }` to `publicProductInclude`
   (additive — mapPublicProduct already passes `product.brand ?? null`
   through; getById/getBySlug already include brand; other endpoints that use
   publicProductInclude now also return brand consistently).
9. Removed the old ~50-line search() and the orphaned getCategories() helper.
10. Wrote the new search() (~120 lines) + 9 private helpers:
    - `normalizeQuery` — trim, collapse whitespace, strip leading/trailing
      Unicode punctuation via `\p{P}` (preserves internal hyphens; "Air-Max"
      stays "Air-Max"). Does NOT lowercase.
    - `resolveSort` — `sort` wins; legacy `sortBy`/`sortOrder` mapped
      ('price' → price-low/price-high based on sortOrder, 'createdAt'/
      'updatedAt' → newest, etc.).
    - `getSortOrderBy` — Prisma orderBy per non-relevance sort preset.
    - `buildSearchWhere` — assembles the where: status=ACTIVE, category,
      brand, store+state (state nested under store.deliveryZones.some.state.
      OR[name/code/id]), price range, rating, free-text OR across id/slug/
      name/shortDescription/description/sku/store.name/brand.name/category.
      name/category.slug/tags.tag.name.
    - `buildSearchWhereExcluding` — clones dto and nulls one filter
      dimension; used by each facet so users see "other options".
    - `rankProducts` — TypeScript relevance ranking. Per-product weighted
      score: exact name match +1000, exact phrase in name +500, all-tokens-
      in-name +200, partial name match +50/token, shortDescription +20/token,
      description +10/token, category name/slug +30/token, store name +40/
      token, brand name +30/token, sku +25/token, tag match +15/matched-tag.
      Tie-breaker: isFeatured desc → totalSales desc → rating desc →
      createdAt desc.
    - `computeCategoryFacets` / `computeBrandFacets` / `computeStoreFacets`
      — `prisma.product.groupBy` (by categoryId/brandId/storeId, _count,
      orderBy count desc, take 10) + follow-up findMany to hydrate id+slug+
      name. Null groups filtered out.
    - `computeStateFacets` — fetches up to 500 matching products' storeIds,
      looks up their storeDeliveryZone rows (with state info), aggregates
      per-state product counts (deduped per-store within a state), sorts by
      count desc, takes 10.
    - `computePriceRange` — `prisma.product.aggregate` _min/_max price
      (excluding the price filter so the slider shows the full available
      range).
11. search() flow: normalize query → resolve sort → clamp page/limit → build
    where → parallel: count + 5 facets → fetch products via one of three
    branches (cursor / relevance-ranking / non-relevance sort) → return
    `{ data, meta: { query, total, page, limit, pages, categories, brands,
    stores, states, priceRange, nextCursor } }`.
12. Relevance-ranking branch: fetch up to 200 candidates (pre-sorted by the
    tie-breaker so the cap rarely cuts off relevant rows), include `tags`
    for ranking (tags do NOT leak into the public response since
    mapPublicProduct doesn't expose them), rank in TS, slice for pagination
    AFTER ranking.
13. Cursor branch: `where: { ...filters, id: { gt: cursor } }, orderBy:
    [{ createdAt: 'asc' }, { id: 'asc' }], take: limit`; nextCursor = last
    item's id when `products.length === limit`, else null.
14. Verification: `bunx tsc --noEmit -p apps/api/tsconfig.json` — final
    536 errors (vs 526 baseline). All 10 new errors are baseline-pattern
    `Property 'X' does not exist on type 'PrismaService'` for the new Prisma
    accessors (product.groupBy, product.aggregate, brand.findMany,
    storeDeliveryZone.findMany) — will resolve when `prisma generate` runs
    in production. NO new error types introduced.
15. Did NOT start the API (no .env). Did NOT write test files. Did NOT
    touch the controller.

## Stage Summary
- Files modified:
  - `apps/api/src/modules/products/dto/product.dto.ts` — SearchProductsDto
    extended with 11 new fields.
  - `apps/api/src/modules/products/products.service.ts` —
    publicProductInclude extended with `brand` (additive); old search() +
    getCategories() replaced with new search() + 9 private helpers.
- Approach: TypeScript relevance ranking (NOT raw SQL). Rationale:
  1. Prisma doesn't expose Postgres FTS directly — raw SQL would need a
     hand-written CTE duplicating every where-filter (fragile).
  2. Marketplace dev DB is SQLite while the schema declares postgresql
     (analytics.service.ts uses strftime) — raw SQL would need to work on
     both dialects.
  3. pg_trgm `similarity()` may not be installed on every deployment.
  The TS approach keeps all filters server-side via Prisma `where`, caps
  the candidate set at 200 (pre-sorted by the tie-breaker), and paginates
  AFTER ranking — meets the spec's "pragmatic" fallback criteria.
- Issues / limitations:
  - 200-row cap on relevance-ranking candidate set — fine for typical
    e-commerce search (users rarely go past page 10); could be raised for
    very large catalogs with broad queries.
  - `state` facet's 500-storeId cap — pragmatic limit; could be moved to
    raw SQL GROUP BY for unbounded catalogs.
  - `pages` is returned even in cursor mode (not really meaningful there)
    for response-shape consistency.
  - API not started in sandbox (no .env); 10 new tsc errors are baseline-
    pattern Prisma accessor errors that resolve when `prisma generate` runs.
