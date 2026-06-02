import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCouponDto, UpdateCouponDto, ValidateCouponDto, QueryCouponDto } from './dto';

@Injectable()
export class CouponsService {
  private readonly logger = new Logger(CouponsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryCouponDto) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.coupon.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { products: true, categories: true },
      }),
      this.prisma.coupon.count(),
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

  async findOne(id: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
      include: { products: true, categories: true },
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon with ID "${id}" not found`);
    }

    return coupon;
  }

  async create(dto: CreateCouponDto) {
    const code = dto.code.toUpperCase().trim();

    // Check for duplicate code
    const existing = await this.prisma.coupon.findUnique({
      where: { code },
    });
    if (existing) {
      throw new BadRequestException(`Coupon code "${code}" already exists`);
    }

    return this.prisma.coupon.create({
      data: {
        code,
        title: dto.title,
        description: dto.description,
        discountType: dto.discountType || 'PERCENTAGE',
        discountValue: dto.discountValue ?? 0,
        minOrderValue: dto.minOrderValue ?? 0,
        maxDiscount: dto.maxDiscount,
        maxUses: dto.maxUses,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        products: dto.productIds?.length
          ? { create: dto.productIds.map((productId) => ({ productId })) }
          : undefined,
        categories: dto.categoryIds?.length
          ? { create: dto.categoryIds.map((categoryId) => ({ categoryId })) }
          : undefined,
      },
      include: { products: true, categories: true },
    });
  }

  async update(id: string, dto: UpdateCouponDto) {
    await this.findOne(id);

    const data: Record<string, unknown> = {};
    if (dto.code !== undefined) {
      const code = dto.code.toUpperCase().trim();
      const existing = await this.prisma.coupon.findUnique({
        where: { code },
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException(`Coupon code "${code}" already exists`);
      }
      data.code = code;
    }
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.discountType !== undefined) data.discountType = dto.discountType;
    if (dto.discountValue !== undefined) data.discountValue = dto.discountValue;
    if (dto.minOrderValue !== undefined) data.minOrderValue = dto.minOrderValue;
    if (dto.maxDiscount !== undefined) data.maxDiscount = dto.maxDiscount;
    if (dto.maxUses !== undefined) data.maxUses = dto.maxUses;
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) data.endDate = dto.endDate ? new Date(dto.endDate) : null;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return this.prisma.$transaction(async (tx) => {
      if (dto.productIds !== undefined) {
        await tx.couponProduct.deleteMany({ where: { couponId: id } });
      }
      if (dto.categoryIds !== undefined) {
        await tx.couponCategory.deleteMany({ where: { couponId: id } });
      }

      return tx.coupon.update({
        where: { id },
        data: {
          ...data,
          products: dto.productIds?.length
            ? { create: dto.productIds.map((productId) => ({ productId })) }
            : undefined,
          categories: dto.categoryIds?.length
            ? { create: dto.categoryIds.map((categoryId) => ({ categoryId })) }
            : undefined,
        },
        include: { products: true, categories: true },
      });
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.coupon.delete({
      where: { id },
    });
  }

  async validate(dto: ValidateCouponDto) {
    const code = dto.code.toUpperCase().trim();
    const now = new Date();

    const coupon = await this.prisma.coupon.findUnique({
      where: { code },
      include: { products: true, categories: true },
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon code "${code}" not found`);
    }

    if (!coupon.isActive) {
      throw new BadRequestException('This coupon is no longer active');
    }

    if (coupon.startDate > now) {
      throw new BadRequestException('This coupon is not yet valid');
    }

    if (coupon.endDate && coupon.endDate < now) {
      throw new BadRequestException('This coupon has expired');
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestException('This coupon has reached its maximum usage limit');
    }

    if (dto.orderAmount < coupon.minOrderValue) {
      throw new BadRequestException(
        `Minimum order value of ${coupon.minOrderValue} required for this coupon`,
      );
    }

    const productIds = this.parseIdList(dto.productIds);
    const categoryIds = this.parseIdList(dto.categoryIds);
    const couponProductIds = coupon.products.map((item) => item.productId);
    const couponCategoryIds = coupon.categories.map((item) => item.categoryId);
    if (
      couponProductIds.length &&
      !productIds.some((productId) => couponProductIds.includes(productId))
    ) {
      throw new BadRequestException('This coupon does not apply to the selected products');
    }
    if (
      couponCategoryIds.length &&
      !categoryIds.some((categoryId) => couponCategoryIds.includes(categoryId))
    ) {
      throw new BadRequestException('This coupon does not apply to the selected categories');
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discount = (dto.orderAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.discountValue;
    }

    return {
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        title: coupon.title,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
      discount,
      orderAmount: dto.orderAmount,
      finalAmount: Math.max(dto.orderAmount - discount, 0),
    };
  }

  private parseIdList(value?: string) {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
    } catch {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
}
