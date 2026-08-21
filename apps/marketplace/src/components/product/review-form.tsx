"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, Check } from "lucide-react";
import { useReviewStore } from "@/stores/review-store";
import { kwikToast } from "@/lib/toast";
import { cn } from "@/lib/utils";

/**
 * ReviewForm — a customer review submission form for the product detail page.
 * Stores reviews in the local Zustand review store (works without a backend).
 */
export function ReviewForm({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [author, setAuthor] = useState("");
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const addReview = useReviewStore((s) => s.addReview);

  function reset() {
    setRating(0);
    setHoverRating(0);
    setAuthor("");
    setTitle("");
    setComment("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      kwikToast.error("Please rate this product", "Select 1 to 5 stars.");
      return;
    }
    if (!title.trim() || !comment.trim()) {
      kwikToast.error("Incomplete review", "Please add a title and comment.");
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      addReview({
        productId,
        author: author.trim() || "Anonymous Buyer",
        rating,
        title: title.trim(),
        comment: comment.trim(),
      });
      setSubmitting(false);
      reset();
      setOpen(false);
      kwikToast.success("Review posted!", "Thank you for your feedback.");
    }, 600);
  }

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-gray-100"
      >
        <Star className="h-4 w-4 text-warning" />
        Write a review
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border bg-surface px-5 py-3">
                <h2 className="font-heading text-base font-semibold text-foreground">
                  Write a Review
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto p-5">
                {/* Star rating */}
                <div className="mb-4">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Your Rating <span className="text-danger">*</span>
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
                              ? "fill-warning text-warning"
                              : "fill-gray-200 text-gray-300",
                          )}
                        />
                      </button>
                    ))}
                  </div>
                  {rating > 0 ? (
                    <p className="mt-1 text-xs text-gray-500">
                      {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
                    </p>
                  ) : null}
                </div>

                {/* Name */}
                <div className="mb-4">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Your Name <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Anonymous Buyer"
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>

                {/* Title */}
                <div className="mb-4">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Review Title <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Summarize your experience"
                    maxLength={80}
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>

                {/* Comment */}
                <div className="mb-5">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Your Review <span className="text-danger">*</span>
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="What did you like or dislike? How was the quality?"
                    rows={4}
                    maxLength={500}
                    className="w-full resize-none rounded-xl border border-border bg-background p-3 text-sm text-foreground placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                  <p className="mt-1 text-right text-xs text-gray-400">
                    {comment.length}/500
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex-1 h-11 rounded-xl border border-border bg-background text-sm font-semibold text-gray-600 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 h-11 rounded-xl bg-secondary-500 text-sm font-semibold text-white hover:bg-secondary-600 disabled:opacity-70"
                  >
                    {submitting ? "Posting…" : "Post Review"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
