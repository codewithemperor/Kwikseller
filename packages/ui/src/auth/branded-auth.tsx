"use client";

import React from "react";
import { ShieldCheck } from "lucide-react";
import { cn } from "../lib/utils";

export type KwiksellerLogoProps = {
  src?: string;
  darkSrc?: string;
  alt?: string;
  className?: string;
};

export function KwiksellerLogo({
  src = "/logo-full-dark.png",
  darkSrc = "/logo-full.png",
  alt = "Kwikseller",
  className,
}: KwiksellerLogoProps) {
  return (
    <>
      <img
        src={src}
        alt={alt}
        className={cn("h-9 w-auto dark:hidden", className)}
      />
      <img
        src={darkSrc}
        alt={alt}
        className={cn("hidden h-9 w-auto dark:block", className)}
      />
    </>
  );
}

export type BrandedAuthHeaderProps = {
  title: string;
  description: string;
  badge?: string;
  logoSrc?: string;
  logoDarkSrc?: string;
  logoClassName?: string;
  className?: string;
};

export function BrandedAuthHeader({
  title,
  description,
  badge,
  logoSrc,
  logoDarkSrc,
  logoClassName,
  className,
}: BrandedAuthHeaderProps) {
  return (
    <div className={cn("mb-8", className)}>
      <KwiksellerLogo src={logoSrc} darkSrc={logoDarkSrc} className={logoClassName} />
      {badge && (
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent-soft px-3 py-1 text-xs font-semibold text-accent-soft-foreground dark:bg-white/5">
          <ShieldCheck className="h-3.5 w-3.5" />
          {badge}
        </div>
      )}
      <h1 className="mt-5 font-heading text-3xl font-semibold tracking-normal text-foreground dark:text-white">
        {title}
      </h1>
      <p className="mt-3 max-w-sm text-sm leading-6 text-muted dark:text-white/60">
        {description}
      </p>
    </div>
  );
}

export type BrandedAuthSidePanelProps = {
  eyebrow: string;
  title: string;
  description: string;
  points: Array<{
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    text: string;
  }>;
  footer: string;
  backHref?: string;
  logoSrc?: string;
};

export function BrandedAuthSidePanel({
  eyebrow,
  title,
  description,
  points,
  footer,
  backHref = "/",
  logoSrc = "/logo-full.png",
}: BrandedAuthSidePanelProps) {
  return (
    <section className="hidden border-r border-white/10 bg-[#061a32] text-white lg:flex lg:flex-col">
      <div className="flex items-center justify-between px-10 py-8">
        <a
          href={backHref}
          className="text-sm font-semibold text-white/75 transition hover:text-white"
        >
          {eyebrow}
        </a>
        <img src={logoSrc} alt="Kwikseller" className="h-9 w-auto" />
      </div>

      <div className="flex flex-1 flex-col justify-center px-10 py-12">
        <h1 className="max-w-xl font-heading text-4xl font-semibold leading-tight tracking-normal">
          {title}
        </h1>
        <p className="mt-5 max-w-lg text-base leading-7 text-white/70">
          {description}
        </p>

        <div className="mt-12 grid gap-3">
          {points.map((item) => (
            <div key={item.title} className="border border-white/12 bg-white/[0.03] p-4">
              <div className="flex items-start gap-3">
                <item.icon className="mt-0.5 h-5 w-5 text-accent" />
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-white/62">{item.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10 px-10 py-6 text-sm text-white/70">
        {footer}
      </div>
    </section>
  );
}

export type BrandedAuthLayoutProps = {
  children: React.ReactNode;
  sidePanel: BrandedAuthSidePanelProps;
  mobileLabel: string;
  showMobileHeader?: boolean;
  copyright?: string;
  formClassName?: string;
};

export function BrandedAuthLayout({
  children,
  sidePanel,
  mobileLabel,
  showMobileHeader = true,
  copyright,
  formClassName,
}: BrandedAuthLayoutProps) {
  return (
    <main className="min-h-screen bg-background text-foreground dark:bg-[#07111f] dark:text-white">
      <div className="grid min-h-screen lg:grid-cols-[minmax(420px,0.92fr)_minmax(520px,1fr)]">
        <BrandedAuthSidePanel {...sidePanel} />
        <section className="flex min-h-screen flex-col">
          {showMobileHeader ? (
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-white/10 lg:hidden">
              <a href={sidePanel.backHref ?? "/"} className="text-sm font-semibold text-kwik-muted dark:text-white/70">
                {mobileLabel}
              </a>
              <KwiksellerLogo />
            </div>
          ) : null}
          <div className="flex flex-1 items-center justify-center px-5 py-8 sm:px-8">
            <div className={cn("w-full max-w-[480px]", formClassName)}>{children}</div>
          </div>
          {copyright ? (
            <p className="border-t border-neutral-200 px-5 py-4 text-center text-xs text-muted dark:border-white/10 dark:text-white/50">
              {copyright}
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
