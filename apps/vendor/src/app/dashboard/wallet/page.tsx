"use client";
import React from "react";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Building2,
  Search,
  RefreshCw,
  Trash2,
  Star,
  Lock,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { motion } from "framer-motion";
import { AppButton, AppModal, FieldInput, FieldSelect, FieldTextarea, Skeleton, VendorPageHeader, VendorStatCard } from "@kwikseller/ui";
import { formatCurrency, formatDate, unwrapApiData } from "@/lib/vendor-format";
import { useVendorWalletStore } from "@/stores/vendor-wallet-store";
import type { WalletTransaction, EscrowHolding } from "@/stores/vendor-wallet-store";
import { paymentsApi, escrowApi } from "@kwikseller/api-client";
import { cn, kwikToast } from "@kwikseller/utils";

// ==================== Local types ====================

type BankOption = {
  code: string;
  name: string;
};

type SavedBankAccount = {
  id: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
};

type TransactionTypeFilter = "ALL" | "CREDIT" | "DEBIT";
type TransactionStatusFilter = "ALL" | "COMPLETED" | "PROCESSING" | "HELD" | "PENDING" | "FAILED";
type WalletTableTab = "escrow" | "transactions";

// ==================== Helpers ====================

const BANK_ACCOUNTS_KEY = "kwikseller_vendor_bank_accounts";

