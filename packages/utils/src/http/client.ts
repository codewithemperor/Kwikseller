// KWIKSELLER - HTTP Client
// Shared axios instance with automatic token handling and refresh

import axios, { type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import {
  TOKEN_STORAGE_KEYS,
  type ApiResponse,
  type ApiErrorResponse,
  type RefreshTokenResponse,
  type RequestConfig,
  type ApiClient,
  type TypedAxiosError,
  DEFAULT_CONFIG,
} from './types'

/**
 * Get the base URL for API requests
 */
function getBaseURL(): string {
  // Check for environment variable first (works in both browser and server)
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }
  // Fallback to relative path (works with Next.js rewrites)
  return '/api/v1'
}

/**
 * Get access token from localStorage
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN)
}

/**
 * Get refresh token from localStorage
 */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN)
}

/**
 * Set tokens in localStorage
 */
export function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN, accessToken)
  localStorage.setItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
}

/**
 * Clear tokens from localStorage
 */
export function clearTokens(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN)
  localStorage.removeItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN)
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAccessToken()
}

/**
 * Redirect to login page
 */
function redirectToLogin(): void {
  if (typeof window === 'undefined') return
  // Clear tokens first
  clearTokens()
  // Redirect to login, preserving the current path for redirect after login
  const currentPath = window.location.pathname
  const loginUrl = `/login?redirect=${encodeURIComponent(currentPath)}`
  window.location.href = loginUrl
}

// Track if we're currently refreshing the token
let isRefreshing = false
// Queue of failed requests waiting for token refresh
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: Error) => void
}> = []

/**
 * Process the failed request queue
 */
function processQueue(error: Error | null, token: string | null = null): void {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else if (token) {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

/**
 * Attempt to refresh the access token
 */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  
  if (!refreshToken) {
    return null
  }
  
  try {
    const response = await axios.post<ApiResponse<RefreshTokenResponse>>(
      `${getBaseURL()}/auth/refresh`,
      { refreshToken },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
    
    const { accessToken, refreshToken: newRefreshToken } = response.data.data
    setTokens(accessToken, newRefreshToken)
    
    return accessToken
  } catch (error) {
    console.error('Token refresh failed:', error)
    return null
  }
}

/**
 * Create the axios instance with default configuration
 */
function createAxiosInstance(): AxiosInstance {
  const instance = axios.create({
    baseURL: getBaseURL(),
    timeout: DEFAULT_CONFIG.timeout,
    withCredentials: DEFAULT_CONFIG.withCredentials,
    headers: DEFAULT_CONFIG.headers,
  })
  
  // Request interceptor - attach access token to requests
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = getAccessToken()
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
      
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )
  
  // Response interceptor - handle errors and token refresh
  instance.interceptors.response.use(
    (response) => {
      // Extract data from standardized API response
      return response
    },
    async (error: TypedAxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
      
      // Check if it's a 401 error and we haven't already tried to refresh
      // Skip auth refresh for login/refresh endpoints
      const isAuthEndpoint = originalRequest?.url?.includes('/auth/')
      
      if (
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest._retry &&
        !isAuthEndpoint
      ) {
        // If we're already refreshing, queue this request
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject })
          })
            .then((token) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`
              }
              return instance(originalRequest)
            })
            .catch((err) => {
              return Promise.reject(err)
            })
        }
        
        originalRequest._retry = true
        isRefreshing = true
        
        try {
          const newToken = await refreshAccessToken()
          
          if (newToken) {
            processQueue(null, newToken)
            
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`
            }
            
            return instance(originalRequest)
          } else {
            // Refresh failed, redirect to login
            processQueue(new Error('Token refresh failed'), null)
            redirectToLogin()
            return Promise.reject(error)
          }
        } catch (refreshError) {
          processQueue(refreshError as Error, null)
          redirectToLogin()
          return Promise.reject(refreshError)
        } finally {
          isRefreshing = false
        }
      }
      
      // Handle other errors
      const errorResponse: ApiErrorResponse = error.response?.data || {
        success: false,
        message: error.message || 'An unexpected error occurred',
        statusCode: error.response?.status || 500,
      }
      
      // Create a standardized error
      const apiError = new Error(errorResponse.message) as Error & {
        statusCode: number
        response: ApiErrorResponse
        originalError: TypedAxiosError
      }
      apiError.statusCode = errorResponse.statusCode
      apiError.response = errorResponse
      apiError.originalError = error
      
      return Promise.reject(apiError)
    }
  )
  
  return instance
}

/**
 * The main axios instance
 */
export const httpClient: AxiosInstance = createAxiosInstance()

/**
 * API client methods with typed responses
 */
export const api: ApiClient = {
  async get<T = unknown>(url: string, config?: RequestConfig): Promise<T> {
    const response = await httpClient.get<ApiResponse<T>>(url, config as AxiosRequestConfig)
    return response.data.data
  },
  
  async post<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    const response = await httpClient.post<ApiResponse<T>>(url, data, config as AxiosRequestConfig)
    return response.data.data
  },
  
  async put<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    const response = await httpClient.put<ApiResponse<T>>(url, data, config as AxiosRequestConfig)
    return response.data.data
  },
  
  async patch<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    const response = await httpClient.patch<ApiResponse<T>>(url, data, config as AxiosRequestConfig)
    return response.data.data
  },
  
  async delete<T = unknown>(url: string, config?: RequestConfig): Promise<T> {
    const response = await httpClient.delete<ApiResponse<T>>(url, config as AxiosRequestConfig)
    return response.data.data
  },
}

/**
 * Helper to get full response including metadata
 */
export async function getWithMeta<T>(
  url: string,
  config?: RequestConfig
): Promise<ApiResponse<T>> {
  const response = await httpClient.get<ApiResponse<T>>(url, config as AxiosRequestConfig)
  return response.data
}

/**
 * Helper for paginated requests
 */
export async function getPaginated<T>(
  url: string,
  page = 1,
  limit = 20,
  config?: RequestConfig
): Promise<ApiResponse<T[]>> {
  const params = {
    ...config?.params,
    page,
    limit,
  }
  return getWithMeta<T[]>(url, { ...config, params })
}

/**
 * Export the axios instance for custom use
 */
export default httpClient
