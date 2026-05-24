import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';
import { UploadService } from '../upload/upload.service';

type AuthContext = {
  id?: string;
  sub?: string;
  userId?: string;
  role?: string;
};

type StoreProfileDto = {
  name?: string;
  slug?: string;
  description?: string;
  category?: string;
  logoUrl?: string;
  bannerUrl?: string;
};

@Injectable()
export class StoreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly upload: UploadService,
  ) {}

  private db() {
    return this.prisma as unknown as Record<string, any>;
  }

  private userId(user: AuthContext) {
    const id = user?.id ?? user?.sub ?? user?.userId;
    if (!id) throw new ForbiddenException('Vendor authentication required');
    if (`${user.role ?? ''}`.toUpperCase() !== 'VENDOR') {
      throw new ForbiddenException('Only vendors can manage store profile');
    }
    return id;
  }

  private slugify(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
      .slice(0, 70);
  }

  private async uniqueSlug(baseValue: string, currentStoreId?: string) {
    const base = this.slugify(baseValue) || `store-${randomUUID().slice(0, 6)}`;
    let slug = base;
    let suffix = 2;
    while (true) {
      const existing = await this.db().store.findUnique({ where: { slug }, select: { id: true } });
      if (!existing || existing.id === currentStoreId) return slug;
      slug = `${base}-${suffix}`;
      suffix += 1;
    }
  }

  private include() {
    return {
      storefrontDesign: true,
      deliverySetting: { include: { areas: true } },
    };
  }

  async getStore(user: AuthContext) {
    const vendorId = this.userId(user);
    const store = await this.db().store.findUnique({
      where: { vendorId },
      include: this.include(),
    });
    if (!store) {
      throw new NotFoundException('Store setup is required before using the vendor dashboard');
    }
    return store;
  }

  async createStore(user: AuthContext, dto: StoreProfileDto) {
    const vendorId = this.userId(user);
    if (!dto.name || dto.name.trim().length < 3) {
      throw new BadRequestException('Store name is required');
    }
    const existing = await this.db().store.findUnique({ where: { vendorId }, select: { id: true } });
    if (existing) return this.updateStore(user, dto);
    const slug = await this.uniqueSlug(dto.slug || dto.name);
    return this.db().store.create({
      data: {
        vendorId,
        name: dto.name.trim(),
        slug,
        description: dto.description,
        category: dto.category || 'other',
        logoUrl: dto.logoUrl,
        bannerUrl: dto.bannerUrl,
        storefrontDesign: {
          create: {
            headingFont: 'SORA',
            bodyFont: 'FIGTREE',
          },
        },
        deliverySetting: {
          create: {
            manualDeliveryEnabled: true,
            kwiksellerDeliveryEnabled: false,
            processingDays: 1,
          },
        },
      },
      include: this.include(),
    });
  }

  async updateStore(user: AuthContext, dto: StoreProfileDto) {
    const store = await this.getStore(user);
    const data: StoreProfileDto = {
      name: dto.name?.trim(),
      description: dto.description,
      category: dto.category,
      logoUrl: dto.logoUrl,
      bannerUrl: dto.bannerUrl,
    };
    if (dto.slug) {
      data.slug = await this.uniqueSlug(dto.slug, store.id);
    }
    return this.db().store.update({
      where: { id: store.id },
      data,
      include: this.include(),
    });
  }

  async uploadLogo(user: AuthContext, file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Logo image is required');
    const store = await this.getStore(user);
    this.upload.validateImage(file);
    const result = await this.upload.uploadImage(file, {
      folder: 'stores/logos',
      publicId: `${store.slug}-logo`,
      maxWidth: 600,
      maxHeight: 600,
    });
    return this.updateStore(user, { logoUrl: result.secureUrl || result.url });
  }

  async uploadBanner(user: AuthContext, file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Banner image is required');
    const store = await this.getStore(user);
    this.upload.validateImage(file);
    const result = await this.upload.uploadImage(file, {
      folder: 'stores/banners',
      publicId: `${store.slug}-banner`,
      maxWidth: 1800,
      maxHeight: 900,
    });
    return this.updateStore(user, { bannerUrl: result.secureUrl || result.url });
  }
}
