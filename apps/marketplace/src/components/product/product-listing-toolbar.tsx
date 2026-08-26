"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ListingCrumb {
  label: string;
  href?: string;
}

interface ProductListingToolbarProps {
  breadcrumbs: ListingCrumb[];
  sortControl?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function ProductListingToolbar({
  breadcrumbs,
  sortControl,
  children,
  className,
}: ProductListingToolbarProps) {
  return (
    <div
      className={cn(
        "border-b border-border bg-background",
        className,
      )}
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 py-2">
          <nav
            className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground"
            aria-label="Breadcrumb"
          >
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <span key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
                  {crumb.href && !isLast ? (
                    <Link href={crumb.href} className="shrink-0 transition-colors hover:text-kwik-orange">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="truncate font-medium text-foreground">{crumb.label}</span>
                  )}
                  {!isLast ? <ChevronRight className="h-3 w-3 shrink-0" aria-hidden="true" /> : null}
                </span>
              );
            })}
          </nav>

          {sortControl ? <div className="shrink-0">{sortControl}</div> : null}
        </div>

        {children}
      </div>
    </div>
  );
}
