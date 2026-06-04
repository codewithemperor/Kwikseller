import {
  Controller,
  Patch,
  Body,
  UseGuards,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../../database/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

class UpdateVendorProfileDto {
  storeName?: string;
  storeSlug?: string;
  storeDescription?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
}

// ─── Controller ───────────────────────────────────────────────────────────────

@ApiTags('Vendor Profile')
@ApiBearerAuth()
@Controller('vendor/profile')
@UseGuards(JwtAuthGuard)
export class VendorProfileController {
  constructor(private readonly prisma: PrismaService) {}

  @Patch()
  @ApiOperation({ summary: 'Update vendor profile (user info + store info)' })
  async updateProfile(
    @CurrentUser() user: any,
    @Body() dto: UpdateVendorProfileDto,
  ) {
    // Find the store
    const store = await this.prisma.store.findUnique({
      where: { vendorId: user.sub },
    });

    if (!store) {
      throw new NotFoundException('No store found for this vendor. Please create a store first.');
    }

    // Validate slug uniqueness if changing
    if (dto.storeSlug && dto.storeSlug !== store.slug) {
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      if (!slugRegex.test(dto.storeSlug)) {
        throw new BadRequestException(
          'Store slug must be lowercase with hyphens only (e.g., my-store-name).',
        );
      }
      if (dto.storeSlug.length < 3) {
        throw new BadRequestException('Store slug must be at least 3 characters.');
      }

      const existing = await this.prisma.store.findUnique({
        where: { slug: dto.storeSlug },
      });
      if (existing && existing.id !== store.id) {
        throw new BadRequestException('This store slug is already taken. Please choose another.');
      }
    }

    // Update user profile and store in a transaction
    const [updatedUser, updatedStore] = await this.prisma.$transaction([
      // Update User phone if provided
      this.prisma.user.update({
        where: { id: user.sub },
        data: {
          ...(dto.phone && { phone: dto.phone }),
          profile: {
            upsert: {
              create: {
                ...(dto.firstName && { firstName: dto.firstName }),
                ...(dto.lastName && { lastName: dto.lastName }),
              },
              update: {
                ...(dto.firstName && { firstName: dto.firstName }),
                ...(dto.lastName && { lastName: dto.lastName }),
              },
            },
          },
        },
        include: { profile: true },
      }),

      // Update Store
      this.prisma.store.update({
        where: { id: store.id },
        data: {
          ...(dto.storeName && { name: dto.storeName }),
          ...(dto.storeSlug && { slug: dto.storeSlug }),
          ...(dto.storeDescription !== undefined && { description: dto.storeDescription }),
        },
      }),
    ]);

    return {
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        phone: updatedUser.phone,
        firstName: updatedUser.profile?.firstName,
        lastName: updatedUser.profile?.lastName,
        avatarUrl: updatedUser.profile?.avatarUrl,
      },
      store: {
        id: updatedStore.id,
        name: updatedStore.name,
        slug: updatedStore.slug,
        description: updatedStore.description,
        logoUrl: updatedStore.logoUrl,
        category: updatedStore.category,
        isVerified: updatedStore.isVerified,
      },
    };
  }
}
