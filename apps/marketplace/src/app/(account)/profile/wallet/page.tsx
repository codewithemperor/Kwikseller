"use client";

import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coins,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  Star,
  Crown,
  Award,
  Sparkles,
  ArrowLeft,
  Wallet as WalletIcon,
  Trophy,
  Zap,

  Check,
  Loader2,
  X,
  AlertTriangle,
  Clock,
  Copy,
  Share2,
  UserPlus,
  Users,
  Target,
  Flame,
  Search,
  Filter,
  Calendar,
  SlidersHorizontal,
  Download,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api-client";
import { PageLoading } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { kwikToast } from "@/lib/toast";
import { type WalletRedemptionType } from "@/lib/order-api";
import { RedeemModal } from "@/components/modals/redeem-modal";
import { toCSV, downloadCSV } from "@/lib/csv";
import { cn } from "@/lib/utils";

interface WalletTransaction {
  id: string;
  type: "CREDIT" | "DEBIT";
  amount: number;
  description: string;
  category: "ORDER_REWARD" | "SIGNUP_BONUS" | "REFERRAL" | "REDEMPTION" | "PURCHASE" | "AD_CREDIT" | "TIER_BONUS";
  createdAt: string;
}

interface ExpiringCoins {
  amount: number;
  expiresAt: string;
  reason?: string;
}

interface ReferralData {
  code: string;
  referralUrl: string;
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  coinsEarned: number;
  rewardPerReferral: number;
  friendReward: number;
  nextMilestone: number;
  milestoneBonus: number;
}

interface WalletData {
  balance: number;
  nairaEquivalent: number;
  tier: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
  tierProgress: number;
  nextTier: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
  nextTierThreshold: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  earningRate: number;
  transactions: WalletTransaction[];
  expiringCoins?: ExpiringCoins;
  referral?: ReferralData;
}

interface Tier {
  name: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
  minCoins: number;
  earningRate: number;
  color: string;
  perks: string[];
}

function formatDateTime(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatNGN(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}

const TIER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  BRONZE: Award,
  SILVER: Star,
  GOLD: Coins,
  PLATINUM: Crown,
};

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  ORDER_REWARD: Coins,
  SIGNUP_BONUS: Gift,
  REFERRAL: Sparkles,
  REDEMPTION: ArrowDownLeft,
  PURCHASE: ArrowDownLeft,
  AD_CREDIT: Zap,
  TIER_BONUS: Trophy,
};

