"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import {
  ArrowUpRight,
  Boxes,
  Home,
  PackageSearch,
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
  { label: "Products", href: "/dashboard/products", icon: Boxes },
  { label: "Orders", href: "/dashboard/orders", icon: ShoppingBag },
  { label: "Profile", href: "/dashboard/profile", icon: UserRound },
];

const vendorBottomTabs = vendorPrimaryTabs.filter((item) => item.label !== "Profile");

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
    <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
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
    <article className="relative min-h-48 overflow-hidden rounded-[24px] bg-[#071a2f] p-6 text-white">
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
    <article className="rounded-[20px] border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 font-heading text-xl font-semibold tracking-tight text-foreground">
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
    <section className={cn("rounded-[22px] border border-border bg-background p-5", className)}>
      {(title || description || action) ? (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            {title ? <h2 className="font-heading text-base font-semibold text-foreground">{title}</h2> : null}
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
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/96 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur-xl lg:hidden">
      <div className="grid grid-cols-4 gap-1">
        {vendorBottomTabs.map((item) => {
          const active = isVendorTabActive(pathname, item.href);
          const badge = item.label === "Orders" ? orderCount : item.badge;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex h-[52px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl text-[10px] font-semibold transition",
                active
                  ? "bg-accent-soft text-accent"
                  : "text-muted-foreground hover:bg-surface hover:text-foreground",
              )}
            >
              <span className="relative">
                <item.icon className="h-[19px] w-[19px]" strokeWidth={active ? 2.35 : 2} />
                {badge ? (
                  <span className="absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-danger-foreground">
                    {badge > 99 ? "99+" : badge}
                  </span>
                ) : null}
              </span>
              <span className="max-w-full truncate leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function VendorDesktopNav({
  vendorName,
  storeLogoUrl,
  orderCount = 0,
  onLogout,
}: {
  vendorName: string;
  storeLogoUrl?: string;
  orderCount?: number;
  onLogout: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside className="vendor-sidebar-blue fixed inset-y-0 left-0 hidden w-72 border-r border-white/15 p-4 text-white backdrop-blur-xl lg:flex lg:flex-col">
      <Link href="/dashboard" className="flex items-center gap-3 px-2 py-2">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white/18 text-white ring-1 ring-white/20">
          {storeLogoUrl ? (
            <img src={storeLogoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <Home className="h-5 w-5" />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-heading text-base font-semibold text-white">{vendorName}</p>
          <p className="truncate text-xs font-medium text-white/72">Vendor workspace</p>
        </div>
      </Link>

      <nav className="mt-8 grid gap-1">
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
                  ? "bg-white text-kwik-blue"
                  : "text-white/78 hover:bg-white/12 hover:text-white",
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

      <div className="mt-auto">
        <button
          type="button"
          onClick={onLogout}
          className="flex h-11 w-full items-center justify-center rounded-2xl bg-danger text-sm font-semibold text-danger-foreground transition hover:brightness-110"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
