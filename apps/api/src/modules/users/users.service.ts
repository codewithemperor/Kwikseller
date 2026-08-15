import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../../common/services/storage.service';
import { AuditService } from '../../common/services/audit.service';
import { NotificationService } from '../../common/services/notification.service';
import {
  UpdateProfileDto,
  UserWithProfileDto,
  ProfileResponseDto,
} from './dto/profile.dto';
import {
  CreateAddressDto,
  UpdateAddressDto,
  AddressResponseDto,
  AddressType,
} from './dto/address.dto';
import {
  KycDocumentType,
  KycDocumentResponseDto,
  KycReviewDto,
} from './dto/kyc.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
  ) {}

  // ==================== PROFILE CRUD ====================

  async getCurrentUser(userId: string): Promise<UserWithProfileDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      phone: user.phone ?? undefined,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      profile: user.profile
        ? {
            id: user.profile.id,
            userId: user.profile.userId,
            firstName: user.profile.firstName ?? undefined,
            lastName: user.profile.lastName ?? undefined,
            avatarUrl: user.profile.avatarUrl ?? undefined,
            bio: user.profile.bio ?? undefined,
            dateOfBirth: user.profile.dateOfBirth ?? undefined,
            createdAt: user.profile.createdAt,
            updatedAt: user.profile.updatedAt,
          }
        : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    } as UserWithProfileDto;
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    ipAddress: string,
  ): Promise<ProfileResponseDto> {
    const existingProfile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    const profile = existingProfile
      ? await this.prisma.userProfile.update({
          where: { userId },
          data: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            bio: dto.bio,
            dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
          },
        })
      : await this.prisma.userProfile.create({
          data: {
            userId,
            firstName: dto.firstName,
            lastName: dto.lastName,
            bio: dto.bio,
            dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
          },
        });

    if (dto.phone !== undefined) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { phone: dto.phone },
      });
    }

    await this.auditService.log({
      userId,
      action: 'PROFILE_UPDATED',
      entity: 'UserProfile',
      entityId: profile.id,
      changes: { ...dto } as Record<string, unknown>,
      ipAddress,
    });

    this.logger.log(`Profile updated for user: ${userId}`);

    return {
      id: profile.id,
      userId: profile.userId,
      firstName: profile.firstName ?? undefined,
      lastName: profile.lastName ?? undefined,
      avatarUrl: profile.avatarUrl ?? undefined,
      bio: profile.bio ?? undefined,
      dateOfBirth: profile.dateOfBirth ?? undefined,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  async uploadProfileImage(
    userId: string,
    file: Express.Multer.File,
    ipAddress: string,
  ): Promise<{ avatarUrl: string }> {
    const result = await this.storageService.uploadProfileImage(file, userId);

    const profile = await this.prisma.userProfile.upsert({
      where: { userId },
      update: { avatarUrl: result.secureUrl },
      create: { userId, avatarUrl: result.secureUrl },
    });

    await this.auditService.log({
      userId,
      action: 'PROFILE_IMAGE_UPLOADED',
      entity: 'UserProfile',
      entityId: profile.id,
      changes: { avatarUrl: result.secureUrl },
      ipAddress,
    });

    this.logger.log(`Profile image uploaded for user: ${userId}`);

    return { avatarUrl: result.secureUrl };
  }

  async deleteProfileImage(userId: string, ipAddress: string): Promise<void> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile?.avatarUrl) {
      throw new NotFoundException('No profile image to delete');
    }

    await this.prisma.userProfile.update({
      where: { userId },
      data: { avatarUrl: null },
    });

    await this.auditService.log({
      userId,
      action: 'PROFILE_IMAGE_DELETED',
      entity: 'UserProfile',
      entityId: profile.id,
      ipAddress,
    });

    this.logger.log(`Profile image deleted for user: ${userId}`);
  }

  // ==================== ADDRESS CRUD ====================

  private splitLocationInput(state?: string, localGovernment?: string) {
    const [stateName = '', ...rest] = (state ?? '')
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);

    return {
      stateName,
      localGovernmentName: localGovernment?.trim() || rest.join(', '),
    };
  }

  private async resolveAddressLocation(dto: {
    state?: string;
    localGovernment?: string;
    stateId?: string;
    lgaId?: string;
  }) {
    if (dto.stateId || dto.lgaId) {
      return { stateId: dto.stateId, lgaId: dto.lgaId };
    }

    const { stateName, localGovernmentName } = this.splitLocationInput(dto.state, dto.localGovernment);
    if (!stateName) return { stateId: undefined, lgaId: undefined };

    const state = await this.prisma.state.findFirst({
      where: { name: { equals: stateName } },
    });

    if (!state) return { stateId: undefined, lgaId: undefined };

    const lga = localGovernmentName
      ? await this.prisma.localGovernment.findFirst({
          where: {
            stateId: state.id,
            name: { equals: localGovernmentName },
          },
        })
      : null;

    return { stateId: state.id, lgaId: lga?.id };
  }

  async getAddresses(userId: string): Promise<AddressResponseDto[]> {
    const addresses = await this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      include: { state: true, lga: true },
    });

    return addresses.map((addr) => this.toAddressResponse(addr));
  }

  async getAddress(userId: string, addressId: string): Promise<AddressResponseDto> {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
      include: { state: true, lga: true },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return this.toAddressResponse(address);
  }

  async createAddress(
    userId: string,
    dto: CreateAddressDto,
    ipAddress: string,
  ): Promise<AddressResponseDto> {
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const location = await this.resolveAddressLocation(dto);
    const address = await this.prisma.address.create({
      data: {
        userId,
        line1: dto.line1,
        line2: dto.line2,
        city: dto.city,
        stateId: location.stateId,
        lgaId: location.lgaId,
        country: dto.country ?? 'Nigeria',
        postalCode: dto.postalCode,
        isDefault: dto.isDefault ?? false,
        type: dto.type ?? AddressType.SHIPPING,
      },
    });

    await this.auditService.log({
      userId,
      action: 'ADDRESS_CREATED',
      entity: 'Address',
      entityId: address.id,
      changes: { ...dto } as Record<string, unknown>,
      ipAddress,
    });

    this.logger.log(`Address created for user: ${userId}`);

    return this.getAddress(userId, address.id);
  }

  async updateAddress(
    userId: string,
    addressId: string,
    dto: UpdateAddressDto,
    ipAddress: string,
  ): Promise<AddressResponseDto> {
    const existing = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!existing) {
      throw new NotFoundException('Address not found');
    }

    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const location = await this.resolveAddressLocation(dto);
    const address = await this.prisma.address.update({
      where: { id: addressId },
      data: {
        line1: dto.line1,
        line2: dto.line2,
        city: dto.city,
        stateId: location.stateId,
        lgaId: location.lgaId,
        country: dto.country,
        postalCode: dto.postalCode,
        isDefault: dto.isDefault,
        type: dto.type,
      },
    });

    await this.auditService.log({
      userId,
      action: 'ADDRESS_UPDATED',
      entity: 'Address',
      entityId: address.id,
      changes: { ...dto } as Record<string, unknown>,
      ipAddress,
    });

    return this.getAddress(userId, address.id);
  }

  async deleteAddress(userId: string, addressId: string, ipAddress: string): Promise<void> {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    await this.prisma.address.delete({
      where: { id: addressId },
    });

    await this.auditService.log({
      userId,
      action: 'ADDRESS_DELETED',
      entity: 'Address',
      entityId: addressId,
      ipAddress,
    });

    this.logger.log(`Address deleted for user: ${userId}`);
  }

  async setDefaultAddress(
    userId: string,
    addressId: string,
    ipAddress: string,
  ): Promise<AddressResponseDto> {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    await this.prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });

    const updated = await this.prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true },
      include: { state: true, lga: true },
    });

    await this.auditService.log({
      userId,
      action: 'ADDRESS_SET_DEFAULT',
      entity: 'Address',
      entityId: addressId,
      ipAddress,
    });

    return this.toAddressResponse(updated);
  }

  private toAddressResponse(address: any): AddressResponseDto {
    return {
      id: address.id,
      userId: address.userId,
      line1: address.line1,
      line2: address.line2 ?? undefined,
      city: address.city,
      state: address.state?.name ?? '',
      stateId: address.stateId ?? undefined,
      localGovernment: address.lga?.name ?? undefined,
      lgaId: address.lgaId ?? undefined,
      country: address.country,
      postalCode: address.postalCode ?? undefined,
      isDefault: address.isDefault,
      type: address.type as AddressType,
      createdAt: address.createdAt,
      updatedAt: address.updatedAt,
    };
  }

  // ==================== KYC DOCUMENTS ====================

  async uploadKycDocument(
    userId: string,
    file: Express.Multer.File,
    documentType: KycDocumentType,
    documentNumber: string | undefined,
    ipAddress: string,
  ): Promise<KycDocumentResponseDto> {
    const existing = await this.prisma.kycDocument.findFirst({
      where: { userId, type: documentType, status: { in: ['PENDING', 'APPROVED'] } },
    });

    if (existing) {
      throw new BadRequestException(
        `You already have a ${documentType} document ${existing.status.toLowerCase()}`,
      );
    }

    const result = await this.storageService.uploadKycDocument(file, userId, documentType);

    const kyc = await this.prisma.kycDocument.create({
      data: {
        userId,
        type: documentType,
        documentUrl: result.secureUrl,
        status: 'PENDING',
      },
    });

    await this.notificationService.create({
      userId,
      type: 'KYC_STATUS',
      title: 'New KYC Document Uploaded',
      message: `A user has uploaded their ${documentType} for verification`,
      data: { kycId: kyc.id, documentType },
    });

    await this.auditService.log({
      userId,
      action: 'KYC_DOCUMENT_UPLOADED',
      entity: 'KycDocument',
      entityId: kyc.id,
      changes: { type: documentType },
      ipAddress,
    });

    this.logger.log(`KYC document uploaded: ${documentType} for user: ${userId}`);

    return {
      id: kyc.id,
      userId: kyc.userId,
      type: kyc.type as KycDocumentType,
      documentUrl: kyc.documentUrl,
      status: kyc.status,
      reviewedBy: kyc.reviewedBy ?? undefined,
      reviewedAt: kyc.reviewedAt ?? undefined,
      rejectionReason: kyc.rejectionReason ?? undefined,
      createdAt: kyc.createdAt,
      updatedAt: kyc.updatedAt,
    };
  }

  async getKycDocuments(userId: string): Promise<KycDocumentResponseDto[]> {
    const documents = await this.prisma.kycDocument.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return documents.map((doc) => ({
      id: doc.id,
      userId: doc.userId,
      type: doc.type as KycDocumentType,
      documentUrl: doc.documentUrl,
      status: doc.status,
      reviewedBy: doc.reviewedBy ?? undefined,
      reviewedAt: doc.reviewedAt ?? undefined,
      rejectionReason: doc.rejectionReason ?? undefined,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));
  }

  async getKycDocument(userId: string, kycId: string): Promise<KycDocumentResponseDto> {
    const doc = await this.prisma.kycDocument.findFirst({
      where: { id: kycId, userId },
    });

    if (!doc) {
      throw new NotFoundException('KYC document not found');
    }

    return {
      id: doc.id,
      userId: doc.userId,
      type: doc.type as KycDocumentType,
      documentUrl: doc.documentUrl,
      status: doc.status,
      reviewedBy: doc.reviewedBy ?? undefined,
      reviewedAt: doc.reviewedAt ?? undefined,
      rejectionReason: doc.rejectionReason ?? undefined,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  async reviewKycDocument(
    adminId: string,
    kycId: string,
    dto: KycReviewDto,
    ipAddress: string,
  ): Promise<KycDocumentResponseDto> {
    const doc = await this.prisma.kycDocument.findUnique({
      where: { id: kycId },
    });

    if (!doc) {
      throw new NotFoundException('KYC document not found');
    }

    if (doc.status !== 'PENDING') {
      throw new BadRequestException('This document has already been reviewed');
    }

    if (dto.status === 'REJECTED' && !dto.rejectionReason) {
      throw new BadRequestException('Rejection reason is required when rejecting');
    }

    const updated = await this.prisma.kycDocument.update({
      where: { id: kycId },
      data: {
        status: dto.status,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        rejectionReason: dto.rejectionReason,
      },
    });

    await this.notificationService.create({
      userId: doc.userId,
      type: 'KYC_STATUS',
      title: `KYC Document ${dto.status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
      message: dto.status === 'APPROVED'
        ? `Your ${doc.type} document has been approved`
        : `Your ${doc.type} document was rejected: ${dto.rejectionReason}`,
      data: { kycId, status: dto.status },
    });

    await this.auditService.log({
      userId: adminId,
      action: `KYC_DOCUMENT_${dto.status}`,
      entity: 'KycDocument',
      entityId: kycId,
      changes: { ...dto } as Record<string, unknown>,
      ipAddress,
    });

    this.logger.log(`KYC document ${kycId} ${dto.status.toLowerCase()} by admin: ${adminId}`);

    return {
      id: updated.id,
      userId: updated.userId,
      type: updated.type as KycDocumentType,
      documentUrl: updated.documentUrl,
      status: updated.status,
      reviewedBy: updated.reviewedBy ?? undefined,
      reviewedAt: updated.reviewedAt ?? undefined,
      rejectionReason: updated.rejectionReason ?? undefined,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async getPendingKycDocuments(): Promise<KycDocumentResponseDto[]> {
    const documents = await this.prisma.kycDocument.findMany({
      where: { status: 'PENDING' },
      include: { user: { include: { profile: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return documents.map((doc) => ({
      id: doc.id,
      userId: doc.userId,
      type: doc.type as KycDocumentType,
      documentUrl: doc.documentUrl,
      status: doc.status,
      reviewedBy: doc.reviewedBy ?? undefined,
      reviewedAt: doc.reviewedAt ?? undefined,
      rejectionReason: doc.rejectionReason ?? undefined,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));
  }
}
