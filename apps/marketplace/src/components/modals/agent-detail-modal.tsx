"use client";

import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Truck,
  Star,
  X,
  Package,
  Sparkles,
  Bike,
  Car,
  Bus,
} from "lucide-react";
import {
  useDeliveryAgent,
  type DeliveryAgentInfo,
  type AgentRatingSummary,
} from "@/lib/order-api";
import { AppImage } from "@/components/ui/app-image";
import { cn } from "@/lib/utils";

// ─── Helpers (modal-local) ──────────────────────────────────────────────────

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

// ─── Agent detail modal ────────────────────────────────────────────────────

interface AgentDetailModalProps {
  agentId: string | undefined;
  onClose: () => void;
}

export function AgentDetailModal({
  agentId,
  onClose,
}: AgentDetailModalProps) {
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
                    &ldquo;{r.comment}&rdquo;
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
