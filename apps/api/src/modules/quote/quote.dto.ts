import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Vendor submits the initial delivery-fee quote for an order.
 */
export class SubmitQuoteDto {
  @ApiProperty({
    description: 'Delivery fee the vendor is quoting (in NGN).',
    example: 2500,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({
    description: 'Optional note explaining the quote (e.g. distance, weight).',
    example: 'Standard delivery to Lekki',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

/**
 * Vendor revises the quote after a customer requested a reduction.
 */
export class ReviseQuoteDto {
  @ApiProperty({
    description: 'Revised delivery fee the vendor is offering (in NGN).',
    example: 2200,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({
    description: 'Optional note explaining the revision.',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

/**
 * Customer requests a lower delivery fee than the vendor's current quote.
 */
export class RequestReductionDto {
  @ApiProperty({
    description: 'Reduced delivery fee the customer is requesting (in NGN).',
    example: 1800,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @Max(10_000_000)
  amount: number;

  @ApiPropertyOptional({
    description: 'Optional note explaining the reduction request.',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

/**
 * Optional note payload shared by accept/reject actions (vendor + customer).
 */
export class QuoteNoteDto {
  @ApiPropertyOptional({
    description: 'Optional note attached to the action.',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
