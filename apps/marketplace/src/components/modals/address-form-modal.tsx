"use client";

import React from "react";
import { X } from "lucide-react";
import { AppButton } from "@/components/ui/app-button";
import { FieldAutocomplete, FieldInput } from "@/components/ui/plain-inputs";
import { getLgasForState, NIGERIA_STATES } from "@/lib/nigeria-locations";

export interface AddressFormState {
  label: string;
  line1: string;
  landmark: string;
  city: string;
  state: string;
  localGovernment: string;
  country: string;
  postalCode: string;
}

interface AddressFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: AddressFormState;
  onUpdateForm: (field: keyof AddressFormState, value: string) => void;
  onSave: () => void;
  isSaving: boolean;
  isEditing: boolean;
}

export function AddressFormModal({
  isOpen,
  onClose,
  form,
  onUpdateForm,
  onSave,
  isSaving,
  isEditing,
}: AddressFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-end bg-black/45 p-4 sm:items-center sm:justify-center" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto bg-background p-5 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-kwik-dark dark:text-white">
              {isEditing ? "Edit delivery address" : "Add delivery address"}
            </h2>
            <p className="text-sm text-kwik-muted dark:text-white/55">
              {isEditing ? "Update this saved delivery location." : "Name it Home, Office, Shop, or anything useful."}
            </p>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-white/10" aria-label="Close modal">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <FieldInput label="Address name" value={form.label} onChange={(event) => onUpdateForm("label", event.target.value)} />
          <FieldInput label="City" value={form.city} onChange={(event) => onUpdateForm("city", event.target.value)} />
          <FieldAutocomplete
            label="State"
            value={form.state}
            options={NIGERIA_STATES.map((state) => ({ value: state, label: state }))}
            onValueChange={(nextValue) => onUpdateForm("state", nextValue)}
            placeholder="Type or select state"
          />
          <FieldAutocomplete
            label="Local government"
            value={form.localGovernment}
            options={getLgasForState(form.state).map((lga) => ({ value: lga, label: lga }))}
            onValueChange={(nextValue) => onUpdateForm("localGovernment", nextValue)}
            placeholder="Type or select local government"
          />
          <FieldInput wrapperClassName="sm:col-span-2" label="Street address" value={form.line1} onChange={(event) => onUpdateForm("line1", event.target.value)} />
          <FieldInput wrapperClassName="sm:col-span-2" label="Landmark or nearest bus stop" value={form.landmark} onChange={(event) => onUpdateForm("landmark", event.target.value)} />
          <FieldInput label="Country" value={form.country} onChange={(event) => onUpdateForm("country", event.target.value)} />
          <FieldInput label="Postal code" value={form.postalCode} onChange={(event) => onUpdateForm("postalCode", event.target.value)} />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <AppButton type="button" variant="secondary" onClick={onClose} fullWidth>Cancel</AppButton>
          <AppButton type="button" onClick={onSave} isLoading={isSaving} loadingLabel="Saving" fullWidth>
            {isEditing ? "Update address" : "Save address"}
          </AppButton>
        </div>
      </div>
    </div>
  );
}
