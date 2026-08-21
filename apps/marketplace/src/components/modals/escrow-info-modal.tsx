"use client";

import React from "react";
import { ShieldCheck, CheckCircle2, XCircle } from "lucide-react";
import { ESCROW_STATUS_META, KwisCrow } from "@/constants/order-workflow";
import type { EscrowRecord } from "@/types/order-workflow";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

interface EscrowInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  escrow: EscrowRecord;
}

export function EscrowInfoModal({
  isOpen,
  onClose,
  escrow,
}: EscrowInfoModalProps) {
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
                You click <strong>"Confirm receipt"</strong> after delivery —
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
