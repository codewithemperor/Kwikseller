"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Tag,
  Copy,
  Check,
  Sparkles,
  Flame,
  Gift,
  Store,
  Calendar,
  Sun,
  TrendingUp,
  ShoppingBag,
  Truck,
  Info,
} from "lucide-react";
import { kwikToast } from "@/lib/toast";
import { AccountLayout } from "@/components/layout/account-layout";
import { PageLoading } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { useCoupons, type Coupon, type CouponCategory } from "@/lib/api-hooks";
import { cn } from "@/lib/utils";

// ─── Helpers ────────────────────────────────────────────────────────────

function formatNGN(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}

function daysUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86400000));
}

function discountLabel(c: Coupon): string {
  if (c.discountType === "PERCENT") return `${c.discountValue}% OFF`;
  if (c.discountType === "AMOUNT") return `${formatNGN(c.discountValue)} OFF`;
  return "FREE DELIVERY";
}

function discountTone(c: Coupon): string {
  if (c.discountType === "FREE_DELIVERY") return "bg-kwik-green/10 text-kwik-green";
  if (c.discountType === "AMOUNT") return "bg-kwik-amber/10 text-kwik-amber";
  return "bg-kwik-orange/10 text-kwik-orange";
}

/**
 * Accent-aware tone: uses the coupon's `accentColor` if set, falling back to
 * the discountType-based tone. Useful for seasonal/branded coupons.
 */
function accentTone(c: Coupon): string {
  switch (c.accentColor) {
    case "violet":
      return "bg-kwik-violet-tint text-kwik-violet";
    case "rose":
      return "bg-kwik-rose-tint text-kwik-rose";
    case "emerald":
      return "bg-kwik-emerald-tint text-kwik-emerald";
    case "amber":
      return "bg-kwik-amber/10 text-kwik-amber";
    case "orange":
      return "bg-kwik-orange/10 text-kwik-orange";
    default:
      return discountTone(c);
  }
}

// ─── Category tabs ──────────────────────────────────────────────────────

type Tab = "ALL" | CouponCategory;

const TABS: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "ALL", label: "All", icon: Sparkles },
  { key: "WELCOME", label: "Welcome", icon: Gift },
  { key: "FLASH", label: "Flash", icon: Flame },
  { key: "FESTIVE", label: "Festive", icon: Calendar },
  { key: "SEASONAL", label: "Seasonal", icon: Sun },
  { key: "VENDOR", label: "Vendor", icon: Store },
  { key: "LOYALTY", label: "Loyalty", icon: TrendingUp },
];

// Static map for category icons (resolved outside of render).
const CATEGORY_ICON: Record<CouponCategory, React.ComponentType<{ className?: string }>> = {
  WELCOME: Gift,
  FLASH: Flame,
  FESTIVE: Calendar,
  SEASONAL: Sun,
  VENDOR: Store,
  LOYALTY: TrendingUp,
};

// ─── Single coupon card ─────────────────────────────────────────────────

