/**
 * stores/order-workflow-store.ts
 * ────────────────────────────────────────────────────────────────────────────
 * Zustand store (persisted) holding mock orders + their full workflow state:
 * status, quotation, escrow, dispute, fulfilment steps, and an audit-trail
 * timeline.
 *
 * The store is the UI's source of truth for the order workflow in this sandbox
 * (no live API). It delegates escrow mutations to `lib/escrow.ts` so the escrow
 * service can later be swapped for `escrowApi` from `@kwikseller/api-client`
 * without changing any component code.
 *
 * Seeded with 3 mock orders covering three distinct stages:
 *   - order-aurora-001: PENDING_QUOTE  → buyer just placed order, vendor hasn't quoted yet
 *   - order-aurora-002: DELIVERED      → in dispute window (escrow HELD)
 *   - order-aurora-003: RECEIVED       → escrow RELEASED, terminal-ish state
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import {
  OrderStatus,
  EscrowStatus,
  DisputeStatus,
  DisputeType,
  KwisCrow,
  MOCK_VENDOR,
  NOTIFICATION_TEMPLATES,
  type NotificationTemplateKey,
  type OrderStatusValue,
  type DisputeTypeValue,
} from "@/constants/order-workflow";
import type {
  Dispute,
  EscrowRecord,
  FulfilmentStep,
  OrderCostBreakdown,
  OrderLineItem,
  OrderTimelineEvent,
  OrderWorkflowState,
  Quotation,
} from "@/types/order-workflow";
import {
  holdInEscrow,
  releaseToVendor,
  refundToBuyer,
  enterDisputeWindow,
  autoReleaseIfWindowExpired,
  registerEscrowChangeListener,
  hydrateEscrowStore,
  snapshotEscrowStore,
} from "@/lib/escrow";

// ─── Helpers ───────────────────────────────────────────────────────────────

function nowIso(): string {
  return new Date().toISOString();
}

function isoDaysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function isoHoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function isoHoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function makeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}${Date.now()
    .toString(36)
    .slice(-4)}`;
}

function makeRef(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

/**
 * Compute the cost breakdown from items + quotation.
 * Returns zeros for deliveryFee/discount when no quotation exists.
 */
export function computeCostBreakdown(
  items: OrderLineItem[],
  quotation?: Quotation,
): OrderCostBreakdown {
  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const deliveryFee = quotation?.deliveryFee ?? 0;
  const discount = quotation?.discount ?? 0;
  const total = Math.max(0, subtotal + deliveryFee - discount);
  return { subtotal, deliveryFee, discount, total };
}

/**
 * Build the canonical fulfilment-step array for a given status.
 * Steps before the current one are marked `reached: true` with the order's
 * timeline timestamps; the current step is also reached.
 */
function buildFulfilmentSteps(
  status: OrderStatusValue,
  timeline: OrderTimelineEvent[],
): FulfilmentStep[] {
  const ordered: OrderStatusValue[] = [
    OrderStatus.PAID,
    OrderStatus.PROCESSING,
    OrderStatus.SHIPPED,
    OrderStatus.OUT_FOR_DELIVERY,
    OrderStatus.DELIVERED,
    OrderStatus.RECEIVED,
    OrderStatus.COMPLETED,
  ];
  const currentIndex = ordered.indexOf(status);
  return ordered.map((stepStatus) => {
    const reached =
      currentIndex >= 0 && ordered.indexOf(stepStatus) <= currentIndex;
    // Best-effort timestamp lookup from the timeline (by title match).
    const reachedAt = reached
      ? timeline.find((e) =>
          e.title.toLowerCase().includes(stepStatus.toLowerCase().replace(/_/g, " ")),
        )?.at
      : undefined;
    return { status: stepStatus, reached, reachedAt };
  });
}

/**
 * Interpolate {{orderRef}} / {{vendorName}} / {{amount}} placeholders.
 */
