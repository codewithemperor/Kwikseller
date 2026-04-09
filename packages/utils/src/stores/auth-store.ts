/**
 * KWIKSELLER - Auth Store
 *
 * Client-side session management using Zustand with persistence.
 * This replaces the need for server-side sessions - tokens are stored
 * in localStorage and managed via this store.
 *
 * Usage:
 * ```tsx
 * import { useAuthStore } from '@kwikseller/utils';
 *
 * const { user, tokens, login, logout } = useAuthStore();
 * ```
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ==================== Types ====================

export type UserRole = "BUYER" | "VENDOR" | "ADMIN" | "RIDER" | "SUPER_ADMIN";
export type UserStatus = "ACTIVE" | "SUSPENDED" | "BANNED" | "PENDING";
export type VerificationStatus =
  | "NOT_SUBMITTED"
  | "PENDING_REVIEW"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED";
export type OnboardingStep =
  | "NOT_STARTED"
  | "PROFILE_SETUP"
  | "DOCUMENT_UPLOAD"
  | "BANK_DETAILS"
  | "VEHICLE_INFO"
  | "COMPLETED";

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

export interface UserStore {
  id: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  profile?: UserProfile;
  store?: {
    id: string;
    name: string;
    slug: string;
    isVerified: boolean;
    onboardingComplete: boolean;
    verificationStatus?: VerificationStatus;
    onboardingStep?: OnboardingStep;
  };
  rider?: {
    id: string;
    isAvailable: boolean;
    onboardingComplete: boolean;
    verificationStatus?: VerificationStatus;
    onboardingStep?: OnboardingStep;
  };
  subscription?: {
    plan: string;
    status: string;
    productLimit: number;
  };
  permissions?: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
  role: UserRole;
  deviceId?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: UserRole;
  inviteToken?: string;
  storeName?: string;
  storeCategory?: string;
}

// ==================== Storage ====================

const AUTH_STORAGE_KEY = "kwikseller_auth";

// ==================== Store State ====================

interface AuthStoreState {
  user: UserStore | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isInitialized: boolean;
  // NOT persisted - only in memory for password reset flow
  pendingResetEmail: string | null;
}

interface AuthStoreActions {
  setUser: (user: UserStore | null) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  login: (user: UserStore, tokens: AuthTokens) => void;
  logout: () => void;
  updateUser: (userData: Partial<UserStore>) => void;
  updateTokens: (tokens: AuthTokens) => void;
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
  // Password reset email methods (memory only)
  setPendingResetEmail: (email: string) => void;
  getPendingResetEmail: () => string | null;
  clearPendingResetEmail: () => void;
}

export type AuthState = AuthStoreState & AuthStoreActions;

// ==================== Store ====================

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      tokens: null,
      isLoading: false,
      isInitialized: false,
      pendingResetEmail: null,

      // Setters
      setUser: (user) => set({ user }),
      setTokens: (tokens) => set({ tokens }),
      setLoading: (isLoading) => set({ isLoading }),
      setInitialized: (isInitialized) => set({ isInitialized }),

      // Auth actions
      login: (user, tokens) =>
        set({
          user,
          tokens,
          isLoading: false,
          isInitialized: true,
        }),

      logout: () =>
        set({
          user: null,
          tokens: null,
          isLoading: false,
          pendingResetEmail: null, // Clear reset email on logout
        }),

      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),

      updateTokens: (tokens) => set({ tokens }),

      // Getters
      getAccessToken: () => get().tokens?.accessToken ?? null,
      getRefreshToken: () => get().tokens?.refreshToken ?? null,

      hasRole: (role) => {
        const user = get().user;
        if (!user) return false;
        const roles = Array.isArray(role) ? role : [role];
        return roles.includes(user.role);
      },

      hasPermission: (permission) => {
        const user = get().user;
        if (!user) return false;

        // SUPER_ADMIN has all permissions
        if (user.role === "SUPER_ADMIN") return true;

        // Admin with no permissions array = full access (legacy support)
        if (user.role === "ADMIN") {
          if (!user.permissions || user.permissions.length === 0) return true;
          return (
            user.permissions.includes(permission) ||
            user.permissions.includes("*")
          );
        }

        return false;
      },

      // Password reset email methods (memory only - NOT persisted)
      setPendingResetEmail: (email) => set({ pendingResetEmail: email }),
      getPendingResetEmail: () => get().pendingResetEmail,
      clearPendingResetEmail: () => set({ pendingResetEmail: null }),
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        // NOTE: pendingResetEmail is NOT included here - it stays in memory only!
      }),
      onRehydrateStorage: () => (state) => {
        // Mark as initialized after rehydration
        if (state) {
          state.isInitialized = true;
        }
      },
    },
  ),
);

// ==================== Convenience Hooks ====================

/**
 * Get user and authentication status
 */
