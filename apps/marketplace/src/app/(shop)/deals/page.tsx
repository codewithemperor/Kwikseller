"use client";

import React, { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button, Checkbox, Drawer } from "@heroui/react";
import { PackageOpen, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDeals, type Deal } from "@/lib/api-hooks";
import { DealCard, DealCardSkeleton } from "@/components/landing/shared/deal-card";
import { ProductListingToolbar } from "@/components/product/product-listing-toolbar";
import { useHeaderSearch } from "@/components/layout/marketplace-shell-context";

// ─── Filter chips ───────────────────────────────────────────────────────────
//
// The first four chips filter the `useDeals()` result client-side by
// `dealType`. "Group Buy" is a separate entity (PoolCampaign, not a Deal), so
// it links out to /group-buy instead of filtering.
//
// Canonical values are lowercase so the URL stays clean (?dealType=flash).
// The matcher accepts both dummy (`FLASH`) and real-backend (`FLASH_DEAL`)
// spellings.

type DealFilterValue = "all" | "flash" | "deal_of_the_day" | "featured";

interface FilterChipDef {
  value: DealFilterValue;
  label: string;
  matches: (dealType: string) => boolean;
  href?: string; // when set, the chip navigates instead of filtering
}

const FILTER_CHIPS: FilterChipDef[] = [
  {
    value: "all",
    label: "All Deals",
    matches: () => true,
  },
  {
    value: "flash",
    label: "Flash Deals",
    matches: (t) => t === "FLASH" || t === "FLASH_DEAL",
  },
  {
    value: "deal_of_the_day",
    label: "Deals of the Day",
    matches: (t) => t === "DEAL_OF_THE_DAY",
  },
  {
    value: "featured",
    label: "Featured",
    matches: (t) => t === "FEATURED" || t === "FEATURED_DEAL",
  },
];

const GROUP_BUY_CHIP = { label: "Group Buy", href: "/group-buy" };

type DealSortValue = "newest" | "ending-soon" | "discount-high";

const DEAL_SORT_OPTIONS: { value: DealSortValue; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "ending-soon", label: "Ending Soon" },
  { value: "discount-high", label: "Biggest Discount" },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function isDealFilterValue(v: string | null): v is DealFilterValue {
  return v === "all" || v === "flash" || v === "deal_of_the_day" || v === "featured";
}

function dealMatchesQuery(deal: Deal, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [deal.title, deal.description, deal.dealType, deal.discountType].some(
    (value) => value?.toLowerCase().includes(needle),
  );
}

function sortDeals(a: Deal, b: Deal, sortBy: DealSortValue): number {
  switch (sortBy) {
    case "ending-soon": {
      const aTime = a.endDate ? new Date(a.endDate).getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.endDate ? new Date(b.endDate).getTime() : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    }
    case "discount-high":
      return b.discountValue - a.discountValue;
    case "newest":
    default:
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
  }
}

function DealFiltersPanel({
  activeFilter,
  onSelect,
  showHeader = true,
}: {
  activeFilter: DealFilterValue;
  onSelect: (value: DealFilterValue) => void;
  showHeader?: boolean;
}) {
  return (
    <div className="flex flex-col">
      {showHeader ? (
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-kwik-orange" />
            <h2 className="text-sm font-semibold text-foreground">Filters</h2>
          </div>
        </div>
      ) : null}

      <div className="border-b border-border py-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Deal type</h3>
        <div className="space-y-1">
          {FILTER_CHIPS.map((chip) => {
            const active = activeFilter === chip.value;
            return (
              <Checkbox
                key={chip.value}
                isSelected={active}
                onChange={() => onSelect(active ? "all" : chip.value)}
                className={cn(
                  "group flex w-full rounded-lg px-2.5 py-2 text-sm transition-colors",
                  active
                    ? "bg-kwik-orange-tint font-semibold text-kwik-orange"
                    : "text-foreground hover:bg-muted",
                )}
              >
                <Checkbox.Content className="!flex !flex-row !items-center !gap-2">
                  <Checkbox.Control className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-border bg-background text-accent-foreground shadow-none transition-colors group-data-[selected=true]:border-accent group-data-[selected=true]:bg-accent dark:border-white/20">
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <span className="min-w-0 flex-1 truncate">{chip.label}</span>
                </Checkbox.Content>
              </Checkbox>
            );
          })}
        </div>
      </div>

      <Link
        href={GROUP_BUY_CHIP.href}
        className="mt-4 inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
      >
        {GROUP_BUY_CHIP.label}
      </Link>
    </div>
  );
}

// ─── Page content (uses useSearchParams → must be inside <Suspense>) ────────

function DealsListingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Single source of truth = the URL search param. Clicking a chip calls
  // `router.replace` to update ?dealType, which re-renders this component
  // with the new derived value — no local state mirror needed (avoids the
  // "setState in effect" cascading-render lint rule).
  const queryDealType = searchParams.get("dealType");
  const activeFilter: DealFilterValue = isDealFilterValue(queryDealType) ? queryDealType : "all";
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") ?? "");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [sortBy, setSortBy] = useState<DealSortValue>("newest");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const dealsQuery = useDeals();
  const allDeals: Deal[] = dealsQuery.data ?? [];
  const isLoading = dealsQuery.isLoading;
  const isError = dealsQuery.isError;

  React.useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedSearchQuery(searchQuery.trim()),
      300,
    );
    return () => window.clearTimeout(timeout);
  }, [searchQuery]);

  const filteredDeals = useMemo(() => {
    let list = allDeals.filter((deal) =>
      dealMatchesQuery(deal, debouncedSearchQuery),
    );
    if (activeFilter === "all") {
      return list.sort((a, b) => sortDeals(a, b, sortBy));
    }
    const chip = FILTER_CHIPS.find((c) => c.value === activeFilter);
    if (chip) {
      list = list.filter((d) => chip.matches(d.dealType));
    }
    return list.sort((a, b) => sortDeals(a, b, sortBy));
  }, [allDeals, activeFilter, debouncedSearchQuery, sortBy]);

  function selectFilter(value: DealFilterValue) {
    // Reflect the selection in the URL (shareable / bookmarkable). The
    // component re-renders with the new derived `activeFilter` from
    // `useSearchParams()` — no local state to update.
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("dealType");
    } else {
      params.set("dealType", value);
    }
    const qs = params.toString();
    router.replace(qs ? `/deals?${qs}` : "/deals", { scroll: false });
  }

  const filteredCount = filteredDeals.length;
  const headerSearchConfig = useMemo(
    () => ({
      value: searchQuery,
      onChange: setSearchQuery,
      placeholder: "Search deals...",
      onToggleFilters: () => setMobileFiltersOpen(true),
      showFilters: mobileFiltersOpen,
      activeFilterCount: activeFilter === "all" ? 0 : 1,
    }),
    [activeFilter, mobileFiltersOpen, searchQuery],
  );

  useHeaderSearch(headerSearchConfig);

  return (
    <div className="min-h-screen bg-background">
      <ProductListingToolbar
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Deals" },
        ]}
        sortControl={
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as DealSortValue)}
            aria-label="Sort deals"
            className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground outline-none transition-colors hover:border-kwik-orange/50 focus:border-kwik-orange focus:ring-2 focus:ring-kwik-orange/15"
          >
            {DEAL_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        }
      />

      {/* ── Grid ── */}
      <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex gap-6">
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-[calc(var(--header-height)+6rem)] rounded-2xl border border-border bg-background p-4">
              <DealFiltersPanel activeFilter={activeFilter} onSelect={selectFilter} />
            </div>
          </aside>

          <div className="min-w-0 flex-1">
        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <DealCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error */}
        {!isLoading && isError && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <PackageOpen className="h-7 w-7 text-muted-foreground" />
            </div>
            <h2 className="mt-5 text-lg font-semibold text-foreground">
              Deals could not load
            </h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Something went wrong while fetching deals. Please try again later.
            </p>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && filteredCount === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <PackageOpen className="h-7 w-7 text-muted-foreground" />
            </div>
            <h2 className="mt-5 text-lg font-semibold text-foreground">No active deals</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              {activeFilter === "all"
                ? "There are no promotional campaigns running right now. Check back soon for new offers."
                : `No ${FILTER_CHIPS.find((c) => c.value === activeFilter)?.label.toLowerCase()} are running right now.`}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/products"
                className="inline-flex h-11 items-center justify-center rounded-md bg-kwik-orange px-5 text-sm font-semibold text-white transition-colors hover:bg-kwik-orange-hover"
              >
                Browse products
              </Link>
              {activeFilter !== "all" && (
                <button
                  type="button"
                  onClick={() => selectFilter("all")}
                  className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  View all deals
                </button>
              )}
            </div>
          </div>
        )}

        {/* Grid */}
        {!isLoading && !isError && filteredCount > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.04 } },
            }}
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
          >
            {filteredDeals.map((deal, index) => (
              <motion.div
                key={`${deal.id}-${index}`}
                variants={{
                  hidden: { opacity: 0, y: 14 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.3, ease: "easeOut" },
                  },
                }}
              >
                <DealCard deal={deal} />
              </motion.div>
            ))}
          </motion.div>
        )}
          </div>
        </div>
      </div>

      <DealFilterDrawer
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        activeFilter={activeFilter}
        onApply={selectFilter}
      />
    </div>
  );
}

function DealFilterDrawer({
  open,
  onClose,
  activeFilter,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  activeFilter: DealFilterValue;
  onApply: (value: DealFilterValue) => void;
}) {
  const [draftFilter, setDraftFilter] = useState<DealFilterValue>(activeFilter);

  React.useEffect(() => {
    if (open) setDraftFilter(activeFilter);
  }, [activeFilter, open]);

  return (
    <Drawer.Backdrop isOpen={open} onOpenChange={(next) => !next && onClose()} variant="blur">
      <Drawer.Content placement="right" className="lg:hidden">
        <Drawer.Dialog className="flex h-full flex-col border-l border-border bg-background">
          <Drawer.CloseTrigger />
          <Drawer.Header>
            <Drawer.Heading>Filters</Drawer.Heading>
          </Drawer.Header>
          <Drawer.Body className="flex-1 overflow-y-auto">
            <DealFiltersPanel activeFilter={draftFilter} onSelect={setDraftFilter} showHeader={false} />
          </Drawer.Body>
          <Drawer.Footer className="shrink-0 gap-2 border-t border-border bg-background">
            <Button
              slot="close"
              variant="secondary"
              onPress={() => {
                onApply("all");
                onClose();
              }}
            >
              Clear all
            </Button>
            <Button
              slot="close"
              variant="primary"
              onPress={() => {
                onApply(draftFilter);
                onClose();
              }}
            >
              Apply filters
            </Button>
          </Drawer.Footer>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}

export default function DealsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {Array.from({ length: 10 }).map((_, i) => (
                <DealCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <DealsListingContent />
    </Suspense>
  );
}
