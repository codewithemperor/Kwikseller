"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  Package,
  MapPin,
  Phone,
  Check,
  X,
  Truck,
  CheckCircle2,
  Loader2,
  Inbox,
  Tag,
  Banknote,
  Star,
  MessageSquare,
  MessageCircleReply,
  Send,
  BadgeCheck,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import {
  useVendorOrders,
  useQuoteOrder,
  useVendorOrderAction,
  useVendorReviews,
  useReplyToReview,
  useDeleteReviewReply,
  type ApiOrder,
  type OrderStatus,
  type VendorReview,
} from "@/lib/order-api";
import { useStores } from "@/lib/api-hooks";
import { kwikToast } from "@kwikseller/utils";
import { LoadingSpinner, PageLoading } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { AccountLayout } from "@/components/layout/account-layout";
import { cn } from "@/lib/utils";

// Default store used when the dashboard first loads. In production this
// would come from the vendor's session. In demo mode, the vendor can
// switch between all 6 dummy stores via the dropdown in the Reviews tab.
const DEFAULT_STORE_ID = "store-zara";

function formatNGN(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}

const STATUS_TABS: { label: string; value: OrderStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Ready", value: "READY" },
  { label: "Shipped", value: "SHIPPED" },
  { label: "Delivered", value: "DELIVERED" },
];

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-kwik-orange/10 text-kwik-orange ring-kwik-orange/20",
  CONFIRMED: "bg-kwik-blue/10 text-kwik-blue ring-kwik-blue/20",
  READY: "bg-kwik-blue/10 text-kwik-blue ring-kwik-blue/20",
  SHIPPED: "bg-kwik-green/10 text-kwik-green ring-kwik-green/20",
  DELIVERED: "bg-kwik-green/10 text-kwik-green ring-kwik-green/20",
  CANCELLED: "bg-kwik-red/10 text-kwik-red ring-kwik-red/20",
  REJECTED: "bg-kwik-red/10 text-kwik-red ring-kwik-red/20",
};

// ─── Quote form (vendor sets delivery + discount) ──────────────────────────

