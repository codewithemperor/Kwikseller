/**
 * Shared order + checkout API hooks (React Query + mutations).
 *
 * Wires the marketplace checkout to the backend so that when a buyer
 * places an order, the vendor actually RECEIVES it (GET /orders/store)
 * and can quote delivery + discount (POST /orders/:id/quote), accept,
 * and ship. This closes the TODO #6 gap.
 *
 * Backed by the dummy-data API when NEXT_PUBLIC_USE_DUMMY_DATA=true.
 *
 * The new order lifecycle (Task 8) has separate state dimensions:
 *   - `status` (OrderStatus): PENDING → PAID → PROCESSING → FULFILLED → DELIVERED → COMPLETED | CANCELLED
 *   - `paymentStatus`: PENDING → PAID | FAILED | REFUNDED
 *   - `quoteStatus`: PENDING_VENDOR_QUOTE → QUOTED → CUSTOMER_REQUESTED_REDUCTION → VENDOR_REVISED → AGREED | REJECTED | EXPIRED | CANCELLED
 *   - `deliveryMethod`: PICKUP | STANDARD_DELIVERY
 *   - `escrow.status`, `delivery.status`, `fulfillments[].status`
 *
 * OrderItem carries PRODUCT SNAPSHOT fields (`productNameSnapshot`,
 * `productImageSnapshot`, `variantNameSnapshot`, …) so historical orders
 * remain accurate even after the vendor edits the live product.
 */

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@kwikseller/api-client";

// ─── Types (mirror the dummy API / NestJS Order shape) ─────────────────────

export interface OrderItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    slug: string;
    image: string;
    price: number;
    storeId: string;
    storeName: string;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  variantId?: string;
  variantName?: string;
}

export type OrderStatus =
  | "PENDING" | "CONFIRMED" | "PROCESSING" | "READY"
  | "SHIPPED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED" | "REJECTED";

export interface ApiOrder {
  id: string;
  orderNumber: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  storeId: string;
  storeName: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  platformFee: number;
  total: number;
  status: OrderStatus;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  paymentMethod: string;
  paymentReference?: string;
  deliveryAddress: {
    id: string;
    label: string;
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    localGovernment?: string;
    isDefault: boolean;
    type: "HOME" | "WORK" | "OTHER";
  };
  deliveryType: "STANDARD" | "EXPRESS" | "PICKUP";
  estimatedDeliveryDays: number;
  trackingNumber?: string;
  couponCode?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  timeline: { status: OrderStatus; at: string; note?: string }[];
}

export interface CheckoutPayload {
  items: Array<{ productId: string; quantity: number; variantId?: string }>;
  shippingAddress?: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    localGovernment?: string;
    country?: string;
  };
  addressId?: string;
  paymentMethod?: string;
  /**
   * New quote-gated checkout flow uses `deliveryMethod` ('PICKUP' |
   * 'STANDARD_DELIVERY'). The legacy `deliveryType` field is kept for
   * backward compatibility with the old dummy-data API.
   */
  deliveryMethod?: "PICKUP" | "STANDARD_DELIVERY";
  deliveryType?: "STANDARD" | "EXPRESS" | "PICKUP";
  couponCode?: string;
  notes?: string;
  /**
   * Optional idempotency key. The backend uses it to dedupe a
   * ParentCheckout (and its per-vendor Orders) so a retry will return
   * the original result instead of double-charging/double-creating.
   */
  idempotencyKey?: string;
}

/**
 * Result shape for the new quote-gated checkout flow.
 *
 * - `parentCheckout` groups the per-vendor `orders` into a single
 *   logical checkout.
 * - `payment` is always `null` at checkout time — payment happens
 *   AFTER the vendor quote is agreed (PICKUP auto-agrees; STANDARD
 *   requires vendor → customer negotiation), via
 *   `POST /orders/:id/initialize-payment`.
 * - `requiresShipping` is true for STANDARD_DELIVERY, false for PICKUP.
 */
export interface CheckoutResult {
  parentCheckout?: {
    id: string;
    buyerId?: string;
    deliveryMethod?: "PICKUP" | "STANDARD_DELIVERY";
    [key: string]: unknown;
  };
  orders: ApiOrder[];
  order?: ApiOrder;
  payment: {
    reference: string;
    status: string;
    gateway: string;
    amount: number;
  } | null;
  authorizationUrl?: string;
  reference?: string;
  requiresShipping: boolean;
  deliveryMethod?: "PICKUP" | "STANDARD_DELIVERY";
}

