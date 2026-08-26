import { IsOptional, IsString, IsInt, IsNumber, Min, Max, IsArray } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

function toStringArray(value: unknown): string[] | undefined {
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
  const cleaned = raw
    .map((item) => String(item).trim())
    .filter(Boolean);
  return cleaned.length > 0 ? cleaned : undefined;
}

/**
 * SearchProductsDto
 *
 * Production-grade e-commerce search DTO. Supports:
 *  - Free-text query (`q` / legacy `search` alias)
 *  - Server-side filters: category, brand, store, price range, minimum rating, state
 *  - Sort presets: relevance | price-low | price-high | rating | newest | popular
 *    (legacy `sortBy` / `sortOrder` retained for backwards compatibility)
 *  - Offset pagination (`page` + `limit`) OR cursor pagination (`cursor`)
 *
 * The corresponding `ProductsService.search()` ranks results by a weighted
 * relevance score when `sort=relevance` and a `q` is present, and returns
 * server-computed facets in `meta` (categories, brands, stores, states,
 * priceRange) so the UI can render filter sidebars without extra round-trips.
 */
export class SearchProductsDto {
  @ApiPropertyOptional({ description: 'Search query (free text)' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Search query alias used by product list clients' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by category slug or id' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Filter by explicit category id' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by multiple category ids/slugs', type: [String] })
  @IsOptional()
  @Transform(({ value }) => toStringArray(value))
  @IsArray()
  categoryIds?: string[];

  @ApiPropertyOptional({ description: 'Filter by brand id' })
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiPropertyOptional({ description: 'Filter by multiple brand ids/slugs', type: [String] })
  @IsOptional()
  @Transform(({ value }) => toStringArray(value))
  @IsArray()
  brandIds?: string[];

  @ApiPropertyOptional({ description: 'Filter by store id' })
  @IsOptional()
  @IsString()
  storeId?: string;

  @ApiPropertyOptional({ description: 'Filter by multiple store ids/slugs', type: [String] })
  @IsOptional()
  @Transform(({ value }) => toStringArray(value))
  @IsArray()
  storeIds?: string[];

  @ApiPropertyOptional({ description: 'Minimum price (inclusive)', minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum price (inclusive)', minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Minimum product rating (0-5, inclusive). e.g. 4 = "4 stars & above"',
    minimum: 0,
    maximum: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({
    description: 'Filter by state name, code, or id (matches StoreDeliveryZone.stateId)',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    description: 'Filter by multiple state names, codes, or ids',
    type: [String],
  })
  @IsOptional()
  @Transform(({ value }) => toStringArray(value))
  @IsArray()
  states?: string[];

  @ApiPropertyOptional({
    description: 'Sort preset',
    default: 'relevance',
    enum: ['relevance', 'price-low', 'price-high', 'rating', 'newest', 'popular'],
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ description: 'Page number (1-based). Ignored when `cursor` is provided.', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Cursor id for cursor-based pagination. If provided, `page` and `sort` are ignored and results are returned in stable createdAt-asc order.',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  // ---- Backwards-compatibility (legacy clients) ----
  @ApiPropertyOptional({ description: 'Legacy sort field (use `sort` instead)', default: 'relevance' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Legacy sort order', default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

export class LimitQueryDto {
  @ApiPropertyOptional({ description: 'Maximum number of results', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}

export class HomeFeedMoreDto {
  @ApiPropertyOptional({ description: 'Page number (1-based)', default: 1 })
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
  @Max(50)
  limit?: number = 20;
}
