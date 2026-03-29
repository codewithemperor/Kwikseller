import { IsEnum, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum KycDocumentType {
  NIN = 'NIN',
  CAC = 'CAC',
  BVN = 'BVN',
  PASSPORT = 'PASSPORT',
  DRIVERS_LICENSE = 'DRIVERS_LICENSE',
  VOTERS_CARD = 'VOTERS_CARD',
}

export class UploadKycDto {
  @ApiProperty({ enum: KycDocumentType, example: KycDocumentType.NIN })
  @IsEnum(KycDocumentType)
  documentType: KycDocumentType;

  @ApiPropertyOptional({ description: 'Document number (optional)' })
  @IsOptional()
  @IsString()
  documentNumber?: string;
}

export class KycDocumentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ enum: KycDocumentType })
  type: KycDocumentType;

  @ApiProperty()
  documentUrl: string;

  @ApiProperty({ enum: ['PENDING', 'APPROVED', 'REJECTED'] })
  status: string;

  @ApiPropertyOptional()
  reviewedBy?: string;

  @ApiPropertyOptional()
  reviewedAt?: Date;

  @ApiPropertyOptional()
  rejectionReason?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class KycReviewDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED'] })
  @IsString()
  @IsNotEmpty()
  status: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional({ description: 'Required if rejected' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
