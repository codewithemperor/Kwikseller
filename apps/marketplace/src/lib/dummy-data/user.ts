/**
 * Dummy user, addresses, and orders data — plus an in-memory order store.
 *
 * The order store is what makes the checkout → vendor order flow work in
 * dummy mode: when a buyer checks out (POST /checkout), an order is created
 * here and linked to the vendor's store. The vendor orders endpoint
 * (GET /orders/store) then returns it so the vendor "receives" the order.
 *
 * Served ONLY when NEXT_PUBLIC_USE_DUMMY_DATA=true.
 */

import { products } from "./catalog";

export interface DummyAddress {
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
}

export interface DummyOrderItem {
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
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "READY"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "REJECTED";

export interface DummyOrder {
  id: string;
  orderNumber: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  storeId: string;
  storeName: string;
  items: DummyOrderItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  platformFee: number;
  total: number;
  status: OrderStatus;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  paymentMethod: string;
  paymentReference?: string;
  deliveryAddress: DummyAddress;
  deliveryType: "STANDARD" | "EXPRESS" | "PICKUP";
  estimatedDeliveryDays: number;
  trackingNumber?: string;
  couponCode?: string;
  notes?: string;
  deliveryAgent?: DeliveryAgent;
  createdAt: string;
  updatedAt: string;
  timeline: { status: OrderStatus; at: string; note?: string }[];
}

// ─── Delivery agent pool ─────────────────────────────────────────────────
// Used when an order is shipped. Deterministic per-order so the same order
// always shows the same agent (matches real-world UX).

export interface DeliveryAgent {
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

const DELIVERY_AGENTS: DeliveryAgent[] = [
  {
    id: "agent-1",
    name: "Chidi Okafor",
    phone: "+234 805 555 0101",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    rating: 4.9,
    totalDeliveries: 1284,
    vehicleType: "BIKE",
    vehiclePlate: "LAG-289-XK",
    partner: "KwikLogistics",
    assignedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: "agent-2",
    name: "Fatima Bello",
    phone: "+234 806 555 0142",
    photo: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=200&q=80",
    rating: 4.8,
    totalDeliveries: 967,
    vehicleType: "VAN",
    vehiclePlate: "ABJ-441-VN",
    partner: "GIG Logistics",
    assignedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: "agent-3",
    name: "Emeka Nwosu",
    phone: "+234 807 555 0178",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    rating: 4.7,
    totalDeliveries: 1532,
    vehicleType: "CAR",
    vehiclePlate: "PHC-920-CR",
    partner: "Kwik Express",
    assignedAt: new Date(Date.now() - 1 * 3600000).toISOString(),
  },
];

export function pickAgentForOrder(orderId: string): DeliveryAgent {
  // Deterministic pick based on order id hash so the same order always
  // shows the same agent (matches real-world UX where one agent is
  // assigned per shipment).
  let hash = 0;
  for (let i = 0; i < orderId.length; i++) {
    hash = (hash * 31 + orderId.charCodeAt(i)) & 0xffffffff;
  }
  return DELIVERY_AGENTS[Math.abs(hash) % DELIVERY_AGENTS.length];
}

// ─── Delivery agent roster + ratings aggregation (cycle 10) ────────────────
//
// `deliveryAgents` is the public roster (used by the /delivery-agents
// leaderboard page). `getDeliveryAgentRatings(agentId)` walks the order
// store, collects every order assigned to that agent that has a persisted
// deliveryRating, and returns aggregate stats + the list of individual
// ratings. This is what powers the agent leaderboard + per-agent detail.

export const deliveryAgents: DeliveryAgent[] = DELIVERY_AGENTS;

export interface AgentRatingEntry {
  orderId: string;
  orderNumber: string;
  buyerName: string;
  rating: number;
  comment: string;
  tags: string[];
  createdAt: string;
  // The store the order was placed with, for context on the leaderboard.
  storeName: string;
}

export interface AgentRatingSummary {
  agentId: string;
  totalRatings: number;
  averageRating: number;
  ratingBreakdown: Record<1 | 2 | 3 | 4 | 5, number>;
  recentRatings: AgentRatingEntry[];
  // Tag frequency — most-praised qualities of this agent.
  topTags: Array<{ tag: string; count: number }>;
  // The agent's total delivered orders (whether rated or not).
  totalDelivered: number;
}

export function getDeliveryAgentRatings(agentId: string): AgentRatingSummary {
  // Find every order assigned to this agent.
  const agentOrders = orderStore.filter((o) => o.deliveryAgent?.id === agentId);
  // Pull out the ones that have a persisted deliveryRating.
  const rated = agentOrders
    .map((o) => {
      const dr = (o as { deliveryRating?: {
        rating: number;
        comment: string;
        tags: string[];
        createdAt: string;
      } }).deliveryRating;
      return dr ? { order: o, dr } : null;
    })
    .filter((x): x is { order: DummyOrder; dr: NonNullable<typeof x>["dr"] } => x !== null);

  const totalRatings = rated.length;
  const sum = rated.reduce((s, r) => s + r.dr.rating, 0);
  const averageRating = totalRatings > 0 ? Number((sum / totalRatings).toFixed(2)) : 0;

  const breakdown: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of rated) {
    const k = Math.max(1, Math.min(5, Math.round(r.dr.rating))) as 1 | 2 | 3 | 4 | 5;
    breakdown[k] += 1;
  }