function WalletContent() {
  const { data: wallet, isLoading } = useQuery<WalletData>({
    queryKey: ["wallet"],
    queryFn: async () => {
      const res = await api.get<WalletData>("wallet");
      return res.data;
    },
  });

  const { data: tiersData = [] } = useQuery<Tier[]>({
    queryKey: ["wallet", "tiers"],
    queryFn: async () => {
      const res = await api.get<Tier[]>("wallet/tiers");
      return res.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const [filter, setFilter] = React.useState<"ALL" | "CREDIT" | "DEBIT">("ALL");
  const [dateRange, setDateRange] = React.useState<"7d" | "30d" | "90d" | "all">("all");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("ALL");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  // ── Redemption modal state ──
  const [redeemOpen, setRedeemOpen] = React.useState(false);
  const [redeemType, setRedeemType] = React.useState<WalletRedemptionType>("CASH");

  function openRedeemModal(type: WalletRedemptionType) {
    setRedeemType(type);
    setRedeemOpen(true);
  }

  // ── Derived state (declared BEFORE any early return so the Rules of
  // Hooks aren't violated). All hooks gracefully handle `wallet` being
  // undefined by returning empty defaults.
  const transactions = wallet?.transactions ?? [];

  const txs = React.useMemo(() => {
    let list = transactions.slice();
    // Type filter
    if (filter !== "ALL") list = list.filter((t) => t.type === filter);
    // Category filter
    if (categoryFilter !== "ALL") list = list.filter((t) => t.category === categoryFilter);
    // Date range filter
    if (dateRange !== "all") {
      const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
      const cutoff = Date.now() - days * 86400000;
      list = list.filter((t) => new Date(t.createdAt).getTime() >= cutoff);
    }
    // Search filter (case-insensitive on description)
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (t) =>
          t.description.toLowerCase().includes(term) ||
          t.category.replace(/_/g, " ").toLowerCase().includes(term),
      );
    }
    return list;
  }, [transactions, filter, categoryFilter, dateRange, searchTerm]);

  // Available categories derived from the wallet's own transactions
  const availableCategories = React.useMemo(() => {
    const seen = new Set<string>();
    for (const t of transactions) seen.add(t.category);
    return Array.from(seen);
  }, [transactions]);

  const hasActiveFilters =
    filter !== "ALL" || categoryFilter !== "ALL" || dateRange !== "all" || searchTerm.trim().length > 0;

  function clearAllFilters() {
    setFilter("ALL");
    setCategoryFilter("ALL");
    setDateRange("all");
    setSearchTerm("");
  }

  // Export the currently-filtered transactions to CSV. Respects all active
  // filters (type, category, date range, search) so the buyer gets exactly
  // what they see on screen. Reuses the shared toCSV/downloadCSV utilities
  // (same as the orders page CSV export).
  //
  // The dummy wallet API doesn't return per-transaction running balances,
  // so we derive them locally from the FILTERED list (using only the
  // transactions the buyer is exporting — otherwise the numbers wouldn't
  // reconcile to `wallet.balance`). Algorithm:
  //   1. Sort the filtered txs oldest-first by `createdAt`.
  //   2. Compute totalDelta = sum(credits) - sum(debits).
  //   3. startingBalance = wallet.balance - totalDelta (the balance before
  //      the oldest filtered tx).
  //   4. Walk forward, applying each tx's delta to a running balance and
  //      recording it in a Map<txId, coinsAfter>.
  //   5. Emit CSV rows in the original `txs` order (matches what's on
  //      screen), looking up each row's "Coins After" from the Map.
  // After the most-recent filtered tx, the running balance equals
  // wallet.balance exactly.
  function handleExportCSV() {
    if (txs.length === 0) {
      kwikToast.error("No transactions to export", "Adjust your filters and try again.");
      return;
    }
    const currentBalance = wallet?.balance ?? 0;
    const totalDelta = txs.reduce(
      (sum, t) => sum + (t.type === "CREDIT" ? t.amount : -t.amount),
      0,
    );
    const coinsAfterById = new Map<string, number>();
    let running = currentBalance - totalDelta;
    // Walk oldest → newest by `createdAt` (the API list order isn't
    // guaranteed to be strictly chronological in dummy mode).
    const chronological = [...txs].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    for (const t of chronological) {
      running += t.type === "CREDIT" ? t.amount : -t.amount;
      coinsAfterById.set(t.id, running);
    }
    const rows = txs.map((t) => ({
      Date: new Date(t.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }),
      Type: t.type === "CREDIT" ? "Earned" : "Spent",
      Category: t.category.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
      Description: t.description,
      Amount: t.type === "CREDIT" ? `+${t.amount}` : `-${t.amount}`,
      "Coins After": coinsAfterById.get(t.id) ?? "",
    }));
    const csv = toCSV(rows);
    const date = new Date().toISOString().slice(0, 10);
    const suffix = hasActiveFilters ? "-filtered" : "";
    downloadCSV(`kwikseller-wallet${suffix}-${date}`, csv);
    kwikToast.success("CSV downloaded", `${txs.length} transaction${txs.length === 1 ? "" : "s"} exported.`);
  }

  if (isLoading) return <PageLoading label="Loading wallet…" />;

  if (!wallet) {
    return (
      <EmptyState
        variant="default"
        icon={<WalletIcon className="h-12 w-12" />}
        title="Wallet unavailable"
        description="We couldn't load your KwikCoins wallet right now."
      />
    );
  }

  const CurrentTierIcon = TIER_ICONS[wallet.tier] ?? Coins;

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/profile"
        className="inline-flex items-center gap-2 text-sm font-semibold text-kwik-muted transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Profile
      </Link>

      <h1 className="mt-3 font-heading text-2xl font-bold text-foreground">KwikCoins Wallet</h1>
      <p className="mt-1 text-sm text-kwik-muted">
        Earn coins on every order and redeem them for discounts, ad credit, and rewards.
      </p>

      {/* Balance card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 overflow-hidden rounded-3xl bg-kwik-gradient p-6 text-white shadow-lg sm:p-8"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-white/80">
              <Coins className="h-5 w-5" />
              <span className="text-sm font-medium uppercase tracking-wider">Current balance</span>
            </div>
            <p className="mt-2 font-heading text-4xl font-bold sm:text-5xl">
              {wallet.balance.toLocaleString()}{" "}
              <span className="text-lg font-medium text-white/80">KwikCoins</span>
            </p>
            <p className="mt-2 text-sm text-white/70">
              ≈ ₦{wallet.nairaEquivalent.toLocaleString()} value · {wallet.earningRate}× earning rate
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-sm">
            <CurrentTierIcon className="h-4 w-4" />
            <span className="text-sm font-semibold">{wallet.tier} Tier</span>
          </div>
        </div>

        {/* Tier progress */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-xs text-white/80">
            <span>Progress to {wallet.nextTier}</span>
            <span>{wallet.balance} / {wallet.nextTierThreshold}</span>
          </div>
          <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-white/20">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${wallet.tierProgress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full bg-white"
            />
          </div>
        </div>

        {/* Quick actions — wired to open the redemption modal */}
        <div className="mt-6 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => openRedeemModal("CASH")}
            className="flex flex-col items-center gap-1 rounded-xl bg-white/10 px-2 py-3 text-center backdrop-blur-sm transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <Gift className="h-5 w-5" />
            <span className="text-xs font-semibold">Redeem</span>
          </button>
          <button
            type="button"
            onClick={() => openRedeemModal("AD_CREDIT")}
            className="flex flex-col items-center gap-1 rounded-xl bg-white/10 px-2 py-3 text-center backdrop-blur-sm transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <Zap className="h-5 w-5" />
            <span className="text-xs font-semibold">Ad Credit</span>
          </button>
          <button
            type="button"
            onClick={() => openRedeemModal("TRANSFER")}
            className="flex flex-col items-center gap-1 rounded-xl bg-white/10 px-2 py-3 text-center backdrop-blur-sm transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <Sparkles className="h-5 w-5" />
            <span className="text-xs font-semibold">Transfer</span>
          </button>
        </div>
      </motion.div>

      {/* Expiring coins warning (cycle 7) */}
      {wallet.expiringCoins && wallet.expiringCoins.amount > 0 && (
        <ExpiringCoinsBanner expiring={wallet.expiringCoins} onRedeem={() => openRedeemModal("CASH")} />
      )}

      {/* Lifetime stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-kwik-border-light bg-kwik-bg-surface p-4">
          <div className="flex items-center gap-2 text-kwik-green">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Lifetime earned</span>
          </div>
          <p className="mt-2 font-heading text-xl font-bold text-foreground">
            {wallet.lifetimeEarned.toLocaleString()}
          </p>
          <p className="text-xs text-kwik-muted">KwikCoins</p>
        </div>
        <div className="rounded-2xl border border-kwik-border-light bg-kwik-bg-surface p-4">
          <div className="flex items-center gap-2 text-kwik-red">
            <TrendingDown className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Lifetime spent</span>
          </div>
          <p className="mt-2 font-heading text-xl font-bold text-foreground">
            {wallet.lifetimeSpent.toLocaleString()}
          </p>
          <p className="text-xs text-kwik-muted">KwikCoins</p>
        </div>
        <div className="col-span-2 rounded-2xl border border-kwik-border-light bg-kwik-bg-surface p-4 sm:col-span-1">
          <div className="flex items-center gap-2 text-kwik-orange">
            <Zap className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Earning rate</span>
          </div>
          <p className="mt-2 font-heading text-xl font-bold text-foreground">
            {wallet.earningRate}× <span className="text-sm font-normal text-kwik-muted">per ₦1,000</span>
          </p>
          <p className="text-xs text-kwik-muted">{wallet.tier} tier benefit</p>
        </div>
      </div>

      {/* Tiers */}
      {tiersData.length > 0 && (
        <div className="mt-6">
          <h2 className="font-heading text-lg font-bold text-foreground">Membership Tiers</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {tiersData.map((tier) => {
              const Icon = TIER_ICONS[tier.name] ?? Coins;
              const isCurrent = tier.name === wallet.tier;
              return (
                <motion.div
                  key={tier.name}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "rounded-2xl border p-4",
                    isCurrent
                      ? "border-kwik-orange bg-kwik-orange/5 ring-2 ring-kwik-orange/20"
                      : "border-kwik-border-light bg-kwik-bg-surface",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", `bg-${tier.color}/10`)}>
                      <Icon className={cn("h-5 w-5", `text-${tier.color}`)} />
                    </div>
                    {isCurrent && (
                      <span className="rounded-full bg-kwik-orange px-2 py-0.5 text-[10px] font-bold text-white">
                        CURRENT
                      </span>
                    )}
                  </div>
                  <p className="mt-3 font-heading text-sm font-bold text-foreground">{tier.name}</p>
                  <p className="text-xs text-kwik-muted">{tier.minCoins.toLocaleString()}+ coins · {tier.earningRate}× earning</p>
                  <ul className="mt-3 space-y-1">
                    {tier.perks.map((perk) => (
                      <li key={perk} className="flex items-start gap-1.5 text-xs text-kwik-muted">
                        <span className="mt-0.5 text-kwik-orange">•</span>
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Referral program (cycle 7) */}
      {wallet.referral && (
        <ReferralProgramCard referral={wallet.referral} />
      )}

      {/* Transactions */}
      <div className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-lg font-bold text-foreground">Transaction History</h2>
            <span className="rounded-full bg-kwik-orange-tint px-2 py-0.5 text-[11px] font-bold text-kwik-orange">
              {txs.length}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleExportCSV}
                disabled={txs.length === 0}
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-kwik-border-light bg-kwik-bg-surface px-3 text-xs font-semibold text-foreground transition hover:border-kwik-orange hover:text-kwik-orange focus:outline-none focus-visible:ring-2 focus-visible:ring-kwik-orange/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Export transactions to CSV"
                title="Export filtered transactions to CSV"
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </button>
              <span className="text-[10px] text-kwik-muted">with running balance</span>
            </div>
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition",
                showAdvanced
                  ? "bg-kwik-orange text-white"
                  : "border border-kwik-border-light text-kwik-muted hover:bg-kwik-bg-surface",
              )}
              aria-expanded={showAdvanced}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {showAdvanced ? "Hide filters" : "Filters"}
            </button>
          </div>
        </div>

        {/* Type filter chips — always visible */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {(["ALL", "CREDIT", "DEBIT"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "inline-flex h-8 items-center rounded-full px-3 text-xs font-medium transition",
                filter === f
                  ? "bg-kwik-orange text-white shadow-sm shadow-kwik-orange/20"
                  : "border border-kwik-border-light text-kwik-muted hover:bg-kwik-bg-surface",
              )}
            >
              {f === "ALL" ? "All" : f === "CREDIT" ? "Earned" : "Spent"}
            </button>
          ))}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="inline-flex h-8 items-center gap-1 rounded-full px-3 text-xs font-medium text-kwik-muted transition hover:bg-kwik-red/5 hover:text-kwik-red"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>

        {/* Advanced filter panel */}
        <AnimatePresence initial={false}>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-3 rounded-2xl border border-kwik-border-light bg-kwik-bg-surface p-4">
                {/* Search */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-kwik-muted">
                    <Search className="h-3 w-3" /> Search transactions
                  </label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-kwik-muted" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by description or category…"
                      className="h-9 w-full rounded-lg border border-kwik-border-light bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-kwik-muted/70 focus:border-kwik-orange focus:outline-none focus:ring-2 focus:ring-kwik-orange/20"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm("")}
                        aria-label="Clear search"
                        className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-kwik-muted hover:bg-kwik-red/10 hover:text-kwik-red"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Date range */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-kwik-muted">
                    <Calendar className="h-3 w-3" /> Date range
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {([
                      { v: "7d", label: "Last 7 days" },
                      { v: "30d", label: "Last 30 days" },
                      { v: "90d", label: "Last 90 days" },
                      { v: "all", label: "All time" },
                    ] as const).map((opt) => (
                      <button
                        key={opt.v}
                        type="button"
                        onClick={() => setDateRange(opt.v)}
                        className={cn(
                          "inline-flex h-8 items-center rounded-lg px-3 text-xs font-medium transition",
                          dateRange === opt.v
                            ? "bg-kwik-orange-tint text-kwik-orange"
                            : "border border-kwik-border-light text-kwik-muted hover:bg-background",
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-kwik-muted">
                    <Filter className="h-3 w-3" /> Category
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCategoryFilter("ALL")}
                      className={cn(
                        "inline-flex h-8 items-center rounded-lg px-3 text-xs font-medium transition",
                        categoryFilter === "ALL"
                          ? "bg-kwik-orange-tint text-kwik-orange"
                          : "border border-kwik-border-light text-kwik-muted hover:bg-background",
                      )}
                    >
                      All categories
                    </button>
                    {availableCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategoryFilter(cat)}
                        className={cn(
                          "inline-flex h-8 items-center rounded-lg px-3 text-xs font-medium transition",
                          categoryFilter === cat
                            ? "bg-kwik-orange-tint text-kwik-orange"
                            : "border border-kwik-border-light text-kwik-muted hover:bg-background",
                        )}
                      >
                        {cat.replace(/_/g, " ").toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty / no-results states */}
        {txs.length === 0 ? (
          <div className="mt-4">
            {hasActiveFilters ? (
              <EmptyState
                variant="default"
                icon={<Filter className="h-12 w-12" />}
                title="No matching transactions"
                description="Try adjusting your filters or search term to see more transactions."
                action={
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-kwik-orange px-5 text-sm font-semibold text-white hover:bg-kwik-orange-hover"
                  >
                    Clear all filters
                  </button>
                }
              />
            ) : (
              <EmptyState
                variant="default"
                icon={<Coins className="h-12 w-12" />}
                title="No transactions yet"
                description="Earn KwikCoins by placing orders, referring friends, and climbing tiers."
              />
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {txs.map((tx, i) => {
              const Icon = CATEGORY_ICONS[tx.category] ?? Coins;
              const isCredit = tx.type === "CREDIT";
              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  className="group flex items-center gap-3 rounded-xl border border-kwik-border-light bg-kwik-bg-surface p-3 transition-colors hover:border-kwik-orange/30"
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                      isCredit ? "bg-kwik-green/10" : "bg-kwik-red/10",
                    )}
                  >
                    <Icon className={cn("h-5 w-5", isCredit ? "text-kwik-green" : "text-kwik-red")} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{tx.description}</p>
                    <p className="text-xs text-kwik-muted">
                      {formatDateTime(tx.createdAt)} · {tx.category.replace(/_/g, " ").toLowerCase()}
                    </p>
                  </div>
                  <div className={cn("flex items-center gap-1 text-sm font-bold", isCredit ? "text-kwik-green" : "text-kwik-red")}>
                    {isCredit ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                    {isCredit ? "+" : "−"}
                    {tx.amount}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Redemption modal */}
      <RedeemModal
        open={redeemOpen}
        onClose={() => setRedeemOpen(false)}
        wallet={wallet}
        initialType={redeemType}
      />
    </div>
  );
}

// ── ExpiringCoinsBanner ───────────────────────────────────────────────────

function daysUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86400000));
}

function ExpiringCoinsBanner({
  expiring,
  onRedeem,
}: {
  expiring: ExpiringCoins;
  onRedeem: () => void;
}) {
  const days = daysUntil(expiring.expiresAt);
  const isUrgent = days <= 7;
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "mt-4 overflow-hidden rounded-2xl border p-4 sm:p-5",
        isUrgent
          ? "border-kwik-red/30 bg-kwik-red/5"
          : "border-kwik-amber/30 bg-kwik-amber/5",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            isUrgent ? "bg-kwik-red/10 text-kwik-red" : "bg-kwik-amber/10 text-kwik-amber",
          )}
        >
          {isUrgent ? (
            <AlertTriangle className="h-5 w-5" />
          ) : (
            <Clock className="h-5 w-5" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-heading text-sm font-bold text-foreground">
              {expiring.amount} KwikCoins expiring soon
            </p>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                isUrgent
                  ? "bg-kwik-red/10 text-kwik-red"
                  : "bg-kwik-amber/10 text-kwik-amber",
              )}
            >
              <Flame className="h-3 w-3" />
              {days === 0 ? "Today" : days === 1 ? "1 day" : `${days} days`}
            </span>
          </div>
          <p className="mt-1 text-xs text-kwik-muted">
            {expiring.reason
              ? `${expiring.reason}. `
              : ""}
            Use them before {new Date(expiring.expiresAt).toLocaleDateString("en-NG", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })} or they&apos;ll be forfeited.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onRedeem}
              className={cn(
                "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-white transition",
                isUrgent ? "bg-kwik-red hover:bg-kwik-red/90" : "bg-kwik-amber hover:bg-kwik-amber/90",
              )}
            >
              <Gift className="h-3.5 w-3.5" />
              Redeem now
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-kwik-border-light bg-kwik-bg-surface px-3 text-xs font-medium text-kwik-muted transition hover:bg-kwik-bg-page"
            >
              Remind me later
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="text-kwik-muted transition hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

// ── ReferralProgramCard ───────────────────────────────────────────────────

function ReferralProgramCard({ referral }: { referral: ReferralData }) {
  const [copied, setCopied] = React.useState<"code" | "link" | null>(null);

  function copy(text: string, kind: "code" | "link") {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopied(kind);
    setTimeout(() => setCopied(null), 2000);
  }

  const milestoneProgress = Math.min(
    100,
    (referral.successfulReferrals / referral.nextMilestone) * 100,
  );
  const remainingToMilestone = Math.max(
    0,
    referral.nextMilestone - referral.successfulReferrals,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 overflow-hidden rounded-3xl border border-kwik-border-light bg-gradient-to-br from-kwik-bg-surface via-kwik-bg-surface to-kwik-violet-tint/30 p-5 sm:p-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-kwik-violet-tint text-kwik-violet">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground">
              Refer &amp; Earn
            </h2>
            <p className="text-xs text-kwik-muted">
              Get {referral.rewardPerReferral} coins per friend · they get {referral.friendReward} coins
            </p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-kwik-border-light bg-kwik-bg-surface p-3">
          <div className="flex items-center gap-1.5 text-kwik-green">
            <Users className="h-3.5 w-3.5" />
            <span className="text-[11px] font-semibold uppercase tracking-wide">Invited</span>
          </div>
          <p className="mt-1 font-heading text-xl font-bold text-foreground">
            {referral.totalReferrals}
          </p>
        </div>
        <div className="rounded-2xl border border-kwik-border-light bg-kwik-bg-surface p-3">
          <div className="flex items-center gap-1.5 text-kwik-orange">
            <Check className="h-3.5 w-3.5" />
            <span className="text-[11px] font-semibold uppercase tracking-wide">Joined</span>
          </div>
          <p className="mt-1 font-heading text-xl font-bold text-foreground">
            {referral.successfulReferrals}
          </p>
        </div>
        <div className="rounded-2xl border border-kwik-border-light bg-kwik-bg-surface p-3">
          <div className="flex items-center gap-1.5 text-kwik-amber">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-[11px] font-semibold uppercase tracking-wide">Pending</span>
          </div>
          <p className="mt-1 font-heading text-xl font-bold text-foreground">
            {referral.pendingReferrals}
          </p>
        </div>
        <div className="rounded-2xl border border-kwik-border-light bg-kwik-bg-surface p-3">
          <div className="flex items-center gap-1.5 text-kwik-violet">
            <Coins className="h-3.5 w-3.5" />
            <span className="text-[11px] font-semibold uppercase tracking-wide">Earned</span>
          </div>
          <p className="mt-1 font-heading text-xl font-bold text-foreground">
            {referral.coinsEarned.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Referral code + link */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-kwik-border-light bg-kwik-bg-surface p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-kwik-muted">
            Your referral code
          </p>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <code className="font-mono text-base font-bold tracking-wider text-kwik-orange-dark">
              {referral.code}
            </code>
            <button
              type="button"
              onClick={() => copy(referral.code, "code")}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-kwik-border-light bg-kwik-bg-page px-2.5 text-xs font-medium text-kwik-muted transition hover:bg-kwik-bg-surface"
            >
              {copied === "code" ? (
                <>
                  <Check className="h-3.5 w-3.5 text-kwik-green" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copy
                </>
              )}
            </button>
          </div>
        </div>
        <div className="rounded-2xl border border-kwik-border-light bg-kwik-bg-surface p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-kwik-muted">
            Shareable link
          </p>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <span className="truncate text-xs text-kwik-muted">
              {referral.referralUrl.replace(/^https?:\/\//, "")}
            </span>
            <button
              type="button"
              onClick={() => copy(referral.referralUrl, "link")}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-kwik-gradient px-2.5 text-xs font-semibold text-white transition hover:opacity-90"
            >
              {copied === "link" ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Copied
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5" /> Share
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Milestone progress */}
      <div className="mt-5 rounded-2xl border border-kwik-border-light bg-kwik-bg-surface p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-kwik-orange" />
            <p className="text-sm font-semibold text-foreground">
              Next milestone: {referral.nextMilestone} referrals
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-kwik-orange-tint px-2.5 py-0.5 text-xs font-bold text-kwik-orange-dark">
            <Trophy className="h-3 w-3" />
            +{referral.milestoneBonus} bonus
          </span>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-kwik-bg-page">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${milestoneProgress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-kwik-orange to-kwik-amber"
          />
        </div>
        <p className="mt-2 text-xs text-kwik-muted">
          {remainingToMilestone > 0 ? (
            <>
              Just{" "}
              <span className="font-semibold text-kwik-orange-dark">
                {remainingToMilestone} more {remainingToMilestone === 1 ? "friend" : "friends"}
              </span>{" "}
              to unlock a {referral.milestoneBonus}-coin bonus!
            </>
          ) : (
            <span className="font-semibold text-kwik-green">
              Milestone reached! Bonus coins credited.
            </span>
          )}
        </p>
      </div>
    </motion.div>
  );
}

export default function WalletPage() {
  return (
      <WalletContent />
  );
}
