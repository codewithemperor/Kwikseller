"use client";

import Link from "next/link";
import { LogOut, Mail, MapPin, PackageCheck, ShieldCheck, UserRound } from "lucide-react";
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
      <main className="bg-background px-4 py-6">
        <div className="container mx-auto max-w-2xl">
          <div className="h-32 animate-pulse bg-neutral-100 dark:bg-white/10" />
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <main className="bg-background px-4 py-6">
        <div className="container mx-auto max-w-2xl">
          <section className="border border-neutral-200 bg-background p-5 dark:border-white/10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent-soft-foreground">
              <UserRound className="h-6 w-6" />
            </div>
            <h1 className="mt-4 text-xl font-semibold text-kwik-dark dark:text-white">Your profile</h1>
            <p className="mt-2 text-sm leading-6 text-kwik-muted dark:text-white/60">
              Sign in to manage orders, delivery addresses, and account details.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Link href="/login">
                <AppButton fullWidth size="lg">Sign in</AppButton>
              </Link>
              <Link href="/register">
                <AppButton fullWidth size="lg" variant="secondary">Create account</AppButton>
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

  const groups = [
    {
      title: "Shopping",
      items: [
        { icon: PackageCheck, label: "Orders", text: "Track checkout and delivery", href: "/orders" },
        { icon: MapPin, label: "Delivery addresses", text: "Home, office, and saved locations", href: "/profile/addresses" },
      ],
    },
    {
      title: "Account",
      items: [
        { icon: ShieldCheck, label: "Verification", text: user.emailVerified ? "Email verified" : "Email pending", href: "/profile" },
        { icon: UserRound, label: "Role", text: user.role.toLowerCase().replace("_", " "), href: "/profile" },
      ],
    },
  ];

  return (
    <main className="bg-background px-4 py-6">
      <div className="container mx-auto max-w-2xl space-y-5">
        <section className="border border-neutral-200 bg-background p-4 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-kwik-dark text-lg font-bold text-white">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-semibold text-kwik-dark dark:text-white">{displayName}</h1>
              <p className="mt-1 flex min-w-0 items-center gap-1.5 text-sm text-kwik-muted dark:text-white/60">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{user.email}</span>
              </p>
            </div>
          </div>
        </section>

        {groups.map((group) => (
          <section key={group.title} className="space-y-2">
            <h2 className="px-1 text-xs font-semibold uppercase tracking-[0.18em] text-kwik-muted dark:text-white/45">{group.title}</h2>
            <div className="divide-y divide-neutral-200 border border-neutral-200 bg-background dark:divide-white/10 dark:border-white/10">
              {group.items.map((item) => (
                <Link key={item.label} href={item.href} className="flex items-center gap-3 px-4 py-3 transition hover:bg-neutral-50 dark:hover:bg-white/5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-kwik-orange/10 text-kwik-orange">
                    <item.icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-kwik-dark dark:text-white">{item.label}</span>
                    <span className="block truncate text-xs text-kwik-muted dark:text-white/55">{item.text}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}

        <section className="border border-red-100 bg-red-50 p-4 dark:border-red-400/20 dark:bg-red-950/20">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-red-900 dark:text-red-100">Session</h2>
              <p className="mt-1 text-xs text-red-700/75 dark:text-red-100/65">Sign out of this marketplace account.</p>
            </div>
            <AppButton
              size="sm"
              onClick={handleLogout}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </AppButton>
          </div>
        </section>
      </div>
    </main>
  );
}
