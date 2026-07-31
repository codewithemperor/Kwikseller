/**
 * order-workflow.ts
 * ────────────────────────────────────────────────────────────────────────────
 * SINGLE SOURCE OF TRUTH for the 1688-style order workflow + KwisCrow escrow
 * feature. Components import from here — NO magic strings allowed in views.
 *
 * Status flow (buyer-side):
 *   PENDING_QUOTE → QUOTED → TO_PAY → PAID → PROCESSING → SHIPPED →
 *   OUT_FOR_DELIVERY → DELIVERED → RECEIVED → COMPLETED
 *                                  ↘ DISPUTED (return / issue report)
 *   Any pre-PAID state can → CANCELLED.
 *   DISPUTED can → RETURNED (refunded) or back to COMPLETED (resolved in vendor favor).
 *
 * Escrow (KwisCrow) lifecycle:
 *   1. PAID           → holdInEscrow()              → escrow.status = HELD
 *   2. DELIVERED      → enterDisputeWindow()        → 24-hour dispute timer starts
 *   3a. Customer clicks "Received"                  → releaseToVendor() → RELEASED
 *   3b. 24h elapses, no dispute                     → autoReleaseIfWindowExpired() → RELEASED
 *   3c. Customer opens dispute                      → escrow frozen, dispute.status = OPEN
 *   4. Dispute resolved (buyer refund)              → refundToBuyer()    → REFUNDED
 *   5. Dispute resolved (vendor favor)              → releaseToVendor()  → RELEASED
 */

// ─── Order status ───────────────────────────────────────────────────────────

export const OrderStatus = {
  /** Order placed by buyer, waiting for vendor's quotation (delivery fee / discount / ETA). */
  PENDING_QUOTE: "PENDING_QUOTE",
  /** Vendor submitted quotation; awaiting buyer to proceed to payment. */
  QUOTED: "QUOTED",
  /** Buyer acknowledged the quote — payment action required. */
  TO_PAY: "TO_PAY",
  /** Payment received (escrow held). Vendor begins fulfilment. */
  PAID: "PAID",
  /** Vendor is preparing the order. */
  PROCESSING: "PROCESSING",
  /** Order handed to courier / dispatched. */
  SHIPPED: "SHIPPED",
  /** With delivery rider, en route to buyer. */
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  /** Marked delivered by vendor / rider — escrow now in dispute window. */
  DELIVERED: "DELIVERED",
  /** Buyer clicked "Received" — escrow released to vendor. */
  RECEIVED: "RECEIVED",
  /** Terminal success state. Escrow has settled. */
  COMPLETED: "COMPLETED",
  /** Buyer opened a return / issue report — escrow frozen. */
  DISPUTED: "DISPUTED",
  /** Buyer cancelled before payment, or system voided. */
  CANCELLED: "CANCELLED",
  /** Dispute resolved with buyer refund. */
  RETURNED: "RETURNED",
} as const;

export type OrderStatusValue = (typeof OrderStatus)[keyof typeof OrderStatus];

/** Ordered list of "happy path" fulfilment steps after payment. */
export const FULFILMENT_STEPS: OrderStatusValue[] = [
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
  OrderStatus.RECEIVED,
  OrderStatus.COMPLETED,
];

/** Pre-payment flow (the 1688 "quote first, pay later" pattern). */
export const PRE_PAYMENT_STEPS: OrderStatusValue[] = [
  OrderStatus.PENDING_QUOTE,
  OrderStatus.QUOTED,
  OrderStatus.TO_PAY,
];

/** Statuses that count as "active" for the buyer's order list filter. */
export const ACTIVE_ORDER_STATUSES: OrderStatusValue[] = [
  OrderStatus.PENDING_QUOTE,
  OrderStatus.QUOTED,
  OrderStatus.TO_PAY,
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
  OrderStatus.DISPUTED,
];

