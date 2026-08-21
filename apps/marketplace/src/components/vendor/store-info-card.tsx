"use client";

import React from "react";
import {
  BadgeCheck,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCcw,
  Send,
  Star,
  TrendingUp,
  Instagram,
  Twitter,
  Facebook,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { kwikToast } from "@/lib/toast";

/**
 * Enriched store fields surfaced by the dummy /api/v1/stores/:slug endpoint
 * in cycle 6. Kept loose (all optional) so the component degrades gracefully
 * when the real backend hasn't shipped these fields yet.
 */
export interface StoreEnrichment {
  id: string;
  name: string;
  slug: string;
  location?: string;
  createdAt?: string;
  rating?: number;
  reviewCount?: number;
  productCount?: number;
  totalSales?: number;
  responseTimeHours?: number;
  fulfillmentHours?: number;
  responseRatePct?: number;
  returnPolicyDays?: number;
  storeHours?: { day: string; open: string; close: string; closed?: boolean }[];
  socialLinks?: { type: "instagram" | "twitter" | "facebook" | "whatsapp" | "tiktok"; url: string }[];
  badges?: string[];
  contactEmail?: string;
  phone?: string;
}

const SOCIAL_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  twitter: Twitter,
  facebook: Facebook,
  whatsapp: MessageCircle,
  tiktok: Globe,
};

function formatMemberSince(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-NG", { month: "long", year: "numeric" });
  } catch {
    return "";
  }
}

function getCurrentDayShort(): string {
  // JS getDay(): 0=Sun..6=Sat. Our storeHours use Mon/Tue/Wed/Thu/Fri/Sat/Sun.
  const map = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return map[new Date().getDay()];
}

function isStoreOpenNow(hours?: StoreEnrichment["storeHours"]): { open: boolean; label: string } {
  if (!hours || hours.length === 0) return { open: false, label: "Hours unavailable" };
  const today = getCurrentDayShort();
  const todayHours = hours.find((h) => h.day === today);
  if (!todayHours) return { open: false, label: "Hours unavailable" };
  if (todayHours.closed) return { open: false, label: "Closed today" };

  const now = new Date();
  const [oh, om] = todayHours.open.split(":").map(Number);
  const [ch, cm] = todayHours.close.split(":").map(Number);
  if (Number.isNaN(oh) || Number.isNaN(ch)) return { open: false, label: "Hours unavailable" };

  const openMins = oh * 60 + om;
  const closeMins = ch * 60 + cm;
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const isOpen = nowMins >= openMins && nowMins < closeMins;
  return {
    open: isOpen,
    label: isOpen
      ? `Open · until ${todayHours.close}`
      : `Closed · opens ${todayHours.open}`,
  };
}

function formatResponseTime(hours?: number): string {
  if (hours == null) return "—";
  if (hours < 1) return "<1h";
  if (hours === 1) return "~1h";
  if (hours < 24) return `~${hours}h`;
  const days = Math.round(hours / 24);
  return `~${days}d`;
}

/**
 * StoreInfoCard — vendor storefront enrichment section.
 * Shows: store stats (rating, sales, products, response), store hours grid,
 * return policy, contact info, social links, and a "Message vendor" CTA.
 */
