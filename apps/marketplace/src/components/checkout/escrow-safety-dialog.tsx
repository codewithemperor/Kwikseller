"use client";

import React from "react";
import { ShieldCheck, X } from "lucide-react";

export function EscrowSafetyDialog({
  isOpen,
  isLoading,
  onClose,
  onConfirm,
  accentColor = "#F97316",
}: {
  isOpen: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  accentColor?: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-end bg-black/50 p-4 sm:items-center sm:justify-center" role="dialog" aria-modal="true" aria-labelledby="escrow-safety-title">
      <div className="w-full max-w-md bg-background p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white" style={{ backgroundColor: accentColor }}>
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 id="escrow-safety-title" className="text-lg font-semibold text-kwik-dark dark:text-white">
                Your payment is protected
              </h2>
              <p className="mt-2 text-sm leading-6 text-kwik-muted dark:text-white/60">
                Kwikseller holds your money safely with escrow. The vendor only receives payment after you receive the package.
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-kwik-muted hover:text-kwik-dark dark:hover:text-white" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="h-11 border border-black/10 text-sm font-semibold text-kwik-dark disabled:opacity-60 dark:border-white/10 dark:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="h-11 text-sm font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: accentColor }}
          >
            {isLoading ? "Starting..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
