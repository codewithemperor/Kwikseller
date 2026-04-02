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

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ==================== Types ====================

export type UserRole = 'BUYER' | 'VENDOR' | 'ADMIN' | 'RIDER';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'PENDING';

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
  vehicleType?: string;
  plateNumber?: string;
}

// ==================== Storage ====================

const AUTH_STORAGE_KEY = 'kwikseller_auth';

// ==================== Store State ====================

interface AuthStoreState {
  user: UserStore | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isInitialized: boolean;
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
      
      // Setters
      setUser: (user) => set({ user }),
      setTokens: (tokens) => set({ tokens }),
      setLoading: (isLoading) => set({ isLoading }),
      setInitialized: (isInitialized) => set({ isInitialized }),
      
      // Auth actions
      login: (user, tokens) => set({ 
        user, 
        tokens, 
        isLoading: false,
        isInitialized: true,
      }),
      
      logout: () => set({ 
        user: null, 
        tokens: null, 
        isLoading: false,
      }),
      
      updateUser: (userData) => set((state) => ({
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
        
        // Admin with no permissions = Super Admin (all permissions)
        if (user.role === 'ADMIN') {
          if (!user.permissions || user.permissions.length === 0) return true;
          return user.permissions.includes(permission) || user.permissions.includes('*');
        }
        
        return false;
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
      }),
      onRehydrateStorage: () => (state) => {
        // Mark as initialized after rehydration
        if (state) {
          state.isInitialized = true;
        }
      },
    }
  )
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
export const useAccessToken = () => useAuthStore((state) => state.getAccessToken)();

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
export const useAuthInitialized = () => useAuthStore((state) => state.isInitialized);
