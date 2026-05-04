import {
  IsOptional,
  IsString,
  IsBoolean,
  IsInt,
  IsNumber,
  IsEnum,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ description: 'Product name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Store ID for this product' })
  @IsString()
  storeId: string;

  @ApiPropertyOptional({ description: 'Product description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Product price' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: 'Compare-at price (for discount display)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  comparePrice?: number;

  @ApiPropertyOptional({ description: 'Product SKU' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ description: 'Stock quantity', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ description: 'Low stock threshold', default: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  lowStock?: number;

  @ApiPropertyOptional({ description: 'Product status', enum: ['ACTIVE', 'DRAFT', 'ARCHIVED', 'PENDING'], default: 'DRAFT' })
  @IsOptional()
  @IsEnum(['ACTIVE', 'DRAFT', 'ARCHIVED', 'PENDING'])
  status?: string;

  @ApiPropertyOptional({ description: 'Category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Brand ID' })
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiPropertyOptional({ description: 'Is featured product' })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Product images' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: 'Product variants' })
  @IsOptional()
  variants?: CreateProductVariantDto[];
}

export class UpdateProductDto {
  @ApiPropertyOptional({ description: 'Product name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Product description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Product price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ description: 'Compare-at price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  comparePrice?: number;

  @ApiPropertyOptional({ description: 'Product SKU' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ description: 'Stock quantity' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ description: 'Low stock threshold' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  lowStock?: number;

  @ApiPropertyOptional({ description: 'Category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Brand ID' })
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiPropertyOptional({ description: 'Product images' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}

export class UpdateProductStatusDto {
  @ApiProperty({ description: 'Product status', enum: ['ACTIVE', 'DRAFT', 'ARCHIVED', 'PENDING'] })
  @IsEnum(['ACTIVE', 'DRAFT', 'ARCHIVED', 'PENDING'])
  status: string;
}

export class CreateProductVariantDto {
  @ApiProperty({ description: 'Variant name (e.g. "Red / Large")' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Variant options as JSON string' })
  @IsOptional()
  @IsString()
  options?: string;

  @ApiProperty({ description: 'Variant price' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: 'Variant stock', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ description: 'Variant SKU' })
  @IsOptional()
  @IsString()
  sku?: string;
}

export class UpdateProductVariantDto {
  @ApiPropertyOptional({ description: 'Variant name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Variant options as JSON string' })
  @IsOptional()
  @IsString()
  options?: string;

  @ApiPropertyOptional({ description: 'Variant price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ description: 'Variant stock' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ description: 'Variant SKU' })
  @IsOptional()
  @IsString()
  sku?: string;
}

export class AddProductImageDto {
  @ApiProperty({ description: 'Image URL' })
  @IsString()
  url: string;

  @ApiPropertyOptional({ description: 'Alt text for the image' })
  @IsOptional()
  @IsString()
  alt?: string;

  @ApiPropertyOptional({ description: 'Image position', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  position?: number;

  @ApiPropertyOptional({ description: 'Set as main image' })
  @IsOptional()
  @IsBoolean()
  isMain?: boolean;
}

export class QueryProductAdminDto {
  @ApiPropertyOptional({ description: 'Search by product name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by store ID' })
  @IsOptional()
  @IsString()
  storeId?: string;

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
