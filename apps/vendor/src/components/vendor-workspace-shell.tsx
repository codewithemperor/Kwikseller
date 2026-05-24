"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import {
  BarChart3,
  Bell,
  Boxes,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PackageCheck,
  Paintbrush,
  Search,
  Store,
  X,
  Users,
} from "lucide-react";
import { useTheme } from "next-themes";
import { ProtectedRoute } from "@/components/auth";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@kwikseller/utils";
import { AppSwitch } from "@kwikseller/ui";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/dashboard/products", icon: Package },
  { label: "Inventory", href: "/dashboard/inventory", icon: Boxes },
  { label: "Orders", href: "/dashboard/orders", icon: PackageCheck },
  { label: "Pool", href: "/dashboard/pool", icon: Users },
  { label: "Storefront", href: "/dashboard/storefront", icon: Paintbrush },
];

export function VendorWorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const vendorName =
    user?.store?.name || user?.profile?.firstName || user?.email || "Store workspace";

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  React.useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <ProtectedRoute requiredRole="VENDOR" loginPath="/">
      <div className="min-h-screen bg-background text-foreground">
        <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-border bg-background/85 backdrop-blur-xl lg:block">
          <div className="flex h-20 items-center gap-3 border-b border-border px-5">
            <div className="flex h-11 w-11 items-center justify-center bg-[#071a2f] text-white">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <p className="font-heading text-base font-bold tracking-tight">KWIKSELLER</p>
              <p className="text-xs font-medium text-muted-foreground">Vendor workspace</p>
            </div>
          </div>
          <nav className="space-y-2 p-4">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex h-12 items-center gap-3 px-4 text-sm font-semibold transition",
                    active
                      ? "text-accent"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {active && <span className="absolute left-0 h-7 w-1 bg-accent" />}
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close navigation overlay"
              className="absolute inset-0 bg-[#071a2f]/45"
              onClick={() => setDrawerOpen(false)}
            />
            <aside className="relative flex h-full w-[min(330px,88vw)] flex-col bg-background/95 shadow-2xl backdrop-blur-xl">
              <div className="flex h-20 items-center justify-between border-b border-black/5 px-5 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center bg-[#071a2f] text-white">
                    <Store className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-heading text-base font-bold">{vendorName}</p>
                    <p className="text-xs font-medium text-muted-foreground">Vendor menu</p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Close navigation"
                  onClick={() => setDrawerOpen(false)}
                  className="flex h-10 w-10 items-center justify-center text-foreground transition hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="grid gap-1 p-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative grid h-14 grid-cols-[24px_1fr] items-center gap-3 px-4 text-sm font-semibold transition",
                      pathname === item.href
                        ? "text-accent"
                        : "text-foreground/80 hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10",
                    )}
                  >
                    {pathname === item.href && <span className="absolute left-0 h-7 w-1 bg-accent" />}
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="mx-4 mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-black/5 py-4 dark:border-white/10">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">Display mode</p>
                  <p className="text-[11px] text-muted-foreground">{isDark ? "Dark mode" : "Light mode"}</p>
                </div>
                <AppSwitch isSelected={!isDark} onChange={(selected) => setTheme(selected ? "light" : "dark")} mode="theme" />
              </div>
              <div className="mt-auto border-t border-border p-4">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex h-12 w-full items-center justify-center gap-2 bg-[#071a2f] text-sm font-semibold text-white"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </aside>
          </div>
        )}

        <div className="lg:pl-72">
          <header className="sticky top-0 z-30 border-b border-border bg-background/72 shadow-sm shadow-black/[0.03] backdrop-blur-xl">
            <div className="flex h-20 items-center justify-between gap-3 px-4 lg:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  aria-label="Open dashboard navigation"
                  onClick={() => setDrawerOpen(true)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center text-[#071a2f] transition hover:bg-black/5 dark:text-white dark:hover:bg-white/10 lg:hidden"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <div className="min-w-0">
                  <h1 className="truncate font-heading text-xl font-semibold text-foreground">
                    {vendorName}
                  </h1>
                  <p className="text-xs font-medium text-muted-foreground">Vendor operations</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden h-11 items-center gap-2 rounded-full bg-[#f2f4f7] px-4 text-sm text-muted-foreground md:flex">
                  <Search className="h-4 w-4" />
                  Search workspace
                </div>
                <button
                  type="button"
                  aria-label="Notifications"
                  className="relative flex h-11 w-11 items-center justify-center text-foreground transition hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-accent" />
                </button>
                <AppSwitch
                  isSelected={!isDark}
                  onChange={(selected) => setTheme(selected ? "light" : "dark")}
                  mode="theme"
                  className="hidden sm:flex"
                />
                <div className="hidden h-11 items-center gap-2 border border-border px-3 text-xs text-muted-foreground sm:flex">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Real API data
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="hidden h-11 items-center gap-2 bg-accent px-4 text-sm font-semibold text-white shadow-sm hover:brightness-95 sm:inline-flex"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          </header>
          <main className="px-4 py-5 lg:px-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
