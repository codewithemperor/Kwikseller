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

import { BannersService } from './banners.service';
import { CreateBannerDto, UpdateBannerDto, QueryBannerDto } from './dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/dto/auth.dto';

@ApiTags('Banners')
@ApiBearerAuth()
@Controller('banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List active banners, optionally filtered by type' })
  async list(@Query() query: QueryBannerDto) {
    return this.bannersService.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get banner by ID' })
  async getById(@Param('id') id: string) {
    return this.bannersService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new banner (admin only)' })
  async create(@Body() dto: CreateBannerDto) {
    return this.bannersService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a banner (admin only)' })
  async update(@Param('id') id: string, @Body() dto: UpdateBannerDto) {
    return this.bannersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a banner (admin only)' })
  async remove(@Param('id') id: string) {
    return this.bannersService.remove(id);
  }
}
