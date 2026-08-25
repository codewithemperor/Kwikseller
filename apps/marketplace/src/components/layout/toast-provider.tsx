'use client'

import React from "react";
import { Spinner, Toast } from "@heroui/react";
import { cn } from "@/lib/utils";

const toastToneClass = {
  default: "border-foreground bg-foreground text-background",
  accent: "border-kwik-orange bg-kwik-orange text-white",
  success: "border-success bg-success text-success-foreground",
  warning: "border-warning bg-warning text-warning-foreground",
  danger: "border-danger bg-danger text-danger-foreground",
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
          const variant = (content.variant ?? "default") as keyof typeof toastToneClass;

          return (
            <Toast
              toast={activeToast}
              variant={variant}
              className={cn(
                "rounded-xl border p-4 shadow-none",
                toastToneClass[variant],
              )}
            >
              {content.indicator === null ? null : (
                <Toast.Indicator
                  variant={variant}
                  className="mt-0.5 shrink-0 text-current"
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
                  <Toast.Title className="text-sm font-semibold leading-5">
                    {content.title}
                  </Toast.Title>
                )}
                {content.description && (
                  <Toast.Description className="mt-1 text-xs leading-5 text-current/80">
                    {content.description}
                  </Toast.Description>
                )}
              </Toast.Content>
              {content.actionProps?.children && (
                <Toast.ActionButton
                  {...content.actionProps}
                  className="h-8 rounded-md border border-white/25 bg-white/15 px-3 text-xs font-semibold text-current shadow-none hover:bg-white/20"
                >
                  {content.actionProps.children}
                </Toast.ActionButton>
              )}
              <Toast.CloseButton className="rounded-md border-none bg-transparent text-current/75 hover:bg-white/15 hover:text-current" />
            </Toast>
          );
        }}
      </Toast.Provider>
    </>
  );
}

export default ToastProvider;
