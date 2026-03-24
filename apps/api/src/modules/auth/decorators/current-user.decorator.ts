import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extract user information from the request
 * 
 * @example
 * // Get full user object
 * @CurrentUser() user: AuthUser
 * 
 * // Get specific property
 * @CurrentUser('id') userId: string
 * 
 * // Get multiple properties
 * @CurrentUser('role') role: UserRole
 */
export const CurrentUser = createParamDecorator(
  (property: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return null;
    }

    return property ? user[property] : user;
  },
);
