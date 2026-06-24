// KWIKSELLER - Shared API Client
// Centralized Axios client for all frontend apps

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'
import type {
  CheckoutRequest,
  CheckoutResponse,
  CartValidationResponse,
  CouponValidationResponse,
  DigitalAsset,
  DeliveryRate,
  InventoryItem,
  PoolCampaign,
  PoolProduct,
  PoolSelectionRequest,
  Product,
  ProductStatus,
  ProductSource,
  ProductType,
  InventoryPolicy,
  Store,
  StorefrontDesignConfig,
  VendorDashboardMetrics,
  VendorPoolOffer,
} from '@kwikseller/types'

// ==================== Types ====================

export interface ApiResponse<T = unknown> {
  data: T
  success: boolean
  message?: string
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
  }
}

export interface ApiError {
  statusCode: number
  message: string
  error?: string
  details?: Record<string, string[]>
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface RequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean
}

// ==================== Configuration ====================

const getBaseURL = (): string => {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL

  if (!configuredUrl) {
    return typeof window !== 'undefined' ? '/api/v1' : 'http://localhost:4000/api/v1'
  }

  const withProtocol = /^https?:\/\//i.test(configuredUrl)
    ? configuredUrl
    : `https://${configuredUrl}`
  const withoutTrailingSlash = withProtocol.replace(/\/+$/, '')

  return withoutTrailingSlash.endsWith('/api/v1')
    ? withoutTrailingSlash
    : `${withoutTrailingSlash}/api/v1`
}

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'kwikseller_access_token',
  REFRESH_TOKEN: 'kwikseller_refresh_token',
  AUTH_STORE: 'kwikseller_auth',
}

// ==================== Token Refresh Mutex ====================
// Prevents concurrent 401 responses from triggering multiple refresh calls.
// Only one refresh request is in-flight at a time; other requests queue and
// resolve once the refresh completes.

let isRefreshing = false
let refreshQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

function processRefreshQueue(error: unknown, token: string | null = null): void {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else if (token) resolve(token)
  })
  refreshQueue = []
}

// ==================== Token Management ====================

export const tokenManager = {
  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
  },

  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
  },

  setTokens: (accessToken: string, refreshToken?: string): void => {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken)
    if (refreshToken) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
    }
  },

  clearTokens: (): void => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.AUTH_STORE)
  },

  isAuthenticated: (): boolean => {
    return !!tokenManager.getAccessToken()
  },
}

// ==================== Create Axios Instance ====================

const createApiClient = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: getBaseURL(),
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const redirectToLogin = () => {
    if (typeof window === 'undefined') return
    tokenManager.clearTokens()
    const currentPath = window.location.pathname
    const currentHost = window.location.hostname
    const isAdminApp = currentHost.includes('admin') || currentPath.startsWith('/admin')
    const isRiderApp = currentHost.includes('rider') || currentPath.startsWith('/rider')
    const isVendorApp = currentHost.includes('vendor') || currentPath.startsWith('/dashboard')
    let loginPath = '/login'
    if (isAdminApp) loginPath = '/admin/login'
    else if (isRiderApp) loginPath = '/rider/login'
    // Vendor app login is at /login (same as default), but we preserve
    // the dashboard redirect so the user lands back where they were
    window.location.href = `${loginPath}?redirect=${encodeURIComponent(currentPath)}`
  }

  // Request interceptor - Add auth token
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Skip auth if explicitly requested
      if ((config as RequestConfig).skipAuth) {
        return config
      }

      const token = tokenManager.getAccessToken()
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => Promise.reject(error)
  )

  // Response interceptor - Handle errors and token refresh with mutex
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError<ApiError>) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean
      }
      const isAuthEndpoint = originalRequest?.url?.includes('/auth/')

      // Handle 401 Unauthorized - Try to refresh token (with mutex to prevent race conditions)
      if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
        if (isRefreshing) {
          // Another refresh is already in-flight — queue this request
          return new Promise((resolve, reject) => {
            refreshQueue.push({
              resolve: (newToken: string) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${newToken}`
                }
                resolve(instance(originalRequest))
              },
              reject: (err: unknown) => reject(err),
            })
          })
        }

        originalRequest._retry = true
        isRefreshing = true

        try {
          const refreshToken = tokenManager.getRefreshToken()
          if (refreshToken) {
            const response = await axios.post(`${getBaseURL()}/auth/refresh`, {
              refreshToken,
            })

            const { accessToken, refreshToken: newRefreshToken } = response.data.data || response.data
            tokenManager.setTokens(accessToken, newRefreshToken)

            // Notify queued requests
            processRefreshQueue(null, accessToken)

            // Retry original request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`
            }
            return instance(originalRequest)
          }
          // No refresh token available
          processRefreshQueue(new Error('No refresh token available'), null)
          tokenManager.clearTokens()
          redirectToLogin()
        } catch (refreshError) {
          // Refresh failed
          processRefreshQueue(refreshError, null)
          tokenManager.clearTokens()
          redirectToLogin()
        } finally {
          isRefreshing = false
        }
      }

      // Handle other errors
      const apiError: ApiError = {
        statusCode: error.response?.status || 500,
        message: error.response?.data?.message || error.message || 'An error occurred',
        error: error.response?.data?.error,
        details: error.response?.data?.details,
      }

      return Promise.reject(apiError)
    }
  )

  return instance
}

