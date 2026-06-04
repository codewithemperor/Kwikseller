import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AnalyticsService } from './analytics.service';

@ApiTags('Vendor Analytics')
@ApiBearerAuth()
@Controller('vendor/analytics')
@UseGuards(JwtAuthGuard)
export class VendorAnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get key vendor metrics: revenue, orders, avg value, conversion, returning customers, top product' })
  @ApiQuery({ name: 'period', required: false, description: 'Time period: 7d, 30d, 90d, 1y' })
  @ApiQuery({ name: 'startDate', required: false, description: 'ISO start date (overrides period)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'ISO end date' })
  async getOverview(
    @CurrentUser() user: any,
    @Query('period') period?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const store = await this.analyticsService.getVendorStore(user.sub);
    const dateRange = this.analyticsService.parseDateRange(period, startDate, endDate);
    return this.analyticsService.getOverview(store.id, dateRange);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue over time grouped by day, week, or month' })
  @ApiQuery({ name: 'period', required: false, description: 'Time period: 7d, 30d, 90d, 1y' })
  @ApiQuery({ name: 'startDate', required: false, description: 'ISO start date (overrides period)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'ISO end date' })
  @ApiQuery({ name: 'groupBy', required: false, description: 'day | week | month' })
  async getRevenue(
    @CurrentUser() user: any,
    @Query('period') period?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('groupBy') groupBy?: 'day' | 'week' | 'month',
  ) {
    const store = await this.analyticsService.getVendorStore(user.sub);
    const dateRange = this.analyticsService.parseDateRange(period, startDate, endDate);
    return this.analyticsService.getRevenue(store.id, dateRange, groupBy || 'day');
  }

  @Get('products')
  @ApiOperation({ summary: 'Get product performance: sales count, revenue, views, conversion rate' })
  @ApiQuery({ name: 'period', required: false, description: 'Time period: 7d, 30d, 90d, 1y' })
  @ApiQuery({ name: 'startDate', required: false, description: 'ISO start date (overrides period)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'ISO end date' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max products to return', type: Number })
  async getProducts(
    @CurrentUser() user: any,
    @Query('period') period?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    const store = await this.analyticsService.getVendorStore(user.sub);
    const dateRange = this.analyticsService.parseDateRange(period, startDate, endDate);
    return this.analyticsService.getProductPerformance(store.id, dateRange, limit);
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get order analytics: status distribution, order volume over time' })
  @ApiQuery({ name: 'period', required: false, description: 'Time period: 7d, 30d, 90d, 1y' })
  @ApiQuery({ name: 'startDate', required: false, description: 'ISO start date (overrides period)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'ISO end date' })
  async getOrders(
    @CurrentUser() user: any,
    @Query('period') period?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const store = await this.analyticsService.getVendorStore(user.sub);
    const dateRange = this.analyticsService.parseDateRange(period, startDate, endDate);
    return this.analyticsService.getOrderAnalytics(store.id, dateRange);
  }

  @Get('customers')
  @ApiOperation({ summary: 'Get customer analytics: new vs returning, top customers by order count/value' })
  @ApiQuery({ name: 'period', required: false, description: 'Time period: 7d, 30d, 90d, 1y' })
  @ApiQuery({ name: 'startDate', required: false, description: 'ISO start date (overrides period)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'ISO end date' })
  async getCustomers(
    @CurrentUser() user: any,
    @Query('period') period?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const store = await this.analyticsService.getVendorStore(user.sub);
    const dateRange = this.analyticsService.parseDateRange(period, startDate, endDate);
    return this.analyticsService.getCustomerAnalytics(store.id, dateRange);
  }
}