// ─── New backend order lifecycle types (Task 8) ────────────────────────────
//
// These mirror the Prisma enums in apps/api/prisma/schema.prisma exactly.
// The marketplace UI is driven by these separate state dimensions — see
// `useOrderDetail` for the canonical fetch hook.

export type MarketplaceOrderStatus =
  | "DRAFT"
  | "PENDING_PAYMENT"
  | "PENDING"
  | "PAID"
  | "CONFIRMED"
  | "PROCESSING"
  | "FULFILLED"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED";

export type MarketplacePaymentStatus =
  | "PENDING"
  | "AUTHORIZED"
  | "PAID"
  | "FAILED"
  | "REFUNDED";

export type QuoteStatus =
  | "PENDING_VENDOR_QUOTE"
  | "QUOTED"
  | "CUSTOMER_ACCEPTED"
  | "CUSTOMER_REQUESTED_REDUCTION"
  | "VENDOR_REVISED"
  | "AGREED"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED";

export type QuoteRevisionType =
  | "VENDOR_QUOTE"
  | "CUSTOMER_REQUEST_REDUCTION"
  | "VENDOR_REVISE"
  | "VENDOR_ACCEPT_REDUCTION"
  | "VENDOR_REJECT_REDUCTION"
  | "CUSTOMER_ACCEPT"
  | "CUSTOMER_REJECT"
  | "SYSTEM_EXPIRE"
  | "SYSTEM_CANCEL";

export type DeliveryMethod = "PICKUP" | "STANDARD_DELIVERY";

export type MarketplaceEscrowStatus =
  | "HELD"
  | "PENDING_RELEASE"
  | "RELEASED"
  | "REFUNDED"
  | "DISPUTED"
  | "PARTIAL";

export type MarketplaceDeliveryStatus =
  | "PENDING"
  | "ASSIGNED"
  | "ACCEPTED"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "ARRIVED"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "RETURNED"
  | "FAILED";

export type MarketplaceFulfillmentStatus =
  | "PENDING"
  | "PROCESSING"
  | "READY"
  | "FULFILLED"
  | "DELIVERED"
  | "FAILED"
  | "CANCELLED";

export type MarketplaceFulfillmentType = "PHYSICAL_MANUAL" | "DIGITAL_ACCESS";

/** Order item with PRODUCT SNAPSHOT fields (the source of truth for display). */
export interface MarketplaceOrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isPoolItem?: boolean;
  productType?: string;
  productSource?: string;
  fulfillmentStatus?: MarketplaceFulfillmentStatus;
  // Snapshot fields — captured at checkout time, never change.
  productNameSnapshot?: string | null;
  productSkuSnapshot?: string | null;
  productSlugSnapshot?: string | null;
  productImageSnapshot?: string | null;
  variantNameSnapshot?: string | null;
  vendorNameSnapshot?: string | null;
  vendorStoreIdSnapshot?: string | null;
  createdAt?: string;
  // Live product/variant — RELATION ONLY, do NOT rely on for display.
  product?: {
    id: string;
    name: string;
    slug: string;
    images?: { url: string; isMain?: boolean }[];
  } | null;
  variant?: { id: string; name: string; options?: string } | null;
}

export interface MarketplaceOrderPayment {
  id: string;
  orderId?: string;
  parentCheckoutId?: string;
  entityType: "CHECKOUT" | "ORDER" | "SUBSCRIPTION" | "CREDIT_PURCHASE";
  entityId: string;
  amount: number;
  gateway: "PAYSTACK" | "FLUTTERWAVE" | "CASH_ON_DELIVERY" | "WALLET";
  reference: string;
  status: MarketplacePaymentStatus;
  authorizationUrl?: string;
  paidAt?: string;
  verifiedAt?: string;
  createdAt: string;
}

