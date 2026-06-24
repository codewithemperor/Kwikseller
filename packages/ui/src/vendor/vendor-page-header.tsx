"use client";

import React from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";

export interface VendorBreadcrumb {
  label: string;
  href?: string;
}

export interface VendorPageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: VendorBreadcrumb[];
  className?: string;
}

/**
 * VendorPageHeader - The single shared page header for all vendor dashboard pages.
 * Replaces the inconsistent mix of raw <h1>/<p> and the legacy VendorPageHeader
 * from vendor-dashboard-ui.tsx.
 */
export function VendorPageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  className,
}: VendorPageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn("flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}
    >
      <div className="min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav
            aria-label="Breadcrumb"
            className="mb-2 flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
          >
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <span key={`${crumb.label}-${idx}`} className="flex items-center gap-1">
                  {crumb.href && !isLast ? (
                    <a
                      href={crumb.href}
                      className="transition-colors hover:text-accent"
                    >
                      {crumb.label}
                    </a>
                  ) : (
                    <span className={cn(isLast && "font-medium text-foreground")}>
                      {crumb.label}
                    </span>
                  )}
                  {!isLast && <ChevronRight className="h-3 w-3 shrink-0 opacity-60" />}
                </span>
              );
            })}
          </nav>
        )}

        <h1 className="font-heading text-xl font-bold tracking-tight text-foreground md:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </motion.div>
  );
}

export default VendorPageHeader;
