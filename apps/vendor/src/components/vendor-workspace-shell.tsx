"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  LogOut,
  Package,
  PackageCheck,
  Paintbrush,
  Store,
  Users,
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@kwikseller/utils";

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

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  return (
    <ProtectedRoute requiredRole="VENDOR" loginPath="/">
      <div className="min-h-screen bg-white text-foreground dark:bg-background">
        <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-background lg:block">
          <div className="flex h-16 items-center gap-3 border-b border-border px-5">
            <div className="flex h-9 w-9 items-center justify-center bg-[#071a2f] text-white">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <p className="font-heading text-sm font-bold tracking-tight">KWIKSELLER</p>
              <p className="text-xs text-muted-foreground">Vendor workspace</p>
            </div>
          </div>
          <nav className="space-y-1 p-3">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 text-sm font-semibold transition",
                    active
                      ? "bg-accent-soft text-accent-soft-foreground"
                      : "text-muted-foreground hover:bg-surface hover:text-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="lg:pl-64">
          <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
            <div className="flex min-h-16 flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-6">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Vendor operations</p>
                <h1 className="font-heading text-lg font-semibold text-foreground">
                  {user?.store?.name || user?.profile?.firstName || user?.email || "Store workspace"}
                </h1>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto">
                <div className="hidden items-center gap-2 border border-border px-3 py-2 text-xs text-muted-foreground sm:flex">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Real API data
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-foreground hover:bg-surface"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
            <nav className="flex gap-2 overflow-x-auto border-t border-border px-4 py-2 lg:hidden">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-semibold",
                    pathname === item.href ? "bg-accent-soft text-accent-soft-foreground" : "text-muted-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </header>
          <main className="px-4 py-6 lg:px-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
