import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { SearchProductsDto, HomeFeedMoreDto } from './dto';
import {
  CreateProductDto,
  UpdateProductDto,
  UpdateProductStatusDto,
  CreateProductVariantDto,
  UpdateProductVariantDto,
  AddProductImageDto,
  QueryProductAdminDto,
} from './dto/product-admin.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private shuffle<T>(items: T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  private readonly publicProductInclude = {
    images: { orderBy: { position: 'asc' as const } },
    variants: { orderBy: { createdAt: 'asc' as const } },
    category: { select: { id: true, name: true, slug: true } },
    store: { select: { id: true, name: true, slug: true } },
    // `brand` is intentionally included here so that `search`/`getFeatured`/
    // `getByCategory`/etc. all return brand info consistent with `getById`/
    // `getBySlug` (which already include brand). `mapPublicProduct` passes
    // `product.brand ?? null` through unchanged, so this is purely additive.
    brand: { select: { id: true, name: true, slug: true } },
    inventoryItems: { select: { available: true, reserved: true, lowStockThreshold: true } },
  };

  private getPublicProductOrderBy(
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Prisma.ProductOrderByWithRelationInput[] {
    switch (sortBy) {
      case 'price':
      case 'price-low':
        return [{ price: sortBy === 'price-low' ? 'asc' : sortOrder }];
      case 'price-high':
        return [{ price: 'desc' }];
      case 'rating':
        return [{ rating: sortOrder }, { reviewCount: 'desc' }];
      case 'newest':
      case 'createdAt':
        return [{ createdAt: sortOrder }];
      case 'updatedAt':
        return [{ updatedAt: sortOrder }];
      default:
        return [{ isFeatured: 'desc' }, { updatedAt: 'desc' }];
    }
  }

  /**
   * Single-call homepage aggregation endpoint.
   *
   * Returns everything the marketplace index page needs in ONE API call:
   *   - heroBanners       (rotating hero carousel)
   *   - categories        (browse-by-category grid)
   *   - featuredProducts  (isFeatured = true)
   *   - trendingProducts  (by totalSales + rating)
   *   - newArrivals       (createdAt within last 21 days)
   *   - flashDeals        (from the Deal table — admin-created FLASH_DEAL
   *                        campaigns with linked DealProduct rows and
   *                        dealPrice. Falls back to comparePrice>price
   *                        heuristic when no Deal rows have products yet.)
   *   - groupBuyCampaigns (from PoolCampaign — target/committed quantity)
   *   - topVendors        (verified stores by product count)
   *
   * No shuffling — results are deterministic per request so the client-side
   * localStorage cache stays stable between page loads.
   */
  async getHomeFeed() {
    const now = new Date();
    const twentyOneDaysAgo = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 21);

    const [
      banners,
      categories,
      products,
      flashDealRows,
      poolCampaigns,
      topVendorStores,
    ] = await Promise.all([
      // 1. Hero banners
      this.prisma.banner.findMany({
        where: { isActive: true },
        orderBy: [{ position: 'asc' }, { updatedAt: 'desc' }],
        take: 6,
      }),

      // 2. Categories with product counts
      this.prisma.category.findMany({
        where: { isActive: true },
        orderBy: [{ position: 'asc' }, { name: 'asc' }],
        include: {
          _count: { select: { products: { where: { status: 'ACTIVE' } } } },
        },
        take: 12,
      }),

      // 3. Active products (take 80 for enough headroom across all sections)
      this.prisma.product.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { updatedAt: 'desc' },
        include: {
          images: { orderBy: { position: 'asc' } },
          category: { select: { id: true, name: true, slug: true } },
          store: { select: { id: true, name: true, slug: true } },
          inventoryItems: { select: { available: true, reserved: true, lowStockThreshold: true } },
        },
        take: 80,
      }),

      // 4. Flash deals from the Deal table (FLASH_DEAL type, active, in date window)
      this.prisma.deal.findMany({
        where: {
          dealType: 'FLASH_DEAL',
          isActive: true,
          startDate: { lte: now },
          OR: [{ endDate: null }, { endDate: { gte: now } }],
        },
        orderBy: { startDate: 'desc' },
        include: {
          products: {
            include: {
              product: {
                include: {
                  images: { orderBy: { position: 'asc' } },
                  category: { select: { id: true, name: true, slug: true } },
                  store: { select: { id: true, name: true, slug: true } },
                  inventoryItems: { select: { available: true, reserved: true, lowStockThreshold: true } },
                },
              },
            },
          },
        },
        take: 5,
      }),

      // 5. Group-buy campaigns (PoolCampaign in ACTIVE or SCHEDULED status)
      this.prisma.poolCampaign.findMany({
        where: {
          status: { in: ['ACTIVE', 'SCHEDULED', 'THRESHOLD_MET'] },
        },
        orderBy: { startsAt: 'desc' },
        include: {
          poolProduct: {
            select: {
              id: true,
              name: true,
              description: true,
              images: true,
              suggestedRetailPrice: true,
            },
          },
        },
        take: 6,
      }),

      // 6. Top vendors (verified stores by product count)
      this.prisma.store.findMany({
        where: {
          isVerified: true,
          onboardingComplete: true,
        },
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { products: { where: { status: 'ACTIVE' } } } },
          vendor: {
            select: {
              id: true,
              profile: { select: { firstName: true, lastName: true, avatarUrl: true } },
            },
          },
        },
        take: 20,
      }),
    ]);

    // ---- Map products to the public shape ----
    const mappedProducts = products.map((product) => this.mapHomeFeedProduct(product));

    // ---- Derive section lists (deterministic — no shuffling) ----
    const featuredProducts = mappedProducts.filter((p) => p.isFeatured).slice(0, 10);
    const trendingProducts = [...mappedProducts]
      .sort((a, b) => b.totalSales - a.totalSales || b.rating - a.rating)
      .slice(0, 10);
    const newArrivals = mappedProducts.filter((p) => p.isNew).slice(0, 10);

    // ---- Map flash deals ----
    // Each deal becomes { ...dealMeta, products: [MarketplaceProduct with dealPrice] }
    // If a deal has DealProduct rows, use the dealPrice as the effective price
    // and the original product price as comparePrice.
    // If NO deals have products, fall back to the comparePrice>price heuristic
    // so the section still renders when admins haven't linked products yet.
    const flashDealsWithProducts = flashDealRows.filter(
      (deal) => deal.products && deal.products.length > 0,
    );

    const flashDeals = flashDealsWithProducts.length > 0
      ? flashDealsWithProducts.map((deal) => ({
          id: deal.id,
          title: deal.title,
          description: deal.description,
          dealType: deal.dealType,
          discountType: deal.discountType,
          discountValue: deal.discountValue,
          startDate: deal.startDate,
          endDate: deal.endDate,
          minOrderValue: deal.minOrderValue,
          maxUses: deal.maxUses,
          usedCount: deal.usedCount,
          products: deal.products.map((dp) => {
            const base = this.mapHomeFeedProduct(dp.product);
            const dealPrice = dp.dealPrice;
            const originalPrice = dp.product.price;
            return {
              ...base,
              price: dealPrice,
              comparePrice: originalPrice > dealPrice ? originalPrice : base.comparePrice,
              discountPercent: originalPrice > dealPrice
                ? Math.round(((originalPrice - dealPrice) / originalPrice) * 100)
                : base.discountPercent ?? 0,
            };
          }),
        }))
      : // Fallback: if no Deal rows have products, derive flash deals from
        // products where comparePrice > price (highest discount first)
        (() => {
          const discounted = mappedProducts
            .filter(
              (p) =>
                typeof p.comparePrice === 'number' && p.comparePrice > p.price,
            )
            .map((p) => ({
              ...p,
              discountPercent: Math.round(
                (((p.comparePrice as number) - p.price) / (p.comparePrice as number)) * 100,
              ),
            }))
            .sort((a, b) => (b.discountPercent ?? 0) - (a.discountPercent ?? 0))
            .slice(0, 8);

          if (discounted.length === 0) return [];

          return [{
            id: 'heuristic',
            title: 'Flash Deals',
            description: 'Limited-time discounts on top products',
            dealType: 'FLASH_DEAL',
            discountType: 'PERCENTAGE',
            discountValue: 0,
            startDate: now,
            endDate: null,
            minOrderValue: 0,
            maxUses: null,
            usedCount: 0,
            products: discounted,
          }];
        })();

    // ---- Map group-buy campaigns ----
    const groupBuyCampaigns = poolCampaigns.map((campaign) => ({
      id: campaign.id,
      title: campaign.title,
      targetQuantity: campaign.targetQuantity,
      committedQuantity: campaign.committedQuantity,
      unitPrice: campaign.unitPrice,
      status: campaign.status,
      startsAt: campaign.startsAt,
      endsAt: campaign.endsAt,
      progress:
        campaign.targetQuantity > 0
          ? Math.min(100, Math.round((campaign.committedQuantity / campaign.targetQuantity) * 100))
          : 0,
      poolProduct: campaign.poolProduct
        ? {
            id: campaign.poolProduct.id,
            name: campaign.poolProduct.name,
            description: campaign.poolProduct.description,
            images: campaign.poolProduct.images,
            suggestedRetailPrice: campaign.poolProduct.suggestedRetailPrice,
          }
        : null,
    }));

    // ---- Map top vendors (sort by product count desc, take 8) ----
    const topVendors = topVendorStores
      .sort((a, b) => b._count.products - a._count.products)
      .slice(0, 8)
      .map((store) => ({
        id: store.id,
        name: store.name,
        slug: store.slug,
        logo: store.logoUrl,
        banner: store.bannerUrl,
        description: store.description,
        productCount: store._count.products,
        isVerified: store.isVerified,
        vendor: {
          name: [store.vendor?.profile?.firstName, store.vendor?.profile?.lastName]
            .filter(Boolean)
            .join(' ') || store.name,
          avatar: store.vendor?.profile?.avatarUrl ?? null,
        },
      }));

    return {
      heroBanners: banners.slice(0, 5).map((banner) => ({
        id: banner.id,
        title: banner.title || 'Shop the latest picks',
        subtitle:
          banner.subTitle || 'Fresh finds from trusted Kwikseller vendors.',
        image: banner.image,
        href: banner.url || '/products',
        badge: banner.bannerType.replace(/_/g, ' '),
      })),
      categories: categories.slice(0, 8).map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        image: category.imageUrl,
        itemCount: category._count.products,
      })),
      featuredProducts: (featuredProducts.length ? featuredProducts : mappedProducts.slice(0, 10)).slice(0, 10),
      trendingProducts: (trendingProducts.length ? trendingProducts : mappedProducts.slice(0, 10)).slice(0, 10),
      newArrivals: (newArrivals.length ? newArrivals : mappedProducts.slice(0, 10)).slice(0, 10),
      flashDeals,
      groupBuyCampaigns,
      topVendors,
    };
  }

  /**
   * Paginated product feed for infinite scroll on the homepage.
   * Returns active products ordered by updatedAt desc with page/limit.
   */
  async getHomeFeedMore(dto: HomeFeedMoreDto) {
    const page = Math.max(Number(dto.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(dto.limit ?? 20), 1), 50);
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: { status: 'ACTIVE' },
        orderBy: [{ isFeatured: 'desc' }, { updatedAt: 'desc' }],
        include: {
          images: { orderBy: { position: 'asc' } },
          category: { select: { id: true, name: true, slug: true } },
          store: { select: { id: true, name: true, slug: true } },
          inventoryItems: { select: { available: true, reserved: true, lowStockThreshold: true } },
        },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where: { status: 'ACTIVE' } }),
    ]);

    return {
      data: products.map((product) => this.mapHomeFeedProduct(product)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Maps a raw Prisma product (with images/category/store/inventoryItems
   * included) to the flat MarketplaceProduct shape the frontend expects.
   */
  private mapHomeFeedProduct(product: any) {
    const stock =
      product.inventoryItems?.reduce(
        (sum: number, item: { available?: number }) => sum + (item.available ?? 0),
        0,
      ) || product.stock;

    const isNew =
      Date.now() - new Date(product.createdAt).getTime() <
      1000 * 60 * 60 * 24 * 21;

    const comparePrice = product.comparePrice ?? undefined;
    const discountPercent =
      comparePrice && comparePrice > product.price
        ? Math.round(((comparePrice - product.price) / comparePrice) * 100)
        : 0;

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      comparePrice,
      image: product.images?.[0]?.url ?? null,
      rating: product.rating ?? 0,
      reviewCount: product.reviewCount ?? 0,
      store: product.store?.name ?? 'Kwikseller',
      storeId: product.store?.id ?? '',
      storeSlug: product.store?.slug ?? '',
      category: product.category?.name ?? 'Kwikseller',
      categorySlug: product.category?.slug ?? '',
      productType: product.productType,
      productSource: product.productSource,
      requiresShipping: product.requiresShipping,
      trackInventory: product.trackInventory,
      poolProductId: product.poolProductId ?? null,
      stock,
      lowStock:
        product.inventoryItems?.[0]?.lowStockThreshold ?? product.lowStock,
      isNew,
      totalSales: product.totalSales ?? 0,
      isFeatured: product.isFeatured,
      discountPercent,
    };
  }

  // ===================================================================
  //  SEARCH
  // ===================================================================
  //  Production-grade e-commerce search:
  //   - Free-text query across name, slug, descriptions, sku, store, brand,
  //     category, and tags.
  //   - Server-side filters: category / categoryId / brandId / storeId /
  //     minPrice / maxPrice / rating / state (via StoreDeliveryZone).
  //   - Sort presets: relevance (default) | price-low | price-high | rating |
  //     newest | popular. Legacy sortBy/sortOrder mapped for backwards compat.
  //   - Relevance ranking is computed in TypeScript (NOT raw SQL) — see the
  //     note on `rankProducts` below for the rationale.
  //   - Facets (categories / brands / stores / states / priceRange) are
  //     computed server-side and returned in `meta`. Each facet excludes the
  //     currently-applied filter for that dimension so the UI can show users
  //     "other options" they could switch to.
  //   - Offset pagination by default; cursor-based pagination when `cursor`
  //     is provided (cursor mode uses stable createdAt-asc ordering).
  // ===================================================================
  async search(dto: SearchProductsDto) {
    // ---------- 1) Normalize the query ----------
    const rawQuery = (dto.q || (dto as SearchProductsDto & { search?: string }).search || '').toString();
    const query = this.normalizeQuery(rawQuery);

    // ---------- 2) Resolve sort & pagination ----------
    const sort = this.resolveSort(dto);
    const limit = Math.min(Math.max(Number(dto.limit ?? 20) || 1, 1), 50);
    const page = Math.max(Number(dto.page ?? 1) || 1, 1);
    const cursor = dto.cursor?.trim() || undefined;

    // ---------- 3) Build the where clause (all filters + text search) ----------
    const where = this.buildSearchWhere(dto, query);

    // ---------- 4) Decide on ranking strategy ----------
    const useRelevanceRanking = !cursor && sort === 'relevance' && query.length > 0;

    // ---------- 5) Compute total + facets in parallel (independent of pagination) ----------
    const [total, categoryFacets, brandFacets, storeFacets, stateFacets, priceRange] =
      await Promise.all([
        this.prisma.product.count({ where }),
        this.computeCategoryFacets(dto, query),
        this.computeBrandFacets(dto, query),
        this.computeStoreFacets(dto, query),
        this.computeStateFacets(dto, query),
        this.computePriceRange(dto, query),
      ]);

    // ---------- 6) Fetch products ----------
    let products: any[];
    let nextCursor: string | null = null;

    if (cursor) {
      // ---- Cursor-based pagination: stable createdAt-asc ordering, no ranking ----
      products = await this.prisma.product.findMany({
        where: { ...where, id: { gt: cursor } },
        include: this.publicProductInclude,
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        take: limit,
      });
      nextCursor = products.length === limit ? products[products.length - 1].id : null;
    } else if (useRelevanceRanking) {
      // ---- Relevance ranking: fetch a capped candidate set, rank in TS, paginate after ----
      const candidates = await this.prisma.product.findMany({
        where,
        include: {
          ...this.publicProductInclude,
          // Tags are needed for ranking only; mapPublicProduct does not
          // expose them, so they don't leak into the public response.
          tags: { select: { tag: { select: { name: true } } } },
        },
        // Pre-sort by the tie-breaker so that, even before scoring, the
        // candidate set is biased toward high-quality products when the
        // 200-row cap truncates the result set.
        orderBy: [
          { isFeatured: 'desc' },
          { totalSales: 'desc' },
          { rating: 'desc' },
          { createdAt: 'desc' },
        ],
        take: 200,
      });
      const ranked = this.rankProducts(candidates, query);
      const start = (page - 1) * limit;
      products = ranked.slice(start, start + limit);
    } else {
      // ---- Non-relevance sort, OR relevance with no query (uses default orderBy) ----
      const orderBy =
        sort === 'relevance'
          ? ([{ isFeatured: 'desc' }, { totalSales: 'desc' }, { updatedAt: 'desc' }] as Prisma.ProductOrderByWithRelationInput[])
          : this.getSortOrderBy(sort);
      products = await this.prisma.product.findMany({
        where,
        include: this.publicProductInclude,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      });
    }

    // ---------- 7) Return ----------
    return {
      data: products.map((product) => this.mapPublicProduct(product)),
      meta: {
        query,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        categories: categoryFacets,
        brands: brandFacets,
        stores: storeFacets,
        states: stateFacets,
        priceRange,
        nextCursor,
      },
    };
  }

  // -------------------------------------------------------------------
  //  Query normalization
  // -------------------------------------------------------------------
  //  Trim, collapse internal whitespace, strip leading/trailing punctuation.
  //  Internal hyphens are preserved (so "Air-Max" stays "Air-Max").
  //  The query is NOT lowercased here — case is preserved so the exact-match
  //  score (e.g. name === query) is case-sensitive at the SQL `contains` level
  //  but case-insensitive at the ranking level (ranking lowercases both sides).
  // -------------------------------------------------------------------
  private normalizeQuery(input: string): string {
    if (!input) return '';
    let q = input.replace(/\s+/g, ' ').trim();
    // Strip leading/trailing Unicode punctuation + whitespace (preserves
    // internal hyphens, slashes, etc.).
    q = q.replace(/^[\s\p{P}]+|[\s\p{P}]+$/gu, '');
    return q;
  }

  // -------------------------------------------------------------------
  //  Sort resolution
  // -------------------------------------------------------------------
  //  Returns one of: 'relevance' | 'price-low' | 'price-high' | 'rating' |
  //  'newest' | 'popular'. The new `sort` param wins; falls back to mapping
  //  legacy `sortBy` / `sortOrder` for backwards compatibility.
  // -------------------------------------------------------------------
  private resolveSort(dto: SearchProductsDto): string {
    const validSorts = ['relevance', 'price-low', 'price-high', 'rating', 'newest', 'popular'];
    if (dto.sort && validSorts.includes(dto.sort)) return dto.sort;

    if (dto.sortBy) {
      const order = dto.sortOrder === 'asc' ? 'asc' : 'desc';
      switch (dto.sortBy) {
        case 'price':
          return order === 'asc' ? 'price-low' : 'price-high';
        case 'price-low':
          return 'price-low';
        case 'price-high':
          return 'price-high';
        case 'rating':
          return 'rating';
        case 'newest':
        case 'createdAt':
        case 'updatedAt':
          return 'newest';
        case 'popular':
          return 'popular';
        default:
          return 'relevance';
      }
    }
    return 'relevance';
  }

  // -------------------------------------------------------------------
  //  orderBy for non-relevance sorts
  // -------------------------------------------------------------------
  private getSortOrderBy(sort: string): Prisma.ProductOrderByWithRelationInput[] {
    switch (sort) {
      case 'price-low':
        return [{ price: 'asc' }];
      case 'price-high':
        return [{ price: 'desc' }];
      case 'rating':
        return [{ rating: 'desc' }, { reviewCount: 'desc' }];
      case 'newest':
        return [{ createdAt: 'desc' }];
      case 'popular':
        return [{ totalSales: 'desc' }, { rating: 'desc' }];
      default:
        // relevance with no query
        return [{ isFeatured: 'desc' }, { totalSales: 'desc' }, { updatedAt: 'desc' }];
    }
  }

  // -------------------------------------------------------------------
  //  Where-clause builder
  // -------------------------------------------------------------------
  //  Applies: status=ACTIVE, category filter, brand, store, price range,
  //  minimum rating, state (via StoreDeliveryZone), and the free-text OR
  //  search across name/slug/descriptions/sku/store/brand/category/tags.
  // -------------------------------------------------------------------
  private buildSearchWhere(dto: SearchProductsDto, query: string): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = { status: ProductStatus.ACTIVE };
    const categoryIds = dto.categoryIds?.filter(Boolean) ?? [];
    const brandIds = dto.brandIds?.filter(Boolean) ?? [];
    const storeIds = dto.storeIds?.filter(Boolean) ?? [];
    const states = dto.states?.map((state) => state.trim()).filter(Boolean) ?? [];

    // ---- Category ----
    if (categoryIds.length > 0) {
      where.category = {
        OR: [
          { id: { in: categoryIds } },
          { slug: { in: categoryIds } },
        ],
      };
    } else if (dto.categoryId) {
      where.categoryId = dto.categoryId;
    } else if (dto.category) {
      where.category = { OR: [{ slug: dto.category }, { id: dto.category }] };
    }

    // ---- Brand ----
    if (brandIds.length > 0) {
      where.brand = {
        OR: [
          { id: { in: brandIds } },
          { slug: { in: brandIds } },
        ],
      };
    } else if (dto.brandId) {
      where.brandId = dto.brandId;
    }

    // ---- Store + State (state filters inside store.deliveryZones) ----
    const storeFilter: Prisma.StoreWhereInput = {};
    if (storeIds.length > 0) {
      storeFilter.OR = [
        { id: { in: storeIds } },
        { slug: { in: storeIds } },
      ];
    } else if (dto.storeId) {
      storeFilter.id = dto.storeId;
    }
    if (states.length > 0) {
      storeFilter.deliveryZones = {
        some: {
          state: {
            OR: states.flatMap((state) => [
              { name: state },
              { code: state.toUpperCase() },
              { id: state },
            ]),
          },
        },
      };
    } else if (dto.state) {
      const state = dto.state.trim();
      if (state) {
        storeFilter.deliveryZones = {
          some: {
            state: {
              OR: [{ name: state }, { code: state.toUpperCase() }, { id: state }],
            },
          },
        };
      }
    }
    if (Object.keys(storeFilter).length > 0) {
      where.store = storeFilter;
    }

    // ---- Price range ----
    const priceFilter: { gte?: number; lte?: number } = {};
    if (typeof dto.minPrice === 'number' && !Number.isNaN(dto.minPrice)) {
      priceFilter.gte = dto.minPrice;
    }
    if (typeof dto.maxPrice === 'number' && !Number.isNaN(dto.maxPrice)) {
      priceFilter.lte = dto.maxPrice;
    }
    if (priceFilter.gte !== undefined || priceFilter.lte !== undefined) {
      where.price = priceFilter;
    }

    // ---- Minimum rating ----
    if (typeof dto.rating === 'number' && !Number.isNaN(dto.rating)) {
      where.rating = { gte: dto.rating };
    }

    // ---- Free-text search ----
    if (query) {
      where.OR = [
        { id: query },
        { slug: { contains: query } },
        { name: { contains: query } },
        { shortDescription: { contains: query } },
        { description: { contains: query } },
        { sku: { contains: query } },
        { store: { name: { contains: query } } },
        { brand: { name: { contains: query } } },
        { category: { name: { contains: query } } },
        { category: { slug: { contains: query } } },
        { tags: { some: { tag: { name: { contains: query } } } } },
      ];
    }

    return where;
  }

  // -------------------------------------------------------------------
  //  Where-clause builder that omits one filter dimension (for facets)
  // -------------------------------------------------------------------
  //  Each facet is computed "as if" the user hadn't picked that dimension,
  //  so the UI can show "other options" the current result set spans.
  //  - exclude='category' omits categoryId/category
  //  - exclude='brand'    omits brandId
  //  - exclude='store'    omits storeId (but keeps state — they're separate
  //                       filters conceptually)
  //  - exclude='state'    omits state
  //  - exclude='price'    omits minPrice/maxPrice (so the price slider shows
  //                       the full available range, not just the filtered one)
  // -------------------------------------------------------------------
  private buildSearchWhereExcluding(
    dto: SearchProductsDto,
    query: string,
    exclude: 'category' | 'brand' | 'store' | 'state' | 'price',
  ): Prisma.ProductWhereInput {
    const dtoClone: SearchProductsDto = { ...dto };
    if (exclude === 'category') {
      dtoClone.categoryId = undefined;
      dtoClone.category = undefined;
      dtoClone.categoryIds = undefined;
    } else if (exclude === 'brand') {
      dtoClone.brandId = undefined;
      dtoClone.brandIds = undefined;
    } else if (exclude === 'store') {
      dtoClone.storeId = undefined;
      dtoClone.storeIds = undefined;
    } else if (exclude === 'state') {
      dtoClone.state = undefined;
      dtoClone.states = undefined;
    } else if (exclude === 'price') {
      dtoClone.minPrice = undefined;
      dtoClone.maxPrice = undefined;
    }
    return this.buildSearchWhere(dtoClone, query);
  }

  // -------------------------------------------------------------------
  //  Relevance ranking (TypeScript implementation)
  // -------------------------------------------------------------------
  //  We use the TypeScript approach (not raw SQL) for three reasons:
  //   1. Prisma doesn't expose PostgreSQL full-text search (tsvector /
  //      websearch_to_tsquery) directly, so we'd need $queryRaw with a
  //      hand-written CTE that duplicates every where-filter — fragile.
  //   2. The marketplace dev environment runs against SQLite (see
  //      analytics.service.ts using strftime), while the schema declares
  //      postgresql. A raw SQL ranking query would need to work on both
  //      dialects or break in one of them.
  //   3. The pg_trgm `similarity()` function may not be installed on every
  //      deployment; guarding it with COALESCE still requires the extension
  //      to be loaded for the function to be referenced at all.
  //
  //  The TS approach:
  //   - All filters are applied server-side via Prisma `where` (the DB does
  //     the heavy lifting; we never pull unfiltered rows).
  //   - We cap the candidate set at 200 (pre-sorted by the tie-breaker so
  //     the cap rarely cuts off relevant rows).
  //   - We compute a weighted score per product (see weights below) and
  //     sort by score desc, with the same tie-breaker as a fallback.
  //   - Pagination happens AFTER ranking.
  // -------------------------------------------------------------------
  private rankProducts(products: any[], query: string): any[] {
    const q = query.toLowerCase();
    const tokens = query.split(/\s+/).filter(Boolean);
    const lowerTokens = tokens.map((t) => t.toLowerCase());

    const scored = products.map((product) => {
      let score = 0;

      const name = (product.name ?? '').toLowerCase();
      const shortDesc = (product.shortDescription ?? '').toLowerCase();
      const desc = (product.description ?? '').toLowerCase();
      const sku = (product.sku ?? '').toLowerCase();
      const categoryName = (product.category?.name ?? '').toLowerCase();
      const categorySlug = (product.category?.slug ?? '').toLowerCase();
      const storeName = (product.store?.name ?? '').toLowerCase();
      const brandName = (product.brand?.name ?? '').toLowerCase();
      const tagNames: string[] = (product.tags ?? []).map(
        (pt: { tag?: { name?: string } }) => (pt.tag?.name ?? '').toLowerCase(),
      );

      // Exact name match (case-insensitive)
      if (name !== '' && name === q) score += 1000;

      // Exact phrase in name (full query string appears in name)
      if (q !== '' && name.includes(q)) score += 500;

      // All query tokens appear in name
      if (lowerTokens.length > 0 && lowerTokens.every((t) => name.includes(t))) {
        score += 200;
      }

      // Partial name match: +50 per matched token
      for (const t of lowerTokens) {
        if (name.includes(t)) score += 50;
      }

      // shortDescription: +20 per matched token
      for (const t of lowerTokens) {
        if (shortDesc.includes(t)) score += 20;
      }

      // description: +10 per matched token
      for (const t of lowerTokens) {
        if (desc.includes(t)) score += 10;
      }

      // category name/slug: +30 per matched token (counted once per token)
      for (const t of lowerTokens) {
        if (categoryName.includes(t) || categorySlug.includes(t)) score += 30;
      }

      // store name: +40 per matched token
      for (const t of lowerTokens) {
        if (storeName.includes(t)) score += 40;
      }

      // brand name: +30 per matched token
      for (const t of lowerTokens) {
        if (brandName.includes(t)) score += 30;
      }

      // sku: +25 per matched token
      for (const t of lowerTokens) {
        if (sku.includes(t)) score += 25;
      }

      // Tag match: +15 per matched tag (tag matches if its name contains any token)
      let matchedTags = 0;
      for (const tagName of tagNames) {
        if (lowerTokens.some((t) => tagName.includes(t))) matchedTags += 1;
      }
      score += matchedTags * 15;

      return { product, score };
    });

    // Sort by score desc; tie-breaker: isFeatured desc, totalSales desc,
    // rating desc, createdAt desc.
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aFeatured = a.product.isFeatured ? 1 : 0;
      const bFeatured = b.product.isFeatured ? 1 : 0;
      if (bFeatured !== aFeatured) return bFeatured - aFeatured;
      const aSales = a.product.totalSales ?? 0;
      const bSales = b.product.totalSales ?? 0;
      if (bSales !== aSales) return bSales - aSales;
      const aRating = a.product.rating ?? 0;
      const bRating = b.product.rating ?? 0;
      if (bRating !== aRating) return bRating - aRating;
      return (
        new Date(b.product.createdAt).getTime() - new Date(a.product.createdAt).getTime()
      );
    });

    return scored.map((s) => s.product);
  }

  // -------------------------------------------------------------------
  //  Facet: categories (excluding the currently-selected category filter)
  // -------------------------------------------------------------------
  private async computeCategoryFacets(
    dto: SearchProductsDto,
    query: string,
  ): Promise<Array<{ id: string; slug: string; name: string; count: number }>> {
    const where = this.buildSearchWhereExcluding(dto, query, 'category');
    const groups = await this.prisma.product.groupBy({
      by: ['categoryId'],
      where,
      _count: { categoryId: true },
      orderBy: { _count: { categoryId: 'desc' } },
      take: 10,
    });
    const categoryIds = groups
      .map((g) => g.categoryId)
      .filter((id): id is string => Boolean(id));
    if (categoryIds.length === 0) return [];
    // Cast to a typed array: when the Prisma client isn't generated (e.g. in
    // this sandbox where apps/api deps aren't installed), `prisma.category` is
    // typed as `any`, so without this cast `catMap.get(...)` would be inferred
    // as `{}` and `.id`/`.slug`/`.name` access would fail to type-check. The
    // cast is a no-op at runtime.
    const categories = (await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, slug: true, name: true },
    })) as Array<{ id: string; slug: string; name: string }>;
    const catMap = new Map(categories.map((c) => [c.id, c]));
    return groups
      .map((g) => {
        const cat = g.categoryId ? catMap.get(g.categoryId) : undefined;
        if (!cat) return null;
        return { id: cat.id, slug: cat.slug, name: cat.name, count: g._count.categoryId };
      })
      .filter((x): x is { id: string; slug: string; name: string; count: number } => x !== null);
  }

  // -------------------------------------------------------------------
  //  Facet: brands (excluding the currently-selected brand filter)
  // -------------------------------------------------------------------
  private async computeBrandFacets(
    dto: SearchProductsDto,
    query: string,
  ): Promise<Array<{ id: string; slug: string; name: string; count: number }>> {
    const where = this.buildSearchWhereExcluding(dto, query, 'brand');
    const groups = await this.prisma.product.groupBy({
      by: ['brandId'],
      where,
      _count: { brandId: true },
      orderBy: { _count: { brandId: 'desc' } },
      take: 10,
    });
    const brandIds = groups
      .map((g) => g.brandId)
      .filter((id): id is string => Boolean(id));
    if (brandIds.length === 0) return [];
    // See computeCategoryFacets for the rationale on the cast.
    const brands = (await this.prisma.brand.findMany({
      where: { id: { in: brandIds } },
      select: { id: true, slug: true, name: true },
    })) as Array<{ id: string; slug: string; name: string }>;
    const brandMap = new Map(brands.map((b) => [b.id, b]));
    return groups
      .map((g) => {
        const b = g.brandId ? brandMap.get(g.brandId) : undefined;
        if (!b) return null;
        return { id: b.id, slug: b.slug, name: b.name, count: g._count.brandId };
      })
      .filter((x): x is { id: string; slug: string; name: string; count: number } => x !== null);
  }

  // -------------------------------------------------------------------
  //  Facet: stores (excluding the currently-selected store filter)
  // -------------------------------------------------------------------
  private async computeStoreFacets(
    dto: SearchProductsDto,
    query: string,
  ): Promise<Array<{ id: string; slug: string; name: string; count: number }>> {
    const where = this.buildSearchWhereExcluding(dto, query, 'store');
    const groups = await this.prisma.product.groupBy({
      by: ['storeId'],
      where,
      _count: { storeId: true },
      orderBy: { _count: { storeId: 'desc' } },
      take: 10,
    });
    const storeIds = groups.map((g) => g.storeId).filter(Boolean) as string[];
    if (storeIds.length === 0) return [];
    // See computeCategoryFacets for the rationale on the cast.
    const stores = (await this.prisma.store.findMany({
      where: { id: { in: storeIds } },
      select: { id: true, slug: true, name: true },
    })) as Array<{ id: string; slug: string; name: string }>;
    const storeMap = new Map(stores.map((s) => [s.id, s]));
    return groups
      .map((g) => {
        const s = storeMap.get(g.storeId);
        if (!s) return null;
        return { id: s.id, slug: s.slug, name: s.name, count: g._count.storeId };
      })
      .filter((x): x is { id: string; slug: string; name: string; count: number } => x !== null);
  }

  // -------------------------------------------------------------------
  //  Facet: states (where matching products' stores deliver, via StoreDeliveryZone)
  // -------------------------------------------------------------------
  //  Excludes the currently-selected state filter so users can see other
  //  states their results span. `count` = number of matching products whose
  //  store delivers to that state (deduped per-store within a state so a
  //  store with multiple LGAs in the same state isn't double-counted).
  //
  //  Implementation note: we cap the matching-products lookup at 500 storeId
  //  rows (after the where filters) to keep the facet query bounded. For
  //  very large catalogs this could be moved to a raw SQL GROUP BY, but the
  //  TS approach keeps us dialect-agnostic (SQLite/Postgres).
  // -------------------------------------------------------------------
  private async computeStateFacets(
    dto: SearchProductsDto,
    query: string,
  ): Promise<Array<{ id: string; name: string; code: string; count: number }>> {
    const where = this.buildSearchWhereExcluding(dto, query, 'state');
    const matchingProducts = await this.prisma.product.findMany({
      where,
      select: { storeId: true },
      take: 500,
    });
    if (matchingProducts.length === 0) return [];

    // Count of matching products per store
    const storeProductCount = new Map<string, number>();
    for (const p of matchingProducts) {
      storeProductCount.set(p.storeId, (storeProductCount.get(p.storeId) ?? 0) + 1);
    }
    const storeIds = [...storeProductCount.keys()];

    // Fetch delivery zones for those stores, with state info
    const zones = await this.prisma.storeDeliveryZone.findMany({
      where: { storeId: { in: storeIds }, isActive: true },
      select: {
        storeId: true,
        state: { select: { id: true, name: true, code: true } },
      },
    });

    // For each state, collect the set of stores that deliver there (deduped)
    const stateStoreMap = new Map<string, Set<string>>();
    const stateInfoMap = new Map<string, { id: string; name: string; code: string }>();
    for (const z of zones) {
      if (!z.state) continue;
      if (!stateStoreMap.has(z.state.id)) stateStoreMap.set(z.state.id, new Set());
      stateStoreMap.get(z.state.id)!.add(z.storeId);
      stateInfoMap.set(z.state.id, {
        id: z.state.id,
        name: z.state.name,
        code: z.state.code,
      });
    }

    // Sum matching-product counts across stores per state
    const facets: Array<{ id: string; name: string; code: string; count: number }> = [];
    for (const [stateId, storeSet] of stateStoreMap) {
      let productCount = 0;
      for (const sid of storeSet) {
        productCount += storeProductCount.get(sid) ?? 0;
      }
      const info = stateInfoMap.get(stateId);
      if (!info) continue;
      facets.push({ id: info.id, name: info.name, code: info.code, count: productCount });
    }

    facets.sort((a, b) => b.count - a.count);
    return facets.slice(0, 10);
  }

  // -------------------------------------------------------------------
  //  Facet: price range (excluding the currently-applied price filter)
  // -------------------------------------------------------------------
  //  Returns the full min/max price across matching products so the UI can
  //  render a slider showing the entire available range (not just the
  //  currently-filtered slice).
  // -------------------------------------------------------------------
  private async computePriceRange(
    dto: SearchProductsDto,
    query: string,
  ): Promise<{ min: number; max: number }> {
    const where = this.buildSearchWhereExcluding(dto, query, 'price');
    const result = await this.prisma.product.aggregate({
      where,
      _min: { price: true },
      _max: { price: true },
    });
    return {
      min: result._min.price ?? 0,
      max: result._max.price ?? 0,
    };
  }

  private mapPublicProduct(product: any) {
    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      price: product.price,
      comparePrice: product.comparePrice ?? undefined,
      image: product.images?.[0]?.url ?? null,
      images: product.images ?? [],
      rating: product.rating ?? 0,
      averageRating: product.rating ?? 0,
      reviewCount: product.reviewCount ?? 0,
      reviewsCount: product.reviewCount ?? 0,
      store: product.store,
      storeId: product.storeId,
      storeName: product.store?.name,
      storeSlug: product.store?.slug,
      category: product.category,
      categoryName: product.category?.name,
      categorySlug: product.category?.slug,
      productType: product.productType,
      productSource: product.productSource,
      requiresShipping: product.requiresShipping,
      trackInventory: product.trackInventory,
      poolProductId: product.poolProductId,
      stock:
        product.inventoryItems?.reduce(
          (sum: number, item: { available?: number }) => sum + (item.available ?? 0),
          0,
        ) || product.stock,
      lowStock:
        product.inventoryItems?.[0]?.lowStockThreshold ?? product.lowStock,
      isNew:
        Date.now() - new Date(product.createdAt).getTime() <
        1000 * 60 * 60 * 24 * 21,
      totalSales: product.totalSales ?? 0,
      isFeatured: product.isFeatured,
      variants: product.variants ?? [],
      specifications: [],
      features: [],
      reviews: product.reviews ?? [],
      brand: product.brand ?? null,
      attributes: product.attributes ?? [],
    };
  }

  async getById(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, status: 'ACTIVE' },
      include: {
        images: { orderBy: { position: 'asc' } },
        variants: { orderBy: { createdAt: 'asc' } },
        category: { select: { id: true, name: true, slug: true } },
        store: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
        attributes: { include: { attribute: true } },
        reviews: {
          where: { isApproved: true },
          include: {
            user: {
              select: {
                id: true,
                profile: { select: { firstName: true, lastName: true, avatarUrl: true } },
              },
            },
          },
          orderBy: [{ helpfulCount: 'desc' }, { createdAt: 'desc' }],
        },
        inventoryItems: { select: { available: true, reserved: true, lowStockThreshold: true } },
      },
    });

    return product ? this.mapPublicProduct(product) : null;
  }

  async getBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, status: 'ACTIVE' },
      include: {
        images: { orderBy: { position: 'asc' } },
        variants: { orderBy: { createdAt: 'asc' } },
        category: { select: { id: true, name: true, slug: true } },
        store: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
        attributes: { include: { attribute: true } },
        reviews: {
          where: { isApproved: true },
          include: {
            user: {
              select: {
                id: true,
                profile: { select: { firstName: true, lastName: true, avatarUrl: true } },
              },
            },
          },
          orderBy: [{ helpfulCount: 'desc' }, { createdAt: 'desc' }],
        },
        inventoryItems: { select: { available: true, reserved: true, lowStockThreshold: true } },
      },
    });

    return product ? this.mapPublicProduct(product) : null;
  }

  async getFeatured(limit = 8) {
    const products = await this.prisma.product.findMany({
      where: { status: ProductStatus.ACTIVE, isFeatured: true },
      include: this.publicProductInclude,
      orderBy: [{ updatedAt: 'desc' }],
      take: limit,
    });

    return products.map((product) => this.mapPublicProduct(product));
  }

  async getTrending(limit = 10) {
    const products = await this.prisma.product.findMany({
      where: { status: ProductStatus.ACTIVE },
      include: this.publicProductInclude,
      orderBy: [{ totalSales: 'desc' }, { rating: 'desc' }, { updatedAt: 'desc' }],
      take: limit,
    });

    return products.map((product) => this.mapPublicProduct(product));
  }

  async getTop(limit = 10) {
    const products = await this.prisma.product.findMany({
      where: { status: ProductStatus.ACTIVE },
      include: this.publicProductInclude,
      orderBy: [{ rating: 'desc' }, { reviewCount: 'desc' }, { updatedAt: 'desc' }],
      take: limit,
    });

    return products.map((product) => this.mapPublicProduct(product));
  }

  async getNewArrivals(limit = 10) {
    const products = await this.prisma.product.findMany({
      where: { status: ProductStatus.ACTIVE },
      include: this.publicProductInclude,
      orderBy: [{ createdAt: 'desc' }, { updatedAt: 'desc' }],
      take: limit,
    });

    return products.map((product) => this.mapPublicProduct(product));
  }

  async getDeals(limit = 10) {
    const products = await this.prisma.product.findMany({
      where: {
        status: ProductStatus.ACTIVE,
        comparePrice: { not: null },
      },
      include: this.publicProductInclude,
      orderBy: [{ updatedAt: 'desc' }],
      take: Math.max(limit * 3, limit),
    });

    return products
      .filter((product) => product.comparePrice && product.comparePrice > product.price)
      .map((product) => ({
        ...this.mapPublicProduct(product),
        discountPercent: Math.round(
          (((product.comparePrice ?? product.price) - product.price) /
            (product.comparePrice ?? product.price)) *
            100,
        ),
      }))
      .sort((a, b) => b.discountPercent - a.discountPercent)
      .slice(0, limit);
  }

  async getCategoryDetail(slug: string, limit = 20) {
    const category = await this.prisma.category.findFirst({
      where: {
        isActive: true,
        OR: [{ slug }, { id: slug }],
      },
    });

    if (!category) {
      throw new NotFoundException(`Category "${slug}" not found`);
    }

    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.ACTIVE,
      categoryId: category.id,
    };

    const [products, productCount] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: this.publicProductInclude,
        orderBy: this.getPublicProductOrderBy('updatedAt', 'desc'),
        take: Math.min(Math.max(Number(limit ?? 20), 1), 50),
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      category: {
        slug: category.slug,
        name: category.name,
        description: '',
        image: category.imageUrl,
        productCount,
      },
      products: products.map((product) => this.mapPublicProduct(product)),
      total: productCount,
    };
  }

  // ==================== ADMIN METHODS (Prisma) ====================

  async findAllAdmin(dto: QueryProductAdminDto) {
    const { search, status, categoryId, storeId, page = 1, limit = 20 } = dto;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (search) {
      where.name = { contains: search };
    }
    if (status) {
      where.status = status;
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (storeId) {
      where.storeId = storeId;
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          images: { orderBy: { position: 'asc' } },
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true } },
          store: { select: { id: true, name: true, slug: true } },
          _count: { select: { variants: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneAdmin(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { position: 'asc' } },
        variants: { orderBy: { createdAt: 'asc' } },
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true } },
        store: { select: { id: true, name: true, slug: true } },
        tags: {
          include: {
            tag: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    return product;
  }

  async create(dto: CreateProductDto) {
    if (dto.status === 'ACTIVE') {
      await this.assertStoreDeliverySetupComplete(dto.storeId);
    }

    // Generate slug from name
    const slug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        slug,
        storeId: dto.storeId,
        description: dto.description,
        price: dto.price,
        comparePrice: dto.comparePrice,
        sku: dto.sku,
        stock: dto.stock ?? 0,
        lowStock: dto.lowStock ?? 5,
        status: (dto.status as 'ACTIVE' | 'DRAFT' | 'ARCHIVED' | 'PENDING') || 'DRAFT',
        categoryId: dto.categoryId,
        brandId: dto.brandId,
        isFeatured: dto.isFeatured ?? false,
        images: dto.images
          ? {
              create: dto.images.map((url, index) => ({
                url,
                position: index,
                isMain: index === 0,
              })),
            }
          : undefined,
        variants: dto.variants
          ? {
              create: dto.variants.map((v) => ({
                name: v.name,
                price: v.price,
                stock: v.stock ?? 0,
                sku: v.sku,
                values: v.variantValueIds?.length
                  ? { connect: v.variantValueIds.map((id) => ({ id })) }
                  : undefined,
              })),
            }
          : undefined,
      },
      include: {
        images: { orderBy: { position: 'asc' } },
        variants: true,
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        store: { select: { id: true, name: true, slug: true } },
      },
    });

    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOneAdmin(id);

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) {
      data.name = dto.name;
      data.slug = dto.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.price !== undefined) data.price = dto.price;
    if (dto.comparePrice !== undefined) data.comparePrice = dto.comparePrice;
    if (dto.sku !== undefined) data.sku = dto.sku;
    if (dto.stock !== undefined) data.stock = dto.stock;
    if (dto.lowStock !== undefined) data.lowStock = dto.lowStock;
    if (dto.categoryId !== undefined) data.categoryId = dto.categoryId;
    if (dto.brandId !== undefined) data.brandId = dto.brandId;

    return this.prisma.$transaction(async (tx) => {
      if (dto.images !== undefined) {
        await tx.productMedia.deleteMany({
          where: { productId: id },
        });
      }

      return tx.product.update({
        where: { id },
        data: {
          ...data,
          ...(dto.images !== undefined
            ? {
                images: {
                  create: dto.images.map((url, index) => ({
                    url,
                    position: index,
                    isMain: index === 0,
                  })),
                },
              }
            : {}),
        },
        include: {
          images: { orderBy: { position: 'asc' } },
          variants: true,
          category: { select: { id: true, name: true } },
          brand: { select: { id: true, name: true } },
          store: { select: { id: true, name: true, slug: true } },
        },
      });
    });
  }

  async updateStatus(id: string, dto: UpdateProductStatusDto) {
    const product = await this.findOneAdmin(id);
    if (dto.status === 'ACTIVE') {
      await this.assertStoreDeliverySetupComplete(product.storeId);
    }

    return this.prisma.product.update({
      where: { id },
      data: { status: dto.status as 'ACTIVE' | 'DRAFT' | 'ARCHIVED' | 'PENDING' },
    });
  }

  async toggleFeatured(id: string) {
    const product = await this.findOneAdmin(id);

    return this.prisma.product.update({
      where: { id },
      data: { isFeatured: !product.isFeatured },
    });
  }

  async remove(id: string) {
    await this.findOneAdmin(id);

    return this.prisma.product.delete({
      where: { id },
    });
  }

  async addImage(productId: string, dto: AddProductImageDto) {
    await this.findOneAdmin(productId);

    // If this is set as main, unset all other main images
    if (dto.isMain) {
      await this.prisma.productMedia.updateMany({
        where: { productId, isMain: true },
        data: { isMain: false },
      });
    }

    return this.prisma.productMedia.create({
      data: {
        productId,
        url: dto.url,
        alt: dto.alt,
        position: dto.position ?? 0,
        isMain: dto.isMain ?? false,
      },
    });
  }

  async removeImage(productId: string, imageId: string) {
    await this.findOneAdmin(productId);

    const image = await this.prisma.productMedia.findFirst({
      where: { id: imageId, productId },
    });

    if (!image) {
      throw new NotFoundException(`Image with ID "${imageId}" not found for this product`);
    }

    return this.prisma.productMedia.delete({
      where: { id: imageId },
    });
  }

  async addVariant(productId: string, dto: CreateProductVariantDto) {
    await this.findOneAdmin(productId);

    return this.prisma.productVariant.create({
      data: {
        productId,
        name: dto.name,
        price: dto.price,
        stock: dto.stock ?? 0,
        sku: dto.sku,
        values: dto.variantValueIds?.length
          ? { connect: dto.variantValueIds.map((id) => ({ id })) }
          : undefined,
      },
    });
  }

  async updateVariant(productId: string, variantId: string, dto: UpdateProductVariantDto) {
    await this.findOneAdmin(productId);

    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, productId },
    });

    if (!variant) {
      throw new NotFoundException(`Variant with ID "${variantId}" not found for this product`);
    }

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.price !== undefined) data.price = dto.price;
    if (dto.stock !== undefined) data.stock = dto.stock;
    if (dto.sku !== undefined) data.sku = dto.sku;

    return this.prisma.productVariant.update({
      where: { id: variantId },
      data: {
        ...data,
        values: dto.variantValueIds
          ? { set: dto.variantValueIds.map((id) => ({ id })) }
          : undefined,
      },
    });
  }

  async removeVariant(productId: string, variantId: string) {
    await this.findOneAdmin(productId);

    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, productId },
    });

    if (!variant) {
      throw new NotFoundException(`Variant with ID "${variantId}" not found for this product`);
    }

    return this.prisma.productVariant.delete({
      where: { id: variantId },
    });
  }

  private async assertStoreDeliverySetupComplete(storeId: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { deliverySetupComplete: true },
    });
    if (!store?.deliverySetupComplete) {
      throw new BadRequestException('Complete store delivery zones before publishing products');
    }
  }
}
