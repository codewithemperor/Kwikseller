"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore, UserRole } from "@kwikseller/utils";
import { Shield, AlertTriangle } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /**
   * Required role(s) to access the route
   * Defaults to ['ADMIN', 'SUPER_ADMIN'] for admin panel
   */
  requiredRole?: UserRole | UserRole[];
  /**
   * Required permission for admin routes
   */
  requiredPermission?: string;
  /**
   * Redirect path if not authenticated
   * @default "/login"
   */
  loginPath?: string;
  /**
   * Unauthorized component to show instead of redirecting
   */
  unauthorizedComponent?: React.ReactNode;
  /**
   * Show loading spinner while checking auth
   * @default true
   */
  showLoading?: boolean;
}

/**
 * AdminProtectedRoute - Guards routes that require admin authentication
 * 
 * Features:
 * - Checks if user is authenticated
 * - Checks if user has ADMIN or SUPER_ADMIN role
 * - Shows loading state while checking auth
 * - Redirects to login if not authenticated
 * - Shows access denied if wrong role
 */
export function AdminProtectedRoute({
  children,
  requiredRole = ["ADMIN", "SUPER_ADMIN"],
  requiredPermission,
  loginPath = "/login",
  unauthorizedComponent,
  showLoading = true,
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
      // User is authenticated but doesn't have admin role
      // Redirect to their appropriate dashboard based on role
      const roleRedirects: Record<UserRole, string> = {
        BUYER: "/",
        VENDOR: "/dashboard",
        ADMIN: "/admin",
        RIDER: "/deliveries",
        SUPER_ADMIN: "/admin",
      };
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
    hasRole,
    hasPermission,
    user,
  ]);

  // Loading state while checking auth
  if (!isInitialized) {
    if (!showLoading) return null;
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center animate-pulse">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="space-y-2 text-center">
            <p className="text-sm font-medium">Verifying access...</p>
            <p className="text-xs text-muted-foreground">Please wait</p>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated - show nothing (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // Check role - show access denied if wrong role
  if (requiredRole && !hasRole(requiredRole)) {
    return unauthorizedComponent ? (
      <>{unauthorizedComponent}</>
    ) : (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground">
              You don&apos;t have permission to access the admin panel.
            </p>
            <p className="text-sm text-muted-foreground">
              This area is restricted to administrators only.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Check permission - show access denied if missing permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return unauthorizedComponent ? (
      <>{unauthorizedComponent}</>
    ) : (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8 text-amber-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Permission Required</h1>
            <p className="text-muted-foreground">
              You don&apos;t have the required permissions to access this page.
            </p>
            <p className="text-sm text-muted-foreground">
              Contact a Super Admin for assistance.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Helper component to show role badge
 */
export function RoleBadge({ role }: { role: UserRole }) {
  const isSuperAdmin = role === "SUPER_ADMIN";
  
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
        isSuperAdmin
          ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
          : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
      }`}
    >
      {isSuperAdmin ? (
        <>
          <Shield className="w-3 h-3" />
          Super Admin
        </>
      ) : (
        <>
          <Shield className="w-3 h-3" />
          Admin
        </>
      )}
    </span>
  );
}
