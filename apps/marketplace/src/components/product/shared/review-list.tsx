"use client";

import React from "react";
import { Star, Check, ThumbsUp, Store, BadgeCheck, MessageSquareOff } from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import { cn } from "@/lib/utils";
import { formatRelativeDate } from "./format";
import type { MarketplaceReview } from "@/data/marketplace-home";

interface ReviewListProps {
  reviews: MarketplaceReview[];
  /** Track voted review IDs (local state). */
  votedReviewIds?: Set<string>;
  onHelpfulVote?: (reviewId: string) => void;
  onPhotoClick?: (src: string, alt: string) => void;
  className?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

/**
 * Reusable list of customer review cards.
 * Shows stars, verified badge, title, body, photos, vendor reply, author,
 * date, and a helpful-vote button.
 * NO gradients — clean, solid colors only.
 */
export function ReviewList({
  reviews,
  votedReviewIds,
  onHelpfulVote,
  onPhotoClick,
  className,
  emptyTitle = "No reviews yet",
  emptyDescription = "Be the first to share your experience with this product.",
}: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-10 text-center", className)}>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-kwik-bg-surface dark:bg-white/5">
          <MessageSquareOff className="h-6 w-6 text-kwik-muted dark:text-white/40" />
        </div>
        <p className="mt-3 text-sm font-semibold text-kwik-dark dark:text-white">{emptyTitle}</p>
        <p className="mt-1 text-xs text-kwik-muted dark:text-white/55">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2", className)}>
      {reviews.map((review) => {
        const voted = votedReviewIds?.has(review.id) ?? false;
        const helpfulCount = (review.helpful ?? 0) + (voted ? 1 : 0);
        return (
          <article
            key={review.id}
            className="border border-border p-5 transition-colors hover:border-kwik-orange/30 dark:border-white/10"
          >
            {/* Stars + verified */}
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star
                    key={`${review.id}-${idx}`}
                    className={cn(
                      "h-4 w-4",
                      idx < review.rating
                        ? "fill-kwik-star text-kwik-star"
                        : "fill-none text-kwik-border-light dark:text-white/20",
                    )}
                  />
                ))}
              </div>
              {review.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-300">
                  <Check className="h-3 w-3" /> Verified Purchase
                </span>
              )}
            </div>

            {/* Title */}
            {review.title && (
              <p className="text-sm font-semibold text-kwik-dark dark:text-white">{review.title}</p>
            )}

            {/* Body */}
            <p className="mt-1 text-sm leading-6 text-kwik-gray dark:text-white/65">{review.text}</p>

            {/* Photos */}
            {review.images && review.images.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {review.images.map((img, i) => (
                  <button
                    type="button"
                    key={`${review.id}-img-${i}`}
                    onClick={() => onPhotoClick?.(img, `${review.name}'s photo ${i + 1}`)}
                    className="relative h-16 w-16 overflow-hidden rounded-lg border border-border bg-kwik-bg-surface transition-transform hover:scale-105 dark:border-white/10 dark:bg-white/5"
                    aria-label={`View photo ${i + 1} from ${review.name}`}
                  >
                    <AppImage src={img} alt={`${review.name}'s photo ${i + 1}`} className="h-full w-full" objectFit="cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Vendor reply */}
            {review.vendorReply && (
              <div className="mt-4 rounded-xl border border-kwik-orange/20 bg-kwik-orange-tint/40 p-3 dark:bg-white/5">
                <div className="flex items-start gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-kwik-orange text-white">
                    <Store className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <p className="text-sm font-semibold text-kwik-dark dark:text-white">
                        {review.vendorReply.authorName}
                      </p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-kwik-orange/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-kwik-orange-dark dark:text-kwik-orange">
                        <BadgeCheck className="h-2.5 w-2.5" />
                        Seller
                      </span>
                      {review.vendorReply.createdAt && (
                        <span className="text-[11px] text-kwik-muted dark:text-white/45">
                          · {formatRelativeDate(review.vendorReply.createdAt)}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-kwik-dark/90 dark:text-white/80">
                      {review.vendorReply.text}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer: author + date + helpful */}
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3 dark:border-white/10">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-kwik-orange text-xs font-bold text-white">
                  {review.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-kwik-dark dark:text-white">
                    {review.name}
                  </p>
                  <p className="truncate text-xs text-kwik-muted dark:text-white/55">
                    {review.location}
                    {review.createdAt && (
                      <>
                        {" · "}
                        {formatRelativeDate(review.createdAt)}
                      </>
                    )}
                  </p>
                </div>
              </div>
              {onHelpfulVote && (
                <button
                  type="button"
                  onClick={() => onHelpfulVote(review.id)}
                  disabled={voted}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
                    voted
                      ? "border-kwik-orange bg-kwik-orange-tint text-kwik-orange-dark"
                      : "border-border text-kwik-gray hover:border-kwik-orange/40 hover:text-kwik-orange dark:text-white/65",
                  )}
                  aria-pressed={voted}
                  aria-label="Mark this review as helpful"
                >
                  <ThumbsUp className="h-3 w-3" />
                  {helpfulCount > 0 ? helpfulCount : "Helpful"}
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
