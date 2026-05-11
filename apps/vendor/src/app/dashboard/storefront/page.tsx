"use client";

import React from "react";
import { Eye, Palette, Save, Store } from "lucide-react";
import { vendorCommerceApi } from "@kwikseller/api-client";
import type { StorefrontDesignConfig } from "@kwikseller/types";
import { kwikToast } from "@kwikseller/utils";
import { unwrapApiData } from "@/lib/vendor-format";

const defaultDesign: StorefrontDesignConfig = {
  themePreset: "CLASSIC",
  primaryColor: "#071A2F",
  accentColor: "#F97316",
  fontPairing: "FIGTREE_QUESTRIAL",
  heroLayout: "BANNER_LEFT",
  productCardStyle: "CLEAN_GRID",
  sections: ["hero", "products", "pool", "policies"],
  heroTitle: "",
  heroSubtitle: "",
};

const presets = [
  { label: "Classic", value: "CLASSIC", primary: "#071A2F", accent: "#F97316" },
  { label: "Fresh", value: "FRESH", primary: "#064E3B", accent: "#14B8A6" },
  { label: "Bold", value: "BOLD", primary: "#111827", accent: "#2563EB" },
];

const sections = [
  { key: "hero", label: "Hero" },
  { key: "products", label: "Products" },
  { key: "pool", label: "Pool resale" },
  { key: "policies", label: "Policies" },
  { key: "trust", label: "Trust signals" },
];

export default function StorefrontDesignerPage() {
  const [design, setDesign] = React.useState<StorefrontDesignConfig>(defaultDesign);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    vendorCommerceApi
      .getStorefrontDesign()
      .then((response) => setDesign({ ...defaultDesign, ...unwrapApiData<StorefrontDesignConfig>(response.data) }))
      .catch(() => kwikToast.error("Could not load storefront design"))
      .finally(() => setIsLoading(false));
  }, []);

  const update = <K extends keyof StorefrontDesignConfig>(key: K, value: StorefrontDesignConfig[K]) => {
    setDesign((current) => ({ ...current, [key]: value }));
  };

  const toggleSection = (section: string) => {
    setDesign((current) => ({
      ...current,
      sections: current.sections.includes(section)
        ? current.sections.filter((item) => item !== section)
        : [...current.sections, section],
    }));
  };

  const saveDesign = async () => {
    setIsSaving(true);
    try {
      const response = await vendorCommerceApi.updateStorefrontDesign(design);
      setDesign({ ...defaultDesign, ...unwrapApiData<StorefrontDesignConfig>(response.data) });
      kwikToast.success("Storefront design saved");
    } catch (error) {
      kwikToast.error(error instanceof Error ? error.message : "Could not save storefront design");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Storefront Designer</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Configure safe storefront presets for your public Marketplace store. Full drag and drop comes later.
          </p>
        </div>
        <button
          type="button"
          onClick={saveDesign}
          disabled={isSaving || isLoading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save design"}
        </button>
      </section>

      <section className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="space-y-4 border border-border bg-background p-5">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-base font-semibold">Theme presets</h2>
          </div>

          <div className="grid gap-3">
            {presets.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() =>
                  setDesign((current) => ({
                    ...current,
                    themePreset: preset.value,
                    primaryColor: preset.primary,
                    accentColor: preset.accent,
                  }))
                }
                className={`flex items-center justify-between border px-3 py-3 text-left text-sm font-semibold ${
                  design.themePreset === preset.value ? "border-primary bg-accent-soft" : "border-border"
                }`}
              >
                {preset.label}
                <span className="flex gap-1">
                  <span className="h-5 w-5" style={{ backgroundColor: preset.primary }} />
                  <span className="h-5 w-5" style={{ backgroundColor: preset.accent }} />
                </span>
              </button>
            ))}
          </div>

          <label className="block text-sm font-semibold">
            Hero title
            <input
              value={design.heroTitle ?? ""}
              onChange={(event) => update("heroTitle", event.target.value)}
              className="mt-2 h-10 w-full border border-border bg-background px-3 text-sm font-normal outline-none focus:border-primary"
              placeholder="Use store name by default"
            />
          </label>

          <label className="block text-sm font-semibold">
            Hero subtitle
            <textarea
              value={design.heroSubtitle ?? ""}
              onChange={(event) => update("heroSubtitle", event.target.value)}
              className="mt-2 min-h-24 w-full border border-border bg-background px-3 py-2 text-sm font-normal outline-none focus:border-primary"
              placeholder="Short promise for buyers"
            />
          </label>

          <div>
            <p className="text-sm font-semibold">Visible sections</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {sections.map((section) => (
                <label key={section.key} className="flex items-center gap-2 border border-border px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={design.sections.includes(section.key)}
                    onChange={() => toggleSection(section.key)}
                  />
                  {section.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="border border-border bg-background p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-heading text-base font-semibold">Marketplace preview</h2>
              <p className="mt-1 text-sm text-muted-foreground">A compact preview of the public `/vendor/slug` renderer.</p>
            </div>
            <Eye className="h-5 w-5 text-primary" />
          </div>

          <div className="overflow-hidden border border-border" style={{ ["--preview-primary" as string]: design.primaryColor, ["--preview-accent" as string]: design.accentColor }}>
            <div className="grid min-h-64 gap-4 bg-[var(--preview-primary)] p-6 text-white md:grid-cols-[1.2fr_0.8fr]">
              <div className="flex flex-col justify-end">
                <div className="flex h-14 w-14 items-center justify-center bg-white text-[var(--preview-primary)]">
                  <Store className="h-7 w-7" />
                </div>
                <h3 className="mt-5 font-heading text-3xl font-semibold">{design.heroTitle || "Your store name"}</h3>
                <p className="mt-3 max-w-lg text-sm leading-6 text-white/75">
                  {design.heroSubtitle || "Shop verified vendor stock, digital products, and Pool resale offers from this store."}
                </p>
              </div>
              <div className="grid content-end gap-3">
                {["Vendor stock", "Pool resale", "Manual dispatch"].map((item) => (
                  <div key={item} className="border border-white/20 bg-white/10 p-3 text-sm font-semibold">
                    <span className="mr-2 inline-block h-2 w-2 bg-[var(--preview-accent)]" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 bg-white p-5 sm:grid-cols-3">
              {["Clean product card", "Digital delivery", "Pool badge"].map((item) => (
                <div key={item} className="border border-border p-4">
                  <div className="aspect-square bg-neutral-100" />
                  <p className="mt-3 text-sm font-semibold text-foreground">{item}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Rendered with approved presets only.</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
