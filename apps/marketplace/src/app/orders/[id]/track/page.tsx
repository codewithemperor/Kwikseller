"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Package,
  Truck,
  MapPin,
  CheckCircle2,
  Clock,
  PackageCheck,
  Home,
  Navigation,
  Phone,
  Copy,
  Check,
  Loader2,
  Star,
  Bike,
  Car,
  User as UserIcon,
  MessageCircle,
  Route,
  Store,
  Timer,
  ThumbsUp,
  Send,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@kwikseller/api-client";
import { AppImage } from "@/components/ui/app-image";
import { PageLoading } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { kwikToast } from "@kwikseller/utils";
import { useDeliveryRating, useRateDelivery } from "@/lib/order-api";
import { cn } from "@/lib/utils";

interface DeliveryAgent {
  id: string;
  name: string;
  phone: string;
  photo: string;
  rating: number;
  totalDeliveries: number;
  vehicleType: "BIKE" | "CAR" | "VAN";
  vehiclePlate: string;
  partner: string;
  assignedAt: string;
}

interface TrackingMapPoint {
  lat: number;
  lng: number;
  label: string;
}

interface TrackingMap {
  origin: TrackingMapPoint;
  destination: TrackingMapPoint;
  current: TrackingMapPoint;
  progressPercent: number;
  distanceKm: number;
  etaMinutes: number;
}

interface TrackingData {
  orderNumber: string;
  status: string;
  trackingNumber?: string;
  timeline: { status: string; at: string; note?: string }[];
  deliveryAgent?: DeliveryAgent;
  map?: TrackingMap;
}

interface TrackResponse {
  order?: {
    storeName: string;
    buyerName: string;
    deliveryAddress?: { fullName: string; phone: string; addressLine1: string; city: string; state: string };
    items?: { product: { name: string; image: string }; quantity: number }[];
    estimatedDeliveryDays?: number;
    createdAt: string;
  };
}

