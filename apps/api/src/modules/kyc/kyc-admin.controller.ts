import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PrismaService } from '../../database/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../auth/dto/auth.dto';
import { KycStatus, VerificationStatus } from '@prisma/client';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

class RejectKycDto {
  reason: string;
}

// ─── Controller ───────────────────────────────────────────────────────────────

@ApiTags('Admin KYC')
@ApiBearerAuth()
@Controller('admin/kyc')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminKycController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('pending')
  @ApiOperation({ summary: 'List all pending KYC submissions (paginated)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', type: Number })
  async getPendingSubmissions(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const skip = (page - 1) * limit;

    const [documents, total] = await Promise.all([
      this.prisma.kycDocument.findMany({
        where: { status: KycStatus.PENDING },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
              store: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.kycDocument.count({
        where: { status: KycStatus.PENDING },
      }),
    ]);

    return {
      success: true,
      data: documents,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a KYC document' })
  async approveDocument(
    @CurrentUser() user: any,
    @Param('id') documentId: string,
  ) {
    const document = await this.prisma.kycDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('KYC document not found.');
    }

    if (document.status === KycStatus.APPROVED) {
      return {
        success: true,
        message: 'Document is already approved.',
        document,
      };
    }

    // Update the document
    const updatedDocument = await this.prisma.kycDocument.update({
      where: { id: documentId },
      data: {
        status: KycStatus.APPROVED,
        reviewedBy: user.sub,
        reviewedAt: new Date(),
        rejectionReason: null,
      },
    });

    // Check if ALL documents for this user are now approved
    const allDocuments = await this.prisma.kycDocument.findMany({
      where: { userId: document.userId },
    });

    const allApproved = allDocuments.every(
      (d) => d.status === KycStatus.APPROVED,
    );

    if (allApproved) {
      // Update store verification status to APPROVED
      await this.prisma.store.update({
        where: { vendorId: document.userId },
        data: {
          verificationStatus: VerificationStatus.APPROVED,
          verificationReviewedAt: new Date(),
          verificationReviewedBy: user.sub,
          rejectionReason: null,
          isVerified: true,
        },
      });
    }

    return {
      success: true,
      message: allApproved
        ? 'Document approved. All documents are now approved — vendor verification is complete.'
        : 'Document approved successfully.',
      document: updatedDocument,
      allDocumentsApproved: allApproved,
    };
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a KYC document' })
  async rejectDocument(
    @CurrentUser() user: any,
    @Param('id') documentId: string,
    @Body() dto: RejectKycDto,
  ) {
    if (!dto.reason || dto.reason.trim().length === 0) {
      throw new BadRequestException('Rejection reason is required.');
    }

    const document = await this.prisma.kycDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('KYC document not found.');
    }

    if (document.status === KycStatus.REJECTED) {
      return {
        success: true,
        message: 'Document is already rejected.',
        document,
      };
    }

    // Update the document
    const updatedDocument = await this.prisma.kycDocument.update({
      where: { id: documentId },
      data: {
        status: KycStatus.REJECTED,
        reviewedBy: user.sub,
        reviewedAt: new Date(),
        rejectionReason: dto.reason.trim(),
      },
    });

    // Update store verification status to REJECTED
    await this.prisma.store.update({
      where: { vendorId: document.userId },
      data: {
        verificationStatus: VerificationStatus.REJECTED,
        verificationReviewedAt: new Date(),
        verificationReviewedBy: user.sub,
        rejectionReason: dto.reason.trim(),
      },
    });

    return {
      success: true,
      message: 'Document rejected. The vendor has been notified.',
      document: updatedDocument,
    };
  }
}
