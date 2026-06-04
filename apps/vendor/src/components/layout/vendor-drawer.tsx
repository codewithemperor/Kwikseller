"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Boxes,
  Waves,
  Store,
  BarChart3,
  Wallet,
  Truck,
  MessageSquare,
  Bell,
  UserRound,
  Settings,
  HelpCircle,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface VendorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  vendorName: string;
  storeSlug?: string;
  storeLogoUrl?: string;
  badgeCounts?: {
    orders?: number;
    products?: number;
    lowStock?: number;
    deliveries?: number;
    messages?: number;
    notifications?: number;
  };
  onLogout: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  badgeKey?: keyof NonNullable<VendorDrawerProps["badgeCounts"]>;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/dashboard/products", icon: Package, badgeKey: "products" },
  { label: "Orders", href: "/dashboard/orders", icon: ShoppingCart, badgeKey: "orders" },
  { label: "Inventory", href: "/dashboard/inventory", icon: Boxes, badgeKey: "lowStock" },
  { label: "Pool Sourcing", href: "/dashboard/pool", icon: Waves },
  { label: "Storefront", href: "/dashboard/storefront", icon: Store },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Wallet", href: "/dashboard/wallet", icon: Wallet },
  { label: "Deliveries", href: "/dashboard/deliveries", icon: Truck, badgeKey: "deliveries" },
  { label: "Messages", href: "/dashboard/messages", icon: MessageSquare, badgeKey: "messages" },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell, badgeKey: "notifications" },
  { label: "Profile", href: "/dashboard/profile", icon: UserRound },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
  { label: "Help", href: "/dashboard/help", icon: HelpCircle },
];

function isNavActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function VendorDrawer({
  isOpen,
  onClose,
  vendorName,
  storeSlug,
  storeLogoUrl,
  badgeCounts,
  onLogout,
}: VendorDrawerProps) {
  const pathname = usePathname();

  // Close drawer on Escape key
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <div className="flex h-full flex-col bg-white dark:bg-[#0f1115]">
      {/* Scrollable nav area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Vendor info header */}
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-white">
            {storeLogoUrl ? (
              <img
                src={storeLogoUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm font-semibold">
                {getInitials(vendorName)}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
              {vendorName}
            </p>
            {storeSlug && (
              <p className="truncate text-xs text-gray-500 dark:text-white/60">
                {storeSlug}.kwik.com
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-gray-600 transition-colors hover:bg-gray-100 dark:text-white/70 dark:hover:bg-white/8 lg:hidden"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        {/* Divider */}
        <div className="mx-4 border-t border-gray-200 dark:border-white/10" />

        {/* Navigation */}
        <nav className="mt-2 grid gap-0.5 px-2 pb-4">
          {navItems.map((item) => {
            const active = isNavActive(pathname, item.href);
            const badge = item.badgeKey ? badgeCounts?.[item.badgeKey] : undefined;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onClose()}
                className={cn(
                  "flat-button relative flex h-11 items-center gap-3 rounded-md pl-5 pr-4 text-sm font-medium transition-colors",
                  active
                    ? "border-l-[3px] border-gray-900 bg-gray-50 text-gray-900 dark:border-white dark:bg-white/8 dark:text-white"
                    : "border-l-[3px] border-transparent text-gray-700 hover:bg-gray-50 dark:text-white/70 dark:hover:bg-white/5 dark:hover:text-white",
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    active
                      ? "text-gray-900 dark:text-white"
                      : "text-gray-500 dark:text-white/50",
                  )}
                  strokeWidth={active ? 2 : 1.5}
                />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {badge ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-medium leading-none text-white">
                    {badge > 99 ? "99+" : badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="mx-4 border-t border-gray-200 dark:border-white/10" />

        {/* Logout */}
        <div className="px-2 pb-4 pt-2">
          <button
            type="button"
            onClick={onLogout}
            className="flat-button flex h-11 w-full items-center gap-3 rounded-md pl-5 pr-4 text-sm font-medium text-red-600 transition-colors hover:bg-gray-50 dark:text-red-400 dark:hover:bg-white/5"
          >
            <LogOut className="h-5 w-5 shrink-0" strokeWidth={1.5} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
