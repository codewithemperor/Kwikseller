import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermission = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export const SUBSCRIPTION_KEY = 'subscription';
export const RequireSubscription = (minPlan: string) =>
  SetMetadata(SUBSCRIPTION_KEY, minPlan);
