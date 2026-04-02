"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@kwikseller/utils";

interface GuestRouteProps {
  children: React.ReactNode;
  /**
   * Redirect path if already authenticated
   */
  redirectPath?: string;
}

/**
 * GuestRoute - Redirects authenticated users away from auth pages
 * Use this for login, register, forgot-password, reset-password pages
 *
 * Note: No loading spinner - just renders children immediately for better UX
 * The auth check happens in the background and redirects if needed
 */
export function GuestRoute({
  children,
  redirectPath = "/",
}: GuestRouteProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const tokens = useAuthStore((state) => state.tokens);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  const isAuthenticated = !!user && !!tokens?.accessToken;

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.push(redirectPath);
    }
  }, [isInitialized, isAuthenticated, router, redirectPath]);

  // If authenticated, return null while redirecting
  if (isInitialized && isAuthenticated) {
    return null;
  }

  // Otherwise, render children immediately
  return <>{children}</>;
}
