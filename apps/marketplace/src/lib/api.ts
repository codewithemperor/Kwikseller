import axios from 'axios';

const normalizeApiBaseUrl = (value?: string) => {
  if (!value) return '/api/v1';

  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  const withoutTrailingSlash = withProtocol.replace(/\/+$/, '');

  return withoutTrailingSlash.endsWith('/api/v1')
    ? withoutTrailingSlash
    : `${withoutTrailingSlash}/api/v1`;
};

export const api = axios.create({
  baseURL: normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL),
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Auth token interceptor
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

// ==================== Products ====================

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  comparePrice?: number;
  sku?: string;
  stock: number;
  status: string;
  isFeatured: boolean;
  rating: number;
  reviewCount: number;
  totalSales: number;
  categoryId?: string;
  brandId?: string;
  storeId: string;
  store?: { id: string; name: string; slug: string; logoUrl?: string };
  category?: { id: string; name: string; slug: string };
  brand?: { id: string; name: string; slug: string; image?: string };
  images: { id: string; url: string; alt?: string; isMain: boolean; position: number }[];
  variants: { id: string; name: string; options: string; price: number; stock: number }[];
  tags: { productId: string; tagId: string; tag?: { id: string; name: string } }[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  imageUrl?: string;
  icon?: string;
  isActive: boolean;
  position: number;
  children?: Category[];
  _count?: { products: number };
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  image?: string;
  status: boolean;
  _count?: { products: number };
}

export interface Banner {
  id: string;
  title?: string;
  subTitle?: string;
  image: string;
  url?: string;
  bannerType: string;
  resourceType?: string;
  resourceId?: string;
  backgroundColor?: string;
  buttonText?: string;
  position: number;
  isActive: boolean;
}

export interface Deal {
  id: string;
  title: string;
  description?: string;
  dealType: string;
  discountType: string;
  discountValue: number;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  products?: { id: string; dealPrice: number; product: Product }[];
}

// API Functions
export const fetchProducts = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  brandId?: string;
  status?: string;
  isFeatured?: boolean;
}): Promise<PaginatedResponse<Product>> => {
  const { data } = await api.get('/products', { params });
  return data;
};

export const fetchProduct = async (id: string): Promise<{ success: boolean; data: Product }> => {
  const { data } = await api.get(`/products/${id}`);
  return data;
};

export const searchProducts = async (query: string, limit = 20): Promise<PaginatedResponse<Product>> => {
  const { data } = await api.get('/products/search', { params: { q: query, limit } });
  return data;
};

export const fetchTrendingProducts = async (limit = 10): Promise<PaginatedResponse<Product>> => {
  const { data } = await api.get('/products/trending', { params: { limit } });
  return data;
};

export const fetchTopProducts = async (limit = 10): Promise<PaginatedResponse<Product>> => {
  const { data } = await api.get('/products/top', { params: { limit } });
  return data;
};

export const fetchDealProducts = async (limit = 10): Promise<PaginatedResponse<Product>> => {
  const { data } = await api.get('/products/deals', { params: { limit } });
  return data;
};

export const fetchCategories = async (): Promise<{ success: boolean; data: Category[] }> => {
  const { data } = await api.get('/categories');
  return data;
};

export const fetchCategoryBySlug = async (slug: string): Promise<{ success: boolean; data: Category & { products?: Product[] } }> => {
  const { data } = await api.get(`/categories/slug/${slug}`);
  return data;
};

export const fetchBrands = async (): Promise<{ success: boolean; data: Brand[] }> => {
  const { data } = await api.get('/brands');
  return data;
};

export const fetchBanners = async (type?: string): Promise<{ success: boolean; data: Banner[] }> => {
  const { data } = await api.get('/banners', { params: { type } });
  return data;
};

export const fetchDeals = async (dealType?: string): Promise<{ success: boolean; data: Deal[] }> => {
  const { data } = await api.get('/deals', { params: { dealType } });
  return data;
};

export const fetchFlashDeals = async (): Promise<{ success: boolean; data: Deal[] }> => {
  const { data } = await api.get('/deals/flash');
  return data;
};

export const fetchFeaturedDeals = async (): Promise<{ success: boolean; data: Deal[] }> => {
  const { data } = await api.get('/deals/featured');
  return data;
};

export const fetchDashboardStats = async (): Promise<{
  success: boolean;
  data: { totalProducts: number; totalOrders: number; totalUsers: number; totalRevenue: number };
}> => {
  const { data } = await api.get('/dashboard/stats');
  return data;
};
