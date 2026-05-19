import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AdminRole, UserRole } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { CacheService } from '../../common/services/cache.service';
import { getPermissionsForAdminRole } from './admin-permissions';
import { CreateAdminInviteDto, UpdateAdminUserDto } from './dto/admin-users.dto';

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly cacheService: CacheService,
  ) {}

  async listAdminUsers() {
    const users = await this.prisma.user.findMany({
      where: { role: { in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] } },
      include: { profile: true, adminPermission: true },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      profile: user.profile
        ? {
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            avatarUrl: user.profile.avatarUrl,
          }
        : undefined,
      adminRole:
        user.role === UserRole.SUPER_ADMIN
          ? AdminRole.SUPER_ADMIN
          : user.adminPermission?.role,
      permissions:
        user.role === UserRole.SUPER_ADMIN
          ? ['*']
          : user.adminPermission
            ? JSON.parse(user.adminPermission.permissions)
            : [],
      isActive:
        user.role === UserRole.SUPER_ADMIN
          ? true
          : (user.adminPermission?.isActive ?? false),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  }

  async updateAdminUser(adminUserId: string, dto: UpdateAdminUserDto, actorId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: adminUserId },
      include: { adminPermission: true },
    });

    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN)) {
      throw new NotFoundException('Admin user not found');
    }

    if (user.role === UserRole.SUPER_ADMIN && dto.role !== AdminRole.SUPER_ADMIN) {
      throw new ForbiddenException('Super Admin role cannot be downgraded here');
    }

    const permissions = dto.permissions ?? getPermissionsForAdminRole(dto.role);

    const adminPermission = await this.prisma.adminPermission.upsert({
      where: { adminUserId },
      update: {
        role: dto.role,
        permissions: JSON.stringify(permissions),
        isActive: dto.isActive ?? true,
        grantedBy: actorId,
      },
      create: {
        adminUserId,
        role: dto.role,
        permissions: JSON.stringify(permissions),
        isActive: dto.isActive ?? true,
        grantedBy: actorId,
      },
    });

    await this.auditService.log({
      userId: actorId,
      action: 'ADMIN_PERMISSION_UPDATED',
      entity: 'AdminPermission',
      entityId: adminPermission.id,
      changes: { adminUserId, role: dto.role, permissions, isActive: adminPermission.isActive },
    });

    return adminPermission;
  }

  async createInvite(dto: CreateAdminInviteDto, actorId: string) {
    const token = randomUUID();
    const permissions = dto.permissions ?? getPermissionsForAdminRole(dto.role);

    await this.cacheService.set(
      `admin-invite:${token}`,
      {
        email: dto.email,
        role: dto.role,
        permissions,
        grantedBy: actorId || dto.grantedBy,
      },
      7 * 24 * 60 * 60,
    );

    await this.auditService.log({
      userId: actorId,
      action: 'ADMIN_INVITE_CREATED',
      entity: 'AdminInvite',
      entityId: token,
      changes: { email: dto.email, role: dto.role, permissions },
    });

    return {
      token,
      email: dto.email,
      role: dto.role,
      permissions,
      expiresIn: 7 * 24 * 60 * 60,
    };
  }
}