export interface MarketplaceOrderEscrow {
  id: string;
  orderId: string;
  vendorId: string;
  amount: number;
  status: MarketplaceEscrowStatus;
  releaseAt?: string;
  releasedAt?: string;
  refundedAt?: string;
  heldAt?: string;
  transactionRef?: string;
  disputeReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceOrderDelivery {
  id: string;
  orderId: string;
  status: MarketplaceDeliveryStatus;
  riderId?: string;
  assignedAt?: string;
  acceptedAt?: string;
  vendorPreparingAt?: string;
  vendorReadyAt?: string;
  pickupConfirmedAt?: string;
  pickedUpAt?: string;
  inTransitAt?: string;
  arrivedAt?: string;
  deliveredAt?: string;
  customerConfirmed?: boolean;
  customerConfirmedAt?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  deliveryContactName?: string;
  deliveryContactPhone?: string;
  currentLocation?: string;
  estimatedMinutes?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceFulfillment {
  id: string;
  orderId: string;
  orderItemId?: string;
  type: MarketplaceFulfillmentType;
  status: MarketplaceFulfillmentStatus;
  manualCarrier?: string;
  trackingNumber?: string;
  digitalAssetId?: string;
  accessUrl?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceOrderAddress {
  id: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country?: string;
  phone?: string;
  fullName?: string;
  [key: string]: unknown;
}

export interface MarketplaceOrderStore {
  id: string;
  name: string;
  slug?: string;
  logoUrl?: string | null;
  vendorId?: string;
}

/**
 * Real backend Order shape (mirror of the Prisma Order model + the relations
 * that `GET /api/v1/orders/:id` is expected to include: items, payment,
 * fulfillments, store, address, escrow, delivery).
 *
 * If the backend response omits some relations, the UI gracefully omits
 * those sections — every nested field here is optional except `id`, status,
 * paymentStatus, quoteStatus, totalAmount, createdAt.
 */
export interface MarketplaceOrder {
  id: string;
  buyerId: string;
  storeId: string;
  parentCheckoutId?: string;
  status: MarketplaceOrderStatus;
  subtotal: number;
  shippingFee?: number;
  discount?: number;
  totalAmount: number;
  paymentStatus: MarketplacePaymentStatus;
  addressId?: string;
  checkoutReference?: string;
  deliveryState?: string;
  deliveryLocalGovernment?: string;
  estimatedDeliveryStart?: string;
  estimatedDeliveryEnd?: string;
  // Quote / delivery lifecycle
  deliveryMethod?: DeliveryMethod;
  quoteStatus: QuoteStatus;
  quoteExpiresAt?: string;
  processingFeePercent?: number;
  processingFeeAmount?: number;
  agreedDeliveryFee?: number;
  agreedAt?: string;
  // Dispute (optional, only when opened)
  disputeStatus?: "NONE" | "OPENED" | "UNDER_REVIEW" | "RESOLVED";
  createdAt: string;
  updatedAt: string;
  // Relations (all optional — backend may omit)
  buyer?: { id: string; email?: string; phone?: string };
  store?: MarketplaceOrderStore;
  address?: MarketplaceOrderAddress;
  items?: MarketplaceOrderItem[];
  payment?: MarketplaceOrderPayment | null;
  escrow?: MarketplaceOrderEscrow | null;
  delivery?: MarketplaceOrderDelivery | null;
  fulfillments?: MarketplaceFulfillment[];
}

// ─── Quote negotiation types ──────────────────────────────────────────────

export interface QuoteRevision {
  id: string;
  quoteId: string;
  type: QuoteRevisionType;
  amount: number;
  actorId: string;
  note?: string;
  createdAt: string;
}

export interface OrderQuote {
  id: string;
  orderId: string;
  vendorId: string;
  buyerId: string;
  status: QuoteStatus;
  currentAmount: number;
  agreedAmount?: number | null;
  expiresAt?: string;
  agreedAt?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectReason?: string;
  createdAt: string;
  updatedAt: string;
  revisions: QuoteRevision[];
  order?: {
    id: string;
    subtotal: number;
    processingFeeAmount: number;
    processingFeePercent: number;
    totalAmount: number;
    agreedDeliveryFee: number;
    agreedAt?: string;
    quoteStatus: QuoteStatus;
    deliveryMethod?: DeliveryMethod;
    status: MarketplaceOrderStatus;
  };
}

export interface InitializePaymentResult {
  payment: MarketplaceOrderPayment;
  authorizationUrl: string;
  reference: string;
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

/** Buyer's orders (real backend shape — `MarketplaceOrder`). */
export function useMyOrders(status?: MarketplaceOrderStatus) {
  return useQuery({
    queryKey: ["orders", "mine", status],
    queryFn: async () => {
      const res = await api.get<MarketplaceOrder[]>("orders", {
        params: status ? { status } : undefined,
      });
      return res.data || [];
    },
  });
}

/**
 * Single order by id — fetches `GET /api/v1/orders/:id` and returns the
 * real backend Order shape (with snapshot items, payment, fulfillments,
 * store, address, escrow, delivery — whichever the backend includes).
 *
 * Polls every 4s while the order is still pre-payment (quote pending OR
 * payment pending) so the customer sees the vendor's quote + payment
 * confirmation in near-real time without a manual refresh.
 */
export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await api.get<MarketplaceOrder>(`orders/${id}`);
      return res.data;
    },
    enabled: !!id,
    refetchInterval: (query) => {
      const o = query.state.data as MarketplaceOrder | null;
      if (!o) return false;
      // Keep polling while the order is still in the negotiation / payment phase.
      const inFlightQuote =
        o.quoteStatus === "PENDING_VENDOR_QUOTE" ||
        o.quoteStatus === "QUOTED" ||
        o.quoteStatus === "CUSTOMER_REQUESTED_REDUCTION" ||
        o.quoteStatus === "VENDOR_REVISED";
      const paymentPending = o.paymentStatus === "PENDING";
      const orderActive = o.status === "PENDING" || o.status === "PAID" || o.status === "PROCESSING";
      return inFlightQuote || (paymentPending && orderActive) ? 4000 : false;
    },
  });
}