/** Statuses that represent a completed (settled) order. */
export const COMPLETED_ORDER_STATUSES: OrderStatusValue[] = [
  OrderStatus.RECEIVED,
  OrderStatus.COMPLETED,
];

/** Statuses that represent a closed / voided order. */
export const CANCELLED_ORDER_STATUSES: OrderStatusValue[] = [
  OrderStatus.CANCELLED,
  OrderStatus.RETURNED,
];

// ─── Status display metadata (label, tone, icon hint) ──────────────────────

export type StatusTone =
  | "default"
  | "accent"
  | "primary"
  | "success"
  | "warning"
  | "danger";

export interface StatusMeta {
  label: string;
  /** Short helper copy shown under the badge / in timeline. */
  hint: string;
  tone: StatusTone;
}

export const ORDER_STATUS_META: Record<OrderStatusValue, StatusMeta> = {
  PENDING_QUOTE: {
    label: "Awaiting quotation",
    hint: "Order sent to vendor — waiting for delivery fee & ETA.",
    tone: "warning",
  },
  QUOTED: {
    label: "Quoted",
    hint: "Vendor submitted a quotation. Review and proceed to payment.",
    tone: "primary",
  },
  TO_PAY: {
    label: "To pay",
    hint: "Confirm your quotation and pay to lock in the order.",
    tone: "accent",
  },
  PAID: {
    label: "Paid",
    hint: "Payment received — held in KwisCrow escrow. Vendor is preparing your order.",
    tone: "success",
  },
  PROCESSING: {
    label: "Processing",
    hint: "Vendor is packing your order.",
    tone: "default",
  },
  SHIPPED: {
    label: "Shipped",
    hint: "Order handed to courier.",
    tone: "primary",
  },
  OUT_FOR_DELIVERY: {
    label: "Out for delivery",
    hint: "Rider is en route to your address.",
    tone: "primary",
  },
  DELIVERED: {
    label: "Delivered",
    hint: "Package delivered. Confirm receipt to release escrow — or open a dispute.",
    tone: "success",
  },
  RECEIVED: {
    label: "Received",
    hint: "You confirmed receipt. Escrow released to vendor.",
    tone: "success",
  },
  COMPLETED: {
    label: "Completed",
    hint: "Order complete.",
    tone: "success",
  },
  DISPUTED: {
    label: "Disputed",
    hint: "A dispute is open. Escrow is frozen pending review.",
    tone: "danger",
  },
  CANCELLED: {
    label: "Cancelled",
    hint: "Order was cancelled before payment.",
    tone: "danger",
  },
  RETURNED: {
    label: "Returned / refunded",
    hint: "Dispute resolved with a buyer refund.",
    tone: "default",
  },
};

// ─── KwisCrow escrow config ────────────────────────────────────────────────

export const KwisCrow = {
  /** Brand display name for the escrow service. */
  NAME: "KwisCrow",
  TAGLINE: "Buyer Protection Escrow",
  /**
   * Number of hours after the vendor's estimated delivery deadline expires
   * during which the buyer can still open a dispute. After this window the
   * escrow auto-releases to the vendor (assuming no dispute is open).
   */
  DISPUTE_WINDOW_HOURS: 24,
  /** Convenience: dispute window expressed in milliseconds. */
  DISPUTE_WINDOW_MS: 24 * 60 * 60 * 1000,
  /** Platform fee charged to the vendor on release (display only — mock). */
  PLATFORM_FEE_BPS: 200, // 2.00%
} as const;

export const EscrowStatus = {
  /** Funds held by KwisCrow — not yet released to vendor or refunded to buyer. */
  HELD: "HELD",
  /** Released to vendor (either by buyer confirmation or auto-release). */
  RELEASED: "RELEASED",
  /** Refunded to buyer (dispute resolved in buyer favor). */
  REFUNDED: "REFUNDED",
} as const;

export type EscrowStatusValue = (typeof EscrowStatus)[keyof typeof EscrowStatus];

