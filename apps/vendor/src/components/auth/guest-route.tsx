"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore, useVendorNeedsOnboarding } from "@kwikseller/utils";

interface GuestRouteProps {
  children: React.ReactNode;
  /**
   * Where to redirect authenticated users
   * @default "/dashboard"
   */
  redirectPath?: string;
  /**
   * Where to redirect vendors needing onboarding
   * @default "/onboarding"
   */
  onboardingPath?: string;
}

/**
 * GuestRoute - For pages that should only be visible to unauthenticated users
 *
 * Examples: Login, Register, Forgot Password pages
 * Authenticated users are redirected to the app (dashboard or onboarding)
 */
export function GuestRoute({
  children,
  redirectPath = "/dashboard",
  onboardingPath = "/onboarding",
}: GuestRouteProps) {
  const router = useRouter();
  const pathname = usePathname();

  const user = useAuthStore((state) => state.user);
  const tokens = useAuthStore((state) => state.tokens);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const vendorNeedsOnboarding = useVendorNeedsOnboarding();

  const isAuthenticated = !!user && !!tokens?.accessToken;

  useEffect(() => {
    if (!isInitialized) return;

    if (isAuthenticated) {
      // For vendors, check if they need onboarding
      if (user?.role === "VENDOR" && vendorNeedsOnboarding) {
        router.push(onboardingPath);
        return;
      }

      // Check if there's a redirect query param
      const urlParams = new URLSearchParams(window.location.search);
      const redirectTo = urlParams.get("redirect");

      // Redirect to intended destination or default
      router.push(redirectTo || redirectPath);
    }
  }, [isInitialized, isAuthenticated, router, redirectPath, pathname, user, vendorNeedsOnboarding, onboardingPath]);

  // Show nothing while checking auth state
  if (!isInitialized) {
    return null;
  }

  // If authenticated, show nothing (will redirect)
  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