/**
 * Quote + revision history — fetched from `GET /api/v1/orders/:orderId/quote`.
 * Only meaningful for STANDARD_DELIVERY orders (PICKUP auto-agrees the quote
 * at checkout). The hook is enabled whenever `orderId` is set; callers should
 * decide whether to render its data based on `order.deliveryMethod`.
 */
export function useQuote(orderId: string | undefined) {
  return useQuery({
    queryKey: ["orders", orderId, "quote"],
    queryFn: async () => {
      if (!orderId) return null;
      const res = await api.get<OrderQuote>(`orders/${orderId}/quote`);
      return res.data;
    },
    enabled: !!orderId,
    refetchInterval: (query) => {
      const q = query.state.data as OrderQuote | null;
      if (!q) return false;
      const inFlight =
        q.status === "PENDING_VENDOR_QUOTE" ||
        q.status === "QUOTED" ||
        q.status === "CUSTOMER_REQUESTED_REDUCTION" ||
        q.status === "VENDOR_REVISED";
      return inFlight ? 4000 : false;
    },
  });
}

// ─── Customer mutations (quote negotiation + payment + receipt) ────────────

/**
 * Customer accepts the vendor's current quote (`POST /orders/:orderId/quote/accept`).
 * Allowed only when quoteStatus is QUOTED or VENDOR_REVISED.
 */
export function useAcceptQuote(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { note?: string } = {}) => {
      const res = await api.post<OrderQuote>(
        `orders/${orderId}/quote/accept`,
        payload,
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders", orderId] });
      qc.invalidateQueries({ queryKey: ["orders", orderId, "quote"] });
    },
  });
}

/**
 * Customer requests a lower delivery fee
 * (`POST /orders/:orderId/quote/request-reduction` with `{ amount }`).
 * Allowed only when quoteStatus is QUOTED or VENDOR_REVISED.
 */
export function useRequestReduction(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { amount: number; note?: string }) => {
      const res = await api.post<OrderQuote>(
        `orders/${orderId}/quote/request-reduction`,
        payload,
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders", orderId] });
      qc.invalidateQueries({ queryKey: ["orders", orderId, "quote"] });
    },
  });
}

/**
 * Customer rejects the vendor's quote outright
 * (`POST /orders/:orderId/quote/reject`). Terminal — order is cancelled.
 */
export function useRejectQuote(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { note?: string } = {}) => {
      const res = await api.post<OrderQuote>(
        `orders/${orderId}/quote/reject`,
        payload,
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders", orderId] });
      qc.invalidateQueries({ queryKey: ["orders", orderId, "quote"] });
    },
  });
}

/**
 * Initialize Paystack payment — only allowed when quoteStatus === AGREED.
 * On success returns `{ authorizationUrl, reference }`; the caller MUST
 * redirect the browser to `authorizationUrl` so the customer can pay.
 */
export function useInitializePayment(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post<InitializePaymentResult>(
        `orders/${orderId}/initialize-payment`,
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders", orderId] });
    },
  });
}