function QuoteForm({ order }: { order: ApiOrder }) {
  const quote = useQuoteOrder();
  const action = useVendorOrderAction();
  const [deliveryFee, setDeliveryFee] = useState(String(order.deliveryFee || 1500));
  const [discount, setDiscount] = useState("");
  const [discountType, setDiscountType] = useState<"AMOUNT" | "PERCENT">("AMOUNT");

  const discNum = Number(discount) || 0;
  const subtotal = order.subtotal;
  const discAmount =
    discountType === "PERCENT" ? Math.round((subtotal * discNum) / 100) : discNum;
  const fee = Number(deliveryFee) || 0;
  const total = subtotal + fee - discAmount + order.platformFee;

  async function submitQuote() {
    try {
      await quote.mutateAsync({
        orderId: order.id,
        deliveryFee: fee,
        discount: discNum,
        discountType,
      });
      kwikToast.success("Quotation sent", "The buyer has been notified of your delivery fee & discount.");
    } catch (e) {
      kwikToast.error("Failed to quote", e instanceof Error ? e.message : "Try again.");
    }
  }

  async function reject() {
    try {
      await action.mutateAsync({ orderId: order.id, action: "reject", reason: "Unable to fulfil at this time" });
      kwikToast.info("Order rejected", "The buyer has been notified.");
    } catch (e) {
      kwikToast.error("Failed to reject", e instanceof Error ? e.message : "Try again.");
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-kwik-border-light bg-kwik-bg-page p-4">
      <p className="text-sm font-semibold text-foreground">Set delivery &amp; discount</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="flex items-center gap-1.5 text-xs font-medium text-kwik-muted">
            <Truck className="h-3.5 w-3.5" /> Delivery fee (₦)
          </span>
          <input
            type="number"
            value={deliveryFee}
            onChange={(e) => setDeliveryFee(e.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-kwik-border-light bg-kwik-bg-surface px-3 text-sm text-foreground outline-none focus:border-kwik-orange focus:ring-2 focus:ring-kwik-orange/20"
            min={0}
          />
        </label>
        <label className="block">
          <span className="flex items-center gap-1.5 text-xs font-medium text-kwik-muted">
            <Tag className="h-3.5 w-3.5" /> Discount
          </span>
          <div className="mt-1 flex gap-2">
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="0"
              className="h-10 flex-1 rounded-lg border border-kwik-border-light bg-kwik-bg-surface px-3 text-sm text-foreground outline-none focus:border-kwik-orange focus:ring-2 focus:ring-kwik-orange/20"
              min={0}
            />
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as "AMOUNT" | "PERCENT")}
              className="h-10 rounded-lg border border-kwik-border-light bg-kwik-bg-surface px-2 text-sm text-foreground outline-none focus:border-kwik-orange"
            >
              <option value="AMOUNT">₦</option>
              <option value="PERCENT">%</option>
            </select>
          </div>
        </label>
      </div>
      <div className="mt-3 flex items-center justify-between rounded-lg bg-kwik-orange/5 px-3 py-2 text-sm">
        <span className="text-kwik-muted">Buyer pays</span>
        <span className="font-bold text-kwik-orange">{formatNGN(total)}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={submitQuote}
          disabled={quote.isPending}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-kwik-orange px-4 text-sm font-semibold text-white transition hover:bg-kwik-orange-hover disabled:opacity-60"
        >
          {quote.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Send quotation
        </button>
        <button
          type="button"
          onClick={reject}
          disabled={action.isPending}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-kwik-border-light px-4 text-sm font-semibold text-kwik-muted transition hover:bg-kwik-red/5 hover:text-kwik-red disabled:opacity-60"
        >
          <X className="h-4 w-4" /> Reject
        </button>
      </div>
    </div>
  );
}

// ─── Order card ────────────────────────────────────────────────────────────

function VendorOrderCard({ order, index }: { order: ApiOrder; index: number }) {
  const action = useVendorOrderAction();
  const isPending = order.status === "PENDING";
  const isConfirmed = order.status === "CONFIRMED" || order.status === "PROCESSING";
  const isReady = order.status === "READY";

  async function doAction(act: "accept" | "ready" | "ship", label: string) {
    try {
      await action.mutateAsync({ orderId: order.id, action: act });
      kwikToast.success(label, "Order updated.");
    } catch (e) {
      kwikToast.error("Action failed", e instanceof Error ? e.message : "Try again.");
    }
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className="rounded-2xl border border-kwik-border-light bg-kwik-bg-surface p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-foreground">{order.orderNumber}</h3>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1",
                STATUS_BADGE[order.status] ?? STATUS_BADGE.PENDING,
              )}
            >
              {order.status.replace(/_/g, " ")}
            </span>
          </div>
          <p className="mt-1 text-sm text-kwik-muted">
            From <span className="font-medium text-foreground">{order.buyerName}</span> ·{" "}
            {new Date(order.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-kwik-muted">Subtotal</p>
          <p className="font-bold text-foreground">{formatNGN(order.subtotal)}</p>
        </div>
      </div>

      {/* Items */}
      <div className="mt-3 space-y-2">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              {item.product.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.product.image} alt={item.product.name} className="h-9 w-9 rounded-md object-cover" />
              ) : (
                <Package className="h-9 w-9 text-kwik-muted" />
              )}
              <span className="font-medium text-foreground">{item.product.name}</span>
              <span className="text-kwik-muted">×{item.quantity}</span>
            </div>
            <span className="text-kwik-muted">{formatNGN(item.totalPrice)}</span>
          </div>
        ))}
      </div>

      {/* Delivery address */}
      <div className="mt-3 flex items-start gap-2 rounded-lg bg-kwik-bg-page p-3 text-sm">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-kwik-orange" />
        <div className="text-kwik-muted">
          <span className="font-medium text-foreground">{order.deliveryAddress.fullName}</span>
          {" · "}
          <span className="inline-flex items-center gap-1">
            <Phone className="h-3 w-3" /> {order.deliveryAddress.phone}
          </span>
          <br />
          {order.deliveryAddress.addressLine1}, {order.deliveryAddress.city}, {order.deliveryAddress.state}
        </div>
      </div>

      {/* Quotation summary (when quoted) */}
      {!isPending && (
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <div className="rounded-lg bg-kwik-bg-page p-2">
            <p className="flex items-center gap-1 text-xs text-kwik-muted"><Truck className="h-3 w-3" /> Delivery</p>
            <p className="font-semibold text-foreground">{formatNGN(order.deliveryFee)}</p>
          </div>
          {order.discount > 0 && (
            <div className="rounded-lg bg-kwik-bg-page p-2">
              <p className="flex items-center gap-1 text-xs text-kwik-muted"><Tag className="h-3 w-3" /> Discount</p>
              <p className="font-semibold text-kwik-green">−{formatNGN(order.discount)}</p>
            </div>
          )}
          <div className="rounded-lg bg-kwik-bg-page p-2">
            <p className="flex items-center gap-1 text-xs text-kwik-muted"><Banknote className="h-3 w-3" /> Platform fee</p>
            <p className="font-semibold text-foreground">{formatNGN(order.platformFee)}</p>
          </div>
          <div className="rounded-lg bg-kwik-orange/5 p-2">
            <p className="text-xs text-kwik-muted">Total</p>
            <p className="font-bold text-kwik-orange">{formatNGN(order.total)}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      {isPending && <QuoteForm order={order} />}
      {isConfirmed && (
        <button
          type="button"
          onClick={() => doAction("ready", "Marked ready")}
          disabled={action.isPending}
          className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-lg bg-kwik-blue px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {action.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
          Mark as ready
        </button>
      )}
      {isReady && (
        <button
          type="button"
          onClick={() => doAction("ship", "Order shipped")}
          disabled={action.isPending}
          className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-lg bg-kwik-green px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {action.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
          Mark as shipped
        </button>
      )}
      {(order.status === "SHIPPED" || order.status === "DELIVERED") && order.trackingNumber && (
        <p className="mt-3 text-xs text-kwik-muted">
          Tracking: <span className="font-mono">{order.trackingNumber}</span>
        </p>
      )}
    </motion.article>
  );
}

// ─── Vendor review card with reply form ────────────────────────────────────

function VendorReviewCard({ review, index }: { review: VendorReview; index: number }) {
  const reply = useReplyToReview();
  const delReply = useDeleteReviewReply();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function submitReply() {
    if (!replyText.trim()) {
      kwikToast.error("Reply cannot be empty");
      return;
    }
    try {
      await reply.mutateAsync({ reviewId: review.id, text: replyText });
      kwikToast.success("Reply posted", "Your reply is now visible to shoppers.");
      setReplyText("");
      setShowReplyForm(false);
    } catch (e) {
      kwikToast.error("Failed to post reply", e instanceof Error ? e.message : "Try again.");
    }
  }

  async function deleteReply() {
    try {
      await delReply.mutateAsync({ reviewId: review.id });
      kwikToast.success("Reply deleted", "The reply is no longer visible to shoppers.");
      setConfirmingDelete(false);
      setReplyText("");
      setShowReplyForm(false);
    } catch (e) {
      kwikToast.error("Failed to delete reply", e instanceof Error ? e.message : "Try again.");
    }
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="rounded-2xl border border-kwik-border-light bg-kwik-bg-surface p-5"
    >
      <div className="flex items-start gap-3">
        {/* Product image */}
        {review.product?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={review.product.image}
            alt={review.product.name}
            className="h-12 w-12 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-kwik-bg-page text-kwik-muted">
            <Package className="h-6 w-6" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          {/* Reviewer + product */}
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-semibold text-foreground">{review.name}</span>
            {review.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-kwik-green/10 px-2 py-0.5 text-[10px] font-semibold text-kwik-green">
                <BadgeCheck className="h-3 w-3" /> Verified
              </span>
            )}
            <span className="text-xs text-kwik-muted">·</span>
            <span className="text-xs text-kwik-muted">
              {new Date(review.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}
            </span>
          </div>
          {review.product && (
            <Link
              href={`/products/${review.product.id}`}
              className="mt-0.5 inline-flex items-center gap-1 text-xs text-kwik-orange hover:underline"
            >
              <Package className="h-3 w-3" />
              {review.product.name}
            </Link>
          )}
          {/* Star rating */}
          <div className="mt-1.5 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={cn(
                  "h-3.5 w-3.5",
                  s <= review.rating
                    ? "fill-kwik-amber text-kwik-amber"
                    : "text-kwik-border-light",
                )}
              />
            ))}
            {review.helpful > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs text-kwik-muted">
                <ThumbsUp className="h-3 w-3" /> {review.helpful}
              </span>
            )}
          </div>
          {/* Review body */}
          <p className="mt-2 text-sm font-semibold text-foreground">{review.title}</p>
          <p className="mt-0.5 text-sm text-kwik-muted">{review.text}</p>
        </div>
      </div>

      {/* Existing vendor reply */}
      {review.vendorReply && !showReplyForm && (
        <div className="mt-3 rounded-xl border border-kwik-orange/20 bg-gradient-to-br from-kwik-orange-tint/60 to-kwik-amber-tint/40 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-kwik-gradient text-white">
                <Store className="h-3.5 w-3.5" />
              </div>
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-foreground">{review.vendorReply.authorName}</span>
                <span className="inline-flex items-center gap-0.5 rounded-full bg-kwik-orange/15 px-1.5 py-0.5 text-[10px] font-medium text-kwik-orange-dark">
                  <BadgeCheck className="h-2.5 w-2.5" /> Seller
                </span>
                <span className="text-[10px] text-kwik-muted">
                  · {new Date(review.vendorReply.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}
                </span>
              </div>
            </div>

            {/* Delete reply affordance — tiny inline confirm */}
            {!confirmingDelete ? (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                disabled={delReply.isPending}
                className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md px-2 text-[11px] font-medium text-kwik-red/70 transition hover:bg-kwik-red/10 hover:text-kwik-red disabled:opacity-60"
                aria-label="Delete reply"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            ) : (
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="text-[11px] font-medium text-kwik-muted">Confirm delete?</span>
                <button
                  type="button"
                  onClick={deleteReply}
                  disabled={delReply.isPending}
                  className="inline-flex h-7 items-center gap-1 rounded-md bg-kwik-red px-2 text-[11px] font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {delReply.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={delReply.isPending}
                  className="inline-flex h-7 items-center rounded-md border border-kwik-border-light bg-kwik-bg-surface px-2 text-[11px] font-medium text-kwik-muted transition hover:bg-kwik-bg-page disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          <p className="mt-1.5 pl-9 text-sm text-kwik-dark/90">{review.vendorReply.text}</p>
        </div>
      )}

      {/* Reply form (when toggled) */}
      <AnimatePresence>
        {showReplyForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-3 overflow-hidden"
          >
            <div className="rounded-xl border border-kwik-orange/30 bg-kwik-bg-page p-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-kwik-muted">
                Reply as seller
              </label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={3}
                placeholder="Thank the customer, address their concern, or share more details…"
                className="mt-1.5 w-full resize-none rounded-lg border border-kwik-border-light bg-kwik-bg-surface px-3 py-2 text-sm text-foreground outline-none transition focus:border-kwik-orange focus:ring-2 focus:ring-kwik-orange/20"
                maxLength={500}
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[10px] text-kwik-muted">{replyText.length}/500</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setReplyText("");
                      setShowReplyForm(false);
                    }}
                    disabled={reply.isPending}
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-kwik-border-light bg-kwik-bg-surface px-3 text-xs font-semibold text-kwik-muted transition hover:bg-kwik-bg-page disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={submitReply}
                    disabled={reply.isPending || !replyText.trim()}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-kwik-gradient px-4 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                  >
                    {reply.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    Post reply
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reply / Edit button */}
      {!showReplyForm && (
        <button
          type="button"
          onClick={() => setShowReplyForm(true)}
          className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg border border-kwik-border-light bg-kwik-bg-surface px-3 text-xs font-semibold text-foreground transition hover:border-kwik-orange hover:text-kwik-orange"
        >
          {review.vendorReply ? (
            <>
              <MessageCircleReply className="h-3.5 w-3.5" /> Edit reply
            </>
          ) : (
            <>
              <MessageCircleReply className="h-3.5 w-3.5" /> Reply to review
            </>
          )}
        </button>
      )}
    </motion.article>
  );
}

