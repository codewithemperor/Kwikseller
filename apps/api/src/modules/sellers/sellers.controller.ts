import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../database/prisma.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Sellers')
@Controller('sellers')
export class SellersController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List top sellers with store info' })
  async list(@Query('limit') limit?: string) {
    const take = limit ? Math.min(Number(limit), 100) : 10;

    const stores = await this.prisma.store.findMany({
      where: {
        isVerified: true,
        onboardingComplete: true,
      },
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        vendor: {
          select: {
            id: true,
            email: true,
            profile: {
              select: { firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
        _count: {
          select: { products: true, orders: true },
        },
      },
    });

    const sellers = stores.map((store) => ({
      id: store.id,
      name: store.name,
      slug: store.slug,
      description: store.description,
      logo: store.logoUrl,
      banner: store.bannerUrl,
      isVerified: store.isVerified,
      productCount: store._count.products,
      orderCount: store._count.orders,
      vendor: store.vendor
        ? {
            name: `${store.vendor.profile?.firstName ?? ''} ${store.vendor.profile?.lastName ?? ''}`.trim(),
            avatar: store.vendor.profile?.avatarUrl,
          }
        : null,
    }));

    return { data: sellers };
  }
}
