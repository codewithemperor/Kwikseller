"use client";

import React, { Suspense, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronRight, PackageOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDeals, type Deal } from "@/lib/api-hooks";
import { DealCard, DealCardSkeleton } from "@/components/landing/shared/deal-card";

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

// ─── Helpers ────────────────────────────────────────────────────────────────

function isDealFilterValue(v: string | null): v is DealFilterValue {
  return v === "all" || v === "flash" || v === "deal_of_the_day" || v === "featured";
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

  const dealsQuery = useDeals();
  const allDeals: Deal[] = dealsQuery.data ?? [];
  const isLoading = dealsQuery.isLoading;
  const isError = dealsQuery.isError;

  const filteredDeals = useMemo(() => {
    if (activeFilter === "all") return allDeals;
    const chip = FILTER_CHIPS.find((c) => c.value === activeFilter);
    if (!chip) return allDeals;
    return allDeals.filter((d) => chip.matches(d.dealType));
  }, [allDeals, activeFilter]);

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

  const totalCount = allDeals.length;
  const filteredCount = filteredDeals.length;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header + breadcrumb ── */}
      <div className="border-b border-border bg-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1.5 py-3 text-xs text-muted-foreground" aria-label="Breadcrumb">
            <Link href="/" className="transition-colors hover:text-kwik-orange">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-foreground">Deals</span>
          </nav>

          <div className="pb-3">
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-xl font-bold text-foreground sm:text-2xl"
            >
              Deals
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="mt-1 text-sm text-muted-foreground"
            >
              Discover promotional campaigns and special offers
            </motion.p>
          </div>
        </div>
      </div>

      {/* ── Filter chips ── */}
      <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            className="flex flex-nowrap items-center gap-2 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="Filter deals by type"
          >
            {FILTER_CHIPS.map((chip) => {
              const active = activeFilter === chip.value;
              return (
                <button
                  key={chip.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => selectFilter(chip.value)}
                  className={cn(
                    "inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-colors",
                    active
                      ? "border-kwik-orange bg-kwik-orange text-white"
                      : "border-border bg-background text-foreground hover:bg-muted",
                  )}
                >
                  {chip.label}
                </button>
              );
            })}
            <Link
              href={GROUP_BUY_CHIP.href}
              role="tab"
              aria-selected={false}
              className="inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              {GROUP_BUY_CHIP.label}
            </Link>
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Meta line */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {isLoading ? (
              "Loading deals…"
            ) : isError ? (
              "Could not load deals."
            ) : (
              <>
                <span className="font-semibold text-foreground">{filteredCount}</span>{" "}
                deal{filteredCount !== 1 ? "s" : ""}
                {activeFilter !== "all" && (
                  <>
                    {" "}
                    in{" "}
                    <span className="text-kwik-orange">
                      {FILTER_CHIPS.find((c) => c.value === activeFilter)?.label}
                    </span>
                  </>
                )}
                {activeFilter === "all" && totalCount !== filteredCount && (
                  <> of {totalCount}</>
                )}
              </>
            )}
          </p>
        </div>

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
