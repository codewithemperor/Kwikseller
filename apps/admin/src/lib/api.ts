"use client";

import { api, productsApi, adminApi } from "@kwikseller/api-client";
import type {
  Product,
  Category,
  ApiResponse,
} from "@kwikseller/types";

// ==================== Admin Extended API ====================
// Extends the shared api-client with admin-specific endpoints

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
  isActive: boolean;
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
  }) => api.post<Category>("/admin/categories", data),

  update: (
    id: string,
    data: {
      name?: string;
      description?: string;
      parentId?: string;
      imageUrl?: string;
      isActive?: boolean;
    },
  ) => api.patch<Category>(`/admin/categories/${id}`, data),

  delete: (id: string) => api.delete(`/admin/categories/${id}`),
};

// ==================== Brands API ====================

export const brandsApi = {
  list: (params?: { search?: string; page?: number; limit?: number }) =>
    api.get<Brand[]>("/admin/brands", { params }),

  get: (id: string) => api.get<Brand>(`/admin/brands/${id}`),

  create: (data: {
    name: string;
    description?: string;
    logoUrl?: string;
    isActive?: boolean;
  }) => api.post<Brand>("/admin/brands", data),

  update: (
    id: string,
    data: {
      name?: string;
      description?: string;
      logoUrl?: string;
      isActive?: boolean;
    },
  ) => api.patch<Brand>(`/admin/brands/${id}`, data),

  delete: (id: string) => api.delete(`/admin/brands/${id}`),
};

// ==================== Banners API ====================

export const bannersApi = {
  list: (params?: { page?: number; limit?: number; position?: string }) =>
    api.get<Banner[]>("/admin/banners", { params }),

  get: (id: string) => api.get<Banner>(`/admin/banners/${id}`),

  create: (data: {
    title: string;
    imageUrl: string;
    linkUrl?: string;
    position: string;
    isActive?: boolean;
    startDate?: string;
    endDate?: string;
  }) => api.post<Banner>("/admin/banners", data),

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
  ) => api.patch<Banner>(`/admin/banners/${id}`, data),

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

// ==================== Upload API ====================

export const uploadApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post<{ url: string }>("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  uploadMultiple: (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    return api.post<{ urls: string[] }>("/upload/multiple", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
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
