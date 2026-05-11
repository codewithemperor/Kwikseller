"use client";

import Link from "next/link";
import React from "react";
import { ArrowRight, Bell, Clock3, PackageOpen, Users } from "lucide-react";
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

function unwrapApiData<T>(value: unknown): T {
  if (value && typeof value === "object" && "data" in value) {
    return (value as { data: T }).data;
  }
  return value as T;
}

function campaignHref(campaign: PoolCampaign) {
  const slug = campaign.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 72);
  return `/group-buy/${slug || "campaign"}-${campaign.id}`;
}

export default function GroupBuyPage() {
  const [campaigns, setCampaigns] = React.useState<PoolCampaign[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    async function loadCampaigns() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await marketplaceApi.getPoolCampaigns({ limit: 24 });
        if (mounted) setCampaigns(unwrapApiData<PoolCampaign[]>(response.data));
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Unable to load group buys");
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadCampaigns();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="bg-white dark:bg-[#07111f]">
      <section className="border-b border-neutral-200 bg-[#0b4aa2] px-4 py-12 text-white dark:border-white/10">
        <div className="container mx-auto grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <h1 className="text-3xl font-semibold md:text-5xl">Group-buy campaigns</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75 md:text-base">
              Join buyer commitments for Pool-backed campaigns. When a campaign reaches target quantity, the group unlocks better pricing.
            </p>
          </div>
          <button
            type="button"
            onClick={() => kwikToast.success("You will be notified when group-buy subscriptions open.")}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-semibold text-[#0b4aa2]"
          >
            <Bell className="h-4 w-4" />
            Subscribe for updates
          </button>
        </div>
      </section>

      <main className="container mx-auto px-4 py-10">
        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="h-56 animate-pulse rounded-md bg-neutral-100 dark:bg-white/10" />
            ))}
          </div>
        ) : error ? (
          <div className="mx-auto max-w-xl py-14 text-center">
            <PackageOpen className="mx-auto h-10 w-10 text-kwik-orange" />
            <h2 className="mt-4 text-xl font-semibold text-kwik-dark dark:text-white">Group buys could not load</h2>
            <p className="mt-2 text-sm leading-6 text-kwik-muted dark:text-white/60">{error}</p>
          </div>
        ) : campaigns.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {campaigns.map((campaign) => {
              const progress =
                campaign.targetQuantity > 0
                  ? Math.min(100, Math.round((campaign.committedQuantity / campaign.targetQuantity) * 100))
                  : 0;

              return (
                <Link
                  key={campaign.id}
                  href={campaignHref(campaign)}
                  className="border border-neutral-200 bg-white p-5 transition hover:border-[#0b4aa2] dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase text-[#0b4aa2] dark:text-cyan-200">{campaign.status}</p>
                      <h2 className="mt-2 line-clamp-2 text-lg font-semibold text-kwik-dark dark:text-white">{campaign.title}</h2>
                      <p className="mt-1 line-clamp-2 text-sm text-kwik-muted dark:text-white/60">
                        {campaign.poolProduct?.name ?? campaign.poolProduct?.description ?? "Pool-backed group-buy campaign"}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 shrink-0 text-kwik-muted dark:text-white/50" />
                  </div>

                  <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
                    <div className="h-full rounded-full bg-[#0b4aa2]" style={{ width: `${progress}%` }} />
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="font-semibold text-kwik-dark dark:text-white">{campaign.committedQuantity}</p>
                      <p className="text-xs text-kwik-muted dark:text-white/50">Committed</p>
                    </div>
                    <div>
                      <p className="font-semibold text-kwik-dark dark:text-white">{campaign.targetQuantity}</p>
                      <p className="text-xs text-kwik-muted dark:text-white/50">Target</p>
                    </div>
                    <div>
                      <p className="font-semibold text-kwik-dark dark:text-white">{formatCurrency(campaign.unitPrice)}</p>
                      <p className="text-xs text-kwik-muted dark:text-white/50">Unit price</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="mx-auto max-w-xl py-14 text-center">
            <Clock3 className="mx-auto h-10 w-10 text-[#0b4aa2]" />
            <h2 className="mt-4 text-xl font-semibold text-kwik-dark dark:text-white">No campaigns yet</h2>
            <p className="mt-2 text-sm leading-6 text-kwik-muted dark:text-white/60">
              Admin-created group-buy campaigns will show here as soon as they are scheduled.
            </p>
          </div>
        )}

        <section className="mt-12 border-t border-neutral-200 pt-8 dark:border-white/10">
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { icon: Users, title: "Commit together", text: "Buyers join demand until the campaign target is reached." },
              { icon: Clock3, title: "Track progress", text: "Each campaign shows target quantity, committed quantity, and status." },
              { icon: Bell, title: "Subscribe", text: "Get notified when group-buy participation opens fully." },
            ].map((item) => (
              <div key={item.title} className="border-b border-neutral-200 pb-4 dark:border-white/10">
                <item.icon className="h-5 w-5 text-[#0b4aa2] dark:text-cyan-200" />
                <h3 className="mt-3 text-sm font-semibold text-kwik-dark dark:text-white">{item.title}</h3>
                <p className="mt-1 text-sm leading-6 text-kwik-muted dark:text-white/60">{item.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
