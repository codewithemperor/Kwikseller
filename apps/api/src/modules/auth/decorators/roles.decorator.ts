import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../dto/auth.dto';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify required roles for an endpoint
 * @example @Roles(UserRole.ADMIN, UserRole.VENDOR)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