/**
 * Customer confirms receipt of pickup/delivery
 * (`POST /orders/:id/confirm-receipt`). Triggers Kwikscrow release to the
 * vendor's wallet.
 */
export function useConfirmReceipt(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post<MarketplaceOrder>(
        `orders/${orderId}/confirm-receipt`,
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders", orderId] });
    },
  });
}

/**
 * Customer cancels an order before payment
 * (`POST /orders/:id/cancel`). Only valid when paymentStatus === PENDING.
 */
export function useCancelOrder(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { reason?: string } = {}) => {
      const res = await api.post<MarketplaceOrder>(
        `orders/${orderId}/cancel`,
        payload,
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders", orderId] });
      qc.invalidateQueries({ queryKey: ["orders", "mine"] });
    },
  });
}

// ─── Vendor mutations (quote negotiation + fulfilment) ─────────────────────

/**
 * Vendor submits an initial delivery quote
 * (`POST /orders/:orderId/quote` with `{ amount, note? }`).
 * Allowed only when quoteStatus === PENDING_VENDOR_QUOTE.
 */
export function useSubmitQuote(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { amount: number; note?: string }) => {
      const res = await api.post<OrderQuote>(
        `orders/${orderId}/quote`,
        payload,
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders", orderId] });
      qc.invalidateQueries({ queryKey: ["orders", orderId, "quote"] });
      qc.invalidateQueries({ queryKey: ["orders", "vendor"] });
    },
  });
}

/**
 * Vendor revises the quote after the customer requested a reduction
 * (`PATCH /orders/:orderId/quote/revise` with `{ amount, note? }`).
 * Allowed only when quoteStatus === CUSTOMER_REQUESTED_REDUCTION.
 */
export function useReviseQuote(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { amount: number; note?: string }) => {
      const res = await api.patch<OrderQuote>(
        `orders/${orderId}/quote/revise`,
        payload,
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders", orderId] });
      qc.invalidateQueries({ queryKey: ["orders", orderId, "quote"] });
      qc.invalidateQueries({ queryKey: ["orders", "vendor"] });
    },
  });
}

/**
 * Vendor accepts the customer's reduction request
 * (`POST /orders/:orderId/quote/accept-reduction`). Sets the agreed amount
 * to the customer's requested amount and unlocks payment.
 */
export function useAcceptReduction(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { note?: string } = {}) => {
      const res = await api.post<OrderQuote>(
        `orders/${orderId}/quote/accept-reduction`,
        payload,
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders", orderId] });
      qc.invalidateQueries({ queryKey: ["orders", orderId, "quote"] });
      qc.invalidateQueries({ queryKey: ["orders", "vendor"] });
    },
  });
}

/**
 * Vendor rejects the customer's reduction request
 * (`POST /orders/:orderId/quote/reject-reduction`). Restores the original
 * vendor quote (the customer sees the prior amount again).
 */
export function useRejectReduction(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { note?: string } = {}) => {
      const res = await api.post<OrderQuote>(
        `orders/${orderId}/quote/reject-reduction`,
        payload,
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders", orderId] });
      qc.invalidateQueries({ queryKey: ["orders", orderId, "quote"] });
      qc.invalidateQueries({ queryKey: ["orders", "vendor"] });
    },
  });
}

/**
 * Vendor starts preparing a paid order (`POST /orders/:id/prepare`).
 * Moves status PAID → PROCESSING.
 */
export function usePrepareOrder(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post<MarketplaceOrder>(
        `orders/${orderId}/prepare`,
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders", orderId] });
      qc.invalidateQueries({ queryKey: ["orders", "vendor"] });
    },
  });
}

/**
 * Vendor marks a PICKUP order as ready for pickup
 * (`POST /orders/:id/ready-for-pickup`). PICKUP orders only.
 */
export function useReadyForPickup(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post<MarketplaceOrder>(
        `orders/${orderId}/ready-for-pickup`,
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders", orderId] });
      qc.invalidateQueries({ queryKey: ["orders", "vendor"] });
    },
  });
}

/**
 * Vendor dispatches a STANDARD_DELIVERY order
 * (`POST /orders/:id/dispatch` with `{ trackingNumber?, carrier? }`).
 */
export function useDispatchOrder(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { trackingNumber?: string; carrier?: string }) => {
      const res = await api.post<MarketplaceOrder>(
        `orders/${orderId}/dispatch`,
        payload,
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders", orderId] });
      qc.invalidateQueries({ queryKey: ["orders", "vendor"] });
    },
  });
}

