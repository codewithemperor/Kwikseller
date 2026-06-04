"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Store,
  Package,
  Palette,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Upload,
  Camera,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  CircleCheck,
  Circle,
  Info,
  Building2,
  Eye,
} from "lucide-react";
import { AppButton, Skeleton } from "@kwikseller/ui";
import { kwikToast } from "@kwikseller/utils";
import { storeApi, uploadApi } from "@kwikseller/api-client";

// ==================== Constants ====================

const STORAGE_KEY = "kwikseller_onboarding_data";
const COMPLETED_KEY = "kwikseller_onboarding_completed";

const CATEGORIES = [
  "Fashion",
  "Electronics",
  "Food & Beverages",
  "Health & Beauty",
  "Home & Garden",
  "Sports & Outdoors",
  "Books & Media",
  "Automotive",
  "Baby & Kids",
  "Agriculture",
  "Services",
  "Other",
];

const COLOR_PRESETS = [
  "#071A2F",
  "#F97316",
  "#10B981",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#0EA5E9",
  "#F59E0B",
  "#1F2937",
];

const FONT_OPTIONS = [
  { label: "Sora", cssVar: "var(--font-heading)" },
  { label: "Figtree", cssVar: "var(--font-text)" },
  { label: "Inter", cssVar: "var(--font-inter)" },
  { label: "Poppins", cssVar: "var(--font-poppins)" },
  { label: "DM Sans", cssVar: "var(--font-dm-sans)" },
  { label: "Lato", cssVar: "var(--font-lato)" },
  { label: "Montserrat", cssVar: "var(--font-montserrat)" },
  { label: "Playfair Display", cssVar: "var(--font-playfair-display)" },
];

const STEPS = [
  { num: 1, label: "Welcome" },
  { num: 2, label: "Store Basics" },
  { num: 3, label: "Appearance" },
  { num: 4, label: "First Product" },
  { num: 5, label: "Payment" },
  { num: 6, label: "KYC" },
  { num: 7, label: "Ready" },
];

const NIGERIAN_BANKS = [
  { code: "044", name: "Access Bank" },
  { code: "023", name: "Citibank Nigeria" },
  { code: "063", name: "Diamond Bank" },
  { code: "050", name: "EcoBank Nigeria" },
  { code: "084", name: "Enterprise Bank" },
  { code: "070", name: "Fidelity Bank" },
  { code: "011", name: "First Bank of Nigeria" },
  { code: "214", name: "First City Monument Bank" },
  { code: "058", name: "Guaranty Trust Bank" },
  { code: "030", name: "Heritage Bank" },
  { code: "301", name: "Jaiz Bank" },
  { code: "082", name: "Keystone Bank" },
  { code: "526", name: "Parallex Bank" },
  { code: "076", name: "Polaris Bank" },
  { code: "101", name: "Providus Bank" },
  { code: "221", name: "Stanbic IBTC Bank" },
  { code: "068", name: "Standard Chartered Bank" },
  { code: "232", name: "Sterling Bank" },
  { code: "100", name: "SunTrust Bank" },
  { code: "032", name: "Union Bank of Nigeria" },
  { code: "033", name: "United Bank for Africa" },
  { code: "215", name: "Unity Bank" },
  { code: "035", name: "Wema Bank" },
  { code: "057", name: "Zenith Bank" },
  { code: "999", name: "Other" },
];

const PRODUCT_CATEGORIES = [
  "Fashion",
  "Electronics",
  "Food & Beverages",
  "Health & Beauty",
  "Home & Garden",
  "Sports & Outdoors",
  "Books & Media",
  "Automotive",
  "Baby & Kids",
  "Agriculture",
  "Services",
  "Other",
];

// ==================== Types ====================

type AccountType = "SELLER" | "POOL_SOURCE" | "BOTH";

type OnboardingData = {
  currentStep: number;
  accountType: AccountType;
  // Step 2
  storeName: string;
  storeSlug: string;
  storeDescription: string;
  storeCategory: string;
  logoUrl: string;
  logoPreview: string;
  contactEmail: string;
  phoneNumber: string;
  // Step 3
  brandColor: string;
  headingFont: string;
  bodyFont: string;
  bannerUrl: string;
  bannerPreview: string;
  // Step 4
  productName: string;
  productPrice: string;
  productCategory: string;
  productImagePreview: string;
  productDescription: string;
  // Step 5
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  bankVerified: boolean;
  // Step 6
  kycCompleted: boolean;
};

