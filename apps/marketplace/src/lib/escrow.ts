/**
 * @kwikseller/marketplace — lib/escrow.ts
 * ────────────────────────────────────────────────────────────────────────────
 * KwisCrow Escrow Service
 * ────────────────────────────────────────────────────────────────────────────
 * Pure functions that implement the KwisCrow escrow lifecycle. They operate on
 * an in-memory store of escrow records + delegate state mutation back to the
 * Zustand order-workflow-store (so React components re-render automatically).
 *
 * ── KwisCrow escrow lifecycle ──────────────────────────────────────────────
 *
 *   ┌────────────┐  buyer pays   ┌────────────┐  vendor marks delivered
 *   │  (no escrow)│ ───────────▶ │   HELD      │ ───────────────────────┐
 *   └────────────┘               └────────────┘                         │
 *                                      │                                 ▼
 *                                      │  buyer clicks "Received"   ┌───────────┐
 *                                      │ ─────────────────────────▶ │ RELEASED  │
 *                                      │                            └───────────┘
 *                                      │
 *                                      │  24h elapses (no dispute) → auto-release
 *                                      │ ─────────────────────────▶ │ RELEASED  │
 *                                      │                            └───────────┘
 *                                      │
 *                                      │  buyer opens dispute
 *                                      │ ──────────────▶ (escrow frozen, not a status change)
 *                                      │
 *                                      │  dispute resolved in vendor favor → releaseToVendor
 *                                      │ ─────────────────────────▶ │ RELEASED  │
 *                                      │                            └───────────┘
 *                                      │
 *                                      │  dispute resolved in buyer favor → refundToBuyer
 *                                      │ ─────────────────────────▶ │ REFUNDED  │
 *                                                                   └───────────┘
 *
 * Functions:
 *   - holdInEscrow(orderId, amount)            → sets status = HELD
 *   - releaseToVendor(orderId, reason)         → sets status = RELEASED
 *   - refundToBuyer(orderId, reason)           → sets status = REFUNDED
 *   - enterDisputeWindow(orderId)              → sets autoReleaseAt = now + 24h
 *   - autoReleaseIfWindowExpired(orderId, deadline)
 *                                               → releases if deadline passed
 *   - getEscrowStatus(orderId)                 → reads status (or null)
 *   - isWithinDisputeWindow(deadline)          → pure boolean check
 *
 * Each function is written so that the actual persistence can later be moved
 * behind the `escrowApi` from `@kwikseller/api-client` (which already exposes
 * getEscrowDetail / manualRelease / refund / openDispute). For now the in-memory
 * store + the Zustand store handle persistence; the function signatures match
 * what a remote-backed implementation would need.
 */

import { KwisCrow, EscrowStatus } from "@/constants/order-workflow";
import type { EscrowStatus as EscrowStatusType } from "@/types/order-workflow";

// ─── In-memory escrow store (mock) ─────────────────────────────────────────
//
// In production this entire module would be replaced by `escrowApi` calls.
// The in-memory map is keyed by orderId so the store + the service can both
// find a record cheaply. We expose a small CRUD surface so the Zustand store
// can hydrate it from persisted state on app boot.

interface EscrowRecordInternal {
  orderId: string;
  amount: number;
  status: EscrowStatusType;
  heldAt?: string;
  releasedAt?: string;
  refundedAt?: string;
  lastActionReason?: string;
  autoReleaseAt?: string;
}

const escrowStore = new Map<string, EscrowRecordInternal>();

/**
 * Hydrate the in-memory store from the persisted Zustand snapshot.
 * Called once on app boot by the order-workflow-store.
 */
export function hydrateEscrowStore(
  records: Array<EscrowRecordInternal>,
): void {
  escrowStore.clear();
  for (const r of records) {
    escrowStore.set(r.orderId, { ...r });
  }
}

/**
 * Read a snapshot of the in-memory store — used by the Zustand store to
 * persist escrow state across reloads.
 */
export function snapshotEscrowStore(): EscrowRecordInternal[] {
  return Array.from(escrowStore.values());
}

/**
 * Reset the in-memory escrow store. Test-only convenience; safe to call from
 * the UI's "Reset demo data" action.
 */
export function resetEscrowStore(): void {
  escrowStore.clear();
}

// ─── Pure helpers ──────────────────────────────────────────────────────────

/**
 * Is the dispute window still open for the given deadline?
 * Pure — does not touch the store.
 */
export function isWithinDisputeWindow(deadline: string | Date): boolean {
  const deadlineMs =
    typeof deadline === "string" ? new Date(deadline).getTime() : deadline.getTime();
  if (Number.isNaN(deadlineMs)) return false;
  return Date.now() < deadlineMs;
}

/**
 * Format a remaining-time label for the dispute timer UI.
 * Returns "HH:MM:SS" counting down to the deadline, or "00:00:00" if expired.
 */
