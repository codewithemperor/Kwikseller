// KWIKSELLER - HTTP Client
// Shared axios instance with automatic token handling and refresh

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import {
  TOKEN_STORAGE_KEYS,
  type ApiResponse,
  type ApiErrorResponse,
  type RefreshTokenResponse,
  type RequestConfig,
  type ApiClient,
  type TypedAxiosError,
  DEFAULT_CONFIG,
} from "./types";

// ─── Base URL ─────────────────────────────────────────────────────────────────

function getBaseURL(): string {
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return "/api/v1";
}

// ─── Token helpers ────────────────────────────────────────────────────────────

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  localStorage.setItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN);
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

// ─── API Error class ──────────────────────────────────────────────────────────

/**
 * Typed error thrown by the api client for all non-2xx responses.
 *
 * Preserves every field the server sends so callers (e.g. auth context)
 * can branch on `code` without digging into axios internals.
 *
 * Example 403 body from server:
 *   { success: false, code: "EMAIL_NOT_VERIFIED", message: "...", statusCode: 403 }
 *
 * Callers catch this and read:
 *   err.statusCode   // 403
 *   err.code         // "EMAIL_NOT_VERIFIED"
 *   err.message      // human-readable string
 *   err.data         // any extra payload (e.g. { user: { email } })
 */
export class ApiError extends Error {
  statusCode: number;
  code?: string;
  data?: unknown;
  originalResponse?: ApiErrorResponse;

  constructor(response: ApiErrorResponse, statusCode: number) {
    super(response.message || "An unexpected error occurred");
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = (response as ApiErrorResponse & { code?: string }).code;
    this.data = (response as ApiErrorResponse & { data?: unknown }).data;
    this.originalResponse = response;
  }
}

// ─── Redirect helper ──────────────────────────────────────────────────────────

function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  clearTokens();
  const currentPath = window.location.pathname;
  window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
}

// ─── Token refresh queue ──────────────────────────────────────────────────────

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

function processQueue(error: Error | null, token: string | null = null): void {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else if (token) prom.resolve(token);
  });
  failedQueue = [];
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await axios.post<ApiResponse<RefreshTokenResponse>>(
      `${getBaseURL()}/auth/refresh`,
      { refreshToken },
      { headers: { "Content-Type": "application/json" } },
    );
    const { accessToken, refreshToken: newRefreshToken } = response.data.data;
    setTokens(accessToken, newRefreshToken);
    return accessToken;
  } catch {
    return null;
  }
}

// ─── Axios instance ───────────────────────────────────────────────────────────

function createAxiosInstance(): AxiosInstance {
  const instance = axios.create({
    baseURL: getBaseURL(),
    timeout: DEFAULT_CONFIG.timeout,
    withCredentials: DEFAULT_CONFIG.withCredentials,
    headers: DEFAULT_CONFIG.headers,
  });

  // Request: attach bearer token
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  // Response: handle 401 refresh + normalize errors
  instance.interceptors.response.use(
    (response) => response,
    async (error: TypedAxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };
      const isAuthEndpoint = originalRequest?.url?.includes("/auth/");

      // ── 401 → attempt token refresh ────────────────────────────────────────
      if (
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest._retry &&
        !isAuthEndpoint
      ) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return instance(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const newToken = await refreshAccessToken();
          if (newToken) {
            processQueue(null, newToken);
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return instance(originalRequest);
          } else {
            processQueue(new Error("Token refresh failed"), null);
            redirectToLogin();
            return Promise.reject(error);
          }
        } catch (refreshError) {
          processQueue(refreshError as Error, null);
          redirectToLogin();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // ── All other errors → throw ApiError ──────────────────────────────────
      //
      // We throw ApiError (not a plain Error) so callers can read:
      //   err.statusCode, err.code, err.message, err.data
      //
      // This is critical for auth flows — e.g. a 403 with code
      // "EMAIL_NOT_VERIFIED" must reach the auth context intact.
      const serverBody = error.response?.data as
        | (ApiErrorResponse & {
            code?: string;
            data?: unknown;
          })
        | undefined;

      throw new ApiError(
        {
          success: false,
          message:
            serverBody?.message ||
            error.message ||
            "An unexpected error occurred",
          error: serverBody?.error,
          statusCode: error.response?.status || 500,
          // Pass code + data through so callers can read them off ApiError
          ...(serverBody?.code ? { code: serverBody.code } : {}),
          ...(serverBody?.data !== undefined ? { data: serverBody.data } : {}),
        } as ApiErrorResponse,
        error.response?.status || 500,
      );
    },
  );

  return instance;
}

export const httpClient: AxiosInstance = createAxiosInstance();

// ─── Typed api client ─────────────────────────────────────────────────────────
//
// Each method unwraps response.data.data — the server envelope's inner payload.
// So callers receive the flat object directly, e.g. { accessToken, user, ... }.

export const api: ApiClient = {
  async get<T = unknown>(url: string, config?: RequestConfig): Promise<T> {
    const response = await httpClient.get<ApiResponse<T>>(
      url,
      config as AxiosRequestConfig,
    );
    return response.data.data;
  },

  async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
  ): Promise<T> {
    const response = await httpClient.post<ApiResponse<T>>(
      url,
      data,
      config as AxiosRequestConfig,
    );
    return response.data.data;
  },

  async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
  ): Promise<T> {
    const response = await httpClient.put<ApiResponse<T>>(
      url,
      data,
      config as AxiosRequestConfig,
    );
    return response.data.data;
  },

  async patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
  ): Promise<T> {
    const response = await httpClient.patch<ApiResponse<T>>(
      url,
      data,
      config as AxiosRequestConfig,
    );
    return response.data.data;
  },

  async delete<T = unknown>(url: string, config?: RequestConfig): Promise<T> {
    const response = await httpClient.delete<ApiResponse<T>>(
      url,
      config as AxiosRequestConfig,
    );
    return response.data.data;
  },
};

// ─── Meta helpers ─────────────────────────────────────────────────────────────

export async function getWithMeta<T>(
  url: string,
  config?: RequestConfig,
): Promise<ApiResponse<T>> {
  const response = await httpClient.get<ApiResponse<T>>(
    url,
    config as AxiosRequestConfig,
  );
  return response.data;
}

export async function getPaginated<T>(
  url: string,
  page = 1,
  limit = 20,
  config?: RequestConfig,
): Promise<ApiResponse<T[]>> {
  const params = { ...config?.params, page, limit };
  return getWithMeta<T[]>(url, { ...config, params });
}

export default httpClient;