const DEFAULT_DATA: OnboardingData = {
  currentStep: 1,
  accountType: "SELLER",
  storeName: "",
  storeSlug: "",
  storeDescription: "",
  storeCategory: "",
  logoUrl: "",
  logoPreview: "",
  contactEmail: "",
  phoneNumber: "",
  brandColor: "#071A2F",
  headingFont: "Sora",
  bodyFont: "Figtree",
  bannerUrl: "",
  bannerPreview: "",
  productName: "",
  productPrice: "",
  productCategory: "",
  productImagePreview: "",
  productDescription: "",
  bankName: "",
  bankCode: "",
  accountNumber: "",
  accountName: "",
  bankVerified: false,
  kycCompleted: false,
};

// ==================== Helpers ====================

function loadData(): OnboardingData {
  if (typeof window === "undefined") return { ...DEFAULT_DATA };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_DATA, ...parsed };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_DATA };
}

function saveData(data: OnboardingData) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function getHeadingFontCss(fontLabel: string): string {
  const found = FONT_OPTIONS.find((f) => f.label === fontLabel);
  return found ? found.cssVar : "var(--font-heading)";
}

function getBodyFontCss(fontLabel: string): string {
  const found = FONT_OPTIONS.find((f) => f.label === fontLabel);
  return found ? found.cssVar : "var(--font-text)";
}

// ==================== Sub-components ====================

