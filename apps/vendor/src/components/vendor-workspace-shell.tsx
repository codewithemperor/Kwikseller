"use client";

import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ProtectedRoute } from "@/components/auth";
import { VendorHeader } from "@/components/layout/vendor-header";
import { VendorDrawer } from "@/components/layout/vendor-drawer";
import { VendorMobileNav } from "@/components/layout/vendor-mobile-nav";
import { OfflineBanner } from "@kwikseller/ui";
import { useAuthStore } from "@kwikseller/utils";

export function VendorWorkspaceShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const vendorName = user?.store?.name || user?.profile?.firstName || user?.email || "Vendor";
  const storeSlug = user?.store?.slug || "";
  const storeLogoUrl = (user?.store as { logoUrl?: string } | undefined)?.logoUrl;

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  const handleSearch = (query: string) => {
    router.push(query ? `/dashboard/search?q=${encodeURIComponent(query)}` : "/dashboard/search");
  };

  // Close drawer on route change (mobile)
  React.useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <ProtectedRoute requiredRole="VENDOR" loginPath="/login">
      <div className="min-h-screen bg-background text-foreground">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-kwik-border bg-surface lg:block">
          <VendorDrawer
            isOpen
            onClose={() => undefined}
            vendorName={vendorName}
            storeSlug={storeSlug}
            storeLogoUrl={storeLogoUrl}
            onLogout={handleLogout}
          />
        </aside>

        {/* Header */}
        <div className="fixed inset-x-0 top-0 z-40 lg:left-72">
          <VendorHeader
            onMenuToggle={() => setDrawerOpen((open) => !open)}
            vendorName={vendorName}
            storeLogoUrl={storeLogoUrl}
            onSearchSubmit={handleSearch}
          />
        </div>

        {/* Mobile drawer with framer-motion */}
        <AnimatePresence>
          {drawerOpen && (
            <>
              <motion.button
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm lg:hidden"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close drawer"
              />
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed inset-y-0 left-0 z-50 w-[min(18rem,calc(100vw-3rem))] border-r border-kwik-border bg-surface shadow-2xl lg:hidden"
              >
                <VendorDrawer
                  isOpen={drawerOpen}
                  onClose={() => setDrawerOpen(false)}
                  vendorName={vendorName}
                  storeSlug={storeSlug}
                  storeLogoUrl={storeLogoUrl}
                  onLogout={handleLogout}
                />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main content area */}
        <div className="min-h-screen pb-20 pt-14 lg:pl-72 lg:pb-0">
          <OfflineBanner />
          <main className="safe-container mx-auto w-full max-w-[1320px] px-4 py-4 md:px-5 lg:px-6 lg:py-5">
            {children}
          </main>
        </div>

        {/* Mobile bottom navigation */}
        <VendorMobileNav onMore={() => setDrawerOpen(true)} />
      </div>
    </ProtectedRoute>
  );
}
