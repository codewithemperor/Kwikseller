"use client";

import { GuestRoute } from "@/components/auth";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GuestRoute>
      <div className="relative min-h-screen overflow-x-hidden bg-linear-to-br from-background via-background to-orange-100/40 dark:from-background dark:via-background dark:to-orange-950/30">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -top-32 right-0 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />
          <div className="absolute -bottom-32 left-0 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl" />
        </div>

        <div className="fixed right-4 top-4 z-50">
          <ThemeToggle />
        </div>

        <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 sm:py-6">
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-md rounded-[32px] border border-border/60 bg-background/80 shadow-2xl backdrop-blur">
              <div className="min-h-[84vh] p-6 sm:p-8">{children}</div>
            </div>
          </div>

          <p className="mt-3 pb-2 text-center text-xs text-muted-foreground">
            Copyright 2026 Kwikseller. All rights reserved.
          </p>
        </div>
      </div>
    </GuestRoute>
  );
}
