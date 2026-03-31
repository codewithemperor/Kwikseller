"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@kwikseller/utils";
import { Spinner } from "@heroui/react";

interface GuestRouteProps {
  children: React.ReactNode;
  /**
   * Redirect path if already authenticated
   */
  redirectPath?: string;
  /**
   * Loading component
   */
  loadingComponent?: React.ReactNode;
}

/**
 * GuestRoute - Redirects authenticated users away from auth pages
 * Use this for login, register, forgot-password, reset-password pages
 */
export function GuestRoute({
  children,
  redirectPath = "/",
  loadingComponent,
}: GuestRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isInitialized, isLoading } = useAuth();

  useEffect(() => {
    if (!isInitialized) return;

    if (isAuthenticated) {
      router.push(redirectPath);
    }
  }, [isInitialized, isAuthenticated, router, redirectPath]);

  // Show loading state
  if (!isInitialized || isLoading) {
    return loadingComponent ? (
      <>{loadingComponent}</>
    ) : (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-default-100">
        <Spinner size="lg" />
      </div>
    );
  }

  // Already authenticated - show nothing while redirecting
  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
