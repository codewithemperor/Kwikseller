"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@kwikseller/utils";
import { Spinner } from "@heroui/react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /**
   * Required role(s) to access the route
   */
  requiredRole?: string | string[];
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
   * Loading component
   */
  loadingComponent?: React.ReactNode;
  /**
   * Unauthorized component
   */
  unauthorizedComponent?: React.ReactNode;
}

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
  loadingComponent,
  unauthorizedComponent,
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    isAuthenticated,
    isInitialized,
    isLoading,
    user,
    hasRole,
    hasPermission,
  } = useAuth();

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

  // Show loading state
  if (!isInitialized || isLoading) {
    return loadingComponent ? (
      <>{loadingComponent}</>
    ) : (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Check role
  if (requiredRole && !hasRole(requiredRole)) {
    return unauthorizedComponent ? (
      <>{unauthorizedComponent}</>
    ) : (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600 mt-2">
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600 mt-2">
            You don&apos;t have the required permissions.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
