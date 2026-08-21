import type { AdminRole } from "@/lib/types";

export type AdminSection =
  | "dashboard"
  | "products"
  | "categories"
  | "brands"
  | "banners"
  | "deals"
  | "coupons"
  | "orders"
  | "payments"
  | "delivery-rates"
  | "admin-users";

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: "Super Admin",
  FINANCE: "Finance",
  VENDOR_SUPPORT: "Vendor Support",
  OPERATIONS: "Operations",
  MARKETING: "Marketing",
  CONTENT: "Content",
  CUSTOMER_SUPPORT: "Customer Support",
  LOGISTICS: "Logistics",
  CATALOG_MANAGER: "Catalog Manager",
  AUDITOR: "Auditor",
};

export const ADMIN_ROLE_OPTIONS = Object.entries(ADMIN_ROLE_LABELS).map(
  ([id, label]) => ({ id: id as AdminRole, label }),
);

export const ADMIN_ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  SUPER_ADMIN: ["*"],
  FINANCE: ["dashboard:read", "payments:*", "refunds:*", "revenue:read"],
  VENDOR_SUPPORT: ["dashboard:read", "vendors:*", "vendors:kyc:review", "users:read"],
  OPERATIONS: ["dashboard:read", "orders:*", "delivery-rates:*", "logistics:read"],
  MARKETING: ["dashboard:read", "banners:*", "deals:*", "coupons:*"],
  CONTENT: ["dashboard:read", "categories:*", "brands:*", "content:*"],
  CUSTOMER_SUPPORT: ["dashboard:read", "orders:read", "users:read", "support:*"],
  LOGISTICS: ["dashboard:read", "orders:read", "delivery-rates:*", "logistics:*"],
  CATALOG_MANAGER: ["dashboard:read", "products:*", "categories:*", "brands:*"],
  AUDITOR: [
    "dashboard:read",
    "products:read",
    "categories:read",
    "brands:read",
    "banners:read",
    "deals:read",
    "coupons:read",
    "orders:read",
    "payments:read",
    "users:read",
  ],
};

export const SECTION_PERMISSION: Record<AdminSection, string> = {
  dashboard: "dashboard:read",
  products: "products:read",
  categories: "categories:read",
  brands: "brands:read",
  banners: "banners:read",
  deals: "deals:read",
  coupons: "coupons:read",
  orders: "orders:read",
  payments: "payments:read",
  "delivery-rates": "delivery-rates:read",
  "admin-users": "admin-users:*",
};

export function canAccessPermission(permissions: string[] | undefined, permission: string) {
  if (!permissions?.length) return false;
  if (permissions.includes("*") || permissions.includes(permission)) return true;
  const [resource] = permission.split(":");
  return permissions.includes(`${resource}:*`);
}

