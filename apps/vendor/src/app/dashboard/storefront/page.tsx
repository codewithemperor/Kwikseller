"use client";

import React from "react";
import {
  Eye,
  ExternalLink,
  RotateCcw,
  Save,
  Store,
  ImageIcon,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Monitor,
  Smartphone,
  Type,
  Palette,
  Layout,
  Layers,
  ShoppingBag,
  Star,
  Shield,
  Info,
  Users,
  Package,
} from "lucide-react";
import { storeApi, vendorCommerceApi } from "@kwikseller/api-client";
import type {
  Store as StoreType,
  StorefrontDesignConfig,
  StorefrontFontKey,
} from "@kwikseller/types";
import { kwikToast } from "@kwikseller/utils";
import {
  AppButton,
  AppSwitch,
  AppColorPicker,
  FieldInput,
  FieldSelect,
  FieldTextarea,
  Skeleton,
  VendorPageHeader,
} from "@kwikseller/ui";
import { unwrapApiData } from "@/lib/vendor-format";
import { motion } from "framer-motion";

/* ─── Constants ──────────────────────────────────────────────── */

const STORAGE_KEY = "kwikseller_vendor_storefront_design";

const FONT_OPTIONS: Array<{ key: StorefrontFontKey; label: string; cssVar: string }> = [
  { key: "SORA", label: "Sora", cssVar: "var(--font-heading)" },
  { key: "FIGTREE", label: "Figtree", cssVar: "var(--font-text)" },
  { key: "INTER", label: "Inter", cssVar: "var(--font-inter)" },
  { key: "POPPINS", label: "Poppins", cssVar: "var(--font-poppins)" },
  { key: "DM_SANS", label: "DM Sans", cssVar: "var(--font-dm-sans)" },
  { key: "LATO", label: "Lato", cssVar: "var(--font-lato)" },
  { key: "MONTSERRAT", label: "Montserrat", cssVar: "var(--font-montserrat)" },
  { key: "PLAYFAIR_DISPLAY", label: "Playfair Display", cssVar: "var(--font-playfair-display)" },
  { key: "MERRIWEATHER", label: "Merriweather", cssVar: "var(--font-merriweather)" },
];

const COLOR_PRESETS = [
  "#111827", "#1E293B", "#0F172A", "#18181B",
  "#14532D", "#713F12", "#7C2D12", "#581C87",
  "#0F766E",
];

const HERO_LAYOUTS = [
  { value: "BANNER_LEFT", label: "Banner Left", icon: "LTR" },
  { value: "BANNER_CENTER", label: "Centered", icon: "CTR" },
  { value: "BANNER_SPLIT", label: "Split", icon: "SPL" },
] as const;

const NAVBAR_TEMPLATES = [
  { value: "NAVBAR_CLASSIC", label: "Classic" },
  { value: "NAVBAR_MINIMAL", label: "Minimal" },
  { value: "NAVBAR_BOLD", label: "Bold" },
] as const;

const PRODUCT_CARD_STYLES = [
  { value: "CLEAN_GRID", label: "Clean" },
  { value: "COMPACT_GRID", label: "Compact" },
  { value: "DETAILED_GRID", label: "Detailed" },
] as const;

const ALL_SECTIONS = [
  { id: "hero", label: "Hero Banner", icon: Layout },
  { id: "products", label: "Products", icon: ShoppingBag },
  { id: "pool", label: "Pool Sourcing", icon: Package },
  { id: "policies", label: "Policies", icon: Shield },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "about", label: "About", icon: Info },
] as const;

const DEFAULT_DESIGN: StorefrontDesignConfig = {
  themePreset: "CLASSIC",
  navbarTemplate: "NAVBAR_CLASSIC",
  bottomNavTemplate: "BOTTOM_TABS_CLASSIC",
  layoutTemplate: "GRID_COMMERCE",
  cartTemplate: "CART_COMPACT",
  typographyPreset: "FIGTREE_QUESTRIAL",
  primaryColor: "#111827",
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

/* ─── Helper ──────────────────────────────────────────────── */

function getFontCss(fontKey?: StorefrontFontKey): string {
  const found = FONT_OPTIONS.find((f) => f.key === fontKey);
  return found?.cssVar ?? "var(--font-heading)";
}

function loadFromStorage(): StorefrontDesignConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as StorefrontDesignConfig;
  } catch { /* ignore */ }
  return null;
}

