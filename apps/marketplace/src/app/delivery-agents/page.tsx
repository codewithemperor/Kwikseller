"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Truck,
  Star,
  Crown,
  Medal,
  Award,
  Bike,
  Car,
  Bus,
  X,
  Package,
  ChevronRight,
  Sparkles,
  Users,
  ClipboardList,
} from "lucide-react";
import {
  useDeliveryAgentLeaderboard,
  useDeliveryAgent,
  type AgentLeaderboardEntry,
  type DeliveryAgentInfo,
  type AgentRatingSummary,
} from "@/lib/order-api";
import { PageLoading } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { AppImage } from "@/components/ui/app-image";
import { cn } from "@/lib/utils";

// ─── Helpers ────────────────────────────────────────────────────────────────

function VehicleIcon({
  type,
  className,
}: {
  type: DeliveryAgentInfo["vehicleType"];
  className?: string;
}) {
  if (type === "BIKE") return <Bike className={className} />;
  if (type === "CAR") return <Car className={className} />;
  if (type === "VAN") return <Bus className={className} />;
  return <Truck className={className} />;
}

function partnerColor(partner: DeliveryAgentInfo["partner"]) {
  switch (partner) {
    case "KwikLogistics":
      return "bg-kwik-orange-tint text-kwik-orange-dark";
    case "GIG Logistics":
      return "bg-kwik-blue/10 text-kwik-blue";
    case "Kwik Express":
      return "bg-kwik-violet-tint text-kwik-violet";
    default:
      return "bg-kwik-bg-light text-kwik-muted";
  }
}

