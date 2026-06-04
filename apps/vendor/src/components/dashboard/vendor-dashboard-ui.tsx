"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
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

interface SummaryCardProps {
  eyebrow?: string;
  title: string;
  value: string;
  caption?: string;
  ctaLabel?: string;
  dashboard?: boolean;
  href?: string;
  onCtaClick?: () => void;
  icon?: React.ReactNode;
  gradient?: string;
  className?: string;
}

type MetricTone = "brand" | "accent" | "success" | "warning" | "danger" | "neutral";

const metricToneMap: Record<MetricTone, string> = {
  brand: "bg-[var(--kwik-blue)] text-white dark:bg-[#1e40af] dark:text-white",
  accent: "bg-[#fff7ed] text-[#9a3412] dark:bg-[#431407] dark:text-[#fed7aa]",
  success: "bg-[#ecfdf5] text-[#065f46] dark:bg-[#052e16] dark:text-[#bbf7d0]",
  warning: "bg-[#fffbeb] text-[#92400e] dark:bg-[#451a03] dark:text-[#fde68a]",
  danger: "bg-[#fff1f0] text-[#b42318] dark:bg-[#7f1d1d] dark:text-[#fecaca]",
  neutral: "bg-white text-[#111827] dark:bg-[#0f1115] dark:text-white",
};

