"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { Bell, Clock, PackageSearch, Search, ShoppingBag, Store, UserRound, X } from "lucide-react";
import { ProtectedRoute } from "@/components/auth";
import {
  VendorBottomTabs,
  VendorDesktopNav,
} from "@/components/dashboard/vendor-dashboard-ui";
import { unwrapApiData } from "@/lib/vendor-format";
import { vendorCommerceApi } from "@kwikseller/api-client";
import type { Order } from "@kwikseller/types";
import { useAuthStore } from "@kwikseller/utils";

const activeOrderStatuses = new Set(["PENDING", "PAID", "CONFIRMED", "PROCESSING"]);

const VENDOR_SEARCH_RECENTS_KEY = "kwikseller_vendor_search_recents";

const quickVendorSearches = [
  { label: "Low stock", icon: Store },
  { label: "Active orders", icon: ShoppingBag },
  { label: "Pool products", icon: PackageSearch },
  { label: "Digital products", icon: Store },
];

function readVendorSearchRecents() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(VENDOR_SEARCH_RECENTS_KEY) || "[]") as string[];
  } catch {
    return [];
  }
}

function VendorSearchOverlay({
  isOpen,
  onClose,
  onSearch,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [query, setQuery] = React.useState("");
  const [recents, setRecents] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (!isOpen) return;
    setRecents(readVendorSearchRecents());
    const timer = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const submit = (value = query) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const nextRecents = [trimmed, ...recents.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 8);
    setRecents(nextRecents);
    window.localStorage.setItem(VENDOR_SEARCH_RECENTS_KEY, JSON.stringify(nextRecents));
    setQuery("");
    onSearch(trimmed);
  };

  const clearRecents = () => {
    setRecents([]);
    window.localStorage.removeItem(VENDOR_SEARCH_RECENTS_KEY);
  };

  if (!isOpen) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close search"
        className="fixed inset-0 z-[90] cursor-default bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      <section className="fixed inset-x-0 top-0 z-[100] mx-auto w-full max-w-2xl px-4 pt-4 sm:top-8 sm:pt-0">
        <div className="overflow-hidden rounded-2xl border border-border bg-background/95 backdrop-blur-xl">
          <div className="flex items-center gap-3 px-5 py-4">
            <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") submit();
              }}
              placeholder="Search products, Pool, or orders"
              className="min-w-0 flex-1 bg-transparent text-base font-medium text-foreground outline-none placeholder:text-muted-foreground"
              aria-label="Search vendor workspace"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-surface hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
            <kbd className="hidden rounded-md border border-border bg-surface px-2 py-1 font-mono text-[11px] text-muted-foreground sm:inline-flex">
              ESC
            </kbd>
          </div>
        </div>

        <div className="mt-2 max-h-[62vh] overflow-y-auto rounded-2xl border border-border bg-background/95 backdrop-blur-xl">
          {recents.length ? (
            <div className="p-4">
              <div className="mb-3 flex items-center justify-between px-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recent searches</p>
                <button type="button" onClick={clearRecents} className="text-xs font-semibold text-accent">
                  Clear all
                </button>
              </div>
              <div className="space-y-1">
                {recents.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => submit(item)}
                    className="grid w-full grid-cols-[32px_1fr_auto] items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-surface"
                  >
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate text-sm font-medium text-foreground">{item}</span>
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="border-t border-border p-4 first:border-t-0">
            <div className="mb-3 flex items-center gap-2 px-1">
              <PackageSearch className="h-4 w-4 text-accent" />
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quick search</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {quickVendorSearches.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => submit(item.label)}
                  className="grid grid-cols-[40px_1fr] items-center gap-3 rounded-xl p-3 text-left transition hover:bg-surface"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent-soft-foreground">
                    <item.icon className="h-4 w-4" />
                  </span>
                  <span className="font-semibold text-foreground">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 border-t border-border bg-surface/70 px-4 py-3 text-[11px] text-muted-foreground">
            <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono">Enter</kbd>
            <span>to search</span>
            <span>-</span>
            <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono">ESC</kbd>
            <span>to close</span>
          </div>
        </div>
      </section>
    </>
  );
}

export function VendorWorkspaceShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [orderCount, setOrderCount] = React.useState(0);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const vendorName =
    user?.store?.name || user?.profile?.firstName || user?.email || "Store workspace";
  const storeLogoUrl = (user?.store as { logoUrl?: string } | undefined)?.logoUrl;

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  React.useEffect(() => {
    let active = true;
    vendorCommerceApi
      .listOrders({ limit: 100 })
      .then((response) => {
        if (!active) return;
        const orders = unwrapApiData<Order[]>(response.data);
        setOrderCount(
          Array.isArray(orders)
            ? orders.filter((order) => activeOrderStatuses.has(order.status)).length
            : 0,
        );
      })
      .catch(() => {
        if (active) setOrderCount(0);
      });
    return () => {
      active = false;
    };
  }, []);

  const submitSearch = (query: string) => {
    setIsSearchOpen(false);
    router.push(query ? `/dashboard/search?q=${encodeURIComponent(query)}` : "/dashboard/search");
  };

  return (
    <ProtectedRoute requiredRole="VENDOR" loginPath="/login">
      <div className="min-h-screen bg-white text-foreground dark:bg-[#0f1115]">
        <VendorDesktopNav
          vendorName={vendorName}
          storeLogoUrl={storeLogoUrl}
          orderCount={orderCount}
          onLogout={handleLogout}
        />

        <div className="min-h-screen pb-28 lg:pl-72">
          <header className="sticky top-0 z-30 border-b border-border bg-white/72 backdrop-blur-xl dark:bg-[#10131a]/76">
            <div className="flex h-16 items-center justify-between gap-3 px-3 lg:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <Link
                  href="/dashboard"
                  className="flex min-w-0 items-center gap-2 px-0 py-1.5 lg:hidden"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-soft text-accent-soft-foreground">
                    {storeLogoUrl ? (
                      <img src={storeLogoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Store className="h-4 w-4" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-heading text-sm font-semibold text-foreground">
                      {vendorName}
                    </span>
                    <span className="block truncate text-[11px] font-medium text-muted-foreground">
                      Vendor workspace
                    </span>
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="hidden h-10 w-[min(380px,42vw)] items-center gap-3 rounded-2xl border border-border bg-white px-4 text-left text-sm text-muted-foreground transition hover:border-accent dark:bg-white/5 md:flex"
                >
                  <Search className="h-4 w-4" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">Search anything</span>
                  <span className="text-xs font-semibold text-accent">
                    Search
                  </span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  aria-label="Search"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-foreground ring-1 ring-border transition hover:bg-surface dark:bg-white/5 md:hidden"
                >
                  <Search className="h-5 w-5" />
                </button>
                <Link
                  href="/dashboard/orders"
                  aria-label="Orders"
                  className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-foreground ring-1 ring-border transition hover:bg-surface dark:bg-white/5"
                >
                  <Bell className="h-5 w-5" />
                  {orderCount ? (
                    <span className="absolute right-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-danger-foreground">
                      {orderCount > 99 ? "99+" : orderCount}
                    </span>
                  ) : null}
                </Link>
                <Link
                  href="/dashboard/profile"
                  aria-label="Profile"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent-soft-foreground transition hover:brightness-95"
                >
                  <UserRound className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1500px] px-4 py-5 lg:px-7 lg:py-6">
            {children}
          </main>
        </div>

        <VendorSearchOverlay
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onSearch={submitSearch}
        />
        <VendorBottomTabs orderCount={orderCount} />
      </div>
    </ProtectedRoute>
  );
}
