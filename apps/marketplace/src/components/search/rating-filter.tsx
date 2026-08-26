"use client";

import React from "react";
import { Checkbox } from "@heroui/react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingFilterProps {
  value?: number;
  onChange: (rating: number | undefined) => void;
}

const RATING_OPTIONS = [
  { value: 4, label: "4 stars & above" },
  { value: 3, label: "3 stars & above" },
  { value: 2, label: "2 stars & above" },
  { value: 1, label: "1 star & above" },
];

export function RatingFilter({ value, onChange }: RatingFilterProps) {
  return (
    <div className="space-y-1.5">
      {RATING_OPTIONS.map((opt) => {
        const isActive = value === opt.value;
        return (
          <Checkbox
            key={opt.value}
            isSelected={isActive}
            onChange={() => onChange(isActive ? undefined : opt.value)}
            className={cn(
              "group flex w-full rounded-lg px-2.5 py-2 text-sm transition-colors",
              isActive
                ? "bg-kwik-orange-tint text-kwik-orange font-medium"
                : "text-kwik-dark hover:bg-kwik-bg-light dark:text-white/80 dark:hover:bg-white/5",
            )}
          >
            <Checkbox.Content className="!flex !flex-row !items-center !gap-2">
              <Checkbox.Control className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-border bg-background text-accent-foreground shadow-none transition-colors group-data-[selected=true]:border-accent group-data-[selected=true]:bg-accent dark:border-white/20">
                <Checkbox.Indicator />
              </Checkbox.Control>
              <span className="flex min-w-0 flex-1 items-center gap-1">
                <span className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-3.5 w-3.5",
                        i < opt.value
                          ? "fill-kwik-amber text-kwik-amber"
                          : "fill-neutral-200 text-neutral-200 dark:fill-neutral-700 dark:text-neutral-700",
                      )}
                    />
                  ))}
                </span>
                <span className="truncate">{opt.label}</span>
              </span>
            </Checkbox.Content>
          </Checkbox>
        );
      })}
    </div>
  );
}
