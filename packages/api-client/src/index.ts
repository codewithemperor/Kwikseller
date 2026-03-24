// KWIKSELLER - API Client
// Centralized API client for all apps

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

// Types
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

// Base API configuration
const getBaseURL = (): string => {
  // In browser, use relative path with subdomain routing
  if (typeof window !== 'undefined') {
    return '/api/v1'
  }
  // Server-side, use environment variable or default
  return process.env.API_URL || 'http://localhost:3001/api/v1'
}

// Create Axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage (client-side only)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - Handle errors and token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    // Handle 401 Unauthorized - Try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const response = await axios.post(`${getBaseURL()}/auth/refresh`, {
            refreshToken,
          })

          const { accessToken, refreshToken: newRefreshToken } = response.data.data
          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('refreshToken', newRefreshToken)

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`
          }
          return apiClient(originalRequest)
        }
      } catch {
        // Refresh failed - Clear tokens and redirect to login
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
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

// Export typed API methods
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    apiClient.get(url, config).then((res) => res.data),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    apiClient.post(url, data, config).then((res) => res.data),

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    apiClient.put(url, data, config).then((res) => res.data),

  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    apiClient.patch(url, data, config).then((res) => res.data),

  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    apiClient.delete(url, config).then((res) => res.data),
}

export default apiClient

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (data: { email: string; password: string; role: string; phone?: string }) =>
    api.post('/auth/register', data),
  
  logout: () =>
    api.post('/auth/logout'),
  
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
  
  me: () =>
    api.get('/auth/me'),
  
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
}

// Products API
export const productsApi = {
  list: (params?: { category?: string; status?: string; page?: number; limit?: number }) =>
    api.get('/products', { params }),
  
  get: (id: string) =>
    api.get(`/products/${id}`),
  
  create: (data: unknown) =>
    api.post('/products', data),
  
  update: (id: string, data: unknown) =>
    api.patch(`/products/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/products/${id}`),
}

// Orders API
export const ordersApi = {
  list: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/orders', { params }),
  
  get: (id: string) =>
    api.get(`/orders/${id}`),
  
  create: (data: unknown) =>
    api.post('/orders', data),
  
  updateStatus: (id: string, status: string) =>
    api.patch(`/orders/${id}/status`, { status }),
  
  cancel: (id: string, reason?: string) =>
    api.post(`/orders/${id}/cancel`, { reason }),
}

// Cart API
export const cartApi = {
  get: () =>
    api.get('/cart'),
  
  addItem: (productId: string, quantity: number, variantId?: string) =>
    api.post('/cart/items', { productId, quantity, variantId }),
  
  updateItem: (itemId: string, quantity: number) =>
    api.patch(`/cart/items/${itemId}`, { quantity }),
  
  removeItem: (itemId: string) =>
    api.delete(`/cart/items/${itemId}`),
  
  clear: () =>
    api.delete('/cart'),
}

// Notifications API
export const notificationsApi = {
  list: (params?: { unread?: boolean; type?: string }) =>
    api.get('/notifications', { params }),
  
  markAsRead: (id: string) =>
    api.patch(`/notifications/${id}/read`),
  
  markAllAsRead: () =>
    api.post('/notifications/read-all'),
  
  subscribePush: (subscription: PushSubscriptionJSON) =>
    api.post('/notifications/push/subscribe', subscription),
  
  unsubscribePush: (endpoint: string) =>
    api.delete(`/notifications/push/unsubscribe`, { data: { endpoint } }),
  
  getVapidKey: () =>
    api.get('/notifications/push/vapid-public-key'),
}
