// KWIKSELLER - HTTP Client Types
// TypeScript types for the shared axios HTTP client

import type { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'

/**
 * Token storage keys used in localStorage
 */
export const TOKEN_STORAGE_KEYS = {
  ACCESS_TOKEN: 'kwikseller_access_token',
  REFRESH_TOKEN: 'kwikseller_refresh_token',
} as const

/**
 * API response wrapper type for standardized responses
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  message?: string
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
  }
}

/**
 * API error response type
 */
export interface ApiErrorResponse {
  success: false
  message: string
  error?: string
  statusCode: number
  errors?: Array<{
    field: string
    message: string
  }>
}

/**
 * Token refresh request body
 */
export interface RefreshTokenRequest {
  refreshToken: string
}

/**
 * Token refresh response
 */
export interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
}

/**
 * Request configuration extending Axios config
 */
export interface RequestConfig extends Omit<AxiosRequestConfig, 'method'> {
  skipAuth?: boolean
  skipRetry?: boolean
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Paginated response type
 */
export interface PaginatedResponse<T> {
  items: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
 * HTTP methods type
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/**
 * API client interface
 */
export interface ApiClient {
  get<T = unknown>(url: string, config?: RequestConfig): Promise<T>
  post<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T>
  put<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T>
  patch<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T>
  delete<T = unknown>(url: string, config?: RequestConfig): Promise<T>
}

/**
 * Axios error with our error response type
 */
export type TypedAxiosError = AxiosError<ApiErrorResponse>

/**
 * Request interceptor function type
 */
export type RequestInterceptor = (config: AxiosRequestConfig) => AxiosRequestConfig | Promise<AxiosRequestConfig>

/**
 * Response interceptor function type
 */
export type ResponseInterceptor<T = unknown> = (response: AxiosResponse<T>) => AxiosResponse<T> | Promise<AxiosResponse<T>>

/**
 * Error interceptor function type
 */
export type ErrorInterceptor = (error: TypedAxiosError) => Promise<never> | void

/**
 * HTTP client configuration options
 */
export interface HttpClientConfig {
  baseURL?: string
  timeout?: number
  withCredentials?: boolean
  headers?: Record<string, string>
}

/**
 * Default configuration for the HTTP client
 */
export const DEFAULT_CONFIG: HttpClientConfig = {
  timeout: 30000,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
  },
}