/**
 * Vendor marks a dispatched order as delivered
 * (`POST /orders/:id/mark-delivered`).
 */
export function useMarkDelivered(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post<MarketplaceOrder>(
        `orders/${orderId}/mark-delivered`,
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders", orderId] });
      qc.invalidateQueries({ queryKey: ["orders", "vendor"] });
    },
  });
}

// ─── Legacy hooks (kept for backward compatibility — DO NOT remove) ────────

/** Vendor's received orders (the vendor side of TODO #6). */
export function useVendorOrders(status?: OrderStatus) {
  return useQuery({
    queryKey: ["orders", "vendor", status],
    queryFn: async () => {
      const res = await api.get<ApiOrder[]>("vendor/orders", { params: status ? { status } : undefined });
      return res.data || [];
    },
    refetchInterval: 5000,
  });
}

// ─── Vendor analytics ───────────────────────────────────────────────────────

export type AnalyticsPeriod = "7d" | "30d" | "90d";

export interface RevenueTrendPoint {
  day: number;
  date?: string;
  label: string;
  revenue: number;
  orders: number;
  visitors?: number;
  conversion?: number;
}

export interface TopProductStat {
  id: string;
  name: string;
  sales: number;
  revenue: number;
  image?: string | null;
}

export interface CategoryBreakdownStat {
  id: string;
  name: string;
  products: number;
  revenue: number;
  share: number;
}

export interface VendorAnalytics {
  period: AnalyticsPeriod;
  revenue: number;
  ordersCount: number;
  pendingCount: number;
  deliveredCount: number;
  avgOrderValue: number;
  productsCount: number;
  revenueDeltaPct?: number;
  ordersDeltaPct?: number;
  lastPeriodRevenue?: number;
  lastPeriodOrders?: number;
  revenueTrend: RevenueTrendPoint[];
  topProducts: TopProductStat[];
  categoryBreakdown?: CategoryBreakdownStat[];
}

/**
 * Vendor store analytics (revenue, KPIs, 7-day trend, top products).
 * Backed by the dummy-data API when NEXT_PUBLIC_USE_DUMMY_DATA=true.
 */
export function useVendorAnalytics(period: AnalyticsPeriod = "30d") {
  return useQuery({
    queryKey: ["analytics", "vendor", period],
    queryFn: async () => {
      const res = await api.get<VendorAnalytics>("vendor/analytics", {
        params: { period },
      });
      return res.data;
    },
    staleTime: 60_000,
  });
}

// ─── Mutations ──────────────────────────────────────────────────────────────

/** Place an order → vendor receives it. */
export function useCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CheckoutPayload) => {
      const res = await api.post<CheckoutResult>("checkout", payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useQuoteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      deliveryFee,
      discount,
      discountType,
    }: {
      orderId: string;
      deliveryFee?: number;
      discount?: number;
      discountType?: "AMOUNT" | "PERCENT";
    }) => {
      const res = await api.post<ApiOrder>(`orders/${orderId}/quote`, {
        deliveryFee,
        discount,
        discountType,
      });
      return res.data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["orders", vars.orderId] });
    },
  });
}

