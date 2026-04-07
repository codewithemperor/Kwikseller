"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore, useRiderNeedsOnboarding } from "@kwikseller/utils";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /**
   * Required role(s) to access the route
   * Defaults to RIDER for this app
   */
  requiredRole?: "RIDER";
  /**
   * Redirect path if not authenticated
   */
  loginPath?: string;
  /**
   * Redirect path if rider needs onboarding
   */
  onboardingPath?: string;
  /**
   * Unauthorized component to show instead of redirecting
   */
  unauthorizedComponent?: React.ReactNode;
  /**
   * Loading component to show while checking auth
   */
  loadingComponent?: React.ReactNode;
}

/**
 * ProtectedRoute - Guards routes that require authentication
 * 
 * For the Rider app, this checks:
 * 1. User is authenticated
 * 2. User has RIDER role
 * 3. Rider has completed onboarding (redirects to /onboarding if not)
 */
export function ProtectedRoute({
  children,
  requiredRole = "RIDER",
  loginPath = "/login",
  onboardingPath = "/onboarding",
  unauthorizedComponent,
  loadingComponent,
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  const user = useAuthStore((state) => state.user);
  const tokens = useAuthStore((state) => state.tokens);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const hasRole = useAuthStore((state) => state.hasRole);
  const needsOnboarding = useRiderNeedsOnboarding();

  const isAuthenticated = !!user && !!tokens?.accessToken;
  const isLoading = !isInitialized;

  useEffect(() => {
    if (!isInitialized) return;

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(pathname);
      router.push(`${loginPath}?redirect=${returnUrl}`);
      return;
    }

    // Check role requirement
    if (requiredRole && !hasRole(requiredRole)) {
      // Wrong role - they shouldn't be in the rider app
      router.push("/");
      return;
    }

    // Check onboarding - but don't redirect if already on onboarding page
    if (needsOnboarding && pathname !== onboardingPath) {
      router.push(onboardingPath);
      return;
    }
  }, [
    isInitialized,
    isAuthenticated,
    requiredRole,
    router,
    pathname,
    loginPath,
    onboardingPath,
    hasRole,
    needsOnboarding,
  ]);

  // Loading state
  if (isLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
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

  return <>{children}</>;
}