function interpolate(
  template: string,
  ctx: { orderRef?: string; vendorName?: string; amount?: string },
): string {
  return template
    .replace(/\{\{orderRef\}\}/g, ctx.orderRef ?? "")
    .replace(/\{\{vendorName\}\}/g, ctx.vendorName ?? "")
    .replace(/\{\{amount\}\}/g, ctx.amount ?? "");
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Notification helpers ──────────────────────────────────────────────────
//
// We piggyback on the existing notification-store via a module-level listener
// so we don't pull it into the persistence graph (it would create a cycle).
// The component layer is responsible for actually rendering these — the store
// just exposes the latest list.

export interface WorkflowNotification {
  id: string;
  templateKey: NotificationTemplateKey;
  title: string;
  body: string;
  at: string;
  orderId: string;
  orderRef: string;
  read: boolean;
}

// ─── Store shape ───────────────────────────────────────────────────────────

interface PlaceOrderInput {
  items: Array<
    Pick<OrderLineItem, "productId" | "name" | "unitPrice" | "quantity" | "image">
  >;
  vendorId?: string;
  vendorName?: string;
  deliveryAddress?: string;
}

interface OrderWorkflowStateStore {
  orders: OrderWorkflowState[];
  notifications: WorkflowNotification[];
  hydrated: boolean;

  // ── Selectors (via getters in zustand) ──
  getOrder: (orderId: string) => OrderWorkflowState | undefined;
  getCostBreakdown: (orderId: string) => OrderCostBreakdown | null;

  // ── Lifecycle actions ──
  placeOrder: (input: PlaceOrderInput) => OrderWorkflowState;
  submitQuotation: (orderId: string, quotation: Quotation) => void;
  markToPay: (orderId: string) => void;
  payOrder: (orderId: string) => void;
  advanceFulfilment: (orderId: string) => void;
  confirmReceipt: (orderId: string) => void;
  cancelOrder: (orderId: string) => void;
  openDispute: (
    orderId: string,
    type: DisputeTypeValue,
    reason: string,
    description?: string,
  ) => void;
  resolveDispute: (
    orderId: string,
    outcome: "VENDOR" | "BUYER",
    note?: string,
  ) => void;
  autoReleaseEscrow: () => void;

  // ── Notifications ──
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;

  // ── Internal: hydrate escrow mirror + register listener ──
  _init: () => () => void;

  // ── Demo helpers ──
  resetToSeed: () => void;
}

// ─── Seed data ─────────────────────────────────────────────────────────────

function seedOrders(): OrderWorkflowState[] {
  // ── Order 1: TO_PAY (vendor quoted, waiting for payment) ────────────────
  // Demonstrates the central 1688 flow: vendor has submitted a quotation
  // (delivery fee, discount, ETA) and the buyer now sees the QuotationCard
  // with the "Pay now" CTA.
  const order1Items: OrderLineItem[] = [
    {
      id: "li-001",
      productId: "prod-001",
      name: "Ankara Cotton Print (6 yards)",
      unitPrice: 12500,
      quantity: 2,
      image: null,
    },
    {
      id: "li-002",
      productId: "prod-002",
      name: "Kente Stole — Handwoven",
      unitPrice: 8500,
      quantity: 1,
      image: null,
    },
  ];
  const order1Quotation: Quotation = {
    deliveryFee: 2000,
    discount: 1500,
    deliveryDateMin: isoDaysFromNow(3),
    deliveryDateMax: isoDaysFromNow(6),
    note: "Free gift wrapping included. Express dispatch available on request.",
    createdAt: isoHoursAgo(1),
  };
  const order1Timeline: OrderTimelineEvent[] = [
    {
      id: "ev-001",
      at: isoHoursAgo(2),
      title: "Order placed",
      description:
        "Order sent to Aurora General Trading. Waiting for the vendor's quotation (delivery fee, ETA).",
      tone: "warning",
    },
    {
      id: "ev-002",
      at: isoHoursAgo(1),
      title: "Quotation received",
      description:
        "Delivery fee ₦2,000 • Discount ₦1,500 • ETA 3–6 days. Vendor note: 'Free gift wrapping included…'",
      tone: "primary",
    },
    {
      id: "ev-003",
      at: isoHoursAgo(1),
      title: "Marked To Pay",
      description: "Order is ready for payment.",
      tone: "accent",
    },
  ];

  // ── Order 2: DELIVERED (in dispute window, escrow HELD) ─────────────────
  const order2Items: OrderLineItem[] = [
    {
      id: "li-003",
      productId: "prod-003",
      name: "Samsung Galaxy A05 (4GB / 64GB)",
      unitPrice: 142000,
      quantity: 1,
      image: null,
    },
    {
      id: "li-004",
      productId: "prod-004",
      name: "Premium Phone Case",
      unitPrice: 4500,
      quantity: 2,
      image: null,
    },
  ];
  const order2Quotation: Quotation = {
    deliveryFee: 3500,
    discount: 2000,
    deliveryDateMin: isoDaysFromNow(2),
    deliveryDateMax: isoDaysFromNow(4),
    note: "Free express dispatch on orders over ₦100k. Includes 1-year warranty.",
    createdAt: isoDaysAgo(6),
  };
  const order2Timeline: OrderTimelineEvent[] = [
    {
      id: "ev-010",
      at: isoDaysAgo(7),
      title: "Order placed",
      description: "Order sent to Aurora General Trading for quotation.",
      tone: "warning",
    },
    {
      id: "ev-011",
      at: isoDaysAgo(6),
      title: "Quotation received",
      description:
        "Delivery fee ₦3,500 • Discount ₦2,000 • ETA 2–4 days. Vendor note: 'Free express dispatch…'",
      tone: "primary",
    },
    {
      id: "ev-012",
      at: isoDaysAgo(6),
      title: "Marked To Pay",
      description: "Order is ready for payment.",
      tone: "accent",
    },
    {
      id: "ev-013",
      at: isoDaysAgo(6),
      title: "Payment confirmed",
      description:
        "Payment of ₦150,500 captured into KwisCrow escrow. Funds held pending delivery confirmation.",
      tone: "success",
    },
    {
      id: "ev-014",
      at: isoDaysAgo(5),
      title: "Processing",
      description: "Vendor is preparing your order.",
      tone: "default",
    },
    {
      id: "ev-015",
      at: isoDaysAgo(2),
      title: "Shipped",
      description: "Order dispatched via Kwik Express.",
      tone: "primary",
    },
    {
      id: "ev-016",
      at: isoHoursAgo(20),
      title: "Out for delivery",
      description: "Rider is en route to your address.",
      tone: "primary",
    },
    {
      id: "ev-017",
      at: isoHoursAgo(8),
      title: "Delivered",
      description:
        "Package delivered. Confirm receipt — or open a dispute within 24 hours.",
      tone: "success",
    },
    {
      id: "ev-018",
      at: isoHoursAgo(8),
      title: "Dispute window open",
      description:
        "KwisCrow will auto-release the escrow to the vendor in 24 hours unless you confirm receipt or open a dispute.",
      tone: "warning",
    },
  ];
  const order2Cost = computeCostBreakdown(order2Items, order2Quotation);

  // ── Order 3: RECEIVED (escrow RELEASED — terminal-ish) ──────────────────
  const order3Items: OrderLineItem[] = [
    {
      id: "li-005",
      productId: "prod-005",
      name: "Stainless Cookware Set (10-piece)",
      unitPrice: 38000,
      quantity: 1,
      image: null,
    },
  ];
  const order3Quotation: Quotation = {
    deliveryFee: 2500,
    discount: 0,
    deliveryDateMin: isoDaysAgo(10),
    deliveryDateMax: isoDaysAgo(8),
    note: "Includes free gift wrapping.",
    createdAt: isoDaysAgo(14),
  };
  const order3Timeline: OrderTimelineEvent[] = [
    {
      id: "ev-020",
      at: isoDaysAgo(15),
      title: "Order placed",
      description: "Order sent to Aurora General Trading.",
      tone: "warning",
    },
    {
      id: "ev-021",
      at: isoDaysAgo(14),
      title: "Quotation received",
      description: "Delivery fee ₦2,500. ETA 3–5 days.",
      tone: "primary",
    },
    {
      id: "ev-022",
      at: isoDaysAgo(14),
      title: "Payment confirmed",
      description: "Payment of ₦40,500 captured into KwisCrow escrow.",
      tone: "success",
    },
    {
      id: "ev-023",
      at: isoDaysAgo(13),
      title: "Processing",
      description: "Vendor is preparing your order.",
      tone: "default",
    },
    {
      id: "ev-024",
      at: isoDaysAgo(11),
      title: "Shipped",
      description: "Order dispatched.",
      tone: "primary",
    },
    {
      id: "ev-025",
      at: isoDaysAgo(9),
      title: "Out for delivery",
      description: "Rider en route.",
      tone: "primary",
    },
    {
      id: "ev-026",
      at: isoDaysAgo(8),
      title: "Delivered",
      description: "Package delivered.",
      tone: "success",
    },
    {
      id: "ev-027",
      at: isoDaysAgo(8),
      title: "Receipt confirmed",
      description: "You confirmed receipt. Escrow released to vendor.",
      tone: "success",
    },
  ];
  const order3Cost = computeCostBreakdown(order3Items, order3Quotation);

  return [
    {
      id: "order-aurora-001",
      ref: "KW-AUR-001",
      vendor: { ...MOCK_VENDOR },
      items: order1Items,
      deliveryAddress: "12 Marina Road, Lagos Island, Lagos",
      status: OrderStatus.TO_PAY,
      quotation: order1Quotation,
      fulfilmentSteps: buildFulfilmentSteps(OrderStatus.TO_PAY, order1Timeline),
      timeline: order1Timeline,
      createdAt: isoHoursAgo(2),
      updatedAt: isoHoursAgo(1),
    },
    {
      id: "order-aurora-002",
      ref: "KW-AUR-002",
      vendor: { ...MOCK_VENDOR },
      items: order2Items,
      deliveryAddress: "5 Adeniran Ogunsanya St, Surulere, Lagos",
      status: OrderStatus.DELIVERED,
      quotation: order2Quotation,
      escrow: {
        orderId: "order-aurora-002",
        amount: order2Cost.total,
        status: EscrowStatus.HELD,
        heldAt: isoDaysAgo(6),
        autoReleaseAt: isoHoursFromNow(KwisCrow.DISPUTE_WINDOW_HOURS - 8),
      },
      fulfilmentSteps: buildFulfilmentSteps(OrderStatus.DELIVERED, order2Timeline),
      timeline: order2Timeline,
      createdAt: isoDaysAgo(7),
      updatedAt: isoHoursAgo(8),
    },
    {
      id: "order-aurora-003",
      ref: "KW-AUR-003",
      vendor: { ...MOCK_VENDOR },
      items: order3Items,
      deliveryAddress: "45 Awolowo Way, Ikeja, Lagos",
      status: OrderStatus.RECEIVED,
      quotation: order3Quotation,
      escrow: {
        orderId: "order-aurora-003",
        amount: order3Cost.total,
        status: EscrowStatus.RELEASED,
        heldAt: isoDaysAgo(14),
        releasedAt: isoDaysAgo(8),
        lastActionReason: "Buyer confirmed receipt.",
      },
      fulfilmentSteps: buildFulfilmentSteps(OrderStatus.RECEIVED, order3Timeline),
      timeline: order3Timeline,
      createdAt: isoDaysAgo(15),
      updatedAt: isoDaysAgo(8),
    },
  ];
}

function seedNotifications(): WorkflowNotification[] {
  return [
    {
      id: "ntf-001",
      templateKey: "DISPUTE_WINDOW_OPENED",
      title: NOTIFICATION_TEMPLATES.DISPUTE_WINDOW_OPENED.title,
      body: interpolate(NOTIFICATION_TEMPLATES.DISPUTE_WINDOW_OPENED.body, {
        orderRef: "KW-AUR-002",
      }),
      at: isoHoursAgo(8),
      orderId: "order-aurora-002",
      orderRef: "KW-AUR-002",
      read: false,
    },
    {
      id: "ntf-002",
      templateKey: "ORDER_DELIVERED",
      title: NOTIFICATION_TEMPLATES.ORDER_DELIVERED.title,
      body: interpolate(NOTIFICATION_TEMPLATES.ORDER_DELIVERED.body, {
        orderRef: "KW-AUR-002",
      }),
      at: isoHoursAgo(8),
      orderId: "order-aurora-002",
      orderRef: "KW-AUR-002",
      read: false,
    },
    {
      id: "ntf-003",
      templateKey: "QUOTATION_RECEIVED",
      title: NOTIFICATION_TEMPLATES.QUOTATION_RECEIVED.title,
      body: interpolate(NOTIFICATION_TEMPLATES.QUOTATION_RECEIVED.body, {
        orderRef: "KW-AUR-001",
        vendorName: MOCK_VENDOR.name,
      }),
      at: isoHoursAgo(2),
      orderId: "order-aurora-001",
      orderRef: "KW-AUR-001",
      read: false,
    },
  ];
}

// ─── Store implementation ──────────────────────────────────────────────────

export const useOrderWorkflowStore = create<OrderWorkflowStateStore>()(
  persist(
    (set, get) => {
      // ── Internal: emit a notification from a template ──
      const emitNotification = (
        orderId: string,
        templateKey: NotificationTemplateKey,
        amount?: number,
      ) => {
        const order = get().orders.find((o) => o.id === orderId);
        if (!order) return;
        const template = NOTIFICATION_TEMPLATES[templateKey];
        const notification: WorkflowNotification = {
          id: makeId("ntf"),
          templateKey,
          title: template.title,
          body: interpolate(template.body, {
            orderRef: order.ref,
            vendorName: order.vendor.name,
            amount: amount !== undefined ? formatCurrency(amount) : undefined,
          }),
          at: nowIso(),
          orderId,
          orderRef: order.ref,
          read: false,
        };
        set((state) => ({
          notifications: [notification, ...state.notifications].slice(0, 50),
        }));
      };

      // ── Internal: push a timeline event + bump updatedAt ──
      const pushEvent = (
        orderId: string,
        event: Omit<OrderTimelineEvent, "id" | "at"> & { at?: string },
      ) => {
        set((state) => ({
          orders: state.orders.map((o) => {
            if (o.id !== orderId) return o;
            const ev: OrderTimelineEvent = {
              id: makeId("ev"),
              at: event.at ?? nowIso(),
              title: event.title,
              description: event.description,
              tone: event.tone,
            };
            const timeline = [ev, ...o.timeline];
            return {
              ...o,
              timeline,
              fulfilmentSteps: buildFulfilmentSteps(o.status, timeline),
              updatedAt: ev.at,
            };
          }),
        }));
      };

      // ── Internal: update an order's status + rebuild fulfilment steps ──
      const setStatus = (orderId: string, status: OrderStatusValue) => {
        set((state) => ({
          orders: state.orders.map((o) => {
            if (o.id !== orderId) return o;
            return {
              ...o,
              status,
              fulfilmentSteps: buildFulfilmentSteps(status, o.timeline),
              updatedAt: nowIso(),
            };
          }),
        }));
      };

      // ── Internal: sync escrow record back into the order ──
      const syncEscrow = (orderId: string, record: EscrowRecord) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, escrow: { ...record } } : o,
          ),
        }));
      };

      return {
        orders: seedOrders(),
        notifications: seedNotifications(),
        hydrated: false,

        // ── Selectors ──
        getOrder: (orderId) => get().orders.find((o) => o.id === orderId),
        getCostBreakdown: (orderId) => {
          const order = get().orders.find((o) => o.id === orderId);
          if (!order) return null;
          return computeCostBreakdown(order.items, order.quotation);
        },

        // ── Lifecycle actions ──
        placeOrder: (input) => {
          const items: OrderLineItem[] = input.items.map((it, idx) => ({
            id: makeId(`li-${idx}`),
            productId: it.productId,
            name: it.name,
            unitPrice: it.unitPrice,
            quantity: it.quantity,
            image: it.image,
          }));
          const id = makeId("order");
          const ref = `KW-${makeRef()}`;
          const at = nowIso();
          const timeline: OrderTimelineEvent[] = [
            {
              id: makeId("ev"),
              at,
              title: "Order placed",
              description: `Order sent to ${
                input.vendorName ?? MOCK_VENDOR.name
              }. Waiting for the vendor's quotation (delivery fee, ETA).`,
              tone: "warning",
            },
          ];
          const order: OrderWorkflowState = {
            id,
            ref,
            vendor: {
              id: input.vendorId ?? MOCK_VENDOR.id,
              name: input.vendorName ?? MOCK_VENDOR.name,
              logo: null,
              rating: MOCK_VENDOR.rating,
              reviewCount: MOCK_VENDOR.reviewCount,
            },
            items,
            deliveryAddress:
              input.deliveryAddress ?? "Default delivery address — Lagos, Nigeria",
            status: OrderStatus.PENDING_QUOTE,
            fulfilmentSteps: buildFulfilmentSteps(OrderStatus.PENDING_QUOTE, timeline),
            timeline,
            createdAt: at,
            updatedAt: at,
          };
          set((state) => ({ orders: [order, ...state.orders] }));
          return order;
        },

        submitQuotation: (orderId, quotation) => {
          const order = get().getOrder(orderId);
          if (!order) return;
          if (
            order.status !== OrderStatus.PENDING_QUOTE &&
            order.status !== OrderStatus.QUOTED
          ) {
            return; // Cannot quote once payment has started.
          }
          set((state) => ({
            orders: state.orders.map((o) =>
              o.id === orderId
                ? {
                    ...o,
                    quotation,
                    status: OrderStatus.QUOTED,
                    updatedAt: nowIso(),
                  }
                : o,
            ),
          }));
          pushEvent(orderId, {
            title: "Quotation received",
            description: `Delivery fee ${formatCurrency(
              quotation.deliveryFee,
            )} • Discount ${formatCurrency(quotation.discount)} • ETA ${new Date(
              quotation.deliveryDateMin,
            ).toLocaleDateString()}–${new Date(
              quotation.deliveryDateMax,
            ).toLocaleDateString()}.`,
            tone: "primary",
            at: quotation.createdAt,
          });
          emitNotification(orderId, "QUOTATION_RECEIVED");
        },

        markToPay: (orderId) => {
          const order = get().getOrder(orderId);
          if (!order) return;
          if (order.status !== OrderStatus.QUOTED) return;
          setStatus(orderId, OrderStatus.TO_PAY);
          pushEvent(orderId, {
            title: "Marked To Pay",
            description: "Order is ready for payment.",
            tone: "accent",
          });
        },

        payOrder: (orderId) => {
          const order = get().getOrder(orderId);
          if (!order) return;
          // Allow pay from QUOTED or TO_PAY (UX nicety).
          if (
            order.status !== OrderStatus.TO_PAY &&
            order.status !== OrderStatus.QUOTED
          ) {
            return;
          }
          const breakdown = computeCostBreakdown(order.items, order.quotation);
          // 1. Hold funds in escrow.
          const record = holdInEscrow(orderId, breakdown.total);
          // 2. Update order status to PAID.
          setStatus(orderId, OrderStatus.PAID);
          // 3. Sync escrow into the order.
          syncEscrow(orderId, record);
          // 4. Timeline + notification.
          pushEvent(orderId, {
            title: "Payment confirmed",
            description: `Payment of ${formatCurrency(
              breakdown.total,
            )} captured into KwisCrow escrow. Funds held pending delivery confirmation.`,
            tone: "success",
          });
          emitNotification(orderId, "PAYMENT_SUCCESS", breakdown.total);
        },

        advanceFulfilment: (orderId) => {
          const order = get().getOrder(orderId);
          if (!order) return;
          const transitions: Partial<Record<OrderStatusValue, OrderStatusValue>> = {
            [OrderStatus.PAID]: OrderStatus.PROCESSING,
            [OrderStatus.PROCESSING]: OrderStatus.SHIPPED,
            [OrderStatus.SHIPPED]: OrderStatus.OUT_FOR_DELIVERY,
            [OrderStatus.OUT_FOR_DELIVERY]: OrderStatus.DELIVERED,
          };
          const next = transitions[order.status];
          if (!next) return;
          setStatus(orderId, next);

          // When entering DELIVERED, start the dispute window.
          if (next === OrderStatus.DELIVERED) {
            pushEvent(orderId, {
              title: "Delivered",
              description:
                "Package delivered. Confirm receipt — or open a dispute within 24 hours.",
              tone: "success",
            });
            // Enter dispute window (sets autoReleaseAt = now + 24h).
            if (order.escrow) {
              const record = enterDisputeWindow(orderId);
              syncEscrow(orderId, record);
            }
            pushEvent(orderId, {
              title: "Dispute window open",
              description: `KwisCrow will auto-release the escrow to the vendor in ${KwisCrow.DISPUTE_WINDOW_HOURS} hours unless you confirm receipt or open a dispute.`,
              tone: "warning",
            });
            emitNotification(orderId, "ORDER_DELIVERED");
            emitNotification(orderId, "DISPUTE_WINDOW_OPENED");
            return;
          }

          // Other transitions — pick the right template + tone.
          const meta: Record<
            OrderStatusValue,
            { title: string; description: string; tone: OrderTimelineEvent["tone"]; template?: NotificationTemplateKey }
          > = {
            [OrderStatus.PROCESSING]: {
              title: "Processing",
              description: "Vendor is preparing your order.",
              tone: "default",
              template: "ORDER_PROCESSING",
            },
            [OrderStatus.SHIPPED]: {
              title: "Shipped",
              description: "Order handed to courier.",
              tone: "primary",
              template: "ORDER_SHIPPED",
            },
            [OrderStatus.OUT_FOR_DELIVERY]: {
              title: "Out for delivery",
              description: "Rider is en route to your address.",
              tone: "primary",
              template: "OUT_FOR_DELIVERY",
            },
            // (DELIVERED handled above; the rest are unused here.)
            PAID: { title: "Paid", description: "", tone: "success" },
            DELIVERED: { title: "Delivered", description: "", tone: "success" },
            RECEIVED: { title: "Received", description: "", tone: "success" },
            COMPLETED: { title: "Completed", description: "", tone: "success" },
            PENDING_QUOTE: { title: "Awaiting quotation", description: "", tone: "warning" },
            QUOTED: { title: "Quoted", description: "", tone: "primary" },
            TO_PAY: { title: "To pay", description: "", tone: "accent" },
            DISPUTED: { title: "Disputed", description: "", tone: "danger" },
            CANCELLED: { title: "Cancelled", description: "", tone: "danger" },
            RETURNED: { title: "Returned", description: "", tone: "default" },
          };
          const m = meta[next];
          pushEvent(orderId, {
            title: m.title,
            description: m.description,
            tone: m.tone,
          });
          if (m.template) emitNotification(orderId, m.template);
        },

        confirmReceipt: (orderId) => {
          const order = get().getOrder(orderId);
          if (!order) return;
          if (order.status !== OrderStatus.DELIVERED) return;

          // 1. Release escrow to vendor.
          if (order.escrow) {
            const record = releaseToVendor(orderId, "Buyer confirmed receipt.");
            syncEscrow(orderId, record);
          }
          // 2. Move to RECEIVED.
          setStatus(orderId, OrderStatus.RECEIVED);
          pushEvent(orderId, {
            title: "Receipt confirmed",
            description:
              "You confirmed receipt. Escrow released to vendor. Thank you for shopping with Kwikseller!",
            tone: "success",
          });
          emitNotification(
            orderId,
            "ESCROW_RELEASED",
            order.escrow?.amount,
          );
        },

        cancelOrder: (orderId) => {
          const order = get().getOrder(orderId);
          if (!order) return;
          // Only cancellable before payment.
          const cancellable: OrderStatusValue[] = [
            OrderStatus.PENDING_QUOTE,
            OrderStatus.QUOTED,
            OrderStatus.TO_PAY,
          ];
          if (!cancellable.includes(order.status)) return;
          setStatus(orderId, OrderStatus.CANCELLED);
          pushEvent(orderId, {
            title: "Order cancelled",
            description: "Order was cancelled before payment. No funds were captured.",
            tone: "danger",
          });
          emitNotification(orderId, "ORDER_CANCELLED");
        },

        openDispute: (orderId, type, reason, description) => {
          const order = get().getOrder(orderId);
          if (!order) return;
          // Disputes are only allowed after delivery (or after the dispute
          // window has opened). Allow from DELIVERED or RECEIVED states.
          const disputable: OrderStatusValue[] = [
            OrderStatus.DELIVERED,
            OrderStatus.RECEIVED,
          ];
          if (!disputable.includes(order.status)) return;

          const dispute: Dispute = {
            id: makeId("dsp"),
            type,
            reason,
            description,
            createdAt: nowIso(),
            status: DisputeStatus.OPEN,
          };
          setStatus(orderId, OrderStatus.DISPUTED);
          set((state) => ({
            orders: state.orders.map((o) =>
              o.id === orderId ? { ...o, dispute } : o,
            ),
          }));
          pushEvent(orderId, {
            title: type === DisputeType.RETURN_REQUEST ? "Return requested" : "Issue reported",
            description: `Reason: ${reason}. ${
              description ? `Details: ${description}.` : ""
            } Escrow is frozen pending review.`,
            tone: "danger",
          });
          emitNotification(orderId, "DISPUTE_OPENED");
        },

        resolveDispute: (orderId, outcome, note) => {
          const order = get().getOrder(orderId);
          if (!order || !order.dispute) return;

          // 1. Settle escrow based on outcome.
          if (order.escrow) {
            const record =
              outcome === "BUYER"
                ? refundToBuyer(orderId, note ?? "Dispute resolved in buyer favor.")
                : releaseToVendor(orderId, note ?? "Dispute resolved in vendor favor.");
            syncEscrow(orderId, record);
          }

          // 2. Update dispute status + order status.
          set((state) => ({
            orders: state.orders.map((o) =>
              o.id === orderId
                ? {
                    ...o,
                    dispute: {
                      ...o.dispute!,
                      status: DisputeStatus.RESOLVED,
                      resolvedAt: nowIso(),
                      resolutionNote: note,
                    },
                    status:
                      outcome === "BUYER"
                        ? OrderStatus.RETURNED
                        : OrderStatus.COMPLETED,
                    updatedAt: nowIso(),
                  }
                : o,
            ),
          }));
          pushEvent(orderId, {
            title:
              outcome === "BUYER"
                ? "Dispute resolved — refund issued"
                : "Dispute resolved — vendor paid",
            description: note ?? "KwisCrow has resolved this dispute.",
            tone: outcome === "BUYER" ? "default" : "success",
          });
          emitNotification(orderId, "DISPUTE_RESOLVED");
        },

        autoReleaseEscrow: () => {
          // Sweep all orders that are in DELIVERED state with an open dispute
          // window whose deadline has passed.
          const orders = get().orders;
          for (const order of orders) {
            if (order.status !== OrderStatus.DELIVERED) continue;
            if (!order.escrow) continue;
            if (!order.escrow.autoReleaseAt) continue;
            // Skip if a dispute is open.
            if (order.dispute && order.dispute.status === DisputeStatus.OPEN) continue;
            if (!order.escrow.autoReleaseAt) continue;
            try {
              const record = autoReleaseIfWindowExpired(
                order.id,
                order.escrow.autoReleaseAt,
                { disputeOpen: Boolean(order.dispute) },
              );
              if (record.status === EscrowStatus.RELEASED) {
                syncEscrow(order.id, record);
                setStatus(order.id, OrderStatus.RECEIVED);
                pushEvent(order.id, {
                  title: "Escrow auto-released",
                  description: `The ${KwisCrow.DISPUTE_WINDOW_HOURS}-hour dispute window expired with no dispute. KwisCrow released the funds to the vendor.`,
                  tone: "success",
                });
                emitNotification(order.id, "ESCROW_RELEASED", record.amount);
              }
            } catch {
              // Defensive — ignore failures during sweep.
            }
          }
        },

        markNotificationRead: (id) => {
          set((state) => ({
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n,
            ),
          }));
        },

        clearNotifications: () => set({ notifications: [] }),

        _init: () => {
          // 1. Hydrate the escrow in-memory store from persisted orders.
          const escrowRecords = get()
            .orders.map((o) => o.escrow)
            .filter((e): e is EscrowRecord => Boolean(e));
          hydrateEscrowStore(escrowRecords);

          // 2. Register the listener that mirrors escrow mutations back.
          const unregister = registerEscrowChangeListener((orderId, record) => {
            syncEscrow(orderId, record);
          });

          // 3. Mark hydrated so the UI can stop showing the "verifying" state.
          set({ hydrated: true });

          // 4. Run an immediate sweep (in case persisted state has expired
          //    dispute windows from a previous session).
          get().autoReleaseEscrow();

          return unregister;
        },

        resetToSeed: () => {
          const orders = seedOrders();
          const notifications = seedNotifications();
          // Re-hydrate escrow store.
          hydrateEscrowStore(
            orders
              .map((o) => o.escrow)
              .filter((e): e is EscrowRecord => Boolean(e)),
          );
          set({ orders, notifications });
        },
      };
    },
    {
      name: "kwikseller-order-workflow-store",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        orders: state.orders,
        notifications: state.notifications,
      }),
      // When the seed data changes (new mock orders, new statuses, etc.) we
      // bump `version` and the migrate function re-seeds from scratch. This
      // guarantees users always see the latest demo data after a deploy.
      migrate: (_persisted, version) => {
        if (version < 2) {
          // Re-seed from scratch.
          return {
            orders: seedOrders(),
            notifications: seedNotifications(),
          };
        }
        return _persisted as { orders: OrderWorkflowState[]; notifications: WorkflowNotification[] };
      },
      onRehydrateStorage: () => (state) => {
        // After rehydration, hydrate the escrow in-memory store too.
        if (state) {
          const records = state.orders
            .map((o) => o.escrow)
            .filter((e): e is EscrowRecord => Boolean(e));
          hydrateEscrowStore(records);
        }
      },
    },
  ),
);

// ─── Convenience hook ──────────────────────────────────────────────────────

/**
 * useOrder — selector hook returning a single order by id (or undefined).
 * Re-renders only when that specific order changes.
 */
export function useOrder(orderId: string | undefined): OrderWorkflowState | undefined {
  return useOrderWorkflowStore((state) =>
    orderId ? state.orders.find((o) => o.id === orderId) : undefined,
  );
}

// ─── Escrow store snapshot (re-exported for debugging) ─────────────────────

export { snapshotEscrowStore };