export function useVendorOrderAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, action, reason }: { orderId: string; action: "accept" | "reject" | "ready" | "ship" | "cancel"; reason?: string }) => {
      const res = await api.post<ApiOrder>(`orders/${orderId}/${action}`, reason ? { reason } : {});
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useVerifyPayment() {
  return useMutation({
    mutationFn: async (reference: string) => {
      const res = await api.get<{ reference: string; status: string; verified: boolean; order?: ApiOrder; amount?: number }>(`checkout/payments/${reference}`);
      return res.data;
    },
  });
}

// ─── Wallet redemption ─────────────────────────────────────────────────────

export type WalletRedemptionType = "CASH" | "AD_CREDIT" | "TRANSFER";

export interface RedeemWalletPayload {
  amount: number;
  redemptionType: WalletRedemptionType;
}

export interface RedeemedTransaction {
  id: string;
  type: "CREDIT" | "DEBIT";
  amount: number;
  description: string;
  category: string;
  createdAt: string;
}

export interface RedeemWalletResult {
  success: boolean;
  newBalance: number;
  transaction: RedeemedTransaction;
}

/**
 * Redeem KwikCoins for cash to wallet, ad credit, or transfer.
 * On success the `["wallet"]` query is invalidated so the wallet page
 * balance + transaction list refresh automatically.
 */
export function useRedeemWallet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: RedeemWalletPayload) => {
      const res = await api.post<RedeemWalletResult>("wallet/redeem", payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}

// ─── Vendor product reviews (vendor dashboard "Reviews" tab) ───────────────

export interface VendorReviewProduct {
  id: string;
  name: string;
  slug: string;
  image?: string;
}

export interface VendorReview {
  id: string;
  productId: string;
  name: string;
  location?: string;
  rating: number;
  title: string;
  text: string;
  createdAt: string;
  verified: boolean;
  helpful: number;
  images: string[];
  product?: VendorReviewProduct;
  vendorReply?: {
    id: string;
    authorName: string;
    text: string;
    createdAt: string;
  };
}

/**
 * Fetch all reviews for products belonging to a vendor store.
 * Used by the vendor reviews dashboard.
 */
export function useVendorReviews(storeId: string | undefined) {
  return useQuery<VendorReview[]>({
    queryKey: ["reviews", "vendor", storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const res = await api.get<VendorReview[]>(`reviews/vendor/${storeId}`);
      return res.data || [];
    },
    enabled: !!storeId,
  });
}

/**
 * Vendor posts a reply to a customer review.
 * On success, invalidates the vendor reviews query so the reply appears immediately.
 */
export function useReplyToReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ reviewId, text, authorName }: { reviewId: string; text: string; authorName?: string }) => {
      const res = await api.post<VendorReview>(`reviews/${reviewId}/reply`, { text, authorName });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", "vendor"] });
    },
  });
}

/**
 * Vendor deletes an existing reply to a customer review.
 * On success, invalidates the vendor reviews query so the reply disappears immediately.
 */
export function useDeleteReviewReply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ reviewId }: { reviewId: string }) => {
      const res = await api.delete<VendorReview>(`reviews/${reviewId}/reply`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", "vendor"] });
    },
  });
}

// ─── Delivery agent leaderboard + per-agent ratings (cycle 10) ────────────

export interface DeliveryAgentInfo {
  id: string;
  name: string;
  phone: string;
  photo: string;
  rating: number;
  totalDeliveries: number;
  vehicleType: "BIKE" | "CAR" | "VAN";
  vehiclePlate: string;
  partner: "KwikLogistics" | "GIG Logistics" | "Kwik Express" | "Vendor Dispatch";
  assignedAt: string;
}

export interface AgentRatingEntry {
  orderId: string;
  orderNumber: string;
  buyerName: string;
  rating: number;
  comment: string;
  tags: string[];
  createdAt: string;
  storeName: string;
}

export interface AgentRatingSummary {
  agentId: string;
  totalRatings: number;
  averageRating: number;
  ratingBreakdown: Record<1 | 2 | 3 | 4 | 5, number>;
  recentRatings: AgentRatingEntry[];
  topTags: Array<{ tag: string; count: number }>;
  totalDelivered: number;
}

export interface AgentLeaderboardEntry {
  agent: DeliveryAgentInfo;
  summary: AgentRatingSummary;
}

/**
 * Fetch the public delivery-agent leaderboard (sorted by avg rating).
 * Used by the /delivery-agents page.
 */
export function useDeliveryAgentLeaderboard() {
  return useQuery<AgentLeaderboardEntry[]>({
    queryKey: ["delivery-agents", "leaderboard"],
    queryFn: async () => {
      const res = await api.get<AgentLeaderboardEntry[]>("delivery-agents");
      return res.data || [];
    },
    staleTime: 60_000,
  });
}

/**
 * Fetch a single delivery agent + their rating summary.
 */
export function useDeliveryAgent(agentId: string | undefined) {
  return useQuery<{
    agent: DeliveryAgentInfo;
    summary: AgentRatingSummary;
  } | null>({
    queryKey: ["delivery-agents", agentId],
    queryFn: async () => {
      if (!agentId) return null;
      const res = await api.get<{
        agent: DeliveryAgentInfo;
        summary: AgentRatingSummary;
      }>(`delivery-agents/${agentId}`);
      return res.data;
    },
    enabled: !!agentId,
  });
}

/**
 * Fetch just the rating entries for a delivery agent (lighter payload
 * than useDeliveryAgent — useful for infinite lists or paginated views).
 */
