import {
  Controller,
  Get,
  Query,
  Param,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

import { ProductsService } from './products.service';
import { SearchProductsDto, LimitQueryDto } from './dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * Search products
   * Public endpoint - no auth required
   */
  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Search products by query and/or category' })
  @ApiResponse({ status: 200, description: 'Search results returned' })
  async search(@Query() dto: SearchProductsDto) {
    return this.productsService.search(dto);
  }

  /**
   * Get trending products (featured + high rated)
   * Public endpoint - no auth required
   */
  @Public()
  @Get('trending')
  @ApiOperation({ summary: 'Get trending products (featured + high rated)' })
  @ApiResponse({ status: 200, description: 'Trending products returned' })
  async getTrending(@Query() dto: LimitQueryDto) {
    return this.productsService.getTrending(dto.limit);
  }

  /**
   * Get top products (by rating)
   * Public endpoint - no auth required
   */
  @Public()
  @Get('top')
  @ApiOperation({ summary: 'Get top products sorted by rating' })
  @ApiResponse({ status: 200, description: 'Top products returned' })
  async getTop(@Query() dto: LimitQueryDto) {
    return this.productsService.getTop(dto.limit);
  }

  /**
   * Get deal of the day products (highest discount percentage)
   * Public endpoint - no auth required
   */
  @Public()
  @Get('deals')
  @ApiOperation({ summary: 'Get deal of the day products with highest discount' })
  @ApiResponse({ status: 200, description: 'Deal products returned' })
  async getDeals(@Query() dto: LimitQueryDto) {
    return this.productsService.getDeals(dto.limit);
  }

  /**
   * Get all product categories
   * Public endpoint - no auth required
   * NOTE: Must be before :id route to avoid route conflicts
   */
  @Public()
  @Get('categories/list')
  @ApiOperation({ summary: 'Get all product categories' })
  @ApiResponse({ status: 200, description: 'Categories returned' })
  async getCategories() {
    return this.productsService.search(new SearchProductsDto());
  }

  /**
   * Get products for a specific category with category details
   * Public endpoint - no auth required
   * NOTE: Must be before :id route to avoid route conflicts
   */
  @Public()
  @Get('categories/:slug')
  @ApiOperation({ summary: 'Get products for a specific category with category details' })
  @ApiResponse({ status: 200, description: 'Category products returned' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getCategoryProducts(
    @Param('slug') slug: string,
    @Query() dto: LimitQueryDto,
  ) {
    try {
      return this.productsService.getCategoryDetail(slug, dto.limit);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Category "${slug}" not found`);
    }
  }

  /**
   * Get all products with optional filters
   * Public endpoint - no auth required
   */
  @Public()
  @Get()
  @ApiOperation({ summary: 'List products with optional filters' })
  @ApiResponse({ status: 200, description: 'Products list returned' })
  async list(@Query() dto: SearchProductsDto) {
    return this.productsService.search(dto);
  }

  /**
   * Get a single product by ID
   * Public endpoint - no auth required
   * NOTE: Must be LAST among GET routes to avoid capturing static routes like 'trending', 'deals', etc.
   */
  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiResponse({ status: 200, description: 'Product found' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getById(@Param('id') id: string) {
    const product = this.productsService.getById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }
}