function formatNGN(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

// Map order status → step index in the fulfilment journey.
const STEPS = [
  { key: "PENDING", label: "Order Placed", icon: Package, description: "Vendor received your order" },
  { key: "CONFIRMED", label: "Confirmed", icon: CheckCircle2, description: "Vendor confirmed & quoted delivery" },
  { key: "READY", label: "Ready for Dispatch", icon: PackageCheck, description: "Packed and ready to ship" },
  { key: "SHIPPED", label: "Shipped", icon: Truck, description: "Out for delivery" },
  { key: "DELIVERED", label: "Delivered", icon: Home, description: "Package delivered" },
];

function statusToStepIndex(status: string): number {
  const idx = STEPS.findIndex((s) => s.key === status);
  if (status === "OUT_FOR_DELIVERY") return 3;
  if (status === "CANCELLED" || status === "REJECTED") return -1;
  return idx === -1 ? 0 : idx;
}

export default function OrderTrackingPage() {
  const params = useParams<{ id: string }>();
  const orderId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [copied, setCopied] = React.useState(false);

  const { data, isLoading, isError } = useQuery<TrackingData & TrackResponse>({
    queryKey: ["order-tracking", orderId],
    queryFn: async () => {
      const trackRes = await api.get<TrackingData>(`orders/${orderId}/tracking`);
      // Also fetch the full order for delivery address + items.
      let order: TrackResponse["order"];
      try {
        const orderRes = await api.get<TrackResponse["order"] & { id: string }>(`orders/${orderId}`);
        order = orderRes.data;
      } catch {
        order = undefined;
      }
      return { ...(trackRes.data as TrackingData), order };
    },
    refetchInterval: 5000,
    enabled: !!orderId,
  });

  if (isLoading) return <PageLoading label="Loading tracking…" />;

  if (isError || !data) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <EmptyState
          variant="error"
          title="Tracking unavailable"
          description="We couldn't load tracking for this order. It may not have been shipped yet."
          action={
            <Link
              href={`/orders/${orderId}`}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-kwik-orange px-5 text-sm font-semibold text-white transition hover:bg-kwik-orange-hover"
            >
              Back to order
            </Link>
          }
        />
      </main>
    );
  }

  const currentIndex = statusToStepIndex(data.status);
  const isCancelled = currentIndex === -1;
  const trackingNumber = data.trackingNumber;
  const order = data.order;
  const address = order?.deliveryAddress;
  const agent = data.deliveryAgent;
  const map = data.map;
  const isEnRoute = currentIndex >= 3; // SHIPPED, OUT_FOR_DELIVERY, DELIVERED

  function copyTracking() {
    if (!trackingNumber) return;
    navigator.clipboard?.writeText(trackingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main className="min-h-screen bg-kwik-bg-page">
      <div className="container mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/orders/${orderId}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-kwik-muted transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to order
          </Link>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-kwik-muted">Tracking</p>
            <h1 className="font-heading text-xl font-bold text-foreground">{data.orderNumber}</h1>
          </div>
        </div>

        {/* Tracking number card */}
        {trackingNumber && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex items-center justify-between rounded-2xl border border-kwik-border-light bg-kwik-bg-surface p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-kwik-orange/10">
                <Navigation className="h-5 w-5 text-kwik-orange" />
              </div>
              <div>
                <p className="text-xs text-kwik-muted">Tracking number</p>
                <p className="font-mono font-semibold text-foreground">{trackingNumber}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={copyTracking}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-kwik-border-light px-3 text-sm font-medium text-kwik-muted transition hover:bg-kwik-bg-page"
            >
              {copied ? <Check className="h-4 w-4 text-kwik-green" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </motion.div>
        )}

        {/* Status banner */}
        <div
          className={cn(
            "mt-4 rounded-2xl p-5 text-center",
            isCancelled
              ? "bg-kwik-red/5 text-kwik-red"
              : currentIndex >= 4
                ? "bg-kwik-green/5 text-kwik-green"
                : "bg-kwik-orange/5 text-kwik-orange",
          )}
        >
          {isCancelled ? (
            <p className="text-lg font-bold">Order cancelled</p>
          ) : currentIndex >= 4 ? (
            <>
              <CheckCircle2 className="mx-auto h-10 w-10" />
              <p className="mt-2 text-lg font-bold">Delivered!</p>
              <p className="text-sm opacity-80">Your order has arrived. Enjoy!</p>
            </>
          ) : (
            <>
              <Loader2 className="mx-auto h-8 w-8 animate-spin" />
              <p className="mt-2 text-lg font-bold">
                {STEPS[Math.max(0, currentIndex)].label}
              </p>
              <p className="text-sm opacity-80">
                {STEPS[Math.max(0, currentIndex)].description}
                {order?.estimatedDeliveryDays && currentIndex < 4 && (
                  <> · Est. {order.estimatedDeliveryDays} day{order.estimatedDeliveryDays === 1 ? "" : "s"}</>
                )}
              </p>
            </>
          )}
        </div>

        {/* Live ETA countdown (cycle 7) — shown when en route and not yet arrived */}
        {isEnRoute && !isCancelled && map && map.progressPercent < 100 && (
          <LiveEtaCountdown etaMinutes={map.etaMinutes} distanceKm={map.distanceKm} />
        )}

        {/* Rate delivery prompt (cycle 7 + cycle 9 persistence) — shown when delivered */}
        {currentIndex >= 4 && !isCancelled && (
          <RateDeliveryCard orderId={orderId} agentName={agent?.name} />
        )}

        {/* Step timeline (horizontal on desktop) */}
        {!isCancelled && (
          <div className="mt-6 rounded-2xl border border-kwik-border-light bg-kwik-bg-surface p-5">
            <div className="hidden sm:flex sm:items-center sm:justify-between">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                const reached = i <= currentIndex;
                const isCurrent = i === currentIndex;
                return (
                  <div key={step.key} className="flex flex-1 flex-col items-center text-center">
                    <div className="flex w-full items-center">
                      {i > 0 && (
                        <div className={cn("h-0.5 flex-1", i <= currentIndex ? "bg-kwik-orange" : "bg-kwik-border-light")} />
                      )}
                      <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: isCurrent ? 1.1 : 1 }}
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-2 transition",
                          reached
                            ? "bg-kwik-orange text-white ring-kwik-orange"
                            : "bg-kwik-bg-page text-kwik-muted ring-kwik-border-light",
                          isCurrent && "ring-offset-2 ring-offset-kwik-bg-surface",
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </motion.div>
                      {i < STEPS.length - 1 && (
                        <div className={cn("h-0.5 flex-1", i < currentIndex ? "bg-kwik-orange" : "bg-kwik-border-light")} />
                      )}
                    </div>
                    <p className={cn("mt-2 text-xs font-semibold", reached ? "text-foreground" : "text-kwik-muted")}>
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Vertical timeline (mobile) */}
            <div className="space-y-4 sm:hidden">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                const reached = i <= currentIndex;
                const isCurrent = i === currentIndex;
                return (
                  <div key={step.key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: isCurrent ? 1.1 : 1 }}
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-full ring-2",
                          reached
                            ? "bg-kwik-orange text-white ring-kwik-orange"
                            : "bg-kwik-bg-page text-kwik-muted ring-kwik-border-light",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </motion.div>
                      {i < STEPS.length - 1 && (
                        <div className={cn("my-1 h-6 w-0.5", i < currentIndex ? "bg-kwik-orange" : "bg-kwik-border-light")} />
                      )}
                    </div>
                    <div className="pt-1">
                      <p className={cn("text-sm font-semibold", reached ? "text-foreground" : "text-kwik-muted")}>
                        {step.label}
                      </p>
                      <p className="text-xs text-kwik-muted">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Live map placeholder + delivery agent — shown once the order is en route */}
        {isEnRoute && !isCancelled && (
          <div className="mt-6 grid gap-4 lg:grid-cols-5">
            {/* Map placeholder (3/5 width on lg) */}
            {map && (
              <LiveRouteMap map={map} isDelivered={currentIndex >= 5} />
            )}

            {/* Delivery agent card (2/5 width on lg) */}
            {agent && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "rounded-2xl border border-kwik-border-light bg-kwik-bg-surface p-5",
                  !map && "lg:col-span-5",
                )}
              >
                <div className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-kwik-orange" />
                  <h2 className="font-heading text-sm font-semibold text-foreground">Delivery agent</h2>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="relative">
                    <AppImage
                      src={agent.photo}
                      alt={agent.name}
                      fallbackVariant="avatar"
                      className="h-14 w-14 rounded-full object-cover ring-2 ring-kwik-orange/30"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-kwik-green text-white ring-2 ring-kwik-bg-surface">
                      <Check className="h-3 w-3" />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">{agent.name}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-kwik-muted">
                      <span className="inline-flex items-center gap-0.5 text-kwik-amber">
                        <Star className="h-3 w-3 fill-current" />
                        <span className="font-semibold text-foreground">{agent.rating.toFixed(1)}</span>
                      </span>
                      <span aria-hidden>·</span>
                      <span>{agent.totalDeliveries.toLocaleString()} deliveries</span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-kwik-muted">{agent.partner}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <a
                    href={`tel:${agent.phone.replace(/\s+/g, "")}`}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-kwik-orange text-sm font-semibold text-white transition hover:bg-kwik-orange-hover"
                  >
                    <Phone className="h-4 w-4" /> Call
                  </a>
                  <button
                    type="button"
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-kwik-border-light bg-kwik-bg-page text-sm font-semibold text-foreground transition hover:bg-kwik-bg-surface"
                  >
                    <MessageCircle className="h-4 w-4" /> Chat
                  </button>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-kwik-border-light pt-3 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-kwik-muted">
                    {agent.vehicleType === "BIKE" ? (
                      <Bike className="h-4 w-4 text-kwik-orange" />
                    ) : agent.vehicleType === "VAN" ? (
                      <Truck className="h-4 w-4 text-kwik-orange" />
                    ) : (
                      <Car className="h-4 w-4 text-kwik-orange" />
                    )}
                    {agent.vehicleType.charAt(0) + agent.vehicleType.slice(1).toLowerCase()}
                  </span>
                  <span className="font-mono font-medium text-foreground">{agent.vehiclePlate}</span>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Full history timeline */}
        {data.timeline.length > 0 && (
          <div className="mt-6 rounded-2xl border border-kwik-border-light bg-kwik-bg-surface p-5">
            <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-foreground">
              <Clock className="h-5 w-5 text-kwik-orange" /> History
            </h2>
            <ol className="mt-4 space-y-3">
              {data.timeline.map((t, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span
                    className={cn(
                      "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
                      i === data.timeline.length - 1 ? "bg-kwik-orange ring-4 ring-kwik-orange/20" : "bg-kwik-muted",
                    )}
                  />
                  <div>
                    <p className="font-medium text-foreground">{t.status.replace(/_/g, " ")}</p>
                    <p className="text-xs text-kwik-muted">
                      {formatDateTime(t.at)}
                      {t.note ? ` · ${t.note}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Delivery address + items */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {address && (
            <div className="rounded-2xl border border-kwik-border-light bg-kwik-bg-surface p-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-kwik-orange" />
                <h2 className="font-semibold text-foreground">Delivery address</h2>
              </div>
              <p className="mt-3 text-sm text-kwik-muted">
                <span className="font-medium text-foreground">{address.fullName}</span>
                <br />
                {address.addressLine1}
                <br />
                {address.city}, {address.state}
              </p>
              <a
                href={`tel:${address.phone}`}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-kwik-orange hover:underline"
              >
                <Phone className="h-3.5 w-3.5" /> {address.phone}
              </a>
            </div>
          )}
          {order?.items && order.items.length > 0 && (
            <div className="rounded-2xl border border-kwik-border-light bg-kwik-bg-surface p-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-kwik-orange" />
                <h2 className="font-semibold text-foreground">Items ({order.items.length})</h2>
              </div>
              <div className="mt-3 space-y-2">
                {order.items.slice(0, 4).map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.product.image} alt={item.product.name} className="h-9 w-9 rounded-md object-cover" />
                    <span className="line-clamp-1 flex-1 font-medium text-foreground">{item.product.name}</span>
                    <span className="text-kwik-muted">×{item.quantity}</span>
                  </div>
                ))}
                {order.items.length > 4 && (
                  <p className="text-xs text-kwik-muted">+{order.items.length - 4} more</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// ─── LiveEtaCountdown ──────────────────────────────────────────────────────
// A live ticking countdown showing time remaining until delivery. We anchor
// the countdown to a deterministic "target timestamp" computed once from the
// ETA minutes, so the displayed time decreases smoothly every second.

function LiveEtaCountdown({
  etaMinutes,
  distanceKm,
}: {
  etaMinutes: number;
  distanceKm: number;
}) {
  // Compute the target delivery time once (or when etaMinutes changes).
  const targetRef = React.useRef<number>(0);
  if (targetRef.current === 0) {
    targetRef.current = Date.now() + Math.max(1, etaMinutes) * 60_000;
  }
  React.useEffect(() => {
    // Reset the target if etaMinutes changes significantly.
    targetRef.current = Date.now() + Math.max(1, etaMinutes) * 60_000;
  }, [etaMinutes]);

  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remainingMs = Math.max(0, targetRef.current - now);
  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 overflow-hidden rounded-2xl border border-kwik-orange/30 bg-gradient-to-br from-kwik-orange/5 to-kwik-amber/5 p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-kwik-orange text-white shadow-lg">
            <Timer className="h-6 w-6" />
            <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-kwik-amber opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-kwik-amber" />
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-kwik-muted">
              Estimated arrival
            </p>
            <p className="font-heading text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
              {hours > 0 ? `${hours}:` : ""}
              {pad(minutes)}:{pad(seconds)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="text-right">
            <p className="text-xs text-kwik-muted">Distance left</p>
            <p className="font-semibold text-foreground">
              {distanceKm.toFixed(1)} km
            </p>
          </div>
          <div className="hidden h-10 w-px bg-kwik-border-light sm:block" />
          <div className="text-right">
            <p className="text-xs text-kwik-muted">Arriving by</p>
            <p className="font-semibold text-kwik-orange-dark">
              {new Date(targetRef.current).toLocaleTimeString("en-NG", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── LiveRouteMap ──────────────────────────────────────────────────────────
// Stylised live route map with origin → driver → destination pins.
// Cycle 9 enhancement: the driver pin now moves in real time between API
// refreshes — `liveProgress` ticks up by ~0.6% every 3s (capped at 99% while
// the order is in transit, 100% once DELIVERED). When the API refreshes the
// base `progressPercent`, we sync to it (taking the max so we never go
// backwards).

function LiveRouteMap({
  map,
  isDelivered,
}: {
  map: NonNullable<TrackingData["map"]>;
  isDelivered: boolean;
}) {
  const baseProgress = map.progressPercent;
  const [liveProgress, setLiveProgress] = React.useState(baseProgress);

  // Tick the progress up every 3s while the order is in transit. The
  // setInterval callback (not the effect body) calls setState — this
  // satisfies the `react-hooks/set-state-in-effect` lint rule. Including
  // `baseProgress` in the deps means the interval is re-created when the
  // API refreshes, and the callback takes the max of prev and the new
  // baseProgress so the displayed value never goes backwards.
  React.useEffect(() => {
    if (isDelivered) return;
    const id = window.setInterval(() => {
      setLiveProgress((prev) => {
        const effective = Math.max(prev, baseProgress);
        return Math.min(99, effective + 0.6);
      });
    }, 3000);
    return () => window.clearInterval(id);
  }, [isDelivered, baseProgress]);

  // Live ETA — decrement as the driver progresses. The base ETA from the
  // API is the value at the base progress; we scale it down as liveProgress
  // increases.
  const remainingFraction = Math.max(0, 1 - liveProgress / 100);
  const liveEta = Math.max(1, Math.round((map.etaMinutes ?? 0) * (remainingFraction || 0.05)));
  // Display the higher of the live progress or the base — never show less
  // than what the backend reports.
  const displayProgress = Math.max(liveProgress, baseProgress);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="lg:col-span-3 overflow-hidden rounded-2xl border border-kwik-border-light bg-kwik-bg-surface"
    >
      <div className="flex items-center justify-between gap-2 border-b border-kwik-border-light px-4 py-3">
        <div className="flex items-center gap-2">
          <Route className="h-5 w-5 text-kwik-orange" />
          <h2 className="font-heading text-sm font-semibold text-foreground">Live route</h2>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-kwik-orange/10 px-2.5 py-1 text-xs font-semibold text-kwik-orange">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-kwik-orange opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-kwik-orange" />
          </span>
          Live
        </span>
      </div>
      {/* The "map" itself is a stylised placeholder — a gradient
          surface with a dashed route line, origin pin (store),
          current location pin (driver, animated pulse), and
          destination pin (buyer). Real map tiles would replace
          this in production. */}
      <div className="relative h-56 w-full bg-gradient-to-br from-kwik-bg-page via-kwik-bg-surface to-kwik-bg-page sm:h-64">
        {/* Decorative grid lines to suggest a map */}
        <svg
          aria-hidden
          className="absolute inset-0 h-full w-full opacity-[0.07]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="map-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#map-grid)" />
        </svg>
        {/* Origin pin (top-left area) */}
        <div className="absolute left-[12%] top-[68%] flex flex-col items-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-kwik-dark text-white shadow-lg ring-2 ring-white">
            <Store className="h-4 w-4" />
          </div>
          <p className="mt-1 max-w-[100px] truncate rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-kwik-dark shadow-sm">
            {map.origin.label}
          </p>
        </div>
        {/* Destination pin (top-right area) */}
        <div className="absolute right-[12%] top-[20%] flex flex-col items-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-kwik-orange text-white shadow-lg ring-2 ring-white">
            <MapPin className="h-4 w-4" />
          </div>
          <p className="mt-1 max-w-[100px] truncate rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-kwik-dark shadow-sm">
            {map.destination.label}
          </p>
        </div>
        {/* Dashed route line connecting origin → current → destination */}
        <svg
          aria-hidden
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <path
            d={`M 12 68 Q 30 ${30 + (68 - 30) * (1 - displayProgress / 100)} ${12 + (88 - 12) * (displayProgress / 100)} ${68 - (68 - 20) * (displayProgress / 100)} T 88 20`}
            fill="none"
            stroke="var(--color-kwik-orange, #F97316)"
            strokeWidth="0.7"
            strokeDasharray="2 1.5"
            strokeLinecap="round"
          />
        </svg>
        {/* Current driver pin — interpolated position along the route.
            `liveProgress` smoothly animates between API refreshes so the
            pin visibly moves over time. */}
        <motion.div
          initial={false}
          animate={{
            left: `${12 + (88 - 12) * (displayProgress / 100)}%`,
            top: `${68 - (68 - 20) * (displayProgress / 100)}%`,
            scale: 1,
          }}
          transition={{ type: "spring", stiffness: 60, damping: 18 }}
          className="absolute"
          style={{ transform: "translate(-50%, -50%)" }}
        >
          <div className="relative flex h-10 w-10 items-center justify-center">
            {/* Pulsing location ring */}
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-kwik-orange/40" />
            <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-kwik-orange text-white shadow-lg ring-2 ring-white">
              <Truck className="h-4 w-4" />
            </span>
          </div>
        </motion.div>
        {/* Live progress badge */}
        <div className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-kwik-orange shadow-sm ring-1 ring-kwik-orange/20">
          {Math.round(displayProgress)}% there
        </div>
      </div>
      {/* Map footer — distance + ETA + progress bar */}
      <div className="border-t border-kwik-border-light px-4 py-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-kwik-muted">Distance</span>
          <span className="font-semibold text-foreground">{map.distanceKm} km</span>
        </div>
        <div className="mt-1.5 flex items-center justify-between text-xs">
          <span className="text-kwik-muted">ETA</span>
          <span className="font-semibold text-kwik-orange">
            {displayProgress >= 100 ? "Arrived" : `~${liveEta} min`}
          </span>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-kwik-bg-page">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${displayProgress}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
            className="h-full rounded-full bg-gradient-to-r from-kwik-orange to-kwik-amber"
          />
        </div>
      </div>
    </motion.div>
  );
}

// ─── RateDeliveryCard ──────────────────────────────────────────────────────
// A post-delivery rating prompt. The user picks a star rating (1–5) and can
// leave an optional comment + "thumbs up" tags. The rating is persisted via
// POST /orders/:id/delivery-rating so it survives page refreshes — the
// "Already rated" state is shown on revisit.

const DELIVERY_TAGS = [
  "On time",
  "Polite & friendly",
  "Careful with package",
  "Good communication",
  "Fast delivery",
] as const;

function RateDeliveryCard({ orderId, agentName }: { orderId: string; agentName?: string }) {
  const ratingQuery = useDeliveryRating(orderId);
  const rateMutation = useRateDelivery();
  const [rating, setRating] = React.useState(0);
  const [hovered, setHovered] = React.useState(0);
  const [comment, setComment] = React.useState("");
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  async function handleSubmit() {
    if (rating === 0) {
      kwikToast.error("Please select a star rating", "Tap a star to rate your delivery experience.");
      return;
    }
    try {
      await rateMutation.mutateAsync({
        orderId,
        rating,
        comment,
        tags: selectedTags,
      });
      kwikToast.success("Thanks for your feedback!", `You rated ${agentName ?? "your delivery"} ${rating} star${rating === 1 ? "" : "s"}.`);
    } catch (e) {
      kwikToast.error("Failed to submit rating", e instanceof Error ? e.message : "Try again.");
    }
  }

  // Already-rated state — show the persisted rating + comment + tags.
  if (ratingQuery.data) {
    const dr = ratingQuery.data;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mt-4 rounded-2xl border border-kwik-green/30 bg-kwik-green/5 p-5"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-kwik-green/15 text-kwik-green">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-heading text-base font-bold text-foreground">
              Delivery rated
            </h2>
            <p className="text-xs text-kwik-muted">
              You submitted this feedback on{" "}
              {new Date(dr.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}.
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={cn(
                "h-6 w-6",
                s <= dr.rating
                  ? "fill-kwik-amber text-kwik-amber"
                  : "text-kwik-border-light",
              )}
            />
          ))}
        </div>
        {dr.comment && (
          <div className="mt-3 rounded-xl border border-kwik-border-light bg-kwik-bg-surface p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-kwik-muted">
              Your comment
            </p>
            <p className="mt-1 text-sm text-foreground">{dr.comment}</p>
          </div>
        )}
        {dr.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {dr.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 rounded-full border border-kwik-orange/30 bg-kwik-orange-tint px-3 py-1 text-xs font-medium text-kwik-orange-dark"
              >
                <ThumbsUp className="h-3 w-3" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 overflow-hidden rounded-2xl border border-kwik-border-light bg-kwik-bg-surface p-5"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-kwik-amber/10 text-kwik-amber">
          <Star className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-heading text-base font-bold text-foreground">
            Rate your delivery
          </h2>
          <p className="text-xs text-kwik-muted">
            {agentName
              ? `How was your experience with ${agentName}?`
              : "How was your delivery experience?"}
          </p>
        </div>
      </div>

      {/* Star rating */}
      <div className="mt-4 flex items-center justify-center gap-2">
        {[1, 2, 3, 4, 5].map((s) => {
          const filled = s <= (hovered || rating);
          return (
            <button
              key={s}
              type="button"
              aria-label={`Rate ${s} star${s === 1 ? "" : "s"}`}
              onMouseEnter={() => setHovered(s)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(s)}
              className="rounded-lg p-1 transition hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-kwik-orange"
            >
              <Star
                className={cn(
                  "h-8 w-8 transition-colors",
                  filled
                    ? "fill-kwik-amber text-kwik-amber"
                    : "text-kwik-border-light",
                )}
              />
            </button>
          );
        })}
      </div>
      {rating > 0 && (
        <p className="mt-2 text-center text-sm font-medium text-kwik-muted">
          {rating === 5 && "Excellent! 🎉"}
          {rating === 4 && "Great! 👍"}
          {rating === 3 && "Okay"}
          {rating === 2 && "Could be better"}
          {rating === 1 && "Sorry to hear that"}
        </p>
      )}

      {/* Tags */}
      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-kwik-muted">
          What went well? <span className="font-normal lowercase">(optional)</span>
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {DELIVERY_TAGS.map((tag) => {
            const active = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  active
                    ? "border-kwik-orange bg-kwik-orange-tint text-kwik-orange-dark"
                    : "border-kwik-border-light bg-kwik-bg-page text-kwik-muted hover:border-kwik-orange/40",
                )}
              >
                {active && <ThumbsUp className="h-3 w-3" />}
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Comment */}
      <div className="mt-4">
        <label className="text-xs font-semibold uppercase tracking-wider text-kwik-muted">
          Comment <span className="font-normal lowercase">(optional)</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Share more about your delivery experience…"
          className="mt-1.5 w-full resize-none rounded-xl border border-kwik-border-light bg-kwik-bg-page px-3 py-2 text-sm text-foreground outline-none transition focus:border-kwik-orange dark:border-white/10 dark:bg-white/5"
        />
      </div>

      {/* Submit */}
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setRating(0);
            setComment("");
            setSelectedTags([]);
          }}
          disabled={rateMutation.isPending}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-kwik-border-light bg-kwik-bg-page px-4 text-sm font-semibold text-foreground transition hover:bg-kwik-bg-surface disabled:opacity-60"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={rateMutation.isPending}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-kwik-gradient px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {rateMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Submit feedback
        </button>
      </div>
    </motion.div>
  );
}
