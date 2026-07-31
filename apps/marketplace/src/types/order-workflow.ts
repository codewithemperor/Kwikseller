/**
 * types/order-workflow.ts
 * ────────────────────────────────────────────────────────────────────────────
 * TypeScript types for the 1688-style order workflow + KwisCrow escrow.
 *
 * Status enums are re-exported from `constants/order-workflow` as types so
 * there is exactly ONE runtime definition (the `as const` object) and the
 * types just point at it.
 */

import type {
  OrderStatusValue,
  EscrowStatusValue,
  DisputeStatusValue,
  DisputeTypeValue,
  StatusTone,
} from "@/constants/order-workflow";

// ─── Status unions (derived from the runtime constants) ────────────────────

export type OrderStatus = OrderStatusValue;
export type EscrowStatus = EscrowStatusValue;
export type DisputeStatus = DisputeStatusValue;
export type DisputeType = DisputeTypeValue;

// ─── Quotation ─────────────────────────────────────────────────────────────

/**
 * Quotation submitted by the vendor after the buyer places an order without
 * paying. Drives the cost breakdown shown in the QuotationCard.
 *
 * All monetary amounts are in NGN (kobo avoided for mock simplicity).
 */
export interface Quotation {
  /** Delivery / shipping fee the vendor is charging. */
  deliveryFee: number;
  /** Flat discount the vendor is offering (NGN). */
  discount: number;
  /** Earliest the vendor expects to deliver (ISO string). */
  deliveryDateMin: string;
  /** Latest the vendor expects to deliver (ISO string). */
  deliveryDateMax: string;
  /** Optional free-form note from the vendor. */
  note?: string;
  /** ISO timestamp of when the vendor submitted the quotation. */
  createdAt: string;
}

// ─── Escrow (KwisCrow) ─────────────────────────────────────────────────────

/**
 * Snapshot of the KwisCrow escrow state for an order.
 * `heldAt` is set when the buyer pays; `releasedAt` / `refundedAt` are set
 * by the corresponding escrow service functions.
 */
export interface EscrowRecord {
  orderId: string;
  /** Total amount held (NGN) — equals order total after quotation. */
  amount: number;
  status: EscrowStatus;
  /** ISO timestamp when funds were captured into escrow (= payment time). */
  heldAt?: string;
  /** ISO timestamp when funds were released to vendor. */
  releasedAt?: string;
  /** ISO timestamp when funds were refunded to buyer. */
  refundedAt?: string;
  /** Reason for the most recent release / refund (audit trail). */
  lastActionReason?: string;
  /**
   * Deadline after which escrow auto-releases to vendor if no dispute is open.
   * Set when the order is marked DELIVERED — = deliveryDateMax + 24h.
   */
  autoReleaseAt?: string;
}

// ─── Disputes ──────────────────────────────────────────────────────────────

export interface Dispute {
  id: string;
  /** Discriminator: return-request vs. issue-report. */
  type: DisputeType;
  /** One of the presets from RETURN_REASON_PRESETS / ISSUE_REASON_PRESETS, or free text. */
  reason: string;
  /** Long-form description supplied by the buyer. */
  description?: string;
  /** ISO timestamp. */
  createdAt: string;
  status: DisputeStatus;
  /** ISO timestamp — only present once status === RESOLVED. */
  resolvedAt?: string;
  /** Optional resolution note. */
  resolutionNote?: string;
}

// ─── Fulfilment timeline ───────────────────────────────────────────────────

export interface FulfilmentStep {
  status: OrderStatus;
  /** Whether the order has reached this step. */
  reached: boolean;
  /** ISO timestamp when the step was reached (if it has been). */
  reachedAt?: string;
  /** Optional human-readable note attached to this step. */
  note?: string;
}

// ─── Timeline events ───────────────────────────────────────────────────────

export interface OrderTimelineEvent {
  id: string;
  /** ISO timestamp of the event. */
  at: string;
  /** Short title shown in the timeline (e.g. "Order placed"). */
  title: string;
  /** Optional longer description. */
  description?: string;
  /** Tone for the icon dot — matches the status tone palette. */
  tone: StatusTone;
}

// ─── Order line item (mock) ────────────────────────────────────────────────

export interface OrderLineItem {
  id: string;
  productId: string;
  name: string;
  /** Unit price (NGN) — pre-discount. */
  unitPrice: number;
  quantity: number;
  /** Optional image URL (falls back to placeholder). */
  image?: string;
}

// ─── Workflow order (composite) ────────────────────────────────────────────

/**
 * OrderWorkflowState — the full state for one order in the new workflow.
 * Combines identity, line items, quotation, escrow, dispute, fulfilment
 * timeline, and an audit-trail event log.
 */
export interface OrderWorkflowState {
  id: string;
  /** Short human-readable reference (last 8 of id, uppercased). */
  ref: string;
  /** Vendor snapshot. */
  vendor: {
    id: string;
    name: string;
    logo?: string | null;
    rating?: number;
    reviewCount?: number;
  };
  /** Buyer-side items. */
  items: OrderLineItem[];
  /** Delivery address (free-form line). */
  deliveryAddress: string;
  /** Current status. */
  status: OrderStatus;
  /** Quotation submitted by vendor (present once status >= QUOTED). */
  quotation?: Quotation;
  /** Escrow record (present once status >= PAID). */
  escrow?: EscrowRecord;
  /** Active dispute (present once the buyer opens one). */
  dispute?: Dispute;
  /** Fulfilment step markers (PAID → COMPLETED). */
  fulfilmentSteps: FulfilmentStep[];
  /** Audit-trail timeline events (newest first). */
  timeline: OrderTimelineEvent[];
  /** ISO timestamp of order placement. */
  createdAt: string;
  /** ISO timestamp of last status change. */
  updatedAt: string;
}

// ─── Computed selectors ────────────────────────────────────────────────────

export interface OrderCostBreakdown {
  /** Sum of (unitPrice × quantity) across all items. */
  subtotal: number;
  deliveryFee: number;
  discount: number;
  /** Final total the buyer pays. */
  total: number;
}
