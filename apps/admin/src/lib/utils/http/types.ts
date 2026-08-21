/**
 * HTTP type definitions (re-aligned to @/lib/api-client).
 * Kept for backward compatibility with code that imported types from
 * `@/lib/utils`'s http module.
 */
import type { AxiosRequestConfig } from "axios";
import type { ApiResponse, PaginatedResponse } from "../../api-client";

export type { ApiResponse, PaginatedResponse };

export interface ApiErrorResponse {
  statusCode: number;
  code?: string;
  message?: string;
  data?: unknown;
  errors?: unknown;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  refreshExpiresIn?: number;
}

export type RequestConfig = AxiosRequestConfig & Record<string, unknown>;

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
}

export type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

export type TypedAxiosError = ApiErrorResponse;

export type RequestInterceptor = Parameters<
  import("axios").AxiosInstance["interceptors"]["request"]["use"]
>[0];
export type ResponseInterceptor = Parameters<
  import("axios").AxiosInstance["interceptors"]["response"]["use"]
>[0];
export type ErrorInterceptor = ResponseInterceptor;

export interface ApiClient {
  get: <T = unknown>(url: string, config?: RequestConfig) => Promise<T>;
  post: <T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
  ) => Promise<T>;
  put: <T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
  ) => Promise<T>;
  patch: <T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
  ) => Promise<T>;
  delete: <T = unknown>(url: string, config?: RequestConfig) => Promise<T>;
}

export interface HttpClientConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export const TOKEN_STORAGE_KEYS = {
  ACCESS_TOKEN: "kwikseller_access_token",
  REFRESH_TOKEN: "kwikseller_refresh_token",
  AUTH_STORE: "kwikseller_auth",
} as const;

export const DEFAULT_CONFIG = {
  baseURL: "/api/v1",
  timeout: 30000,
} as const;

