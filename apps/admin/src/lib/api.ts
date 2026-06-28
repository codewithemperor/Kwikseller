"use client";

import { api, productsApi, adminApi } from "@kwikseller/api-client";
import type {
  Product,
  Category,
  ApiResponse,
  DeliveryRate,
  Order as CommerceOrder,
  Payment,
} from "@kwikseller/types";

// ==================== Admin Extended API ====================
// Extends the shared api-client with admin-specific endpoints

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  image?: string;
  description?: string;
  isActive: boolean;
  status?: boolean;
  _count?: {
    products: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  position: "HOME_HERO" | "HOME_SIDEBAR" | "CATEGORY_TOP" | "PRODUCT_PAGE";
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadAsset {
  url: string;
  publicId: string;
  secureUrl: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

export interface Deal {
  id: string;
  title: string;
  description?: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  productIds?: string[];
  categoryIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderAmount?: number;
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  recentOrders?: Order[];
  topProducts?: Product[];
}

export interface AdminUser {
  id: string;
  email: string;
  role: "ADMIN" | "SUPER_ADMIN";
  status: string;
  emailVerified: boolean;
  adminRole?:
    | "SUPER_ADMIN"
    | "FINANCE"
    | "VENDOR_SUPPORT"
    | "OPERATIONS"
    | "MARKETING"
    | "CONTENT"
    | "CUSTOMER_SUPPORT"
    | "LOGISTICS"
    | "CATALOG_MANAGER"
    | "AUDITOR";
  permissions: string[];
  isActive: boolean;
  profile?: { firstName?: string; lastName?: string; avatarUrl?: string };
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderNumber?: string;
  buyerId: string;
  storeId: string;
  status: string;
  subtotal: number;
  totalAmount: number;
  paymentStatus: string;
  createdAt: string;
  buyer?: { firstName?: string; lastName?: string; email?: string };
  store?: { name: string };
}

// Re-export shared APIs
export { api, adminApi, productsApi };
export type { DeliveryRate };

const bannerTypeByPosition: Record<Banner["position"], string> = {
  HOME_HERO: "MAIN_BANNER",
  HOME_SIDEBAR: "SIDEBAR_BANNER",
  CATEGORY_TOP: "PROMO_BANNER",
  PRODUCT_PAGE: "PROMO_BANNER",
};

const positionByBannerType: Record<string, Banner["position"]> = {
  MAIN_BANNER: "HOME_HERO",
  SIDEBAR_BANNER: "HOME_SIDEBAR",
  PROMO_BANNER: "CATEGORY_TOP",
  FOOTER_BANNER: "PRODUCT_PAGE",
};

const normalizeBrand = (brand: Record<string, unknown>): Brand => ({
  id: String(brand.id),
  name: String(brand.name ?? ""),
  slug: String(brand.slug ?? ""),
  logoUrl: (brand.logoUrl as string) ?? (brand.image as string) ?? undefined,
  image: (brand.image as string) ?? (brand.logoUrl as string) ?? undefined,
  description: (brand.description as string) ?? undefined,
  isActive:
    typeof brand.isActive === "boolean"
      ? brand.isActive
      : (brand.status as boolean | undefined) ?? true,
  status:
    typeof brand.status === "boolean"
      ? brand.status
      : (brand.isActive as boolean | undefined) ?? true,
  _count: brand._count as Brand["_count"],
  createdAt: String(brand.createdAt ?? ""),
  updatedAt: String(brand.updatedAt ?? ""),
});

const normalizeBanner = (banner: Record<string, unknown>): Banner => ({
  id: String(banner.id),
  title: String(banner.title ?? ""),
  imageUrl: String(banner.imageUrl ?? banner.image ?? ""),
  linkUrl: (banner.linkUrl as string) ?? (banner.url as string) ?? undefined,
  position:
    positionByBannerType[String(banner.bannerType ?? "")] ??
    ((banner.position as Banner["position"]) || "HOME_HERO"),
  isActive: (banner.isActive as boolean | undefined) ?? true,
  startDate: (banner.startDate as string) ?? undefined,
  endDate: (banner.endDate as string) ?? undefined,
  createdAt: String(banner.createdAt ?? ""),
  updatedAt: String(banner.updatedAt ?? ""),
});

// ==================== Categories API ====================

export const categoriesApi = {
  list: (params?: { search?: string; page?: number; limit?: number }) =>
    api.get<Category[]>("/admin/categories", { params }),

  getTree: () => api.get<Category[]>("/admin/categories/tree"),

  get: (id: string) => api.get<Category>(`/admin/categories/${id}`),

  create: (data: {
    name: string;
    description?: string;
    parentId?: string;
    imageUrl?: string;
    isActive?: boolean;
  }) =>
    api.post<Category>("/admin/categories", {
      ...data,
      parentId: data.parentId?.trim() ? data.parentId : undefined,
    }),

  update: (
    id: string,
    data: {
      name?: string;
      description?: string;
      parentId?: string;
      imageUrl?: string;
      isActive?: boolean;
    },
  ) =>
    api.patch<Category>(`/admin/categories/${id}`, {
      ...data,
      ...(data.parentId !== undefined
        ? { parentId: data.parentId.trim() ? data.parentId : null }
        : {}),
    }),

  delete: (id: string) => api.delete(`/admin/categories/${id}`),
};

// ==================== Brands API ====================

export const brandsApi = {
  list: async (params?: { search?: string; page?: number; limit?: number }) => {
    const response = await api.get<Brand[]>("/admin/brands", { params });
    return {
      ...response,
      data: response.data.map((brand) =>
        normalizeBrand(brand as unknown as Record<string, unknown>),
      ),
    };
  },

  get: async (id: string) => {
    const response = await api.get<Brand>(`/admin/brands/${id}`);
    return {
      ...response,
      data: normalizeBrand(response.data as unknown as Record<string, unknown>),
    };
  },

  create: (data: {
    name: string;
    description?: string;
    logoUrl?: string;
    isActive?: boolean;
  }) =>
    api.post<Brand>("/admin/brands", {
      name: data.name,
      image: data.logoUrl,
    }),

  update: (
    id: string,
    data: {
      name?: string;
      description?: string;
      logoUrl?: string;
      isActive?: boolean;
    },
  ) =>
    api.patch<Brand>(`/admin/brands/${id}`, {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.logoUrl !== undefined ? { image: data.logoUrl } : {}),
      ...(data.isActive !== undefined ? { status: data.isActive } : {}),
    }),

  delete: (id: string) => api.delete(`/admin/brands/${id}`),
};

// ==================== Banners API ====================

export const bannersApi = {
  list: async (params?: { page?: number; limit?: number; position?: string }) => {
    const response = await api.get<Banner[]>("/admin/banners", { params });
    return {
      ...response,
      data: response.data.map((banner) =>
        normalizeBanner(banner as unknown as Record<string, unknown>),
      ),
    };
  },

  get: async (id: string) => {
    const response = await api.get<Banner>(`/admin/banners/${id}`);
    return {
      ...response,
      data: normalizeBanner(response.data as unknown as Record<string, unknown>),
    };
  },

  create: (data: {
    title: string;
    imageUrl: string;
    linkUrl?: string;
    position: string;
    isActive?: boolean;
    startDate?: string;
    endDate?: string;
  }) =>
    api.post<Banner>("/admin/banners", {
      title: data.title,
      image: data.imageUrl,
      url: data.linkUrl,
      bannerType: bannerTypeByPosition[data.position as Banner["position"]] ?? "MAIN_BANNER",
      isActive: data.isActive,
    }),

  update: (
    id: string,
    data: {
      title?: string;
      imageUrl?: string;
      linkUrl?: string;
      position?: string;
      isActive?: boolean;
      startDate?: string;
      endDate?: string;
    },
  ) =>
    api.patch<Banner>(`/admin/banners/${id}`, {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.imageUrl !== undefined ? { image: data.imageUrl } : {}),
      ...(data.linkUrl !== undefined ? { url: data.linkUrl } : {}),
      ...(data.position !== undefined
        ? {
            bannerType:
              bannerTypeByPosition[data.position as Banner["position"]] ??
              "MAIN_BANNER",
          }
        : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    }),

  delete: (id: string) => api.delete(`/admin/banners/${id}`),
};

// ==================== Deals API ====================

export const dealsApi = {
  list: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<Deal[]>("/admin/deals", { params }),

  get: (id: string) => api.get<Deal>(`/admin/deals/${id}`),

  create: (data: {
    title: string;
    description?: string;
    discountType: "PERCENTAGE" | "FIXED";
    discountValue: number;
    startDate: string;
    endDate: string;
    productIds?: string[];
    categoryIds?: string[];
  }) => api.post<Deal>("/admin/deals", data),

  update: (
    id: string,
    data: {
      title?: string;
      description?: string;
      discountType?: "PERCENTAGE" | "FIXED";
      discountValue?: number;
      startDate?: string;
      endDate?: string;
      isActive?: boolean;
      productIds?: string[];
      categoryIds?: string[];
    },
  ) => api.patch<Deal>(`/admin/deals/${id}`, data),

  delete: (id: string) => api.delete(`/admin/deals/${id}`),
};

// ==================== Coupons API ====================

export const couponsApi = {
  list: (params?: { search?: string; page?: number; limit?: number }) =>
    api.get<Coupon[]>("/admin/coupons", { params }),

  get: (id: string) => api.get<Coupon>(`/admin/coupons/${id}`),

  create: (data: {
    code: string;
    description?: string;
    discountType: "PERCENTAGE" | "FIXED";
    discountValue: number;
    minOrderAmount?: number;
    maxUses?: number;
    startDate?: string;
    endDate?: string;
  }) => api.post<Coupon>("/admin/coupons", data),

  update: (
    id: string,
    data: {
      code?: string;
      description?: string;
      discountType?: "PERCENTAGE" | "FIXED";
      discountValue?: number;
      minOrderAmount?: number;
      maxUses?: number;
      isActive?: boolean;
      startDate?: string;
      endDate?: string;
    },
  ) => api.patch<Coupon>(`/admin/coupons/${id}`, data),

  delete: (id: string) => api.delete(`/admin/coupons/${id}`),
};

// ==================== Delivery Rates API ====================

export const deliveryRatesApi = {
  list: (params?: { state?: string; isActive?: boolean }) =>
    adminApi.getDeliveryRates(params),

  create: (data: {
    state: string;
    localGovernment: string;
    fee: number;
    minDeliveryDays: number;
    maxDeliveryDays: number;
    isActive?: boolean;
  }) => adminApi.createDeliveryRate(data),

  update: (
    id: string,
    data: Partial<{
      state: string;
      localGovernment: string;
      fee: number;
      minDeliveryDays: number;
      maxDeliveryDays: number;
      isActive: boolean;
    }>,
  ) => adminApi.updateDeliveryRate(id, data),

  deactivate: (id: string) => adminApi.deactivateDeliveryRate(id),
};

// ==================== Commerce Operations API ====================

export const adminDeliveriesApi = {
  assignRider: (
    orderId: string,
    data: { riderId: string; estimatedMinutes?: number },
  ) => api.post(`/admin/deliveries/${orderId}/assign`, data),
};

export const adminEscrowApi = {
  releaseEscrow: (deliveryId: string) =>
    api.post(`/admin/escrow/${deliveryId}/manual-release`),

  refundEscrow: (deliveryId: string) =>
    api.post(`/admin/escrow/${deliveryId}/refund`),

  resolveDispute: (
    deliveryId: string,
    resolution: string,
    vendorAmount?: number,
  ) =>
    api.post(`/admin/escrow/${deliveryId}/dispute/resolve`, {
      resolution,
      vendorAmount,
    }),
};
export const commerceOpsApi = {
  orders: (params?: { status?: string; page?: number; limit?: number }) =>
    adminApi.getAllOrders(params),

  payments: (params?: { status?: string; gateway?: string; page?: number; limit?: number }) =>
    adminApi.getPayments(params),

  updateManualStatus: (orderId: string, status: string, note?: string, trackingCode?: string) =>
    adminApi.updateOrderManualStatus(orderId, status, note, trackingCode),

  refundPayment: (paymentId: string, reason: string, amount?: number, orderId?: string) =>
    adminApi.refundPayment(paymentId, reason, amount, orderId),
};

export type AdminCommerceOrder = CommerceOrder & {
  disputeStatus?: string;
  disputeReason?: string;
  parentCheckout?: {
    id: string;
    checkoutReference: string;
    payment?: Payment;
  };
};

export type AdminCommercePayment = Payment & {
  order?: CommerceOrder;
  parentCheckout?: {
    id: string;
    checkoutReference: string;
    status: string;
    paymentStatus: string;
    totalAmount: number;
    orders?: CommerceOrder[];
  };
};

// ==================== Upload API ====================

export const uploadApi = {
  upload: (
    file: File,
    kind: "general" | "product" | "banner" = "general",
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    const endpoint =
      kind === "product"
        ? "/upload/product"
        : kind === "banner"
          ? "/upload/banner"
          : "/upload/image";

    return api.post<UploadAsset>(endpoint, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  uploadMultiple: (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    return api.post<UploadAsset[]>("/upload/images", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  delete: (publicId: string) =>
    api.delete<{ publicId: string }>("/upload", {
      data: { publicId },
    }),
};

// ==================== Products API (Admin level) ====================

export const adminProductsApi = {
  list: (params?: {
    search?: string;
    status?: string;
    categoryId?: string;
    brandId?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) => api.get<Product[]>("/admin/products", { params }),

  get: (id: string) => api.get<Product>(`/admin/products/${id}`),

  create: (data: {
    name: string;
    description?: string;
    price: number;
    comparePrice?: number;
    sku?: string;
    stock: number;
    categoryId?: string;
    brandId?: string;
    status?: string;
    isFeatured?: boolean;
    tags?: string[];
    images?: string[];
    variants?: Array<{
      name: string;
      options: Record<string, string>;
      price: number;
      stock: number;
      sku?: string;
    }>;
  }) => api.post<Product>("/admin/products", data),

  update: (id: string, data: Record<string, unknown>) =>
    api.patch<Product>(`/admin/products/${id}`, data),

  delete: (id: string) => api.delete(`/admin/products/${id}`),
};

// ==================== Dashboard API ====================

export const dashboardApi = {
  getStats: () => api.get<DashboardStats>("/admin/dashboard/stats"),

  getRecentOrders: (limit?: number) =>
    api.get<Order[]>("/admin/dashboard/recent-orders", {
      params: { limit: limit ?? 10 },
    }),

  getTopProducts: (limit?: number) =>
    api.get<Product[]>("/admin/dashboard/top-products", {
      params: { limit: limit ?? 5 },
    }),
};

// ==================== Admin Users API ====================

export const adminUsersApi = {
  list: () => api.get<AdminUser[]>("/admin/users"),

  update: (
    id: string,
    data: {
      role: NonNullable<AdminUser["adminRole"]>;
      permissions?: string[];
      isActive?: boolean;
    },
  ) => api.patch(`/admin/users/${id}`, data),
};