export interface EscrowStatusMeta {
  label: string;
  hint: string;
  tone: StatusTone;
}

export const ESCROW_STATUS_META: Record<EscrowStatusValue, EscrowStatusMeta> = {
  HELD: {
    label: "Held in escrow",
    hint: "Your payment is safely held by KwisCrow. The vendor is paid only after you confirm receipt.",
    tone: "primary",
  },
  RELEASED: {
    label: "Released to vendor",
    hint: "Escrow released — vendor has been paid.",
    tone: "success",
  },
  REFUNDED: {
    label: "Refunded to buyer",
    hint: "Escrow refunded to you following a dispute.",
    tone: "default",
  },
};

// ─── Disputes ──────────────────────────────────────────────────────────────

export const DisputeStatus = {
  /** Buyer just opened the dispute; escrow is frozen. */
  OPEN: "OPEN",
  /** KwisCrow support team is reviewing the case. */
  UNDER_REVIEW: "UNDER_REVIEW",
  /** Dispute closed — escrow settled one way or the other. */
  RESOLVED: "RESOLVED",
} as const;

export type DisputeStatusValue =
  (typeof DisputeStatus)[keyof typeof DisputeStatus];

export const DisputeType = {
  /** Buyer wants to send the item back and get a refund. */
  RETURN_REQUEST: "RETURN_REQUEST",
  /** Buyer is reporting a problem (damaged / wrong / missing) but may keep item with partial refund. */
  ISSUE_REPORT: "ISSUE_REPORT",
} as const;

export type DisputeTypeValue = (typeof DisputeType)[keyof typeof DisputeType];

export interface DisputeTypeMeta {
  label: string;
  description: string;
}

export const DISPUTE_TYPE_META: Record<DisputeTypeValue, DisputeTypeMeta> = {
  RETURN_REQUEST: {
    label: "Request a return",
    description:
      "Send the item back to the vendor for a full refund. Escrow stays frozen until the return is received.",
  },
  ISSUE_REPORT: {
    label: "Report an issue",
    description:
      "Report a damaged, wrong, or missing item. You may keep the item and request a partial refund, or escalate to a full return.",
  },
};

/** Pre-set return reason presets shown as a chip / dropdown in the dialog. */
export const RETURN_REASON_PRESETS: string[] = [
  "Item arrived damaged",
  "Wrong item delivered",
  "Item does not match description",
  "Missing parts or accessories",
  "Item is defective / faulty",
  "Changed my mind",
  "Ordered by mistake",
  "Item arrived too late",
];

/** Pre-set issue-report presets. */
export const ISSUE_REASON_PRESETS: string[] = [
  "Package never arrived",
  "Seal broken / tampered with",
  "Counterfeit / not authentic",
  "Quantity mismatch (fewer items than ordered)",
  "Quality not as advertised",
  "Wrong size / variant",
  "Item missing from package",
  "Other issue",
];

// ─── Notification templates ────────────────────────────────────────────────

export type NotificationTemplateKey =
  | "QUOTATION_RECEIVED"
  | "PAYMENT_SUCCESS"
  | "ORDER_PROCESSING"
  | "ORDER_SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "ORDER_DELIVERED"
  | "ESCROW_RELEASED"
  | "ESCROW_REFUNDED"
  | "DISPUTE_WINDOW_OPENED"
  | "DISPUTE_OPENED"
  | "DISPUTE_RESOLVED"
  | "ORDER_CANCELLED";

export interface NotificationTemplate {
  title: string;
  /** `{{orderRef}}` / `{{vendorName}}` / `{{amount}}` placeholders are interpolated by the store. */
  body: string;
  tone: StatusTone;
}

export const NOTIFICATION_TEMPLATES: Record<
  NotificationTemplateKey,
  NotificationTemplate