export function formatDisputeCountdown(deadline: string | Date): string {
  const deadlineMs =
    typeof deadline === "string" ? new Date(deadline).getTime() : deadline.getTime();
  const remaining = Math.max(0, deadlineMs - Date.now());
  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

// ─── Mutations ─────────────────────────────────────────────────────────────
//
// Each mutation writes to the in-memory store AND calls the optional callback
// the Zustand store registers. The callback is what keeps the React state in
// sync without forcing this module to import Zustand directly.

type EscrowChangeCallback = (
  orderId: string,
  record: EscrowRecordInternal,
) => void;

let onChange: EscrowChangeCallback | null = null;

/**
 * Register the callback the Zustand store uses to mirror mutations into React
 * state. Idempotent — calling it again replaces the previous callback.
 */
export function registerEscrowChangeListener(
  cb: EscrowChangeCallback,
): () => void {
  onChange = cb;
  return () => {
    if (onChange === cb) onChange = null;
  };
}

function emit(orderId: string, record: EscrowRecordInternal): void {
  onChange?.(orderId, { ...record });
}

function requireRecord(orderId: string): EscrowRecordInternal {
  const record = escrowStore.get(orderId);
  if (!record) {
    throw new Error(
      `[KwisCrow] No escrow record for order ${orderId}. Call holdInEscrow() first.`,
    );
  }
  return record;
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Capture the buyer's payment into KwisCrow escrow. Creates a new HELD record
 * if none exists; idempotent if the record is already HELD with the same amount.
 *
 * In production this would call `escrowApi` (which posts to /vendor/escrow/...).
 */
export function holdInEscrow(orderId: string, amount: number): EscrowRecordInternal {
  const existing = escrowStore.get(orderId);
  if (existing && existing.status === EscrowStatus.HELD && existing.amount === amount) {
    return { ...existing };
  }

  const record: EscrowRecordInternal = {
    orderId,
    amount,
    status: EscrowStatus.HELD,
    heldAt: new Date().toISOString(),
    ...(existing?.autoReleaseAt ? { autoReleaseAt: existing.autoReleaseAt } : {}),
  };
  escrowStore.set(orderId, record);
  emit(orderId, record);
  return { ...record };
}

/**
 * Release escrowed funds to the vendor. Idempotent — if already released,
 * returns the existing record unchanged.
 */
export function releaseToVendor(
  orderId: string,
  reason: string,
): EscrowRecordInternal {
  const record = requireRecord(orderId);
  if (record.status === EscrowStatus.RELEASED) {
    return { ...record };
  }
  if (record.status === EscrowStatus.REFUNDED) {
    throw new Error(
      `[KwisCrow] Cannot release order ${orderId} to vendor — already refunded.`,
    );
  }
  const updated: EscrowRecordInternal = {
    ...record,
    status: EscrowStatus.RELEASED,
    releasedAt: new Date().toISOString(),
    lastActionReason: reason,
  };
  escrowStore.set(orderId, updated);
  emit(orderId, updated);
  return { ...updated };
}

/**
 * Refund escrowed funds to the buyer. Idempotent.
 */
export function refundToBuyer(
  orderId: string,
  reason: string,
): EscrowRecordInternal {
  const record = requireRecord(orderId);
  if (record.status === EscrowStatus.REFUNDED) {
    return { ...record };
  }
  if (record.status === EscrowStatus.RELEASED) {
    throw new Error(
      `[KwisCrow] Cannot refund order ${orderId} — already released to vendor.`,
    );
  }
  const updated: EscrowRecordInternal = {
    ...record,
    status: EscrowStatus.REFUNDED,
    refundedAt: new Date().toISOString(),
    lastActionReason: reason,
  };
  escrowStore.set(orderId, updated);
  emit(orderId, updated);
  return { ...updated };
}

/**
 * Start the 24-hour dispute window after delivery. Sets `autoReleaseAt` to
 * now + DISPUTE_WINDOW_MS. Idempotent — calling twice keeps the original
 * deadline (so refreshing the page doesn't reset the clock).
 */
export function enterDisputeWindow(orderId: string): EscrowRecordInternal {
  const record = requireRecord(orderId);
  if (record.autoReleaseAt) {
    // Already entered — keep the original deadline.
    return { ...record };
  }
  const updated: EscrowRecordInternal = {
    ...record,
    autoReleaseAt: new Date(
      Date.now() + KwisCrow.DISPUTE_WINDOW_MS,
    ).toISOString(),
  };
  escrowStore.set(orderId, updated);
  emit(orderId, updated);
  return { ...updated };
}

/**
 * If the dispute window deadline has passed and no dispute is open, release
 * the funds to the vendor automatically.
 *
 * Returns the (possibly updated) record. The caller (the Zustand store) is
 * responsible for checking whether a dispute is open before calling this —
 * we treat the absence of a "disputeOpen" flag as "no dispute".
 */
export function autoReleaseIfWindowExpired(
  orderId: string,
  deadline: string | Date,
  opts: { disputeOpen?: boolean } = {},
): EscrowRecordInternal {
  const record = requireRecord(orderId);

  // If already settled, nothing to do.
  if (
    record.status === EscrowStatus.RELEASED ||
    record.status === EscrowStatus.REFUNDED
  ) {
    return { ...record };
  }

  // If a dispute is open, never auto-release.
  if (opts.disputeOpen) return { ...record };

  if (isWithinDisputeWindow(deadline)) {
    // Still inside the window — no-op.
    return { ...record };
  }

  // Window expired — release to vendor.
  return releaseToVendor(
    orderId,
    `Auto-released: ${KwisCrow.DISPUTE_WINDOW_HOURS}h dispute window expired with no dispute opened.`,
  );
}

/**
 * Read the escrow status for an order. Returns null if no record exists.
 */
export function getEscrowStatus(orderId: string): EscrowStatusType | null {
  return escrowStore.get(orderId)?.status ?? null;
}

/**
 * Read the full escrow record. Returns null if none exists.
 */
export function getEscrowRecord(orderId: string): EscrowRecordInternal | null {
  const record = escrowStore.get(orderId);
  return record ? { ...record } : null;
}
