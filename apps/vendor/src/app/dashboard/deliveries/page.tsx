"use client";

import React from "react";
import {
  Truck,
  Search,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle,
  AlertCircle,
  Bike,
  MapPin,
  Phone,
  Package,
  ArrowRight,
  ChevronRight,
  Eye,
} from "lucide-react";
import { AppButton, Skeleton, FieldSelect, VendorPageHeader, VendorStatusBadge } from "@/lib/ui";
import { formatCurrency, formatDate, unwrapApiData } from "@/lib/vendor-format";
import { kwikToast } from "@/lib/utils";
import { motion } from "framer-motion";

// ==================== Types ====================

type DeliveryStatus =
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
  | "RETURNED";

type DeliveryItem = {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  status: DeliveryStatus;
  riderName: string | null;
  riderPhone: string | null;
  riderVehicle?: string;
  estimatedMinutes: number | null;
  amount: number;
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
  preparingAt?: string;
  readyAt?: string;
  pickedUpAt?: string;
  inTransitAt?: string;
  arrivedAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  returnedAt?: string;
  items?: string[];
  pickupAddress?: string;
};

type DateRange = "today" | "week" | "month";
type StatusFilter =
  | "ALL"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "ARRIVED"
  | "DELIVERED"
  | "COMPLETED";

// ==================== Constants ====================

const DELIVERIES_KEY = "kwikseller_vendor_deliveries";

const VENDOR_RELEVANT_TABS: { key: StatusFilter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PREPARING", label: "Preparing" },
  { key: "READY_FOR_PICKUP", label: "Ready" },
  { key: "IN_TRANSIT", label: "In Transit" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "COMPLETED", label: "Completed" },
];

const TIMELINE_STAGES = [
  { key: "ACCEPTED", label: "Accepted" },
  { key: "PREPARING", label: "Preparing" },
  { key: "READY_FOR_PICKUP", label: "Ready" },
  { key: "IN_TRANSIT", label: "In Transit" },
  { key: "DELIVERED", label: "Delivered" },
] as const;

const STATUS_ORDER: DeliveryStatus[] = [
  "PENDING",
  "ASSIGNED",
  "ACCEPTED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "PICKED_UP",
  "IN_TRANSIT",
  "ARRIVED",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "RETURNED",
];

// ==================== Helpers ====================

