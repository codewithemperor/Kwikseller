import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { ProductsService } from './products.service';
import { SearchProductsDto, LimitQueryDto } from './dto';
import {
  CreateProductDto,
  UpdateProductDto,
  UpdateProductStatusDto,
  CreateProductVariantDto,
  UpdateProductVariantDto,
  AddProductImageDto,
  QueryProductAdminDto,
} from './dto/product-admin.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/dto/auth.dto';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ==================== PUBLIC ENDPOINTS ====================

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Search products by query and/or category' })
  @ApiResponse({ status: 200, description: 'Search results returned' })
  async search(@Query() dto: SearchProductsDto) {
    return this.productsService.search(dto);
  }

  @Public()
  @Get('trending')
  @ApiOperation({ summary: 'Get trending products (featured + high rated)' })
  @ApiResponse({ status: 200, description: 'Trending products returned' })
  async getTrending(@Query() dto: LimitQueryDto) {
    return this.productsService.getTrending(dto.limit);
  }

  @Public()
  @Get('top')
  @ApiOperation({ summary: 'Get top products sorted by rating' })
  @ApiResponse({ status: 200, description: 'Top products returned' })
  async getTop(@Query() dto: LimitQueryDto) {
    return this.productsService.getTop(dto.limit);
  }

  @Public()
  @Get('deals')
  @ApiOperation({ summary: 'Get deal of the day products with highest discount' })
  @ApiResponse({ status: 200, description: 'Deal products returned' })
  async getDeals(@Query() dto: LimitQueryDto) {
    return this.productsService.getDeals(dto.limit);
  }

  @Public()
  @Get('categories/list')
  @ApiOperation({ summary: 'Get all product categories' })
  @ApiResponse({ status: 200, description: 'Categories returned' })
  async getCategories() {
    return this.productsService.search(new SearchProductsDto());
  }

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
      return await this.productsService.getCategoryDetail(slug, dto.limit);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Category "${slug}" not found`);
    }
  }

  @Public()
  @Get('category/:slug')
  @ApiOperation({ summary: 'Get products by category slug' })
  @ApiResponse({ status: 200, description: 'Category products returned' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getProductsByCategory(
    @Param('slug') slug: string,
    @Query() dto: LimitQueryDto,
  ) {
    try {
      return await this.productsService.getCategoryDetail(slug, dto.limit);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Category "${slug}" not found`);
    }
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List products with optional filters' })
  @ApiResponse({ status: 200, description: 'Products list returned' })
  async list(@Query() dto: SearchProductsDto) {
    return this.productsService.search(dto);
  }

  @Public()
  @Get('home-feed')
  @ApiOperation({ summary: 'Get marketplace homepage feed in a single API call' })
  @ApiResponse({ status: 200, description: 'Homepage feed returned' })
  async getHomeFeed() {
    return this.productsService.getHomeFeed();
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get a product by slug' })
  @ApiResponse({ status: 200, description: 'Product found' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getBySlug(@Param('slug') slug: string) {
    const product = await this.productsService.getBySlug(slug);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiResponse({ status: 200, description: 'Product found' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getById(@Param('id') id: string) {
    const product = await this.productsService.getById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  // ==================== ADMIN ENDPOINTS ====================

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new product (admin only)' })
  async create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a product (admin only)' })
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Change product status (admin only)' })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateProductStatusDto) {
    return this.productsService.updateStatus(id, dto);
  }

  @Patch(':id/featured')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Toggle product featured status (admin only)' })
  async toggleFeatured(@Param('id') id: string) {
    return this.productsService.toggleFeatured(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a product (admin only)' })
  async remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Post(':id/images')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Add an image to a product (admin only)' })
  async addImage(@Param('id') id: string, @Body() dto: AddProductImageDto) {
    return this.productsService.addImage(id, dto);
  }

  @Delete(':id/images/:imageId')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Remove an image from a product (admin only)' })
  async removeImage(@Param('id') id: string, @Param('imageId') imageId: string) {
    return this.productsService.removeImage(id, imageId);
  }

  @Post(':id/variants')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Add a variant to a product (admin only)' })
  async addVariant(@Param('id') id: string, @Body() dto: CreateProductVariantDto) {
    return this.productsService.addVariant(id, dto);
  }

  @Patch(':id/variants/:variantId')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a product variant (admin only)' })
  async updateVariant(
    @Param('id') id: string,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateProductVariantDto,
  ) {
    return this.productsService.updateVariant(id, variantId, dto);
  }

  @Delete(':id/variants/:variantId')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Remove a product variant (admin only)' })
  async removeVariant(@Param('id') id: string, @Param('variantId') variantId: string) {
    return this.productsService.removeVariant(id, variantId);
  }
}
