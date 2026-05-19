import { AdminRole } from '@prisma/client';

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  FINANCE: 'Finance',
  VENDOR_SUPPORT: 'Vendor Support',
  OPERATIONS: 'Operations',
  MARKETING: 'Marketing',
  CONTENT: 'Content',
  CUSTOMER_SUPPORT: 'Customer Support',
  LOGISTICS: 'Logistics',
  CATALOG_MANAGER: 'Catalog Manager',
  AUDITOR: 'Auditor',
};

export const ADMIN_ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  SUPER_ADMIN: ['*'],
  FINANCE: ['dashboard:read', 'payments:*', 'refunds:*', 'revenue:read'],
  VENDOR_SUPPORT: ['dashboard:read', 'vendors:*', 'vendors:kyc:review', 'users:read'],
  OPERATIONS: ['dashboard:read', 'orders:*', 'delivery-rates:*', 'logistics:read'],
  MARKETING: ['dashboard:read', 'banners:*', 'deals:*', 'coupons:*'],
  CONTENT: ['dashboard:read', 'categories:*', 'brands:*', 'content:*'],
  CUSTOMER_SUPPORT: ['dashboard:read', 'orders:read', 'users:read', 'support:*'],
  LOGISTICS: ['dashboard:read', 'orders:read', 'delivery-rates:*', 'logistics:*'],
  CATALOG_MANAGER: ['dashboard:read', 'products:*', 'categories:*', 'brands:*'],
  AUDITOR: ['dashboard:read', 'products:read', 'categories:read', 'brands:read', 'banners:read', 'deals:read', 'coupons:read', 'orders:read', 'payments:read', 'users:read'],
};

export function getPermissionsForAdminRole(role: AdminRole): string[] {
  return ADMIN_ROLE_PERMISSIONS[role] ?? ADMIN_ROLE_PERMISSIONS.CONTENT;
}