function rankBadge(rank: number) {
  if (rank === 1) {
    return {
      className: "bg-gradient-to-br from-kwik-amber to-kwik-orange text-white shadow-md",
      Icon: Crown,
      label: "1",
    };
  }
  if (rank === 2) {
    return {
      className: "bg-gradient-to-br from-kwik-gray-light to-kwik-muted text-white shadow-md",
      Icon: Medal,
      label: "2",
    };
  }
  if (rank === 3) {
    return {
      className: "bg-gradient-to-br from-kwik-orange-dark to-kwik-orange text-white shadow-md",
      Icon: Award,
      label: "3",
    };
  }
  return {
    className: "bg-kwik-bg-light text-kwik-muted",
    Icon: null,
    label: String(rank),
  };
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function DeliveryAgentsPage() {
  const { data, isLoading } = useDeliveryAgentLeaderboard();
  const [openAgentId, setOpenAgentId] = useState<string | undefined>(undefined);

  const agents: AgentLeaderboardEntry[] = data ?? [];

  // Marketplace-wide summary stats.
  const totals = useMemo(() => {
    const totalAgents = agents.length;
    const totalRatedDeliveries = agents.reduce(
      (s, e) => s + e.summary.totalRatings,
      0,
    );
    const ratedAgents = agents.filter((e) => e.summary.totalRatings > 0);
    const avg =
      ratedAgents.length > 0
        ? ratedAgents.reduce((s, e) => s + e.summary.averageRating, 0) /
          ratedAgents.length
        : 0;
    return { totalAgents, totalRatedDeliveries, avg };
  }, [agents]);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      {/* Hero header */}
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl bg-kwik-gradient p-6 text-white shadow-lg sm:p-10"
      >
        {/* Decorative glow */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-12 h-48 w-48 rounded-full bg-kwik-orange/30 blur-3xl" />

        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
              <Truck className="h-3.5 w-3.5" />
              Marketplace couriers
            </div>
            <h1 className="mt-3 flex items-center gap-3 font-heading text-3xl font-bold sm:text-4xl">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                <Truck className="h-7 w-7" />
              </span>
              Delivery Agent Leaderboard
            </h1>
            <p className="mt-3 max-w-xl text-sm text-white/80 sm:text-base">
              Meet the couriers delivering your orders across Nigeria — rated by
              buyers like you.
            </p>
          </div>

          {/* Summary chips */}
          <div className="grid grid-cols-3 gap-3">
            <SummaryStat
              icon={<Users className="h-4 w-4" />}
              label="Agents"
              value={String(totals.totalAgents)}
            />
            <SummaryStat
              icon={<ClipboardList className="h-4 w-4" />}
              label="Rated deliveries"
              value={String(totals.totalRatedDeliveries)}
            />
            <SummaryStat
              icon={<Star className="h-4 w-4" />}
              label="Avg rating"
              value={totals.avg > 0 ? totals.avg.toFixed(2) : "—"}
            />
          </div>
        </div>
      </motion.header>

      {/* Content */}
      <div className="mt-8">
        {isLoading ? (
          <PageLoading label="Loading couriers…" />
        ) : agents.length === 0 ? (
          <EmptyState
            variant="default"
            icon={<Truck className="h-12 w-12" />}
            title="No delivery agents yet"
            description="When orders are shipped and rated, couriers will appear here on the leaderboard."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((entry, i) => (
              <AgentCard
                key={entry.agent.id}
                entry={entry}
                rank={i + 1}
                onView={() => setOpenAgentId(entry.agent.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail dialog */}
      <AgentDetailDialog
        agentId={openAgentId}
        onClose={() => setOpenAgentId(undefined)}
      />
    </div>
  );
}

// ─── Summary stat chip ──────────────────────────────────────────────────────

function SummaryStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white/10 px-3 py-2.5 text-center backdrop-blur-sm">
      <div className="flex items-center justify-center gap-1.5 text-white/70">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="mt-1 font-heading text-xl font-bold text-white">{value}</p>
    </div>
  );
}

// ─── Agent card ─────────────────────────────────────────────────────────────

function AgentCard({
  entry,
  rank,
  onView,
}: {
  entry: AgentLeaderboardEntry;
  rank: number;
  onView: () => void;
}) {
  const { agent, summary } = entry;
  const badge = rankBadge(rank);
  const BadgeIcon = badge.Icon;

  const topTags = summary.topTags.slice(0, 3);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: (rank - 1) * 0.05 }}
      className="relative flex flex-col overflow-hidden rounded-2xl border border-kwik-border-light bg-kwik-bg-surface shadow-sm transition hover:shadow-md"
    >
      {/* Rank badge */}
      <div className="absolute left-3 top-3 z-10">
        <span
          className={cn(
            "inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-full px-2 text-xs font-bold",
            badge.className,
          )}
          aria-label={`Rank ${rank}`}
        >
          {BadgeIcon && <BadgeIcon className="h-3.5 w-3.5" />}
          {badge.label}
        </span>
      </div>

      {/* Header — photo + name */}
      <div className="flex flex-col items-center px-5 pb-4 pt-8">
        <div className="relative">
          <AppImage
            src={agent.photo}
            alt={agent.name}
            fallbackClassName="h-20 w-20 rounded-full ring-4 ring-kwik-bg-surface"
            className="h-20 w-20 rounded-full ring-4 ring-kwik-bg-surface"
          />
          {/* Vehicle icon chip */}
          <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-kwik-bg-surface bg-kwik-orange-tint text-kwik-orange-dark">
            <VehicleIcon type={agent.vehicleType} className="h-4 w-4" />
          </span>
        </div>

        <h3 className="mt-3 text-center font-heading text-base font-bold text-foreground">
          {agent.name}
        </h3>
        <span
          className={cn(
            "mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
            partnerColor(agent.partner),
          )}
        >
          <Truck className="h-2.5 w-2.5" />
          {agent.partner}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-px border-y border-kwik-border-light bg-kwik-border-light">
        <div className="bg-kwik-bg-surface px-4 py-3 text-center">
          <p className="flex items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-kwik-muted">
            <Star className="h-3 w-3 text-kwik-amber" /> Rating
          </p>
          <p className="mt-0.5 font-heading text-lg font-bold text-foreground">
            {summary.averageRating > 0
              ? summary.averageRating.toFixed(1)
              : "—"}
            <span className="ml-1 text-xs font-normal text-kwik-muted">
              ({summary.totalRatings})
            </span>
          </p>
        </div>
        <div className="bg-kwik-bg-surface px-4 py-3 text-center">
          <p className="flex items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-kwik-muted">
            <Package className="h-3 w-3 text-kwik-orange" /> Deliveries
          </p>
          <p className="mt-0.5 font-heading text-lg font-bold text-foreground">
            {agent.totalDeliveries.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Vehicle plate */}
      <div className="flex items-center justify-between px-5 py-3 text-xs">
        <span className="inline-flex items-center gap-1.5 text-kwik-muted">
          <VehicleIcon type={agent.vehicleType} className="h-3.5 w-3.5" />
          {agent.vehicleType === "BIKE"
            ? "Bike"
            : agent.vehicleType === "CAR"
              ? "Car"
              : "Van"}
        </span>
        <span className="rounded-md border border-kwik-border-light bg-kwik-bg-page px-2 py-0.5 font-mono text-[11px] font-semibold text-foreground">
          {agent.vehiclePlate}
        </span>
      </div>

      {/* Top tags */}
      {topTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-5 pb-3">
          {topTags.map((t) => (
            <span
              key={t.tag}
              className="inline-flex items-center gap-1 rounded-full bg-kwik-orange-tint px-2 py-0.5 text-[10px] font-semibold text-kwik-orange"
            >
              <Sparkles className="h-2.5 w-2.5" />
              {t.tag}
              <span className="text-kwik-orange-dark/70">·{t.count}</span>
            </span>
          ))}
        </div>
      )}

      {/* View profile button */}
      <div className="mt-auto px-5 pb-5 pt-1">
        <button
          type="button"
          onClick={onView}
          className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-kwik-border-light bg-kwik-bg-page text-sm font-semibold text-foreground transition hover:border-kwik-orange hover:bg-kwik-orange-tint/40 hover:text-kwik-orange"
        >
          View profile
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </motion.article>
  );
}