export function StoreInfoCard({ store }: { store: StoreEnrichment }) {
  const memberSince = formatMemberSince(store.createdAt);
  const openState = isStoreOpenNow(store.storeHours);
  const today = getCurrentDayShort();

  const handleMessageVendor = () => {
    // In production this would open a chat thread. For the demo we surface
    // a toast and (when available) open WhatsApp.
    const wa = store.socialLinks?.find((s) => s.type === "whatsapp")?.url;
    if (wa) {
      window.open(wa, "_blank", "noopener,noreferrer");
      return;
    }
    kwikToast.success(`Starting a conversation with ${store.name}…`);
  };

  const stats = [
    {
      label: "Rating",
      value: store.rating ? store.rating.toFixed(1) : "—",
      sub: store.reviewCount ? `${store.reviewCount.toLocaleString()} reviews` : undefined,
      icon: Star,
    },
    {
      label: "Total sales",
      value: store.totalSales ? store.totalSales.toLocaleString() : "—",
      sub: "lifetime orders",
      icon: TrendingUp,
    },
    {
      label: "Products",
      value: store.productCount?.toLocaleString() ?? "—",
      sub: "live listings",
      icon: BadgeCheck,
    },
    {
      label: "Response time",
      value: formatResponseTime(store.responseTimeHours),
      sub: store.responseRatePct ? `${store.responseRatePct}% response rate` : undefined,
      icon: Clock,
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-kwik-dark md:text-2xl">About this store</h2>
          <p className="mt-1 text-sm text-kwik-gray-light">
            Verified vendor information, policies and contact channels.
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
            openState.open
              ? "border-kwik-green/30 bg-kwik-green-tint text-kwik-green"
              : "border-kwik-border bg-kwik-bg-surface text-kwik-gray"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${openState.open ? "bg-kwik-green" : "bg-kwik-gray-light"}`} />
          {openState.label}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Left: stats + badges + return policy */}
        <div className="space-y-4">
          {/* Stat grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-kwik-border-light bg-white p-4 transition-colors hover:border-kwik-orange/30 dark:border-white/10 dark:bg-white/5"
              >
                <s.icon className="h-4 w-4 text-kwik-orange" />
                <p className="mt-2 text-2xl font-bold text-kwik-dark">{s.value}</p>
                <p className="text-xs font-medium text-kwik-gray">{s.label}</p>
                {s.sub && <p className="mt-0.5 text-[10px] text-kwik-gray-light">{s.sub}</p>}
              </div>
            ))}
          </div>

          {/* Badges */}
          {store.badges && store.badges.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {store.badges.map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center gap-1 rounded-full border border-kwik-orange/30 bg-kwik-orange-tint px-3 py-1 text-xs font-semibold text-kwik-orange-dark"
                >
                  <BadgeCheck className="h-3 w-3" />
                  {badge}
                </span>
              ))}
            </div>
          )}

          {/* Return policy + fulfillment */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-kwik-border-light bg-kwik-bg-surface p-4">
              <div className="flex items-center gap-2">
                <RefreshCcw className="h-4 w-4 text-kwik-orange" />
                <h3 className="text-sm font-semibold text-kwik-dark">Return policy</h3>
              </div>
              <p className="mt-2 text-sm leading-5 text-kwik-gray">
                {store.returnPolicyDays != null
                  ? `Returns accepted within ${store.returnPolicyDays} day${store.returnPolicyDays === 1 ? "" : "s"} of delivery. Item must be unused and in original packaging.`
                  : "Returns accepted per Kwikseller's buyer protection policy. Contact vendor for details."}
              </p>
            </div>
            <div className="rounded-2xl border border-kwik-border-light bg-kwik-bg-surface p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-kwik-orange" />
                <h3 className="text-sm font-semibold text-kwik-dark">Fulfillment</h3>
              </div>
              <p className="mt-2 text-sm leading-5 text-kwik-gray">
                {store.fulfillmentHours != null
                  ? `Orders are processed within ${store.fulfillmentHours} hour${store.fulfillmentHours === 1 ? "" : "s"}. Manual dispatch via Kwikseller logistics.`
                  : "Orders processed via Kwikseller manual dispatch."}
                {memberSince && <> Vendor since {memberSince}.</>}
              </p>
            </div>
          </div>
        </div>

        {/* Right: store hours + contact + message CTA */}
        <div className="space-y-4">
          {/* Store hours */}
          {store.storeHours && store.storeHours.length > 0 && (
            <div className="rounded-2xl border border-kwik-border-light bg-white p-4 dark:border-white/10 dark:bg-white/5">
              <div className="mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-kwik-orange" />
                <h3 className="text-sm font-semibold text-kwik-dark">Store hours</h3>
                <span className="ml-auto text-xs text-kwik-gray-light">
                  {store.location ?? "Local time"}
                </span>
              </div>
              <ul className="space-y-1">
                {store.storeHours.map((h) => {
                  const isToday = h.day === today;
                  return (
                    <li
                      key={h.day}
                      className={`flex items-center justify-between rounded-md px-2 py-1 text-xs ${
                        isToday ? "bg-kwik-orange-tint font-semibold text-kwik-orange-dark" : "text-kwik-gray"
                      }`}
                    >
                      <span>{h.day}{isToday && <span className="ml-1 text-[10px] uppercase">today</span>}</span>
                      <span>{h.closed ? "Closed" : `${h.open} – ${h.close}`}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Contact info */}
          <div className="rounded-2xl border border-kwik-border-light bg-white p-4 dark:border-white/10 dark:bg-white/5">
            <div className="mb-3 flex items-center gap-2">
              <Mail className="h-4 w-4 text-kwik-orange" />
              <h3 className="text-sm font-semibold text-kwik-dark">Contact</h3>
            </div>
            <div className="space-y-1.5 text-xs text-kwik-gray">
              {store.location && (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-kwik-gray-light" />
                  <span>{store.location}</span>
                </div>
              )}
              {store.contactEmail && (
                <a
                  href={`mailto:${store.contactEmail}`}
                  className="flex items-start gap-2 hover:text-kwik-orange"
                >
                  <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-kwik-gray-light" />
                  <span className="truncate">{store.contactEmail}</span>
                </a>
              )}
              {store.phone && (
                <a href={`tel:${store.phone}`} className="flex items-start gap-2 hover:text-kwik-orange">
                  <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-kwik-gray-light" />
                  <span>{store.phone}</span>
                </a>
              )}
            </div>

            {/* Social links */}
            {store.socialLinks && store.socialLinks.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-kwik-border-light pt-3">
                {store.socialLinks.map((s) => {
                  const Icon = SOCIAL_ICON[s.type] ?? Globe;
                  return (
                    <a
                      key={s.type}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-kwik-border bg-kwik-bg-surface text-kwik-gray transition-colors hover:border-kwik-orange/40 hover:text-kwik-orange"
                      aria-label={`${store.name} on ${s.type}`}
                      title={s.type}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Message vendor CTA */}
          <button
            type="button"
            onClick={handleMessageVendor}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-kwik-gradient px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-kwik-orange/20 transition-transform hover:scale-[1.01] active:scale-[0.99]"
          >
            <Send className="h-4 w-4" />
            Message {store.name}
          </button>

          {/* View all products link */}
          <Link
            href={`/vendor/${store.slug}/products`}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-kwik-border-light bg-white px-4 py-3 text-sm font-semibold text-kwik-dark transition-colors hover:border-kwik-orange/40 hover:text-kwik-orange dark:border-white/10 dark:bg-white/5"
          >
            Browse all products
          </Link>
        </div>
      </div>
    </section>
  );
}

export default StoreInfoCard;
