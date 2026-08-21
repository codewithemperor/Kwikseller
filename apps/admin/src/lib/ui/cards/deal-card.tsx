"use client";

import React from "react";
import { motion } from "framer-motion";
import { Flame, ShoppingCart, Zap, ImageIcon } from "lucide-react";
import { cn, formatCurrency } from "../lib/utils";

export interface DealCardProps {
  /** Product image URL. */
  image?: string;
  /** Alt text for the image. Defaults to the product name. */
  imageAlt?: string;
  /** Product name. */
  name: string;
  /** Current sale price. */
  price: number;
  /** Original (pre-deal) price. Shown struck-through next to the sale price. */
  comparePrice?: number;
  /** Striking discount label, e.g. "-44%" or "Flash Sale". Always rendered prominently. */
  discountLabel: string;
  /** ISO datetime string. When provided, a live countdown timer is shown. */
  countdownEndsAt?: string;
  /** Optional store / vendor name shown above the product name. */
  storeName?: string;
  /** Link wrapping the card. */
  href?: string;
  /** Fired when the add-to-cart button is pressed. */
  onAddToCart?: () => void;
  /** Extra Tailwind classes. */
  className?: string;
}

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isOver: boolean;
};

/**
 * Calculate the remaining time until the given target date.
 * Returns all-zero + isOver=true when the target has passed.
 */
function getTimeLeft(target: Date): TimeLeft {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true };
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds, isOver: false };
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/**
 * Tiny countdown hook. Re-renders every second until the target date passes,
 * then stops ticking. Returns `null` while waiting for the first effect to
 * fire (so server-rendered markup matches the first client render — avoids
 * hydration mismatch on the displayed digits).
 */
function useCountdown(targetIso?: string): TimeLeft | null {
  if (!targetIso) return null;
  const target = React.useMemo(() => new Date(targetIso), [targetIso]);
  const [timeLeft, setTimeLeft] = React.useState<TimeLeft | null>(null);

  React.useEffect(() => {
    // Set immediately so the UI shows a real value as soon as possible.
    setTimeLeft(getTimeLeft(target));
    const id = window.setInterval(() => {
      const next = getTimeLeft(target);
      setTimeLeft(next);
      if (next.isOver) window.clearInterval(id);
    }, 1000);
    return () => window.clearInterval(id);
  }, [target]);

  return timeLeft;
}

/**
 * Countdown — renders DD:HH:MM:SS in compact monospace tiles. Days are
 * omitted when zero, so a sub-day deal shows just HH:MM:SS.
 */
function Countdown({ targetIso }: { targetIso: string }) {
  const timeLeft = useCountdown(targetIso);

  if (!timeLeft) {
    // Placeholder keeps layout stable before hydration completes.
    return (
      <div
        className="flex items-center gap-1"
        aria-label="Loading countdown"
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="flex h-7 w-7 items-center justify-center rounded bg-gray-950/60 font-mono text-xs font-bold text-white"
          >
            --
          </span>
        ))}
      </div>
    );
  }

  if (timeLeft.isOver) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-danger">
        <Flame className="h-3.5 w-3.5" aria-hidden="true" />
        Deal ended
      </span>
    );
  }

  const segments: Array<{ label: string; value: number }> = [];
  if (timeLeft.days > 0) {
    segments.push({ label: "days", value: timeLeft.days });
  }
  segments.push(
    { label: "hrs", value: timeLeft.hours },
    { label: "min", value: timeLeft.minutes },
    { label: "sec", value: timeLeft.seconds },
  );

  return (
    <div
      className="flex items-center gap-1"
      aria-label={`Deal ends in ${timeLeft.days} days ${timeLeft.hours} hours ${timeLeft.minutes} minutes ${timeLeft.seconds} seconds`}
      role="timer"
    >
      {segments.map((seg, idx) => (
        <React.Fragment key={seg.label}>
          <span className="flex h-7 min-w-[1.75rem] items-center justify-center rounded bg-gray-950/80 px-1 font-mono text-xs font-bold text-white">
            {pad(seg.value)}
          </span>
          {idx < segments.length - 1 && (
            <span className="text-xs font-bold text-white/70" aria-hidden="true">
              :
            </span>
          )}
          <span className="sr-only">{seg.label}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

/**
 * DealCard — flash-deal product card with a prominent discount label and an
 * optional live countdown timer.
 *
 * The card surface uses the kwik-brand gradient (navy → blue → orange) to
 * read as a sale. The discount label is a big white pill in the top-left
 * corner of the image; the live countdown (when `countdownEndsAt` is set)
 * sits in a dark overlay strip at the bottom of the image so it's visible
 * without obscuring the product photo.
 */
export function DealCard({
  image,
  imageAlt,
  name,
  price,
  comparePrice,
  discountLabel,
  countdownEndsAt,
  storeName,
  href,
  onAddToCart,
  className,
}: DealCardProps) {
  const altText = imageAlt ?? name;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart?.();
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      className={cn(
        "group flex w-full flex-col overflow-hidden rounded-2xl border border-secondary-300 bg-background shadow-sm transition-shadow hover:shadow-xl",
        className,
      )}
    >
      <a
        href={href}
        aria-label={`${name} — deal: ${discountLabel}`}
        tabIndex={href ? 0 : -1}
        className="block"
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {image ? (
            <img
              src={image}
              alt={altText}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400"
              aria-hidden="true"
            >
              <ImageIcon className="h-10 w-10" strokeWidth={1.25} />
            </div>
          )}

          {/* Discount label (top-left) */}
          <div className="absolute left-0 top-3 flex items-center gap-1.5">
            <span className="kwik-gradient inline-flex items-center gap-1 rounded-r-full px-3 py-1 text-sm font-extrabold text-white shadow-md">
              <Zap className="h-3.5 w-3.5" aria-hidden="true" />
              {discountLabel}
            </span>
          </div>

          {/* Countdown overlay (bottom of image) */}
          {countdownEndsAt && (
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-gray-950/85 to-transparent px-3 pb-2 pt-8">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-white/85">
                <Flame className="h-3.5 w-3.5 text-secondary-400" aria-hidden="true" />
                Ends in
              </span>
              <Countdown targetIso={countdownEndsAt} />
            </div>
          )}
        </div>
      </a>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {storeName && (
          <span className="truncate text-xs font-medium text-primary-600">
            {storeName}
          </span>
        )}
        <a href={href} aria-label={name} tabIndex={href ? 0 : -1}>
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-foreground">
            {name}
          </h3>
        </a>

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <div className="flex min-w-0 flex-col">
            <span className="text-lg font-extrabold text-secondary-700">
              {formatCurrency(price)}
            </span>
            {comparePrice && comparePrice > price && (
              <span className="text-xs text-gray-400 line-through">
                {formatCurrency(comparePrice)}
              </span>
            )}
          </div>
          {onAddToCart && (
            <button
              type="button"
              onClick={handleAddToCart}
              aria-label={`Add ${name} to cart`}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-secondary-500 px-3 text-xs font-semibold text-white transition hover:bg-secondary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <ShoppingCart className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Grab deal</span>
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export default DealCard;
