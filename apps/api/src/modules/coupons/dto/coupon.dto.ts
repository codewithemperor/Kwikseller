import {
  IsOptional,
  IsString,
  IsBoolean,
  IsInt,
  IsEnum,
  IsNumber,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DiscountTypeEnum {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

export class CreateCouponDto {
  @ApiProperty({ description: 'Unique coupon code' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Coupon title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Coupon description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Discount type', enum: DiscountTypeEnum, default: DiscountTypeEnum.PERCENTAGE })
  @IsOptional()
  @IsEnum(DiscountTypeEnum)
  discountType?: DiscountTypeEnum;

  @ApiPropertyOptional({ description: 'Discount value', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountValue?: number;

  @ApiPropertyOptional({ description: 'Minimum order value to apply coupon', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderValue?: number;

  @ApiPropertyOptional({ description: 'Maximum discount amount (for percentage coupons)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscount?: number;

  @ApiPropertyOptional({ description: 'Maximum number of times this coupon can be used' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxUses?: number;

  @ApiPropertyOptional({ description: 'Applicable scope (all, specific_categories, specific_products)' })
  @IsOptional()
  @IsString()
  applicableTo?: string;

  @ApiPropertyOptional({ description: 'JSON array of applicable IDs' })
  @IsOptional()
  @IsString()
  applicableIds?: string;

  @ApiProperty({ description: 'Coupon start date (ISO string)' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ description: 'Coupon end date (ISO string)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class UpdateCouponDto {
  @ApiPropertyOptional({ description: 'Unique coupon code' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'Coupon title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Coupon description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Discount type', enum: DiscountTypeEnum })
  @IsOptional()
  @IsEnum(DiscountTypeEnum)
  discountType?: DiscountTypeEnum;

  @ApiPropertyOptional({ description: 'Discount value' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountValue?: number;

  @ApiPropertyOptional({ description: 'Minimum order value' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderValue?: number;

  @ApiPropertyOptional({ description: 'Maximum discount amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscount?: number;

  @ApiPropertyOptional({ description: 'Maximum number of uses' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxUses?: number;

  @ApiPropertyOptional({ description: 'Applicable scope' })
  @IsOptional()
  @IsString()
  applicableTo?: string;

  @ApiPropertyOptional({ description: 'JSON array of applicable IDs' })
  @IsOptional()
  @IsString()
  applicableIds?: string;

  @ApiPropertyOptional({ description: 'Coupon start date (ISO string)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Coupon end date (ISO string)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ValidateCouponDto {
  @ApiProperty({ description: 'Coupon code to validate' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Cart/order total amount' })
  @IsNumber()
  @Min(0)
  orderAmount: number;

  @ApiPropertyOptional({ description: 'Array of product IDs in the cart' })
  @IsOptional()
  @IsString()
  productIds?: string;

  @ApiPropertyOptional({ description: 'Array of category IDs in the cart' })
  @IsOptional()
  @IsString()
  categoryIds?: string;
}

export class QueryCouponDto {
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