// ─── Agent detail dialog ────────────────────────────────────────────────────

function AgentDetailDialog({
  agentId,
  onClose,
}: {
  agentId: string | undefined;
  onClose: () => void;
}) {
  const { data, isLoading } = useDeliveryAgent(agentId);
  const open = !!agentId;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Delivery agent profile"
        >
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal card */}
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 16 }}
            transition={{ type: "spring", duration: 0.32, bounce: 0.18 }}
            className="relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-kwik-border-light bg-kwik-bg-surface shadow-2xl sm:max-w-2xl sm:rounded-3xl"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 z-20 rounded-lg p-1.5 text-white/80 transition hover:bg-white/15 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header banner */}
            <AgentDialogHeader data={data} isLoading={isLoading} />

            {/* Body — scrollable */}
            <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-4">
              {isLoading || !data ? (
                <div className="py-12 text-center text-sm text-kwik-muted">
                  Loading agent profile…
                </div>
              ) : (
                <AgentDialogBody summary={data.summary} />
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

// ─── Dialog header ──────────────────────────────────────────────────────────

function AgentDialogHeader({
  data,
  isLoading,
}: {
  data:
    | {
        agent: DeliveryAgentInfo;
        summary: AgentRatingSummary;
      }
    | null
    | undefined;
  isLoading: boolean;
}) {
  if (isLoading || !data) {
    return (
      <div className="bg-kwik-gradient px-5 py-6">
        <p className="text-sm text-white/80">Loading agent profile…</p>
      </div>
    );
  }

  const { agent, summary } = data;

  return (
    <div className="relative bg-kwik-gradient px-5 py-6 text-white">
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex items-start gap-4">
        <AppImage
          src={agent.photo}
          alt={agent.name}
          fallbackClassName="h-16 w-16 rounded-2xl ring-2 ring-white/30"
          className="h-16 w-16 rounded-2xl ring-2 ring-white/30"
        />
        <div className="min-w-0 flex-1 pr-8">
          <h2 className="font-heading text-lg font-bold">{agent.name}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 font-semibold backdrop-blur-sm">
              <Truck className="h-2.5 w-2.5" />
              {agent.partner}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 font-semibold backdrop-blur-sm">
              <VehicleIcon type={agent.vehicleType} className="h-2.5 w-2.5" />
              {agent.vehicleType === "BIKE"
                ? "Bike"
                : agent.vehicleType === "CAR"
                  ? "Car"
                  : "Van"}{" "}
              · {agent.vehiclePlate}
            </span>
          </div>
          <p className="mt-2 text-xs text-white/80">
            <Package className="mr-1 inline h-3 w-3" />
            {agent.totalDeliveries.toLocaleString()} total deliveries ·{" "}
            {summary.totalRatings} buyer ratings
          </p>
        </div>
      </div>

      {/* Big average rating */}
      <div className="relative mt-4 flex items-end gap-3">
        <p className="font-heading text-4xl font-bold">
          {summary.averageRating > 0
            ? summary.averageRating.toFixed(1)
            : "—"}
        </p>
        <div className="mb-1.5 flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={cn(
                "h-4 w-4",
                s <= Math.round(summary.averageRating)
                  ? "fill-kwik-amber text-kwik-amber"
                  : "text-white/40",
              )}
            />
          ))}
        </div>
        <span className="mb-1.5 text-xs text-white/70">
          out of 5 · {summary.totalRatings} reviews
        </span>
      </div>
    </div>
  );
}

