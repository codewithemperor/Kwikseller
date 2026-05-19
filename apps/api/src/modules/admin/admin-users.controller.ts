import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../auth/dto/auth.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminUsersService } from './admin-users.service';
import { CreateAdminInviteDto, UpdateAdminUserDto } from './dto/admin-users.dto';

@ApiTags('Admin Users')
@ApiBearerAuth()
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: 'List admin users and role permissions' })
  listAdminUsers() {
    return this.adminUsersService.listAdminUsers();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an admin role, permissions, or active status' })
  updateAdminUser(
    @Param('id') id: string,
    @Body() dto: UpdateAdminUserDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.adminUsersService.updateAdminUser(id, dto, actorId);
  }

  @Post('invites')
  @ApiOperation({ summary: 'Create an admin invite token' })
  createInvite(
    @Body() dto: CreateAdminInviteDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.adminUsersService.createInvite(dto, actorId);
  }
}
