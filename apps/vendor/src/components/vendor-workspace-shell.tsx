"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { Bell, Search, UserRound } from "lucide-react";
import { ProtectedRoute } from "@/components/auth";
import {
  VendorBottomTabs,
  VendorDesktopNav,
} from "@/components/dashboard/vendor-dashboard-ui";
import { unwrapApiData } from "@/lib/vendor-format";
import { vendorCommerceApi } from "@kwikseller/api-client";
import type { Order } from "@kwikseller/types";
import { useAuthStore } from "@kwikseller/utils";

const activeOrderStatuses = new Set(["PENDING", "PAID", "CONFIRMED", "PROCESSING"]);

const pageMeta = [
  { match: "/dashboard/pool", title: "Pool", description: "Browse source products and add them to your store." },
  { match: "/dashboard/search", title: "Search", description: "Find products, Pool items, and orders." },
  { match: "/dashboard/orders", title: "Orders", description: "Manage customer purchases and fulfillment." },
  { match: "/dashboard/profile", title: "Profile", description: "Store account, preferences, and profile settings." },
  { match: "/dashboard/products", title: "Products", description: "Create and manage your store catalog." },
  { match: "/dashboard/inventory", title: "Inventory", description: "Track stock, reservations, and low-stock alerts." },
  { match: "/dashboard/delivery", title: "Delivery", description: "Manage manual delivery and dispatch notes." },
  { match: "/dashboard/storefront", title: "Storefront", description: "Customize your public store appearance." },
] as const;

export function VendorWorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [orderCount, setOrderCount] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const vendorName =
    user?.store?.name || user?.profile?.firstName || user?.email || "Store workspace";
  const currentPage = pageMeta.find((item) => pathname.startsWith(item.match)) ?? {
    title: "Home",
    description: "Track store activity, Pool opportunities, orders, and inventory.",
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  React.useEffect(() => {
    let active = true;
    vendorCommerceApi
      .listOrders({ limit: 100 })
      .then((response) => {
        if (!active) return;
        const orders = unwrapApiData<Order[]>(response.data);
        setOrderCount(
          Array.isArray(orders)
            ? orders.filter((order) => activeOrderStatuses.has(order.status)).length
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

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = search.trim();
    router.push(query ? `/dashboard/search?q=${encodeURIComponent(query)}` : "/dashboard/search");
  };

  return (
    <ProtectedRoute requiredRole="VENDOR" loginPath="/login">
      <div className="min-h-screen bg-white text-foreground dark:bg-[#0f1115]">
        <VendorDesktopNav
          vendorName={vendorName}
          orderCount={orderCount}
          onLogout={handleLogout}
        />

        <div className="min-h-screen pb-28 lg:pl-72">
          <header className="sticky top-0 z-30 border-b border-border bg-[#f4f6f5]/88 backdrop-blur-xl dark:bg-[#13161d]/88">
            <div className="flex h-20 items-center justify-between gap-4 px-4 lg:px-7">
              <div className="min-w-0">
                <p className="truncate font-heading text-base font-semibold text-foreground lg:text-lg">
                  {currentPage.title}
                </p>
                <p className="hidden truncate text-sm text-muted-foreground sm:block">
                  {currentPage.description}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <form
                  onSubmit={submitSearch}
                  className="hidden h-12 w-[min(360px,35vw)] items-center gap-3 rounded-2xl border border-border bg-white px-4 text-sm text-muted-foreground transition focus-within:border-accent dark:bg-white/5 md:flex"
                >
                  <Search className="h-4 w-4" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search anything"
                    className="min-w-0 flex-1 bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground"
                  />
                  <button type="submit" className="text-xs font-semibold text-accent">
                    Search
                  </button>
                </form>
                <Link
                  href="/dashboard/search"
                  aria-label="Search"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-foreground transition hover:bg-background md:hidden"
                >
                  <Search className="h-5 w-5" />
                </Link>
                <Link
                  href="/dashboard/orders"
                  aria-label="Orders"
                  className="relative flex h-11 w-11 items-center justify-center rounded-full bg-surface text-foreground transition hover:bg-background"
                >
                  <Bell className="h-5 w-5" />
                  {orderCount ? (
                    <span className="absolute right-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-danger-foreground">
                      {orderCount > 99 ? "99+" : orderCount}
                    </span>
                  ) : null}
                </Link>
                <Link
                  href="/dashboard/profile"
                  aria-label="Profile"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-accent-soft-foreground transition hover:brightness-95"
                >
                  <UserRound className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1500px] px-4 py-5 lg:px-7 lg:py-6">
            {children}
          </main>
        </div>

        <VendorBottomTabs orderCount={orderCount} />
      </div>
    </ProtectedRoute>
  );
}
