// KWIKSELLER Vendor Dashboard - Landing Page
// Redirects to dashboard if authenticated, or login if not

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@kwikseller/utils";
import { KwiksellerLoader } from "@/components/kwikseller-loader";

export default function VendorPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const tokens = useAuthStore((state) => state.tokens);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const isAuthenticated = !!user && !!tokens?.accessToken;

  useEffect(() => {
    if (!isInitialized) return;

    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }, [isInitialized, isAuthenticated, router]);

  return <KwiksellerLoader className="min-h-screen bg-background" />;
}
