"use client";

import React from "react";
import { Eye, ImageIcon, Save, Store } from "lucide-react";
import { storeApi, vendorCommerceApi } from "@kwikseller/api-client";
import type { Store as StoreType, StorefrontDesignConfig, StorefrontFontKey } from "@kwikseller/types";
import { kwikToast } from "@kwikseller/utils";
import { AppButton, AppColorPicker, FieldInput, FieldSelect, FieldTextarea } from "@kwikseller/ui";
import { unwrapApiData } from "@/lib/vendor-format";
import { KwiksellerLoader } from "@/components/kwikseller-loader";

const fontOptions: Array<{ key: StorefrontFontKey; label: string }> = [
  { key: "SORA", label: "Sora" },
  { key: "FIGTREE", label: "Figtree" },
  { key: "INTER", label: "Inter" },
  { key: "POPPINS", label: "Poppins" },
  { key: "DM_SANS", label: "DM Sans" },
  { key: "LATO", label: "Lato" },
  { key: "MONTSERRAT", label: "Montserrat" },
  { key: "PLAYFAIR_DISPLAY", label: "Playfair Display" },
  { key: "MERRIWEATHER", label: "Merriweather" },
];

const defaultDesign: StorefrontDesignConfig = {
  themePreset: "CLASSIC",
  navbarTemplate: "NAVBAR_CLASSIC",
  bottomNavTemplate: "BOTTOM_TABS_CLASSIC",
  layoutTemplate: "GRID_COMMERCE",
  cartTemplate: "CART_COMPACT",
  typographyPreset: "FIGTREE_QUESTRIAL",
  primaryColor: "#071A2F",
  accentColor: "#F97316",
  fontPairing: "FIGTREE_QUESTRIAL",
  headingFont: "SORA",
  bodyFont: "FIGTREE",
  heroLayout: "BANNER_LEFT",
  productCardStyle: "CLEAN_GRID",
  sections: ["hero", "products", "pool", "policies"],
  heroTitle: "",
  heroSubtitle: "",
};

