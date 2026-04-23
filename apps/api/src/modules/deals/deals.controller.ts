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

import { DealsService } from './deals.service';
import { CreateDealDto, UpdateDealDto, AddDealProductDto, QueryDealDto } from './dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/dto/auth.dto';

@ApiTags('Deals')
@ApiBearerAuth()
@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all active deals' })
  async list(@Query() query: QueryDealDto) {
    return this.dealsService.findAll(query);
  }

  @Public()
  @Get('flash')
  @ApiOperation({ summary: 'Get flash deals' })
  async getFlashDeals() {
    return this.dealsService.getFlashDeals();
  }

  @Public()
  @Get('featured')
  @ApiOperation({ summary: 'Get featured deals' })
  async getFeaturedDeals() {
    return this.dealsService.getFeaturedDeals();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get deal by ID with products' })
  async getById(@Param('id') id: string) {
    return this.dealsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new deal (admin only)' })
  async create(@Body() dto: CreateDealDto) {
    return this.dealsService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a deal (admin only)' })
  async update(@Param('id') id: string, @Body() dto: UpdateDealDto) {
    return this.dealsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a deal (admin only)' })
  async remove(@Param('id') id: string) {
    return this.dealsService.remove(id);
  }

  @Post(':id/products')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Add a product to a deal (admin only)' })
  async addProduct(@Param('id') id: string, @Body() dto: AddDealProductDto) {
    return this.dealsService.addProduct(id, dto);
  }
}