export function useDeliveryAgentRatings(agentId: string | undefined) {
  return useQuery<{
    agentId: string;
    totalRatings: number;
    averageRating: number;
    ratings: AgentRatingEntry[];
  } | null>({
    queryKey: ["delivery-agents", agentId, "ratings"],
    queryFn: async () => {
      if (!agentId) return null;
      const res = await api.get<{
        agentId: string;
        totalRatings: number;
        averageRating: number;
        ratings: AgentRatingEntry[];
      }>(`delivery-agents/${agentId}/ratings`);
      return res.data;
    },
    enabled: !!agentId,
  });
}

// ─── Delivery rating (buyer rates the delivery experience) ─────────────────

export interface DeliveryRating {
  rating: number;
  comment: string;
  tags: string[];
  createdAt: string;
}

/**
 * Fetch the persisted delivery rating for an order (if the buyer has already rated).
 */
export function useDeliveryRating(orderId: string | undefined) {
  return useQuery<DeliveryRating | null>({
    queryKey: ["orders", orderId, "delivery-rating"],
    queryFn: async () => {
      if (!orderId) return null;
      const res = await api.get<DeliveryRating | null>(`orders/${orderId}/delivery-rating`);
      return res.data ?? null;
    },
    enabled: !!orderId,
  });
}

/**
 * Submit a delivery rating. Persists onto the order so the tracking page
 * shows "Already rated" on revisit.
 */
export function useRateDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      rating,
      comment,
      tags,
    }: {
      orderId: string;
      rating: number;
      comment: string;
      tags: string[];
    }) => {
      const res = await api.post<{ success: boolean; deliveryRating: DeliveryRating }>(
        `orders/${orderId}/delivery-rating`,
        { rating, comment, tags },
      );
      return res.data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["orders", vars.orderId, "delivery-rating"] });
      qc.invalidateQueries({ queryKey: ["orders", vars.orderId] });
    },
  });
}

// ─── Support tickets (Help & Support center) ──────────────────────────────

export interface SubmitTicketPayload {
  subject: string;
  category: string;
  message: string;
  orderId?: string;
  email?: string;
}

export interface SubmitTicketResult {
  id: string;
  subject: string;
  category: string;
  message: string;
  orderId?: string;
  email?: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  createdAt: string;
}

/**
 * Submit a new support ticket from the Help & Support center.
 * On success, invalidates the support tickets query.
 */
export function useSubmitTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SubmitTicketPayload) => {
      const res = await api.post<SubmitTicketResult>("support/tickets", payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["support-tickets"] });
    },
  });
}

// ─── Notification preferences ──────────────────────────────────────────────

export type NotificationChannel = "email" | "push" | "sms";

export interface NotificationPreferenceGroup {
  key: string;
  label: string;
  description: string;
  channels: Record<NotificationChannel, boolean>;
}

export interface NotificationPreferences {
  userId: string;
  groups: NotificationPreferenceGroup[];
  doNotDisturb: {
    enabled: boolean;
    startHour: number;
    endHour: number;
  };
  language: "en" | "ha" | "yo" | "ig";
  updatedAt: string;
}

/**
 * Fetch the current user's notification preferences.
 * Falls back to a default object if the API has not seeded the user yet.
 */
export function useNotificationPreferences() {
  return useQuery<NotificationPreferences>({
    queryKey: ["notification-preferences"],
    queryFn: async () => {
      const res = await api.get<NotificationPreferences>(
        "users/me/notification-preferences",
      );
      return res.data;
    },
    staleTime: 30_000,
  });
}

/**
 * Patch the user's notification preferences. Optimistic update + invalidate
 * on success so the UI reflects the new state immediately.
 */
export function useUpdateNotificationPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<NotificationPreferences>) => {
      const res = await api.put<NotificationPreferences>(
        "users/me/notification-preferences",
        patch,
      );
      return res.data;
    },
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: ["notification-preferences"] });
      const previous = qc.getQueryData<NotificationPreferences>([
        "notification-preferences",
      ]);
      if (previous) {
        qc.setQueryData<NotificationPreferences>(
          ["notification-preferences"],
          { ...previous, ...patch, updatedAt: new Date().toISOString() },
        );
      }
      return { previous };
    },
    onError: (_err, _patch, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(["notification-preferences"], ctx.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["notification-preferences"] });
    },
  });
}