function saveToStorage(design: StorefrontDesignConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(design));
  } catch { /* ignore */ }
}

/* ─── Phone Mockup ─────────────────────────────────────────── */

function PhoneMockup({
  design,
  storeName,
}: {
  design: StorefrontDesignConfig;
  storeName: string;
}) {
  const headingFont = getFontCss(design.headingFont);
  const bodyFont = getFontCss(design.bodyFont);
  const heroTitle = design.heroTitle || storeName || "Your Store";
  const heroSubtitle = design.heroSubtitle || "Shop verified products from this storefront";
  const visibleSections = design.sections ?? DEFAULT_DESIGN.sections;
  const isCentered = design.heroLayout === "BANNER_CENTER";
  const isSplit = design.heroLayout === "BANNER_SPLIT";
  const isBold = design.navbarTemplate === "NAVBAR_BOLD";
  const isMinimal = design.navbarTemplate === "NAVBAR_MINIMAL";

  return (
    <div className="mx-auto w-full max-w-[320px]">
      {/* Phone frame */}
      <div className="rounded-[2.5rem] border-[3px] border-gray-800 bg-gray-900 p-2">
        {/* Screen */}
        <div className="relative overflow-hidden rounded-[2rem] bg-surface" style={{ fontFamily: bodyFont }}>
          {/* Notch */}
          <div className="absolute left-1/2 top-0 z-10 h-6 w-24 -translate-x-1/2 rounded-b-2xl bg-gray-900" />
          {/* Status bar spacer */}
          <div className="h-8" />

          {/* Navbar */}
          <div
            className="flex items-center gap-2 px-4 pb-2"
            style={{
              backgroundColor: isBold ? design.primaryColor : "transparent",
              borderBottom: isBold ? "none" : "1px solid #f0f0f0",
              height: isBold ? 40 : 32,
            }}
          >
            <div
              className="h-5 w-5 rounded-sm"
              style={{
                backgroundColor: isMinimal ? "transparent" : design.primaryColor,
                border: isMinimal ? `1px solid ${design.primaryColor}` : "none",
              }}
            />
            <span
              className="text-[10px] font-semibold tracking-wide"
              style={{
                fontFamily: headingFont,
                color: isBold ? "#ffffff" : design.primaryColor,
                fontWeight: isBold ? 700 : 600,
              }}
            >
              {storeName || "STORE"}
            </span>
            <div className="ml-auto flex gap-1">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: design.primaryColor, opacity: 0.2 }} />
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: design.primaryColor, opacity: 0.2 }} />
            </div>
          </div>

          {/* Hero Section */}
          {visibleSections.includes("hero") && (
            <div
              className="relative px-4 py-5"
              style={{
                backgroundColor: design.primaryColor,
                minHeight: isCentered || isSplit ? 100 : 80,
                display: isCentered ? "flex" : "block",
                flexDirection: isCentered ? "column" : undefined,
                alignItems: isCentered ? "center" : undefined,
                textAlign: isCentered ? "center" : "left",
              }}
            >
              {isSplit && (
                <div className="absolute bottom-0 right-0 top-0 w-1/3 opacity-20">
                  <div className="h-full w-full" style={{ backgroundColor: design.accentColor }} />
                </div>
              )}
              <div className={isSplit ? "max-w-[60%]" : isCentered ? "w-full" : ""}>
                <h2
                  className="text-[14px] font-bold leading-tight text-white"
                  style={{ fontFamily: headingFont }}
                >
                  {heroTitle}
                </h2>
                <p className="mt-1 text-[8px] leading-relaxed text-white/70">{heroSubtitle}</p>
                <div
                  className="mt-2 inline-block rounded-sm px-3 py-1 text-[7px] font-semibold text-white"
                  style={{ backgroundColor: design.accentColor }}
                >
                  Shop Now
                </div>
              </div>
            </div>
          )}

          {/* Products Section */}
          {visibleSections.includes("products") && (
            <div className="px-4 py-3">
              <h3
                className="mb-2 text-[10px] font-bold uppercase tracking-wider"
                style={{ fontFamily: headingFont, color: design.primaryColor }}
              >
                Products
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="overflow-hidden rounded-sm border border-kwik-border">
                    <div
                      className="h-16"
                      style={{ backgroundColor: design.primaryColor, opacity: 0.08 + i * 0.02 }}
                    />
                    <div className="p-1.5">
                      <div className="mb-1 h-1.5 w-3/4 rounded-sm bg-default-200" />
                      <div
                        className="h-1 w-1/2 rounded-sm"
                        style={{ backgroundColor: design.accentColor, opacity: 0.6 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pool Section */}
          {visibleSections.includes("pool") && (
            <div className="border-t border-kwik-border px-4 py-3">
              <h3
                className="mb-2 text-[10px] font-bold uppercase tracking-wider"
                style={{ fontFamily: headingFont, color: design.primaryColor }}
              >
                Pool Sourcing
              </h3>
              <div className="flex gap-2">
                {[1, 2].map((i) => (
                  <div key={i} className="flex-1 rounded-sm border border-kwik-border p-2">
                    <div className="mb-1 h-10 rounded-sm bg-default-100" />
                    <div className="h-1.5 w-2/3 rounded-sm bg-default-200" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Policies Section */}
          {visibleSections.includes("policies") && (
            <div className="border-t border-kwik-border px-4 py-3">
              <h3
                className="mb-1.5 text-[10px] font-bold uppercase tracking-wider"
                style={{ fontFamily: headingFont, color: design.primaryColor }}
              >
                Policies
              </h3>
              <div className="space-y-1">
                {["Return Policy", "Shipping Info", "Terms of Service"].map((t) => (
                  <div key={t} className="flex items-center gap-1.5 text-[8px] text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: design.accentColor }} />
                    {t}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews Section */}
          {visibleSections.includes("reviews") && (
            <div className="border-t border-kwik-border px-4 py-3">
              <h3
                className="mb-1.5 text-[10px] font-bold uppercase tracking-wider"
                style={{ fontFamily: headingFont, color: design.primaryColor }}
              >
                Reviews
              </h3>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="text-[8px]" style={{ color: design.accentColor }}>★</div>
                ))}
              </div>
              <p className="mt-1 text-[7px] text-muted-foreground">Based on 48 reviews</p>
            </div>
          )}

          {/* About Section */}
          {visibleSections.includes("about") && (
            <div className="border-t border-kwik-border px-4 py-3">
              <h3
                className="mb-1.5 text-[10px] font-bold uppercase tracking-wider"
                style={{ fontFamily: headingFont, color: design.primaryColor }}
              >
                About
              </h3>
              <p className="text-[7px] leading-relaxed text-muted-foreground">
                Your store description will appear here. Add a compelling story about your brand.
              </p>
            </div>
          )}

          {/* Bottom nav */}
          <div className="flex items-center justify-around border-t border-kwik-border px-4 py-2">
            {["Home", "Shop", "Cart", "Profile"].map((t) => (
              <div key={t} className="text-center">
                <div className="mx-auto mb-0.5 h-3 w-3 rounded-full bg-default-200" />
                <span className="text-[6px] text-muted-foreground">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Home indicator */}
      <div className="mx-auto mt-1.5 h-1 w-28 rounded-full bg-gray-800" />
    </div>
  );
}

/* ─── Sections Manager ─────────────────────────────────────── */

function SectionsManager({
  sections,
  onChange,
}: {
  sections: string[];
  onChange: (sections: string[]) => void;
}) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const toggleVisibility = (id: string) => {
    if (sections.includes(id)) {
      onChange(sections.filter((s) => s !== id));
    } else {
      onChange([...sections, id]);
    }
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const next = [...sections];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-0">
      {ALL_SECTIONS.map((section) => {
        const isVisible = sections.includes(section.id);
        const visibleIndex = sections.indexOf(section.id);
        const IconComp = section.icon;
        const isExpanded = expandedId === section.id;

        return (
          <div
            key={section.id}
            className="flex items-center gap-3 border-t border-kwik-border py-3 first:border-t-0"
          >
            {/* Drag handle (decorative) */}
            <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/50" />

            {/* Icon */}
            <IconComp className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />

            {/* Label + expand toggle */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{section.label}</span>
                {isVisible && (
                  <span className="text-[10px] font-mono text-muted-foreground">#{visibleIndex + 1}</span>
                )}
              </div>
              {isExpanded && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {isVisible
                    ? "Visible in storefront. Use arrows to reorder."
                    : "Hidden from storefront. Toggle to show."}
                </p>
              )}
            </div>

            {/* Reorder arrows (only when visible) */}
            {isVisible && (
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => moveSection(visibleIndex, "up")}
                  disabled={visibleIndex === 0}
                  className="rounded p-0.5 text-muted-foreground transition hover:bg-default-100 hover:text-muted-foreground disabled:opacity-20 disabled:hover:bg-transparent"
                  aria-label="Move up"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveSection(visibleIndex, "down")}
                  disabled={visibleIndex === sections.length - 1}
                  className="rounded p-0.5 text-muted-foreground transition hover:bg-default-100 hover:text-muted-foreground disabled:opacity-20 disabled:hover:bg-transparent"
                  aria-label="Move down"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Info toggle */}
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : section.id)}
              className="rounded p-1 text-muted-foreground transition hover:bg-default-100 hover:text-muted-foreground"
              aria-label="Toggle info"
            >
              <Info className="h-3.5 w-3.5" />
            </button>

            {/* Visibility toggle */}
            <AppSwitch
              isSelected={isVisible}
              onChange={() => toggleVisibility(section.id)}
              label=""
            />
          </div>
        );
      })}
    </div>
  );
}

/* ─── Color Presets Picker ──────────────────────────────────── */

function ColorPresetsPicker({
  label,
  value,
  presets,
  onChange,
}: {
  label: string;
  value: string;
  presets: string[];
  onChange: (value: string) => void;
}) {
  const [showCustom, setShowCustom] = React.useState(false);
  const [customHex, setCustomHex] = React.useState(value);

  const applyCustom = () => {
    const trimmed = customHex.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
      onChange(trimmed.toUpperCase());
      setShowCustom(false);
    } else {
      kwikToast.error("Enter a valid hex color (e.g. #111827)");
    }
  };

  return (
    <div className="space-y-2">
      <span className="text-xs font-semibold text-muted">{label}</span>
      <div className="flex flex-wrap gap-2">
        {presets.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className="group relative h-9 w-9 rounded-sm border border-kwik-border transition hover:scale-105"
            style={{ backgroundColor: color }}
            aria-label={`Color ${color}`}
          >
            {value.toUpperCase() === color.toUpperCase() && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-2.5 w-2.5 rounded-full border-2 border-white bg-gray-900" />
              </div>
            )}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setShowCustom(!showCustom);
            setCustomHex(value);
          }}
          className="flex h-9 w-9 items-center justify-center rounded-sm border border-dashed border-kwik-border text-xs text-muted-foreground transition hover:border-accent hover:text-muted-foreground"
          aria-label="Custom color"
        >
          #
        </button>
      </div>
      {showCustom && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={customHex}
            onChange={(e) => setCustomHex(e.target.value)}
            placeholder="#000000"
            maxLength={7}
            className="h-9 w-28 rounded-sm border border-kwik-border bg-surface px-2 text-sm font-mono text-foreground outline-none focus:border-accent"
          />
          <AppButton size="sm" onClick={applyCustom}>
            Apply
          </AppButton>
        </div>
      )}
      <div className="flex items-center gap-2">
        <AppColorPicker label="" value={value} onChange={onChange} />
        <span className="font-mono text-xs text-muted-foreground">{value.toUpperCase()}</span>
      </div>
    </div>
  );
}

