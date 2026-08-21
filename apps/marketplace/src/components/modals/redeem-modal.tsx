"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coins,
  Gift,
  Sparkles,
  ArrowDownLeft,
  Zap,
  Trophy,
  Megaphone,
  Send,
  Check,
  Loader2,
  X,
} from "lucide-react";
import { kwikToast } from "@/lib/toast";
import { useRedeemWallet, type WalletRedemptionType } from "@/lib/order-api";
import { cn } from "@/lib/utils";

// ── Redemption type config ────────────────────────────────────────────────
const REDEMPTION_OPTIONS: Array<{
  type: WalletRedemptionType;
  label: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    type: "CASH",
    label: "Cash to Wallet",
    description: "Convert to ₦ in your wallet balance.",
    Icon: Coins,
  },
  {
    type: "AD_CREDIT",
    label: "Ad Credit",
    description: "Fund vendor ad campaigns on Kwikseller.",
    Icon: Megaphone,
  },
  {
    type: "TRANSFER",
    label: "Transfer",
    description: "Send to another Kwikseller member.",
    Icon: Send,
  },
];

const QUICK_AMOUNTS = [100, 500, 1000];

// ── Helpers ────────────────────────────────────────────────────────────────

function formatNGN(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}

// ── WalletData subset needed by the modal ──────────────────────────────────

export interface RedeemWalletData {
  balance: number;
  nairaEquivalent: number;
  tier: string;
  earningRate: number;
}

interface RedeemModalProps {
  open: boolean;
  onClose: () => void;
  wallet: RedeemWalletData;
  initialType: WalletRedemptionType;
}

