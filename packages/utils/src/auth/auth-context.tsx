'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getFromStorage, setToStorage, removeFromStorage } from '../index';

// Types
export interface User {
  id: string;
  email: string;
  phone?: string;
  role: 'BUYER' | 'VENDOR' | 'ADMIN' | 'RIDER';
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'PENDING';
  emailVerified: boolean;
  profile?: {
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
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
  role: 'BUYER' | 'VENDOR' | 'RIDER';
  inviteToken?: string;
  vehicleType?: string;
  plateNumber?: string;
}

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<{ message: string; userId: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  getAccessToken: () => string | null;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string | string[]) => boolean;
}

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'kwikseller_access_token',
  REFRESH_TOKEN: 'kwikseller_refresh_token',
  USER: 'kwikseller_user',
};

// API base URL
const getApiUrl = (): string => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
};

// Create context
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Auth Provider Props
interface AuthProviderProps {
  children: ReactNode;
  /**
   * Redirect path after login (role-based)
   */
  redirectAfterLogin?: {
    BUYER?: string;
    VENDOR?: string;
    ADMIN?: string;
    RIDER?: string;
  };
  /**
   * Callback when user becomes unauthenticated
   */
  onUnauthenticated?: () => void;
}

// Auth Provider Component
export function AuthProvider({
  children,
  redirectAfterLogin = {
    BUYER: '/',
    VENDOR: '/dashboard',
    ADMIN: '/admin',
    RIDER: '/deliveries',
  },
  onUnauthenticated,
}: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize auth state from storage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = getFromStorage<User | null>(STORAGE_KEYS.USER, null);
        const accessToken = getFromStorage<string | null>(STORAGE_KEYS.ACCESS_TOKEN, null);
        
        if (storedUser && accessToken) {
          // Verify token is still valid
          try {
            const response = await fetch(`${getApiUrl()}/auth/me`, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            });
            
            if (response.ok) {
              const data = await response.json();
              setUser(data);
              setToStorage(STORAGE_KEYS.USER, data);
            } else {
              // Token invalid, try refresh
              await refreshSession();
            }
          } catch {
            // Network error, use stored user
            setUser(storedUser);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  // Login
  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${getApiUrl()}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      
      // Store tokens and user
      setToStorage(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
      setToStorage(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
      setToStorage(STORAGE_KEYS.USER, data.user);
      
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Register
  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${getApiUrl()}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      const result = await response.json();
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      const refreshToken = getFromStorage<string | null>(STORAGE_KEYS.REFRESH_TOKEN, null);
      
      if (refreshToken) {
        await fetch(`${getApiUrl()}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear storage and state
      removeFromStorage(STORAGE_KEYS.ACCESS_TOKEN);
      removeFromStorage(STORAGE_KEYS.REFRESH_TOKEN);
      removeFromStorage(STORAGE_KEYS.USER);
      setUser(null);
      onUnauthenticated?.();
    }
  }, [onUnauthenticated]);

  // Refresh session
  const refreshSession = useCallback(async () => {
    const refreshToken = getFromStorage<string | null>(STORAGE_KEYS.REFRESH_TOKEN, null);
    
    if (!refreshToken) {
      logout();
      return;
    }

    try {
      const response = await fetch(`${getApiUrl()}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        logout();
        return;
      }

      const data = await response.json();
      
      setToStorage(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
      setToStorage(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
    }
  }, [logout]);

  // Update user
  const updateUser = useCallback((userData: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...userData };
      setToStorage(STORAGE_KEYS.USER, updated);
      return updated;
    });
  }, []);

  // Get access token
  const getAccessToken = useCallback(() => {
    return getFromStorage<string | null>(STORAGE_KEYS.ACCESS_TOKEN, null);
  }, []);

  // Check permission
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'ADMIN') {
      // Admin with no permissions record = Super Admin (all permissions)
      if (!user.permissions || user.permissions.length === 0) return true;
      return user.permissions.includes(permission) || user.permissions.includes('*');
    }
    return false;
  }, [user]);

  // Check role
  const hasRole = useCallback((role: string | string[]): boolean => {
    if (!user) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  }, [user]);

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isInitialized,
    login,
    register,
    logout,
    refreshSession,
    updateUser,
    getAccessToken,
    hasPermission,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// useAuth hook
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Export context for advanced usage
export { AuthContext };