// ─── Vendor reviews tab content ────────────────────────────────────────────

function VendorReviewsContent({ storeId }: { storeId: string }) {
  const [ratingFilter, setRatingFilter] = useState<number | "ALL">("ALL");
  const { data: reviews, isLoading } = useVendorReviews(storeId);

  const all = reviews ?? [];
  const filtered =
    ratingFilter === "ALL" ? all : all.filter((r) => r.rating === ratingFilter);

  // Summary stats
  const total = all.length;
  const avg = total > 0 ? all.reduce((s, r) => s + r.rating, 0) / total : 0;
  const repliedCount = all.filter((r) => r.vendorReply).length;
  const replyRate = total > 0 ? Math.round((repliedCount / total) * 100) : 0;

  const ratingBuckets = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: all.filter((r) => r.rating === s).length,
  }));

  return (
    <div>
      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-kwik-border-light bg-kwik-bg-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-kwik-muted">
            Total reviews
          </p>
          <p className="mt-1 font-heading text-2xl font-bold text-foreground">{total}</p>
        </div>
        <div className="rounded-2xl border border-kwik-border-light bg-kwik-bg-surface p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-kwik-muted">
            <Star className="h-3 w-3 text-kwik-amber" /> Average rating
          </p>
          <p className="mt-1 font-heading text-2xl font-bold text-foreground">
            {avg.toFixed(1)}
            <span className="ml-1 text-sm font-normal text-kwik-muted">/ 5</span>
          </p>
        </div>
        <div className="rounded-2xl border border-kwik-border-light bg-kwik-bg-surface p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-kwik-muted">
            <MessageCircleReply className="h-3 w-3 text-kwik-orange" /> Reply rate
          </p>
          <p className="mt-1 font-heading text-2xl font-bold text-foreground">{replyRate}%</p>
          <p className="text-xs text-kwik-muted">{repliedCount} of {total} replied</p>
        </div>
      </div>

      {/* Rating distribution */}
      {total > 0 && (
        <div className="mt-4 rounded-2xl border border-kwik-border-light bg-kwik-bg-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-kwik-muted">
            Rating distribution
          </p>
          <div className="mt-3 space-y-2">
            {ratingBuckets.map((b) => (
              <button
                key={b.star}
                type="button"
                onClick={() => setRatingFilter(ratingFilter === b.star ? "ALL" : b.star)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-2 py-1.5 transition",
                  ratingFilter === b.star ? "bg-kwik-orange-tint" : "hover:bg-kwik-bg-page",
                )}
              >
                <div className="flex w-14 items-center gap-1">
                  <span className="text-xs font-medium text-foreground">{b.star}</span>
                  <Star className="h-3 w-3 fill-kwik-amber text-kwik-amber" />
                </div>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-kwik-bg-page">
                  <div
                    className="h-full rounded-full bg-kwik-gradient"
                    style={{ width: `${total > 0 ? (b.count / total) * 100 : 0}%` }}
                  />
                </div>
                <span className="w-8 text-right text-xs font-medium text-kwik-muted">
                  {b.count}
                </span>
              </button>
            ))}
          </div>
          {ratingFilter !== "ALL" && (
            <button
              onClick={() => setRatingFilter("ALL")}
              className="mt-2 text-xs font-medium text-kwik-orange hover:underline"
            >
              Clear filter ({ratingFilter}★)
            </button>
          )}
        </div>
      )}

      {/* Reviews list */}
      <div className="mt-6">
        {isLoading ? (
          <PageLoading label="Loading reviews…" />
        ) : filtered.length === 0 ? (
          <EmptyState
            variant="default"
            icon={<MessageSquare className="h-12 w-12" />}
            title={ratingFilter !== "ALL" ? `No ${ratingFilter}★ reviews` : "No reviews yet"}
            description={
              ratingFilter !== "ALL"
                ? `No reviews with a ${ratingFilter}-star rating for your store.`
                : "When buyers review your products, their feedback will appear here for you to respond to."
            }
          />
        ) : (
          <div className="grid gap-4">
            {filtered.map((review, i) => (
              <VendorReviewCard key={review.id} review={review} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

type TopTab = "orders" | "reviews";

function VendorDashboardContent() {
  const [topTab, setTopTab] = useState<TopTab>("orders");
  const [storeId, setStoreId] = useState<string>(DEFAULT_STORE_ID);
  const { data: stores } = useStores();
  const allStores = stores ?? [];

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-foreground">
            <Store className="h-6 w-6 text-kwik-orange" />
            Vendor Dashboard
          </h1>
          <p className="mt-1 text-sm text-kwik-muted">
            Manage orders, quote delivery, and respond to customer reviews.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-lg border border-kwik-border-light px-4 text-sm font-semibold text-kwik-muted transition hover:bg-kwik-bg-surface"
        >
          Back to shop
        </Link>
      </div>

      {/* Top-level tabs: Orders | Reviews + store selector */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-kwik-border-light bg-kwik-bg-surface p-1">
          <button
            type="button"
            onClick={() => setTopTab("orders")}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition",
              topTab === "orders"
                ? "bg-kwik-orange text-white shadow-sm"
                : "text-kwik-muted hover:text-foreground",
            )}
          >
            <Package className="h-4 w-4" /> Orders
          </button>
          <button
            type="button"
            onClick={() => setTopTab("reviews")}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition",
              topTab === "reviews"
                ? "bg-kwik-orange text-white shadow-sm"
                : "text-kwik-muted hover:text-foreground",
            )}
          >
            <MessageSquare className="h-4 w-4" /> Reviews
          </button>
        </div>

        {/* Store selector — lets the demo user switch between all 6 dummy stores.
            In production this would be hidden (the vendor's store is fixed). */}
        {topTab === "reviews" && allStores.length > 0 && (
          <label className="flex items-center gap-2 text-xs">
            <span className="font-semibold uppercase tracking-wider text-kwik-muted">
              Viewing as
            </span>
            <select
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              className="h-9 rounded-lg border border-kwik-border-light bg-kwik-bg-surface px-3 text-sm font-medium text-foreground outline-none transition focus:border-kwik-orange focus:ring-2 focus:ring-kwik-orange/20"
              aria-label="Select store"
            >
              {allStores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {/* Tab content */}
      <div className="mt-6">
        {topTab === "orders" ? <OrdersTab /> : <VendorReviewsContent storeId={storeId} />}
      </div>
    </div>
  );
}

function OrdersTab() {
  const [tab, setTab] = useState<OrderStatus | "ALL">("ALL");
  const { data: orders, isLoading } = useVendorOrders(tab === "ALL" ? undefined : tab);

  const filtered = orders ?? [];

  return (
    <div>
      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={cn(
              "inline-flex h-9 items-center rounded-full px-4 text-sm font-medium transition",
              tab === t.value
                ? "bg-kwik-orange text-white"
                : "border border-kwik-border-light text-kwik-muted hover:bg-kwik-bg-surface",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="mt-6">
        {isLoading ? (
          <PageLoading label="Loading orders…" />
        ) : filtered.length === 0 ? (
          <EmptyState
            variant="default"
            icon={<Inbox className="h-12 w-12" />}
            title="No orders here yet"
            description="When buyers place orders with your store, they'll appear here for you to quote and fulfil."
          />
        ) : (
          <div className="grid gap-4">
            {filtered.map((order, i) => (
              <VendorOrderCard key={order.id} order={order} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function VendorOrdersPage() {
  return (
    <AccountLayout>
      <VendorDashboardContent />
    </AccountLayout>
  );
}
