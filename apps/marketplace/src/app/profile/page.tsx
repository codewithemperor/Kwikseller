"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  LogOut,
  Mail,
  MapPin,
  PackageCheck,
  ShieldCheck,
  UserRound,
  Wallet,
  Star,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Award,
  ArrowRight,
} from "lucide-react";
import { kwikToast, useAuth } from "@kwikseller/utils";
import { AccountLayout } from "@/components/layout/account-layout";

// Mock data for demo mode (avoids importing the heavy order-workflow store
// which would bloat the profile page's compilation bundle).
const MOCK_ORDER_COUNT = 3;
const MOCK_TOTAL_SPENT = 89000;
const MOCK_RECENT_ORDERS = [
  { id: "order-aurora-001", ref: "KW-AUR-001", vendor: "Aurora General Trading", items: 2 },
  { id: "order-aurora-002", ref: "KW-AUR-002", vendor: "Aurora General Trading", items: 2 },
  { id: "order-aurora-003", ref: "KW-AUR-003", vendor: "Aurora General Trading", items: 1 },
];

function formatNGN(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}

function ProfilePageInner() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    kwikToast.success("Logged out successfully");
    window.location.href = "/";
  };

  if (isLoading) {
    return (
      <main className="bg-background px-4 py-6">
        <div className="container mx-auto max-w-3xl">
          <div className="h-32 animate-pulse bg-gray-100" />
        </div>
      </main>
    );
  }

  // Demo mode: show a rich profile with mock data when not authenticated
  const isDemoMode = !isAuthenticated || !user;

  // Mock profile data for demo mode
  const demoUser = {
    displayName: "Adaeze Okafor",
    email: "adaeze.okafor@example.com",
    emailVerified: true,
    role: "Buyer",
    memberSince: "January 2025",
    tier: "Gold",
    kwikCoins: 2450,
    kwikCoinsValue: 24500,
    totalOrders: MOCK_ORDER_COUNT,
    totalSpent: MOCK_TOTAL_SPENT,
  };

  const displayName = isDemoMode
    ? demoUser.displayName
    : [user!.profile?.firstName, user!.profile?.lastName].filter(Boolean).join(" ") ||
      user!.email.split("@")[0];

  const displayEmail = isDemoMode ? demoUser.email : user!.email;

  // Mock saved addresses
  const savedAddresses = [
    {
      id: "addr-1",
      label: "Home",
      line: "12 Allen Avenue, Ikeja",
      city: "Lagos",
      state: "Lagos",
      isDefault: true,
    },
    {
      id: "addr-2",
      label: "Office",
      line: "Plot 5, Victoria Island",
      city: "Lagos",
      state: "Lagos",
      isDefault: false,
    },
  ];

  const groups = [
    {
      title: "Shopping",
      items: [
        { icon: PackageCheck, label: "Orders", text: `${demoUser.totalOrders} order${demoUser.totalOrders !== 1 ? "s" : ""} placed`, href: "/orders" },
        { icon: MapPin, label: "Delivery addresses", text: `${savedAddresses.length} saved location${savedAddresses.length !== 1 ? "s" : ""}`, href: "/profile/addresses" },
        { icon: Wallet, label: "KwikCoins Wallet", text: `${demoUser.kwikCoins.toLocaleString()} coins available`, href: "/profile" },
      ],
    },
    {
      title: "Account",
      items: [
        { icon: ShieldCheck, label: "Verification", text: demoUser.emailVerified ? "Email verified" : "Email pending", href: "/profile" },
        { icon: UserRound, label: "Account type", text: demoUser.role, href: "/profile" },
        { icon: Award, label: "Membership tier", text: `${demoUser.tier} — member since ${demoUser.memberSince}`, href: "/profile" },
      ],
    },
  ];

  return (
    <main className="bg-background min-h-screen px-4 py-6">
      <div className="container mx-auto max-w-3xl space-y-5">
        {/* Demo mode banner */}
        {isDemoMode && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 rounded-xl border border-primary-200 bg-primary-50 p-4"
          >
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />
            <div className="text-sm leading-5 text-primary-800">
              <span className="font-semibold">Demo profile.</span> This is a
              sample buyer profile showing the full experience — order history,
              KwikCoins wallet, and saved addresses. Sign in to see your real
              data.
            </div>
          </motion.div>
        )}

        {/* Profile header */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-2xl border border-border bg-surface"
        >
          <div className="kwik-gradient px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/20 text-lg font-bold text-white backdrop-blur">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="truncate font-heading text-xl font-bold text-white">
                  {displayName}
                </h1>
                <p className="mt-1 flex min-w-0 items-center gap-1.5 text-sm text-white/85">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{displayEmail}</span>
                </p>
              </div>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                {demoUser.tier} Member
              </span>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 divide-x divide-border">
            <div className="p-4 text-center">
              <p className="font-heading text-xl font-bold text-foreground">
                {demoUser.totalOrders}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">Orders</p>
            </div>
            <div className="p-4 text-center">
              <p className="font-heading text-xl font-bold text-foreground">
                {formatNGN(demoUser.totalSpent)}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">Total spent</p>
            </div>
            <div className="p-4 text-center">
              <p className="font-heading text-xl font-bold text-secondary-600">
                {demoUser.kwikCoins.toLocaleString()}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">KwikCoins</p>
            </div>
          </div>
        </motion.section>

        {/* KwikCoins Wallet card */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="overflow-hidden rounded-2xl border border-border bg-surface"
        >
          <div className="kwik-gradient px-5 py-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/75">
                    KwikCoins Wallet
                  </p>
                  <p className="font-heading text-2xl font-bold">
                    {demoUser.kwikCoins.toLocaleString()}{" "}
                    <span className="text-sm font-normal text-white/75">coins</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/75">Worth</p>
                <p className="font-heading text-lg font-bold">
                  {formatNGN(demoUser.kwikCoinsValue)}
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 divide-x divide-border">
            <button
              type="button"
              onClick={() => kwikToast.info("Earn more KwikCoins", "Complete purchases and refer friends to earn coins.")}
              className="flex flex-col items-center gap-1 p-3 transition hover:bg-gray-50"
            >
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-xs font-medium text-foreground">Earn</span>
            </button>
            <button
              type="button"
              onClick={() => kwikToast.info("Redeem KwikCoins", "Use coins for discounts at checkout.")}
              className="flex flex-col items-center gap-1 p-3 transition hover:bg-gray-50"
            >
              <Star className="h-4 w-4 text-warning" />
              <span className="text-xs font-medium text-foreground">Redeem</span>
            </button>
            <button
              type="button"
              onClick={() => kwikToast.info("Transfer KwikCoins", "Send coins to friends and family.")}
              className="flex flex-col items-center gap-1 p-3 transition hover:bg-gray-50"
            >
              <ArrowRight className="h-4 w-4 text-primary-600" />
              <span className="text-xs font-medium text-foreground">Transfer</span>
            </button>
          </div>
        </motion.section>

        {/* Navigation groups */}
        {groups.map((group, gIdx) => (
          <motion.section
            key={group.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + gIdx * 0.05 }}
            className="space-y-2"
          >
            <h2 className="px-1 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              {group.title}
            </h2>
            <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
              {group.items.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-gray-50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                    <item.icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-foreground">{item.label}</span>
                    <span className="block truncate text-xs text-gray-500">{item.text}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                </Link>
              ))}
            </div>
          </motion.section>
        ))}

        {/* Saved addresses preview */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              Saved Addresses
            </h2>
            <Link
              href="/profile/addresses"
              className="text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              Manage
            </Link>
          </div>
          <div className="space-y-2">
            {savedAddresses.map((addr) => (
              <div
                key={addr.id}
                className="flex items-start gap-3 rounded-xl border border-border bg-surface p-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                  <MapPin className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{addr.label}</p>
                    {addr.isDefault && (
                      <span className="rounded-full bg-secondary-100 px-2 py-0.5 text-[10px] font-bold text-secondary-700">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {addr.line}, {addr.city}, {addr.state}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Recent orders preview */}
        {MOCK_RECENT_ORDERS.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                Recent Orders
              </h2>
              <Link
                href="/orders"
                className="text-xs font-medium text-primary-600 hover:text-primary-700"
              >
                View all
              </Link>
            </div>
            <div className="space-y-2">
              {MOCK_RECENT_ORDERS.slice(0, 3).map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 transition hover:bg-gray-50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                    <PackageCheck className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      Order {order.ref}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.vendor} • {order.items} item{order.items !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                </Link>
              ))}
            </div>
          </motion.section>
        )}

        {/* Auth actions */}
        <section className="rounded-2xl border border-border bg-surface p-4">
          {isDemoMode ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="flex h-11 flex-1 items-center justify-center rounded-xl bg-secondary-500 px-5 text-sm font-semibold text-white hover:bg-secondary-600"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="flex h-11 flex-1 items-center justify-center rounded-xl border border-border bg-background px-5 text-sm font-semibold text-foreground hover:bg-gray-100"
              >
                Create account
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Session</h2>
                <p className="mt-1 text-xs text-gray-500">Sign out of this account.</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-danger px-4 text-sm font-semibold text-white hover:bg-danger/90"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <AccountLayout>
      <ProfilePageInner />
    </AccountLayout>
  );
}
