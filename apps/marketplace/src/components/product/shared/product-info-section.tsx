"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ProductInfoSectionProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  /** When provided, shows a "View all" link on the right. */
  viewAllHref?: string;
  viewAllLabel?: string;
}

/**
 * Reusable product information section wrapper.
 * Provides consistent borders, padding, heading, and optional icon.
 * NO gradients — clean borders and solid backgrounds only.
 */
export function ProductInfoSection({
  title,
  description,
  icon,
  children,
  className,
  contentClassName,
}: ProductInfoSectionProps) {
  return (
    <section className={cn("border border-border bg-white p-5 dark:border-white/10 dark:bg-white/5 sm:p-6", className)}>
      <div className="mb-4 flex items-center gap-3">
        {icon && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-kwik-orange/10">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-lg font-semibold text-kwik-dark dark:text-white sm:text-xl">{title}</h2>
          {description && (
            <p className="text-xs text-kwik-muted dark:text-white/55">{description}</p>
          )}
        </div>
      </div>
      <div className={contentClassName}>{children}</div>
    </section>
  );
}