function CouponCard({ coupon, index }: { coupon: Coupon; index: number }) {
  const [copied, setCopied] = useState(false);
  const CatIcon = CATEGORY_ICON[coupon.category];
  const daysLeft = daysUntil(coupon.expiresAt);
  const redeemPct = Math.min(100, Math.round((coupon.totalRedeemed / coupon.totalBudget) * 100));
  const isLowBudget = redeemPct >= 80;

  function copyCode() {
    navigator.clipboard?.writeText(coupon.code);
    setCopied(true);
    kwikToast.success(`Code "${coupon.code}" copied — apply at checkout`);
    setTimeout(() => setCopied(false), 2200);
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.3) }}
      whileHover={{ y: -4 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-kwik-border-light bg-kwik-bg-surface shadow-sm transition-all duration-300 hover:border-kwik-orange/40 hover:shadow-lg hover:shadow-kwik-orange/10"
    >
      {/* Subtle gradient glow that fades in on hover (top-edge accent) */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-kwik-orange/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      {/* Top: discount badge strip */}
      <div className="flex items-center justify-between gap-2 border-b border-dashed border-kwik-border-light bg-kwik-bg-page/50 px-4 py-3">
        <span className={cn("inline-flex h-9 items-center gap-1 rounded-lg px-2.5 text-xs font-bold tracking-wide", accentTone(coupon))}>
          <CatIcon className="h-4 w-4" />
          {discountLabel(coupon)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          {coupon.badgeText && (
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", accentTone(coupon))}>
              <Sparkles className="h-3 w-3" />
              {coupon.badgeText}
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-kwik-bg-surface px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-kwik-muted">
            {coupon.category}
          </span>
        </span>
      </div>

      {/* Body: title + description + min order */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <h3 className="font-heading text-base font-semibold text-kwik-dark">{coupon.title}</h3>
          <p className="mt-1 text-sm text-kwik-muted">{coupon.description}</p>
        </div>

        {/* Min order + expiry */}
        <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-kwik-bg-page px-2.5 py-1.5">
            <p className="text-[10px] uppercase tracking-wide text-kwik-gray-light">Min order</p>
            <p className="font-semibold text-kwik-dark">{formatNGN(coupon.minOrder)}</p>
          </div>
          <div className="rounded-lg bg-kwik-bg-page px-2.5 py-1.5">
            <p className="text-[10px] uppercase tracking-wide text-kwik-gray-light">Expires in</p>
            <p className={cn("font-semibold", daysLeft <= 3 ? "text-kwik-red" : "text-kwik-dark")}>
              {daysLeft === 0 ? "Today" : `${daysLeft} day${daysLeft === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>

        {coupon.storeName && (
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-kwik-muted">
            <Store className="h-3.5 w-3.5" /> {coupon.storeName} only
          </p>
        )}

        {/* Budget usage bar — urgency cue */}
        <div className="mt-2">
          <div className="flex items-center justify-between text-[10px] text-kwik-gray-light">
            <span className="inline-flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {coupon.totalRedeemed.toLocaleString()} redeemed
            </span>
            <span>{redeemPct}%</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-kwik-bg-page">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                isLowBudget ? "bg-kwik-red" : "bg-gradient-to-r from-kwik-orange to-kwik-amber",
              )}
              style={{ width: `${redeemPct}%` }}
            />
          </div>
          {isLowBudget && (
            <p className="mt-1 text-[10px] font-medium text-kwik-red">
              Almost gone — {coupon.totalBudget - coupon.totalRedeemed} left
            </p>
          )}
        </div>

        {/* Code block + copy button */}
        <div className="mt-3 flex items-stretch gap-2">
          <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-xl border border-dashed border-kwik-orange/60 bg-kwik-orange/5 py-2.5">
            <span className="font-mono text-base font-bold tracking-[0.18em] text-kwik-orange">
              {coupon.code}
            </span>
            {/* Decorative perforation circles (coupon-ticket effect) */}
            <span className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-kwik-bg-surface" />
            <span className="absolute -right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-kwik-bg-surface" />
          </div>
          <button
            type="button"
            onClick={copyCode}
            aria-label={`Copy code ${coupon.code}`}
            className={cn(
              "inline-flex h-auto min-w-[64px] items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-kwik-orange/40 focus-visible:ring-offset-2",
              copied
                ? "bg-kwik-green text-white"
                : "bg-kwik-orange text-white hover:bg-kwik-orange-hover",
            )}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        {/* CTA: apply at checkout */}
        <Link
          href="/checkout"
          className="mt-1 inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-kwik-border-light bg-kwik-bg-page text-sm font-semibold text-kwik-dark transition hover:border-kwik-orange/40 hover:bg-kwik-bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-kwik-orange/40 focus-visible:ring-offset-2"
        >
          <ShoppingBag className="h-4 w-4 text-kwik-orange" />
          Apply at checkout
        </Link>
      </div>
    </motion.article>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────

function CouponsPageInner() {
  const [tab, setTab] = useState<Tab>("ALL");
  const { data: coupons, isLoading, isError, refetch } = useCoupons(tab);

  // Sort: expiring-soonest first, then by discount magnitude (heuristic for "best deal").
  const sorted = useMemo(() => {
    if (!coupons) return [];
    return [...coupons].sort((a, b) => {
      const da = new Date(a.expiresAt).getTime();
      const db = new Date(b.expiresAt).getTime();
      if (da !== db) return da - db;
      return b.discountValue - a.discountValue;
    });
  }, [coupons]);

  // Stats summary
  const stats = useMemo(() => {
    if (!coupons || coupons.length === 0) return null;
    const maxPercent = coupons
      .filter((c) => c.discountType === "PERCENT")
      .reduce((m, c) => Math.max(m, c.discountValue), 0);
    const freeDelivery = coupons.filter((c) => c.discountType === "FREE_DELIVERY").length;
    return { total: coupons.length, maxPercent, freeDelivery };
  }, [coupons]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-kwik-muted transition hover:text-kwik-dark"
      >
        <ArrowLeft className="h-4 w-4" /> Back to shop
      </Link>

      {/* Hero header */}
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 overflow-hidden rounded-3xl border border-kwik-border-light bg-gradient-to-br from-kwik-orange/10 via-kwik-bg-surface to-kwik-amber/5 p-6 sm:p-8"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-kwik-orange/15 px-2.5 py-1 text-xs font-semibold text-kwik-orange">
              <Tag className="h-3.5 w-3.5" />
              Promo codes
            </div>
            <h1 className="mt-3 font-heading text-2xl font-bold text-kwik-dark sm:text-3xl">
              Save more on every order
            </h1>
            <p className="mt-2 max-w-xl text-sm text-kwik-muted">
              Active coupon codes you can apply at checkout. Copy a code, drop it into the
              coupon box on the checkout page, and the discount is applied instantly.
            </p>
          </div>
          {stats && (
            <div className="grid grid-cols-3 gap-3 sm:w-[300px]">
              <div className="rounded-xl bg-kwik-bg-surface p-3 text-center shadow-sm">
                <p className="text-2xl font-bold text-kwik-orange">{stats.total}</p>
                <p className="text-[10px] uppercase tracking-wide text-kwik-muted">Active</p>
              </div>
              <div className="rounded-xl bg-kwik-bg-surface p-3 text-center shadow-sm">
                <p className="text-2xl font-bold text-kwik-orange">{stats.maxPercent}%</p>
                <p className="text-[10px] uppercase tracking-wide text-kwik-muted">Max off</p>
              </div>
              <div className="rounded-xl bg-kwik-bg-surface p-3 text-center shadow-sm">
                <p className="text-2xl font-bold text-kwik-orange">{stats.freeDelivery}</p>
                <p className="text-[10px] uppercase tracking-wide text-kwik-muted">Free ship</p>
              </div>
            </div>
          )}
        </div>
      </motion.header>

      {/* How it works strip */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { icon: Copy, title: "1. Copy a code", body: "Tap Copy on any coupon below." },
          { icon: ShoppingBag, title: "2. Shop & checkout", body: "Add items to cart and proceed to checkout." },
          { icon: Tag, title: "3. Apply & save", body: "Paste the code in the coupon box. Discount applies instantly." },
        ].map((step, i) => {
          const Icon = step.icon;
          return (
            <div
              key={i}
              className="flex items-start gap-3 rounded-2xl border border-kwik-border-light bg-kwik-bg-surface p-4"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-kwik-orange/10 text-kwik-orange">
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-kwik-dark">{step.title}</p>
                <p className="mt-0.5 text-xs text-kwik-muted">{step.body}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Category tabs */}
      <div className="sticky top-16 z-10 -mx-4 mt-6 bg-kwik-bg-page/95 px-4 py-2 backdrop-blur sm:mx-0 sm:rounded-xl sm:px-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                aria-pressed={active}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition-colors",
                  active
                    ? "bg-kwik-orange text-white shadow-sm shadow-kwik-orange/30"
                    : "border border-kwik-border-light bg-kwik-bg-surface text-kwik-muted hover:border-kwik-orange/30 hover:text-kwik-dark",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && <PageLoading label="Loading promo codes…" />}

      {/* Error state */}
      {isError && (
        <EmptyState
          variant="error"
          title="Couldn't load coupons"
          description="Please check your connection and try again."
          action={
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-kwik-orange px-5 text-sm font-semibold text-white transition hover:bg-kwik-orange-hover"
            >
              Retry
            </button>
          }
        />
      )}

      {/* Coupons grid */}
      {!isLoading && !isError && sorted.length > 0 && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sorted.map((c, i) => (
            <CouponCard key={c.id} coupon={c} index={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && sorted.length === 0 && (
        <EmptyState
          variant="default"
          icon={<Tag className="h-8 w-8" />}
          title="No coupons in this category yet"
          description="Check back soon — we drop new promo codes every week."
          action={
            <button
              type="button"
              onClick={() => setTab("ALL")}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-kwik-orange px-5 text-sm font-semibold text-white transition hover:bg-kwik-orange-hover"
            >
              View all coupons
            </button>
          }
        />
      )}

      {/* Footer note */}
      {!isLoading && !isError && sorted.length > 0 && (
        <div className="mt-8 rounded-2xl border border-kwik-border-light bg-kwik-bg-surface p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-kwik-orange/10 text-kwik-orange">
              <Info className="h-4 w-4" />
            </span>
            <div className="text-sm text-kwik-muted">
              <p className="font-semibold text-kwik-dark">Good to know</p>
              <ul className="mt-2 space-y-1.5 text-xs">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-kwik-orange" />
                  Only one coupon can be applied per order. Coupons cannot be stacked.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-kwik-orange" />
                  Vendor-specific codes only apply to items sold by that vendor.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-kwik-orange" />
                  If a coupon expires mid-checkout, the discount is removed automatically.
                </li>
                <li className="flex items-start gap-2">
                  <Truck className="h-3.5 w-3.5 shrink-0 text-kwik-orange" />
                  Free-delivery codes waive the standard delivery fee; express surcharge still applies.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CouponsPage() {
  return (
    <AccountLayout>
      <CouponsPageInner />
    </AccountLayout>
  );
}
