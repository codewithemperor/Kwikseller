/**
 * HTTP client adapter (DEPRECATED — thin shim over @kwikseller/api-client).
 *
 * WHY THIS EXISTS
 * ──────────────
 * Historically `@kwikseller/utils` shipped its OWN axios instance with its own
 * refresh-token queue. Running it alongside `@kwikseller/api-client` meant TWO
 * axios instances shared the same localStorage tokens — on a 401 both could fire
 * `POST /auth/refresh` concurrently, and since refresh tokens are single-use the
 * second call failed and logged the user out.
 *
 * This module now delegates EVERYTHING to the single canonical client in
 * `@kwikseller/api-client`:
 *   - same axios instance  → single 401 refresh queue
 *   - same tokenManager    → single token store
 *
 * The only thing kept here is the RESPONSE SHAPE (`api.post<T>()` returns the
 * flat `T`, i.e. the inner `data` field) and the `ApiError` class, because the
 * AuthProvider (`auth-context.tsx`) depends on both. New code should import
 * directly from `@kwikseller/api-client`.
 */
import axios, { type AxiosError, type AxiosRequestConfig } from "axios";
import {
  api as canonicalApi,
  tokenManager,
  type ApiResponse,
} from "@kwikseller/api-client";

// ─── ApiError class (for `instanceof` checks in auth-context) ────────────────

export interface ApiErrorResponse {
  statusCode: number;
  code?: string;
  message?: string;
  data?: unknown;
  errors?: unknown;
}

export class ApiError extends Error implements ApiErrorResponse {
  statusCode: number;
  code?: string;
  data?: unknown;
  errors?: unknown;

  constructor(
    message: string,
    statusCode: number,
    code?: string,
    data?: unknown,
    errors?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.data = data;
    this.errors = errors;
  }
}

function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const ae = error as AxiosError<ApiErrorResponse>;
    const body = ae.response?.data;
    const message =
      body?.message || ae.message || "An error occurred";
    return new ApiError(
      message,
      ae.response?.status ?? 0,
      body?.code,
      body?.data,
      body?.errors,
    );
  }
  if (error instanceof Error) {
    return new ApiError(error.message, 0);
  }
  return new ApiError("An unknown error occurred", 0);
}

// ─── Flat-response api wrapper (delegates to canonical apiClient) ────────────

type AnyConfig = AxiosRequestConfig & Record<string, unknown>;

/** Unwrap ApiResponse<T> → T (flat). Falls back to the whole body if no data. */
function unwrap<T>(res: ApiResponse<T>): T {
  return (res as unknown as { data?: T }).data ?? (res as unknown as T);
}

export const api = {
  get: async <T = unknown>(url: string, config?: AnyConfig): Promise<T> => {
    try {
      const res = await canonicalApi.get<T>(url, config);
      return unwrap<T>(res);
    } catch (e) {
      throw toApiError(e);
    }
  },
  post: async <T = unknown>(
    url: string,
    data?: unknown,
    config?: AnyConfig,
  ): Promise<T> => {
    try {
      const res = await canonicalApi.post<T>(url, data, config);
      return unwrap<T>(res);
    } catch (e) {
      throw toApiError(e);
    }
  },
  put: async <T = unknown>(
    url: string,
    data?: unknown,
    config?: AnyConfig,
  ): Promise<T> => {
    try {
      const res = await canonicalApi.put<T>(url, data, config);
      return unwrap<T>(res);
    } catch (e) {
      throw toApiError(e);
    }
  },
  patch: async <T = unknown>(
    url: string,
    data?: unknown,
    config?: AnyConfig,
  ): Promise<T> => {
    try {
      const res = await canonicalApi.patch<T>(url, data, config);
      return unwrap<T>(res);
    } catch (e) {
      throw toApiError(e);
    }
  },
  delete: async <T = unknown>(url: string, config?: AnyConfig): Promise<T> => {
    try {
      const res = await canonicalApi.delete<T>(url, config);
      return unwrap<T>(res);
    } catch (e) {
      throw toApiError(e);
    }
  },
};

// ─── Token management (delegated to canonical tokenManager) ──────────────────

export const TOKEN_STORAGE_KEYS = {
  ACCESS_TOKEN: "kwikseller_access_token",
  REFRESH_TOKEN: "kwikseller_refresh_token",
  AUTH_STORE: "kwikseller_auth",
} as const;

export const setTokens = tokenManager.setTokens.bind(tokenManager);
export const clearTokens = tokenManager.clearTokens.bind(tokenManager);
export const getAccessToken = tokenManager.getAccessToken.bind(tokenManager);
export const getRefreshToken = tokenManager.getRefreshToken.bind(tokenManager);
export const isAuthenticated = tokenManager.isAuthenticated.bind(tokenManager);

// ─── Convenience helpers (kept for backward compat) ─────────────────────────

export const httpClient = api;

export async function getWithMeta<T = unknown>(
  url: string,
  config?: AnyConfig,
): Promise<{ data: T; meta?: ApiResponse<T>["meta"] }> {
  try {
    const res = await canonicalApi.get<T>(url, config);
    return { data: unwrap<T>(res), meta: res.meta };
  } catch (e) {
    throw toApiError(e);
  }
}

export async function getPaginated<T = unknown>(
  url: string,
  config?: AnyConfig,
): Promise<{ data: T[]; meta?: ApiResponse<T[]>["meta"] }> {
  try {
    const res = await canonicalApi.get<T[]>(url, config);
    return { data: unwrap<T[]>(res), meta: res.meta };
  } catch (e) {
    throw toApiError(e);
  }
}

export const DEFAULT_CONFIG = {
  baseURL: "/api/v1",
  timeout: 30000,
} as const;

export default api;
