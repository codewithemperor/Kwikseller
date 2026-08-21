/**
 * KWIKSELLER - HTTP Client Exports (adapter over @/lib/api-client).
 *
 * See ./client.ts for the full rationale. In short: there is now ONE real
 * axios instance (in @/lib/api-client); this module only adapts its
 * response shape + provides an ApiError class for legacy consumers.
 */
export { default } from "./client";
export { api, ApiError, httpClient } from "./client";
export {
  setTokens,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  isAuthenticated,
  getWithMeta,
  getPaginated,
} from "./client";
export { TOKEN_STORAGE_KEYS, DEFAULT_CONFIG } from "./types";
export type {
  ApiResponse,
  ApiErrorResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  RequestConfig,
  PaginationParams,
  PaginatedResponse,
  HttpMethod,
  ApiClient,
  TypedAxiosError,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
  HttpClientConfig,
} from "./types";

