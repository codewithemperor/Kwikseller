/**
 * KWIKSELLER - HTTP Client Exports
 */

// Main client
export { httpClient, api, getWithMeta, getPaginated } from './client'

// Token management
export {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  isAuthenticated,
} from './client'

// Types
export {
  TOKEN_STORAGE_KEYS,
  DEFAULT_CONFIG,
  type ApiResponse,
  type ApiErrorResponse,
  type RefreshTokenRequest,
  type RefreshTokenResponse,
  type RequestConfig,
  type PaginationParams,
  type PaginatedResponse,
  type HttpMethod,
  type ApiClient,
  type TypedAxiosError,
  type RequestInterceptor,
  type ResponseInterceptor,
  type ErrorInterceptor,
  type HttpClientConfig,
} from './types'

// Default export
export { default } from './client'