export function RedeemModal({
  open,
  onClose,
  wallet,
  initialType,
}: RedeemModalProps) {
  const redeem = useRedeemWallet();
  const [redemptionType, setRedemptionType] = React.useState<WalletRedemptionType>(initialType);
  const [amountInput, setAmountInput] = React.useState<string>("");

  // Sync the selected type when the parent passes a new initial type
  // (e.g. when the user clicks "Ad Credit" vs "Transfer" on the wallet card).
  React.useEffect(() => {
    if (open) setRedemptionType(initialType);
  }, [open, initialType]);

  // Reset the amount input whenever the modal closes so the next open is clean.
  React.useEffect(() => {
    if (!open) {
      const t = setTimeout(() => setAmountInput(""), 180);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open]);

  const amount = Number(amountInput) || 0;
  const nairaValue = amount * 10; // 1 KwikCoin = ₦10
  const exceedsBalance = amount > wallet.balance;
  const canSubmit =
    !redeem.isPending && amount > 0 && !exceedsBalance && amountInput !== "";

  function setQuick(value: number) {
    setAmountInput(String(value));
  }

  function setMax() {
    setAmountInput(String(wallet.balance));
  }

  async function handleConfirm() {
    if (!canSubmit) return;
    try {
      const result = await redeem.mutateAsync({ amount, redemptionType });
      kwikToast.success(
        "Redemption successful",
        `${amount.toLocaleString()} KwikCoins converted. New balance: ${result.newBalance.toLocaleString()} coins.`,
      );
      onClose();
    } catch (e) {
      kwikToast.error(
        "Redemption failed",
        e instanceof Error ? e.message : "Please try again.",
      );
    }
  }

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
          aria-label="Redeem KwikCoins"
        >
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              if (!redeem.isPending) onClose();
            }}
          />

          {/* Modal card */}
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 16 }}
            transition={{ type: "spring", duration: 0.32, bounce: 0.18 }}
            className="relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-kwik-border-light bg-kwik-bg-surface shadow-2xl sm:max-w-lg sm:rounded-3xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-kwik-border-light bg-kwik-bg-page px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-kwik-orange/10">
                  <Coins className="h-5 w-5 text-kwik-orange" />
                </div>
                <div>
                  <h2 className="font-heading text-base font-bold text-foreground">Redeem KwikCoins</h2>
                  <p className="text-xs text-kwik-muted">Convert your coins to cash, ad credit, or transfer.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!redeem.isPending) onClose();
                }}
                aria-label="Close"
                disabled={redeem.isPending}
                className="rounded-lg p-1.5 text-kwik-muted transition hover:bg-kwik-bg-light hover:text-foreground disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {/* Current balance */}
              <div className="flex items-center justify-between rounded-2xl border border-kwik-border-light bg-kwik-bg-page px-4 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-kwik-muted">Available balance</p>
                  <p className="mt-0.5 font-heading text-lg font-bold text-foreground">
                    {wallet.balance.toLocaleString()}{" "}
                    <span className="text-sm font-normal text-kwik-muted">KwikCoins</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-wide text-kwik-muted">Value</p>
                  <p className="mt-0.5 text-sm font-semibold text-kwik-green">
                    {formatNGN(wallet.nairaEquivalent)}
                  </p>
                </div>
              </div>

              {/* Redemption type selector */}
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-kwik-muted">
                Redemption type
              </p>
              <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {REDEMPTION_OPTIONS.map((opt) => {
                  const selected = redemptionType === opt.type;
                  const Icon = opt.Icon;
                  return (
                    <button
                      key={opt.type}
                      type="button"
                      onClick={() => setRedemptionType(opt.type)}
                      aria-pressed={selected}
                      className={cn(
                        "relative flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-kwik-orange/40",
                        selected
                          ? "border-kwik-orange bg-kwik-orange/5 ring-1 ring-kwik-orange/30"
                          : "border-kwik-border-light bg-kwik-bg-page hover:border-kwik-orange/40",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5",
                          selected ? "text-kwik-orange" : "text-kwik-muted",
                        )}
                      />
                      <p className="text-xs font-semibold text-foreground">{opt.label}</p>
                      <p className="text-[11px] leading-tight text-kwik-muted">{opt.description}</p>
                      {selected ? (
                        <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-kwik-orange text-white">
                          <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {/* Amount input */}
              <div className="mt-4">
                <label
                  htmlFor="redeem-amount"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-kwik-muted"
                >
                  Amount (KwikCoins)
                </label>
                <input
                  id="redeem-amount"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={wallet.balance}
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="Enter amount"
                  className={cn(
                    "h-11 w-full rounded-xl border bg-kwik-bg-page px-3 text-sm font-semibold text-foreground outline-none transition placeholder:font-normal placeholder:text-kwik-muted focus:ring-2",
                    exceedsBalance
                      ? "border-kwik-red focus:ring-kwik-red/20"
                      : "border-kwik-border-light focus:border-kwik-orange focus:ring-kwik-orange/20",
                  )}
                />
                {/* Quick amount chips */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {QUICK_AMOUNTS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuick(q)}
                      disabled={q > wallet.balance}
                      className={cn(
                        "inline-flex h-8 items-center rounded-full border px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40",
                        amountInput === String(q)
                          ? "border-kwik-orange bg-kwik-orange/10 text-kwik-orange"
                          : "border-kwik-border-light text-kwik-muted hover:bg-kwik-bg-light",
                      )}
                    >
                      {q}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={setMax}
                    className="inline-flex h-8 items-center rounded-full border border-kwik-border-light px-3 text-xs font-semibold text-kwik-muted transition hover:bg-kwik-bg-light"
                  >
                    Max
                  </button>
                </div>
                {exceedsBalance ? (
                  <p className="mt-1.5 text-xs text-kwik-red">
                    Amount exceeds your available balance.
                  </p>
                ) : null}
              </div>

              {/* Live preview */}
              <div className="mt-4 rounded-2xl bg-kwik-orange/5 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-kwik-orange" />
                    <span className="text-sm font-semibold text-foreground">You receive</span>
                  </div>
                  <p className="font-heading text-lg font-bold text-kwik-orange">
                    {formatNGN(nairaValue)}
                  </p>
                </div>
                <p className="mt-1 text-xs text-kwik-muted">
                  1 KwikCoin = ₦10 · Rate locked at {wallet.tier} tier ({wallet.earningRate}× earning).
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 border-t border-kwik-border-light bg-kwik-bg-page px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  if (!redeem.isPending) onClose();
                }}
                disabled={redeem.isPending}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-kwik-border-light bg-kwik-bg-surface px-4 text-sm font-semibold text-kwik-dark transition hover:bg-kwik-bg-light disabled:opacity-50 sm:flex-none sm:px-5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!canSubmit}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-kwik-orange px-4 text-sm font-semibold text-white transition hover:bg-kwik-orange-hover disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none sm:px-6"
              >
                {redeem.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Redeeming…
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" /> Confirm redemption
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
