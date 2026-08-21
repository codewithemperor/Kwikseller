"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { AppButton } from "@/components/ui/app-button";
import { AppModal } from "@/components/ui/app-modal";
import { FieldInput, FieldTextarea } from "@/components/ui/plain-inputs";
import { cn } from "@/lib/utils";

export interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, evidence?: string) => void;
  orderRef: string;
  isLoading?: boolean;
  className?: string;
}

const MAX_REASON_LENGTH = 500;

/**
 * DisputeModal — buyer-facing modal for opening a dispute on an order.
 *
 * Calls `onSubmit(reason, evidence)` on submit; the parent component owns
 * the actual API call (ordersApi.openDispute) + toast + refetch logic.
 *
 * The modal warns the buyer that opening a dispute freezes the escrow and
 * triggers a manual review by the Kwikseller support team.
 */
export function DisputeModal({
  isOpen,
  onClose,
  onSubmit,
  orderRef,
  isLoading = false,
  className,
}: DisputeModalProps) {
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState("");
  const [touched, setTouched] = useState(false);

  // Reset form whenever the modal is closed
  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
        setReason("");
        setEvidence("");
        setTouched(false);
      }, 200);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [isOpen]);

  const reasonLength = reason.length;
  const reasonError =
    touched && reason.trim().length === 0
      ? "Please describe the issue with your order."
      : undefined;

  const canSubmit = reason.trim().length > 0 && !isLoading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (reason.trim().length === 0) return;
    if (reasonLength > MAX_REASON_LENGTH) return;
    onSubmit(reason.trim(), evidence.trim() || undefined);
  };

  const handleCancel = () => {
    if (isLoading) return;
    onClose();
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Open a dispute"
      description={`Order #${orderRef} — tell us what went wrong.`}
      className={cn("sm:max-w-lg", className)}
      footer={
        <div className="flex w-full items-center justify-end gap-3">
          <AppButton
            type="button"
            variant="secondary"
            size="md"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </AppButton>
          <AppButton
            type="submit"
            form="dispute-form"
            variant="danger"
            size="md"
            isLoading={isLoading}
            loadingLabel="Submitting..."
            disabled={!canSubmit}
          >
            Submit dispute
          </AppButton>
        </div>
      }
    >
      <form id="dispute-form" onSubmit={handleSubmit} className="space-y-5">
        {/* Reason */}
        <div>
          <FieldTextarea
            label="What's the issue? *"
            placeholder="e.g. The item arrived damaged, the wrong product was delivered, the package was never received..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            onBlur={() => setTouched(true)}
            maxLength={MAX_REASON_LENGTH}
            rows={5}
            error={reasonError}
            wrapperClassName="block"
          />
          <div className="mt-1 flex items-center justify-between px-1">
            <span className="text-[11px] text-muted-foreground">
              Be as specific as possible — include dates, photos, etc.
            </span>
            <span
              className={cn(
                "text-[11px] tabular-nums",
                reasonLength > MAX_REASON_LENGTH
                  ? "font-semibold text-danger"
                  : "text-muted-foreground",
              )}
            >
              {reasonLength}/{MAX_REASON_LENGTH}
            </span>
          </div>
        </div>

        {/* Evidence */}
        <FieldInput
          label="Evidence (optional)"
          type="text"
          placeholder="URL or description of evidence (e.g. photo link, screenshot)"
          value={evidence}
          onChange={(e) => setEvidence(e.target.value)}
        />

        {/* Warning banner */}
        <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-foreground">
              ⚠️ This will freeze the escrow and our team will review your case.
            </p>
            <p className="text-muted-foreground">
              The vendor&apos;s payment will be held until the dispute is
              resolved. You may be asked to provide additional evidence.
            </p>
          </div>
        </div>

        {/* Trust footer */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>
            Disputes are typically reviewed within 48 hours. False claims may
            affect your account standing.
          </span>
        </div>
      </form>
    </AppModal>
  );
}

export default DisputeModal;