const metricIconToneMap: Record<MetricTone, string> = {
  brand: "bg-white/15 text-white",
  accent: "bg-[#fed7aa] text-[#9a3412] dark:bg-[#7c2d12] dark:text-[#ffedd5]",
  success: "bg-[#d1fae5] text-[#047857] dark:bg-[#064e3b] dark:text-[#d1fae5]",
  warning: "bg-[#fef3c7] text-[#92400e] dark:bg-[#78350f] dark:text-[#fef3c7]",
  danger: "bg-[#fee4e2] text-[#b42318] dark:bg-[#991b1b] dark:text-[#fee2e2]",
  neutral: "bg-[#f3f4f6] text-[#374151] dark:bg-white/8 dark:text-white/80",
};

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
    <section className="flex min-w-0 flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 text-[22px] font-semibold leading-tight text-foreground md:text-2xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm font-normal leading-6 text-muted-foreground">
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
    <article className="relative min-h-40 overflow-hidden rounded-xl bg-[#111827] p-5 text-white">
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white/78">{title}</p>
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <p className="text-3xl font-semibold leading-tight md:text-4xl">
                {value}
              </p>
              {suffix ? <span className="pb-1 text-sm font-medium text-white/78">{suffix}</span> : null}
            </div>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/12 text-white">
            <ArrowUpRight className="h-5 w-5" strokeWidth={1.5} />
          </div>
        </div>
        {(primaryAction || secondaryAction) ? (
          <div className="mt-6 grid grid-cols-2 gap-3">
            {primaryAction}
            {secondaryAction}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function SummaryCard({
  title,
  value,
  caption,
  ctaLabel,
  dashboard = false,
  href,
  onCtaClick,
  icon,
  gradient = "from-[#1f8f5c] via-[#169368] to-[#0f6f61]",
  className,
}: SummaryCardProps) {
  const hasCta = Boolean(ctaLabel && (href || onCtaClick));

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-[28px] bg-gradient-to-br p-5 text-white",
        gradient,
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.34),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.14),transparent_32%)]" />
      <div className={cn("relative flex flex-col", hasCta ? "min-h-[12.5rem] justify-between" : "min-h-36 justify-start")}>
        <div className="flex items-start justify-between gap-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72">
            {title}
          </p>
          {icon ? (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/16 text-white backdrop-blur-sm">
              {icon}
            </div>
          ) : null}
        </div>

        <div className="mt-5">
          <p className="text-4xl font-bold font-display leading-none tracking-normal">
            {value}
          </p>
          {caption ? (
            <p className={cn("mt-2 max-w-[17rem] text-sm text-white/76", dashboard ? "line-clamp-2" : "")}>
              {caption}
            </p>
          ) : null}
          {ctaLabel && href ? (
            <Link
              href={href}
              className="mt-5 flex min-h-11 w-full items-center justify-center rounded-full bg-white/18 px-4 py-2 text-sm font-bold tracking-wide text-white backdrop-blur-md transition hover:bg-white/24"
            >
              {ctaLabel}
            </Link>
          ) : null}
          {ctaLabel && !href && onCtaClick ? (
            <button
              type="button"
              onClick={onCtaClick}
              className="mt-5 flex min-h-11 w-full items-center justify-center rounded-full bg-white/18 px-4 py-2 text-sm font-semibold tracking-wide text-white backdrop-blur-md transition hover:bg-white/24"
            >
              {ctaLabel}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function DashboardMetricCard({
  title,
  value,
  description,
  href,
  icon,
  tone = "neutral",
  className,
}: {
  title: string;
  value: string | number;
  description: string;
  href?: string;
  icon: ReactNode;
  tone?: MetricTone;
  className?: string;
}) {
  const isBrand = tone === "brand";
  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", metricIconToneMap[tone])}>
          {icon}
        </div>
        {href ? (
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full border transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
              isBrand
                ? "border-white/30 text-white"
                : "border-black/10 text-[#111827] dark:border-white/10 dark:text-white",
            )}
          >
            <ArrowUpRight className="h-4 w-4" strokeWidth={1.7} />
          </span>
        ) : null}
      </div>
      <p className={cn("mt-5 text-sm font-semibold", isBrand ? "text-white/85" : "text-muted-foreground")}>
        {title}
      </p>
      <p className="mt-2 text-4xl font-semibold leading-none tracking-tight">{value}</p>
      <p className={cn("mt-3 line-clamp-2 min-h-10 text-sm leading-5", isBrand ? "text-white/75" : "text-muted-foreground")}>
        {description}
      </p>
    </>
  );

  const cardClass = cn(
    "group block rounded-2xl border border-black/10 p-5 transition hover:-translate-y-0.5 hover:shadow-sm dark:border-white/10",
    metricToneMap[tone],
    className,
  );

  if (href) {
    return (
      <Link className={cardClass} href={href}>
        {content}
      </Link>
    );
  }

  return <article className={cardClass}>{content}</article>;
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
  const metricTone = {
    default: "neutral",
    accent: "accent",
    success: "success",
    warning: "warning",
  }[tone];

  return (
    <DashboardMetricCard
      title={label}
      value={value}
      description={note ?? ""}
      tone={metricTone as MetricTone}
      icon={<Icon className="h-[18px] w-[18px]" strokeWidth={1.5} />}
    />
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
    <section className={cn("premium-card p-4 md:p-5", className)}>
      {(title || description || action) ? (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            {title ? <h2 className="text-lg font-semibold leading-snug text-foreground">{title}</h2> : null}
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
    <nav className="fixed inset-x-0 bottom-0 z-40 max-w-[100vw] overflow-hidden border-t border-[#E5E7EB] bg-white px-2 pb-[calc(env(safe-area-inset-bottom)+0.25rem)] pt-1 dark:border-white/10 dark:bg-[#0f1115] lg:hidden">
      <div className="grid h-14 grid-cols-4 gap-0">
        {vendorBottomTabs.map((item) => {
          const active = isVendorTabActive(pathname, item.href);
          const badge = item.label === "Orders" ? orderCount : item.badge;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex min-w-0 flex-col items-center justify-center gap-0.5 text-[10px] transition",
                active
                  ? "font-medium text-[#111827] dark:text-white"
                  : "font-normal text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white",
              )}
            >
              <span className="relative">
                <item.icon className="h-[22px] w-[22px]" strokeWidth={active ? 2 : 1.5} />
                {badge ? (
                  <span className="absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-medium leading-none text-danger-foreground">
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
                "relative flex h-12 items-center gap-3 rounded-lg px-4 text-sm font-medium transition",
                active
                  ? "bg-white text-kwik-blue"
                  : "text-white/78 hover:bg-white/12 hover:text-white",
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {badge ? (
                <span className="rounded-full bg-danger px-2 py-0.5 text-[10px] font-medium text-danger-foreground">
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
          className="flex h-11 w-full items-center justify-center rounded-lg bg-danger text-sm font-medium text-danger-foreground transition hover:brightness-110"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
