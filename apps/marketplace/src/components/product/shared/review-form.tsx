"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Star, X, LogIn, ShoppingBag, CheckCircle2, PenLine } from "lucide-react";
import { useReviewEligibility, useSubmitReview } from "@/lib/api-hooks";
import { useUser } from "@kwikseller/utils";
import { kwikToast } from "@kwikseller/utils";
import { cn } from "@/lib/utils";

interface ReviewFormProps {
  productId: string;
  className?: string;
}

/**
 * Eligibility-aware review form.
 *
 * Review states (spec #11):
 * - Not logged in → prompt to sign in
 * - Logged in but hasn't purchased → "purchase required" message
 * - Already reviewed → "your review" confirmation
 * - Eligible (purchased, not yet reviewed) → show the form
 *
 * Backend verifies purchase eligibility — this UI only reflects that state.
 */
export function ReviewForm({ productId, className }: ReviewFormProps) {
  const { user, isAuthenticated } = useUser();
  const eligibilityQuery = useReviewEligibility(productId, isAuthenticated);
  const submitMutation = useSubmitReview();

  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  const eligibility = eligibilityQuery.data;
  const isLoadingEligibility = isAuthenticated && eligibilityQuery.isLoading;

  function reset() {
    setRating(0);
    setHoverRating(0);
    setTitle("");
    setComment("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      kwikToast.error("Please rate this product", "Select 1 to 5 stars.");
      return;
    }
    if (!comment.trim()) {
      kwikToast.error("Review incomplete", "Please write a comment.");
      return;
    }
    submitMutation.mutate(
      {
        productId,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
      },
      {
        onSuccess: () => {
          kwikToast.success("Review posted!", "Thank you for your feedback.");
          reset();
          setOpen(false);
        },
        onError: (err: unknown) => {
          const message =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            "Failed to post review. Please try again.";
          kwikToast.error("Could not post review", message);
        },
      },
    );
  }

  // ── State: Loading eligibility ──────────────────────────────────────────
  if (isLoadingEligibility) {
    return (
      <div
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm text-kwik-muted",
          className,
        )}
      >
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-kwik-orange/30 border-t-kwik-orange" />
        Checking eligibility…
      </div>
    );
  }

  // ── State: Not logged in ─────────────────────────────────────────────────
  if (!isAuthenticated || !user) {
    return (
      <Link
        href="/login"
        className={cn(
          "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-kwik-bg-surface dark:hover:bg-white/5",
          className,
        )}
      >
        <LogIn className="h-4 w-4 text-kwik-orange" />
        Sign in to review
      </Link>
    );
  }

  // ── State: Already reviewed ──────────────────────────────────────────────
  if (eligibility?.hasReviewed) {
    return (
      <div
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 text-sm font-semibold text-emerald-600 dark:text-emerald-300",
          className,
        )}
      >
        <CheckCircle2 className="h-4 w-4" />
        You&apos;ve reviewed this product
      </div>
    );
  }

  // ── State: Hasn't purchased ──────────────────────────────────────────────
  if (eligibility && !eligibility.hasPurchased) {
    return (
      <div
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-kwik-bg-surface px-4 text-sm font-medium text-kwik-muted dark:bg-white/5 dark:text-white/55",
          className,
        )}
        title="Only customers who have purchased and received this product can review it."
      >
        <ShoppingBag className="h-4 w-4" />
        Purchase required to review
      </div>
    );
  }

  // ── State: Eligible → show the form trigger ──────────────────────────────
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-kwik-orange px-4 text-sm font-semibold text-white transition hover:bg-kwik-orange-hover",
          className,
        )}
      >
        <PenLine className="h-4 w-4" />
        Write a review
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border bg-kwik-bg-surface px-5 py-3 dark:bg-white/5">
                <h2 className="text-base font-semibold text-foreground">Write a Review</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="rounded-lg p-1.5 text-kwik-muted hover:bg-kwik-bg-surface hover:text-foreground dark:hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto p-5">
                {/* Star rating */}
                <div className="mb-4">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-kwik-muted dark:text-white/55">
                    Your Rating <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                        className="p-1"
                      >
                        <Star
                          className={cn(
                            "h-7 w-7 transition-colors",
                            star <= (hoverRating || rating)
                              ? "fill-kwik-star text-kwik-star"
                              : "fill-none text-kwik-border-light dark:text-white/20",
                          )}
                        />
                      </button>
                    ))}
                  </div>
                  {rating > 0 && (
                    <p className="mt-1 text-xs text-kwik-muted dark:text-white/55">
                      {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
                    </p>
                  )}
                </div>

                {/* Title */}
                <div className="mb-4">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-kwik-muted dark:text-white/55">
                    Review Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Summarize your experience"
                    maxLength={80}
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground placeholder:text-kwik-muted focus:border-kwik-orange focus:outline-none focus:ring-2 focus:ring-kwik-orange/20 dark:bg-white/5"
                  />
                </div>

                {/* Comment */}
                <div className="mb-5">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-kwik-muted dark:text-white/55">
                    Your Review <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="What did you like or dislike? How was the quality?"
                    rows={4}
                    maxLength={500}
                    className="w-full resize-none rounded-xl border border-border bg-background p-3 text-sm text-foreground placeholder:text-kwik-muted focus:border-kwik-orange focus:outline-none focus:ring-2 focus:ring-kwik-orange/20 dark:bg-white/5"
                  />
                  <p className="mt-1 text-right text-xs text-kwik-muted dark:text-white/45">
                    {comment.length}/500
                  </p>
                </div>

                {/* Verified-purchase notice */}
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-500/5 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Verified purchase — your review will be marked as a confirmed buyer.
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="h-11 flex-1 rounded-xl border border-border bg-background text-sm font-semibold text-kwik-muted hover:bg-kwik-bg-surface dark:hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitMutation.isPending}
                    className="h-11 flex-1 rounded-xl bg-kwik-orange text-sm font-semibold text-white hover:bg-kwik-orange-hover disabled:opacity-60"
                  >
                    {submitMutation.isPending ? "Posting…" : "Post Review"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
