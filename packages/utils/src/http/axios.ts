/**
 * KWIKSELLER - Shared Axios HTTP Client
 * Centralized HTTP client for all frontend apps with auth handling
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

// ==================== Types ====================

export interface ApiResponse<T> {
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

export interface RequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean
}

// ==================== Storage Keys ====================

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'kwikseller_access_token',
  REFRESH_TOKEN: 'kwikseller_refresh_token',
}

// ==================== Token Management ====================

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
}

function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken)
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
}

function clearTokens(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
}

// ==================== Base URL Configuration ====================

function getBaseURL(): string {
  // In browser, use relative path (proxy will handle routing)
  if (typeof window !== 'undefined') {
    return '/api/v1'
  }
  // Server-side, use environment variable or default
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'
}

// ==================== Create Axios Instance ====================

const httpClient: AxiosInstance = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ==================== Request Interceptor ====================

httpClient.interceptors.request.use(
  (config) => {
    // Skip auth if explicitly requested
    if ((config as RequestConfig).skipAuth) {
      return config
    }

    // Add auth token if available
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

// ==================== Response Interceptor ====================

let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

function subscribeTokenRefresh(callback: (token: string) => void): void {
  refreshSubscribers.push(callback)
}

function onTokenRefreshed(token: string): void {
  refreshSubscribers.forEach((callback) => callback(token))
  refreshSubscribers = []
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  
  if (!refreshToken) {
    return null
  }

  try {
    const response = await axios.post(`${getBaseURL()}/auth/refresh`, {
      refreshToken,
    })

    const { accessToken, refreshToken: newRefreshToken } = response.data.data
    setTokens(accessToken, newRefreshToken)
    
    return accessToken
  } catch {
    clearTokens()
    return null
  }
}

httpClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as AxiosRequestConfig & { 
      _retry?: boolean 
      skipAuth?: boolean 
    }

    // Handle 401 Unauthorized - Try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.skipAuth) {
      if (isRefreshing) {
        // Wait for the token to be refreshed
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            resolve(httpClient(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const newToken = await refreshAccessToken()
        
        if (newToken) {
          onTokenRefreshed(newToken)
          
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
          }
          
          return httpClient(originalRequest)
        }
      } catch (refreshError) {
        clearTokens()
        
        // Redirect to login if in browser
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname
          const loginPath = `/login?redirect=${encodeURIComponent(currentPath)}`
          window.location.href = loginPath
        }
        
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // Transform error to standard format
    const apiError: ApiError = {
      statusCode: error.response?.status || 500,
      message: error.response?.data?.message || error.message || 'An error occurred',
      error: error.response?.data?.error,
      details: error.response?.data?.details,
    }

    return Promise.reject(apiError)
  }
)

// ==================== Export HTTP Methods ====================

export const http = {
  get: <T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> =>
    httpClient.get(url, config).then((res) => res.data),

  post: <T>(url: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> =>
    httpClient.post(url, data, config).then((res) => res.data),

  put: <T>(url: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> =>
    httpClient.put(url, data, config).then((res) => res.data),

  patch: <T>(url: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> =>
    httpClient.patch(url, data, config).then((res) => res.data),

  delete: <T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> =>
    httpClient.delete(url, config).then((res) => res.data),
}

// ==================== Export Instance ====================

export default httpClient

// ==================== Export Token Utilities ====================

export const tokenManager = {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
}

// ==================== Auth API ====================

export const authApi = {
  login: async (email: string, password: string): Promise<ApiResponse<{ accessToken: string; refreshToken: string; user: unknown }>> => {
    const response = await http.post<{ accessToken: string; refreshToken: string; user: unknown }>(
      '/auth/login',
      { email, password },
      { skipAuth: true }
    )
    
    if (response.success && response.data) {
      const { accessToken, refreshToken } = response.data as { accessToken: string; refreshToken: string }
      setTokens(accessToken, refreshToken)
    }
    
    return response
  },

  register: (data: { email: string; password: string; role: string; phone?: string }) =>
    http.post('/auth/register', data, { skipAuth: true }),

  logout: async (): Promise<void> => {
    const refreshToken = getRefreshToken()
    
    if (refreshToken) {
      try {
        await http.post('/auth/logout', { refreshToken })
      } catch {
        // Ignore logout errors
      }
    }
    
    clearTokens()
    
    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  },

  refresh: (refreshToken: string) =>
    http.post('/auth/refresh', { refreshToken }, { skipAuth: true }),

  me: () =>
    http.get('/auth/me'),

  forgotPassword: (email: string) =>
    http.post('/auth/forgot-password', { email }, { skipAuth: true }),

  resetPassword: (token: string, password: string) =>
    http.post('/auth/reset-password', { token, password }, { skipAuth: true }),

  verifyEmail: (token: string) =>
    http.post('/auth/verify-email', { token }, { skipAuth: true }),

  resendVerification: (email: string) =>
    http.post('/auth/resend-verification', { email }, { skipAuth: true }),
}

// ==================== Products API ====================

export const productsApi = {
  list: (params?: { category?: string; status?: string; page?: number; limit?: number; search?: string }) =>
    http.get('/products', { params }),

  get: (id: string) =>
    http.get(`/products/${id}`),

  getBySlug: (slug: string) =>
    http.get(`/products/slug/${slug}`),

  create: (data: unknown) =>
    http.post('/products', data),

  update: (id: string, data: unknown) =>
    http.patch(`/products/${id}`, data),

  delete: (id: string) =>
    http.delete(`/products/${id}`),

  uploadImage: (productId: string, formData: FormData) =>
    http.post(`/products/${productId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteImage: (productId: string, imageId: string) =>
    http.delete(`/products/${productId}/images/${imageId}`),
}

// ==================== Orders API ====================

export const ordersApi = {
  list: (params?: { status?: string; page?: number; limit?: number }) =>
    http.get('/orders', { params }),

  get: (id: string) =>
    http.get(`/orders/${id}`),

  create: (data: unknown) =>
    http.post('/orders', data),

  updateStatus: (id: string, status: string) =>
    http.patch(`/orders/${id}/status`, { status }),

  cancel: (id: string, reason?: string) =>
    http.post(`/orders/${id}/cancel`, { reason }),

  confirmDelivery: (id: string, otp: string) =>
    http.post(`/orders/${id}/confirm-delivery`, { otp }),
}

// ==================== Cart API ====================

export const cartApi = {
  get: () =>
    http.get('/cart'),

  addItem: (productId: string, quantity: number, variantId?: string) =>
    http.post('/cart/items', { productId, quantity, variantId }),

  updateItem: (itemId: string, quantity: number) =>
    http.patch(`/cart/items/${itemId}`, { quantity }),

  removeItem: (itemId: string) =>
    http.delete(`/cart/items/${itemId}`),

  clear: () =>
    http.delete('/cart'),

  applyCoupon: (code: string) =>
    http.post('/cart/coupon', { code }),

  removeCoupon: () =>
    http.delete('/cart/coupon'),
}

// ==================== Users API ====================

export const usersApi = {
  getProfile: () =>
    http.get('/users/profile'),

  updateProfile: (data: unknown) =>
    http.patch('/users/profile', data),

  updateAvatar: (formData: FormData) =>
    http.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getAddresses: () =>
    http.get('/users/addresses'),

  addAddress: (data: unknown) =>
    http.post('/users/addresses', data),

  updateAddress: (id: string, data: unknown) =>
    http.patch(`/users/addresses/${id}`, data),

  deleteAddress: (id: string) =>
    http.delete(`/users/addresses/${id}`),

  setDefaultAddress: (id: string) =>
    http.patch(`/users/addresses/${id}/default`),

  // KYC
  getKycStatus: () =>
    http.get('/users/kyc'),

  submitKyc: (data: unknown) =>
    http.post('/users/kyc', data),
}

// ==================== Store API ====================

export const storeApi = {
  get: () =>
    http.get('/store'),

  create: (data: unknown) =>
    http.post('/store', data),

  update: (data: unknown) =>
    http.patch('/store', data),

  uploadLogo: (formData: FormData) =>
    http.post('/store/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  uploadBanner: (formData: FormData) =>
    http.post('/store/banner', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getAnalytics: (period?: string) =>
    http.get('/store/analytics', { params: { period } }),
}

// ==================== Wallet API ====================

export const walletApi = {
  getBalance: () =>
    http.get('/wallet'),

  getTransactions: (params?: { page?: number; limit?: number }) =>
    http.get('/wallet/transactions', { params }),

  withdraw: (data: { amount: number; bankCode: string; accountNumber: string }) =>
    http.post('/wallet/withdraw', data),

  getBanks: () =>
    http.get('/wallet/banks'),

  verifyAccount: (bankCode: string, accountNumber: string) =>
    http.get('/wallet/verify-account', { params: { bankCode, accountNumber } }),
}

// ==================== Notifications API ====================

export const notificationsApi = {
  list: (params?: { unread?: boolean; type?: string; page?: number; limit?: number }) =>
    http.get('/notifications', { params }),

  markAsRead: (id: string) =>
    http.patch(`/notifications/${id}/read`),

  markAllAsRead: () =>
    http.post('/notifications/read-all'),

  getUnreadCount: () =>
    http.get('/notifications/unread-count'),

  subscribePush: (subscription: PushSubscriptionJSON) =>
    http.post('/notifications/push/subscribe', subscription),

  unsubscribePush: (endpoint: string) =>
    http.delete('/notifications/push/unsubscribe', { data: { endpoint } }),

  getVapidKey: () =>
    http.get('/notifications/push/vapid-public-key'),
}

// ==================== Categories API ====================

export const categoriesApi = {
  list: (params?: { parentId?: string }) =>
    http.get('/categories', { params }),

  get: (id: string) =>
    http.get(`/categories/${id}`),

  getBySlug: (slug: string) =>
    http.get(`/categories/slug/${slug}`),
}

// ==================== Reviews API ====================

export const reviewsApi = {
  list: (params?: { productId?: string; storeId?: string; page?: number; limit?: number }) =>
    http.get('/reviews', { params }),

  create: (data: { productId: string; rating: number; comment?: string }) =>
    http.post('/reviews', data),

  update: (id: string, data: { rating?: number; comment?: string }) =>
    http.patch(`/reviews/${id}`, data),

  delete: (id: string) =>
    http.delete(`/reviews/${id}`),
}

// ==================== Search API ====================

export const searchApi = {
  products: (query: string, params?: { category?: string; minPrice?: number; maxPrice?: number; sort?: string; page?: number; limit?: number }) =>
    http.get('/search/products', { params: { q: query, ...params } }),

  stores: (query: string, params?: { page?: number; limit?: number }) =>
    http.get('/search/stores', { params: { q: query, ...params } }),

  suggestions: (query: string) =>
    http.get('/search/suggestions', { params: { q: query } }),
}