export const useUser = () => {
  const user = useAuthStore((state) => state.user);
  const tokens = useAuthStore((state) => state.tokens);
  return { user, isAuthenticated: !!user && !!tokens?.accessToken };
};

/**
 * Get access token (for API calls)
 */
export const useAccessToken = () =>
  useAuthStore((state) => state.getAccessToken)();

/**
 * Check if user has specific role
 */
export const useHasRole = (role: UserRole | UserRole[]) =>
  useAuthStore((state) => state.hasRole)(role);

/**
 * Check if user has specific permission
 */
export const useHasPermission = (permission: string) =>
  useAuthStore((state) => state.hasPermission)(permission);

/**
 * Auth loading state
 */
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);

/**
 * Auth initialized state
 */
export const useAuthInitialized = () =>
  useAuthStore((state) => state.isInitialized);

// ==================== Onboarding & Verification Hooks ====================

/**
 * Check if vendor needs onboarding
 */
export const useVendorNeedsOnboarding = () => {
  return false;
};

/**
 * Check if rider needs onboarding
 */
export const useRiderNeedsOnboarding = () => {
  return false;
};

/**
 * Get vendor verification status
 */
export const useVendorVerificationStatus = (): VerificationStatus | null => {
  const user = useAuthStore((state) => state.user);
  if (!user || user.role !== "VENDOR") return null;
  return user.store?.verificationStatus ?? "NOT_SUBMITTED";
};

/**
 * Get rider verification status
 */
export const useRiderVerificationStatus = (): VerificationStatus | null => {
  const user = useAuthStore((state) => state.user);
  if (!user || user.role !== "RIDER") return null;
  return user.rider?.verificationStatus ?? "NOT_SUBMITTED";
};

/**
 * Check if user is verified (approved after onboarding)
 */
export const useIsUserVerified = () => {
  const user = useAuthStore((state) => state.user);
  if (!user) return false;

  if (user.role === "VENDOR") {
    return user.store?.verificationStatus === "APPROVED";
  }

  if (user.role === "RIDER") {
    return user.rider?.verificationStatus === "APPROVED";
  }

  // BUYER, ADMIN, SUPER_ADMIN are always "verified"
  return true;
};

/**
 * Get user's onboarding step
 */
export const useOnboardingStep = (): OnboardingStep | null => {
  const user = useAuthStore((state) => state.user);
  if (!user) return null;

  if (user.role === "VENDOR") {
    return user.store?.onboardingStep ?? "NOT_STARTED";
  }

  if (user.role === "RIDER") {
    return user.rider?.onboardingStep ?? "NOT_STARTED";
  }

  return null;
};

/**
 * Check if user is SUPER_ADMIN
 */
export const useIsSuperAdmin = () => {
  const user = useAuthStore((state) => state.user);
  return user?.role === "SUPER_ADMIN";
};

/**
 * Hook to access pending reset email
 */
export const usePendingResetEmail = () => {
  const pendingResetEmail = useAuthStore((state) => state.pendingResetEmail);
  const setPendingResetEmail = useAuthStore(
    (state) => state.setPendingResetEmail,
  );
  const clearPendingResetEmail = useAuthStore(
    (state) => state.clearPendingResetEmail,
  );

  return {
    pendingResetEmail,
    setPendingResetEmail,
    clearPendingResetEmail,
  };
};
