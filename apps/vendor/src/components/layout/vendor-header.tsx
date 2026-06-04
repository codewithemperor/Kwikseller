"use client";

import React from "react";
import { Menu, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@kwikseller/utils";

export interface VendorHeaderProps {
  onMenuToggle: () => void;
  vendorName?: string;
  storeLogoUrl?: string;
  notificationCount?: number;
  onSearchSubmit?: (query: string) => void;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function VendorHeader({
  onMenuToggle,
  vendorName: vendorNameProp,
  storeLogoUrl: storeLogoUrlProp,
  notificationCount = 0,
}: VendorHeaderProps) {
  const { user } = useAuthStore();

  // Use props if provided, otherwise fall back to auth store
  const userName =
    vendorNameProp ||
    user?.store?.name ||
    user?.profile?.firstName ||
    user?.email ||
    "Vendor";
  const storeLogo =
    storeLogoUrlProp ||
    (user?.store as { logoUrl?: string } | undefined)?.logoUrl;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-4 dark:border-white/10 dark:bg-[#0f1115] md:px-6 lg:px-7">
      {/* Left section: hamburger + brand */}
      <div className="flex items-center gap-3">
        {/* Hamburger - hidden on desktop (lg) */}
        <button
          type="button"
          onClick={onMenuToggle}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-md text-gray-700 transition-colors hover:bg-gray-100 dark:text-white dark:hover:bg-white/8 lg:hidden"
        >
          <Menu className="h-6 w-6" strokeWidth={2} />
        </button>

        {/* Brand */}
        <div className="flex items-center gap-1.5">
          <span className="text-base font-bold tracking-tight text-gray-900 dark:text-white">
            KWIKSELLER
          </span>
          <span className="hidden text-xs font-medium text-gray-500 dark:text-white/50 sm:inline">
            VENDOR
          </span>
        </div>
      </div>

      {/* Center search is intentionally hidden for now. */}
      <div className="flex-1" />

      {/* Right section: notifications + avatar */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-md text-gray-700 transition-colors hover:bg-gray-100 dark:text-white dark:hover:bg-white/8"
        >
          <Bell className="h-5 w-5" strokeWidth={1.5} />
          {notificationCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-medium leading-none text-white">
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          ) : null}
        </button>

        {/* User avatar */}
        <button
          type="button"
          aria-label="User profile"
          className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15 sm:h-8 sm:w-8"
        >
          {storeLogo ? (
            <img
              src={storeLogo}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xs font-semibold">
              {getInitials(userName)}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