/* ─── Layout Selector ───────────────────────────────────────── */

function LayoutSelector<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { value: T; label: string; icon?: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="space-y-2">
      <span className="text-xs font-semibold text-muted">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex items-center gap-2 rounded-sm border px-4 py-2.5 text-sm font-medium transition ${
              value === opt.value
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-kwik-border bg-surface text-muted-foreground hover:border-accent"
            }`}
          >
            {opt.icon && (
              <span className="font-mono text-[10px] tracking-wider opacity-60">{opt.icon}</span>
            )}
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────── */

export default function StorefrontDesignerPage() {
  const logoInputRef = React.useRef<HTMLInputElement>(null);
  const bannerInputRef = React.useRef<HTMLInputElement>(null);

  const [store, setStore] = React.useState<StoreType | null>(null);
  const [design, setDesign] = React.useState<StorefrontDesignConfig>(DEFAULT_DESIGN);
  const [logoFile, setLogoFile] = React.useState<File | null>(null);
  const [bannerFile, setBannerFile] = React.useState<File | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"theme" | "hero" | "nav" | "products" | "sections">("theme");

  // Load data
  React.useEffect(() => {
    // Try localStorage first for immediate render
    const stored = loadFromStorage();

    Promise.all([
      storeApi.get(),
      vendorCommerceApi.getStorefrontDesign().catch(() => null),
    ])
      .then(([storeResponse, designResponse]) => {
        const storeData = unwrapApiData<StoreType>(storeResponse.data);
        setStore(storeData);

        if (designResponse) {
          const apiDesign = unwrapApiData<StorefrontDesignConfig>(designResponse.data);
          setDesign({ ...DEFAULT_DESIGN, ...apiDesign });
          saveToStorage({ ...DEFAULT_DESIGN, ...apiDesign });
        } else if (stored) {
          setDesign({ ...DEFAULT_DESIGN, ...stored });
        }
      })
      .catch(() => {
        // Fallback to localStorage
        if (stored) {
          setDesign({ ...DEFAULT_DESIGN, ...stored });
        }
        kwikToast.error("Could not load storefront settings — using saved data");
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Persist to localStorage on design changes
  React.useEffect(() => {
    if (!isLoading) {
      saveToStorage(design);
    }
  }, [design, isLoading]);

  const updateDesign = <K extends keyof StorefrontDesignConfig>(
    key: K,
    value: StorefrontDesignConfig[K]
  ) => {
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
      setDesign({ ...DEFAULT_DESIGN, ...unwrapApiData<StorefrontDesignConfig>(designResponse.data) });
      saveToStorage(design);
      setLogoFile(null);
      setBannerFile(null);
      kwikToast.success("Storefront saved successfully");
    } catch (error) {
      // Still save to localStorage
      saveToStorage(design);
      kwikToast.error(error instanceof Error ? error.message : "Could not save — changes saved locally");
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefault = () => {
    setDesign(DEFAULT_DESIGN);
    saveToStorage(DEFAULT_DESIGN);
    kwikToast.success("Reset to default design");
  };

  const previewStore = () => {
    const slug = store?.slug || "my-store";
    window.open(`/store/${slug}`, "_blank", "noopener,noreferrer");
  };

  /* ─── Loading state ──────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="safe-container space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-7 w-40" />
            <Skeleton className="mt-2 h-4 w-80" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
    );
  }

  /* ─── Tabs configuration ──────────────────────────────────── */
  const tabs: Array<{ id: typeof activeTab; label: string; icon: React.ReactNode }> = [
    { id: "theme", label: "Theme", icon: <Palette className="h-3.5 w-3.5" /> },
    { id: "hero", label: "Hero", icon: <Layout className="h-3.5 w-3.5" /> },
    { id: "nav", label: "Navbar", icon: <Monitor className="h-3.5 w-3.5" /> },
    { id: "products", label: "Products", icon: <ShoppingBag className="h-3.5 w-3.5" /> },
    { id: "sections", label: "Sections", icon: <Layers className="h-3.5 w-3.5" /> },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="safe-container space-y-5 p-4 md:p-6"
    >
      {/* ─── Page Header ─────────────────────────────────── */}
      <VendorPageHeader
        title="Storefront Designer"
        description="Customize your public store appearance — colors, fonts, layout, and sections. Changes are saved locally and synced when you click Save."
        actions={
          <>
            <AppButton variant="ghost" size="sm" onClick={previewStore}>
              <ExternalLink className="h-3.5 w-3.5" />
              Preview
            </AppButton>
            <AppButton variant="ghost" size="sm" onClick={resetToDefault}>
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </AppButton>
            <AppButton
              variant="primary"
              size="sm"
              onClick={saveDesign}
              isLoading={isSaving}
            >
              <Save className="h-3.5 w-3.5" />
              Save Changes
            </AppButton>
          </>
        }
      />

      {/* ─── Main Content: Split Panel ────────────────────── */}
      <section className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* LEFT: Controls */}
        <div className="min-w-0 space-y-6">
          {/* Store Info */}
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Store className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              Store Information
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldInput
                label="Store name"
                value={store?.name ?? ""}
                onChange={(e) =>
                  setStore((c) => (c ? { ...c, name: e.target.value } : c))
                }
              />
              <FieldInput
                label="Category"
                value={store?.category ?? ""}
                onChange={(e) =>
                  setStore((c) => (c ? { ...c, category: e.target.value } : c))
                }
              />
            </div>
            <FieldTextarea
              label="Store description"
              value={store?.description ?? ""}
              rows={3}
              onChange={(e) =>
                setStore((c) => (c ? { ...c, description: e.target.value } : c))
              }
            />

            {/* Logo & Banner Upload */}
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
              />
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => setBannerFile(e.target.files?.[0] ?? null)}
              />
              <div className="flex min-h-[68px] items-center gap-3 rounded-md border border-kwik-border px-3 py-2.5">
                <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">Logo</p>
                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    {logoFile
                      ? logoFile.name
                      : store?.logoUrl
                        ? "Logo uploaded"
                        : "No logo"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {store?.logoUrl && (
                    <a
                      href={store.logoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-8 w-8 items-center justify-center rounded-sm border border-kwik-border text-muted-foreground transition hover:border-accent"
                      aria-label="View logo"
                    >
                      <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="h-8 rounded-sm bg-gray-900 px-3 text-xs font-medium text-white transition hover:bg-gray-800"
                  >
                    Upload
                  </button>
                </div>
              </div>
              <div className="flex min-h-[68px] items-center gap-3 rounded-md border border-kwik-border px-3 py-2.5">
                <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">Banner</p>
                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    {bannerFile
                      ? bannerFile.name
                      : store?.bannerUrl
                        ? "Banner uploaded"
                        : "No banner"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {store?.bannerUrl && (
                    <a
                      href={store.bannerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-8 w-8 items-center justify-center rounded-sm border border-kwik-border text-muted-foreground transition hover:border-accent"
                      aria-label="View banner"
                    >
                      <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    className="h-8 rounded-sm bg-gray-900 px-3 text-xs font-medium text-white transition hover:bg-gray-800"
                  >
                    Upload
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-kwik-border" />

          {/* Tab Navigation */}
          <div className="flex gap-0 overflow-x-auto border-b border-kwik-border scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? "border-b-2 border-gray-900 text-foreground"
                    : "text-muted-foreground hover:text-muted-foreground"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[300px]">
            {/* ── Theme Tab ────────────────────────────────── */}
            {activeTab === "theme" && (
              <div className="space-y-6">
                {/* Primary Color */}
                <ColorPresetsPicker
                  label="Primary Color"
                  value={design.primaryColor}
                  presets={COLOR_PRESETS}
                  onChange={(v) => updateDesign("primaryColor", v)}
                />

                <div className="border-t border-kwik-border" />

                {/* Accent Color */}
                <ColorPresetsPicker
                  label="Accent Color"
                  value={design.accentColor}
                  presets={["#F97316", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16", "#F43F5E"]}
                  onChange={(v) => updateDesign("accentColor", v)}
                />

                <div className="border-t border-kwik-border" />

                {/* Font Pairing */}
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-muted">Font Pairing</span>
                  <p className="text-xs text-muted-foreground">
                    Choose heading and body fonts for your storefront. Preview updates in the phone mockup.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FieldSelect
                      label="Heading Font"
                      value={design.headingFont ?? "SORA"}
                      onChange={(e) => {
                        updateDesign("headingFont", e.target.value as StorefrontFontKey);
                      }}
                    >
                      {FONT_OPTIONS.map((f) => (
                        <option key={f.key} value={f.key}>
                          {f.label}
                        </option>
                      ))}
                    </FieldSelect>
                    <FieldSelect
                      label="Body Font"
                      value={design.bodyFont ?? "FIGTREE"}
                      onChange={(e) => {
                        updateDesign("bodyFont", e.target.value as StorefrontFontKey);
                      }}
                    >
                      {FONT_OPTIONS.map((f) => (
                        <option key={f.key} value={f.key}>
                          {f.label}
                        </option>
                      ))}
                    </FieldSelect>
                  </div>
                  {/* Font preview */}
                  <div className="rounded-md border border-kwik-border p-4" style={{ fontFamily: getFontCss(design.headingFont) }}>
                    <p className="text-lg font-bold text-foreground">
                      Heading Preview
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: getFontCss(design.bodyFont) }}>
                      Body text preview — The quick brown fox jumps over the lazy dog.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Hero Tab ─────────────────────────────────── */}
            {activeTab === "hero" && (
              <div className="space-y-6">
                <FieldInput
                  label="Hero Title"
                  value={design.heroTitle ?? ""}
                  onChange={(e) => updateDesign("heroTitle", e.target.value)}
                  placeholder="Use store name by default"
                />
                <FieldTextarea
                  label="Hero Subtitle"
                  value={design.heroSubtitle ?? ""}
                  onChange={(e) => updateDesign("heroSubtitle", e.target.value)}
                  placeholder="Short promise for buyers"
                  rows={3}
                />
                <div className="border-t border-kwik-border" />
                <LayoutSelector
                  label="Hero Layout"
                  options={HERO_LAYOUTS}
                  value={design.heroLayout as typeof HERO_LAYOUTS[number]["value"]}
                  onChange={(v) => updateDesign("heroLayout", v)}
                />
              </div>
            )}

            {/* ── Navbar Tab ────────────────────────────────── */}
            {activeTab === "nav" && (
              <div className="space-y-6">
                <LayoutSelector
                  label="Navbar Template"
                  options={NAVBAR_TEMPLATES}
                  value={design.navbarTemplate as typeof NAVBAR_TEMPLATES[number]["value"]}
                  onChange={(v) => updateDesign("navbarTemplate", v)}
                />
                <div className="rounded-md border border-kwik-border p-4">
                  <p className="text-xs font-medium text-foreground">Navbar Preview</p>
                  <div className="mt-3 flex items-center gap-3 rounded-sm border border-kwik-border p-3">
                    <div
                      className="h-8 w-8 rounded-sm"
                      style={{
                        backgroundColor:
                          design.navbarTemplate === "NAVBAR_MINIMAL"
                            ? "transparent"
                            : design.primaryColor,
                        border:
                          design.navbarTemplate === "NAVBAR_MINIMAL"
                            ? `1px solid ${design.primaryColor}`
                            : "none",
                      }}
                    />
                    <div
                      className="text-sm font-semibold"
                      style={{
                        fontFamily: getFontCss(design.headingFont),
                        color: design.primaryColor,
                        fontWeight: design.navbarTemplate === "NAVBAR_BOLD" ? 800 : 600,
                        fontSize: design.navbarTemplate === "NAVBAR_BOLD" ? 16 : 14,
                        letterSpacing: design.navbarTemplate === "NAVBAR_MINIMAL" ? "0.05em" : "normal",
                        textTransform: design.navbarTemplate === "NAVBAR_BOLD" ? "uppercase" : "none",
                      }}
                    >
                      {store?.name || "STORE NAME"}
                    </div>
                    <div className="ml-auto flex gap-2">
                      <div className="h-5 w-12 rounded-sm bg-default-100" />
                      <div className="h-5 w-12 rounded-sm bg-default-100" />
                      <div className="h-5 w-12 rounded-sm bg-default-100" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Products Tab ──────────────────────────────── */}
            {activeTab === "products" && (
              <div className="space-y-6">
                <LayoutSelector
                  label="Product Card Style"
                  options={PRODUCT_CARD_STYLES}
                  value={
                    design.productCardStyle as typeof PRODUCT_CARD_STYLES[number]["value"]
                  }
                  onChange={(v) => updateDesign("productCardStyle", v)}
                />
                <div className="rounded-md border border-kwik-border p-4">
                  <p className="text-xs font-medium text-foreground mb-3">Card Preview</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="overflow-hidden rounded-sm border border-kwik-border">
                        <div
                          className="h-20"
                          style={{
                            backgroundColor: design.primaryColor,
                            opacity: 0.08 + i * 0.03,
                          }}
                        />
                        <div className={`p-${design.productCardStyle === "COMPACT_GRID" ? "1.5" : "2.5"}`}>
                          <div
                            className="mb-1 rounded-sm bg-default-200"
                            style={{
                              height: design.productCardStyle === "COMPACT_GRID" ? 4 : 6,
                              width: "75%",
                            }}
                          />
                          <div
                            className="rounded-sm"
                            style={{
                              height: design.productCardStyle === "COMPACT_GRID" ? 3 : 4,
                              width: "50%",
                              backgroundColor: design.accentColor,
                              opacity: 0.7,
                            }}
                          />
                          {design.productCardStyle === "DETAILED_GRID" && (
                            <div className="mt-2 flex gap-1">
                              <div className="h-1.5 w-1.5 rounded-full bg-default-200" />
                              <div className="h-1.5 w-12 rounded-sm bg-default-100" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Sections Tab ─────────────────────────────── */}
            {activeTab === "sections" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted">Store Sections</p>
                    <p className="text-xs text-muted-foreground">
                      Toggle visibility and reorder sections in your storefront.
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {design.sections?.length ?? 0} active
                  </span>
                </div>
                <SectionsManager
                  sections={design.sections ?? [...DEFAULT_DESIGN.sections]}
                  onChange={(s) => updateDesign("sections", s)}
                />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Phone Mockup (sticky on desktop) */}
        <div className="flex items-start justify-center lg:sticky lg:top-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Smartphone className="h-3.5 w-3.5" strokeWidth={1.5} />
              Live Preview
            </div>
            <PhoneMockup
              design={design}
              storeName={store?.name ?? ""}
            />
          </div>
        </div>
      </section>

      {/* ─── Bottom Actions (mobile) ─────────────────────── */}
      <section className="border-t border-kwik-border pt-4 lg:hidden">
        <div className="flex items-center gap-2">
          <AppButton
            variant="ghost"
            size="sm"
            fullWidth
            onClick={previewStore}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Preview Store
          </AppButton>
          <AppButton
            variant="primary"
            size="sm"
            fullWidth
            onClick={saveDesign}
            isLoading={isSaving}
          >
            <Save className="h-3.5 w-3.5" />
            Save Changes
          </AppButton>
        </div>
      </section>

    </motion.div>
  );
}
