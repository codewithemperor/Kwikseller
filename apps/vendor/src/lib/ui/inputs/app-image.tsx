"use client";

import { useState } from "react";
import { Home, ImageOff, ShoppingBag, Smartphone } from "lucide-react";
import { cn } from "../lib/utils";

export type AppImageFallbackVariant = "default" | "product";

export interface AppImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  iconClassName?: string;
  width?: number | string;
  height?: number | string;
  objectFit?: "cover" | "contain" | "fill" | "none";
  unoptimized?: boolean;
  fallbackVariant?: AppImageFallbackVariant;
  fallbackHint?: string;
}

/**
 * AppImage - A shared, resilient image component with graceful fallbacks.
 *
 * Promoted from the marketplace-local `app-image.tsx` so that the vendor app
 * (and any future app) can consume the same product-placeholder experience.
 * The marketplace keeps its own local re-export for backwards compatibility.
 *
 * - Shows a contextual product placeholder (ShoppingBag / Smartphone / Home)
 *   when `fallbackVariant="product"` and the src is missing/broken.
 * - Shows a generic ImageOff placeholder otherwise.
 * - Pulses a skeleton while loading.
 */
export function AppImage({
  src,
  alt,
  className,
  fallbackClassName,
  iconClassName,
  objectFit = "cover",
  fallbackVariant = "default",
  fallbackHint,
}: AppImageProps) {
  const [error, setError] = useState(!src);
  const [loaded, setLoaded] = useState(false);

  if (error || !src) {
    const hint = (fallbackHint || alt).toLowerCase();
    const ProductFallbackIcon =
      hint.includes("elect") || hint.includes("phone") || hint.includes("tech")
        ? Smartphone
        : hint.includes("home") || hint.includes("furn") || hint.includes("kitchen")
          ? Home
          : ShoppingBag;

    return (
      <div
        className={cn(
          "flex items-center justify-center",
          fallbackVariant === "product"
            ? "bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
            : "bg-neutral-200 dark:bg-neutral-800",
          fallbackClassName || className,
        )}
      >
        {fallbackVariant === "product" ? (
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/70 dark:bg-black/20">
              <ProductFallbackIcon className={cn("h-7 w-7", iconClassName)} />
            </div>
            <span className="text-xs font-semibold tracking-wide text-neutral-600 dark:text-neutral-300">
              Kwikseller
            </span>
          </div>
        ) : (
          <ImageOff
            className={cn(
              "h-8 w-8 text-neutral-400 dark:text-neutral-600",
              iconClassName,
            )}
          />
        )}
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-200 animate-pulse dark:bg-neutral-800">
          <ImageOff className="h-8 w-8 text-neutral-400 dark:text-neutral-600" />
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={cn(
          "h-full w-full transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
          className,
        )}
        style={{ objectFit }}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
}

export default AppImage;
