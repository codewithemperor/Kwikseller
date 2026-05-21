"use client";

import Link from "next/link";
import { LogOut, Mail, PackageCheck, ShieldCheck, UserRound } from "lucide-react";
import { AppButton } from "@kwikseller/ui";
import { kwikToast, useAuth } from "@kwikseller/utils";

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    kwikToast.success("Logged out successfully");
    window.location.href = "/";
  };

  if (isLoading) {
    return (
      <main className="bg-white px-4 py-10 dark:bg-[#07111f]">
        <div className="container mx-auto max-w-2xl">
          <div className="h-40 animate-pulse rounded-md bg-neutral-100 dark:bg-white/10" />
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <main className="bg-white px-4 py-10 dark:bg-[#07111f]">
        <div className="container mx-auto max-w-2xl">
          <section className="border border-neutral-200 bg-background p-6 dark:border-white/10">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent-soft-foreground">
              <UserRound className="h-7 w-7" />
            </div>
            <h1 className="mt-5 text-2xl font-semibold text-kwik-dark dark:text-white">
              Your Kwikseller profile
            </h1>
            <p className="mt-2 text-sm leading-6 text-kwik-muted dark:text-white/60">
              Sign in to view your account, orders, wishlist, cart activity, and delivery details.
            </p>
            <div className="mt-6 flex gap-3">
              <Link href="/login" className="flex-1">
                <AppButton fullWidth size="lg">Sign in</AppButton>
              </Link>
              <Link href="/register" className="flex-1">
                <AppButton fullWidth size="lg" variant="secondary">
                  Create account
                </AppButton>
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const displayName =
    [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(" ") ||
    user.email.split("@")[0];

  return (
    <main className="bg-white px-4 py-10 dark:bg-[#07111f]">
      <div className="container mx-auto max-w-3xl space-y-6">
        <section className="border border-neutral-200 bg-background p-6 dark:border-white/10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-kwik-dark text-xl font-bold text-white">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-semibold text-kwik-dark dark:text-white">
                  {displayName}
                </h1>
                <p className="mt-1 flex items-center gap-2 text-sm text-kwik-muted dark:text-white/60">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </p>
              </div>
            </div>
            <AppButton variant="secondary" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </AppButton>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: PackageCheck, label: "Orders", text: "Track checkout and delivery", href: "/cart" },
            { icon: ShieldCheck, label: "Verified account", text: user.emailVerified ? "Email verified" : "Email pending", href: "/profile" },
            { icon: UserRound, label: "Account role", text: user.role.toLowerCase().replace("_", " "), href: "/profile" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="border border-neutral-200 bg-background p-4 transition hover:border-kwik-dark dark:border-white/10"
            >
              <item.icon className="h-5 w-5 text-kwik-orange" />
              <p className="mt-3 text-sm font-semibold text-kwik-dark dark:text-white">{item.label}</p>
              <p className="mt-1 text-xs leading-5 text-kwik-muted dark:text-white/55">{item.text}</p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
