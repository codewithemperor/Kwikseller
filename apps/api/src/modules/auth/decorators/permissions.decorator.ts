import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to specify required permissions for an admin endpoint
 * @example @Permissions('users:read', 'users:write')
 */
export const Permissions = (...permissions: string[]) => 
  SetMetadata(PERMISSIONS_KEY, permissions);
