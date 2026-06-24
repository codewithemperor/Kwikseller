"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import React from "react";
import { ArrowUpRight } from "lucide-react";
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
  neutral: "bg-surface text-foreground dark:bg-white/5 dark:text-white",
};

const metricIconToneMap: Record<MetricTone, string> = {
  brand: "bg-white/15 text-white",
  accent: "bg-[#fed7aa] text-[#9a3412] dark:bg-[#7c2d12] dark:text-[#ffedd5]",
  success: "bg-[#d1fae5] text-[#047857] dark:bg-[#064e3b] dark:text-[#d1fae5]",
  warning: "bg-[#fef3c7] text-[#92400e] dark:bg-[#78350f] dark:text-[#fef3c7]",
  danger: "bg-[#fee4e2] text-[#b42318] dark:bg-[#991b1b] dark:text-[#fee2e2]",
  neutral: "bg-[#f3f4f6] text-[#374151] dark:bg-white/8 dark:text-white/80",
};

// NOTE: The dead exports (VendorDesktopNav, VendorBottomTabs, VendorSolidCard,
// vendorPrimaryTabs, isVendorTabActive, VendorTabItem) have been removed.
// The shared VendorDrawer + VendorMobileNav now handle navigation.
// The live exports below are retained until all dashboard pages migrate to
// the shared @kwikseller/ui Vendor* components.

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
    <section className="flex min-w-0 flex-col gap-3 border-b border-kwik-border pb-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 font-heading text-xl font-semibold leading-tight text-foreground md:text-[22px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm font-normal leading-5 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </section>
  );
}

export function VendorToolbar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col gap-3 rounded-2xl border border-kwik-border bg-surface p-3 sm:flex-row sm:items-end",
        className,
      )}
    >
      {children}
    </section>
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
          <p className="text-4xl font-bold leading-none tracking-normal">
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
                : "border-black/10 text-foreground dark:border-white/10 dark:text-white",
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
    "group block rounded-2xl border border-kwik-border bg-surface p-5 transition hover:-translate-y-0.5 hover:shadow-sm",
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
            {title ? <h2 className="font-heading text-lg font-semibold leading-snug text-foreground">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
