"use client";
import { create } from "zustand";
import { paymentsApi, escrowApi } from "@kwikseller/api-client";
import { unwrapApiData } from "@/lib/vendor-format";

const WALLET_CACHE_MS = 30_000;

type WalletBalance = {
  available: number;
  pending: number;
  total: number;
};

type WalletTransaction = {
  id: string;
  type: string; // ESCROW_RELEASE, WITHDRAWAL, ESCROW_HOLD, REFUND, etc.
  reference: string; // Order ref or WTH-xxx
  amount: number;
  status: string; // COMPLETED, PROCESSING, HELD, PENDING, FAILED
  createdAt: string;
  description?: string;
};

type EscrowHolding = {
  id: string;
  orderId: string;
  deliveryId: string;
  amount: number;
  status: 'HELD' | 'PENDING_RELEASE' | 'RELEASED' | 'DISPUTED' | 'PARTIAL';
  heldSince: string;       // ISO date
  expectedRelease: string; // ISO date (only for PENDING_RELEASE)
  orderRef: string;
  createdAt: string;
};

type WalletState = {
  balance: WalletBalance | null;
  transactions: WalletTransaction[];
  isLoading: boolean;
  isTransactionsLoading: boolean;
  error: string | null;
  lastFetchedAt: number;
  transactionsPage: number;
  transactionsTotalPages: number;
  transactionsTotal: number;

  // Escrow holdings
  escrowHoldings: EscrowHolding[];
  escrowLoading: boolean;

  fetchWallet: (force?: boolean) => Promise<void>;
  fetchTransactions: (page?: number) => Promise<void>;
  fetchEscrowHoldings: () => Promise<void>;
  requestWithdrawal: (data: {
    amount: number;
    bankCode: string;
    accountNumber: string;
    accountName: string;
  }) => Promise<void>;
  refresh: () => Promise<void>;
};

export type { WalletBalance, WalletTransaction, EscrowHolding };

export const useVendorWalletStore = create<WalletState>((set, get) => ({
  balance: null,
  transactions: [],
  isLoading: false,
  isTransactionsLoading: false,
  error: null,
  lastFetchedAt: 0,
  transactionsPage: 1,
  transactionsTotalPages: 1,
  transactionsTotal: 0,

  // Escrow holdings
  escrowHoldings: [],
  escrowLoading: false,

  fetchWallet: async (force = false) => {
    const state = get();
    const fresh = Date.now() - state.lastFetchedAt < WALLET_CACHE_MS;
    if (!force && fresh && state.balance) return;

    set({ isLoading: true, error: null });
    try {
      const response = await paymentsApi.getWallet();
      const balance = unwrapApiData<WalletBalance>(response.data);
      set({
        balance: balance ?? { available: 0, pending: 0, total: 0 },
        isLoading: false,
        lastFetchedAt: Date.now(),
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not load wallet balance";
      set({ error: message, isLoading: false });
    }
  },

  fetchTransactions: async (page = 1) => {
    set({ isTransactionsLoading: true, error: null });
    try {
      const response = await paymentsApi.getWalletTransactions({
        page,
        limit: 20,
      });
      const raw = unwrapApiData<WalletTransaction[] | WalletTransaction>(
        response.data
      );

      // Handle paginated vs array response
      const txns = Array.isArray(raw)
        ? raw
        : raw && typeof raw === "object" && !Array.isArray(raw)
          ? []
          : [];

      set({
        transactions: txns,
        transactionsPage: response.meta?.page ?? page,
        transactionsTotalPages: response.meta?.totalPages ?? 1,
        transactionsTotal: response.meta?.total ?? txns.length,
        isTransactionsLoading: false,
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Could not load transaction history";
      set({ error: message, isTransactionsLoading: false });
    }
  },

  fetchEscrowHoldings: async () => {
    set({ escrowLoading: true });
    try {
      const response = await escrowApi.getHoldings();
      const raw = unwrapApiData<EscrowHolding[] | EscrowHolding>(response.data);
      const holdings = Array.isArray(raw) ? raw : [];
      set({ escrowHoldings: holdings, escrowLoading: false });
    } catch {
      set({ escrowLoading: false });
    }
  },

  requestWithdrawal: async (data) => {
    try {
      await paymentsApi.requestWithdrawal(data);
      // Refresh wallet and transactions after successful withdrawal
      await get().fetchWallet(true);
      await get().fetchTransactions(1);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Withdrawal request failed";
      set({ error: message });
      throw err;
    }
  },

  refresh: async () => {
    await Promise.all([
      get().fetchWallet(true),
      get().fetchTransactions(1),
      get().fetchEscrowHoldings(),
    ]);
  },
}));
