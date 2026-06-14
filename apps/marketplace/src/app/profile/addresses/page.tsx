"use client";

import Link from "next/link";
import React from "react";
import { ArrowLeft, Check, Home, Loader2, MapPin, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { AppButton, FieldAutocomplete, FieldInput } from "@kwikseller/ui";
import { usersApi } from "@kwikseller/api-client";
import { getLgasForState, kwikToast, NIGERIA_STATES, useAuth } from "@kwikseller/utils";

type Address = {
  id: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  localGovernment?: string;
  country: string;
  postalCode?: string;
  isDefault: boolean;
  type: "SHIPPING" | "BILLING" | "BOTH";
};

const emptyForm = {
  label: "Home",
  line1: "",
  landmark: "",
  city: "",
  state: "",
  localGovernment: "",
  country: "Nigeria",
  postalCode: "",
};

function unwrap<T>(value: unknown): T {
  const payload = value as { data?: unknown };
  const nested = payload?.data as { data?: unknown } | undefined;
  return (nested?.data ?? payload?.data ?? value) as T;
}

function splitAddressLabel(line2?: string) {
  if (!line2) return { label: "Address", landmark: "" };
  const [label, ...rest] = line2.split(" - ");
  return { label: label || "Address", landmark: rest.join(" - ") };
}

function formatAddressParts(parts: Array<string | undefined>) {
  return parts.map((part) => part?.trim()).filter(Boolean).join(", ");
}

export default function DeliveryAddressesPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [addresses, setAddresses] = React.useState<Address[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [form, setForm] = React.useState(emptyForm);
  const [editingAddressId, setEditingAddressId] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  const loadAddresses = React.useCallback(async () => {
    setIsLoadingAddresses(true);
    try {
      const response = await usersApi.getAddresses();
      setAddresses(unwrap<Address[]>(response));
    } catch {
      setAddresses([]);
    } finally {
      setIsLoadingAddresses(false);
    }
  }, []);

  React.useEffect(() => {
    if (!isAuthenticated) {
      setIsLoadingAddresses(false);
      return;
    }
    loadAddresses();
  }, [isAuthenticated, loadAddresses]);

  const updateForm = (field: keyof typeof emptyForm, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "state" ? { localGovernment: "" } : {}),
    }));
  };

  const openAddModal = () => {
    setEditingAddressId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (address: Address) => {
    const meta = splitAddressLabel(address.line2);
    setEditingAddressId(address.id);
    setForm({
      label: meta.label,
      line1: address.line1,
      landmark: meta.landmark,
      city: address.city,
      state: address.state ?? "",
      localGovernment: address.localGovernment ?? "",
      country: address.country || "Nigeria",
      postalCode: address.postalCode ?? "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAddressId(null);
    setForm(emptyForm);
  };

  const saveAddress = async () => {
    if (!form.label.trim() || !form.line1.trim() || !form.city.trim() || !form.state.trim()) {
      kwikToast.error("Add address name, street, city, and state.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        line1: form.line1,
        line2: [form.label.trim(), form.landmark.trim()].filter(Boolean).join(" - "),
        city: form.city,
        state: form.state,
        localGovernment: form.localGovernment || undefined,
        country: form.country,
        postalCode: form.postalCode || undefined,
      };

      if (editingAddressId) {
        await usersApi.updateAddress(editingAddressId, payload);
        kwikToast.success("Delivery address updated");
      } else {
        await usersApi.addAddress({
          ...payload,
          type: "SHIPPING",
          isDefault: addresses.length === 0,
        });
        kwikToast.success("Delivery address added");
      }

      closeModal();
      loadAddresses();
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Could not save address.";
      kwikToast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAddress = async (id: string) => {
    try {
      await usersApi.deleteAddress(id);
      kwikToast.success("Address removed");
      setAddresses((current) => current.filter((item) => item.id !== id));
    } catch {
      kwikToast.error("Could not remove address.");
    }
  };

  const setDefault = async (id: string) => {
    try {
      await usersApi.setDefaultAddress(id);
      kwikToast.success("Default address updated");
      loadAddresses();
    } catch {
      kwikToast.error("Could not update default address.");
    }
  };

  if (isLoading) {
    return (
      <main className="bg-white px-4 py-6 dark:bg-[#07111f]">
        <div className="container mx-auto max-w-3xl">
          <div className="h-32 animate-pulse bg-neutral-100 dark:bg-white/10" />
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="bg-white px-4 py-6 dark:bg-[#07111f]">
        <div className="container mx-auto max-w-3xl">
          <section className="border border-neutral-200 p-5 dark:border-white/10">
            <h1 className="text-xl font-semibold text-kwik-dark dark:text-white">Delivery addresses</h1>
            <p className="mt-2 text-sm text-kwik-muted dark:text-white/60">Sign in to manage saved delivery details.</p>
            <Link href="/login?redirect=/profile/addresses" className="mt-5 inline-flex">
              <AppButton>Sign in</AppButton>
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-white px-4 py-6 dark:bg-[#07111f]">
      <div className="container mx-auto max-w-3xl space-y-5">
        <div className="flex items-center gap-3">
          <Link href="/profile" className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 dark:border-white/10" aria-label="Back to profile">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-kwik-dark dark:text-white">Delivery addresses</h1>
            <p className="text-sm text-kwik-muted dark:text-white/55">Saved places for checkout and dispatch.</p>
          </div>
          <AppButton size="sm" onClick={openAddModal}>
            <Plus className="h-4 w-4" />
            Add
          </AppButton>
        </div>

        {isLoadingAddresses ? (
          <div className="flex items-center justify-center border border-neutral-200 py-12 dark:border-white/10">
            <Loader2 className="h-6 w-6 animate-spin text-kwik-orange" />
          </div>
        ) : addresses.length === 0 ? (
          <section className="border border-dashed border-neutral-300 p-8 text-center dark:border-white/10">
            <Home className="mx-auto h-8 w-8 text-kwik-orange" />
            <h2 className="mt-3 text-base font-semibold text-kwik-dark dark:text-white">No delivery address yet</h2>
            <p className="mt-1 text-sm text-kwik-muted dark:text-white/55">Add home, office, or any place you receive orders.</p>
            <AppButton className="mt-5" onClick={openAddModal}>
              <Plus className="h-4 w-4" />
              Add delivery address
            </AppButton>
          </section>
        ) : (
          <div className="grid gap-3">
            {addresses.map((address) => {
              const meta = splitAddressLabel(address.line2);
              return (
                <article key={address.id} className="border border-neutral-200 p-4 dark:border-white/10">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-kwik-orange/10 text-kwik-orange">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-kwik-dark dark:text-white">{meta.label}</h2>
                        {address.isDefault && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            <Check className="h-3 w-3" />
                            Default
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm leading-6 text-kwik-muted dark:text-white/60">
                        {formatAddressParts([
                          address.line1,
                          meta.landmark,
                          address.city,
                          address.localGovernment,
                          address.state,
                          address.country,
                        ])}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button type="button" onClick={() => openEditModal(address)} className="flex h-9 w-9 items-center justify-center rounded-lg text-kwik-muted hover:bg-neutral-50 hover:text-kwik-orange" aria-label="Edit address">
                        <Pencil className="h-4 w-4" />
                      </button>
                      {!address.isDefault && (
                        <button type="button" onClick={() => setDefault(address.id)} className="flex h-9 w-9 items-center justify-center rounded-lg text-kwik-muted hover:bg-neutral-50 hover:text-kwik-orange" aria-label="Set as default">
                          <Star className="h-4 w-4" />
                        </button>
                      )}
                      <button type="button" onClick={() => deleteAddress(address.id)} className="flex h-9 w-9 items-center justify-center rounded-lg text-kwik-muted hover:bg-red-50 hover:text-red-600" aria-label="Delete address">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[140] flex items-end bg-black/45 p-4 sm:items-center sm:justify-center" role="dialog" aria-modal="true">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto bg-white p-5 shadow-2xl dark:bg-[#07111f]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-kwik-dark dark:text-white">
                  {editingAddressId ? "Edit delivery address" : "Add delivery address"}
                </h2>
                <p className="text-sm text-kwik-muted dark:text-white/55">
                  {editingAddressId ? "Update this saved delivery location." : "Name it Home, Office, Shop, or anything useful."}
                </p>
              </div>
              <button type="button" onClick={closeModal} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-white/10" aria-label="Close modal">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <FieldInput label="Address name" value={form.label} onChange={(event) => updateForm("label", event.target.value)} />
              <FieldInput label="City" value={form.city} onChange={(event) => updateForm("city", event.target.value)} />
              <FieldAutocomplete
                label="State"
                value={form.state}
                options={NIGERIA_STATES.map((state) => ({ value: state, label: state }))}
                onValueChange={(nextValue) => updateForm("state", nextValue)}
                placeholder="Type or select state"
              />
              <FieldAutocomplete
                label="Local government"
                value={form.localGovernment}
                options={getLgasForState(form.state).map((lga) => ({ value: lga, label: lga }))}
                onValueChange={(nextValue) => updateForm("localGovernment", nextValue)}
                placeholder="Type or select local government"
              />
              <FieldInput wrapperClassName="sm:col-span-2" label="Street address" value={form.line1} onChange={(event) => updateForm("line1", event.target.value)} />
              <FieldInput wrapperClassName="sm:col-span-2" label="Landmark or nearest bus stop" value={form.landmark} onChange={(event) => updateForm("landmark", event.target.value)} />
              <FieldInput label="Country" value={form.country} onChange={(event) => updateForm("country", event.target.value)} />
              <FieldInput label="Postal code" value={form.postalCode} onChange={(event) => updateForm("postalCode", event.target.value)} />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <AppButton type="button" variant="secondary" onClick={closeModal} fullWidth>Cancel</AppButton>
              <AppButton type="button" onClick={saveAddress} isLoading={isSaving} loadingLabel="Saving" fullWidth>
                {editingAddressId ? "Update address" : "Save address"}
              </AppButton>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
