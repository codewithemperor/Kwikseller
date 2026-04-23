import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateDealDto, UpdateDealDto, AddDealProductDto, QueryDealDto } from './dto';

@Injectable()
export class DealsService {
  private readonly logger = new Logger(DealsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryDealDto) {
    const { dealType, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const now = new Date();

    const where: Record<string, unknown> = {
      isActive: true,
      startDate: { lte: now },
    };

    if (dealType) {
      where.dealType = dealType;
    } else {
      // Only show deals that haven't ended (or have no end date)
      where.OR = [
        { endDate: null },
        { endDate: { gte: now } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.deal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: 'desc' },
        include: {
          _count: { select: { products: true } },
        },
      }),
      this.prisma.deal.count({ where }),
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
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            product: {
              include: {
                images: { where: { isMain: true }, take: 1 },
                brand: { select: { id: true, name: true } },
                store: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    if (!deal) {
      throw new NotFoundException(`Deal with ID "${id}" not found`);
    }

    return deal;
  }

  async getFlashDeals() {
    const now = new Date();

    const deals = await this.prisma.deal.findMany({
      where: {
        dealType: 'FLASH_DEAL',
        isActive: true,
        startDate: { lte: now },
        OR: [
          { endDate: null },
          { endDate: { gte: now } },
        ],
      },
      orderBy: { startDate: 'desc' },
      include: {
        products: {
          include: {
            product: {
              include: {
                images: { where: { isMain: true }, take: 1 },
                store: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      take: 10,
    });

    return { data: deals };
  }

  async getFeaturedDeals() {
    const now = new Date();

    const deals = await this.prisma.deal.findMany({
      where: {
        dealType: 'FEATURED_DEAL',
        isActive: true,
        startDate: { lte: now },
        OR: [
          { endDate: null },
          { endDate: { gte: now } },
        ],
      },
      orderBy: { startDate: 'desc' },
      include: {
        products: {
          include: {
            product: {
              include: {
                images: { where: { isMain: true }, take: 1 },
                store: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      take: 10,
    });

    return { data: deals };
  }

  async create(dto: CreateDealDto) {
    return this.prisma.deal.create({
      data: {
        title: dto.title,
        description: dto.description,
        dealType: dto.dealType || 'FLASH_DEAL',
        discountType: dto.discountType || 'PERCENTAGE',
        discountValue: dto.discountValue ?? 0,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        minOrderValue: dto.minOrderValue ?? 0,
        maxUses: dto.maxUses,
      },
    });
  }

  async update(id: string, dto: UpdateDealDto) {
    await this.findOne(id);

    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.dealType !== undefined) data.dealType = dto.dealType;
    if (dto.discountType !== undefined) data.discountType = dto.discountType;
    if (dto.discountValue !== undefined) data.discountValue = dto.discountValue;
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) data.endDate = dto.endDate ? new Date(dto.endDate) : null;
    if (dto.minOrderValue !== undefined) data.minOrderValue = dto.minOrderValue;
    if (dto.maxUses !== undefined) data.maxUses = dto.maxUses;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return this.prisma.deal.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.deal.delete({
      where: { id },
    });
  }

  async addProduct(dealId: string, dto: AddDealProductDto) {
    await this.findOne(dealId);

    // Verify product exists
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID "${dto.productId}" not found`);
    }

    try {
      return await this.prisma.dealProduct.create({
        data: {
          dealId,
          productId: dto.productId,
          dealPrice: dto.dealPrice,
        },
        include: {
          product: {
            include: {
              images: { where: { isMain: true }, take: 1 },
            },
          },
        },
      });
    } catch {
      throw new BadRequestException(
        'This product is already added to this deal',
      );
    }
  }
}
