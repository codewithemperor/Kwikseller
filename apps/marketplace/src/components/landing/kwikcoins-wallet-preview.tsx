"use client";

import React from "react";
import { motion } from "framer-motion";
import { Coins, TrendingUp, Gift, ArrowRight, Sparkles, Crown } from "lucide-react";
import Link from "next/link";

/**
 * KwikCoinsWalletPreview — a compact wallet dashboard section for the homepage.
 * Shows the buyer's KwikCoins balance, tier, earning rate, and quick actions.
 * Uses mock data (no API needed) to showcase the rewards program.
 */
export function KwikCoinsWalletPreview() {
  const balance = 2450;
  const nairaValue = 24500;
  const tier = "Gold";
  const tierProgress = 65; // % to Platinum
  const coinsToPlatinum = 1320;
  const earningRate = "3x";

  const recentTransactions = [
    { id: "t1", label: "Purchase bonus — Order KW-AUR-002", amount: +120, date: "2h ago" },
    { id: "t2", label: "Redeemed at checkout", amount: -500, date: "1d ago" },
    { id: "t3", label: "Referral reward — Friend signed up", amount: +250, date: "3d ago" },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4 }}
      className="overflow-hidden rounded-2xl border border-border bg-surface"
    >
      {/* Header with kwik-gradient */}
      <div className="kwik-gradient relative overflow-hidden px-5 py-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_55%)]" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <Coins className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75">
                KwikCoins Wallet
              </p>
              <p className="font-heading text-2xl font-bold text-white">
                {balance.toLocaleString()}{" "}
                <span className="text-sm font-normal text-white/75">coins</span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/75">≈ {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(nairaValue)}</p>
            <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur">
              <Crown className="h-3 w-3" />
              {tier} Tier
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-[1fr_1fr]">
        {/* Left: Tier progress + earning rate */}
        <div className="space-y-4">
          {/* Tier progress */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Progress to Platinum
              </p>
              <span className="text-xs font-medium text-primary-600">{tierProgress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${tierProgress}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full bg-primary-500"
              />
            </div>
            <p className="mt-1.5 text-xs text-gray-500">
              {coinsToPlatinum.toLocaleString()} coins to reach Platinum tier
            </p>
          </div>

          {/* Earning rate */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 text-success">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                {earningRate} earning rate
              </p>
              <p className="text-xs text-gray-500">
                Earn {earningRate} coins per ₦100 spent
              </p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-background p-3 transition hover:border-primary-300 hover:bg-primary-50"
            >
              <Gift className="h-4 w-4 text-secondary-600" />
              <span className="text-xs font-medium text-foreground">Redeem</span>
            </button>
            <button
              type="button"
              className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-background p-3 transition hover:border-primary-300 hover:bg-primary-50"
            >
              <Sparkles className="h-4 w-4 text-primary-600" />
              <span className="text-xs font-medium text-foreground">Earn</span>
            </button>
            <button
              type="button"
              className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-background p-3 transition hover:border-primary-300 hover:bg-primary-50"
            >
              <ArrowRight className="h-4 w-4 text-gray-500" />
              <span className="text-xs font-medium text-foreground">Transfer</span>
            </button>
          </div>
        </div>

        {/* Right: Recent transactions */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Recent activity
            </p>
            <Link
              href="#"
              className="text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              View all
            </Link>
          </div>
          <ul className="space-y-2">
            {recentTransactions.map((tx) => (
              <li
                key={tx.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-background p-2.5"
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    tx.amount > 0
                      ? "bg-success/10 text-success"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {tx.amount > 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <Gift className="h-3.5 w-3.5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">
                    {tx.label}
                  </p>
                  <p className="text-[11px] text-gray-400">{tx.date}</p>
                </div>
                <span
                  className={`text-sm font-bold ${
                    tx.amount > 0 ? "text-success" : "text-gray-500"
                  }`}
                >
                  {tx.amount > 0 ? "+" : ""}
                  {tx.amount}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.section>
  );
}
