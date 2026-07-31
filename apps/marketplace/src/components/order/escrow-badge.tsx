"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Info, ArrowRightLeft, CheckCircle2, XCircle } from "lucide-react";
import { ESCROW_STATUS_META, EscrowStatus, KwisCrow } from "@/constants/order-workflow";
import type { EscrowStatus as EscrowStatusType, EscrowRecord } from "@/types/order-workflow";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(value?: string): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

interface EscrowBadgeProps {
  escrow?: EscrowRecord | null;
  /** When true, render an inline pill (default). When false, render the full card. */
  compact?: boolean;
  /** Open the info dialog automatically on click instead of requiring the info button. */
  className?: string;
}

const TONE_BADGE: Record<
  EscrowStatusType,
  { container: string; icon: React.ReactNode }
> = {
  HELD: {
    container:
      "border-primary-200 bg-primary-50 text-primary-800",
    icon: <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  RELEASED: {
    container: "border-success/30 bg-success/10 text-success",
    icon: <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  REFUNDED: {
    container: "border-gray-200 bg-gray-100 text-gray-600",
    icon: <ArrowRightLeft className="h-3.5 w-3.5" aria-hidden="true" />,
  },
};

/**
 * EscrowBadge — shows the KwisCrow escrow status (Held / Released / Refunded)
 * with a shield icon. Clicking the badge opens a dialog explaining the KwisCrow
 * protection lifecycle.
 *
 * When `compact` is true, renders just the pill; otherwise renders a full
 * card with amount + last action timestamps.
 */
export function EscrowBadge({ escrow, compact = true, className }: EscrowBadgeProps) {
  const [showInfo, setShowInfo] = React.useState(false);

  if (!escrow) return null;

  const meta = ESCROW_STATUS_META[escrow.status];
  const tone = TONE_BADGE[escrow.status];

  if (compact) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowInfo(true)}
          aria-label={`${KwisCrow.NAME} escrow: ${meta.label}. Click for details.`}
          className={
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 " +
            tone.container +
            (className ? " " + className : "")
          }
        >
          {tone.icon}
          <span>{meta.label}</span>
          <Info className="h-3 w-3 opacity-60" aria-hidden="true" />
        </button>
        <EscrowInfoDialog
          isOpen={showInfo}
          onClose={() => setShowInfo(false)}
          escrow={escrow}
        />
      </>
    );
  }

  // Full card layout
  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        aria-label="KwisCrow escrow status"
        className={
          "rounded-2xl border border-gray-200 bg-surface p-5 " + (className ?? "")
        }
      >
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-600">
              <ShieldCheck className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-500">
                {KwisCrow.NAME}
              </p>
              <p className="text-sm font-bold text-foreground">
                {meta.label}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowInfo(true)}
            className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-600 transition hover:border-gray-300 hover:text-foreground"
          >
            <Info className="h-3 w-3" />
            How it works
          </button>
        </header>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-gray-50 px-3 py-2">
            <dt className="text-[11px] font-semibold uppercase text-gray-500">
              Amount held
            </dt>
            <dd className="mt-0.5 text-base font-bold text-foreground tabular-nums">
              {formatCurrency(escrow.amount)}
            </dd>
          </div>
          <div className="rounded-xl bg-gray-50 px-3 py-2">
            <dt className="text-[11px] font-semibold uppercase text-gray-500">
              Held since
            </dt>
            <dd className="mt-0.5 text-sm font-semibold text-foreground">
              {formatDateTime(escrow.heldAt)}
            </dd>
          </div>
          {escrow.status === EscrowStatus.RELEASED && (
            <div className="rounded-xl bg-success/5 px-3 py-2">
              <dt className="text-[11px] font-semibold uppercase text-success">
                Released to vendor
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-foreground">
                {formatDateTime(escrow.releasedAt)}
              </dd>
            </div>
          )}
          {escrow.status === EscrowStatus.REFUNDED && (
            <div className="rounded-xl bg-gray-100 px-3 py-2">
              <dt className="text-[11px] font-semibold uppercase text-gray-500">
                Refunded to you
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-foreground">
                {formatDateTime(escrow.refundedAt)}
              </dd>
            </div>
          )}
        </dl>

        <p className="mt-3 text-xs leading-5 text-gray-500">{meta.hint}</p>
      </motion.section>
      <EscrowInfoDialog
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        escrow={escrow}
      />
    </>
  );
}

// ─── Info dialog (KwisCrow explainer) ──────────────────────────────────────

function EscrowInfoDialog({
  isOpen,
  onClose,
  escrow,
}: {
  isOpen: boolean;
  onClose: () => void;
  escrow: EscrowRecord;
}) {
  if (!isOpen) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="kwiscrow-info-title"
      className="fixed inset-0 z-[120] flex items-end justify-center bg-gray-950/60 p-4 backdrop-blur-sm sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-surface shadow-2xl">
        <div className="kwik-gradient px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/80">
                {KwisCrow.TAGLINE}
              </p>
              <h2
                id="kwiscrow-info-title"
                className="font-heading text-lg font-bold text-white"
              >
                {KwisCrow.NAME} escrow
              </h2>
            </div>
          </div>
        </div>
        <div className="space-y-4 px-5 py-5 text-sm leading-6 text-foreground">
          <p>
            {KwisCrow.NAME} holds your payment safely from the moment you pay
            until you confirm receipt of your order. The vendor is paid only
            when one of the following happens:
          </p>
          <ul className="space-y-2 text-gray-700">
            <li className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <span>
                You click <strong>“Confirm receipt”</strong> after delivery —
                escrow releases to the vendor immediately.
              </span>
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <span>
                The <strong>{KwisCrow.DISPUTE_WINDOW_HOURS}-hour dispute window</strong>{" "}
                expires with no dispute opened — escrow auto-releases to the vendor.
              </span>
            </li>
            <li className="flex gap-2">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
              <span>
                If you open a dispute, escrow is <strong>frozen</strong> until
                KwisCrow resolves the case (refund to you or release to vendor).
              </span>
            </li>
          </ul>
          {escrow && (
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-600">
              <span className="font-semibold text-foreground">This order:</span>{" "}
              {formatCurrency(escrow.amount)} — {ESCROW_STATUS_META[escrow.status].label}.
            </div>
          )}
        </div>
        <div className="border-t border-gray-200 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-secondary-500 px-4 text-sm font-bold text-white transition hover:bg-secondary-600"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export default EscrowBadge;
