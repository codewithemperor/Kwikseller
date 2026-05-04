import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DashboardService } from '../dashboard/dashboard.service';
import { CategoriesService } from '../categories/categories.service';
import { BrandsService } from '../brands/brands.service';
import { BannersService } from '../banners/banners.service';
import { DealsService } from '../deals/deals.service';
import { CouponsService } from '../coupons/coupons.service';
import { ProductsService } from '../products/products.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '../auth/dto/auth.dto';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../categories/dto';
import {
  CreateBrandDto,
  UpdateBrandDto,
  QueryBrandDto,
} from '../brands/dto';
import {
  CreateBannerDto,
  UpdateBannerDto,
  QueryBannerDto,
} from '../banners/dto';
import {
  CreateDealDto,
  UpdateDealDto,
  QueryDealDto,
} from '../deals/dto';
import {
  CreateCouponDto,
  UpdateCouponDto,
  QueryCouponDto,
} from '../coupons/dto';
import {
  CreateProductDto,
  UpdateProductDto,
  QueryProductAdminDto,
} from '../products/dto/product-admin.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
export class AdminController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly categoriesService: CategoriesService,
    private readonly brandsService: BrandsService,
    private readonly bannersService: BannersService,
    private readonly dealsService: DealsService,
    private readonly couponsService: CouponsService,
    private readonly productsService: ProductsService,
  ) {}

  // ==================== DASHBOARD ====================

  @Public()
  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get dashboard overview stats' })
  async getStats() {
    return this.dashboardService.getStats();
  }

  @Public()
  @Get('dashboard/recent-orders')
  @ApiOperation({ summary: 'Get recent orders' })
  async getRecentOrders(@Query('limit') limit?: number) {
    return this.dashboardService.getRecentOrders(limit ? Number(limit) : 10);
  }

  @Public()
  @Get('dashboard/top-products')
  @ApiOperation({ summary: 'Get top selling products' })
  async getTopProducts(@Query('limit') limit?: number) {
    return this.dashboardService.getTopProducts(limit ? Number(limit) : 5);
  }

  // ==================== CATEGORIES ====================

  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'List all categories' })
  async listCategories() {
    return this.categoriesService.findAll();
  }

  @Public()
  @Get('categories/tree')
  @ApiOperation({ summary: 'Get category tree' })
  async getCategoryTree() {
    return this.categoriesService.findAll();
  }

  @Public()
  @Get('categories/:id')
  @ApiOperation({ summary: 'Get category by ID' })
  async getCategory(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Post('categories')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a category (admin only)' })
  async createCategory(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch('categories/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a category (admin only)' })
  async updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete('categories/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a category (admin only)' })
  async deleteCategory(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }

  // ==================== BRANDS ====================

  @Public()
  @Get('brands')
  @ApiOperation({ summary: 'List all brands' })
  async listBrands(@Query() query: QueryBrandDto) {
    return this.brandsService.findAll(query);
  }

  @Public()
  @Get('brands/:id')
  @ApiOperation({ summary: 'Get brand by ID' })
  async getBrand(@Param('id') id: string) {
    return this.brandsService.findOne(id);
  }

  @Post('brands')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a brand (admin only)' })
  async createBrand(@Body() dto: CreateBrandDto) {
    return this.brandsService.create(dto);
  }

  @Patch('brands/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a brand (admin only)' })
  async updateBrand(@Param('id') id: string, @Body() dto: UpdateBrandDto) {
    return this.brandsService.update(id, dto);
  }

  @Delete('brands/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a brand (admin only)' })
  async deleteBrand(@Param('id') id: string) {
    return this.brandsService.remove(id);
  }

  // ==================== BANNERS ====================

  @Public()
  @Get('banners')
  @ApiOperation({ summary: 'List all banners' })
  async listBanners(@Query() query: QueryBannerDto) {
    return this.bannersService.findAll(query);
  }

  @Public()
  @Get('banners/:id')
  @ApiOperation({ summary: 'Get banner by ID' })
  async getBanner(@Param('id') id: string) {
    return this.bannersService.findOne(id);
  }

  @Post('banners')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a banner (admin only)' })
  async createBanner(@Body() dto: CreateBannerDto) {
    return this.bannersService.create(dto);
  }

  @Patch('banners/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a banner (admin only)' })
  async updateBanner(@Param('id') id: string, @Body() dto: UpdateBannerDto) {
    return this.bannersService.update(id, dto);
  }

  @Delete('banners/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a banner (admin only)' })
  async deleteBanner(@Param('id') id: string) {
    return this.bannersService.remove(id);
  }

  // ==================== DEALS ====================

  @Public()
  @Get('deals')
  @ApiOperation({ summary: 'List all deals' })
  async listDeals(@Query() query: QueryDealDto) {
    return this.dealsService.findAll(query);
  }

  @Public()
  @Get('deals/:id')
  @ApiOperation({ summary: 'Get deal by ID' })
  async getDeal(@Param('id') id: string) {
    return this.dealsService.findOne(id);
  }

  @Post('deals')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a deal (admin only)' })
  async createDeal(@Body() dto: CreateDealDto) {
    return this.dealsService.create(dto);
  }

  @Patch('deals/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a deal (admin only)' })
  async updateDeal(@Param('id') id: string, @Body() dto: UpdateDealDto) {
    return this.dealsService.update(id, dto);
  }

  @Delete('deals/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a deal (admin only)' })
  async deleteDeal(@Param('id') id: string) {
    return this.dealsService.remove(id);
  }

  // ==================== COUPONS ====================

  @Public()
  @Get('coupons')
  @ApiOperation({ summary: 'List all coupons' })
  async listCoupons(@Query() query: QueryCouponDto) {
    return this.couponsService.findAll(query);
  }

  @Public()
  @Get('coupons/:id')
  @ApiOperation({ summary: 'Get coupon by ID' })
  async getCoupon(@Param('id') id: string) {
    return this.couponsService.findOne(id);
  }

  @Post('coupons')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a coupon (admin only)' })
  async createCoupon(@Body() dto: CreateCouponDto) {
    return this.couponsService.create(dto);
  }

  @Patch('coupons/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a coupon (admin only)' })
  async updateCoupon(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.couponsService.update(id, dto);
  }

  @Delete('coupons/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a coupon (admin only)' })
  async deleteCoupon(@Param('id') id: string) {
    return this.couponsService.remove(id);
  }

  // ==================== PRODUCTS ====================

  @Public()
  @Get('products')
  @ApiOperation({ summary: 'List all products' })
  async listProducts(@Query() query: QueryProductAdminDto) {
    return this.productsService.findAllAdmin(query);
  }

  @Public()
  @Get('products/:id')
  @ApiOperation({ summary: 'Get product by ID' })
  async getProduct(@Param('id') id: string) {
    return this.productsService.findOneAdmin(id);
  }

  @Post('products')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a product (admin only)' })
  async createProduct(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch('products/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a product (admin only)' })
  async updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete('products/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a product (admin only)' })
  async deleteProduct(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
