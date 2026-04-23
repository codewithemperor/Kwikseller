import { IsOptional, IsString, IsBoolean, IsInt, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum BannerTypeEnum {
  MAIN_BANNER = 'MAIN_BANNER',
  PROMO_BANNER = 'PROMO_BANNER',
  FOOTER_BANNER = 'FOOTER_BANNER',
  SIDEBAR_BANNER = 'SIDEBAR_BANNER',
}

export class CreateBannerDto {
  @ApiPropertyOptional({ description: 'Banner title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Banner subtitle' })
  @IsOptional()
  @IsString()
  subTitle?: string;

  @ApiProperty({ description: 'Banner image URL' })
  @IsString()
  image: string;

  @ApiPropertyOptional({ description: 'Banner link URL' })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional({ description: 'Banner type', enum: BannerTypeEnum, default: BannerTypeEnum.MAIN_BANNER })
  @IsOptional()
  @IsEnum(BannerTypeEnum)
  bannerType?: BannerTypeEnum;

  @ApiPropertyOptional({ description: 'Resource type (product, category, brand)' })
  @IsOptional()
  @IsString()
  resourceType?: string;

  @ApiPropertyOptional({ description: 'Resource ID' })
  @IsOptional()
  @IsString()
  resourceId?: string;

  @ApiPropertyOptional({ description: 'Background color hex' })
  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @ApiPropertyOptional({ description: 'Button text' })
  @IsOptional()
  @IsString()
  buttonText?: string;

  @ApiPropertyOptional({ description: 'Display position', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  position?: number;
}

export class UpdateBannerDto {
  @ApiPropertyOptional({ description: 'Banner title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Banner subtitle' })
  @IsOptional()
  @IsString()
  subTitle?: string;

  @ApiPropertyOptional({ description: 'Banner image URL' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ description: 'Banner link URL' })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional({ description: 'Banner type', enum: BannerTypeEnum })
  @IsOptional()
  @IsEnum(BannerTypeEnum)
  bannerType?: BannerTypeEnum;

  @ApiPropertyOptional({ description: 'Resource type' })
  @IsOptional()
  @IsString()
  resourceType?: string;

  @ApiPropertyOptional({ description: 'Resource ID' })
  @IsOptional()
  @IsString()
  resourceId?: string;

  @ApiPropertyOptional({ description: 'Background color hex' })
  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @ApiPropertyOptional({ description: 'Button text' })
  @IsOptional()
  @IsString()
  buttonText?: string;

  @ApiPropertyOptional({ description: 'Display position' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  position?: number;

  @ApiPropertyOptional({ description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class QueryBannerDto {
  @ApiPropertyOptional({ description: 'Filter by banner type', enum: BannerTypeEnum })
  @IsOptional()
  @IsEnum(BannerTypeEnum)
  bannerType?: BannerTypeEnum;
}
