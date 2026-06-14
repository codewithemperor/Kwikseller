import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { SearchProductsDto } from './dto';
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

  async getHomeFeed() {
    const [banners, categories, brands, products] = await Promise.all([
      this.prisma.banner.findMany({
        where: { isActive: true },
        orderBy: [{ position: 'asc' }, { updatedAt: 'desc' }],
        take: 6,
      }),
      this.prisma.category.findMany({
        where: { isActive: true },
        orderBy: [{ position: 'asc' }, { updatedAt: 'desc' }],
        include: {
          _count: { select: { products: true } },
        },
        take: 12,
      }),
      this.prisma.brand.findMany({
        where: { status: true },
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: { select: { products: true } },
        },
        take: 12,
      }),
      this.prisma.product.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { updatedAt: 'desc' },
        include: {
          images: { orderBy: { position: 'asc' } },
          category: { select: { id: true, name: true, slug: true } },
          store: { select: { id: true, name: true, slug: true } },
          inventoryItems: { select: { available: true, reserved: true, lowStockThreshold: true } },
        },
        take: 60,
      }),
    ]);

    const mappedProducts = products.map((product) => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      comparePrice: product.comparePrice ?? undefined,
      image: product.images[0]?.url ?? null,
      rating: product.rating ?? 0,
      reviewCount: product.reviewCount ?? 0,
      store: product.store.name,
      storeId: product.store.id,
      storeSlug: product.store.slug,
      category: product.category?.name ?? 'Kwikseller',
      categorySlug: product.category?.slug ?? '',
      productType: product.productType,
      productSource: product.productSource,
      requiresShipping: product.requiresShipping,
      trackInventory: product.trackInventory,
      poolProductId: product.poolProductId,
      stock:
        product.inventoryItems.reduce(
          (sum, item) => sum + item.available,
          0,
        ) || product.stock,
      lowStock:
        product.inventoryItems[0]?.lowStockThreshold ?? product.lowStock,
      isNew:
        Date.now() - new Date(product.createdAt).getTime() <
        1000 * 60 * 60 * 24 * 21,
      totalSales: product.totalSales ?? 0,
      isFeatured: product.isFeatured,
    }));

    const randomProducts = this.shuffle(mappedProducts);
    const featuredProducts = this.shuffle(
      mappedProducts.filter((product) => product.isFeatured),
    );
    const discountedProducts = this.shuffle(
      mappedProducts.filter(
        (product) =>
          typeof product.comparePrice === 'number' &&
          product.comparePrice > product.price,
      ),
    );
    const trendingProducts = this.shuffle(
      [...mappedProducts]
        .sort((a, b) => b.totalSales - a.totalSales || b.rating - a.rating)
        .slice(0, 20),
    );

    return {
      heroBanners: this.shuffle(banners).slice(0, 3).map((banner) => ({
        id: banner.id,
        title: banner.title || 'Shop the latest picks',
        subtitle:
          banner.subTitle || 'Fresh finds from trusted Kwikseller vendors.',
        image: banner.image,
        href: banner.url || '/products',
        badge: banner.bannerType.replace(/_/g, ' '),
      })),
      categories: this.shuffle(categories).slice(0, 8).map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        image: category.imageUrl,
        itemCount: category._count.products,
      })),
      brands: this.shuffle(brands).slice(0, 8).map((brand) => ({
        id: brand.id,
        name: brand.name,
        image: brand.image,
        productCount: brand._count.products,
      })),
      featuredProducts: (featuredProducts.length ? featuredProducts : randomProducts).slice(0, 8),
      dealProducts: (discountedProducts.length ? discountedProducts : randomProducts).slice(0, 8),
      trendingProducts: (trendingProducts.length ? trendingProducts : randomProducts).slice(0, 8),
    };
  }

  async search(dto: SearchProductsDto) {
    const query = (dto.q || (dto as SearchProductsDto & { search?: string }).search || '').trim();
    const category = dto.category?.trim();
    const limit = Math.min(Math.max(Number(dto.limit ?? 20), 1), 50);
    const sortOrder = dto.sortOrder === 'asc' ? 'asc' : 'desc';

    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.ACTIVE,
    };

    if (category) {
      where.category = {
        OR: [{ slug: category }, { id: category }],
      };
    }

    if (query) {
      where.OR = [
        { id: query },
        { slug: { contains: query, mode: 'insensitive' } },
        { name: { contains: query, mode: 'insensitive' } },
        { shortDescription: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { store: { name: { contains: query, mode: 'insensitive' } } },
        { category: { name: { contains: query, mode: 'insensitive' } } },
        { category: { slug: { contains: query, mode: 'insensitive' } } },
        { tags: { some: { tag: { name: { contains: query, mode: 'insensitive' } } } } },
      ];
    }

    const [products, total, categories] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: this.publicProductInclude,
        orderBy: this.getPublicProductOrderBy(dto.sortBy, sortOrder),
        take: limit,
      }),
      this.prisma.product.count({ where }),
      this.getCategories(),
    ]);

    return {
      data: products.map((product) => this.mapPublicProduct(product)),
      meta: {
        query,
        category: category || '',
        total,
        categories,
      },
    };
  }

  private async getCategories(): Promise<{ slug: string; name: string; count: number }[]> {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: {
            products: { where: { status: ProductStatus.ACTIVE } },
          },
        },
      },
    });

    return categories.map((category) => ({
      slug: category.slug,
      name: category.name,
      count: category._count.products,
    }));
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
      reviews: [],
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
