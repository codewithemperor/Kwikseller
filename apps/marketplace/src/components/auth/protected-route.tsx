"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore, UserRole } from "@kwikseller/utils";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /**
   * Required role(s) to access the route
   */
  requiredRole?: UserRole | UserRole[];
  /**
   * Required permission for admin routes
   */
  requiredPermission?: string;
  /**
   * Redirect path if not authenticated
   */
  loginPath?: string;
  /**
   * Custom redirect paths per role
   */
  roleRedirects?: {
    BUYER?: string;
    VENDOR?: string;
    ADMIN?: string;
    RIDER?: string;
  };
  /**
   * Unauthorized component to show instead of redirecting
   */
  unauthorizedComponent?: React.ReactNode;
}

/**
 * ProtectedRoute - Guards routes that require authentication
 *
 * Note: No loading spinner - the check happens in background
 * Unauthenticated users are redirected to login
 */
export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  loginPath = "/login",
  roleRedirects = {
    BUYER: "/",
    VENDOR: "/dashboard",
    ADMIN: "/admin",
    RIDER: "/deliveries",
  },
  unauthorizedComponent,
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  const user = useAuthStore((state) => state.user);
  const tokens = useAuthStore((state) => state.tokens);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const hasRole = useAuthStore((state) => state.hasRole);
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const isAuthenticated = !!user && !!tokens?.accessToken;

  useEffect(() => {
    if (!isInitialized) return;

    if (!isAuthenticated) {
      // Save intended destination
      const returnUrl = encodeURIComponent(pathname);
      router.push(`${loginPath}?redirect=${returnUrl}`);
      return;
    }

    // Check role requirement
    if (requiredRole && !hasRole(requiredRole)) {
      // Redirect to their appropriate dashboard
      const redirectPath = user ? roleRedirects[user.role] : "/";
      router.push(redirectPath || "/");
      return;
    }

    // Check permission requirement (for admin routes)
    if (requiredPermission && !hasPermission(requiredPermission)) {
      router.push("/admin/unauthorized");
      return;
    }
  }, [
    isInitialized,
    isAuthenticated,
    requiredRole,
    requiredPermission,
    router,
    pathname,
    loginPath,
    roleRedirects,
    hasRole,
    hasPermission,
    user,
  ]);

  // Not initialized or not authenticated - show nothing
  if (!isInitialized || !isAuthenticated) {
    return null;
  }

  // Check role
  if (requiredRole && !hasRole(requiredRole)) {
    return unauthorizedComponent ? (
      <>{unauthorizedComponent}</>
    ) : (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground mt-2">
            You don&apos;t have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  // Check permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return unauthorizedComponent ? (
      <>{unauthorizedComponent}</>
    ) : (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground mt-2">
            You don&apos;t have the required permissions.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