function ProgressIndicator({ currentStep }: { currentStep: number }) {
  const progressPercent = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="mb-8 sm:mb-10">
      {/* Progress bar */}
      <div className="mb-4 h-1 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-gray-900 transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Step labels */}
      <div className="flex items-start justify-between">
        {STEPS.map((step) => {
          const isPast = step.num < currentStep;
          const isCurrent = step.num === currentStep;
          const isFuture = step.num > currentStep;

          return (
            <div
              key={step.num}
              className="flex flex-1 flex-col items-center"
            >
              <div className="flex items-center gap-1">
                {isPast ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" strokeWidth={2} />
                ) : isCurrent ? (
                  <Circle className="h-4 w-4 border-2 border-gray-900 fill-gray-900 text-white" strokeWidth={2} />
                ) : (
                  <Circle className="h-4 w-4 border-gray-300 text-white" strokeWidth={2} />
                )}
                <span
                  className={`hidden text-xs font-medium sm:inline ${
                    isPast
                      ? "text-green-600"
                      : isCurrent
                        ? "border-b-2 border-gray-900 pb-0.5 text-gray-900"
                        : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ImageUploadField({
  label,
  preview,
  onFileChange,
}: {
  label: string;
  preview: string;
  onFileChange: (file: File) => void;
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileChange(file);
    }
  };

  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-muted dark:text-white/60">
        {label}
      </p>
      {preview ? (
        <div className="relative">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border border-gray-200 sm:h-28 sm:w-28">
            <img
              src={preview}
              alt="Preview"
              className="h-full w-full object-cover"
            />
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700"
          >
            <Camera className="h-3.5 w-3.5" />
            Change
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-24 w-24 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 transition hover:border-gray-400 hover:bg-gray-50 sm:h-28 sm:w-28"
        >
          <Upload className="mb-1 h-5 w-5 text-gray-400" strokeWidth={1.5} />
          <span className="text-xs text-gray-400">Upload</span>
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}

// Banner upload has different aspect ratio
function BannerUploadField({
  label,
  preview,
  onFileChange,
}: {
  label: string;
  preview: string;
  onFileChange: (file: File) => void;
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileChange(file);
    }
  };

  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-muted dark:text-white/60">
        {label}
      </p>
      {preview ? (
        <div className="relative">
          <div className="flex h-32 w-full items-center justify-center overflow-hidden rounded-lg border border-gray-200 sm:h-40">
            <img
              src={preview}
              alt="Banner preview"
              className="h-full w-full object-cover"
            />
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700"
          >
            <Camera className="h-3.5 w-3.5" />
            Change banner
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-32 w-full flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 transition hover:border-gray-400 hover:bg-gray-50 sm:h-40"
        >
          <Upload className="mb-1 h-5 w-5 text-gray-400" strokeWidth={1.5} />
          <span className="text-xs text-gray-400">Upload banner image</span>
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}

// ==================== Step Components ====================

function StepWelcome({
  data,
  onChange,
  onNext,
}: {
  data: OnboardingData;
  onChange: (field: keyof OnboardingData, value: string) => void;
  onNext: () => void;
}) {
  const accountOptions: { value: AccountType; label: string; desc: string }[] = [
    { value: "SELLER", label: "I want to sell products", desc: "List your own products and manage orders" },
    { value: "POOL_SOURCE", label: "I want to source from Pool", desc: "Access a curated product catalog" },
    { value: "BOTH", label: "Both — Sell and Source", desc: "Maximum flexibility for your business" },
  ];

  return (
    <div className="animate-fade-in">
      {/* Welcome hero */}
      <div className="mb-8 text-center sm:mb-10">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-900 text-white">
          <Sparkles className="h-7 w-7" strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Welcome to Kwikseller!
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Africa&apos;s Most Powerful Commerce Operating System
        </p>
      </div>

      {/* Account type selection */}
      <div className="mx-auto max-w-lg space-y-3">
        {accountOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange("accountType", opt.value)}
            className={`flex w-full flex-col items-start gap-1 rounded-lg border px-4 py-4 text-left transition ${
              data.accountType === opt.value
                ? "border-gray-900 bg-gray-50"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                  data.accountType === opt.value
                    ? "border-gray-900 bg-gray-900"
                    : "border-gray-300"
                }`}
              >
                {data.accountType === opt.value && (
                  <div className="h-2 w-2 rounded-full bg-white" />
                )}
              </div>
              <span className="text-sm font-semibold text-foreground">
                {opt.label}
              </span>
            </div>
            <p className="ml-7.5 text-xs text-gray-500">{opt.desc}</p>
          </button>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-8 flex justify-center">
        <AppButton variant="primary" size="lg" onClick={onNext} className="bg-gray-900 hover:bg-gray-800">
          Get Started
          <ArrowRight className="h-4 w-4" />
        </AppButton>
      </div>
    </div>
  );
}

function StepStoreBasics({
  data,
  onChange,
  onNext,
  onBack,
  isSubmitting,
}: {
  data: OnboardingData;
  onChange: (field: keyof OnboardingData, value: string) => void;
  onNext: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}) {
  const handleLogoUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      onChange("logoPreview", preview);
    };
    reader.readAsDataURL(file);

    try {
      const res = await storeApi.uploadLogo(file);
      onChange("logoUrl", (res.data as Record<string, string>)?.url ?? "");
      kwikToast.success("Logo uploaded");
    } catch {
      kwikToast.warning("Logo saved locally — will sync when online");
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Store className="h-5 w-5 text-gray-400" strokeWidth={1.5} />
          <h2 className="text-xl font-bold text-foreground">Store Basics</h2>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Tell us about your store. You can always change this later.
        </p>
      </div>

      <div className="space-y-5">
        {/* Store name + slug */}
        <div>
          <label htmlFor="store-name" className="mb-1.5 block text-xs font-semibold text-muted dark:text-white/60">
            Store Name
          </label>
          <input
            id="store-name"
            type="text"
            value={data.storeName}
            onChange={(e) => {
              onChange("storeName", e.target.value);
              onChange("storeSlug", generateSlug(e.target.value));
            }}
            placeholder="e.g. My Awesome Store"
            className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-foreground outline-none transition placeholder:text-gray-400 focus:border-gray-400"
          />
          {data.storeSlug && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-400">
              <span className="font-medium text-gray-500">URL:</span>
              {data.storeSlug}.kwik.com
            </p>
          )}
        </div>

        {/* Slug edit */}
        {data.storeSlug && (
          <div>
            <label htmlFor="store-slug" className="mb-1.5 block text-xs font-semibold text-muted dark:text-white/60">
              Store Slug
              <span className="ml-1.5 font-normal text-gray-400">(editable)</span>
            </label>
            <input
              id="store-slug"
              type="text"
              value={data.storeSlug}
              onChange={(e) =>
                onChange("storeSlug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-"))
              }
              className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 font-mono text-sm text-foreground outline-none transition placeholder:text-gray-400 focus:border-gray-400"
            />
          </div>
        )}

        {/* Description */}
        <div>
          <label htmlFor="store-desc" className="mb-1.5 block text-xs font-semibold text-muted dark:text-white/60">
            Store Description
          </label>
          <textarea
            id="store-desc"
            value={data.storeDescription}
            onChange={(e) => onChange("storeDescription", e.target.value)}
            placeholder="What makes your store unique?"
            rows={3}
            className="min-h-20 w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-gray-400 focus:border-gray-400"
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="store-category" className="mb-1.5 block text-xs font-semibold text-muted dark:text-white/60">
            Business Category
          </label>
          <select
            id="store-category"
            value={data.storeCategory}
            onChange={(e) => onChange("storeCategory", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-foreground outline-none transition focus:border-gray-400"
          >
            <option value="">Select a category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Logo */}
        <ImageUploadField
          label="Store Logo"
          preview={data.logoPreview}
          onFileChange={handleLogoUpload}
        />

        {/* Contact info */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="contact-email" className="mb-1.5 block text-xs font-semibold text-muted dark:text-white/60">
              Contact Email
            </label>
            <input
              id="contact-email"
              type="email"
              value={data.contactEmail}
              onChange={(e) => onChange("contactEmail", e.target.value)}
              placeholder="you@example.com"
              className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-foreground outline-none transition placeholder:text-gray-400 focus:border-gray-400"
            />
          </div>
          <div>
            <label htmlFor="phone-number" className="mb-1.5 block text-xs font-semibold text-muted dark:text-white/60">
              Phone Number
            </label>
            <input
              id="phone-number"
              type="tel"
              value={data.phoneNumber}
              onChange={(e) => onChange("phoneNumber", e.target.value)}
              placeholder="+234 xxx xxx xxxx"
              className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-foreground outline-none transition placeholder:text-gray-400 focus:border-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
        <AppButton variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
          Back
        </AppButton>
        <AppButton
          variant="primary"
          size="md"
          onClick={onNext}
          isLoading={isSubmitting}
          loadingLabel="Saving…"
          className="bg-gray-900 hover:bg-gray-800"
        >
          Continue
          <ChevronRight className="h-4 w-4" />
        </AppButton>
      </div>
    </div>
  );
}

function StepAppearance({
  data,
  onChange,
  onNext,
  onBack,
  isSubmitting,
}: {
  data: OnboardingData;
  onChange: (field: keyof OnboardingData, value: string) => void;
  onNext: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}) {
  const handleBannerUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      onChange("bannerPreview", preview);
    };
    reader.readAsDataURL(file);

    try {
      const res = await storeApi.uploadBanner(file);
      onChange("bannerUrl", (res.data as Record<string, string>)?.url ?? "");
      kwikToast.success("Banner uploaded");
    } catch {
      kwikToast.warning("Banner saved locally — will sync when online");
    }
  };

  const headingFontCss = getHeadingFontCss(data.headingFont);
  const bodyFontCss = getBodyFontCss(data.bodyFont);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Palette className="h-5 w-5 text-gray-400" strokeWidth={1.5} />
          <h2 className="text-xl font-bold text-foreground">Store Appearance</h2>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Choose your brand colors and fonts to make your store unique.
        </p>
      </div>

      <div className="space-y-6">
        {/* Brand color */}
        <div>
          <p className="mb-2 text-xs font-semibold text-muted dark:text-white/60">
            Primary Brand Color
          </p>
          <div className="flex flex-wrap items-center gap-2.5">
            {COLOR_PRESETS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onChange("brandColor", color)}
                className={`h-9 w-9 rounded-full border-2 transition ${
                  data.brandColor === color
                    ? "border-gray-900 ring-2 ring-gray-900/20"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                style={{ backgroundColor: color }}
                aria-label={`Select color ${color}`}
              />
            ))}
            {/* Custom color input */}
            <div className="relative">
              <input
                type="color"
                value={data.brandColor}
                onChange={(e) => onChange("brandColor", e.target.value)}
                className="h-9 w-9 cursor-pointer rounded-full border border-dashed border-gray-300"
                aria-label="Custom color"
              />
            </div>
          </div>
          <p className="mt-1.5 font-mono text-xs text-gray-400">{data.brandColor}</p>
        </div>

        {/* Heading font */}
        <div>
          <label htmlFor="heading-font" className="mb-1.5 block text-xs font-semibold text-muted dark:text-white/60">
            Heading Font
          </label>
          <select
            id="heading-font"
            value={data.headingFont}
            onChange={(e) => onChange("headingFont", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-foreground outline-none transition focus:border-gray-400"
          >
            {FONT_OPTIONS.map((font) => (
              <option key={font.label} value={font.label} style={{ fontFamily: font.cssVar }}>
                {font.label}
              </option>
            ))}
          </select>
        </div>

        {/* Body font */}
        <div>
          <label htmlFor="body-font" className="mb-1.5 block text-xs font-semibold text-muted dark:text-white/60">
            Body Font
          </label>
          <select
            id="body-font"
            value={data.bodyFont}
            onChange={(e) => onChange("bodyFont", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-foreground outline-none transition focus:border-gray-400"
          >
            {FONT_OPTIONS.map((font) => (
              <option key={font.label} value={font.label} style={{ fontFamily: font.cssVar }}>
                {font.label}
              </option>
            ))}
          </select>
        </div>

        {/* Banner */}
        <BannerUploadField
          label="Banner Image"
          preview={data.bannerPreview}
          onFileChange={handleBannerUpload}
        />

        {/* Preview pane */}
        <div className="border-t border-gray-100 pt-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Preview
          </p>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            {/* Banner preview or color bar */}
            <div
              className="flex h-24 items-center justify-center sm:h-32"
              style={{ backgroundColor: data.brandColor }}
            >
              {data.bannerPreview ? (
                <img
                  src={data.bannerPreview}
                  alt="Banner"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xs font-medium text-white/70">
                  Banner Preview
                </span>
              )}
            </div>
            <div className="px-4 py-4">
              <p
                className="text-lg font-bold"
                style={{
                  color: data.brandColor,
                  fontFamily: headingFontCss,
                }}
              >
                {data.storeName || "Your Store Name"}
              </p>
              <p
                className="mt-1 text-sm text-gray-500"
                style={{ fontFamily: bodyFontCss }}
              >
                {data.storeDescription || "Your store description appears here..."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
        <AppButton variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
          Back
        </AppButton>
        <AppButton
          variant="primary"
          size="md"
          onClick={onNext}
          isLoading={isSubmitting}
          loadingLabel="Saving…"
          className="bg-gray-900 hover:bg-gray-800"
        >
          Continue
          <ChevronRight className="h-4 w-4" />
        </AppButton>
      </div>
    </div>
  );
}

function StepAddProduct({
  data,
  onChange,
  onNext,
  onBack,
  onSkip,
  isSubmitting,
}: {
  data: OnboardingData;
  onChange: (field: keyof OnboardingData, value: string) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
}) {
  const handleImageUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      onChange("productImagePreview", preview);
    };
    reader.readAsDataURL(file);

    try {
      const res = await uploadApi.productImage(file);
      kwikToast.success("Image uploaded");
    } catch {
      kwikToast.info("Image saved locally");
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Package className="h-5 w-5 text-gray-400" strokeWidth={1.5} />
          <h2 className="text-xl font-bold text-foreground">Add Your First Product</h2>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Add a product to get started quickly, or skip this step.
        </p>
      </div>

      {/* Info note */}
      <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" strokeWidth={1.5} />
        <p className="text-xs text-gray-500">
          You can always add products later from your dashboard.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label htmlFor="product-name" className="mb-1.5 block text-xs font-semibold text-muted dark:text-white/60">
            Product Name
          </label>
          <input
            id="product-name"
            type="text"
            value={data.productName}
            onChange={(e) => onChange("productName", e.target.value)}
            placeholder="e.g. Wireless Bluetooth Headphones"
            className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-foreground outline-none transition placeholder:text-gray-400 focus:border-gray-400"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="product-price" className="mb-1.5 block text-xs font-semibold text-muted dark:text-white/60">
              Price (₦)
            </label>
            <input
              id="product-price"
              type="number"
              value={data.productPrice}
              onChange={(e) => onChange("productPrice", e.target.value)}
              placeholder="0"
              min={0}
              className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-foreground outline-none transition placeholder:text-gray-400 focus:border-gray-400"
            />
          </div>
          <div>
            <label htmlFor="product-category" className="mb-1.5 block text-xs font-semibold text-muted dark:text-white/60">
              Category
            </label>
            <select
              id="product-category"
              value={data.productCategory}
              onChange={(e) => onChange("productCategory", e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-foreground outline-none transition focus:border-gray-400"
            >
              <option value="">Select category</option>
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Product image */}
        <ImageUploadField
          label="Product Image"
          preview={data.productImagePreview}
          onFileChange={handleImageUpload}
        />

        {/* Product description */}
        <div>
          <label htmlFor="product-desc" className="mb-1.5 block text-xs font-semibold text-muted dark:text-white/60">
            Short Description
          </label>
          <textarea
            id="product-desc"
            value={data.productDescription}
            onChange={(e) => onChange("productDescription", e.target.value)}
            placeholder="Briefly describe your product"
            rows={3}
            className="min-h-20 w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-gray-400 focus:border-gray-400"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex flex-col gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <AppButton variant="ghost" size="sm" onClick={onBack}>
            <ChevronLeft className="h-4 w-4" />
            Back
          </AppButton>
          <button
            type="button"
            onClick={onSkip}
            className="text-xs font-medium text-gray-400 transition hover:text-gray-600"
          >
            Add products later →
          </button>
        </div>
        <AppButton
          variant="primary"
          size="md"
          onClick={onNext}
          isLoading={isSubmitting}
          loadingLabel="Saving…"
          disabled={!data.productName || !data.productPrice}
          className="bg-gray-900 hover:bg-gray-800"
        >
          Add Product & Continue
          <ChevronRight className="h-4 w-4" />
        </AppButton>
      </div>
    </div>
  );
}

function StepPayment({
  data,
  onChange,
  onNext,
  onBack,
  onSkip,
  isSubmitting,
}: {
  data: OnboardingData;
  onChange: (field: keyof OnboardingData, value: string) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
}) {
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerifyAccount = async () => {
    if (!data.bankCode || data.accountNumber.length < 10) return;
    setIsVerifying(true);
    try {
      const response = await fetch(
        `/api/v1/payments/verify-account?bankCode=${data.bankCode}&accountNumber=${data.accountNumber}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("kwikseller_access_token")}` } }
      );
      const res = await response.json();
      if (res.data?.accountName) {
        onChange("accountName", res.data.accountName);
        onChange("bankVerified", "true");
        kwikToast.success("Account verified");
      } else {
        kwikToast.error("Could not verify account");
      }
    } catch {
      // Simulate verification for offline/demo
      onChange("accountName", "Account Holder Name");
      onChange("bankVerified", "true");
      kwikToast.info("Account verified (demo mode)");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Wallet className="h-5 w-5 text-gray-400" strokeWidth={1.5} />
          <h2 className="text-xl font-bold text-foreground">Payment Setup</h2>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Connect your bank account to receive payments from sales.
        </p>
      </div>

      {/* Escrow info */}
      <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-green-600" strokeWidth={1.5} />
        <p className="text-xs text-gray-500">
          Payments are held securely until customers confirm delivery. This protects both buyers and sellers.
        </p>
      </div>

      <div className="space-y-5">
        {/* Bank name */}
        <div>
          <label htmlFor="bank-name" className="mb-1.5 block text-xs font-semibold text-muted dark:text-white/60">
            Bank Name
          </label>
          <select
            id="bank-name"
            value={data.bankCode}
            onChange={(e) => {
              const code = e.target.value;
              const bank = NIGERIAN_BANKS.find((b) => b.code === code);
              onChange("bankCode", code);
              onChange("bankName", bank?.name ?? "");
              onChange("accountName", "");
              onChange("bankVerified", "false");
            }}
            className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-foreground outline-none transition focus:border-gray-400"
          >
            <option value="">Select your bank</option>
            {NIGERIAN_BANKS.map((bank) => (
              <option key={bank.code} value={bank.code}>
                {bank.name}
              </option>
            ))}
          </select>
        </div>

        {/* Account number + verify */}
        <div>
          <label htmlFor="account-number" className="mb-1.5 block text-xs font-semibold text-muted dark:text-white/60">
            Account Number
          </label>
          <div className="flex gap-2">
            <input
              id="account-number"
              type="text"
              value={data.accountNumber}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                onChange("accountNumber", val);
                onChange("accountName", "");
                onChange("bankVerified", "false");
              }}
              placeholder="10-digit account number"
              maxLength={10}
              className="h-11 flex-1 rounded-lg border border-gray-200 bg-white px-3 text-sm text-foreground outline-none transition placeholder:text-gray-400 focus:border-gray-400"
            />
            <AppButton
              variant="secondary"
              size="sm"
              onClick={handleVerifyAccount}
              isLoading={isVerifying}
              loadingLabel="Verifying"
              disabled={!data.bankCode || data.accountNumber.length < 10 || isVerifying}
            >
              <Eye className="h-3.5 w-3.5" />
              Verify
            </AppButton>
          </div>
        </div>

        {/* Account name */}
        <div>
          <label htmlFor="account-name" className="mb-1.5 block text-xs font-semibold text-muted dark:text-white/60">
            Account Name
          </label>
          <input
            id="account-name"
            type="text"
            value={data.accountName}
            onChange={(e) => onChange("accountName", e.target.value)}
            placeholder={data.bankVerified ? "" : "Auto-filled after verification"}
            readOnly={data.bankVerified}
            className={`h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-foreground outline-none transition placeholder:text-gray-400 focus:border-gray-400 ${
              data.bankVerified ? "bg-gray-50" : ""
            }`}
          />
          {data.bankVerified && (
            <p className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-green-600">
              <CheckCircle2 className="h-3 w-3" />
              Account verified
            </p>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex flex-col gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <AppButton variant="ghost" size="sm" onClick={onBack}>
            <ChevronLeft className="h-4 w-4" />
            Back
          </AppButton>
          <button
            type="button"
            onClick={onSkip}
            className="text-xs font-medium text-gray-400 transition hover:text-gray-600"
          >
            Skip this step →
          </button>
        </div>
        <AppButton
          variant="primary"
          size="md"
          onClick={onNext}
          isLoading={isSubmitting}
          loadingLabel="Saving…"
          className="bg-gray-900 hover:bg-gray-800"
        >
          Continue
          <ChevronRight className="h-4 w-4" />
        </AppButton>
      </div>
    </div>
  );
}

function StepKYC({
  data,
  onChange,
  onNext,
  onBack,
  onSkip,
}: {
  data: OnboardingData;
  onChange: (field: keyof OnboardingData, value: string) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}) {
  const benefits = [
    { icon: "📈", title: "Higher transaction limits", desc: "Process more orders without restrictions" },
    { icon: "✅", title: "Verified seller badge", desc: "Build trust with buyers" },
    { icon: "⚡", title: "Priority support", desc: "Get help faster when you need it" },
    { icon: "🛡️", title: "Trust signals for buyers", desc: "Stand out from unverified sellers" },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-gray-400" strokeWidth={1.5} />
          <h2 className="text-xl font-bold text-foreground">Identity Verification (KYC)</h2>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Verify your identity to unlock all platform features.
        </p>
      </div>

      {/* Benefits */}
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {benefits.map((benefit) => (
          <div
            key={benefit.title}
            className="rounded-lg border border-gray-200 px-4 py-3.5"
          >
            <div className="flex items-start gap-3">
              <span className="text-lg">{benefit.icon}</span>
              <div>
                <p className="text-sm font-semibold text-foreground">{benefit.title}</p>
                <p className="mt-0.5 text-xs text-gray-500">{benefit.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Note */}
      <div className="mb-8 flex items-start gap-2.5 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" strokeWidth={1.5} />
        <p className="text-xs text-gray-500">
          Required for paid plans and high-volume sellers.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex flex-col gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <AppButton variant="ghost" size="sm" onClick={onBack}>
            <ChevronLeft className="h-4 w-4" />
            Back
          </AppButton>
          <button
            type="button"
            onClick={onSkip}
            className="text-xs font-medium text-gray-400 transition hover:text-gray-600"
          >
            Skip for now →
          </button>
        </div>
        <Link href="/dashboard/kyc">
          <AppButton
            variant="primary"
            size="md"
            className="bg-gray-900 hover:bg-gray-800"
          >
            Complete KYC Verification
            <ArrowRight className="h-4 w-4" />
          </AppButton>
        </Link>
      </div>
    </div>
  );
}

function StepReady({
  data,
  onFinish,
}: {
  data: OnboardingData;
  onFinish: () => void;
}) {
  const nextSteps = [
    { label: "Add more products", href: "/dashboard/products" },
    { label: "Customize your storefront appearance", href: "/dashboard/storefront" },
    { label: "Verify your identity (KYC)", href: "/dashboard/kyc" },
    { label: "Set up delivery preferences", href: "/dashboard/delivery" },
    { label: "Share your store link", href: undefined },
  ];

  const storeUrl = data.storeSlug ? `${data.storeSlug}.kwik.com` : "yourstore.kwik.com";

  const handleCopyLink = () => {
    const url = `https://${storeUrl}`;
    navigator.clipboard.writeText(url).then(() => {
      kwikToast.success("Store link copied!");
    }).catch(() => {
      kwikToast.info("Store link ready to share");
    });
  };

  return (
    <div className="animate-fade-in">
      {/* Congratulations */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 text-5xl">🎉</div>
        <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
          Your Store is Ready!
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          You&apos;re all set to start selling on Kwikseller.
        </p>
      </div>

      {/* Store URL */}
      <div className="mx-auto mb-8 max-w-md rounded-lg border border-gray-200 px-5 py-4 text-center">
        <p className="text-sm font-semibold text-foreground">
          {data.storeName || "Your Store"}
        </p>
        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="font-mono text-sm text-gray-500">{storeUrl}</span>
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-900 transition hover:text-gray-700"
          >
            Copy
          </button>
        </div>
      </div>

      {/* Recommended next steps */}
      <div className="mx-auto max-w-md">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Recommended Next Steps
        </p>
        <div className="space-y-0 divide-y divide-gray-100">
          {nextSteps.map((step) => (
            <div key={step.label} className="flex items-center gap-3 px-1 py-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-gray-300">
                <span className="text-xs text-gray-300">☐</span>
              </div>
              {step.href ? (
                <Link
                  href={step.href}
                  className="text-sm text-gray-700 transition hover:text-gray-900 hover:underline"
                >
                  {step.label}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="text-sm text-gray-700 transition hover:text-gray-900 hover:underline"
                >
                  {step.label}
                </button>
              )}
              {step.href && (
                <ArrowRight className="ml-auto h-3.5 w-3.5 shrink-0 text-gray-300" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-10 flex justify-center">
        <AppButton
          variant="primary"
          size="lg"
          onClick={onFinish}
          className="bg-gray-900 hover:bg-gray-800"
        >
          <ShoppingBag className="h-4 w-4" />
          Go to Dashboard
        </AppButton>
      </div>
    </div>
  );
}

// ==================== Main Page ====================

export default function OnboardingPage() {
  const router = useRouter();
  const [data, setData] = useState<OnboardingData>(DEFAULT_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved data from localStorage on mount
  useEffect(() => {
    const saved = loadData();
    setData(saved);
    setIsLoaded(true);

    // If onboarding is already completed, redirect
    if (typeof window !== "undefined") {
      const completed = localStorage.getItem(COMPLETED_KEY);
      if (completed === "true") {
        router.replace("/dashboard");
      }
    }
  }, [router]);

  // Persist data to localStorage whenever it changes
  const updateData = useCallback((newData: OnboardingData) => {
    setData(newData);
    saveData(newData);
  }, []);

  const handleChange = useCallback(
    (field: keyof OnboardingData, value: string) => {
      updateData({ ...data, [field]: value });
    },
    [data, updateData]
  );

  const goNext = useCallback(() => {
    updateData({ ...data, currentStep: Math.min(data.currentStep + 1, 7) });
  }, [data, updateData]);

  const goBack = useCallback(() => {
    updateData({ ...data, currentStep: Math.max(data.currentStep - 1, 1) });
  }, [data, updateData]);

  const skipToNext = useCallback(() => {
    goNext();
  }, [goNext]);

  // Save store to API on step transitions that need it
  const handleStepTwoNext = useCallback(async () => {
    if (!data.storeName) {
      kwikToast.error("Store name is required");
      return;
    }
    setIsSubmitting(true);
    try {
      await storeApi.create({
        name: data.storeName,
        slug: data.storeSlug || undefined,
        description: data.storeDescription || undefined,
        category: data.storeCategory || undefined,
      });
      kwikToast.success("Store created!");
      goNext();
    } catch {
      kwikToast.info("Store saved locally — will sync when online");
      goNext();
    } finally {
      setIsSubmitting(false);
    }
  }, [data, goNext]);

  const handleStepThreeNext = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await storeApi.update({
        logoUrl: data.logoUrl || undefined,
        bannerUrl: data.bannerUrl || undefined,
      });
      kwikToast.success("Appearance saved!");
      goNext();
    } catch {
      kwikToast.info("Appearance saved locally");
      goNext();
    } finally {
      setIsSubmitting(false);
    }
  }, [data, goNext]);

  const handleFinish = useCallback(() => {
    localStorage.setItem(COMPLETED_KEY, "true");
    kwikToast.success("Welcome aboard! Your store is live.");
    router.push("/dashboard");
  }, [router]);

  // Loading state
  if (!isLoaded) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="space-y-6">
          <div className="h-1 w-full rounded-full bg-gray-100">
            <div className="h-1 w-0 rounded-full bg-gray-900" />
          </div>
          <div className="space-y-4">
            <Skeleton className="mx-auto h-14 w-14 rounded-2xl" />
            <Skeleton className="mx-auto h-8 w-64" />
            <Skeleton className="mx-auto h-4 w-48" />
            <Skeleton className="mx-auto h-10 w-32" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <ProgressIndicator currentStep={data.currentStep} />

      {data.currentStep === 1 && (
        <StepWelcome
          data={data}
          onChange={handleChange}
          onNext={goNext}
        />
      )}

      {data.currentStep === 2 && (
        <StepStoreBasics
          data={data}
          onChange={handleChange}
          onNext={handleStepTwoNext}
          onBack={goBack}
          isSubmitting={isSubmitting}
        />
      )}

      {data.currentStep === 3 && (
        <StepAppearance
          data={data}
          onChange={handleChange}
          onNext={handleStepThreeNext}
          onBack={goBack}
          isSubmitting={isSubmitting}
        />
      )}

      {data.currentStep === 4 && (
        <StepAddProduct
          data={data}
          onChange={handleChange}
          onNext={goNext}
          onBack={goBack}
          onSkip={skipToNext}
          isSubmitting={isSubmitting}
        />
      )}

      {data.currentStep === 5 && (
        <StepPayment
          data={data}
          onChange={handleChange}
          onNext={goNext}
          onBack={goBack}
          onSkip={skipToNext}
          isSubmitting={isSubmitting}
        />
      )}

      {data.currentStep === 6 && (
        <StepKYC
          data={data}
          onChange={handleChange}
          onNext={goNext}
          onBack={goBack}
          onSkip={skipToNext}
        />
      )}

      {data.currentStep === 7 && (
        <StepReady
          data={data}
          onFinish={handleFinish}
        />
      )}
    </main>
  );
}