function loadSavedBanks(): SavedBankAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BANK_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveBanks(accounts: SavedBankAccount[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(BANK_ACCOUNTS_KEY, JSON.stringify(accounts));
}

function generateBankId() {
  return `bnk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function getAmountColor(tx: WalletTransaction) {
  switch (tx.status) {
    case "HELD":
    case "PENDING":
      return "text-muted-foreground";
    case "FAILED":
      return "text-red-600 dark:text-red-400";
    default:
      // Positive amounts = incoming (green), negative = outgoing (red)
      if (tx.amount < 0) return "text-red-600 dark:text-red-400";
      return "text-green-600 dark:text-green-400";
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "COMPLETED":
      return "text-green-600 dark:text-green-400";
    case "PROCESSING":
      return "text-yellow-600 dark:text-yellow-400";
    case "HELD":
      return "text-muted-foreground";
    case "PENDING":
      return "text-yellow-600 dark:text-yellow-400";
    case "FAILED":
      return "text-red-600 dark:text-red-400";
    default:
      return "text-muted-foreground";
  }
}

function formatTxType(type: string) {
  const map: Record<string, string> = {
    ESCROW_RELEASE: "Escrow Release",
    WITHDRAWAL: "Withdrawal",
    ESCROW_HOLD: "Escrow Hold",
    REFUND: "Refund",
    CREDIT: "Credit",
    DEBIT: "Debit",
    PAYOUT: "Payout",
  };
  return map[type] ?? type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return "";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(dateStr);
}

function getEscrowStatusLabel(status: EscrowHolding["status"]): string {
  const map: Record<EscrowHolding["status"], string> = {
    HELD: "Held",
    PENDING_RELEASE: "Pending Release",
    RELEASED: "Released",
    DISPUTED: "Under Dispute",
    PARTIAL: "Partial",
  };
  return map[status] ?? status;
}

function getEscrowStatusColor(status: EscrowHolding["status"]): string {
  switch (status) {
    case "HELD":
      return "text-muted-foreground";
    case "PENDING_RELEASE":
      return "text-amber-600 dark:text-amber-400";
    case "RELEASED":
      return "text-green-600 dark:text-green-400";
    case "DISPUTED":
      return "text-red-600 dark:text-red-400";
    case "PARTIAL":
      return "text-amber-600 dark:text-amber-400";
    default:
      return "text-muted-foreground";
  }
}

// ==================== Countdown Timer Component ====================

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = React.useState<{
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  } | null>(null);

  React.useEffect(() => {
    const calculate = () => {
      const now = Date.now();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }

      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        expired: false,
      });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!timeLeft) {
    return <span className="text-xs text-muted-foreground/50">...</span>;
  }

  if (timeLeft.expired) {
    return (
      <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
        Releasing soon...
      </span>
    );
  }

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <span className="font-mono text-xs tabular-nums text-amber-600 dark:text-amber-400">
      Release in {pad(timeLeft.hours)}h {pad(timeLeft.minutes)}m {pad(timeLeft.seconds)}s
    </span>
  );
}

// ==================== Main Component ====================

export default function WalletPage() {
  const {
    balance,
    transactions,
    isLoading,
    isTransactionsLoading,
    error,
    transactionsPage,
    transactionsTotalPages,
    transactionsTotal,
    fetchWallet,
    fetchTransactions,
    requestWithdrawal,
    refresh,
    // Escrow holdings
    escrowHoldings,
    escrowLoading,
    fetchEscrowHoldings,
  } = useVendorWalletStore();

  // Modal & filter state
  const [withdrawModalOpen, setWithdrawModalOpen] = React.useState(false);
  const [typeFilter, setTypeFilter] = React.useState<TransactionTypeFilter>("ALL");
  const [statusFilter, setStatusFilter] = React.useState<TransactionStatusFilter>("ALL");
  const [walletTableTab, setWalletTableTab] = React.useState<WalletTableTab>("escrow");
  const [balanceTab, setBalanceTab] = React.useState<"available" | "escrow" | "lifetime">("available");
  const [activeAccordion, setActiveAccordion] = React.useState<"balance" | "activity" | "banks" | null>("balance");

  // Dispute modal state
  const [disputeModalOpen, setDisputeModalOpen] = React.useState(false);
  const [disputeHolding, setDisputeHolding] = React.useState<EscrowHolding | null>(null);
  const [disputeReason, setDisputeReason] = React.useState("");
  const [disputeEvidence, setDisputeEvidence] = React.useState("");
  const [disputeSubmitting, setDisputeSubmitting] = React.useState(false);

  // Delete bank confirmation state
  const [deleteBankId, setDeleteBankId] = React.useState<string | null>(null);
  const [isDeletingBank, setIsDeletingBank] = React.useState(false);

  // Track previous escrow statuses for toast notifications
  const prevHoldingsRef = React.useRef<EscrowHolding[]>([]);

  // Withdrawal form state
  const [withdrawAmount, setWithdrawAmount] = React.useState("");
  const [withdrawBankCode, setWithdrawBankCode] = React.useState("");
  const [withdrawAccountNumber, setWithdrawAccountNumber] = React.useState("");
  const [withdrawAccountName, setWithdrawAccountName] = React.useState("");
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [bankList, setBankList] = React.useState<BankOption[]>([]);
  const [banksLoading, setBanksLoading] = React.useState(false);

  // Saved bank accounts
  const [savedBanks, setSavedBanks] = React.useState<SavedBankAccount[]>([]);

  // Load wallet data on mount
  React.useEffect(() => {
    fetchWallet();
    fetchTransactions(1);
    fetchEscrowHoldings();
  }, [fetchWallet, fetchTransactions, fetchEscrowHoldings]);

  // Load saved banks on mount
  React.useEffect(() => {
    setSavedBanks(loadSavedBanks());
  }, []);

  // Toast on escrow status change
  React.useEffect(() => {
    if (prevHoldingsRef.current.length > 0 && escrowHoldings.length > 0) {
      for (const current of escrowHoldings) {
        const prev = prevHoldingsRef.current.find((h) => h.id === current.id);
        if (prev && prev.status !== current.status) {
          if (current.status === "RELEASED") {
            kwikToast.success(`${formatCurrency(current.amount)} released to available balance!`);
          } else if (current.status === "DISPUTED") {
            kwikToast.error(`Dispute opened on ${current.orderRef}`);
          } else if (current.status === "PENDING_RELEASE") {
            kwikToast.info(`${current.orderRef} is pending release`);
          }
        }
      }
    }
    prevHoldingsRef.current = escrowHoldings;
  }, [escrowHoldings]);

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (withdrawModalOpen) {
      setWithdrawAmount("");
      setWithdrawBankCode("");
      setWithdrawAccountNumber("");
      setWithdrawAccountName("");
      loadBanks();
    }
  }, [withdrawModalOpen]);

  const loadBanks = async () => {
    setBanksLoading(true);
    try {
      const response = await paymentsApi.getBanks();
      const data = unwrapApiData<BankOption[]>(response.data);
      setBankList(Array.isArray(data) ? data : []);
    } catch {
      // Silently fail — banks list is non-critical
    } finally {
      setBanksLoading(false);
    }
  };

  const verifyAccount = async () => {
    if (!withdrawBankCode || withdrawAccountNumber.length < 10) return;
    setIsVerifying(true);
    try {
      const response = await paymentsApi.verifyAccount(
        withdrawBankCode,
        withdrawAccountNumber
      );
      const data = unwrapApiData<{ accountName: string }>(response.data);
      setWithdrawAccountName(data?.accountName ?? "");
    } catch {
      setWithdrawAccountName("");
      kwikToast.error("Could not verify account number");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleWithdrawSubmit = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      kwikToast.error("Enter a valid amount");
      return;
    }
    if (amount > (balance?.available ?? 0)) {
      kwikToast.error("Amount exceeds available balance");
      return;
    }
    if (!withdrawBankCode || !withdrawAccountNumber || !withdrawAccountName) {
      kwikToast.error("Complete bank details");
      return;
    }

    setIsSubmitting(true);
    try {
      await requestWithdrawal({
        amount,
        bankCode: withdrawBankCode,
        accountNumber: withdrawAccountNumber,
        accountName: withdrawAccountName,
      });

      // Save bank account for future use
      const bankName = bankList.find((b) => b.code === withdrawBankCode)?.name ?? withdrawBankCode;
      const newAccount: SavedBankAccount = {
        id: generateBankId(),
        bankName,
        bankCode: withdrawBankCode,
        accountNumber: withdrawAccountNumber,
        accountName: withdrawAccountName,
        isDefault: savedBanks.length === 0,
      };
      const updated = [newAccount, ...savedBanks.filter((b) => !(b.bankCode === withdrawBankCode && b.accountNumber === withdrawAccountNumber))];
      setSavedBanks(updated);
      saveBanks(updated);

      kwikToast.success("Withdrawal requested successfully");
      setWithdrawModalOpen(false);
    } catch (err) {
      kwikToast.error(err instanceof Error ? err.message : "Withdrawal failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const setDefaultBank = (id: string) => {
    const updated = savedBanks.map((b) => ({
      ...b,
      isDefault: b.id === id,
    }));
    setSavedBanks(updated);
    saveBanks(updated);
  };

  const deleteBank = (id: string) => {
    const updated = savedBanks.filter((b) => b.id !== id);
    if (savedBanks.find((b) => b.id === id)?.isDefault && updated.length > 0) {
      updated[0].isDefault = true;
    }
    setSavedBanks(updated);
    saveBanks(updated);
  };

  const confirmDeleteBank = () => {
    if (!deleteBankId) return;
    setIsDeletingBank(true);
    try {
      deleteBank(deleteBankId);
      kwikToast.success("Bank account removed");
    } finally {
      setIsDeletingBank(false);
      setDeleteBankId(null);
    }
  };

  // Dispute handlers
  const openDisputeModal = (holding: EscrowHolding) => {
    setDisputeHolding(holding);
    setDisputeReason("");
    setDisputeEvidence("");
    setDisputeModalOpen(true);
  };

  const handleDisputeSubmit = async () => {
    if (!disputeHolding || !disputeReason.trim()) {
      kwikToast.error("Please provide a reason for the dispute");
      return;
    }

    setDisputeSubmitting(true);
    try {
      await escrowApi.openDispute(
        disputeHolding.orderId,
        disputeReason.trim(),
        disputeEvidence.trim() || undefined
      );
      kwikToast.success("Dispute submitted successfully");
      setDisputeModalOpen(false);
      setDisputeHolding(null);
      // Refresh escrow holdings to pick up status change
      await fetchEscrowHoldings();
    } catch (err) {
      kwikToast.error(err instanceof Error ? err.message : "Failed to submit dispute");
    } finally {
      setDisputeSubmitting(false);
    }
  };

  // Filter transactions client-side
  const filteredTransactions = React.useMemo(() => {
    return transactions.filter((tx) => {
      if (typeFilter === "ALL") return true;
      if (typeFilter === "CREDIT") return tx.amount > 0;
      if (typeFilter === "DEBIT") return tx.amount < 0;
      return true;
    }).filter((tx) => {
      if (statusFilter === "ALL") return true;
      return tx.status === statusFilter;
    });
  }, [transactions, typeFilter, statusFilter]);

  const paginationFrom = (transactionsPage - 1) * 20 + 1;
  const paginationTo = Math.min(transactionsPage * 20, transactionsTotal);

  // Filter escrow holdings: show active ones (HELD, PENDING_RELEASE, DISPUTED, PARTIAL)
  const activeEscrowHoldings = escrowHoldings.filter(
    (h) => h.status !== "RELEASED"
  );
  const hasEscrowHoldings = activeEscrowHoldings.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* ==================== Section 1: Page Header ==================== */}
      <VendorPageHeader
        title="Wallet & Payouts"
        description="Balances, escrow, and payouts."
        actions={
          <div className="flex items-center gap-2">
            <AppButton
              variant="secondary"
              size="sm"
              onClick={() => refresh()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </AppButton>
            <AppButton
              variant="primary"
              size="sm"
              onClick={() => setWithdrawModalOpen(true)}
              disabled={!balance || balance.available <= 0}
            >
              <ArrowUpRight className="h-4 w-4" />
              Request Withdrawal
            </AppButton>
          </div>
        }
      />

      {/* ==================== Accordion: Balance Overview ==================== */}
      <AccordionItem
        id="balance"
        activeId={activeAccordion}
        onToggle={setActiveAccordion}
        icon={Wallet}
        title="Balance Overview"
        subtitle="Available, escrow, and lifetime earnings"
      >
      <section>
        {isLoading && !balance ? (
          <div className="rounded-2xl bg-default-100 p-5 dark:bg-white/5">
            <Skeleton className="mb-2 h-8 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : balance ? (
          <div className="space-y-4">
            {/* Balance tabs */}
            <div className="inline-flex rounded-full bg-default-100 p-1 dark:bg-white/8">
              {[
                { id: "available" as const, label: "Available", icon: Wallet },
                { id: "escrow" as const, label: "In Escrow", icon: Lock },
                { id: "lifetime" as const, label: "Lifetime", icon: ArrowUpRight },
              ].map((tab) => {
                const active = balanceTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setBalanceTab(tab.id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-accent text-accent-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Active balance card */}
            {balanceTab === "available" && (
              <VendorStatCard
                label="Available Balance"
                value={formatCurrency(balance.available)}
                variant="balance"
                icon={Wallet}
                subItems={[
                  { label: "Status", value: "Ready for withdrawal" },
                  { label: "In Escrow", value: formatCurrency(balance.pending) },
                  { label: "Lifetime", value: formatCurrency(balance.total) },
                ]}
              />
            )}
            {balanceTab === "escrow" && (
              <VendorStatCard
                label="Pending Escrow"
                value={formatCurrency(balance.pending)}
                variant="balance"
                icon={Lock}
                subItems={[
                  { label: "Status", value: "Awaiting delivery confirmation" },
                  { label: "Available", value: formatCurrency(balance.available) },
                  { label: "Lifetime", value: formatCurrency(balance.total) },
                ]}
              />
            )}
            {balanceTab === "lifetime" && (
              <VendorStatCard
                label="Lifetime Earnings"
                value={formatCurrency(balance.total)}
                variant="balance"
                icon={ArrowUpRight}
                subItems={[
                  { label: "All time", value: "Total payouts" },
                  { label: "Available", value: formatCurrency(balance.available) },
                  { label: "In Escrow", value: formatCurrency(balance.pending) },
                ]}
              />
            )}
          </div>
        ) : error ? (
          <div className="border-b border-border px-6 py-8 text-center">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <AppButton
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => fetchWallet(true)}
            >
              Try Again
            </AppButton>
          </div>
        ) : null}
      </section>
      </AccordionItem>

      {/* ==================== Accordion: Wallet Activity & Escrow ==================== */}
      <AccordionItem
        id="activity"
        activeId={activeAccordion}
        onToggle={setActiveAccordion}
        icon={Clock}
        title="Wallet Activity & Escrow"
        subtitle="Escrow holdings, transactions, and dispute history"
      >
      <section className="space-y-4">
        <div className="inline-flex rounded-full bg-default-100 p-1 dark:bg-white/8">
          {[
            { id: "escrow" as const, label: "Escrow" },
            { id: "transactions" as const, label: "Transactions" },
          ].map((item) => {
            const active = walletTableTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setWalletTableTab(item.id)}
                className={`h-10 rounded-full px-4 text-sm font-medium transition ${
                  active
                    ? "bg-white text-gray-950 dark:bg-white dark:text-gray-950"
                    : "text-muted-foreground hover:text-foreground dark:text-white/60 dark:hover:text-white"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {walletTableTab === "escrow" ? (
        <div>
        {/* Section Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-foreground">
              Escrow Holdings
            </h2>
            {activeEscrowHoldings.length > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-border bg-default-100 px-1.5 text-xs font-medium text-muted-foreground">
                {activeEscrowHoldings.length}
              </span>
            )}
          </div>
          {escrowHoldings.length > activeEscrowHoldings.length && (
            <AppButton
              variant="ghost"
              size="sm"
              onClick={() => {
                const el = document.getElementById("escrow-full-list");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <Eye className="h-4 w-4" />
              View All
            </AppButton>
          )}
        </div>

        <div className="mt-4">
          {escrowLoading ? (
            <div className="space-y-0">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 border-b border-border px-4 py-5"
                >
                  <Skeleton className="h-4 w-24 flex-shrink-0" />
                  <Skeleton className="h-4 w-20 flex-shrink-0" />
                  <Skeleton className="h-4 w-16 flex-shrink-0" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
          ) : !hasEscrowHoldings ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Lock className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />
              <p className="mt-3 text-sm font-medium text-muted-foreground">
                No pending escrow holdings
              </p>
              <p className="mt-1 text-xs text-muted-foreground/50">
                Funds will appear here once orders are confirmed and paid.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Order
                      </th>
                      <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground text-right">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Status
                      </th>
                      <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Held Since
                      </th>
                      <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Release
                      </th>
                      <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeEscrowHoldings.map((holding) => (
                      <tr
                        key={holding.id}
                        className="border-b border-border transition-colors last:border-b-0 hover:bg-default-100/50"
                      >
                        <td className="px-4 py-4">
                          <a
                            href={`/dashboard/orders/${holding.orderId}`}
                            className="font-mono text-xs text-foreground transition hover:text-muted-foreground hover:underline"
                          >
                            {holding.orderRef}
                          </a>
                        </td>
                        <td className="px-4 py-4 text-right font-semibold tabular-nums text-foreground">
                          {formatCurrency(holding.amount)}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-xs font-medium ${getEscrowStatusColor(holding.status)}`}>
                            {getEscrowStatusLabel(holding.status)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-xs text-muted-foreground">
                          {formatRelativeTime(holding.heldSince)}
                        </td>
                        <td className="px-4 py-4">
                          {holding.status === "PENDING_RELEASE" && holding.expectedRelease ? (
                            <CountdownTimer targetDate={holding.expectedRelease} />
                          ) : (
                            <span className="text-xs text-muted-foreground/50">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          {holding.status === "HELD" && (
                            <AppButton
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                              onClick={() => openDisputeModal(holding)}
                            >
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Open Dispute
                            </AppButton>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="space-y-0 divide-y divide-border sm:hidden">
                {activeEscrowHoldings.map((holding) => (
                  <div key={holding.id} className="px-4 py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <a
                          href={`/dashboard/orders/${holding.orderId}`}
                          className="font-mono text-sm font-medium text-foreground transition hover:text-muted-foreground hover:underline"
                        >
                          {holding.orderRef}
                        </a>
                        <div className="mt-1">
                          <span className={`text-xs font-medium ${getEscrowStatusColor(holding.status)}`}>
                            {getEscrowStatusLabel(holding.status)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm font-semibold tabular-nums text-foreground">
                        {formatCurrency(holding.amount)}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground/50">
                        Held {formatRelativeTime(holding.heldSince)}
                      </p>
                      {holding.status === "PENDING_RELEASE" && holding.expectedRelease ? (
                        <CountdownTimer targetDate={holding.expectedRelease} />
                      ) : null}
                    </div>
                    {holding.status === "HELD" && (
                      <div className="mt-2 flex justify-end">
                        <AppButton
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          onClick={() => openDisputeModal(holding)}
                        >
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Open Dispute
                        </AppButton>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Full escrow list anchor (includes released holdings) */}
              {escrowHoldings.length > activeEscrowHoldings.length && (
                <div id="escrow-full-list" className="mt-6">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground/50">
                    Released Holdings
                  </p>
                  <div className="max-h-96 overflow-y-auto">
                    <div className="divide-y divide-border border-t border-border">
                      {escrowHoldings
                        .filter((h) => h.status === "RELEASED")
                        .map((holding) => (
                          <div
                            key={holding.id}
                            className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex items-center gap-4">
                              <a
                                href={`/dashboard/orders/${holding.orderId}`}
                                className="font-mono text-xs text-muted-foreground transition hover:text-foreground hover:underline"
                              >
                                {holding.orderRef}
                              </a>
                              <span className="text-xs font-medium text-green-600 dark:text-green-400">
                                Released
                              </span>
                            </div>
                            <p className="text-xs font-medium tabular-nums text-muted-foreground">
                              {formatCurrency(holding.amount)}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        </div>
        ) : (
        <div>
        {/* Section Header with Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Transaction History
          </h2>
          <div className="flex items-center gap-2">
            <FieldSelect
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TransactionTypeFilter)}
              className="h-9 w-auto rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="CREDIT">Credits</option>
              <option value="DEBIT">Debits</option>
            </FieldSelect>
            <FieldSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TransactionStatusFilter)}
              className="h-9 w-auto rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="COMPLETED">Completed</option>
              <option value="PROCESSING">Processing</option>
              <option value="PENDING">Pending</option>
              <option value="HELD">Held</option>
              <option value="FAILED">Failed</option>
            </FieldSelect>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="mt-4">
          {isTransactionsLoading && transactions.length === 0 ? (
            <div className="space-y-0">
              {/* Header skeleton */}
              <div className="flex items-center gap-4 border-b border-border px-4 py-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-3 w-16 flex-shrink-0" />
                ))}
              </div>
              {Array.from({ length: 5 }).map((_, row) => (
                <div
                  key={row}
                  className="flex items-center gap-4 border-b border-border px-4 py-4"
                >
                  {Array.from({ length: 5 }).map((_, col) => (
                    <Skeleton
                      key={col}
                      className="h-4 flex-1"
                    />
                  ))}
                </div>
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Wallet className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />
              <p className="mt-3 text-sm font-medium text-muted-foreground">
                No transactions yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground/50">
                Transactions will appear here once you start selling.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Date
                      </th>
                      <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Type
                      </th>
                      <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Reference
                      </th>
                      <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground text-right">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground text-right">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="border-b border-border transition-colors last:border-b-0 hover:bg-default-100/50"
                      >
                        <td className="px-4 py-4 text-muted-foreground">
                          {formatDate(tx.createdAt)}
                        </td>
                        <td className="px-4 py-4 text-foreground">
                          {formatTxType(tx.type)}
                        </td>
                        <td className="px-4 py-4 font-mono text-xs text-muted-foreground">
                          {tx.reference}
                        </td>
                        <td
                          className={`px-4 py-4 text-right font-medium tabular-nums ${getAmountColor(tx)}`}
                        >
                          {tx.amount < 0 ? "−" : "+"}
                          {formatCurrency(Math.abs(tx.amount))}
                        </td>
                        <td
                          className={`px-4 py-4 text-right text-xs font-medium ${getStatusColor(tx.status)}`}
                        >
                          {tx.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="space-y-0 divide-y divide-border sm:hidden">
                {filteredTransactions.map((tx) => (
                  <div key={tx.id} className="px-4 py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {formatTxType(tx.type)}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground/50">
                          {tx.reference}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-semibold tabular-nums ${getAmountColor(tx)}`}
                        >
                          {tx.amount < 0 ? "−" : "+"}
                          {formatCurrency(Math.abs(tx.amount))}
                        </p>
                        <p
                          className={`mt-0.5 text-xs font-medium ${getStatusColor(tx.status)}`}
                        >
                          {tx.status}
                        </p>
                      </div>
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground/50">
                      {formatDate(tx.createdAt)}
                      {tx.description && (
                        <span className="ml-2 text-muted-foreground/50">· {tx.description}</span>
                      )}
                    </p>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {transactionsTotalPages > 1 && (
                <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t border-border pt-4 sm:flex-row">
                  <p className="text-xs text-muted-foreground">
                    Showing {paginationFrom}–{paginationTo} of{" "}
                    {transactionsTotal} transactions
                  </p>
                  <div className="flex items-center gap-1">
                    <AppButton
                      variant="secondary"
                      size="sm"
                      disabled={transactionsPage <= 1 || isTransactionsLoading}
                      onClick={() => fetchTransactions(transactionsPage - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Prev
                    </AppButton>
                    {Array.from({ length: transactionsTotalPages }).map((_, i) => {
                      const pageNum = i + 1;
                      // Show first, last, and pages around current
                      if (
                        transactionsTotalPages > 7 &&
                        pageNum !== 1 &&
                        pageNum !== transactionsTotalPages &&
                        Math.abs(pageNum - transactionsPage) > 1
                      ) {
                        if (pageNum === 2 || pageNum === transactionsTotalPages - 1) {
                          return (
                            <span
                              key={pageNum}
                              className="px-2 text-xs text-muted-foreground/50"
                            >
                              …
                            </span>
                          );
                        }
                        return null;
                      }
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => fetchTransactions(pageNum)}
                          disabled={isTransactionsLoading}
                          className={`inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm font-medium transition ${
                            transactionsPage === pageNum
                              ? "border-foreground bg-foreground text-background"
                              : "border-border bg-background text-foreground hover:border-accent"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <AppButton
                      variant="secondary"
                      size="sm"
                      disabled={
                        transactionsPage >= transactionsTotalPages ||
                        isTransactionsLoading
                      }
                      onClick={() => fetchTransactions(transactionsPage + 1)}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </AppButton>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        </div>
        )}
      </section>
      </AccordionItem>

      {/* ==================== Accordion: Bank Accounts ==================== */}
      <AccordionItem
        id="banks"
        activeId={activeAccordion}
        onToggle={setActiveAccordion}
        icon={Building2}
        title="Bank Accounts"
        subtitle="Saved accounts for withdrawals"
      >
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Bank Accounts</h2>
          <AppButton
            variant="secondary"
            size="sm"
            onClick={() => setWithdrawModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Account
          </AppButton>
        </div>

        <div className="mt-4">
          {savedBanks.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border py-12">
              <Building2 className="h-8 w-8 text-muted-foreground/50" strokeWidth={1.5} />
              <p className="mt-3 text-sm font-medium text-muted-foreground">
                No bank accounts linked
              </p>
              <p className="mt-1 text-xs text-muted-foreground/50">
                Add a bank account when you request a withdrawal.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border border-b border-border">
              {savedBanks.map((bank) => (
                <div
                  key={bank.id}
                  className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-default-100">
                      <Building2 className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {bank.bankName}
                        </p>
                        {bank.isDefault && (
                          <span className="inline-flex items-center gap-0.5 text-xs font-medium text-yellow-600 dark:text-yellow-400">
                            <Star className="h-3 w-3 fill-yellow-500" />
                            Default
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        <span className="font-mono">{bank.accountNumber}</span>
                        {" · "}
                        {bank.accountName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!bank.isDefault && (
                      <AppButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setDefaultBank(bank.id)}
                      >
                        Set Default
                      </AppButton>
                    )}
                    <button
                      type="button"
                      onClick={() => setDeleteBankId(bank.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground/70 transition hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                      aria-label="Remove bank account"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      </AccordionItem>

      {/* ==================== Withdrawal Modal ==================== */}
      <AppModal
        isOpen={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        title="Request Withdrawal"
        footer={
          <div className="flex w-full items-center justify-end gap-2">
            <AppButton
              variant="secondary"
              onClick={() => setWithdrawModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </AppButton>
            <AppButton
              variant="primary"
              onClick={handleWithdrawSubmit}
              isLoading={isSubmitting}
              loadingLabel="Processing…"
              disabled={
                isSubmitting ||
                !withdrawAmount ||
                parseFloat(withdrawAmount) <= 0 ||
                !withdrawBankCode ||
                !withdrawAccountNumber ||
                !withdrawAccountName
              }
            >
              Confirm Withdrawal
            </AppButton>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Available balance display */}
          <div className="border-b border-border pb-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Available Balance
            </p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {formatCurrency(balance?.available ?? 0)}
            </p>
          </div>

          {/* Amount */}
          <div>
            <FieldInput
              label="Amount (₦)"
              type="number"
              placeholder="Enter amount"
              min={1}
              max={balance?.available ?? 0}
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
            />
            <button
              type="button"
              onClick={() =>
                setWithdrawAmount(String(balance?.available ?? 0))
              }
              className="mt-1.5 text-xs font-medium text-accent hover:underline"
            >
              Use maximum ({formatCurrency(balance?.available ?? 0)})
            </button>
          </div>

          {/* Bank Selection */}
          <div>
            <FieldSelect
              label="Bank"
              value={withdrawBankCode}
              onChange={(e) => {
                setWithdrawBankCode(e.target.value);
                setWithdrawAccountName("");
              }}
              disabled={banksLoading}
            >
              <option value="">
                {banksLoading ? "Loading banks…" : "Select a bank"}
              </option>
              {bankList.map((bank) => (
                <option key={bank.code} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </FieldSelect>
          </div>

          {/* Account Number */}
          <div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <FieldInput
                  label="Account Number"
                  type="text"
                  placeholder="10-digit account number"
                  maxLength={10}
                  value={withdrawAccountNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setWithdrawAccountNumber(val);
                    setWithdrawAccountName("");
                  }}
                />
              </div>
              <AppButton
                variant="secondary"
                size="sm"
                onClick={verifyAccount}
                isLoading={isVerifying}
                loadingLabel="Verifying"
                disabled={
                  !withdrawBankCode || withdrawAccountNumber.length < 10 || isVerifying
                }
                className="mb-0.5"
              >
                <Search className="h-4 w-4" />
                Verify
              </AppButton>
            </div>
          </div>

          {/* Account Name (auto-filled) */}
          {withdrawAccountName && (
            <div>
              <FieldInput
                label="Account Name"
                type="text"
                value={withdrawAccountName}
                readOnly
                className="bg-default-100"
              />
            </div>
          )}

          {/* Processing time note */}
          <div className="flex items-start gap-2 rounded-md border border-border p-3">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50" strokeWidth={1.5} />
            <p className="text-xs text-muted-foreground">
              Funds will arrive in <span className="font-medium text-foreground">1–3 business days</span> after processing.
            </p>
          </div>
        </div>
      </AppModal>

      {/* ==================== Dispute Modal ==================== */}
      <AppModal
        isOpen={disputeModalOpen}
        onClose={() => {
          setDisputeModalOpen(false);
          setDisputeHolding(null);
        }}
        title="Report an Issue"
        footer={
          <div className="flex w-full items-center justify-end gap-2">
            <AppButton
              variant="secondary"
              onClick={() => {
                setDisputeModalOpen(false);
                setDisputeHolding(null);
              }}
              disabled={disputeSubmitting}
            >
              Cancel
            </AppButton>
            <AppButton
              variant="primary"
              onClick={handleDisputeSubmit}
              isLoading={disputeSubmitting}
              loadingLabel="Submitting…"
              disabled={disputeSubmitting || !disputeReason.trim()}
            >
              Submit Dispute
            </AppButton>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Holding info */}
          {disputeHolding && (
            <div className="border-b border-border pb-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Escrow Details
              </p>
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">
                    Order: <span className="font-mono">{disputeHolding.orderRef}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Held since {formatRelativeTime(disputeHolding.heldSince)}
                  </p>
                </div>
                <p className="text-sm font-semibold tabular-nums text-foreground">
                  {formatCurrency(disputeHolding.amount)}
                </p>
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <FieldTextarea
              label="Reason for dispute"
              placeholder="Describe the issue with this order..."
              rows={4}
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
            />
          </div>

          {/* Evidence (optional) */}
          <div>
            <FieldInput
              label="Evidence URL (optional)"
              type="text"
              placeholder="Link to screenshots or supporting documents"
              value={disputeEvidence}
              onChange={(e) => setDisputeEvidence(e.target.value)}
            />
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 border border-red-500/30 bg-red-500/10 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500 dark:text-red-400" strokeWidth={1.5} />
            <p className="text-xs text-red-700 dark:text-red-300">
              Opening a dispute will freeze this payment until resolved. This action cannot be undone.
            </p>
          </div>
        </div>
      </AppModal>

      {/* ==================== Delete Bank Confirmation Modal ==================== */}
      <AppModal
        isOpen={Boolean(deleteBankId)}
        onClose={() => setDeleteBankId(null)}
        title="Delete Bank Account?"
        description="This action is irreversible. Any pending withdrawals to this account will continue to process, but you will not be able to request new withdrawals to it."
        footer={
          <div className="flex w-full items-center justify-end gap-2">
            <AppButton
              variant="secondary"
              onClick={() => setDeleteBankId(null)}
              disabled={isDeletingBank}
            >
              Cancel
            </AppButton>
            <AppButton
              variant="danger"
              onClick={confirmDeleteBank}
              isLoading={isDeletingBank}
              loadingLabel="Deleting…"
            >
              Delete Account
            </AppButton>
          </div>
        }
      >
        <div className="space-y-3">
          {(() => {
            const bank = savedBanks.find((b) => b.id === deleteBankId);
            if (!bank) return null;
            return (
              <div className="flex items-start gap-3 rounded-md border border-kwik-border bg-surface p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-kwik-border bg-default-100">
                  <Building2 className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {bank.bankName}
                    {bank.isDefault ? (
                      <span className="ml-2 inline-flex items-center gap-0.5 text-xs font-medium text-yellow-600 dark:text-yellow-400">
                        <Star className="h-3 w-3 fill-yellow-500" />
                        Default
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    <span className="font-mono">{bank.accountNumber}</span>
                    {" · "}
                    {bank.accountName}
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      </AppModal>
    </motion.div>
  );
}

// ─── Accordion Item (local helper) ──────────────────────────────────────────

function AccordionItem({
  id,
  activeId,
  onToggle,
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  id: "balance" | "activity" | "banks";
  activeId: "balance" | "activity" | "banks" | null;
  onToggle: (id: "balance" | "activity" | "banks" | null) => void;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const isOpen = activeId === id;
  return (
    <div className="overflow-hidden rounded-2xl border border-kwik-border bg-surface">
      <button
        type="button"
        onClick={() => onToggle(isOpen ? null : id)}
        className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-default-100/50"
        aria-expanded={isOpen}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        </motion.span>
      </button>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="border-t border-kwik-border p-4">{children}</div>
        </motion.div>
      )}
    </div>
  );
}
