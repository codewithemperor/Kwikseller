"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  RotateCcw,
  Send,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  DISPUTE_DESCRIPTION_MAX_LENGTH,
  DISPUTE_TYPE_META,
  DisputeType,
  ISSUE_REASON_PRESETS,
  KwisCrow,
  RETURN_REASON_PRESETS,
  type DisputeTypeValue,
} from "@/constants/order-workflow";
import type { OrderWorkflowState } from "@/types/order-workflow";

interface ReturnDisputeDialogProps {
  isOpen: boolean;
  /** Initial dispute type — defaults to RETURN_REQUEST. */
  initialType?: DisputeTypeValue;
  order: OrderWorkflowState;
  onSubmit: (
    type: DisputeTypeValue,
    reason: string,
    description?: string,
  ) => void;
  onClose: () => void;
  /** Disable the submit button while a request is in-flight. */
  isSubmitting?: boolean;
  className?: string;
}

/**
 * ReturnDisputeDialog — modal for a customer to request a return or report an
 * issue. Drives off the reason presets from `constants/order-workflow.ts` plus
 * a free-form description.
 *
 * The dialog warns the buyer that submitting will freeze the escrow and open
 * a dispute. The parent component owns the actual call into the store.
 */
export function ReturnDisputeDialog({
  isOpen,
  initialType = DisputeType.RETURN_REQUEST,
  order,
  onSubmit,
  onClose,
  isSubmitting = false,
  className,
}: ReturnDisputeDialogProps) {
  const [type, setType] = React.useState<DisputeTypeValue>(initialType);
  const [reason, setReason] = React.useState<string>("");
  const [description, setDescription] = React.useState<string>("");
  const [touched, setTouched] = React.useState(false);

  // Reset the form whenever the dialog opens (or the initial type changes).
  React.useEffect(() => {
    if (isOpen) {
      setType(initialType);
      setReason("");
      setDescription("");
      setTouched(false);
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  const meta = DISPUTE_TYPE_META[type];
  const presets =
    type === DisputeType.RETURN_REQUEST
      ? RETURN_REASON_PRESETS
      : ISSUE_REASON_PRESETS;
  const reasonError =
    touched && reason.trim().length === 0
      ? "Please pick a reason (or type your own)."
      : undefined;
  const canSubmit = reason.trim().length > 0 && !isSubmitting;
  const descriptionLength = description.length;
  const descriptionOverLimit = descriptionLength > DISPUTE_DESCRIPTION_MAX_LENGTH;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit || descriptionOverLimit) return;
    onSubmit(type, reason.trim(), description.trim() || undefined);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="return-dispute-title"
      className="fixed inset-0 z-[120] flex items-end justify-center bg-gray-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.98 }}
          transition={{ duration: 0.25 }}
          className={
            "w-full max-h-[92dvh] overflow-hidden rounded-t-2xl border border-gray-200 bg-surface shadow-2xl sm:max-w-lg sm:rounded-2xl " +
            (className ?? "")
          }
        >
          {/* Header */}
          <div className="kwik-gradient px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white">
                  <ShieldAlert className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/80">
                    Order {order.ref}
                  </p>
                  <h2
                    id="return-dispute-title"
                    className="font-heading text-lg font-bold text-white"
                  >
                    Return or report an issue
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close dialog"
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <form
            id="return-dispute-form"
            onSubmit={handleSubmit}
            className="max-h-[calc(92dvh-180px)] space-y-5 overflow-y-auto px-5 py-5"
          >
            {/* Type selector */}
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500">
                What would you like to do?
              </label>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(
                  [DisputeType.RETURN_REQUEST, DisputeType.ISSUE_REPORT] as const
                ).map((t) => {
                  const m = DISPUTE_TYPE_META[t];
                  const selected = t === type;
                  const Icon = t === DisputeType.RETURN_REQUEST ? RotateCcw : AlertTriangle;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setType(t);
                        setReason("");
                        setTouched(false);
                      }}
                      className={
                        "flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 " +
                        (selected
                          ? "border-primary-500 bg-primary-50"
                          : "border-gray-200 bg-surface hover:border-gray-300")
                      }
                      aria-pressed={selected}
                    >
                      <span
                        className={
                          "flex h-8 w-8 items-center justify-center rounded-full " +
                          (selected
                            ? "bg-primary-500 text-white"
                            : "bg-gray-100 text-gray-500")
                        }
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span
                        className={
                          "text-sm font-semibold " +
                          (selected ? "text-primary-900" : "text-foreground")
                        }
                      >
                        {m.label}
                      </span>
                      <span className="text-[11px] leading-4 text-gray-500">
                        {m.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reason presets */}
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500">
                Reason
              </label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {presets.map((preset) => {
                  const selected = reason === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setReason(preset);
                        setTouched(true);
                      }}
                      className={
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 " +
                        (selected
                          ? "border-primary-500 bg-primary-500 text-white"
                          : "border-gray-200 bg-surface text-gray-700 hover:border-primary-300 hover:text-primary-700")
                      }
                      aria-pressed={selected}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>
              {/* Free-form reason input */}
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="Or type your own reason…"
                className="mt-2 h-10 w-full rounded-md border border-gray-200 bg-surface px-3 text-sm text-foreground placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                aria-label="Reason (free text)"
              />
              {reasonError && (
                <p className="mt-1 text-xs font-medium text-danger">{reasonError}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={DISPUTE_DESCRIPTION_MAX_LENGTH}
                placeholder="Add any details that will help the KwisCrow team review your case — photos, dates, what you expected vs. what you received…"
                className="mt-2 w-full resize-none rounded-md border border-gray-200 bg-surface px-3 py-2 text-sm text-foreground placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />
              <div className="mt-1 flex items-center justify-between px-1">
                <span className="text-[11px] text-gray-500">
                  Be specific — include dates, photos, etc.
                </span>
                <span
                  className={
                    "text-[11px] tabular-nums " +
                    (descriptionOverLimit
                      ? "font-semibold text-danger"
                      : "text-gray-500")
                  }
                >
                  {descriptionLength}/{DISPUTE_DESCRIPTION_MAX_LENGTH}
                </span>
              </div>
            </div>

            {/* Escrow-freeze warning */}
            <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 p-3">
              <ShieldAlert className="mt-0.5 h-4.5 w-4.5 shrink-0 text-warning" />
              <div className="space-y-1 text-xs leading-5">
                <p className="font-semibold text-foreground">
                  This will freeze the {KwisCrow.NAME} escrow.
                </p>
                <p className="text-gray-600">
                  The vendor&apos;s payment will be held until the dispute is
                  resolved. KwisCrow support typically reviews cases within 48
                  hours. You may be asked for additional evidence.
                </p>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="flex w-full items-center justify-end gap-3 border-t border-gray-200 bg-surface px-5 py-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="inline-flex h-10 items-center justify-center rounded-md border border-gray-200 bg-surface px-4 text-sm font-semibold text-gray-600 transition hover:border-gray-300 hover:text-foreground disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="return-dispute-form"
              disabled={!canSubmit}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-danger px-4 text-sm font-bold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  aria-hidden="true"
                />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Submit {type === DisputeType.RETURN_REQUEST ? "return" : "report"}
            </button>
          </div>

          {/* Trust footer */}
          <div className="flex items-center justify-center gap-1.5 border-t border-gray-100 bg-gray-50 px-5 py-2 text-[11px] text-gray-500">
            <ShieldCheck className="h-3 w-3" />
            <span>
              Protected by {KwisCrow.NAME} — your funds stay safe during the
              review.
            </span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default ReturnDisputeDialog;
