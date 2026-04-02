// KWIKSELLER - Shared API Client
// Centralized Axios client for all frontend apps

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'

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
  // In browser, use relative path (handled by gateway)
  if (typeof window !== 'undefined') {
    return '/api/v1'
  }
  // Server-side, use environment variable or default
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'
}

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'kwikseller_access_token',
  REFRESH_TOKEN: 'kwikseller_refresh_token',
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

  // Response interceptor - Handle errors and token refresh
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError<ApiError>) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean
      }

      // Handle 401 Unauthorized - Try to refresh token
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true

        try {
          const refreshToken = tokenManager.getRefreshToken()
          if (refreshToken) {
            const response = await axios.post(`${getBaseURL()}/auth/refresh`, {
              refreshToken,
            })

            const { accessToken, refreshToken: newRefreshToken } = response.data.data || response.data
            tokenManager.setTokens(accessToken, newRefreshToken)

            // Retry original request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`
            }
            return instance(originalRequest)
          }
        } catch {
          // Refresh failed - Clear tokens
          tokenManager.clearTokens()
          
          // Redirect to login if in browser
          if (typeof window !== 'undefined') {
            const currentPath = window.location.pathname
            const loginPath = currentPath.includes('/admin') 
              ? '/admin/login' 
              : currentPath.includes('/vendor')
                ? '/vendor/login'
                : currentPath.includes('/rider')
                  ? '/rider/login'
                  : '/login'
            window.location.href = loginPath
          }
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
}

// ==================== Users API ====================

export const usersApi = {
  getProfile: () => api.get('/users/profile'),

  updateProfile: (data: {
    firstName?: string
    lastName?: string
    phone?: string
    bio?: string
  }) => api.patch('/users/profile', data),

  uploadAvatar: (file: File) => {
    const formData = new FormData()
    formData.append('avatar', file)
    return api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  getAddresses: () => api.get('/users/addresses'),

  addAddress: (data: {
    line1: string
    line2?: string
    city: string
    state: string
    country: string
    postalCode?: string
    type: 'SHIPPING' | 'BILLING'
    isDefault?: boolean
  }) => api.post('/users/addresses', data),

  updateAddress: (id: string, data: Partial<{
    line1: string
    line2: string
    city: string
    state: string
    country: string
    postalCode: string
    isDefault: boolean
  }>) => api.patch(`/users/addresses/${id}`, data),

  deleteAddress: (id: string) => api.delete(`/users/addresses/${id}`),

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
    stock: number
    categoryId?: string
    images?: string[]
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

  // Categories
  getCategories: () => api.get('/products/categories'),

  getCategory: (id: string) => api.get(`/products/categories/${id}`),
}

// ==================== Store API ====================

export const storeApi = {
  get: () => api.get('/store'),

  create: (data: {
    name: string
    description?: string
    category?: string
  }) => api.post('/store', data),

  update: (data: Partial<{
    name: string
    description: string
    category: string
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

  addItem: (productId: string, quantity: number, variantId?: string) =>
    api.post('/cart/items', { productId, quantity, variantId }),

  updateItem: (itemId: string, quantity: number) =>
    api.patch(`/cart/items/${itemId}`, { quantity }),

  removeItem: (itemId: string) => api.delete(`/cart/items/${itemId}`),

  clear: () => api.delete('/cart'),

  applyCoupon: (code: string) =>
    api.post('/cart/coupon', { code }),

  removeCoupon: () => api.delete('/cart/coupon'),
}

// ==================== Payments API ====================

export const paymentsApi = {
  // Initialize payment
  initialize: (orderId: string, gateway: 'PAYSTACK' | 'FLUTTERWAVE') =>
    api.post('/payments/initialize', { orderId, gateway }),

  // Verify payment
  verify: (reference: string) =>
    api.get(`/payments/verify/${reference}`),

  // Get payment methods
  getMethods: () => api.get('/payments/methods'),

  // Wallet (for vendors)
  getWallet: () => api.get('/payments/wallet'),

  getWalletTransactions: (params?: {
    type?: 'CREDIT' | 'DEBIT'
    page?: number
    limit?: number
  }) => api.get('/payments/wallet/transactions', { params }),

  requestWithdrawal: (data: {
    amount: number
    bankCode: string
    accountNumber: string
    accountName: string
  }) => api.post('/payments/wallet/withdraw', data),

  getWithdrawals: (params?: { status?: string }) =>
    api.get('/payments/wallet/withdrawals', { params }),

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
