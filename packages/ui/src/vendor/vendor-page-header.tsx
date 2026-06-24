"use client";

import React from "react";
import { motion } from "framer-motion";
import { ChevronRight, MoreVertical } from "lucide-react";
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
        <div className="absolute right-0 top-full z-30 mt-2 min-w-56 rounded-xl border border-border bg-background p-2 shadow-xl">
          <div className="flex min-w-0 flex-col gap-2">
            {children}
          </div>
        </div>
      ) : null}
    </div>
  );
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
      className={cn("flex items-start justify-between gap-3", className)}
    >
      <div className="min-w-0 flex-1">
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

      {actions ? <HeaderActionMenu>{actions}</HeaderActionMenu> : null}
    </motion.div>
  );
}

export default VendorPageHeader;
