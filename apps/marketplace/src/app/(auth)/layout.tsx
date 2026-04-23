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
      <div className="relative min-h-screen overflow-hidden bg-kwik-bg-page">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -top-32 right-0 h-80 w-80 rounded-full bg-kwik-orange/8 blur-3xl" />
          <div className="absolute -bottom-32 left-0 h-80 w-80 rounded-full bg-kwik-orange/5 blur-3xl" />
        </div>

        <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 sm:py-6">
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <div className="w-full max-w-md rounded-[24px] border border-kwik-border bg-background shadow-2xl">
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

          <p className="shrink-0 mt-3 pb-2 text-center text-xs text-kwik-gray-light">
            Copyright 2026 Kwikseller. All rights reserved.
          </p>
        </div>
      </div>
    </GuestRoute>
  );
}
