import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../../database/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { KycDocumentType, KycStatus, VerificationStatus } from '@prisma/client';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

class SubmitKycDto {
  businessType: 'INDIVIDUAL' | 'SOLE_PROPRIETORSHIP' | 'REGISTERED_BUSINESS';
  fullName: string;
  dateOfBirth: string;
  phone: string;
  idType: 'NIN' | 'PASSPORT' | 'DRIVERS_LICENSE';
  idFrontUrl: string;
  idBackUrl?: string;
  businessRegistrationUrl?: string;
  utilityBillUrl?: string;
  taxId?: string;
  selfieUrl?: string;
}

// ─── Controller ───────────────────────────────────────────────────────────────

@ApiTags('Vendor KYC')
@ApiBearerAuth()
@Controller('vendor/kyc')
@UseGuards(JwtAuthGuard)
export class VendorKycController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get current KYC verification status' })
  async getKycStatus(@CurrentUser() user: any) {
    const documents = await this.prisma.kycDocument.findMany({
      where: { userId: user.sub },
      orderBy: { createdAt: 'desc' },
    });

    const store = await this.prisma.store.findUnique({
      where: { vendorId: user.sub },
      select: {
        verificationStatus: true,
        rejectionReason: true,
      },
    });

    // Compute overall status from documents
    let overallStatus: VerificationStatus = VerificationStatus.NOT_SUBMITTED;

    if (documents.length > 0) {
      const hasPending = documents.some((d) => d.status === KycStatus.PENDING);
      const hasRejected = documents.some((d) => d.status === KycStatus.REJECTED);
      const allApproved = documents.every((d) => d.status === KycStatus.APPROVED);

      if (allApproved) {
        overallStatus = VerificationStatus.APPROVED;
      } else if (hasRejected) {
        overallStatus = VerificationStatus.REJECTED;
      } else if (hasPending) {
        overallStatus = VerificationStatus.PENDING_REVIEW;
      }
    }

    // If store has a status, prefer that (it may be updated independently)
    if (store) {
      overallStatus = store.verificationStatus;
    }

    // Collect rejection reasons from rejected documents
    const rejectionReasons = documents
      .filter((d) => d.status === KycStatus.REJECTED && d.rejectionReason)
      .map((d) => ({
        documentType: d.type,
        reason: d.rejectionReason,
      }));

    return {
      status: overallStatus,
      documents,
      rejectionReasons: rejectionReasons.length > 0 ? rejectionReasons : undefined,
      storeRejectionReason: store?.rejectionReason || undefined,
    };
  }

  @Post('submit')
  @ApiOperation({ summary: 'Submit KYC documents for verification' })
  async submitKyc(@CurrentUser() user: any, @Body() dto: SubmitKycDto) {
    // Validate required fields
    if (!dto.fullName || !dto.dateOfBirth || !dto.phone || !dto.idType || !dto.idFrontUrl) {
      throw new BadRequestException(
        'fullName, dateOfBirth, phone, idType, and idFrontUrl are required.',
      );
    }

    if (!['INDIVIDUAL', 'SOLE_PROPRIETORSHIP', 'REGISTERED_BUSINESS'].includes(dto.businessType)) {
      throw new BadRequestException('Invalid businessType.');
    }

    if (!['NIN', 'PASSPORT', 'DRIVERS_LICENSE'].includes(dto.idType)) {
      throw new BadRequestException('Invalid idType. Must be NIN, PASSPORT, or DRIVERS_LICENSE.');
    }

    // Check if user has a store
    const store = await this.prisma.store.findUnique({
      where: { vendorId: user.sub },
    });

    if (!store) {
      throw new NotFoundException('No store found for this vendor. Please create a store first.');
    }

    // Map idType string to KycDocumentType enum
    const idTypeMap: Record<string, KycDocumentType> = {
      NIN: 'NIN',
      PASSPORT: 'PASSPORT',
      DRIVERS_LICENSE: 'DRIVERS_LICENSE',
    };

    // Build documents to create
    const documentsToCreate: Array<{ userId: string; type: KycDocumentType; documentUrl: string }> = [];

    // ID Front
    documentsToCreate.push({
      userId: user.sub,
      type: idTypeMap[dto.idType],
      documentUrl: dto.idFrontUrl,
    });

    // ID Back (optional)
    if (dto.idBackUrl) {
      documentsToCreate.push({
        userId: user.sub,
        type: idTypeMap[dto.idType],
        documentUrl: dto.idBackUrl,
      });
    }

    // Business Registration (for registered businesses)
    if (dto.businessRegistrationUrl && dto.businessType === 'REGISTERED_BUSINESS') {
      documentsToCreate.push({
        userId: user.sub,
        type: 'CAC',
        documentUrl: dto.businessRegistrationUrl,
      });
    }

    // Utility Bill
    if (dto.utilityBillUrl) {
      documentsToCreate.push({
        userId: user.sub,
        type: 'UTILITY_BILL',
        documentUrl: dto.utilityBillUrl,
      });
    }

    // Selfie
    if (dto.selfieUrl) {
      // Use PASSPORT type for selfie since there's no specific selfie type
      documentsToCreate.push({
        userId: user.sub,
        type: 'PASSPORT',
        documentUrl: dto.selfieUrl,
      });
    }

    // TIN (Tax ID) — create a document record if taxId is provided
    if (dto.taxId) {
      documentsToCreate.push({
        userId: user.sub,
        type: 'TIN',
        documentUrl: dto.taxId,
      });
    }

    // Create all document records in a transaction
    const createdDocuments = await this.prisma.$transaction(
      documentsToCreate.map((doc) =>
        this.prisma.kycDocument.create({ data: doc }),
      ),
    );

    // Update store verification status
    await this.prisma.store.update({
      where: { vendorId: user.sub },
      data: {
        verificationStatus: VerificationStatus.PENDING_REVIEW,
      },
    });

    return {
      success: true,
      message: 'KYC documents submitted successfully. Your documents are now pending review.',
      documentCount: createdDocuments.length,
      documents: createdDocuments,
    };
  }

  @Get('submissions')
  @ApiOperation({ summary: 'Get previous KYC submissions' })
  async getSubmissions(@CurrentUser() user: any) {
    const documents = await this.prisma.kycDocument.findMany({
      where: { userId: user.sub },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        documentUrl: true,
        status: true,
        rejectionReason: true,
        reviewedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      documents,
      total: documents.length,
    };
  }
}
