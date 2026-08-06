"use client";

import React from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Calendar,
  Globe,
  Globe2,
  Heart,
  Instagram,
  MapPin,
  MessageCircle,
  Package,
  Share2,
  ShoppingBag,
  Star,
  TrendingUp,
  Twitter,
  Facebook,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import { kwikToast } from "@kwikseller/utils";
import { cn } from "@/lib/utils";

/**
 * Enriched brand fields surfaced by the dummy /api/v1/brands endpoint
 * (cycle 7). Kept loose (all optional) so the component degrades gracefully
 * when the real backend hasn't shipped these fields yet.
 */
export interface BrandEnrichment {
  id: string;
  name: string;
  slug: string;
  story?: string;
  tagline?: string;
  foundedYear?: number;
  country?: string;
  headquarters?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  totalSales?: number;
  followCount?: number;
  verified?: boolean;
  badges?: string[];
  categories?: string[];
  socialLinks?: { type: string; url: string }[];
}

const SOCIAL_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  twitter: Twitter,
  facebook: Facebook,
  tiktok: Globe,
  youtube: Globe2,
  pinterest: Globe,
  whatsapp: MessageCircle,
};

function formatFollowers(n?: number): string {
  if (!n) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatSales(n?: number): string {
  if (!n) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/**
 * BrandInfoCard — "About this brand" section for the brand detail page.
 * Shows story, stats, badges, categories, social links, and CTAs.
 */
export function BrandInfoCard({
  brand,
  isFollowing,
  onToggleFollow,
}: {
  brand: BrandEnrichment;
  isFollowing: boolean;
  onToggleFollow: () => void;
}) {
  const stats: Array<{
    label: string;
    value: string;
    sub?: string;
    Icon: React.ComponentType<{ className?: string }>;
    tone: "orange" | "amber" | "green" | "violet";
  }> = [];

  if (typeof brand.rating === "number") {
    stats.push({
      label: "Rating",
      value: brand.rating.toFixed(1),
      sub: `${(brand.reviewCount ?? 0).toLocaleString()} reviews`,
      Icon: Star,
      tone: "amber",
    });
  }
  if (typeof brand.totalSales === "number") {
    stats.push({
      label: "Total sales",
      value: formatSales(brand.totalSales),
      sub: "lifetime orders",
      Icon: ShoppingBag,
      tone: "orange",
    });
  }
  if (typeof brand.followCount === "number") {
    stats.push({
      label: "Followers",
      value: formatFollowers(brand.followCount),
      sub: "across channels",
      Icon: Users,
      tone: "violet",
    });
  }
  if (typeof brand.foundedYear === "number") {
    const yearsActive = Math.max(1, new Date().getFullYear() - brand.foundedYear);
    stats.push({
      label: "Established",
      value: String(brand.foundedYear),
      sub: `${yearsActive} year${yearsActive === 1 ? "" : "s"} active`,
      Icon: Calendar,
      tone: "green",
    });
  }

  const toneClasses: Record<string, string> = {
    orange: "bg-kwik-orange/10 text-kwik-orange",
    amber: "bg-kwik-amber/10 text-kwik-amber",
    green: "bg-kwik-green/10 text-kwik-green",
    violet: "bg-kwik-violet-tint text-kwik-violet",
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="rounded-3xl border border-kwik-border-light bg-kwik-bg-surface p-5 sm:p-6"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading text-lg font-bold text-foreground">
          About this brand
        </h2>
        {brand.verified && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-kwik-green-tint px-3 py-1 text-xs font-semibold text-kwik-green">
            <BadgeCheck className="h-3.5 w-3.5" />
            Verified brand
          </span>
        )}
      </div>

      {/* Tagline */}
      {brand.tagline && (
        <p className="mt-3 text-sm font-medium italic text-kwik-orange-dark">
          &ldquo;{brand.tagline}&rdquo;
        </p>
      )}

      {/* Story */}
      {brand.story && (
        <p className="mt-3 text-sm leading-relaxed text-kwik-muted">
          {brand.story}
        </p>
      )}

      {/* Stats grid */}
      {stats.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.Icon;
            return (
              <div
                key={s.label}
                className="rounded-2xl border border-kwik-border-light bg-kwik-bg-page p-3"
              >
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg",
                    toneClasses[s.tone],
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <p className="mt-2 font-heading text-lg font-bold text-foreground">
                  {s.value}
                </p>
                <p className="text-xs font-medium text-foreground">{s.label}</p>
                {s.sub && <p className="text-[11px] text-kwik-muted">{s.sub}</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* Badges */}
      {brand.badges && brand.badges.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-kwik-muted">
            Highlights
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {brand.badges.map((b) => (
              <span
                key={b}
                className="inline-flex items-center gap-1 rounded-full bg-kwik-orange-tint px-3 py-1 text-xs font-medium text-kwik-orange-dark"
              >
                <BadgeCheck className="h-3.5 w-3.5" />
                {b}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      {brand.categories && brand.categories.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-kwik-muted">
            Categories
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {brand.categories.map((c) => (
              <span
                key={c}
                className="inline-flex items-center rounded-full border border-kwik-border-light bg-kwik-bg-page px-3 py-1 text-xs font-medium text-kwik-muted"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Location + website row */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {brand.headquarters && (
          <div className="flex items-start gap-3 rounded-2xl border border-kwik-border-light bg-kwik-bg-page p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-kwik-orange/10">
              <MapPin className="h-4 w-4 text-kwik-orange" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-kwik-muted">Headquarters</p>
              <p className="truncate text-sm font-semibold text-foreground">
                {brand.headquarters}
              </p>
              {brand.country && (
                <p className="text-[11px] text-kwik-muted">{brand.country}</p>
              )}
            </div>
          </div>
        )}
        {brand.website && (
          <a
            href={brand.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 rounded-2xl border border-kwik-border-light bg-kwik-bg-page p-3 transition hover:border-kwik-orange/40 hover:bg-kwik-orange/5"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-kwik-violet-tint">
              <Globe className="h-4 w-4 text-kwik-violet" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-kwik-muted">Website</p>
              <p className="truncate text-sm font-semibold text-foreground">
                {brand.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              </p>
              <p className="text-[11px] text-kwik-muted">Opens in new tab</p>
            </div>
          </a>
        )}
      </div>

      {/* Social links + CTAs */}
      <div className="mt-5 flex flex-col gap-3 border-t border-kwik-border-light pt-4 sm:flex-row sm:items-center sm:justify-between">
        {brand.socialLinks && brand.socialLinks.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-kwik-muted">Follow:</span>
            {brand.socialLinks.map((s) => {
              const Icon = SOCIAL_ICON[s.type] ?? Globe;
              return (
                <a
                  key={s.type + s.url}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${brand.name} on ${s.type}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-kwik-border-light bg-kwik-bg-page text-kwik-muted transition hover:border-kwik-orange hover:bg-kwik-orange hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>
        ) : (
          <span className="text-xs text-kwik-muted">No social links</span>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (typeof navigator !== "undefined" && navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href).catch(() => {});
              }
              kwikToast.success("Brand link copied", {
                description: "Share this brand with your friends.",
              });
            }}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-kwik-border-light bg-kwik-bg-page px-4 text-sm font-semibold text-foreground transition hover:bg-kwik-bg-surface"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
          <button
            type="button"
            onClick={onToggleFollow}
            className={cn(
              "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-5 text-sm font-semibold transition",
              isFollowing
                ? "border border-kwik-orange bg-kwik-orange-tint text-kwik-orange-dark"
                : "bg-kwik-gradient text-white hover:opacity-90",
            )}
          >
            <Heart
              className={cn("h-4 w-4", isFollowing && "fill-current")}
            />
            {isFollowing ? "Following" : "Follow"}
          </button>
        </div>
      </div>

      {/* Browse products CTA */}
      <Link
        href={`/products?brandId=${brand.id}`}
        className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-kwik-border-light bg-kwik-bg-page text-sm font-semibold text-foreground transition hover:border-kwik-orange hover:text-kwik-orange"
      >
        <Package className="h-4 w-4" />
        Browse all {brand.name} products
      </Link>
    </motion.section>
  );
}

/**
 * Compact stats strip shown at the top of the brand detail page hero.
 */
export function BrandStatsStrip({
  brand,
}: {
  brand: Pick<
    BrandEnrichment,
    "rating" | "reviewCount" | "totalSales" | "followCount" | "foundedYear"
  >;
}) {
  const items: Array<{
    label: string;
    value: string;
    Icon: React.ComponentType<{ className?: string }>;
  }> = [];

  if (typeof brand.rating === "number") {
    items.push({
      label: "Rating",
      value: `${brand.rating.toFixed(1)}★`,
      Icon: Star,
    });
  }
  if (typeof brand.totalSales === "number") {
    items.push({
      label: "Sales",
      value: formatSales(brand.totalSales),
      Icon: TrendingUp,
    });
  }
  if (typeof brand.followCount === "number") {
    items.push({
      label: "Followers",
      value: formatFollowers(brand.followCount),
      Icon: Users,
    });
  }
  if (typeof brand.foundedYear === "number") {
    items.push({
      label: "Since",
      value: String(brand.foundedYear),
      Icon: Calendar,
    });
  }

  if (items.length === 0) return null;

    return (
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
        {items.map((it, i) => {
          const Icon = it.Icon;
          return (
            <div
              key={it.label}
              className={cn(
                "flex items-center gap-2 text-sm",
                i > 0 && "sm:border-l sm:border-kwik-border-light sm:pl-6",
              )}
            >
              <Icon className="h-4 w-4 text-kwik-orange" />
              <span className="font-semibold text-foreground">{it.value}</span>
              <span className="text-xs text-kwik-muted">{it.label}</span>
            </div>
          );
        })}
      </div>
    );
}