> = {
  QUOTATION_RECEIVED: {
    title: "Quotation ready",
    body: "Your order to {{vendorName}} ({{orderRef}}) is now ready for payment.",
    tone: "primary",
  },
  PAYMENT_SUCCESS: {
    title: "Payment confirmed",
    body: "We received your payment of {{amount}} for order {{orderRef}}. Held safely in KwisCrow escrow.",
    tone: "success",
  },
  ORDER_PROCESSING: {
    title: "Vendor is preparing your order",
    body: "{{vendorName}} started processing order {{orderRef}}.",
    tone: "default",
  },
  ORDER_SHIPPED: {
    title: "Order shipped",
    body: "Order {{orderRef}} is on its way.",
    tone: "primary",
  },
  OUT_FOR_DELIVERY: {
    title: "Out for delivery",
    body: "Your rider is en route with order {{orderRef}}.",
    tone: "primary",
  },
  ORDER_DELIVERED: {
    title: "Order delivered",
    body: "Order {{orderRef}} has been delivered. Confirm receipt — or open a dispute within 24 hours.",
    tone: "success",
  },
  ESCROW_RELEASED: {
    title: "Escrow released",
    body: "KwisCrow released {{amount}} to {{vendorName}} for order {{orderRef}}.",
    tone: "success",
  },
  ESCROW_REFUNDED: {
    title: "Refund processed",
    body: "KwisCrow refunded {{amount}} to you for order {{orderRef}}.",
    tone: "default",
  },
  DISPUTE_WINDOW_OPENED: {
    title: "Dispute window open",
    body: "Order {{orderRef}} was delivered. You have 24 hours to open a dispute before escrow auto-releases.",
    tone: "warning",
  },
  DISPUTE_OPENED: {
    title: "Dispute opened",
    body: "Your dispute on order {{orderRef}} is now under review. Escrow is frozen.",
    tone: "danger",
  },
  DISPUTE_RESOLVED: {
    title: "Dispute resolved",
    body: "The dispute on order {{orderRef}} has been resolved.",
    tone: "success",
  },
  ORDER_CANCELLED: {
    title: "Order cancelled",
    body: "Order {{orderRef}} was cancelled.",
    tone: "danger",
  },
};

// ─── Payment provider config (display-only — backend owns the truth) ───────

export type PaymentProviderKey = "PAYSTACK" | "FLUTTERWAVE" | "WALLET";

export interface PaymentProviderMeta {
  key: PaymentProviderKey;
  label: string;
  /** Short marketing line shown on the verify page. */
  blurb: string;
}

export const PAYMENT_PROVIDERS: Record<PaymentProviderKey, PaymentProviderMeta> =
  {
    PAYSTACK: {
      key: "PAYSTACK",
      label: "Paystack",
      blurb: "Card / bank transfer / USSD — verified by Paystack.",
    },
    FLUTTERWAVE: {
      key: "FLUTTERWAVE",
      label: "Flutterwave",
      blurb: "Card / bank transfer / mobile money — verified by Flutterwave.",
    },
    WALLET: {
      key: "WALLET",
      label: "KwikCoins Wallet",
      blurb: "Instant payment from your Kwikseller wallet balance.",
    },
  };

/** Default provider used by the verify page when none is specified. */
export const DEFAULT_PAYMENT_PROVIDER: PaymentProviderKey = "PAYSTACK";

/** Hard cap on dispute description length (mirrors DisputeModal). */
export const DISPUTE_DESCRIPTION_MAX_LENGTH = 500;

/** Mock vendor seed used by the in-memory store when no vendorId is supplied. */
export const MOCK_VENDOR = {
  id: "vendor-aurora-001",
  name: "Aurora General Trading",
  logo: null,
  rating: 4.7,
  reviewCount: 1248,
} as const;

/** Currency formatter shared by the workflow UI. */
export const CURRENCY_CODE = "NGN" as const;
export const CURRENCY_LOCALE = "en-NG" as const;
