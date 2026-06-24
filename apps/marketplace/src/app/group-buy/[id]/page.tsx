"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import React from "react";
import { ArrowLeft, Bell, CalendarDays, CheckCircle2, Clock3, PackageOpen, Users } from "lucide-react";
import { marketplaceApi } from "@kwikseller/api-client";
import { kwikToast } from "@kwikseller/utils";

type PoolCampaign = {
  id: string;
  title: string;
  targetQuantity: number;
  committedQuantity: number;
  unitPrice: number;
  status: string;
  startsAt?: string;
  endsAt?: string;
  poolProduct?: { name: string; description?: string };
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value?: string) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function unwrapApiData<T>(value: unknown): T {
  if (value && typeof value === "object" && "data" in value) {
    return (value as { data: T }).data;
  }
  return value as T;
}

function campaignSlug(campaign: PoolCampaign) {
  return campaign.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 72);
}

export default function GroupBuyDetailPage() {
  const params = useParams<{ id: string }>();
  const [campaign, setCampaign] = React.useState<PoolCampaign | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    async function loadCampaign() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await marketplaceApi.getPoolCampaigns({ limit: 100 });
        const campaigns = unwrapApiData<PoolCampaign[]>(response.data);
        const routeKey = decodeURIComponent(params.id);
        const match =
          campaigns.find(
            (item) =>
              item.id === routeKey ||
              routeKey === campaignSlug(item) ||
              routeKey.endsWith(`-${item.id}`),
          ) ?? null;
        if (mounted) {
          setCampaign(match);
          if (!match) setError("This group-buy campaign was not found.");
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Unable to load group buy");
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadCampaign();
    return () => {
      mounted = false;
    };
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="bg-background px-4 py-12">
        <div className="container mx-auto space-y-6">
          <div className="h-8 w-40 animate-pulse rounded-md bg-neutral-100 dark:bg-white/10" />
          <div className="h-96 animate-pulse rounded-md bg-neutral-100 dark:bg-white/10" />
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="bg-background px-4 py-20">
        <div className="container mx-auto max-w-xl text-center">
          <PackageOpen className="mx-auto h-10 w-10 text-kwik-orange" />
          <h1 className="mt-4 text-2xl font-semibold text-kwik-dark dark:text-white">Group buy unavailable</h1>
          <p className="mt-2 text-sm leading-6 text-kwik-muted dark:text-white/60">{error}</p>
          <Link
            href="/group-buy"
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-foreground px-5 text-sm font-semibold text-background"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to group buys
          </Link>
        </div>
      </div>
    );
  }

  const progress =
    campaign.targetQuantity > 0
      ? Math.min(100, Math.round((campaign.committedQuantity / campaign.targetQuantity) * 100))
      : 0;

  return (
    <div className="bg-background">
      <main className="container mx-auto px-4 py-10">
        <Link href="/group-buy" className="inline-flex items-center gap-2 text-sm font-semibold text-kwik-dark dark:text-white">
          <ArrowLeft className="h-4 w-4" />
          Group buys
        </Link>

        <section className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div>
            <p className="text-xs font-semibold uppercase text-kwik-blue">{campaign.status}</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight text-kwik-dark dark:text-white md:text-5xl">
              {campaign.title}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-kwik-muted dark:text-white/65 md:text-base">
              {campaign.poolProduct?.description ??
                campaign.poolProduct?.name ??
                "This campaign collects buyer commitments for a Pool-backed product. Subscribe now and follow the progress until the target is reached."}
            </p>

            <div className="mt-8 h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
              <div className="h-full rounded-full bg-kwik-blue" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-3 flex justify-between text-sm text-kwik-muted dark:text-white/60">
              <span>{campaign.committedQuantity} committed</span>
              <span>{campaign.targetQuantity} target</span>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { icon: Users, label: "Committed quantity", value: String(campaign.committedQuantity) },
                { icon: CheckCircle2, label: "Target quantity", value: String(campaign.targetQuantity) },
                { icon: Clock3, label: "Progress", value: `${progress}%` },
              ].map((item) => (
                <div key={item.label} className="border-b border-neutral-200 pb-4 dark:border-white/10">
                  <item.icon className="h-5 w-5 text-kwik-blue" />
                  <p className="mt-3 text-2xl font-semibold text-kwik-dark dark:text-white">{item.value}</p>
                  <p className="text-xs text-kwik-muted dark:text-white/55">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="bg-kwik-blue p-6 text-white">
            <p className="text-sm text-white/70">Campaign unit price</p>
            <p className="mt-2 text-3xl font-semibold">{formatCurrency(campaign.unitPrice)}</p>

            <div className="mt-6 space-y-4 border-t border-white/15 pt-5">
              <div className="flex gap-3">
                <CalendarDays className="mt-0.5 h-4 w-4 text-white/70" />
                <div>
                  <p className="text-sm font-semibold">Starts</p>
                  <p className="text-xs text-white/65">{formatDate(campaign.startsAt)}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Clock3 className="mt-0.5 h-4 w-4 text-white/70" />
                <div>
                  <p className="text-sm font-semibold">Ends</p>
                  <p className="text-xs text-white/65">{formatDate(campaign.endsAt)}</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => kwikToast.success("You will be notified when buyer commitments open.")}
              className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-semibold text-kwik-blue"
            >
              <Bell className="h-4 w-4" />
              Subscribe to campaign
            </button>
          </aside>
        </section>
      </main>
    </div>
  );
}