// Create singleton instance
const apiClient = createApiClient()

// ==================== API Methods ====================

export const api = {
  get: <T = unknown>(
    url: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> => apiClient.get(url, config).then((res) => res.data),

  post: <T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> => apiClient.post(url, data, config).then((res) => res.data),

  put: <T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> => apiClient.put(url, data, config).then((res) => res.data),

  patch: <T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> => apiClient.patch(url, data, config).then((res) => res.data),

  delete: <T = unknown>(
    url: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> => apiClient.delete(url, config).then((res) => res.data),
}

// ==================== Auth API ====================

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (data: {
    email: string
    password: string
    role: string
    phone?: string
    firstName?: string
    lastName?: string
    storeName?: string
    storeCategory?: string
    storeSlug?: string
  }) => api.post('/auth/register', data),

  logout: () => {
    tokenManager.clearTokens()
    return api.post('/auth/logout')
  },

  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),

  me: () => api.get('/auth/me'),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (data: { email: string; otp: string; newPassword: string }) =>
    api.post('/auth/reset-password', data),

  verifyEmail: (data: { email: string; otp: string }) =>
    api.post('/auth/verify-email', data),

  resendVerification: (email: string) =>
    api.post('/auth/resend-verification', { email }),

  changeEmail: (data: { newEmail: string; password: string }) =>
    api.post('/auth/change-email', data),
}

// ==================== Users API ====================

