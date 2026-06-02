"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import {
  ArrowUpRight,
  Home,
  PackageSearch,
  Search,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type VendorTabItem = {
  label: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  badge?: number;
};

export const vendorPrimaryTabs: VendorTabItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Pool", href: "/dashboard/pool", icon: PackageSearch },
  { label: "Search", href: "/dashboard/search", icon: Search },
  { label: "Orders", href: "/dashboard/orders", icon: ShoppingBag },
  { label: "Profile", href: "/dashboard/profile", icon: UserRound },
];

export function isVendorTabActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function VendorPageHeader({
  title,
  description,
  eyebrow,
  action,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </section>
  );
}

export function VendorSolidCard({
  title,
  value,
  suffix,
  primaryAction,
  secondaryAction,
}: {
  title: string;
  value: string;
  suffix?: string;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
}) {
  return (
    <article className="relative min-h-48 overflow-hidden rounded-[28px] bg-[#071a2f] p-6 text-white shadow-sm">
      <div className="pointer-events-none absolute -right-14 bottom-2 h-52 w-52 rounded-full border-[28px] border-white/12" />
      <div className="pointer-events-none absolute left-12 top-24 h-36 w-36 rounded-full border-[22px] border-white/10" />
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white/85">{title}</p>
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <p className="font-heading text-4xl font-semibold tracking-tight md:text-5xl">
                {value}
              </p>
              {suffix ? <span className="pb-1 text-sm font-semibold text-white/80">{suffix}</span> : null}
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#071a2f]">
            <ArrowUpRight className="h-5 w-5" />
          </div>
        </div>
        {(primaryAction || secondaryAction) ? (
          <div className="mt-8 grid grid-cols-2 gap-3">
            {primaryAction}
            {secondaryAction}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function VendorMetricCard({
  label,
  value,
  note,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  note?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  tone?: "default" | "accent" | "success" | "warning";
}) {
  const toneClass = {
    default: "bg-white text-[#071a2f] dark:bg-white/5 dark:text-white",
    accent: "bg-accent-soft text-accent-soft-foreground dark:bg-accent/15 dark:text-accent",
    success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200",
    warning: "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-200",
  }[tone];

  return (
    <article className="rounded-[22px] border border-border bg-background p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-3 font-heading text-2xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
          {note ? <p className="mt-1 text-xs font-medium text-muted-foreground">{note}</p> : null}
        </div>
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", toneClass)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </article>
  );
}

export function VendorSoftPanel({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-[24px] border border-border bg-background p-5 shadow-sm", className)}>
      {(title || description || action) ? (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            {title ? <h2 className="font-heading text-lg font-semibold text-foreground">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function VendorBottomTabs({ orderCount = 0 }: { orderCount?: number }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 rounded-[28px] border border-border bg-background/92 px-2 py-2 shadow-2xl shadow-black/10 backdrop-blur-xl lg:hidden">
      <div className="grid grid-cols-5 gap-1">
        {vendorPrimaryTabs.map((item) => {
          const active = isVendorTabActive(pathname, item.href);
          const badge = item.label === "Orders" ? orderCount : item.badge;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold transition",
                active
                  ? "bg-surface text-accent"
                  : "text-muted-foreground hover:bg-surface hover:text-foreground",
              )}
            >
              <span className="relative">
                <item.icon className="h-5 w-5" />
                {badge ? (
                  <span className="absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-danger-foreground">
                    {badge > 99 ? "99+" : badge}
                  </span>
                ) : null}
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function VendorDesktopNav({
  vendorName,
  orderCount = 0,
  onLogout,
}: {
  vendorName: string;
  orderCount?: number;
  onLogout: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-border bg-[#f4f6f5]/95 p-4 backdrop-blur-xl dark:bg-[#0f1115]/95 lg:flex lg:flex-col">
      <Link href="/dashboard" className="flex items-center gap-3 px-2 py-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent-soft-foreground">
          <Home className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-heading text-base font-semibold text-foreground">{vendorName}</p>
          <p className="truncate text-xs font-medium text-muted-foreground">Vendor workspace</p>
        </div>
      </Link>

      <div className="mt-6 rounded-2xl border border-border bg-background p-3 shadow-sm">
        <p className="truncate text-sm font-semibold text-foreground">Store account</p>
        <p className="mt-1 text-xs text-muted-foreground">Powered by Kwikseller</p>
      </div>

      <p className="mt-8 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Main menu
      </p>
      <nav className="mt-3 grid gap-1">
        {vendorPrimaryTabs.map((item) => {
          const active = isVendorTabActive(pathname, item.href);
          const badge = item.label === "Orders" ? orderCount : item.badge;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex h-12 items-center gap-3 rounded-2xl px-4 text-sm font-semibold transition",
                active
                  ? "bg-background text-[#071a2f] shadow-sm dark:text-white"
                  : "text-muted-foreground hover:bg-background/70 hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {badge ? (
                <span className="rounded-full bg-danger px-2 py-0.5 text-[10px] font-bold text-danger-foreground">
                  {badge > 99 ? "99+" : badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-[22px] border border-border bg-background p-4 shadow-sm">
        <p className="font-heading text-base font-semibold text-foreground">Store tools</p>
        <p className="mt-2 text-sm leading-5 text-muted-foreground">
          Manage products, inventory, and storefront settings from your dashboard.
        </p>
        <button
          type="button"
          onClick={onLogout}
          className="mt-4 flex h-11 w-full items-center justify-center rounded-2xl bg-[#071a2f] text-sm font-semibold text-white transition hover:brightness-110"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
