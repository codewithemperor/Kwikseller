"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: string[];
  alt: string;
  /** "compact" = quick view (no lightbox, smaller thumbs).
   *  "full" = product detail page (with lightbox, larger thumbs). */
  variant?: "compact" | "full";
  className?: string;
  /** Aspect ratio of the main image container. */
  aspectRatio?: "square" | "4/5" | "1.05/1";
  /** When true (PDP desktop), the gallery fills the available viewport
   *  height (minus the header) via flex instead of a fixed aspect ratio,
   *  so the whole gallery — main image + thumbnails — stays visible while
   *  the product information column scrolls. Mobile always uses aspect ratio. */
  fillViewport?: boolean;
}

/**
 * Reusable product image gallery.
 *
 * - Consistent aspect ratio (no distortion — uses object-contain).
 * - Thumbnail navigation when multiple images exist.
 * - Clear active-image state (ring highlight).
 * - Swipe support on touch devices.
 * - Optional lightbox in "full" variant.
 * - NO gradients, NO unnecessary cropping.
 * - Adapts naturally to available width on small screens.
 */
export function ProductGallery({
  images,
  alt,
  variant = "full",
  className,
  aspectRatio = "1.05/1",
  fillViewport = false,
}: ProductGalleryProps) {
  const gallery = React.useMemo(
    () => (images.length > 0 ? images : [""]),
    [images],
  );
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);

  // Reset index when images change (e.g. variant changes the image set)
  React.useEffect(() => {
    if (activeIndex > gallery.length - 1) setActiveIndex(0);
  }, [activeIndex, gallery.length]);

  const activeImage = gallery[activeIndex] ?? gallery[0] ?? "";

  const setActiveWithTransition = React.useCallback(
    (index: number) => {
      if (index === activeIndex || isTransitioning) return;
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveIndex(index);
        setTimeout(() => setIsTransitioning(false), 50);
      }, 150);
    },
    [activeIndex, isTransitioning],
  );

  const goTo = React.useCallback(
    (dir: "prev" | "next") => {
      if (gallery.length <= 1) return;
      const next =
        dir === "prev"
          ? activeIndex <= 0
            ? gallery.length - 1
            : activeIndex - 1
          : activeIndex >= gallery.length - 1
            ? 0
            : activeIndex + 1;
      setActiveWithTransition(next);
    },
    [activeIndex, gallery.length, setActiveWithTransition],
  );

  // Touch / swipe
  const touchStart = React.useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(diff) > 50) goTo(diff < 0 ? "next" : "prev");
    touchStart.current = null;
  };

  const aspectClass =
    aspectRatio === "square"
      ? "aspect-square"
      : aspectRatio === "4/5"
        ? "aspect-[4/5]"
        : "aspect-[1.05/1]";

  const thumbSize = variant === "compact" ? "h-14 w-14 sm:h-16 sm:w-16" : "h-16 w-16 sm:h-20 sm:w-20";

  return (
    <div className={cn("flex flex-col gap-3", fillViewport && "lg:h-full", className)}>
      {/* Main image */}
      <div
        className={cn(
          "group relative overflow-hidden rounded-lg bg-neutral-100 ring-1 ring-border dark:bg-white/5 dark:ring-white/10",
          aspectClass,
          fillViewport && "lg:aspect-auto lg:min-h-0 lg:flex-1",
        )}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <motion.div
          animate={{ opacity: isTransitioning ? 0 : 1 }}
          transition={{ duration: 0.15 }}
          className="h-full w-full"
        >
          <AppImage
            src={activeImage}
            alt={alt}
            className="h-full w-full"
            objectFit="cover"
            fallbackVariant="product"
            fallbackHint={alt}
          />
        </motion.div>

        {/* Navigation arrows (only when >1 image) */}
        {gallery.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goTo("prev");
              }}
              className="absolute left-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 shadow-md backdrop-blur-sm transition-colors hover:text-kwik-orange dark:bg-black/40"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goTo("next");
              }}
              className="absolute right-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 shadow-md backdrop-blur-sm transition-colors hover:text-kwik-orange dark:bg-black/40"
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Image counter */}
            <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center rounded-full bg-background/90 px-3 py-1 text-xs font-semibold shadow-sm backdrop-blur-sm dark:bg-black/40">
              <span className="text-kwik-dark dark:text-white">
                {activeIndex + 1}/{gallery.length}
              </span>
            </div>
          </>
        )}

        {/* Zoom button (full variant only) */}
        {variant === "full" && gallery.length >= 1 && activeImage && (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 shadow-md backdrop-blur-sm transition-colors hover:text-kwik-orange dark:bg-black/40"
            aria-label="Zoom image"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Thumbnails (only when >1 image) */}
      {gallery.length > 1 && (
        <div className="-mx-1 flex shrink-0 gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {gallery.map((image, idx) => (
            <button
              key={`${image}-${idx}`}
              type="button"
              onClick={() => setActiveWithTransition(idx)}
              className={cn(
                "relative flex-none overflow-hidden rounded-lg bg-neutral-100 transition-all duration-200 dark:bg-white/5",
                thumbSize,
                activeIndex === idx
                  ? "ring-2 ring-kwik-orange ring-offset-2 ring-offset-background"
                  : "ring-1 ring-border hover:ring-kwik-orange/50 dark:ring-white/10",
              )}
              aria-label={`View image ${idx + 1}`}
              aria-pressed={activeIndex === idx}
            >
              <AppImage
                src={image}
                alt={`${alt} — Image ${idx + 1}`}
                className="h-full w-full"
                objectFit="contain"
                fallbackVariant="product"
                fallbackHint={alt}
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox (full variant only) */}
      <AnimatePresence>
        {variant === "full" && lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
            onClick={() => setLightboxOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label={`${alt} — fullscreen view`}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxOpen(false);
              }}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Close fullscreen"
            >
              <X className="h-5 w-5" />
            </button>
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="relative max-h-[90vh] max-w-[90vw]"
              onClick={(e) => e.stopPropagation()}
            >
              <AppImage
                src={activeImage}
                alt={alt}
                className="max-h-[90vh] max-w-[90vw] rounded-lg"
                objectFit="contain"
              />
              {gallery.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      goTo("prev");
                    }}
                    className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      goTo("next");
                    }}
                    className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
