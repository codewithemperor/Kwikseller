import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { DashboardService } from './dashboard.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/dto/auth.dto';

class DashboardQueryDto {
  @ApiPropertyOptional({ description: 'Number of days for revenue chart', default: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number = 30;
}

class LimitQueryDto {
  @ApiPropertyOptional({ description: 'Number of items to return', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get overview stats (admin only)' })
  async getStats() {
    return this.dashboardService.getStats();
  }

  @Get('recent-orders')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get recent orders (admin only)' })
  async getRecentOrders(@Query() query: LimitQueryDto) {
    return this.dashboardService.getRecentOrders(query.limit);
  }

  @Get('top-products')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get top selling products (admin only)' })
  async getTopProducts(@Query() query: LimitQueryDto) {
    return this.dashboardService.getTopProducts(query.limit);
  }

  @Get('revenue-chart')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get revenue chart data (admin only)' })
  async getRevenueChart(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getRevenueChart(query.days);
  }
}