// ─── Dialog body ────────────────────────────────────────────────────────────

function AgentDialogBody({ summary }: { summary: AgentRatingSummary }) {
  const breakdown: Array<{ star: 1 | 2 | 3 | 4 | 5; count: number }> = [
    { star: 5, count: summary.ratingBreakdown[5] ?? 0 },
    { star: 4, count: summary.ratingBreakdown[4] ?? 0 },
    { star: 3, count: summary.ratingBreakdown[3] ?? 0 },
    { star: 2, count: summary.ratingBreakdown[2] ?? 0 },
    { star: 1, count: summary.ratingBreakdown[1] ?? 0 },
  ];
  const maxCount = Math.max(1, ...breakdown.map((b) => b.count));

  return (
    <div className="space-y-5">
      {/* Rating breakdown */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-wider text-kwik-muted">
          Rating breakdown
        </p>
        <div className="mt-2 space-y-1.5">
          {breakdown.map((b) => (
            <div key={b.star} className="flex items-center gap-3">
              <div className="flex w-12 items-center gap-1 text-xs font-medium text-foreground">
                {b.star}
                <Star className="h-3 w-3 fill-kwik-amber text-kwik-amber" />
              </div>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-kwik-bg-page">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-kwik-amber to-kwik-orange"
                  style={{
                    width: `${(b.count / maxCount) * 100}%`,
                  }}
                />
              </div>
              <span className="w-8 text-right text-xs font-medium text-kwik-muted">
                {b.count}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Top tags */}
      {summary.topTags.length > 0 && (
        <section>
          <p className="text-xs font-semibold uppercase tracking-wider text-kwik-muted">
            Most praised
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {summary.topTags.map((t) => (
              <span
                key={t.tag}
                className="inline-flex items-center gap-1 rounded-full bg-kwik-orange-tint px-2.5 py-1 text-xs font-semibold text-kwik-orange"
              >
                <Sparkles className="h-3 w-3" />
                {t.tag}
                <span className="text-kwik-orange-dark/70">·{t.count}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Recent ratings */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-wider text-kwik-muted">
          Recent ratings
        </p>
        {summary.recentRatings.length === 0 ? (
          <p className="mt-3 rounded-xl border border-kwik-border-light bg-kwik-bg-page px-4 py-6 text-center text-sm text-kwik-muted">
            No buyer ratings yet.
          </p>
        ) : (
          <ul className="mt-2 max-h-96 space-y-2 overflow-y-auto pr-1 scrollbar-thin">
            {summary.recentRatings.map((r) => (
              <li
                key={r.orderId}
                className="rounded-xl border border-kwik-border-light bg-kwik-bg-surface p-3"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {r.buyerName}
                    </span>
                    <Link
                      href={`/orders/${r.orderId}/track`}
                      className="font-mono text-[11px] text-kwik-orange hover:underline"
                    >
                      {r.orderNumber}
                    </Link>
                  </div>
                  <span className="text-[11px] text-kwik-muted">
                    {formatDate(r.createdAt)}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={cn(
                        "h-3 w-3",
                        s <= r.rating
                          ? "fill-kwik-amber text-kwik-amber"
                          : "text-kwik-border-light",
                      )}
                    />
                  ))}
                  <span className="ml-1.5 text-[11px] text-kwik-muted">
                    · {r.storeName}
                  </span>
                </div>
                {r.comment && (
                  <p className="mt-1.5 text-sm text-kwik-dark/90">
                    “{r.comment}”
                  </p>
                )}
                {r.tags.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {r.tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-0.5 rounded-full bg-kwik-bg-page px-1.5 py-0.5 text-[10px] font-medium text-kwik-muted"
                      >
                        <Sparkles className="h-2.5 w-2.5 text-kwik-orange" />
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
