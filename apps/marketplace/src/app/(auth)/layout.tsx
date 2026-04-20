"use client";

import Image from "next/image";
import { GuestRoute } from "@/components/auth/guest-route";
import { useTheme } from "next-themes";
import { cn } from "@kwikseller/ui";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  return (
    <GuestRoute>
      <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-background via-background to-sky-100/40 dark:from-background dark:via-background dark:to-sky-950/30">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -top-32 right-0 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" />
          <div className="absolute -bottom-32 left-0 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        </div>

        <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 sm:py-6">
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <div className="w-full max-w-md rounded-[32px] border border-border/60 bg-background/80 shadow-2xl backdrop-blur">
              <div className="max-h-[calc(100vh-6rem)] overflow-y-auto p-6 sm:p-8">
                <div className="mb-6 flex justify-center">
                  <Image
                    src="/logo-full.png"
                    alt="Kwikseller"
                    width={160}
                    height={40}
                    className={cn(
                      "hidden h-10 w-auto dark:block",
                      theme === "dark" ? "block" : "hidden",
                    )}
                    priority
                  />
                  <Image
                    src="/logo-full-dark.png"
                    alt="Kwikseller"
                    width={160}
                    height={40}
                    className={cn(
                      "hidden h-10 w-auto dark:block",
                      theme === "dark" ? "hidden" : "block",
                    )}
                    priority
                  />
                </div>
                {children}
              </div>
            </div>
          </div>

          <p className="shrink-0 mt-3 pb-2 text-center text-xs text-muted-foreground">
            Copyright 2026 Kwikseller. All rights reserved.
          </p>
        </div>
      </div>
    </GuestRoute>
  );
}