export const usersApi = {
  getProfile: () => api.get('/users/me'),

  updateProfile: (data: {
    firstName?: string
    lastName?: string
    phone?: string
    bio?: string
  }) => api.patch('/users/me/profile', data),

  uploadAvatar: (file: File) => {
    const formData = new FormData()
    formData.append('avatar', file)
    return api.post('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  getAddresses: () => api.get('/users/me/addresses'),

  addAddress: (data: {
    line1: string
    line2?: string
    city: string
    state: string
    localGovernment?: string
    stateId?: string
    lgaId?: string
    country: string
    postalCode?: string
    type: 'SHIPPING' | 'BILLING'
    isDefault?: boolean
  }) => api.post('/users/me/addresses', data),

  updateAddress: (id: string, data: Partial<{
    line1: string
    line2: string
    city: string
    state: string
    localGovernment: string
    stateId: string
    lgaId: string
    country: string
    postalCode: string
    isDefault: boolean
  }>) => api.patch(`/users/me/addresses/${id}`, data),

  deleteAddress: (id: string) => api.delete(`/users/me/addresses/${id}`),

  setDefaultAddress: (id: string) => api.patch(`/users/me/addresses/${id}/default`),

  // KYC
  getKycStatus: () => api.get('/users/kyc'),

  submitKyc: (data: {
    type: 'NIN' | 'BVN' | 'PASSPORT' | 'CAC'
    documentUrl: string
  }) => api.post('/users/kyc', data),
}

// ==================== Products API ====================

export const productsApi = {
  list: (params?: {
    category?: string
    status?: string
    storeId?: string
    search?: string
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) => api.get('/products', { params }),

  get: (id: string) => api.get(`/products/${id}`),

  getBySlug: (slug: string) => api.get(`/products/slug/${slug}`),

  create: (data: {
    name: string
    description?: string
    price: number
    comparePrice?: number
    sku?: string
    productType?: ProductType
    productSource?: ProductSource
    requiresShipping?: boolean
    trackInventory?: boolean
    lowStock?: number
    stock: number
    categoryId?: string
    images?: string[]
    digitalAssets?: Array<Partial<DigitalAsset>>
    variants?: Array<{
      name: string
      options: Record<string, string>
      price: number
      stock: number
      sku?: string
    }>
  }) => api.post('/products', data),

  update: (id: string, data: Partial<{
    name: string
    description: string
    price: number
    comparePrice: number
    sku: string
    productType: ProductType
    productSource: ProductSource
    requiresShipping: boolean
    trackInventory: boolean
    lowStock: number
    stock: number
    categoryId: string
    status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED'
  }>) => api.patch(`/products/${id}`, data),

  delete: (id: string) => api.delete(`/products/${id}`),

  uploadImage: (productId: string, file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    return api.post(`/products/${productId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  deleteImage: (productId: string, imageId: string) =>
    api.delete(`/products/${productId}/images/${imageId}`),

  // Marketplace search
  search: (params: {
    q: string
    category?: string
    limit?: number
    page?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) => api.get('/products/search', { params }),

  // Trending products
  getTrending: (params?: { limit?: number }) =>
    api.get('/products/trending', { params }),

  // Top rated products
  getTopProducts: (params?: { limit?: number }) =>
    api.get('/products/top', { params }),

  // Deals / discounted products
  getDeals: (params?: { limit?: number }) =>
    api.get('/deals', { params }),

  // Category products by slug
  getCategoryBySlug: (slug: string, params?: { limit?: number; page?: number }) =>
    api.get(`/products/category/${slug}`, { params }),

  // Categories
  getCategories: () => api.get('/products/categories'),

  getCategory: (id: string) => api.get(`/products/categories/${id}`),
}

// ==================== Marketplace API ====================

export const marketplaceApi = {
  getHomeFeed: () => api.get('/products/home-feed'),

  // Banners
  getBanners: (params?: { type?: string }) =>
    api.get('/banners', { params }),

  // Categories (public)
  getCategories: () => api.get('/categories'),

  // Brands
  getBrands: () => api.get('/brands'),

  // Top sellers
  getSellers: (params?: { limit?: number }) =>
    api.get('/sellers', { params }),

  // Pool-backed marketplace inventory
  getPoolOffers: (params?: { categoryId?: string; page?: number; limit?: number }) =>
    api.get<VendorPoolOffer[]>('/pool/offers', { params }),

  getPoolCampaigns: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get<PoolCampaign[]>('/pool/campaigns', { params }),
}

export const marketplaceStoresApi = {
  getBySlug: (slug: string) => api.get<Store>(`/stores/${encodeURIComponent(slug)}`),

  getProducts: (
    slug: string,
    params?: {
      limit?: number
      search?: string
      category?: string
      source?: string
    },
  ) => api.get<Product[]>(`/stores/${encodeURIComponent(slug)}/products`, { params }),

  getProduct: (slug: string, productSlug: string) =>
    api.get<Product>(`/stores/${encodeURIComponent(slug)}/products/${encodeURIComponent(productSlug)}`),
}

// ==================== Checkout API ====================

export const checkoutApi = {
  create: (data: CheckoutRequest) =>
    api.post<CheckoutResponse>('/checkout', data),

  verifyPayment: (reference: string) =>
    api.get(`/checkout/payments/${reference}`),
}

// ==================== Store API ====================

export const storeApi = {
  get: () => api.get('/store'),

  create: (data: {
    name: string
    slug?: string
    description?: string
    category?: string
  }) => api.post('/store', data),

  update: (data: Partial<{
    name: string
    description: string
    category: string
    slug: string
    logoUrl: string
    bannerUrl: string
  }>) => api.patch('/store', data),

  uploadLogo: (file: File) => {
    const formData = new FormData()
    formData.append('logo', file)
    return api.post('/store/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  uploadBanner: (file: File) => {
    const formData = new FormData()
    formData.append('banner', file)
    return api.post('/store/banner', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  // Analytics
  getAnalytics: (period?: '7d' | '30d' | '90d' | '1y') =>
    api.get('/store/analytics', { params: { period } }),
}

export const uploadApi = {
  productImage: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/upload/product', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

// ==================== Vendor Commerce API ====================

export const vendorCommerceApi = {
  getDashboard: () => api.get<VendorDashboardMetrics>('/vendor/dashboard'),

  listProducts: (params?: { status?: string; type?: ProductType; search?: string; page?: number; limit?: number }) =>
    api.get('/vendor/products', { params }),

  createProduct: (data: {
    name: string
    description?: string
    price: number
    comparePrice?: number
    sku?: string
    brandId?: string
    categoryId?: string
    productType: ProductType
    productSource?: ProductSource
    status?: ProductStatus
    inventoryPolicy?: InventoryPolicy
    requiresShipping?: boolean
    trackInventory?: boolean
    initialStock?: number
    lowStock?: number
    images?: string[]
    poolEnabled?: boolean
    poolBasePrice?: number
    poolMinSalePrice?: number
    poolMaxSelectableQuantity?: number
  }) => api.post('/vendor/products', data),

  updateProduct: (
    productId: string,
    data: Partial<{
      name: string
      description: string
      price: number
      comparePrice: number
      sku: string
      brandId: string
      categoryId: string
      status: ProductStatus
      productType: ProductType
      inventoryPolicy: InventoryPolicy
      requiresShipping: boolean
      trackInventory: boolean
      lowStock: number
      images: string[]
      poolEnabled: boolean
      poolBasePrice: number
      poolMinSalePrice: number
      poolMaxSelectableQuantity: number
    }>,
  ) => api.patch(`/vendor/products/${productId}`, data),

  getDeliverySettings: () => api.get('/vendor/delivery-settings'),

  updateDeliverySettings: (data: {
    manualDeliveryEnabled?: boolean
    kwiksellerDeliveryEnabled?: boolean
    processingDays?: number
    dispatchNote?: string
    returnPolicy?: string
  }) => api.patch('/vendor/delivery-settings', data),

  adjustInventory: (
    productId: string,
    data: { variantId?: string; quantityDelta: number; reason: string },
  ) => api.post<InventoryItem>('/vendor/inventory/adjustments', { productId, ...data }),

  addDigitalAsset: (productId: string, data: Partial<DigitalAsset>) =>
    api.post<DigitalAsset>('/vendor/digital-assets', { productId, ...data }),

  listOrders: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/vendor/orders', { params }),

  updateOrderStatus: (orderId: string, status: string) =>
    api.patch(`/vendor/orders/${orderId}/status`, { status }),

  listPoolCatalog: (params?: { categoryId?: string; vendorId?: string; search?: string; page?: number; limit?: number }) =>
    api.get<PoolProduct[]>('/vendor/pool/catalog', { params }),

  createPoolOffer: (data: { poolProductId: string; retailPrice: number; markup?: number }) =>
    api.post<VendorPoolOffer>('/vendor/pool/offers', data),

  createPoolSelection: (data: PoolSelectionRequest) =>
    api.post<VendorPoolOffer>('/vendor/pool/selections', data),

  updatePoolSelection: (id: string, data: Partial<{ retailPrice: number; status: string; isActive: boolean }>) =>
    api.patch<VendorPoolOffer>(`/vendor/pool/selections/${id}`, data),

  deletePoolSelection: (id: string) =>
    api.delete(`/vendor/pool/selections/${id}`),

  updatePoolOffer: (id: string, data: Partial<{ retailPrice: number; markup: number; status: string }>) =>
    api.patch<VendorPoolOffer>(`/vendor/pool/offers/${id}`, data),

  getStorefrontDesign: () => api.get<StorefrontDesignConfig>('/vendor/storefront-design'),

  updateStorefrontDesign: (data: Partial<StorefrontDesignConfig>) =>
    api.patch<StorefrontDesignConfig>('/vendor/storefront-design', data),

  // Vendor order detail & actions
  getOrderDetail: (orderId: string) => api.get(`/vendor/orders/${orderId}`),

  acceptOrder: (orderId: string, note?: string) =>
    api.patch(`/vendor/orders/${orderId}/accept`, { note }),

  rejectOrder: (orderId: string, reason: string) =>
    api.patch(`/vendor/orders/${orderId}/reject`, { reason }),

  prepareOrder: (orderId: string) =>
    api.patch(`/vendor/orders/${orderId}/prepare`),

  readyOrder: (orderId: string) =>
    api.patch(`/vendor/orders/${orderId}/ready`),

  cancelOrder: (orderId: string, reason: string) =>
    api.patch(`/vendor/orders/${orderId}/cancel`, { reason }),
}

// ==================== Analytics API ====================

export const analyticsApi = {
  getOverview: (params?: { startDate?: string; endDate?: string; period?: string }) =>
    api.get('/vendor/analytics/overview', { params }),

  getRevenue: (params?: { startDate?: string; endDate?: string; period?: string; groupBy?: string }) =>
    api.get('/vendor/analytics/revenue', { params }),

  getTopProducts: (params?: { startDate?: string; endDate?: string; limit?: number }) =>
    api.get('/vendor/analytics/top-products', { params }),

  getCategories: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/vendor/analytics/categories', { params }),

  getProducts: (params?: { startDate?: string; endDate?: string; period?: string; limit?: number }) =>
    api.get('/vendor/analytics/products', { params }),

  getOrders: (params?: { startDate?: string; endDate?: string; period?: string }) =>
    api.get('/vendor/analytics/orders', { params }),

  getCustomers: (params?: { startDate?: string; endDate?: string; period?: string }) =>
    api.get('/vendor/analytics/customers', { params }),
}

// ==================== Order Operations API ====================

export const orderOperationsApi = {
  addNote: (orderId: string, note: string) =>
    api.post(`/vendor/orders/${orderId}/note`, { note }),
}

// ==================== Vendor Profile API ====================

export const vendorProfileApi = {
  update: (data: {
    storeName?: string
    storeSlug?: string
    storeDescription?: string
    phone?: string
    firstName?: string
    lastName?: string
  }) => api.patch('/vendor/profile', data),
}

// ==================== Orders API ====================

export const ordersApi = {
  list: (params?: {
    status?: string
    storeId?: string
    buyerId?: string
    page?: number
    limit?: number
  }) => api.get('/orders', { params }),

  get: (id: string) => api.get(`/orders/${id}`),

  create: (data: {
    items: Array<{
      productId: string
      variantId?: string
      quantity: number
    }>
    addressId: string
    paymentMethod?: string
  }) => api.post('/orders', data),

  updateStatus: (id: string, status: string) =>
    api.patch(`/orders/${id}/status`, { status }),

  cancel: (id: string, reason?: string) =>
    api.post(`/orders/${id}/cancel`, { reason }),

  // Tracking
  getTracking: (id: string) => api.get(`/orders/${id}/tracking`),

  // For vendors
  getStoreOrders: (params?: {
    status?: string
    page?: number
    limit?: number
  }) => api.get('/orders/store', { params }),

  acceptOrder: (id: string) => api.post(`/orders/${id}/accept`),

  rejectOrder: (id: string, reason: string) =>
    api.post(`/orders/${id}/reject`, { reason }),

  markAsReady: (id: string) => api.post(`/orders/${id}/ready`),

  markAsShipped: (id: string, trackingNumber?: string) =>
    api.post(`/orders/${id}/ship`, { trackingNumber }),
}

// ==================== Cart API ====================

export const cartApi = {
  get: () => api.get('/cart'),

  validate: () => api.get<CartValidationResponse>('/cart/validate'),

  addItem: (productId: string, quantity: number, variantId?: string) =>
    api.post('/cart/items', { productId, quantity, variantId }),

  addPoolOffer: (poolOfferId: string, quantity: number) =>
    api.post(`/cart/pool-offers/${poolOfferId}`, { quantity }),

  updateItem: (itemId: string, quantity: number) =>
    api.patch(`/cart/items/${itemId}`, { quantity }),

  removeItem: (itemId: string) => api.delete(`/cart/items/${itemId}`),

  clearStore: (storeSlug: string) => api.delete(`/cart/stores/${encodeURIComponent(storeSlug)}`),

  clear: () => api.delete('/cart'),

  applyCoupon: (code: string) =>
    api.post<CouponValidationResponse>('/cart/coupon', { code }),

  removeCoupon: () => api.delete('/cart/coupon'),
}

export const deliveryRatesApi = {
  lookup: (params: { state: string; localGovernment: string }) =>
    api.get<DeliveryRate>('/delivery-rates', { params }),
}

// ==================== Payments API ====================

export const paymentsApi = {
  // Initialize payment
  initialize: (orderId: string, gateway: 'PAYSTACK' | 'FLUTTERWAVE') =>
    api.post('/payments/initialize', { orderId, gateway }),

  // Verify payment
  verify: (reference: string) =>
    api.get(`/payments/verify/${reference}`),

  verifyPaystackWebhookHealth: () => api.get('/payments/paystack/health'),

  // Get payment methods
  getMethods: () => api.get('/payments/methods'),

  // Wallet (for vendors) — backend controller is @Controller('vendor/wallet')
  getWallet: () => api.get('/vendor/wallet'),

  getWalletTransactions: (params?: {
    type?: 'CREDIT' | 'DEBIT'
    page?: number
    limit?: number
  }) => api.get('/vendor/wallet/transactions', { params }),

  requestWithdrawal: (data: {
    amount: number
    bankCode: string
    accountNumber: string
    accountName: string
  }) => api.post('/vendor/wallet/withdraw', data),

  getWithdrawals: (params?: { status?: string }) =>
    api.get('/vendor/wallet/withdrawals', { params }),

  // Bank list
  getBanks: () => api.get('/payments/banks'),

  verifyAccount: (bankCode: string, accountNumber: string) =>
    api.get(`/payments/verify-account`, {
      params: { bankCode, accountNumber },
    }),
}

// ==================== Notifications API ====================

export const notificationsApi = {
  list: (params?: {
    unread?: boolean
    type?: string
    page?: number
    limit?: number
  }) => api.get('/notifications', { params }),

  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),

  markAllAsRead: () => api.post('/notifications/read-all'),

  getUnreadCount: () => api.get('/notifications/unread-count'),

  // Push notifications
  subscribePush: (subscription: PushSubscriptionJSON) =>
    api.post('/notifications/push/subscribe', subscription),

  unsubscribePush: (endpoint: string) =>
    api.delete('/notifications/push/unsubscribe', { data: { endpoint } }),

  getVapidKey: () => api.get('/notifications/push/vapid-public-key'),
}

// ==================== Subscriptions API ====================

export const subscriptionsApi = {
  getPlans: () => api.get('/subscriptions/plans'),

  getCurrentPlan: () => api.get('/subscriptions/current'),

  subscribe: (plan: string) => api.post('/subscriptions', { plan }),

  cancel: () => api.post('/subscriptions/cancel'),

  renew: () => api.post('/subscriptions/renew'),
}

// ==================== Delivery API (Riders) ====================

export const deliveryApi = {
  // Get available deliveries
  getAvailable: (params?: {
    page?: number
    limit?: number
  }) => api.get('/deliveries/available', { params }),

  // Get my deliveries
  getMyDeliveries: (params?: {
    status?: string
    page?: number
    limit?: number
  }) => api.get('/deliveries/my', { params }),

  // Accept delivery
  accept: (orderId: string) => api.post(`/deliveries/${orderId}/accept`),

  // Pickup
  pickup: (orderId: string, photoUrl?: string) =>
    api.post(`/deliveries/${orderId}/pickup`, { photoUrl }),

  // In transit
  startTransit: (orderId: string) =>
    api.post(`/deliveries/${orderId}/start-transit`),

  // Complete delivery
  complete: (orderId: string, otp: string, photoUrl?: string) =>
    api.post(`/deliveries/${orderId}/complete`, { otp, photoUrl }),

  // Get delivery details
  getDetails: (orderId: string) => api.get(`/deliveries/${orderId}`),

  // Update location
  updateLocation: (lat: number, lng: number) =>
    api.post('/deliveries/location', { lat, lng }),

  // Toggle availability
  toggleAvailability: (isAvailable: boolean) =>
    api.patch('/deliveries/availability', { isAvailable }),

  // Earnings
  getEarnings: (period?: 'today' | 'week' | 'month') =>
    api.get('/deliveries/earnings', { params: { period } }),
}

// ==================== KYC API ====================

export const kycApi = {
  getStatus: () => api.get('/vendor/kyc/status'),

  submitKyc: (data: {
    businessType: 'INDIVIDUAL' | 'SOLE_PROPRIETORSHIP' | 'REGISTERED_BUSINESS';
    fullName: string;
    dateOfBirth: string;
    phone: string;
    idType: 'NIN' | 'PASSPORT' | 'DRIVERS_LICENSE';
    idFrontUrl: string;
    idBackUrl?: string;
    businessRegistrationUrl?: string;
    utilityBillUrl?: string;
    taxId?: string;
    selfieUrl?: string;
  }) => api.post('/vendor/kyc/submit', data),

  getSubmissions: () => api.get('/vendor/kyc/submissions'),
}

// ==================== Onboarding API ====================

export const onboardingApi = {
  getStatus: () => api.get('/vendor/onboarding/status'),

  completeStep: (step: string, data: Record<string, unknown>) =>
    api.post('/vendor/onboarding/step', { step, data }),

  complete: () => api.post('/vendor/onboarding/complete'),
}

// ==================== Vendor Deliveries API ====================

export const vendorDeliveriesApi = {
  // List vendor's deliveries
  list: (params?: {
    status?: string
    page?: number
    limit?: number
  }) => api.get('/vendor/deliveries', { params }),

  // Mark delivery as preparing (ACCEPTED → PREPARING)
  markPreparing: (deliveryId: string) =>
    api.post(`/vendor/deliveries/${deliveryId}/preparing`),

  // Mark as ready for pickup (PREPARING → READY_FOR_PICKUP)
  markReady: (deliveryId: string) =>
    api.post(`/vendor/deliveries/${deliveryId}/ready`),

  // Vendor confirms handoff to rider (alternative pickup confirmation)
  confirmPickup: (deliveryId: string) =>
    api.post(`/vendor/deliveries/${deliveryId}/pickup-confirm`),

  // Get tracking info for a specific delivery
  getTracking: (deliveryId: string) =>
    api.get(`/vendor/deliveries/${deliveryId}/tracking`),
}

// ==================== Escrow API ====================

export const escrowApi = {
  // Get vendor's escrow holdings
  getHoldings: () => api.get('/vendor/wallet/escrow-holdings'),

  // Admin: manual escrow release
  manualRelease: (deliveryId: string) =>
    api.post(`/admin/escrow/${deliveryId}/manual-release`),

  // Admin: refund escrow
  refund: (deliveryId: string) =>
    api.post(`/admin/escrow/${deliveryId}/refund`),

  // Get escrow detail for a specific delivery
  getEscrowDetail: (deliveryId: string) =>
    api.get(`/vendor/escrow/${deliveryId}`),

  // Open a dispute on an escrow holding
  openDispute: (orderId: string, reason: string, evidence?: string) =>
    api.post(`/vendor/escrow/${orderId}/dispute`, { reason, evidence }),
}

// ==================== Admin API ====================

export const adminApi = {
  // Dashboard stats
  getStats: () => api.get('/admin/stats'),

  // Users management
  getUsers: (params?: {
    role?: string
    status?: string
    search?: string
    page?: number
    limit?: number
  }) => api.get('/admin/users', { params }),

  getUser: (id: string) => api.get(`/admin/users/${id}`),

  updateUserStatus: (id: string, status: 'ACTIVE' | 'SUSPENDED' | 'BANNED') =>
    api.patch(`/admin/users/${id}/status`, { status }),

  // Vendors
  getVendors: (params?: {
    status?: string
    kycStatus?: string
    search?: string
    page?: number
    limit?: number
  }) => api.get('/admin/vendors', { params }),

  approveKyc: (vendorId: string) =>
    api.post(`/admin/vendors/${vendorId}/kyc/approve`),

  rejectKyc: (vendorId: string, reason: string) =>
    api.post(`/admin/vendors/${vendorId}/kyc/reject`, { reason }),

  // Products moderation
  getProductsForReview: (params?: {
    page?: number
    limit?: number
  }) => api.get('/admin/products/review', { params }),

  approveProduct: (productId: string) =>
    api.post(`/admin/products/${productId}/approve`),

  rejectProduct: (productId: string, reason: string) =>
    api.post(`/admin/products/${productId}/reject`, { reason }),

  // Orders
  getAllOrders: (params?: {
    status?: string
    page?: number
    limit?: number
  }) => api.get('/admin/orders', { params }),

  updateOrderManualStatus: (orderId: string, status: string, note?: string, trackingCode?: string) =>
    api.patch(`/admin/orders/${orderId}/manual-status`, { status, note, trackingCode }),

  // Commerce operations
  getCommerceOverview: () => api.get('/admin/commerce/overview'),

  getPayments: (params?: { status?: string; gateway?: string; page?: number; limit?: number }) =>
    api.get('/admin/payments', { params }),

  getDeliveryRates: (params?: { state?: string; isActive?: boolean }) =>
    api.get<DeliveryRate[]>('/admin/delivery-rates', { params }),

  createDeliveryRate: (data: {
    state: string
    localGovernment: string
    fee: number
    minDeliveryDays: number
    maxDeliveryDays: number
    isActive?: boolean
  }) => api.post<DeliveryRate>('/admin/delivery-rates', data),

  updateDeliveryRate: (
    id: string,
    data: Partial<{
      state: string
      localGovernment: string
      fee: number
      minDeliveryDays: number
      maxDeliveryDays: number
      isActive: boolean
    }>,
  ) => api.patch<DeliveryRate>(`/admin/delivery-rates/${id}`, data),

  deactivateDeliveryRate: (id: string) => api.delete<DeliveryRate>(`/admin/delivery-rates/${id}`),

  refundPayment: (paymentId: string, reason: string, amount?: number, orderId?: string) =>
    api.post(`/admin/payments/${paymentId}/refund`, { reason, amount, orderId }),

  // Pool governance
  getPoolProducts: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get<PoolProduct[]>('/admin/pool/products', { params }),

  createPoolProduct: (data: Partial<PoolProduct>) =>
    api.post<PoolProduct>('/admin/pool/products', data),

  updatePoolProduct: (id: string, data: Partial<PoolProduct>) =>
    api.patch<PoolProduct>(`/admin/pool/products/${id}`, data),

  getPoolCampaigns: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get<PoolCampaign[]>('/admin/pool/campaigns', { params }),

  createPoolCampaign: (data: Partial<PoolCampaign>) =>
    api.post<PoolCampaign>('/admin/pool/campaigns', data),

  // Disputes
  getDisputes: (params?: {
    status?: string
    page?: number
    limit?: number
  }) => api.get('/admin/disputes', { params }),

  resolveDispute: (disputeId: string, resolution: string, refundAmount?: number) =>
    api.post(`/admin/disputes/${disputeId}/resolve`, { resolution, refundAmount }),

  // Analytics
  getAnalytics: (period?: '7d' | '30d' | '90d' | '1y') =>
    api.get('/admin/analytics', { params: { period } }),

  // Settings
  getSettings: () => api.get('/admin/settings'),

  updateSettings: (settings: Record<string, unknown>) =>
    api.patch('/admin/settings', settings),
}

// Export default instance for custom requests
export default apiClient
