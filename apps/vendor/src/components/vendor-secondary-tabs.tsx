"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type VendorSecondaryTabItem = {
  label: string;
  value: string;
  count?: number;
};

export function VendorSecondaryTabs({
  items,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  items: VendorSecondaryTabItem[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <section className={cn("scrollbar-hide min-w-0 overflow-x-auto", className)}>
      <div
        className="inline-flex min-w-max rounded-xl bg-default p-1"
        role="tablist"
        aria-label={ariaLabel}
      >
        {items.map((item) => {
          const active = value === item.value;
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(item.value)}
              className={cn(
                "relative h-10 rounded-lg px-4 text-sm font-semibold transition",
                active
                  ? "bg-background text-accent shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
              {typeof item.count === "number" ? ` (${item.count})` : ""}
              {active ? (
                <span className="absolute inset-x-4 -bottom-1 h-0.5 rounded-full bg-accent" />
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
