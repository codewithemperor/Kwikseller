"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Truck,
  Star,
  Crown,
  Medal,
  Award,
  Bike,
  Car,
  Bus,
  Package,
  ChevronRight,
  Sparkles,
  Users,
  ClipboardList,
} from "lucide-react";
import {
  useDeliveryAgentLeaderboard,
  type AgentLeaderboardEntry,
  type DeliveryAgentInfo,
  type AgentRatingSummary,
} from "@/lib/order-api";
import { PageLoading } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { AppImage } from "@/components/ui/app-image";
import { cn } from "@/lib/utils";
import { AgentDetailModal } from "@/components/modals/agent-detail-modal";

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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
      <AgentDetailModal
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
