"use client";

import React from "react";
import { Copy, ExternalLink } from "lucide-react";
import { useAuthStore, kwikToast } from "@kwikseller/utils";

function storeSlug(name?: string, slug?: string) {
  if (slug?.trim()) return slug.trim();
  return (name || "store")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function marketplaceBaseUrl() {
  return (process.env.NEXT_PUBLIC_MARKETPLACE_URL || "https://kwikseller-marketplace.vercel.app/").replace(/\/+$/, "");
}

export function StorePublicUrlCard() {
  const { user } = useAuthStore();
  const store = user?.store;
  const slug = storeSlug(store?.name, store?.slug);
  const url = `${marketplaceBaseUrl()}/vendor/${slug}`;

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      kwikToast.success("Store URL copied successfully");
    } catch {
      kwikToast.error("Could not copy store URL");
    }
  };

  return (
    <section className="w-full max-w-full overflow-hidden rounded-[22px] border border-border bg-background p-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Public store URL</p>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 block max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-mono text-sm font-semibold text-foreground transition hover:text-accent"
          >
            {url}
          </a>
        </div>
        <div className="flex shrink-0 gap-2">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-white text-foreground transition hover:border-accent hover:text-accent dark:bg-white/5"
            aria-label="Open public store"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={copyUrl}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-accent-foreground transition hover:brightness-105"
            aria-label="Copy public store URL"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
