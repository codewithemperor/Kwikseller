"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  useAuthStore,
  UserStore,
  type LoginCredentials,
  type RegisterData,
} from "../stores/auth-store";
import {
  api,
  ApiError,
  setTokens as setHttpTokens,
  clearTokens as clearHttpTokens,
} from "../http";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  phone?: string;
  role: "BUYER" | "VENDOR" | "ADMIN" | "RIDER";
  status: "ACTIVE" | "SUSPENDED" | "BANNED" | "PENDING";
  emailVerified: boolean;
  profile?: {
    firstName?: string;
    lastName?: string;
    avatarUrl?: string | null;
  };
  store?: {
    id: string;
    name: string;
    slug: string;
    isVerified: boolean;
    onboardingComplete: boolean;
  };
  subscription?: {
    plan: string;
    status: string;
    productLimit: number;
  };
  permissions?: string[];
}

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

/**
 * What api.post() actually returns after double-unwrapping:
 *   Server:      { success, data: { accessToken, refreshToken, user, ... } }
 *   axios:       response.data  → { success, data: { accessToken, ... } }
 *   api.post():  .data.data     → { accessToken, refreshToken, user, ... }  ← flat
 */
export type AuthApiResponse = TokenData & { user: User };

export interface LoginResponse {
  success: boolean;
  data?: AuthApiResponse;
  error?: string;
  code?: string;
  message?: string;
  requiresOTP?: boolean;
  email?: string;
}

export interface OTPResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: AuthApiResponse;
  /** True when a session was stored in Zustand — callers should redirect. */
  sessionCreated?: boolean;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface AuthContextValue {
  user: UserStore | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;
  register: (
    data: RegisterData,
  ) => Promise<{ message: string; userId: string; email?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateUser: (user: Partial<UserStore>) => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string | string[]) => boolean;
  verifyOTP: (email: string, otp: string) => Promise<OTPResponse>;
  resendOTP: (email: string) => Promise<OTPResponse>;
  forgotPassword: (email: string) => Promise<ForgotPasswordResponse>;
  resetPassword: (data: { email: string; otp: string; newPassword: string }) => Promise<ResetPasswordResponse>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  onUnauthenticated?: () => void;
}

function toStoreUser(user: User): UserStore {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    emailVerified: user.emailVerified,
    profile: user.profile
      ? {
          ...user.profile,
          avatarUrl: user.profile.avatarUrl ?? undefined,
        }
      : undefined,
    store: user.store,
    subscription: user.subscription,
    permissions: user.permissions,
  };
}

/**
 * Safely extract session data from the flat api response.
 * Returns null if tokens or user are missing.
 */
