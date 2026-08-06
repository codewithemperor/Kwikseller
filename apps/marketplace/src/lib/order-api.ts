/**
 * Shared order + checkout API hooks (React Query + mutations).
 *
 * Wires the marketplace checkout to the backend so that when a buyer
 * places an order, the vendor actually RECEIVES it (GET /orders/store)
 * and can quote delivery + discount (POST /orders/:id/quote), accept,
 * and ship. This closes the TODO #6 gap.
 *
 * Backed by the dummy-data API when NEXT_PUBLIC_USE_DUMMY_DATA=true.
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
  deliveryType?: "STANDARD" | "EXPRESS" | "PICKUP";
  couponCode?: string;
  notes?: string;
}

export interface CheckoutResult {
  orders: ApiOrder[];
  order?: ApiOrder;
  payment: { reference: string; status: string; gateway: string; amount: number };
  authorizationUrl?: string;
  reference?: string;
  requiresShipping: boolean;
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

/** Buyer's orders. */
export function useMyOrders(status?: OrderStatus) {
  return useQuery({
    queryKey: ["orders", "mine", status],
    queryFn: async () => {
      const res = await api.get<ApiOrder[]>("orders", { params: status ? { status } : undefined });
      return res.data || [];
    },
  });
}

/** Single order by id or orderNumber. */
export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await api.get<ApiOrder>(`orders/${id}`);
      return res.data;
    },
    enabled: !!id,
    refetchInterval: (query) => {
      // Poll while the order is pending a vendor quote.
      const o = query.state.data as ApiOrder | null;
      return o && o.status === "PENDING" ? 4000 : false;
    },
  });
}

/** Vendor's received orders (the vendor side of TODO #6). */
export function useVendorOrders(status?: OrderStatus) {
  return useQuery({
    queryKey: ["orders", "vendor", status],
    queryFn: async () => {
      const res = await api.get<ApiOrder[]>("orders/store", { params: status ? { status } : undefined });
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
      const res = await api.get<VendorAnalytics>("store/analytics", {
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
      const res = await api.get<VendorReview[]>(`reviews/store/${storeId}`);
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
