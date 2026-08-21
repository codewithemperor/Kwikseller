"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, ClipboardList, Info, Moon, ShoppingBag, Store, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { tokenManager } from "@/services/api-client";
import {
  StorefrontLoading,
  VendorStorefrontShell,
  useVendorStorefront,
} from "@/components/vendor/vendor-storefront";

export default function VendorMorePage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params.slug;
  const { store, isLoading } = useVendorStorefront(slug, { loadProducts: false });
  const { resolvedTheme, setTheme } = useTheme();

  React.useEffect(() => {
    if (!tokenManager.isAuthenticated()) {
      router.replace(`/login?redirect=/vendor/${slug}/more`);
    }
  }, [router, slug]);

  if (isLoading || !store) return <StorefrontLoading slug={slug} />;

  const isDark = resolvedTheme === "dark";

  return (
    <VendorStorefrontShell store={store} active="more">
      <section className="mx-auto grid max-w-5xl gap-3 px-4 py-5 lg:px-6">
        {[
          { href: `/vendor/${store.slug}/orders`, label: "Orders", text: "Purchases you made from this store.", icon: ClipboardList },
          { href: `/vendor/${store.slug}/details`, label: "Vendor details", text: "Store identity and fulfillment notes.", icon: Info },
          { href: `/vendor/${store.slug}/products`, label: "All products", text: "Search and filter this store catalog.", icon: Store },
          { href: "/", label: "Marketplace", text: "Go to the main marketplace.", icon: ShoppingBag },
        ].map((item) => (
          <Link key={item.label} href={item.href} className="grid min-w-0 grid-cols-[44px_minmax(0,1fr)_24px] items-center gap-3 border border-black/10 p-3 transition hover:border-[var(--store-accent)] dark:border-white/10">
            <div className="flex h-11 w-11 items-center justify-center bg-[var(--store-accent)]/10">
              <item.icon className="h-5 w-5 text-[var(--store-accent)]" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold">{item.label}</h2>
              <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-kwik-muted dark:text-white/60">{item.text}</p>
            </div>
            <ArrowRight className="h-4 w-4 justify-self-end" />
          </Link>
        ))}
        <div className="grid min-w-0 grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 border border-black/10 p-3 dark:border-white/10">
          <div className="flex h-11 w-11 items-center justify-center bg-[var(--store-accent)]/10">
            {isDark ? <Moon className="h-5 w-5 text-[var(--store-accent)]" /> : <Sun className="h-5 w-5 text-[var(--store-accent)]" />}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Display mode</p>
            <p className="text-[11px] text-kwik-muted dark:text-white/60">{isDark ? "Dark mode" : "Light mode"}</p>
          </div>
          <div className="justify-self-end">
            <button
              type="button"
              role="switch"
              aria-checked={isDark}
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="relative block h-8 w-16 rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--store-accent)]/30"
            >
              <span className={`absolute inset-0 rounded-full transition-colors ${isDark ? "bg-[var(--store-primary)]" : "bg-[var(--store-accent)]/80"}`} />
              <span
                className={`absolute top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[var(--store-primary)] shadow transition-transform ${
                  isDark ? "translate-x-9" : "translate-x-1"
                }`}
              >
                {isDark ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
              </span>
            </button>
          </div>
        </div>
      </section>
    </VendorStorefrontShell>
  );
}
