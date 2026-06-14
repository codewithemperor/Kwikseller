"use client";

import React from "react";
import { Menu, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@kwikseller/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppButton } from "@kwikseller/ui";

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
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-border bg-background/95 px-4 backdrop-blur dark:bg-[#0f1115]/95 md:px-5 lg:px-6">
      {/* Left section: hamburger + brand */}
      <div className="flex items-center gap-3">
        {/* Hamburger - hidden on desktop (lg) */}
        <AppButton
          type="button"
          variant="ghost"
          size="sm"
          onClick={onMenuToggle}
          aria-label="Open menu"
          className="h-9 w-9 p-0 text-foreground hover:bg-surface dark:text-white dark:hover:bg-white/8 lg:hidden"
        >
          <Menu className="h-6 w-6" strokeWidth={2} />
        </AppButton>

        {/* Brand */}
        <div className="flex items-center gap-1.5">
          <span className="text-base font-bold tracking-tight text-foreground dark:text-white">
            KWIKSELLER
          </span>
          <span className="hidden text-xs font-medium text-muted dark:text-white/50 sm:inline">
            VENDOR
          </span>
        </div>
      </div>

      {/* Center search is intentionally hidden for now. */}
      <div className="flex-1" />

      {/* Right section: notifications + avatar */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <AppButton
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Notifications"
          className="relative h-9 w-9 p-0 text-foreground hover:bg-surface dark:text-white dark:hover:bg-white/8"
        >
          <Bell className="h-5 w-5" strokeWidth={1.5} />
          {notificationCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-medium leading-none text-white">
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          ) : null}
        </AppButton>

        <ThemeToggle className="h-9 min-w-9 rounded-md text-foreground hover:bg-surface dark:text-white dark:hover:bg-white/8" />

        {/* User avatar */}
        <AppButton
          type="button"
          variant="ghost"
          size="sm"
          aria-label="User profile"
          className="h-8 w-8 overflow-hidden rounded-full bg-gray-100 p-0 text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
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
        </AppButton>
      </div>
    </header>
  );
}
