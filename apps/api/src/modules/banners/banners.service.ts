import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateBannerDto, UpdateBannerDto, QueryBannerDto } from './dto';

@Injectable()
export class BannersService {
  private readonly logger = new Logger(BannersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryBannerDto) {
    const where: Record<string, unknown> = { isActive: true };
    if (query.bannerType) {
      where.bannerType = query.bannerType;
    }

    const banners = await this.prisma.banner.findMany({
      where,
      orderBy: { position: 'asc' },
    });

    return { data: banners };
  }

  async findOne(id: string) {
    const banner = await this.prisma.banner.findUnique({
      where: { id },
    });

    if (!banner) {
      throw new NotFoundException(`Banner with ID "${id}" not found`);
    }

    return banner;
  }

  async create(dto: CreateBannerDto) {
    return this.prisma.banner.create({
      data: {
        title: dto.title,
        subTitle: dto.subTitle,
        image: dto.image,
        url: dto.url,
        bannerType: dto.bannerType || 'MAIN_BANNER',
        resourceType: dto.resourceType,
        resourceId: dto.resourceId,
        backgroundColor: dto.backgroundColor,
        buttonText: dto.buttonText,
        position: dto.position ?? 0,
      },
    });
  }

  async update(id: string, dto: UpdateBannerDto) {
    await this.findOne(id);

    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.subTitle !== undefined) data.subTitle = dto.subTitle;
    if (dto.image !== undefined) data.image = dto.image;
    if (dto.url !== undefined) data.url = dto.url;
    if (dto.bannerType !== undefined) data.bannerType = dto.bannerType;
    if (dto.resourceType !== undefined) data.resourceType = dto.resourceType;
    if (dto.resourceId !== undefined) data.resourceId = dto.resourceId;
    if (dto.backgroundColor !== undefined) data.backgroundColor = dto.backgroundColor;
    if (dto.buttonText !== undefined) data.buttonText = dto.buttonText;
    if (dto.position !== undefined) data.position = dto.position;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return this.prisma.banner.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.banner.delete({
      where: { id },
    });
  }
}
