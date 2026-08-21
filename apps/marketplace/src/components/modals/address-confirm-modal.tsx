"use client";

import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Address form ──────────────────────────────────────────────────────────

export interface AddressForm {
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  landmark?: string;
}

const NIGERIAN_STATES = [
  "Lagos",
  "Abuja FCT",
  "Rivers",
  "Kano",
  "Oyo",
  "Kaduna",
  "Enugu",
  "Delta",
  "Ogun",
  "Anambra",
  "Edo",
  "Plateau",
  "Imo",
  "Ondo",
  "Akwa Ibom",
  "Cross River",
];

// ── Reusable text field ────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <div>
      <label className="text-muted-foreground mb-1.5 block text-xs font-semibold uppercase tracking-wide">
        {label} {required ? <span className="text-danger">*</span> : null}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "bg-background text-foreground placeholder:text-muted-foreground focus:ring-secondary-500/20 h-11 w-full rounded-xl border px-3 text-sm focus:outline-none focus:ring-2",
          error
            ? "border-danger focus:ring-danger/20"
            : "border-border focus:border-secondary-500",
        )}
      />
      {error ? <p className="text-danger mt-1 text-xs">{error}</p> : null}
    </div>
  );
}

// ── Address confirm modal ──────────────────────────────────────────────────

interface AddressConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: AddressForm;
  onUpdateAddress: (updater: (prev: AddressForm) => AddressForm) => void;
  errors: Partial<Record<keyof AddressForm, string>>;
  profileLoading: boolean;
  onConfirm: () => void;
  onNavigateToProfile: () => void;
}

export function AddressConfirmModal({
  isOpen,
  onClose,
  address,
  onUpdateAddress,
  errors,
  profileLoading,
  onConfirm,
  onNavigateToProfile,
}: AddressConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[140] flex items-end bg-black/45 p-4 sm:items-center sm:justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="address-modal-title"
    >
      <div className="bg-background max-h-[90vh] w-full max-w-lg overflow-y-auto p-5 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2
              id="address-modal-title"
              className="text-foreground text-lg font-semibold"
            >
              Confirm delivery address
            </h2>
            <p className="text-muted-foreground text-sm">
              The vendor will ship your order to this address.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="hover:bg-muted flex h-9 w-9 items-center justify-center rounded-lg"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {/* Full name — disabled (from profile) */}
          <div>
            <label className="text-muted-foreground mb-1.5 block text-xs font-semibold uppercase tracking-wide">
              Full name
            </label>
            <input
              type="text"
              value={address.fullName}
              disabled
              placeholder={profileLoading ? "Loading…" : "—"}
              className="bg-muted text-muted-foreground h-11 w-full cursor-not-allowed rounded-xl border border-border px-3 text-sm"
            />
          </div>
          {/* Phone — disabled (from profile) */}
          <div>
            <label className="text-muted-foreground mb-1.5 block text-xs font-semibold uppercase tracking-wide">
              Phone number
            </label>
            <input
              type="text"
              value={address.phone}
              disabled
              placeholder={profileLoading ? "Loading…" : "—"}
              className="bg-muted text-muted-foreground h-11 w-full cursor-not-allowed rounded-xl border border-border px-3 text-sm"
            />
          </div>

          {/* Editable: street address */}
          <div className="sm:col-span-2">
            <Field
              label="Street address"
              required
              error={errors.addressLine}
              value={address.addressLine}
              onChange={(v) =>
                onUpdateAddress((a) => ({ ...a, addressLine: v }))
              }
              placeholder="House 12, Allen Avenue, Ikeja"
            />
          </div>
          {/* Editable: city */}
          <Field
            label="City"
            required
            error={errors.city}
            value={address.city}
            onChange={(v) => onUpdateAddress((a) => ({ ...a, city: v }))}
            placeholder="Ikeja"
          />
          {/* Editable: state */}
          <div>
            <label className="text-muted-foreground mb-1.5 block text-xs font-semibold uppercase tracking-wide">
              State <span className="text-danger">*</span>
            </label>
            <select
              value={address.state}
              onChange={(e) =>
                onUpdateAddress((a) => ({ ...a, state: e.target.value }))
              }
              className={cn(
                "bg-background text-foreground focus:ring-secondary-500/20 h-11 w-full rounded-xl border px-3 text-sm focus:border-secondary-500 focus:outline-none focus:ring-2",
                errors.state ? "border-danger" : "border-border",
              )}
            >
              {NIGERIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {errors.state ? (
              <p className="text-danger mt-1 text-xs">{errors.state}</p>
            ) : null}
          </div>
          {/* Editable: landmark */}
          <div className="sm:col-span-2">
            <Field
              label="Landmark (optional)"
              value={address.landmark ?? ""}
              onChange={(v) => onUpdateAddress((a) => ({ ...a, landmark: v }))}
              placeholder="Opposite the petrol station"
            />
          </div>
        </div>

        <p className="text-muted-foreground mt-4 text-xs">
          Name and phone are pulled from your profile and cannot be edited
          here. Update them on your{" "}
          <button
            type="button"
            onClick={onNavigateToProfile}
            className="text-secondary-700 hover:text-secondary-800 underline-offset-2 hover:underline"
          >
            profile page
          </button>
          .
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="border-border text-foreground hover:bg-muted inline-flex h-11 items-center justify-center rounded-xl border text-sm font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="bg-secondary-500 hover:bg-secondary-600 inline-flex h-11 items-center justify-center rounded-xl text-sm font-semibold text-white transition"
          >
            Confirm &amp; place order
          </button>
        </div>
      </div>
    </div>
  );
}
