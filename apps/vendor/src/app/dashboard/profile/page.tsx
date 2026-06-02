"use client";

import React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  Bell,
  Brush,
  History,
  LogOut,
  PackageSearch,
  Store,
  Sun,
  UserRound,
} from "lucide-react";
import {
  VendorPageHeader,
  VendorSoftPanel,
} from "@/components/dashboard/vendor-dashboard-ui";
import { StorePublicUrlCard } from "@/components/dashboard/store-public-url-card";
import { useAuthStore } from "@kwikseller/utils";
import { AppButton, AppSwitch } from "@kwikseller/ui";

const profileLinks = [
  {
    title: "Storefront",
    description: "Logo, banner, colors, and public store profile.",
    href: "/dashboard/storefront",
    icon: Brush,
  },
  {
    title: "Pool selections",
    description: "Browse and add source products to your storefront.",
    href: "/dashboard/pool",
    icon: PackageSearch,
  },
  {
    title: "Products",
    description: "Manage owned and Pool-sourced catalog items.",
    href: "/dashboard/products",
    icon: Store,
  },
  {
    title: "History",
    description: "Orders and vendor activity.",
    href: "/dashboard/orders",
    icon: History,
  },
];

export default function VendorProfilePage() {
  const { user, logout } = useAuthStore();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const isLight = mounted ? (theme === "light" || (theme === "system" && resolvedTheme !== "dark")) : true;
  const store = user?.store;
  const storeLogoUrl = (store as { logoUrl?: string } | undefined)?.logoUrl;
  const name = store?.name || user?.profile?.firstName || user?.email || "Vendor";
  const email = user?.email ?? "";
  const phone = user?.phone ?? "";

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="space-y-6">
      <VendorPageHeader
        title="Profile"
        description="Manage your vendor identity, display preferences, and quick account links."
      />

      <section>
        <div className="flex flex-col items-center text-center">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-accent-soft text-accent-soft-foreground">
            {storeLogoUrl ? (
              <img src={storeLogoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <UserRound className="h-10 w-10" />
            )}
          </div>
          <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Online
          </span>
          <h2 className="mt-4 font-heading text-2xl font-semibold text-foreground">{name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{email}</p>
          {phone ? <p className="mt-1 text-sm text-muted-foreground">{phone}</p> : null}
        </div>
      </section>

      <StorePublicUrlCard />

      <section className="grid gap-3 md:grid-cols-2">
        {profileLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="grid grid-cols-[52px_1fr] items-center gap-4 rounded-[22px] border border-border bg-background p-4 transition hover:border-accent"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface text-accent">
              <item.icon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block font-heading text-base font-semibold text-foreground">{item.title}</span>
              <span className="line-clamp-2 text-sm leading-6 text-muted-foreground">{item.description}</span>
            </span>
          </Link>
        ))}
      </section>

      <VendorSoftPanel title="Preferences">
        <div className="space-y-3">
          <div className="grid grid-cols-[52px_1fr_auto] items-center gap-4 rounded-2xl bg-surface p-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background text-accent">
              <Sun className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block font-heading text-base font-semibold text-foreground">Display mode</span>
              <span className="text-sm text-muted-foreground">{isLight ? "Light mode" : "Dark mode"}</span>
            </span>
            <AppSwitch
              isSelected={isLight}
              onChange={(selected) => setTheme(selected ? "light" : "dark")}
              mode="theme"
            />
          </div>
          <div className="grid grid-cols-[52px_1fr_auto] items-center gap-4 rounded-2xl bg-surface p-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background text-accent">
              <Bell className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block font-heading text-base font-semibold text-foreground">Notification</span>
              <span className="text-sm text-muted-foreground">Order and inventory alerts</span>
            </span>
            <AppSwitch isSelected onChange={() => undefined} />
          </div>
        </div>
      </VendorSoftPanel>

      <AppButton type="button" variant="secondary" size="lg" fullWidth onClick={handleLogout}>
        <LogOut className="h-4 w-4" />
        Log out
      </AppButton>
    </div>
  );
}
