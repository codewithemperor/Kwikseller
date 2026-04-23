import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
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
import {
  allProducts,
  SearchableProduct,
  categoriesMetadata,
  CategoryMetadata,
} from './products.data';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Search products by query string (public - uses static data for backward compat)
   */
  search(dto: SearchProductsDto) {
    const { q, category, limit = 20 } = dto;

    if (category && !q?.trim()) {
      const filtered = allProducts
        .filter((p) => p.categorySlug === category)
        .slice(0, limit);

      return {
        data: filtered,
        meta: {
          query: '',
          category,
          total: filtered.length,
          categories: this.getCategories(),
        },
      };
    }

    if (q?.trim()) {
      const terms = q
        .toLowerCase()
        .split(/\s+/)
        .filter((t) => t.length > 0);

      const scored = allProducts
        .map((product) => {
          let score = 0;
          const name = product.name.toLowerCase();
          const desc = product.description.toLowerCase();
          const cat = product.category.toLowerCase();
          const catSlug = product.categorySlug.toLowerCase();
          const store = product.store.toLowerCase();
          const tags = product.tags.map((t) => t.toLowerCase());

          for (const term of terms) {
            if (name === term) score += 100;
            else if (name.startsWith(term)) score += 80;
            else if (name.includes(term)) score += 60;

            if (tags.some((t) => t === term)) score += 50;
            else if (tags.some((t) => t.includes(term))) score += 30;

            if (cat === term || catSlug === term) score += 40;
            else if (cat.includes(term) || catSlug.includes(term)) score += 25;

            if (store.includes(term)) score += 15;
            if (desc.includes(term)) score += 10;

            if (product.isFeatured) score += 5;
            if (product.isNew) score += 3;
          }

          if (category && product.categorySlug !== category) {
            score = 0;
          }

          return { product, score };
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((item) => item.product);

      return {
        data: scored,
        meta: {
          query: q,
          category: category || '',
          total: scored.length,
          categories: this.getCategories(),
        },
      };
    }

    return {
      data: [],
      meta: {
        query: '',
        category: '',
        total: 0,
        categories: this.getCategories(),
      },
    };
  }

  private getCategories(): { slug: string; name: string; count: number }[] {
    const catMap = new Map<string, { name: string; count: number }>();
    for (const p of allProducts) {
      const existing = catMap.get(p.categorySlug);
      if (existing) {
        existing.count++;
      } else {
        catMap.set(p.categorySlug, { name: p.category, count: 1 });
      }
    }
    return Array.from(catMap.entries()).map(([slug, { name, count }]) => ({
      slug,
      name,
      count,
    }));
  }

  getById(id: string): SearchableProduct | null {
    return allProducts.find((p) => p.id === id) || null;
  }

  getFeatured(limit = 8): SearchableProduct[] {
    return allProducts.filter((p) => p.isFeatured).slice(0, limit);
  }

  getTrending(limit = 10): SearchableProduct[] {
    return allProducts
      .slice()
      .sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return b.rating - a.rating;
      })
      .slice(0, limit);
  }

  getTop(limit = 10): SearchableProduct[] {
    return allProducts
      .slice()
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }

  getDeals(limit = 10): (SearchableProduct & { discountPercent: number })[] {
    return allProducts
      .filter((p) => p.comparePrice && p.comparePrice > p.price)
      .map((p) => {
        const discountPercent =
          ((p.comparePrice! - p.price) / p.comparePrice!) * 100;
        return { product: p, discountPercent };
      })
      .sort((a, b) => b.discountPercent - a.discountPercent)
      .slice(0, limit)
      .map((item) => ({
        ...item.product,
        discountPercent: Math.round(item.discountPercent),
      })) as (SearchableProduct & { discountPercent: number })[];
  }

  getCategoryDetail(slug: string, limit = 20) {
    const categoryMeta = categoriesMetadata.find((c) => c.slug === slug);

    const products = allProducts.filter((p) => p.categorySlug === slug);
    const productCount = products.length;

    let category: CategoryMetadata & { productCount: number };

    if (categoryMeta) {
      category = {
        ...categoryMeta,
        productCount,
      };
    } else if (products.length > 0) {
      category = {
        slug,
        name: products[0].category,
        description: '',
        image: products[0].image,
        productCount,
      };
    } else {
      throw new NotFoundException(`Category "${slug}" not found`);
    }

    return {
      category,
      products: products.slice(0, limit),
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
          store: { select: { id: true, name: true } },
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
        store: { select: { id: true, name: true } },
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
                options: v.options || '{}',
                price: v.price,
                stock: v.stock ?? 0,
                sku: v.sku,
              })),
            }
          : undefined,
      },
      include: {
        images: { orderBy: { position: 'asc' } },
        variants: true,
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        store: { select: { id: true, name: true } },
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

    return this.prisma.product.update({
      where: { id },
      data,
      include: {
        images: { orderBy: { position: 'asc' } },
        variants: true,
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        store: { select: { id: true, name: true } },
      },
    });
  }

  async updateStatus(id: string, dto: UpdateProductStatusDto) {
    await this.findOneAdmin(id);

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
      await this.prisma.productImage.updateMany({
        where: { productId, isMain: true },
        data: { isMain: false },
      });
    }

    return this.prisma.productImage.create({
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

    const image = await this.prisma.productImage.findFirst({
      where: { id: imageId, productId },
    });

    if (!image) {
      throw new NotFoundException(`Image with ID "${imageId}" not found for this product`);
    }

    return this.prisma.productImage.delete({
      where: { id: imageId },
    });
  }

  async addVariant(productId: string, dto: CreateProductVariantDto) {
    await this.findOneAdmin(productId);

    return this.prisma.productVariant.create({
      data: {
        productId,
        name: dto.name,
        options: dto.options || '{}',
        price: dto.price,
        stock: dto.stock ?? 0,
        sku: dto.sku,
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
    if (dto.options !== undefined) data.options = dto.options;
    if (dto.price !== undefined) data.price = dto.price;
    if (dto.stock !== undefined) data.stock = dto.stock;
    if (dto.sku !== undefined) data.sku = dto.sku;

    return this.prisma.productVariant.update({
      where: { id: variantId },
      data,
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
}
