import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PrismaService } from '../../../database/prisma.service';

/**
 * Admin Permissions Guard
 * 
 * Checks specific permissions for sub-admins.
 * Super Admins bypass all permission checks.
 * 
 * Permission strings format: "resource:action" or "resource:subresource:action"
 * Examples: 
 *   - users:read
 *   - vendors:kyc:review
 *   - finance:manage
 *   - orders:read
 *   - disputes:resolve
 */
@Injectable()
export class AdminPermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Check if user is admin or super_admin
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    // SUPER_ADMIN users bypass all permission checks
    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    // Get admin permission record
    const adminPermission = await this.prisma.adminPermission.findUnique({
      where: { adminUserId: user.id },
    });

    // If no permission record and not SUPER_ADMIN, deny access
    if (!adminPermission) {
      // Check if user has SUPER_ADMIN role by checking if they have any admin permission
      // If they're an ADMIN without a record, they might be a legacy admin
      throw new ForbiddenException('Admin permissions not configured');
    }

    // SUPER_ADMIN bypasses all permission checks
    if (adminPermission.role === 'SUPER_ADMIN') {
      return true;
    }

    // Check if admin is active
    if (!adminPermission.isActive) {
      throw new ForbiddenException('Admin account is deactivated');
    }

    // Parse stored permissions
    const storedPermissions: string[] = JSON.parse(adminPermission.permissions);

    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every((permission) =>
      this.hasPermission(storedPermissions, permission),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        `Missing required permissions: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }

  /**
   * Check if user has a specific permission
   * Supports wildcard matching (e.g., users:* matches users:read, users:write)
   */
  private hasPermission(userPermissions: string[], requiredPermission: string): boolean {
    // Direct match
    if (userPermissions.includes(requiredPermission)) {
      return true;
    }

    // Wildcard match (users:* matches users:read, users:write, etc.)
    const [resource] = requiredPermission.split(':');
    const wildcardPermission = `${resource}:*`;
    if (userPermissions.includes(wildcardPermission)) {
      return true;
    }

    // Super wildcard (* matches everything)
    if (userPermissions.includes('*')) {
      return true;
    }

    return false;
  }
}
