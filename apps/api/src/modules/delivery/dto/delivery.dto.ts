import { IsString, IsOptional, IsInt, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeliveryStatus } from '@prisma/client';

// ─── Vendor DTOs ──────────────────────────────────────────────────────────────

export class DeliveryFilterDto {
  @ApiPropertyOptional({ enum: DeliveryStatus, description: 'Filter by delivery status' })
  @IsOptional()
  @IsEnum(DeliveryStatus)
  status?: DeliveryStatus;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

// ─── Admin DTOs ───────────────────────────────────────────────────────────────

export class AssignRiderDto {
  @ApiProperty({ description: 'Rider user ID' })
  @IsString()
  riderId: string;

  @ApiPropertyOptional({ description: 'Estimated delivery time in minutes', default: 60 })
  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedMinutes?: number;
}

export class ReassignRiderDto {
  @ApiProperty({ description: 'New rider user ID' })
  @IsString()
  riderId: string;
}
