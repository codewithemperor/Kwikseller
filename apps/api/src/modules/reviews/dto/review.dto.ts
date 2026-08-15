import {
  IsString,
  IsInt,
  IsOptional,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ description: 'Product ID being reviewed' })
  @IsString()
  productId: string;

  @ApiProperty({ description: 'Rating from 1 to 5', minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ description: 'Review title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Review comment body' })
  @IsString()
  comment: string;

  @ApiPropertyOptional({
    description: 'Optional image URLs attached to the review',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({
    description: 'Optional order ID the review is tied to (for purchase verification)',
  })
  @IsOptional()
  @IsString()
  orderId?: string;
}
