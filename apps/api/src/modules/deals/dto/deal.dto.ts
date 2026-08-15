import {
  IsOptional,
  IsString,
  IsBoolean,
  IsInt,
  IsEnum,
  IsNumber,
  IsDateString,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DealTypeEnum {
  FLASH_DEAL = 'FLASH_DEAL',
  DEAL_OF_THE_DAY = 'DEAL_OF_THE_DAY',
  FEATURED_DEAL = 'FEATURED_DEAL',
  COUPON = 'COUPON',
}

export enum DiscountTypeEnum {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

export class CreateDealDto {
  @ApiProperty({ description: 'Deal title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Deal description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Deal card image URL (shown on deal cards & detail page)' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Deal type', enum: DealTypeEnum, default: DealTypeEnum.FLASH_DEAL })
  @IsOptional()
  @IsEnum(DealTypeEnum)
  dealType?: DealTypeEnum;

  @ApiPropertyOptional({ description: 'Discount type', enum: DiscountTypeEnum, default: DiscountTypeEnum.PERCENTAGE })
  @IsOptional()
  @IsEnum(DiscountTypeEnum)
  discountType?: DiscountTypeEnum;

  @ApiPropertyOptional({ description: 'Discount value (percentage or fixed amount)', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountValue?: number;

  @ApiProperty({ description: 'Deal start date (ISO string)' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ description: 'Deal end date (ISO string)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Minimum order value', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderValue?: number;

  @ApiPropertyOptional({ description: 'Maximum number of uses' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxUses?: number;
}

export class UpdateDealDto {
  @ApiPropertyOptional({ description: 'Deal title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Deal description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Deal card image URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Deal type', enum: DealTypeEnum })
  @IsOptional()
  @IsEnum(DealTypeEnum)
  dealType?: DealTypeEnum;

  @ApiPropertyOptional({ description: 'Discount type', enum: DiscountTypeEnum })
  @IsOptional()
  @IsEnum(DiscountTypeEnum)
  discountType?: DiscountTypeEnum;

  @ApiPropertyOptional({ description: 'Discount value' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountValue?: number;

  @ApiPropertyOptional({ description: 'Deal start date (ISO string)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Deal end date (ISO string)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Minimum order value' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderValue?: number;

  @ApiPropertyOptional({ description: 'Maximum number of uses' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxUses?: number;

  @ApiPropertyOptional({ description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AddDealProductDto {
  @ApiProperty({ description: 'Product ID' })
  @IsString()
  productId: string;

  @ApiProperty({ description: 'Deal price for this product' })
  @IsNumber()
  @Min(0)
  dealPrice: number;
}

export class QueryDealDto {
  @ApiPropertyOptional({ description: 'Filter by deal type', enum: DealTypeEnum })
  @IsOptional()
  @IsEnum(DealTypeEnum)
  dealType?: DealTypeEnum;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
