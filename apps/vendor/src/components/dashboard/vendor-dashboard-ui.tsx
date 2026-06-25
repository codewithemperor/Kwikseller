"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import React from "react";
import { ArrowUpRight, MoreVertical } from "lucide-react";
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
  brand: "bg-kwik-blue text-white",
  accent: "bg-accent-soft text-accent-soft-foreground",
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  danger: "bg-danger text-danger-foreground",
  neutral: "bg-surface text-foreground",
};

const metricIconToneMap: Record<MetricTone, string> = {
  brand: "bg-white/15 text-white",
  accent: "bg-accent text-accent-foreground",
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  danger: "bg-danger text-danger-foreground",
  neutral: "bg-default text-default-foreground",
};

function useClickOutside<T extends HTMLElement>(onClose: () => void) {
  const ref = React.useRef<T>(null);

  React.useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return ref;
}

function HeaderActionMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        aria-label="Page actions"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-9 w-9 items-center justify-center text-foreground transition hover:text-accent"
      >
        <MoreVertical className="h-5 w-5" strokeWidth={1.9} />
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-30 mt-2 min-w-44 rounded-xl border border-border bg-background p-2 shadow-xl">
          <div className="flex min-w-0 flex-col gap-1 [&>a]:justify-start [&>a]:rounded-lg [&>a]:px-2 [&>a]:py-2 [&>button]:justify-start [&>button]:rounded-lg [&>button]:px-2 [&>button]:py-2">
            {children}
          </div>
        </div>
      ) : null}
    </div>
  );
}

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
    <section className="flex min-w-0 items-start justify-between gap-3 border-b border-kwik-border pb-4">
      <div className="min-w-0 flex-1">
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
      {action ? <HeaderActionMenu>{action}</HeaderActionMenu> : null}
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
        "flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-background p-3 sm:flex-row sm:items-end",
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
  gradient = "from-kwik-green via-kwik-orange to-kwik-blue",
  className,
}: SummaryCardProps) {
  const hasCta = Boolean(ctaLabel && (href || onCtaClick));

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-xl bg-gradient-to-br p-5 text-white",
        gradient,
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.34),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.14),transparent_32%)]" />
      <div className={cn("relative flex flex-col", hasCta ? "min-h-[12.5rem] justify-between" : "min-h-36 justify-start")}>
        <div className="flex items-start justify-between gap-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
            {title}
          </p>
          {icon ? (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur-sm">
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
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", metricIconToneMap[tone])}>
          {icon}
        </div>
        {href ? (
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full border transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
              isBrand
                ? "border-white/30 text-white"
                : "border-border text-foreground",
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
    "group block rounded-xl border border-border bg-background p-5 transition hover:border-accent/40",
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