export default function StorefrontDesignerPage() {
  const logoInputRef = React.useRef<HTMLInputElement>(null);
  const bannerInputRef = React.useRef<HTMLInputElement>(null);
  const [store, setStore] = React.useState<StoreType | null>(null);
  const [design, setDesign] = React.useState<StorefrontDesignConfig>(defaultDesign);
  const [logoFile, setLogoFile] = React.useState<File | null>(null);
  const [bannerFile, setBannerFile] = React.useState<File | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    Promise.all([storeApi.get(), vendorCommerceApi.getStorefrontDesign()])
      .then(([storeResponse, designResponse]) => {
        setStore(unwrapApiData<StoreType>(storeResponse.data));
        setDesign({ ...defaultDesign, ...unwrapApiData<StorefrontDesignConfig>(designResponse.data) });
      })
      .catch(() => kwikToast.error("Could not load storefront settings"))
      .finally(() => setIsLoading(false));
  }, []);

  const updateDesign = <K extends keyof StorefrontDesignConfig>(key: K, value: StorefrontDesignConfig[K]) => {
    setDesign((current) => ({ ...current, [key]: value }));
  };

  const saveDesign = async () => {
    setIsSaving(true);
    try {
      let nextStore = store;
      if (store) {
        const storeResponse = await storeApi.update({
          name: store.name,
          description: store.description,
          category: store.category,
        });
        nextStore = unwrapApiData<StoreType>(storeResponse.data);
      }
      if (logoFile) {
        nextStore = unwrapApiData<StoreType>((await storeApi.uploadLogo(logoFile)).data);
      }
      if (bannerFile) {
        nextStore = unwrapApiData<StoreType>((await storeApi.uploadBanner(bannerFile)).data);
      }
      const designResponse = await vendorCommerceApi.updateStorefrontDesign(design);
      setStore(nextStore);
      setDesign({ ...defaultDesign, ...unwrapApiData<StorefrontDesignConfig>(designResponse.data) });
      setLogoFile(null);
      setBannerFile(null);
      kwikToast.success("Storefront saved");
    } catch (error) {
      kwikToast.error(error instanceof Error ? error.message : "Could not save storefront");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <KwiksellerLoader />;
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Storefront</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Set your vendor logo, banner, brand colors, and font pair. These only affect your public store pages.
          </p>
        </div>
        <AppButton type="button" onClick={saveDesign} disabled={isSaving}>
          <Save className="h-4 w-4" />
          Save storefront
        </AppButton>
      </section>

      <section className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="space-y-5 border border-border bg-background p-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <FieldInput
              label="Store name"
              value={store?.name ?? ""}
              onChange={(event) => setStore((current) => current ? { ...current, name: event.target.value } : current)}
            />
            <FieldInput
              label="Category"
              value={store?.category ?? ""}
              onChange={(event) => setStore((current) => current ? { ...current, category: event.target.value } : current)}
            />
          </div>
          <FieldTextarea
            label="Store description"
            value={store?.description ?? ""}
            onChange={(event) => setStore((current) => current ? { ...current, description: event.target.value } : current)}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <input ref={logoInputRef} type="file" accept="image/*" hidden onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)} />
            <input ref={bannerInputRef} type="file" accept="image/*" hidden onChange={(event) => setBannerFile(event.target.files?.[0] ?? null)} />
            <div className="flex min-h-24 items-center gap-3 border border-border px-4 py-3">
              <ImageIcon className="h-5 w-5 shrink-0 text-accent" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">Logo</p>
                <p className="line-clamp-1 text-xs text-muted-foreground">
                  {logoFile ? logoFile.name : store?.logoUrl ? "Logo uploaded" : "No logo uploaded"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {store?.logoUrl ? (
                  <a
                    href={store.logoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground transition hover:border-accent hover:text-accent"
                    aria-label="View logo"
                  >
                    <Eye className="h-4 w-4" />
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="h-9 rounded-full bg-surface px-4 text-xs font-semibold text-foreground transition hover:bg-accent hover:text-accent-foreground"
                >
                  Update
                </button>
              </div>
            </div>
            <div className="flex min-h-24 items-center gap-3 border border-border px-4 py-3">
              <ImageIcon className="h-5 w-5 shrink-0 text-accent" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">Banner</p>
                <p className="line-clamp-1 text-xs text-muted-foreground">
                  {bannerFile ? bannerFile.name : store?.bannerUrl ? "Banner uploaded" : "No banner uploaded"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {store?.bannerUrl ? (
                  <a
                    href={store.bannerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground transition hover:border-accent hover:text-accent"
                    aria-label="View banner"
                  >
                    <Eye className="h-4 w-4" />
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  className="h-9 rounded-full bg-surface px-4 text-xs font-semibold text-foreground transition hover:bg-accent hover:text-accent-foreground"
                >
                  Update
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <AppColorPicker label="Primary color" value={design.primaryColor} onChange={(value) => updateDesign("primaryColor", value)} />
            <AppColorPicker label="Accent color" value={design.accentColor} onChange={(value) => updateDesign("accentColor", value)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FieldSelect
              label="Heading font"
              value={design.headingFont ?? "SORA"}
              onChange={(event) => updateDesign("headingFont", event.target.value as StorefrontFontKey)}
            >
              {fontOptions.map((font) => <option key={font.key} value={font.key}>{font.label}</option>)}
            </FieldSelect>
            <FieldSelect
              label="Body font"
              value={design.bodyFont ?? "FIGTREE"}
              onChange={(event) => updateDesign("bodyFont", event.target.value as StorefrontFontKey)}
            >
              {fontOptions.map((font) => <option key={font.key} value={font.key}>{font.label}</option>)}
            </FieldSelect>
          </div>

          <FieldInput
            label="Hero title"
            value={design.heroTitle ?? ""}
            onChange={(event) => updateDesign("heroTitle", event.target.value)}
            placeholder="Use store name by default"
          />
          <FieldTextarea
            label="Hero subtitle"
            value={design.heroSubtitle ?? ""}
            onChange={(event) => updateDesign("heroSubtitle", event.target.value)}
            placeholder="Short promise for buyers"
          />
        </div>

        <div className="overflow-hidden border border-border bg-background">
          <div
            className="relative min-h-96 bg-[var(--preview-primary)] p-6 text-white"
            style={{
              ["--preview-primary" as string]: design.primaryColor,
              ["--preview-accent" as string]: design.accentColor,
              backgroundImage: store?.bannerUrl ? `linear-gradient(90deg, ${design.primaryColor}F2, ${design.primaryColor}AA), url(${store.bannerUrl})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="flex h-16 w-16 items-center justify-center bg-white/95 text-[var(--preview-primary)]">
              {store?.logoUrl ? <img src={store.logoUrl} alt="" className="h-full w-full object-cover" /> : <Store className="h-8 w-8" />}
            </div>
            <div className="absolute inset-x-6 bottom-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">Public preview</p>
              <h2 className="mt-3 font-heading text-4xl font-semibold">{design.heroTitle || store?.name || "Your store"}</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/75">
                {design.heroSubtitle || store?.description || "Shop verified products from this independent Kwikseller-powered storefront."}
              </p>
              <div className="mt-5 inline-flex bg-[var(--preview-accent)] px-5 py-3 text-sm font-semibold text-white">
                Shop products
              </div>
            </div>
          </div>
        </div>
      </section>
      {isSaving ? <KwiksellerLoader overlay /> : null}
    </div>
  );
}