  // Tag frequency (case-insensitive).
  const tagCounts = new Map<string, number>();
  for (const r of rated) {
    for (const tag of r.dr.tags) {
      const key = tag.trim().toLowerCase();
      if (!key) continue;
      tagCounts.set(key, (tagCounts.get(key) ?? 0) + 1);
    }
  }
  const topTags = Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Recent ratings first (most recent at the top).
  const recentRatings: AgentRatingEntry[] = rated
    .map((r) => ({
      orderId: r.order.id,
      orderNumber: r.order.orderNumber,
      buyerName: r.order.buyerName,
      rating: r.dr.rating,
      comment: r.dr.comment,
      tags: r.dr.tags,
      createdAt: r.dr.createdAt,
      storeName: r.order.storeName,
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    agentId,
    totalRatings,
    averageRating,
    ratingBreakdown: breakdown,
    recentRatings,
    topTags,
    totalDelivered: agentOrders.length,
  };
}

// ─── Per-agent leaderboard (cycle 10) ──────────────────────────────────────
// Aggregates rating summaries for every agent, sorted by average rating
// (then by total deliveries as a tiebreaker). Used by the public
// /delivery-agents page so buyers can see which couriers are top-rated.

export interface AgentLeaderboardEntry {
  agent: DeliveryAgent;
  summary: AgentRatingSummary;
}

export function getDeliveryAgentLeaderboard(): AgentLeaderboardEntry[] {
  return deliveryAgents
    .map((agent) => ({ agent, summary: getDeliveryAgentRatings(agent.id) }))
    .sort((a, b) => {
      // Higher average rating first; tiebreak by total deliveries.
      if (b.summary.averageRating !== a.summary.averageRating) {
        return b.summary.averageRating - a.summary.averageRating;
      }
      return b.summary.totalDelivered - a.summary.totalDelivered;
    });
}

// ─── Map snapshot for tracking ───────────────────────────────────────────
// Returns origin (store) + destination (buyer) + current location pin +
// progress percentage. Coordinates are roughly Lagos/Abuja/Rivers/PHC
// centroids — purely cosmetic for the map placeholder.

export interface TrackingMapPoint {
  lat: number;
  lng: number;
  label: string;
}

export interface TrackingMap {
  origin: TrackingMapPoint;
  destination: TrackingMapPoint;
  current: TrackingMapPoint;
  progressPercent: number; // 0–100
  distanceKm: number;
  etaMinutes: number;
}

const STATE_COORDS: Record<string, { lat: number; lng: number }> = {
  Lagos: { lat: 6.5244, lng: 3.3792 },
  Abuja: { lat: 9.0765, lng: 7.3986 },
  Rivers: { lat: 4.8156, lng: 7.0498 },
  Oyo: { lat: 7.3775, lng: 3.947 },
  Kano: { lat: 12.0022, lng: 8.592 },
};

export function buildTrackingMap(order: DummyOrder): TrackingMap {
  const destState = order.deliveryAddress?.state ?? "Lagos";
  const storeState = order.storeId.includes("techhub") ? "Lagos" : "Lagos";
  const dest = STATE_COORDS[destState] ?? STATE_COORDS.Lagos;
  const orig = STATE_COORDS[storeState] ?? STATE_COORDS.Lagos;
  // Progress depends on status — DELIVERED = 100%, SHIPPED/OUT_FOR_DELIVERY = 60–85%.
  let progress = 0;
  if (order.status === "DELIVERED") progress = 100;
  else if (order.status === "OUT_FOR_DELIVERY") progress = 85;
  else if (order.status === "SHIPPED") progress = 55;
  else if (order.status === "READY") progress = 25;
  else if (order.status === "CONFIRMED") progress = 10;
  // Interpolate current position between origin and destination by progress.
  const curLat = orig.lat + (dest.lat - orig.lat) * (progress / 100);
  const curLng = orig.lng + (dest.lng - orig.lng) * (progress / 100);
  // Rough distance (equirectangular approximation).
  const dLat = (dest.lat - orig.lat) * 111;
  const dLng = (dest.lng - orig.lng) * 111 * Math.cos(((orig.lat + dest.lat) / 2) * (Math.PI / 180));
  const distanceKm = Math.round(Math.sqrt(dLat * dLat + dLng * dLng));
  const etaMinutes = Math.max(5, Math.round(((100 - progress) / 100) * distanceKm * 2.5));
  return {
    origin: { lat: orig.lat, lng: orig.lng, label: order.storeName },
    destination: { lat: dest.lat, lng: dest.lng, label: order.deliveryAddress?.city ?? destState },
    current: { lat: curLat, lng: curLng, label: "Driver" },
    progressPercent: progress,
    distanceKm,
    etaMinutes,
  };
}

// ─── User profile ─────────────────────────────────────────────────────────

export const user = {
  id: "user-demo",
  firstName: "Adaeze",
  lastName: "Okonkwo",
  email: "adaeze.demo@kwikseller.com",
  phone: "+234 803 123 4567",
  avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
  isVerified: true,
  createdAt: "2024-09-15T10:00:00.000Z",
  kwikCoinsBalance: 2450,
  tier: "GOLD",
};

// ─── KwikCoins wallet data ────────────────────────────────────────────────

export interface WalletTransaction {
  id: string;
  type: "CREDIT" | "DEBIT";
  amount: number; // in KwikCoins
  description: string;
  category: "ORDER_REWARD" | "SIGNUP_BONUS" | "REFERRAL" | "REDEMPTION" | "PURCHASE" | "AD_CREDIT" | "TIER_BONUS";
  createdAt: string;
}

export const wallet = {
  balance: 2450,
  nairaEquivalent: 24500, // 1 KwikCoin = ₦10
  tier: "GOLD" as const,
  tierProgress: 65, // % to next tier
  nextTier: "PLATINUM" as const,
  nextTierThreshold: 5000,
  lifetimeEarned: 8420,
  lifetimeSpent: 5970,
  earningRate: 3, // coins per ₦1000 spent (Gold tier 3x)
  // ── Cycle 7: expiring coins ────────────────────────────────────────────
  expiringCoins: {
    amount: 180,
    expiresAt: new Date(Date.now() + 12 * 86400000).toISOString(), // in 12 days
    reason: "Promotional coins from Summer Sale",
  },
  // ── Cycle 7: referral program ──────────────────────────────────────────
  referral: {
    code: "ADAEZE24",
    referralUrl: "https://kwikseller.example.com/r/ADAEZE24",
    totalReferrals: 7,
    successfulReferrals: 5,
    pendingReferrals: 2,
    coinsEarned: 1250,
    rewardPerReferral: 250,
    // The friend also gets a reward
    friendReward: 100,
    nextMilestone: 10, // bonus at 10 successful referrals
    milestoneBonus: 500,
  },
  transactions: [
    { id: "wt-1", type: "CREDIT" as const, amount: 150, description: "Order KS-1001 reward", category: "ORDER_REWARD" as const, createdAt: new Date(Date.now() - 2 * 3600000).toISOString() },
    { id: "wt-2", type: "DEBIT" as const, amount: 500, description: "Redeemed for ₦5,000 ad credit", category: "AD_CREDIT" as const, createdAt: new Date(Date.now() - 1 * 86400000).toISOString() },
    { id: "wt-3", type: "CREDIT" as const, amount: 250, description: "Referred a friend — Chidi N.", category: "REFERRAL" as const, createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
    { id: "wt-4", type: "CREDIT" as const, amount: 320, description: "Order KS-998 reward", category: "ORDER_REWARD" as const, createdAt: new Date(Date.now() - 4 * 86400000).toISOString() },
    { id: "wt-5", type: "DEBIT" as const, amount: 1000, description: "₦10,000 discount on order KS-995", category: "REDEMPTION" as const, createdAt: new Date(Date.now() - 6 * 86400000).toISOString() },
    { id: "wt-6", type: "CREDIT" as const, amount: 1000, description: "Welcome bonus — Gold tier", category: "SIGNUP_BONUS" as const, createdAt: new Date(Date.now() - 30 * 86400000).toISOString() },
    { id: "wt-7", type: "CREDIT" as const, amount: 500, description: "Gold tier anniversary bonus", category: "TIER_BONUS" as const, createdAt: new Date(Date.now() - 14 * 86400000).toISOString() },
  ] as WalletTransaction[],
};

export const tiers = [
  { name: "BRONZE", minCoins: 0, earningRate: 1, color: "kwik-amber", perks: ["1× coin earning", "Basic support"] },
  { name: "SILVER", minCoins: 1000, earningRate: 2, color: "kwik-muted", perks: ["2× coin earning", "Priority support", "5% off first order each month"] },
  { name: "GOLD", minCoins: 2000, earningRate: 3, color: "kwik-orange", perks: ["3× coin earning", "Free delivery on 2 orders/month", "Early access to deals"] },
  { name: "PLATINUM", minCoins: 5000, earningRate: 5, color: "kwik-blue", perks: ["5× coin earning", "Free delivery on all orders", "Exclusive Platinum deals", "Dedicated account manager"] },
];

export const addresses: DummyAddress[] = [
  {
    id: "addr-1",
    label: "Home",
    fullName: "Adaeze Okonkwo",
    phone: "+234 803 123 4567",
    addressLine1: "12 Allen Avenue, Ikeja",
    addressLine2: "Apartment 4B",
    city: "Ikeja",
    state: "Lagos",
    localGovernment: "Ikeja",
    isDefault: true,
    type: "HOME",
  },
  {
    id: "addr-2",
    label: "Work",
    fullName: "Adaeze Okonkwo",
    phone: "+234 803 123 4567",
    addressLine1: "5th Floor, Transcorp Hilton",
    addressLine2: "Suite 502",
    city: "Municipal",
    state: "Abuja",
    localGovernment: "Municipal",
    isDefault: false,
    type: "WORK",
  },
];

// ─── In-memory order store ────────────────────────────────────────────────
// Seeds with a couple of existing orders so vendor dashboards aren't empty.

let orderCounter = 1000;

function seedOrder(
  storeId: string,
  productIds: { id: string; qty: number }[],
  status: OrderStatus,
  paymentStatus: "PAID" | "PENDING" = "PAID",
  daysAgo = 2,
): DummyOrder {
  const store = products.find((p) => p.storeId === storeId)?.store;
  const storeName = store?.name ?? "Store";
  const items: DummyOrderItem[] = productIds.map(({ id, qty }, idx) => {
    const p = products.find((x) => x.id === id)!;
    return {
      id: `item-seed-${id}`,
      productId: p.id,
      product: {
        id: p.id,
        name: p.name,
        slug: p.slug,
        image: p.images[0]?.url ?? "",
        price: p.price,
        storeId: p.storeId,
        storeName,
      },
      quantity: qty,
      unitPrice: p.price,
      totalPrice: p.price * qty,
      variantId: p.variants[0]?.id,
      variantName: p.variants[0]?.name,
    };
  });
  const subtotal = items.reduce((s, i) => s + i.totalPrice, 0);
  const deliveryFee = 1500;
  const discount = 0;
  const platformFee = Math.round(subtotal * 0.05);
  const total = subtotal + deliveryFee - discount;
  const created = new Date(Date.now() - daysAgo * 86400000).toISOString();
  return {
    id: `order-seed-${storeId}-${orderCounter++}`,
    orderNumber: `KS-${orderCounter}`,
    buyerId: "user-seed-1",
    buyerName: "Bola Adeyemi",
    buyerEmail: "bola@example.com",
    buyerPhone: "+234 802 555 0101",
    storeId,
    storeName,
    items,
    subtotal,
    discount,
    deliveryFee,
    platformFee,
    total,
    status,
    paymentStatus,
    paymentMethod: "CARD",
    paymentReference: `ref-seed-${orderCounter}`,
    deliveryAddress: addresses[0],
    deliveryType: "STANDARD",
    estimatedDeliveryDays: 2,
    // Pre-assign delivery agent for shipped/delivered seeded orders so the
    // tracking page can show the agent without needing a state transition.
    deliveryAgent:
      status === "SHIPPED" || status === "OUT_FOR_DELIVERY" || status === "DELIVERED"
        ? pickAgentForOrder(`order-seed-${storeId}-${orderCounter - 1}`)
        : undefined,
    timeline: [
      { status: "PENDING", at: created, note: "Order placed" },
      ...(status !== "PENDING" ? [{ status: "CONFIRMED" as const, at: created, note: "Vendor confirmed order" }] : []),
      ...(status === "SHIPPED" || status === "OUT_FOR_DELIVERY" || status === "DELIVERED"
        ? [{ status: "SHIPPED" as const, at: created, note: "Order shipped" }]
        : []),
      ...(status === "DELIVERED" ? [{ status: "DELIVERED" as const, at: created, note: "Order delivered" }] : []),
    ],
    createdAt: created,
    updatedAt: created,
  };
}

// In-memory store (resets on server restart — fine for dev/dummy mode).
export const orderStore: DummyOrder[] = [
  seedOrder("store-techhub", [{ id: "p-9", qty: 1 }, { id: "p-13", qty: 1 }], "CONFIRMED", "PAID", 1),
  seedOrder("store-zara", [{ id: "p-1", qty: 2 }], "DELIVERED", "PAID", 5),
  seedOrder("store-glow", [{ id: "p-20", qty: 1 }], "SHIPPED", "PAID", 2),
  seedOrder("store-techhub", [{ id: "p-10", qty: 1 }], "PENDING", "PENDING", 0),
  // ── Cycle 10: extra seeds to populate the delivery-agent leaderboard ──
  // Each DELIVERED order below gets a deterministic delivery rating so the
  // /delivery-agents leaderboard has data on first load.
  seedOrder("store-zara", [{ id: "p-3", qty: 1 }], "DELIVERED", "PAID", 7),
  seedOrder("store-techhub", [{ id: "p-12", qty: 1 }], "DELIVERED", "PAID", 9),
  seedOrder("store-glow", [{ id: "p-22", qty: 2 }], "DELIVERED", "PAID", 11),
  seedOrder("store-homevibe", [{ id: "p-26", qty: 1 }], "DELIVERED", "PAID", 14),
  seedOrder("store-freshmart", [{ id: "p-31", qty: 3 }], "DELIVERED", "PAID", 18),
  seedOrder("store-autoparts", [{ id: "p-34", qty: 1 }], "DELIVERED", "PAID", 21),
  seedOrder("store-zara", [{ id: "p-39", qty: 1 }], "DELIVERED", "PAID", 25),
  seedOrder("store-techhub", [{ id: "p-15", qty: 1 }], "DELIVERED", "PAID", 28),
  seedOrder("store-glow", [{ id: "p-25", qty: 1 }], "DELIVERED", "PAID", 32),
];

// Attach deterministic sample delivery ratings to all DELIVERED orders so
// the agent leaderboard has data on first load. The rating/comment/tags
// are derived from the order id hash so the same order always shows the
// same rating (matches real-world UX where ratings are persisted).
(function seedDeliveryRatings() {
  const SAMPLE_COMMENTS = [
    "Very polite and arrived earlier than expected. Will definitely order again!",
    "Careful with the package — everything arrived intact. Excellent service.",
    "Fast delivery, friendly agent, great communication throughout.",
    "On-time delivery. The agent called ahead to confirm I was home.",
    "Smooth experience from order to doorstep. Highly recommended courier.",
    "Took a bit longer than the ETA but the agent kept me updated. Good overall.",
    "Professional and courteous. Package was handled with care.",
    "Five stars — the agent even helped me carry the box upstairs!",
  ];
  const SAMPLE_TAGS = [
    ["On time", "Polite & friendly", "Careful with package"],
    ["Fast delivery", "Good communication"],
    ["Polite & friendly", "Careful with package", "Good communication"],
    ["On time", "Fast delivery"],
    ["Careful with package"],
  ];
  for (const order of orderStore) {
    if (order.status !== "DELIVERED") continue;
    if (!order.deliveryAgent) continue;
    // Already has a rating? Skip.
    if ((order as { deliveryRating?: unknown }).deliveryRating) continue;
    // Deterministic hash of order id → rating (4 or 5 stars, mostly 5).
    let h = 0;
    for (let i = 0; i < order.id.length; i++) {
      h = (h * 31 + order.id.charCodeAt(i)) & 0xffffffff;
    }
    const rating = Math.abs(h) % 10 === 0 ? 4 : 5;
    const comment = SAMPLE_COMMENTS[Math.abs(h) % SAMPLE_COMMENTS.length];
    const tags = SAMPLE_TAGS[Math.abs(h) % SAMPLE_TAGS.length];
    (order as { deliveryRating?: {
      rating: number; comment: string; tags: string[]; createdAt: string;
    } }).deliveryRating = {
      rating,
      comment,
      tags,
      // The rating was submitted shortly after delivery.
      createdAt: new Date(new Date(order.createdAt).getTime() + 36_000_000).toISOString(),
    };
  }
})();

export function nextOrderNumber(): string {
  orderCounter += 1;
  return `KS-${orderCounter}`;
}

export function addOrder(order: DummyOrder): DummyOrder {
  orderStore.unshift(order);
  return order;
}

export function findOrder(id: string): DummyOrder | undefined {
  return orderStore.find((o) => o.id === id || o.orderNumber === id);
}

export function updateOrderStatus(
  id: string,
  status: OrderStatus,
  note?: string,
): DummyOrder | undefined {
  const order = findOrder(id);
  if (!order) return undefined;
  order.status = status;
  order.updatedAt = new Date().toISOString();
  order.timeline.push({ status, at: order.updatedAt, note });
  if (status === "SHIPPED" && !order.trackingNumber) {
    order.trackingNumber = `TRK-${Date.now().toString(36).toUpperCase()}`;
  }
  // Assign a delivery agent once the order ships (deterministic per-order).
  if (
    (status === "SHIPPED" || status === "OUT_FOR_DELIVERY" || status === "DELIVERED") &&
    !order.deliveryAgent
  ) {
    order.deliveryAgent = pickAgentForOrder(order.id);
  }
  return order;
}

// ─── Notification preferences (cycle 5) ───────────────────────────────────
//
// In-memory store keyed by user id. Seeded with sensible defaults for the
// demo user. The /users/me/notification-preferences endpoint reads and
// writes this object.

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
    startHour: number; // 0-23
    endHour: number; // 0-23
  };
  language: "en" | "ha" | "yo" | "ig";
  updatedAt: string;
}

const preferencesStore: Record<string, NotificationPreferences> = {
  "user-demo": {
    userId: "user-demo",
    groups: [
      {
        key: "order_updates",
        label: "Order updates",
        description: "Order placed, vendor quotes delivery, order shipped, delivered.",
        channels: { email: true, push: true, sms: true },
      },
      {
        key: "promotions",
        label: "Promotions & deals",
        description: "Flash sales, seasonal coupons, vendor-exclusive offers.",
        channels: { email: true, push: true, sms: false },
      },
      {
        key: "account_security",
        label: "Account & security",
        description: "Login alerts, password changes, two-factor events.",
        channels: { email: true, push: true, sms: true },
      },
      {
        key: "vendor_orders",
        label: "Vendor orders (incoming)",
        description: "When a buyer places an order with your store.",
        channels: { email: true, push: true, sms: false },
      },
      {
        key: "wallet",
        label: "KwikCoins wallet",
        description: "Coins earned, redeemed, or expiring soon.",
        channels: { email: true, push: false, sms: false },
      },
      {
        key: "newsletter",
        label: "Weekly newsletter",
        description: "Trending products, new vendors, marketplace highlights.",
        channels: { email: true, push: false, sms: false },
      },
    ],
    doNotDisturb: { enabled: false, startHour: 22, endHour: 7 },
    language: "en",
    updatedAt: new Date().toISOString(),
  },
};

export function getNotificationPreferences(userId: string): NotificationPreferences | undefined {
  return preferencesStore[userId];
}

export function updateNotificationPreferences(
  userId: string,
  patch: Partial<NotificationPreferences>,
): NotificationPreferences {
  const existing =
    preferencesStore[userId] ??
    ({
      userId,
      groups: [],
      doNotDisturb: { enabled: false, startHour: 22, endHour: 7 },
      language: "en",
      updatedAt: new Date().toISOString(),
    } as NotificationPreferences);
  const next: NotificationPreferences = {
    ...existing,
    ...patch,
    userId,
    updatedAt: new Date().toISOString(),
  };
  preferencesStore[userId] = next;
  return next;
}
