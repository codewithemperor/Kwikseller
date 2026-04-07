"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, useRiderNeedsOnboarding } from "@kwikseller/utils";

interface GuestRouteProps {
  children: React.ReactNode;
  /**
   * Redirect path if already authenticated
   * Defaults to /dashboard for riders
   */
  redirectPath?: string;
  /**
   * Onboarding path to check if rider needs onboarding
   */
  onboardingPath?: string;
}

/**
 * GuestRoute - Redirects authenticated users away from auth pages
 * 
 * Use this for login, register, forgot-password, reset-password pages
 * 
 * If the rider is authenticated:
 * - Needs onboarding → redirect to /onboarding
 * - Onboarding complete → redirect to /dashboard
 */
export function GuestRoute({
  children,
  redirectPath = "/dashboard",
  onboardingPath = "/onboarding",
}: GuestRouteProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const tokens = useAuthStore((state) => state.tokens);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const needsOnboarding = useRiderNeedsOnboarding();

  const isAuthenticated = !!user && !!tokens?.accessToken;

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      // If rider needs onboarding, send them there
      if (needsOnboarding) {
        router.push(onboardingPath);
      } else {
        // Otherwise, send to dashboard
        router.push(redirectPath);
      }
    }
  }, [isInitialized, isAuthenticated, router, redirectPath, needsOnboarding, onboardingPath]);

  // If authenticated, return null while redirecting
  if (isInitialized && isAuthenticated) {
    return null;
  }

  // Otherwise, render children immediately
  return <>{children}</>;
}