function generateId() {
  return `del_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function getTimelineStageIndex(status: DeliveryStatus): number {
  const stageKeys = TIMELINE_STAGES.map((s) => s.key);
  const statusIdx = stageKeys.indexOf(status as (typeof TIMELINE_STAGES)[number]["key"]);
  if (statusIdx >= 0) return statusIdx;
  // Statuses before ACCEPTED map to -1 (all dots empty)
  if (STATUS_ORDER.indexOf(status) < STATUS_ORDER.indexOf("ACCEPTED")) return -1;
  // Statuses after DELIVERED map to last index (all dots filled)
  return TIMELINE_STAGES.length - 1;
}

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

function isTerminalStatus(status: DeliveryStatus): boolean {
  return ["DELIVERED", "COMPLETED", "CANCELLED", "RETURNED"].includes(status);
}

// ==================== Demo Data ====================

function createDemoDeliveries(): DeliveryItem[] {
  const now = new Date();
  const minutesAgo = (m: number) =>
    new Date(now.getTime() - m * 60000).toISOString();
  const hoursAgo = (h: number) =>
    new Date(now.getTime() - h * 3600000).toISOString();
  const daysAgo = (d: number) =>
    new Date(now.getTime() - d * 86400000).toISOString();

  return [
    {
      id: generateId(),
      orderId: "ORD-4127",
      customerName: "Adebayo Johnson",
      customerPhone: "+234 801 234 5678",
      deliveryAddress: "45 Admiralty Way, Lekki Phase 1, Lagos",
      status: "IN_TRANSIT",
      riderName: "Kareem Musa",
      riderPhone: "+234 805 987 6543",
      riderVehicle: "Bike",
      estimatedMinutes: 25,
      amount: 12500,
      createdAt: hoursAgo(4),
      updatedAt: minutesAgo(12),
      acceptedAt: hoursAgo(3),
      preparingAt: hoursAgo(2.5),
      readyAt: hoursAgo(1.5),
      pickedUpAt: hoursAgo(1),
      inTransitAt: minutesAgo(30),
      items: ["Wireless Earbuds", "Phone Case"],
      pickupAddress: "12 Toyin Street, Ikeja, Lagos",
    },
    {
      id: generateId(),
      orderId: "ORD-4125",
      customerName: "Chidinma Okafor",
      customerPhone: "+234 802 345 6789",
      deliveryAddress: "12 Ozumba Mbadiwe Ave, Victoria Island, Lagos",
      status: "PREPARING",
      riderName: null,
      riderPhone: null,
      estimatedMinutes: null,
      amount: 8750,
      createdAt: hoursAgo(1.5),
      updatedAt: minutesAgo(20),
      acceptedAt: hoursAgo(1),
      preparingAt: minutesAgo(45),
      items: ["Ankara Fabric (5 yards)", "Matching Headtie"],
    },
    {
      id: generateId(),
      orderId: "ORD-4120",
      customerName: "Emeka Nwankwo",
      customerPhone: "+234 803 456 7890",
      deliveryAddress: "27 Allen Avenue, Ikeja, Lagos",
      status: "READY_FOR_PICKUP",
      riderName: "Sule Danjuma",
      riderPhone: "+234 806 789 0123",
      riderVehicle: "Bike",
      estimatedMinutes: 40,
      amount: 15000,
      createdAt: hoursAgo(3),
      updatedAt: minutesAgo(30),
      acceptedAt: hoursAgo(2.5),
      preparingAt: hoursAgo(2),
      readyAt: minutesAgo(45),
      items: ["Samsung Galaxy S24 Case", "Screen Protector x2", "Charging Cable"],
    },
    {
      id: generateId(),
      orderId: "ORD-4118",
      customerName: "Fatima Bello",
      customerPhone: "+234 804 567 8901",
      deliveryAddress: "8 Wuse 2, Abuja",
      status: "ARRIVED",
      riderName: "Bashir Aliyu",
      riderPhone: "+234 807 890 1234",
      riderVehicle: "Bike",
      estimatedMinutes: 5,
      amount: 6200,
      createdAt: hoursAgo(6),
      updatedAt: minutesAgo(8),
      acceptedAt: hoursAgo(5),
      preparingAt: hoursAgo(4),
      readyAt: hoursAgo(3),
      pickedUpAt: hoursAgo(2.5),
      inTransitAt: hoursAgo(2),
      arrivedAt: minutesAgo(10),
      items: ["Perfume Oil (3 pack)"],
    },
    {
      id: generateId(),
      orderId: "ORD-4105",
      customerName: "Ibrahim Yusuf",
      customerPhone: "+234 805 678 9012",
      deliveryAddress: "14 Ahmadu Bello Way, Kaduna",
      status: "DELIVERED",
      riderName: "Tunde Bakare",
      riderPhone: "+234 808 901 2345",
      riderVehicle: "Tricycle",
      estimatedMinutes: null,
      amount: 22100,
      createdAt: daysAgo(1),
      updatedAt: hoursAgo(8),
      acceptedAt: daysAgo(1),
      preparingAt: hoursAgo(20),
      readyAt: hoursAgo(16),
      pickedUpAt: hoursAgo(14),
      inTransitAt: hoursAgo(12),
      arrivedAt: hoursAgo(10),
      deliveredAt: hoursAgo(8),
      items: ["Portable Generator 3000W", "Engine Oil 5L"],
    },
    {
      id: generateId(),
      orderId: "ORD-4098",
      customerName: "Blessing Adeyemi",
      customerPhone: "+234 806 789 0123",
      deliveryAddress: "3 Oba Akran Ave, Ikeja, Lagos",
      status: "COMPLETED",
      riderName: "Kareem Musa",
      riderPhone: "+234 805 987 6543",
      riderVehicle: "Bike",
      estimatedMinutes: null,
      amount: 4300,
      createdAt: daysAgo(2),
      updatedAt: daysAgo(1),
      acceptedAt: daysAgo(2),
      preparingAt: daysAgo(1.8),
      readyAt: daysAgo(1.5),
      pickedUpAt: daysAgo(1.4),
      inTransitAt: daysAgo(1.3),
      arrivedAt: daysAgo(1.2),
      deliveredAt: daysAgo(1.1),
      completedAt: daysAgo(1),
      items: ["Blender (900W)"],
    },
    {
      id: generateId(),
      orderId: "ORD-4085",
      customerName: "Chinedu Obi",
      customerPhone: "+234 807 890 1234",
      deliveryAddress: "21 Akin Adesola St, Victoria Island, Lagos",
      status: "CANCELLED",
      riderName: null,
      riderPhone: null,
      estimatedMinutes: null,
      amount: 18900,
      createdAt: daysAgo(3),
      updatedAt: daysAgo(2),
      cancelledAt: daysAgo(2),
      items: ["Office Desk Chair", "Desk Lamp"],
    },
    {
      id: generateId(),
      orderId: "ORD-4070",
      customerName: "Amara Eze",
      customerPhone: "+234 808 901 2345",
      deliveryAddress: "9 Bank Anthony Way, Ikeja, Lagos",
      status: "PICKED_UP",
      riderName: "Sule Danjuma",
      riderPhone: "+234 806 789 0123",
      riderVehicle: "Bike",
      estimatedMinutes: 35,
      amount: 7550,
      createdAt: hoursAgo(5),
      updatedAt: minutesAgo(25),
      acceptedAt: hoursAgo(4),
      preparingAt: hoursAgo(3),
      readyAt: hoursAgo(2),
      pickedUpAt: minutesAgo(35),
      items: ["Women's Handbag", "Wallet"],
    },
  ];
}

function loadDeliveries(): DeliveryItem[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DELIVERIES_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveDeliveries(deliveries: DeliveryItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DELIVERIES_KEY, JSON.stringify(deliveries));
}

// ==================== Sub-Components ====================

function TimelineDots({ status }: { status: DeliveryStatus }) {
  const activeIdx = getTimelineStageIndex(status);

  return (
    <div className="flex items-center gap-1">
      {TIMELINE_STAGES.map((stage, idx) => {
        const isActive = idx <= activeIdx;
        const isLast = idx === TIMELINE_STAGES.length - 1;
        return (
          <React.Fragment key={stage.key}>
            <div className="flex flex-col items-center">
              <div
                className={`flex h-3 w-3 items-center justify-center rounded-full border-2 ${
                  isActive
                    ? "border-foreground bg-foreground"
                    : "border-kwik-border bg-surface"
                }`}
              >
                {isActive && (
                  <div className="h-1 w-1 rounded-full bg-surface" />
                )}
              </div>
              <span
                className={`mt-1 hidden text-[9px] leading-tight lg:block ${
                  isActive ? "text-foreground font-medium" : "text-muted-foreground"
                }`}
              >
                {stage.label.split(" ")[0]}
              </span>
            </div>
            {!isLast && (
              <div
                className={`h-0.5 w-4 lg:w-6 ${
                  idx < activeIdx ? "bg-foreground" : "bg-default-100"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function DetailTimeline({ delivery }: { delivery: DeliveryItem }) {
  const entries: Array<{ key: string; label: string; time?: string; color: string }> = [];

  const push = (key: string, label: string, time?: string, color = "text-muted-foreground") => {
    if (time) entries.push({ key, label, time, color });
  };

  push("created", "Order created", delivery.createdAt, "text-muted-foreground");
  push("accepted", "Accepted by vendor", delivery.acceptedAt, "text-muted-foreground");
  push("preparing", "Preparing order", delivery.preparingAt, "text-amber-600");
  push("ready", "Ready for pickup", delivery.readyAt, "text-orange-600");
  push("picked_up", "Picked up by rider", delivery.pickedUpAt, "text-blue-600");
  push("in_transit", "In transit", delivery.inTransitAt, "text-blue-600");
  push("arrived", "Arrived at destination", delivery.arrivedAt, "text-purple-600");
  push("delivered", "Delivered", delivery.deliveredAt, "text-green-600");
  push("completed", "Completed", delivery.completedAt, "text-green-700");
  if (delivery.cancelledAt) push("cancelled", "Cancelled", delivery.cancelledAt, "text-red-500");
  if (delivery.returnedAt) push("returned", "Returned", delivery.returnedAt, "text-red-400");

  if (entries.length === 0) return null;

  return (
    <div className="relative pl-6">
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-default-100" />
      <div className="space-y-4">
        {entries.map((entry) => (
          <div key={entry.key} className="relative flex items-start gap-3">
            <div className="absolute -left-6 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-kwik-border bg-surface" />
            <div className="min-w-0">
              <p className="text-sm text-foreground">{entry.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{getRelativeTime(entry.time!)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== Main Component ====================

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = React.useState<DeliveryItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [dateRange, setDateRange] = React.useState<DateRange>("month");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // ==================== Data Loading ====================

  React.useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Try deliveriesApi first (may not exist yet)
        const apiClient = await import("@/lib/api-client");
        const deliveriesApi = (apiClient as Record<string, unknown>).deliveriesApi as {
          list: () => Promise<{ data: unknown }>;
        } | undefined;

        if (deliveriesApi?.list) {
          const response = await deliveriesApi.list();
          const data = unwrapApiData<DeliveryItem[]>(response.data);
          if (Array.isArray(data) && data.length > 0) {
            setDeliveries(data);
            setIsLoading(false);
            return;
          }
        }

        // Fallback to localStorage
        const saved = loadDeliveries();
        if (saved && saved.length > 0) {
          setDeliveries(saved);
        } else {
          // Fallback to demo data
          setDeliveries(createDemoDeliveries());
        }
      } catch {
        // Fallback to localStorage or demo data
        const saved = loadDeliveries();
        setDeliveries(saved || createDemoDeliveries());
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Persist deliveries when they change
  React.useEffect(() => {
    if (deliveries.length > 0 && !isLoading) {
      saveDeliveries(deliveries);
    }
  }, [deliveries, isLoading]);

  // ==================== Derived State ====================

  const activeDeliveries = React.useMemo(() => {
    return deliveries.filter((d) => !isTerminalStatus(d.status));
  }, [deliveries]);

  const completedDeliveries = React.useMemo(() => {
    return deliveries.filter((d) => isTerminalStatus(d.status));
  }, [deliveries]);

  const displayedDeliveries = React.useMemo(() => {
    const isFilteringTerminal =
      statusFilter === "DELIVERED" || statusFilter === "COMPLETED";

    let list = isFilteringTerminal ? completedDeliveries : activeDeliveries;

    // Filter by status
    if (statusFilter !== "ALL") {
      if (statusFilter === "DELIVERED") {
        list = list.filter((d) => d.status === "DELIVERED");
      } else if (statusFilter === "COMPLETED") {
        list = list.filter((d) => d.status === "COMPLETED");
      } else {
        list = list.filter((d) => d.status === statusFilter);
      }
    }

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (d) =>
          d.orderId.toLowerCase().includes(q) ||
          d.customerName.toLowerCase().includes(q) ||
          d.deliveryAddress.toLowerCase().includes(q) ||
          (d.riderName && d.riderName.toLowerCase().includes(q))
      );
    }

    return list;
  }, [activeDeliveries, completedDeliveries, statusFilter, searchQuery]);

  // Stats
  const todayDeliveredCount = React.useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return deliveries.filter(
      (d) =>
        (d.status === "DELIVERED" || d.status === "COMPLETED") &&
        d.deliveredAt &&
        new Date(d.deliveredAt) >= todayStart
    ).length;
  }, [deliveries]);

  const avgDeliveryMinutes = React.useMemo(() => {
    const completed = deliveries.filter(
      (d) => d.acceptedAt && d.deliveredAt
    );
    if (completed.length === 0) return null;
    const totalMinutes = completed.reduce((sum, d) => {
      return sum + (new Date(d.deliveredAt!).getTime() - new Date(d.acceptedAt!).getTime()) / 60000;
    }, 0);
    const avg = Math.round(totalMinutes / completed.length);
    if (avg < 60) return `${avg}m`;
    if (avg < 1440) return `${Math.round(avg / 60)}h`;
    return `${Math.round(avg / 1440)}d`;
  }, [deliveries]);

  // ==================== Action Handlers ====================

  const handleMarkReady = (id: string) => {
    setDeliveries((prev) =>
      prev.map((d) => {
        if (d.id !== id || d.status !== "PREPARING") return d;
        kwikToast.success("Order marked as ready for pickup: " + d.orderId);
        return {
          ...d,
          status: "READY_FOR_PICKUP" as DeliveryStatus,
          readyAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const handleConfirmPickup = (id: string) => {
    setDeliveries((prev) =>
      prev.map((d) => {
        if (d.id !== id || d.status !== "READY_FOR_PICKUP") return d;
        kwikToast.success("Handoff confirmed: " + d.orderId);
        return {
          ...d,
          status: "PICKED_UP" as DeliveryStatus,
          pickedUpAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const toggleExpanded = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // ==================== Filter Options ====================

  const dateRanges: { key: DateRange; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
  ];

  const statusFilterOptions: { value: StatusFilter; label: string }[] = [
    { value: "ALL", label: "All Statuses" },
    { value: "PREPARING", label: "Preparing" },
    { value: "READY_FOR_PICKUP", label: "Ready for Pickup" },
    { value: "PICKED_UP", label: "Picked Up" },
    { value: "IN_TRANSIT", label: "In Transit" },
    { value: "ARRIVED", label: "Arrived" },
    { value: "DELIVERED", label: "Delivered" },
    { value: "COMPLETED", label: "Completed" },
  ];

  // ==================== Render ====================

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* ==================== Section 1: Page Header ==================== */}
      <VendorPageHeader
        title="Deliveries"
        description="Track and manage all your outgoing deliveries."
      />

      {/* ==================== Section 1b: Filters ==================== */}
      <section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Date range pills */}
          <div className="flex gap-1">
            {dateRanges.map((range) => (
              <button
                key={range.key}
                type="button"
                onClick={() => setDateRange(range.key)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  dateRange === range.key
                    ? "bg-foreground text-background"
                    : "border border-kwik-border text-muted-foreground hover:border-accent hover:text-accent"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          {/* Search + Status filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
              <input
                type="text"
                placeholder="Search orders, customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-kwik-border bg-transparent py-1.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none sm:w-56"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
              )}
            </div>
            <FieldSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="h-[34px]"
              wrapperClassName="mb-0"
            >
              {statusFilterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </FieldSelect>
          </div>
        </div>
      </section>

      {/* ==================== Section 2: Stats Row ==================== */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-0 divide-y border-kwik-border border-b border-kwik-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-4 py-3">
              <Skeleton className="mb-1 h-3 w-28" />
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-0 divide-y border-kwik-border border-b border-kwik-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Active Deliveries
            </p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {activeDeliveries.length}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Completed Today
            </p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {todayDeliveredCount}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Avg Delivery Time
            </p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {avgDeliveryMinutes ?? "—"}
            </p>
          </div>
        </div>
      )}

      {/* ==================== Section 3: Delivery Tabs ==================== */}
      {!isLoading && (
        <div className="flex items-center gap-1 overflow-x-auto border-b border-kwik-border">
          {VENDOR_RELEVANT_TABS.map((tab) => {
            const count =
              tab.key === "ALL"
                ? deliveries.length
                : tab.key === "DELIVERED"
                  ? deliveries.filter((d) => d.status === "DELIVERED").length
                  : tab.key === "COMPLETED"
                    ? deliveries.filter((d) => d.status === "COMPLETED").length
                    : deliveries.filter((d) => d.status === tab.key).length;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition ${
                  statusFilter === tab.key
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:border-kwik-border hover:text-foreground"
                }`}
              >
                {tab.label}
                <span
                  className={`text-xs ${
                    statusFilter === tab.key ? "text-muted-foreground" : "text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ==================== Section 4: Delivery List ==================== */}
      {isLoading ? (
        <section>
          <div className="border-b border-kwik-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-64" />
                    <Skeleton className="h-3 w-48" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : displayedDeliveries.length === 0 ? (
        <section>
          {statusFilter === "DELIVERED" || statusFilter === "COMPLETED" ? (
            <div className="flex flex-col items-center justify-center py-16">
              <CheckCircle className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />
              <p className="mt-3 text-sm font-medium text-muted-foreground">
                No completed deliveries yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {searchQuery
                  ? "No results match your current filters."
                  : "Completed deliveries will appear here."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <Truck className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />
              <p className="mt-3 text-sm font-medium text-muted-foreground">
                No active deliveries
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {searchQuery || statusFilter !== "ALL"
                  ? "No results match your current filters."
                  : "Active deliveries will appear here when orders are placed."}
              </p>
            </div>
          )}
        </section>
      ) : (
        <section>
          <div className="border-b border-kwik-border">
            {displayedDeliveries.map((d) => (
              <DeliveryRow
                key={d.id}
                delivery={d}
                isExpanded={expandedId === d.id}
                onToggle={() => toggleExpanded(d.id)}
                onMarkReady={handleMarkReady}
                onConfirmPickup={handleConfirmPickup}
              />
            ))}
          </div>
        </section>
      )}

      {/* Error state */}
      {error && (
        <section className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-10 w-10 text-red-400 dark:text-red-500" strokeWidth={1.5} />
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
          <AppButton
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() => window.location.reload()}
          >
            Try Again
          </AppButton>
        </section>
      )}
    </motion.div>
  );
}

// ==================== DeliveryRow Component ====================

function DeliveryRow({
  delivery,
  isExpanded,
  onToggle,
  onMarkReady,
  onConfirmPickup,
}: {
  delivery: DeliveryItem;
  isExpanded: boolean;
  onToggle: () => void;
  onMarkReady: (id: string) => void;
  onConfirmPickup: (id: string) => void;
}) {
  const isTerminal = isTerminalStatus(delivery.status);

  return (
    <div className="border-b border-kwik-border last:border-b-0">
      {/* Main row */}
      <div className="px-4 py-4 transition hover:bg-default-100/50">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          {/* Left: Main info */}
          <div className="min-w-0 flex-1">
            {/* Order ID + Status */}
            <div className="flex items-center gap-2">
              <a
                href={`/dashboard/orders/${delivery.orderId}`}
                className="font-mono text-sm font-medium text-foreground hover:underline"
              >
                {delivery.orderId}
              </a>
              <VendorStatusBadge status={delivery.status} size="sm" />
            </div>

            {/* Customer + Address */}
            <div className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
              <User className="mt-0.5 h-3 w-3 shrink-0" strokeWidth={1.5} />
              <span className="truncate">
                {delivery.customerName} &middot;{" "}
                {delivery.deliveryAddress.length > 50
                  ? delivery.deliveryAddress.slice(0, 50) + "..."
                  : delivery.deliveryAddress}
              </span>
            </div>

            {/* Rider info */}
            {delivery.riderName && (
              <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Bike className="h-3 w-3 shrink-0" strokeWidth={1.5} />
                <span>
                  {delivery.riderName}
                  {delivery.riderPhone && (
                    <>
                      {" "}
                      &middot;{" "}
                      <span className="font-mono">{delivery.riderPhone}</span>
                    </>
                  )}
                </span>
              </div>
            )}

            {/* Timeline dots */}
            <div className="mt-2.5">
              <TimelineDots status={delivery.status} />
            </div>

            {/* ETA */}
            {delivery.estimatedMinutes && !isTerminal && (
              <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" strokeWidth={1.5} />
                <span>ETA: ~{delivery.estimatedMinutes} min</span>
              </div>
            )}

            {/* Items preview */}
            {delivery.items && delivery.items.length > 0 && !isExpanded && (
              <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                <Package className="h-3 w-3 shrink-0" strokeWidth={1.5} />
                <span className="truncate">
                  {delivery.items.length > 2
                    ? `${delivery.items[0]}, ${delivery.items[1]} +${delivery.items.length - 2} more`
                    : delivery.items.join(", ")}
                </span>
              </div>
            )}
          </div>

          {/* Right: Amount + Actions */}
          <div className="flex items-start gap-3 sm:flex-col sm:items-end sm:gap-2">
            <p className="text-sm font-medium tabular-nums text-foreground">
              {formatCurrency(delivery.amount)}
            </p>

            {/* Contextual action buttons */}
            {delivery.status === "PREPARING" && (
              <AppButton
                variant="primary"
                size="sm"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onMarkReady(delivery.id);
                }}
              >
                Mark Ready
              </AppButton>
            )}

            {delivery.status === "READY_FOR_PICKUP" && (
              <AppButton
                variant="primary"
                size="sm"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onConfirmPickup(delivery.id);
                }}
              >
                Confirm Handoff
              </AppButton>
            )}

            {delivery.status === "IN_TRANSIT" && (
              <AppButton
                variant="secondary"
                size="sm"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onToggle();
                }}
              >
                <Eye className="h-3.5 w-3.5" />
                View Details
              </AppButton>
            )}

            {/* Expand/collapse button for non-terminal statuses */}
            {!isTerminal && delivery.status !== "IN_TRANSIT" && (
              <button
                type="button"
                onClick={onToggle}
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition hover:text-foreground"
              >
                {isExpanded ? (
                  <>
                    Less <ChevronUp className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </>
                ) : (
                  <>
                    More <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </>
                )}
              </button>
            )}

            {/* Delivered/Completed timestamp */}
            {isTerminal && delivery.deliveredAt && (
              <span className="text-[10px] text-muted-foreground">
                {formatDate(delivery.deliveredAt)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ==================== Expanded Detail Panel ==================== */}
      {isExpanded && (
        <div className="border-t border-kwik-border bg-default-100/50 px-4 py-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left: Timeline + Order summary */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Delivery Timeline
              </h3>
              <DetailTimeline delivery={delivery} />

              {/* Order Items */}
              {delivery.items && delivery.items.length > 0 && (
                <div className="border-t border-kwik-border pt-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                    Order Items
                  </h3>
                  <div className="space-y-1.5">
                    {delivery.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <Package className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                        <span className="text-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Rider + Addresses */}
            <div className="space-y-4">
              {/* Rider Info */}
              {delivery.riderName ? (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                    Rider Information
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-kwik-border bg-default-100">
                        <Bike className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {delivery.riderName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {delivery.riderVehicle || "Bike"} rider
                        </p>
                      </div>
                    </div>
                    {delivery.riderPhone && (
                      <a
                        href={`tel:${delivery.riderPhone}`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-kwik-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-accent"
                      >
                        <Phone className="h-3 w-3" strokeWidth={1.5} />
                        <span className="font-mono">{delivery.riderPhone}</span>
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                    Rider Information
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    No rider assigned yet. A rider will be assigned when the order is ready for pickup.
                  </p>
                </div>
              )}

              {/* Pickup Address */}
              {delivery.pickupAddress && (
                <div className="border-t border-kwik-border pt-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    Pickup Address
                  </h3>
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                    <p className="text-sm text-foreground">{delivery.pickupAddress}</p>
                  </div>
                </div>
              )}

              {/* Delivery Address */}
              <div className="border-t border-kwik-border pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Delivery Address
                </h3>
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                  <div>
                    <p className="text-sm text-foreground">{delivery.deliveryAddress}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {delivery.customerName} &middot;{" "}
                      <span className="font-mono">{delivery.customerPhone}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* ETA */}
              {delivery.estimatedMinutes && !isTerminalStatus(delivery.status) && (
                <div className="border-t border-kwik-border pt-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    Estimated Arrival
                  </h3>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                    <span className="text-sm font-medium text-foreground">
                      ~{delivery.estimatedMinutes} minutes
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom action bar for expanded panel */}
          <div className="mt-4 flex items-center justify-between border-t border-kwik-border pt-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" strokeWidth={1.5} />
              Updated {getRelativeTime(delivery.updatedAt)}
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`/dashboard/orders/${delivery.orderId}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition hover:text-foreground"
              >
                View Order <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