function extractSession(
  res: unknown,
): { user: User; tokens: TokenData } | null {
  const r = res as Partial<AuthApiResponse>;
  if (!r?.accessToken || !r?.user) return null;
  return {
    user: r.user,
    tokens: {
      accessToken: r.accessToken,
      refreshToken: r.refreshToken ?? "",
      expiresIn: r.expiresIn ?? 0,
      refreshExpiresIn: r.refreshExpiresIn ?? 0,
    },
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({
  children,
  onUnauthenticated,
}: AuthProviderProps) {
  const {
    user,
    tokens,
    isLoading,
    isInitialized,
    login: storeLogin,
    logout: storeLogout,
    updateUser: storeUpdateUser,
    setLoading,
    setInitialized,
    hasRole,
    hasPermission,
  } = useAuthStore();

  useEffect(() => {
    const timer = setTimeout(() => setInitialized(true), 0);
    return () => clearTimeout(timer);
  }, [setInitialized]);

  const storeSession = useCallback(
    (user: User, tokenData: TokenData) => {
      setHttpTokens(tokenData.accessToken, tokenData.refreshToken);
      storeLogin(toStoreUser(user), tokenData);
    },
    [storeLogin],
  );

  const clearSession = useCallback(() => {
    clearHttpTokens();
    storeLogout();
  }, [storeLogout]);

  // ── Login ──────────────────────────────────────────────────────────────────

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<LoginResponse> => {
      setLoading(true);
      try {
        const userAgent =
          typeof window !== "undefined" ? navigator.userAgent : "Unknown";

        // Returns flat: { accessToken, refreshToken, expiresIn, refreshExpiresIn, user }
        const res = await api.post<AuthApiResponse>(
          "/auth/login",
          credentials,
          {
            headers: { "user-agent": userAgent },
            skipAuthRefresh: true,
          } as Record<string, unknown>,
        );

        const session = extractSession(res);
        if (session) {
          storeSession(session.user, session.tokens);
          // setLoading is reset by storeLogin inside useAuthStore
          return { success: true, data: res };
        }

        setLoading(false);
        return {
          success: false,
          error: "Login failed — no session data returned",
        };
      } catch (err) {
        setLoading(false);

        // ApiError is thrown by our http client for all non-2xx responses.
        // It preserves statusCode, code, and message from the server body.
        if (err instanceof ApiError) {
          if (err.statusCode === 403 && err.code === "EMAIL_NOT_VERIFIED") {
            const payload = err.data as
              | { user?: { email?: string } }
              | undefined;
            return {
              success: false,
              code: "EMAIL_NOT_VERIFIED",
              requiresOTP: true,
              message: err.message,
              email: payload?.user?.email || credentials.email,
            };
          }
          return { success: false, error: err.message };
        }

        // Fallback for unexpected errors
        const msg = (err as { message?: string })?.message ?? "Login failed";
        return { success: false, error: msg };
      }
    },
    [storeSession, setLoading],
  );

  // ── Register ───────────────────────────────────────────────────────────────

  const register = useCallback(
    async (data: RegisterData) => {
      setLoading(true);
      try {
        const result = await api.post<{
          message: string;
          userId: string;
          email?: string;
        }>("/auth/register", data, {
          skipAuthRefresh: true,
        } as Record<string, unknown>);
        setLoading(false);
        return result;
      } catch (err) {
        setLoading(false);
        const msg =
          err instanceof ApiError
            ? err.message
            : ((err as { message?: string })?.message ?? "Registration failed");
        throw new Error(msg);
      }
    },
    [setLoading],
  );

  // ── Logout ─────────────────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    try {
      if (tokens?.refreshToken && tokens?.accessToken) {
        await api.post("/auth/logout", { refreshToken: tokens.refreshToken });
      }
    } catch {
      // Ignore — clear session regardless
    } finally {
      clearSession();
      onUnauthenticated?.();
    }
  }, [tokens, clearSession, onUnauthenticated]);

  // ── Refresh session ────────────────────────────────────────────────────────

  const refreshSession = useCallback(async () => {
    if (!tokens?.refreshToken) {
      clearSession();
      return;
    }
    try {
      const res = await api.post<AuthApiResponse>("/auth/refresh", {
        refreshToken: tokens.refreshToken,
      });
      const session = extractSession(res);
      if (session) {
        storeSession(session.user, session.tokens);
      } else {
        clearSession();
      }
    } catch {
      clearSession();
    }
  }, [tokens, clearSession, storeSession]);

  // ── Update user ────────────────────────────────────────────────────────────

  const updateUser = useCallback(
    (userData: Partial<UserStore>) => storeUpdateUser(userData),
    [storeUpdateUser],
  );

  // ── Verify OTP ─────────────────────────────────────────────────────────────
  //
  // Returns the same flat shape as login.
  // extractSession() handles it identically.

  const verifyOTP = useCallback(
    async (email: string, otp: string): Promise<OTPResponse> => {
      setLoading(true);
      try {
        const res = await api.post<AuthApiResponse>("/auth/verify-email", {
          email,
          otp,
        });

        const session = extractSession(res);
        let sessionCreated = false;

        if (session) {
          storeSession(session.user, session.tokens);
          sessionCreated = true;
        }

        setLoading(false);
        return {
          success: true,
          message: "Email verified successfully",
          data: res,
          sessionCreated,
        };
      } catch (err) {
        setLoading(false);
        const msg =
          err instanceof ApiError
            ? err.message
            : ((err as { message?: string })?.message ?? "Verification failed");
        return { success: false, error: msg };
      }
    },
    [storeSession, setLoading],
  );

  // ── Resend OTP ─────────────────────────────────────────────────────────────

  const resendOTP = useCallback(
    async (email: string): Promise<OTPResponse> => {
      setLoading(true);
      try {
        const res = await api.post<{ message?: string }>(
          "/auth/resend-verification",
          { email },
        );
        setLoading(false);
        return {
          success: true,
          message: res?.message || "Verification code sent",
        };
      } catch (err) {
        setLoading(false);
        const msg =
          err instanceof ApiError
            ? err.message
            : ((err as { message?: string })?.message ??
              "Failed to resend code");
        return { success: false, error: msg };
      }
    },
    [setLoading],
  );

  // ── Forgot Password ───────────────────────────────────────────────────────

  const forgotPassword = useCallback(
    async (email: string): Promise<ForgotPasswordResponse> => {
      setLoading(true);
      try {
        await api.post<{ message?: string }>(
          "/auth/forgot-password",
          { email },
          { skipAuthRefresh: true } as Record<string, unknown>,
        );
        setLoading(false);
        return {
          success: true,
          message: "Verification code sent to your email",
        };
      } catch (err) {
        setLoading(false);
        const msg =
          err instanceof ApiError
            ? err.message
            : ((err as { message?: string })?.message ??
              "Failed to send verification code");
        return { success: false, error: msg };
      }
    },
    [setLoading],
  );

  // ── Reset Password ────────────────────────────────────────────────────────

  const resetPassword = useCallback(
    async (data: {
      email: string;
      otp: string;
      newPassword: string;
    }): Promise<ResetPasswordResponse> => {
      setLoading(true);
      try {
        await api.post<{ message?: string }>(
          "/auth/reset-password",
          data,
          { skipAuthRefresh: true } as Record<string, unknown>,
        );
        setLoading(false);
        return {
          success: true,
          message: "Password reset successfully",
        };
      } catch (err) {
        setLoading(false);
        const msg =
          err instanceof ApiError
            ? err.message
            : ((err as { message?: string })?.message ??
              "Failed to reset password");
        return { success: false, error: msg };
      }
    },
    [setLoading],
  );

  // ── Context value ──────────────────────────────────────────────────────────

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user && !!tokens?.accessToken,
    isLoading,
    isInitialized,
    login,
    register,
    logout,
    refreshSession,
    updateUser,
    hasPermission,
    hasRole: (role) => hasRole(role as Parameters<typeof hasRole>[0]),
    verifyOTP,
    resendOTP,
    forgotPassword,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export { AuthContext };
