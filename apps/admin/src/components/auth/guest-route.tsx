"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore, UserRole } from "@kwikseller/utils";

interface AdminGuestRouteProps {
  children: React.ReactNode;
  /**
   * Where to redirect authenticated admin users
   * @default "/admin"
   */
  redirectPath?: string;
  /**
   * Show loading spinner while checking auth
   * @default true
   */
  showLoading?: boolean;
}

/**
 * AdminGuestRoute - For auth pages that should only be visible to unauthenticated users
 * 
 * Features:
 * - Redirects authenticated admin users to /admin
 * - Redirects authenticated non-admin users to their appropriate dashboard
 * - Shows loading state while checking auth
 * 
 * Use this for: Login page
 */
export function AdminGuestRoute({
  children,
  redirectPath = "/admin",
  showLoading = true,
}: AdminGuestRouteProps) {
  const router = useRouter();
  const pathname = usePathname();

  const user = useAuthStore((state) => state.user);
  const tokens = useAuthStore((state) => state.tokens);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const hasRole = useAuthStore((state) => state.hasRole);

  const isAuthenticated = !!user && !!tokens?.accessToken;

  useEffect(() => {
    if (!isInitialized) return;

    if (isAuthenticated) {
      // Check if there's a redirect query param
      const urlParams = new URLSearchParams(window.location.search);
      const redirectTo = urlParams.get("redirect");

      // If user is admin/super_admin, redirect to admin panel
      if (hasRole(["ADMIN", "SUPER_ADMIN"])) {
        router.push(redirectTo || redirectPath);
        return;
      }

      // For non-admin users, redirect to their appropriate dashboard
      const roleRedirects: Record<UserRole, string> = {
        BUYER: "/",
        VENDOR: "/dashboard",
        ADMIN: "/admin",
        RIDER: "/deliveries",
        SUPER_ADMIN: "/admin",
      };
      
      const userRedirect = user ? roleRedirects[user.role] : "/";
      router.push(userRedirect || "/");
    }
  }, [isInitialized, isAuthenticated, router, redirectPath, pathname, hasRole, user]);

  // Loading state while checking auth
  if (!isInitialized) {
    if (!showLoading) return null;
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-700 animate-pulse" />
      </div>
    );
  }

  // If authenticated, show nothing (will redirect)
  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
