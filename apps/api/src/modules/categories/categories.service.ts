import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all categories as a tree structure (top-level only, with children)
   */
  async findAll() {
    const categories = await this.prisma.category.findMany({
      where: { parentId: null, isActive: true },
      orderBy: { position: 'asc' },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { position: 'asc' },
          include: {
            children: {
              where: { isActive: true },
              orderBy: { position: 'asc' },
            },
          },
        },
        _count: { select: { products: true } },
      },
    });

    return { data: categories };
  }

  /**
   * Get a single category by ID with products count
   */
  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true } },
        parent: {
          select: { id: true, name: true, slug: true },
        },
        children: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    return category;
  }

  /**
   * Get a category by slug with its products
   */
  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        _count: { select: { products: true } },
        parent: {
          select: { id: true, name: true, slug: true },
        },
        children: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with slug "${slug}" not found`);
    }

    // Get products in this category and its children
    const childIds = category.children.map((c) => c.id);
    const allCategoryIds = [category.id, ...childIds];

    const products = await this.prisma.product.findMany({
      where: {
        categoryId: { in: allCategoryIds },
        status: 'ACTIVE',
      },
      include: {
        images: { where: { isMain: true }, take: 1 },
        brand: { select: { id: true, name: true } },
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    return {
      category,
      products,
    };
  }

  /**
   * Create a new category
   */
  async create(dto: CreateCategoryDto) {
    const slug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    return this.prisma.category.create({
      data: {
        name: dto.name,
        slug,
        parentId: dto.parentId,
        imageUrl: dto.imageUrl,
        icon: dto.icon,
        position: dto.position ?? 0,
      },
    });
  }

  /**
   * Update a category
   */
  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) {
      data.name = dto.name;
      data.slug = dto.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }
    if (dto.parentId !== undefined) data.parentId = dto.parentId;
    if (dto.imageUrl !== undefined) data.imageUrl = dto.imageUrl;
    if (dto.icon !== undefined) data.icon = dto.icon;
    if (dto.position !== undefined) data.position = dto.position;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  /**
   * Toggle category active status
   */
  async toggleStatus(id: string) {
    const category = await this.findOne(id);

    return this.prisma.category.update({
      where: { id },
      data: { isActive: !category.isActive },
    });
  }

  /**
   * Delete a category
   */
  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.category.delete({
      where: { id },
    });
  }
}
