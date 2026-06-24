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
import { cn } from "@/lib/utils";

export function VendorWorkspaceShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

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
      <div className="min-h-screen bg-kwik-bg-page text-foreground">
        {/* Desktop sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-30 hidden border-r border-white/10 bg-kwik-blue transition-[width] duration-200 lg:block",
            sidebarCollapsed ? "w-20" : "w-60",
          )}
        >
          <VendorDrawer
            isOpen
            onClose={() => undefined}
            vendorName={vendorName}
            storeSlug={storeSlug}
            storeLogoUrl={storeLogoUrl}
            onLogout={handleLogout}
            collapsed={sidebarCollapsed}
            onToggleCollapsed={() => setSidebarCollapsed((collapsed) => !collapsed)}
          />
        </aside>

        {/* Header */}
        <div
          className={cn(
            "fixed inset-x-0 top-0 z-40 transition-[left] duration-200",
            sidebarCollapsed ? "lg:left-20" : "lg:left-60",
          )}
        >
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
                className="fixed inset-y-0 left-0 z-50 w-[min(17rem,calc(100vw-3rem))] border-r border-white/10 bg-kwik-blue lg:hidden"
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
        <div
          className={cn(
            "min-h-screen pb-20 pt-14 transition-[padding-left] duration-200 lg:pb-0",
            sidebarCollapsed ? "lg:pl-20" : "lg:pl-60",
          )}
        >
          <OfflineBanner />
          <main className="safe-container mx-auto w-full max-w-[1440px] px-3 pb-4 pt-5 sm:px-4 md:px-5 lg:px-6 lg:py-6">
            {children}
          </main>
        </div>

        {/* Mobile bottom navigation */}
        <VendorMobileNav onMore={() => setDrawerOpen(true)} />
      </div>
    </ProtectedRoute>
  );
}
