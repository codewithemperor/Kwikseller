"use client";

import { GuestRoute } from "@/components/auth/guest-route";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GuestRoute>
      <div className="min-h-screen bg-linear-to-br from-background to-default-100 dark:from-background dark:to-default-950">
        {/* Theme Toggle - Top Right */}
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        {/* Main Content */}
        <div className="min-h-screen">{children}</div>
      </div>
    </GuestRoute>
  );
}
