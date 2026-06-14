"use client";

import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { ProtectedRoute } from "@/components/auth";
import { VendorHeader } from "@/components/layout/vendor-header";
import { VendorDrawer } from "@/components/layout/vendor-drawer";
import { unwrapApiData } from "@/lib/vendor-format";
import { vendorCommerceApi } from "@kwikseller/api-client";
import type { Order } from "@kwikseller/types";
import { useAuthStore } from "@kwikseller/utils";

const activeOrderStatuses = new Set(["PENDING", "PAID", "CONFIRMED", "PROCESSING"]);

export function VendorWorkspaceShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [orderCount, setOrderCount] = React.useState(0);

  const vendorName = user?.store?.name || user?.profile?.firstName || user?.email || "Vendor";
  const storeSlug = user?.store?.slug || "";
  const storeLogoUrl = (user?.store as { logoUrl?: string } | undefined)?.logoUrl;

  // Fetch active order count for badges
  React.useEffect(() => {
    let active = true;
    vendorCommerceApi
      .listOrders({ limit: 100 })
      .then((response) => {
        if (!active) return;
        const orders = unwrapApiData<Order[]>(response.data);
        setOrderCount(
          Array.isArray(orders)
            ? orders.filter((o) => activeOrderStatuses.has(o.status)).length
            : 0,
        );
      })
      .catch(() => {
        if (active) setOrderCount(0);
      });
    return () => {
      active = false;
    };
  }, []);

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
      <div className="min-h-screen bg-white text-foreground dark:bg-[#0f1115] dark:text-white">
        {/* Desktop sidebar - reserves its own layout space via lg padding below. */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-gray-200 bg-white dark:border-white/10 dark:bg-[#0f1115] lg:block">
          <VendorDrawer
            isOpen
            onClose={() => undefined}
            vendorName={vendorName}
            storeSlug={storeSlug}
            storeLogoUrl={storeLogoUrl}
            badgeCounts={{
              orders: orderCount,
            }}
            onLogout={handleLogout}
          />
        </aside>

        {/* Header - fixed at the top and offset on desktop so it does not sit underneath the sidebar. */}
        <div className="fixed inset-x-0 top-0 z-40 lg:left-72">
          <VendorHeader
            onMenuToggle={() => setDrawerOpen((open) => !open)}
            vendorName={vendorName}
            storeLogoUrl={storeLogoUrl}
            notificationCount={orderCount}
            onSearchSubmit={handleSearch}
          />
        </div>

        {/* Mobile drawer - only mounted when opened. */}
        {drawerOpen && (
          <>
            <button
              type="button"
              className="drawer-backdrop fixed inset-0 z-40 bg-black/45 lg:hidden"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close drawer"
            />
            <aside className="drawer-panel drawer-panel-open fixed inset-y-0 left-0 z-50 w-[min(18rem,calc(100vw-3rem))] border-r border-gray-200 bg-white dark:border-white/10 dark:bg-[#0f1115] lg:hidden">
              <VendorDrawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                vendorName={vendorName}
                storeSlug={storeSlug}
                storeLogoUrl={storeLogoUrl}
                badgeCounts={{
                  orders: orderCount,
                }}
                onLogout={handleLogout}
              />
            </aside>
          </>
        )}

        {/* Main content area - offset by sidebar on desktop */}
        <div className="min-h-screen pb-20 pt-14 lg:pl-72">
          <main className="safe-container mx-auto w-full max-w-[1320px] px-4 py-4 md:px-5 lg:px-6 lg:py-5">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
