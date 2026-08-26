'use client'

import React from "react";
import { Spinner, Toast } from "@heroui/react";
import { cn } from "@/lib/utils";

const toastTone = {
  default: {
    shell: "border-zinc-950 bg-zinc-950 text-white",
    rail: "bg-white/70",
    icon: "bg-white/[0.12] text-white",
    title: "!text-white",
    description: "!text-zinc-200",
    action: "border-white/20 bg-white/[0.12] text-white hover:bg-white/[0.18]",
    close: "text-white/70 hover:bg-white/[0.12] hover:text-white",
  },
  accent: {
    shell: "border-kwik-orange bg-kwik-orange text-white",
    rail: "bg-white/75",
    icon: "bg-white/[0.14] text-white",
    title: "!text-white",
    description: "!text-orange-50",
    action: "border-white/25 bg-white/15 text-white hover:bg-white/[0.22]",
    close: "text-white/75 hover:bg-white/15 hover:text-white",
  },
  success: {
    shell: "border-emerald-700 bg-emerald-700 text-white",
    rail: "bg-emerald-100",
    icon: "bg-white/[0.14] text-white",
    title: "!text-white",
    description: "!text-emerald-50",
    action: "border-white/25 bg-white/15 text-white hover:bg-white/[0.22]",
    close: "text-white/75 hover:bg-white/15 hover:text-white",
  },
  warning: {
    shell: "border-amber-400 bg-amber-400 text-zinc-950",
    rail: "bg-zinc-950/70",
    icon: "bg-zinc-950/10 text-zinc-950",
    title: "!text-zinc-950",
    description: "!text-zinc-800",
    action: "border-zinc-950/15 bg-zinc-950/10 text-zinc-950 hover:bg-zinc-950/15",
    close: "text-zinc-950/65 hover:bg-zinc-950/10 hover:text-zinc-950",
  },
  danger: {
    shell: "border-rose-700 bg-rose-700 text-white",
    rail: "bg-rose-100",
    icon: "bg-white/[0.14] text-white",
    title: "!text-white",
    description: "!text-rose-50",
    action: "border-white/25 bg-white/15 text-white hover:bg-white/[0.22]",
    close: "text-white/75 hover:bg-white/15 hover:text-white",
  },
} as const;

/**
 * ToastProvider — client-only wrapper around HeroUI's Toast.Provider.
 *
 * `@heroui/react` re-exports `client-only`, so importing `Toast` directly
 * inside a Server Component (like `app/layout.tsx`) throws:
 *   `'client-only' cannot be imported from a Server Component module`.
 * This file is marked `'use client'` so the import is safe.
 */
export function ToastProvider({ children }: { children?: React.ReactNode }) {
  return (
    <>
      {children}
      <Toast.Provider
        placement="top end"
        maxVisibleToasts={3}
        gap={10}
        scaleFactor={0.03}
        width={420}
      >
        {({ toast: activeToast }) => {
          const content = activeToast.content ?? {};
          const variant = (content.variant ?? "default") as keyof typeof toastTone;
          const tone = toastTone[variant] ?? toastTone.default;

          return (
            <Toast
              toast={activeToast}
              variant={variant}
              className={cn(
                "relative overflow-hidden rounded-2xl border p-4 pr-10 shadow-[0_18px_60px_rgba(15,23,42,0.18)] ring-1 ring-white/10",
                "before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/35",
                tone.shell,
              )}
            >
              <span
                className={cn(
                  "absolute bottom-3 left-0 top-3 w-1 rounded-r-full",
                  tone.rail,
                )}
                aria-hidden
              />
              {content.indicator === null ? null : (
                <Toast.Indicator
                  variant={variant}
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    tone.icon,
                  )}
                >
                  {content.isLoading ? (
                    <Spinner color="current" size="sm" />
                  ) : (
                    content.indicator
                  )}
                </Toast.Indicator>
              )}
              <Toast.Content className="min-w-0 flex-1">
                {content.title && (
                  <Toast.Title className={cn("text-sm font-bold leading-5 tracking-[-0.01em]", tone.title)}>
                    {content.title}
                  </Toast.Title>
                )}
                {content.description && (
                  <Toast.Description className={cn("mt-1 text-xs font-medium leading-5", tone.description)}>
                    {content.description}
                  </Toast.Description>
                )}
              </Toast.Content>
              {content.actionProps?.children && (
                <Toast.ActionButton
                  {...content.actionProps}
                  className={cn(
                    "h-8 rounded-lg px-3 text-xs font-bold shadow-none transition-colors",
                    tone.action,
                  )}
                >
                  {content.actionProps.children}
                </Toast.ActionButton>
              )}
              <Toast.CloseButton
                className={cn(
                  "absolute right-2 top-2 rounded-lg border-none bg-transparent transition-colors",
                  tone.close,
                )}
              />
            </Toast>
          );
        }}
      </Toast.Provider>
    </>
  );
}

export default ToastProvider;
