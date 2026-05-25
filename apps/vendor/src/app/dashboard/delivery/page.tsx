"use client";

import React from "react";
import { Save, Truck } from "lucide-react";
import { vendorCommerceApi } from "@kwikseller/api-client";
import { kwikToast } from "@kwikseller/utils";
import { AppButton, FieldInput, FieldTextarea } from "@kwikseller/ui";
import { unwrapApiData } from "@/lib/vendor-format";

type DeliverySettings = {
  manualDeliveryEnabled: boolean;
  kwiksellerDeliveryEnabled: boolean;
  processingDays: number;
  dispatchNote?: string | null;
  returnPolicy?: string | null;
};

const defaults: DeliverySettings = {
  manualDeliveryEnabled: true,
  kwiksellerDeliveryEnabled: false,
  processingDays: 1,
  dispatchNote: "",
  returnPolicy: "",
};

export default function VendorDeliveryPage() {
  const [settings, setSettings] = React.useState<DeliverySettings>(defaults);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    vendorCommerceApi
      .getDeliverySettings()
      .then((response) => setSettings({ ...defaults, ...unwrapApiData<DeliverySettings>(response.data) }))
      .catch(() => kwikToast.error("Could not load delivery settings"))
      .finally(() => setIsLoading(false));
  }, []);

  const save = async () => {
    setIsSaving(true);
    try {
      const response = await vendorCommerceApi.updateDeliverySettings({
        manualDeliveryEnabled: settings.manualDeliveryEnabled,
        kwiksellerDeliveryEnabled: false,
        processingDays: Number(settings.processingDays || 1),
        dispatchNote: settings.dispatchNote || undefined,
        returnPolicy: settings.returnPolicy || undefined,
      });
      setSettings({ ...defaults, ...unwrapApiData<DeliverySettings>(response.data) });
      kwikToast.success("Delivery settings saved");
    } catch (error) {
      kwikToast.error(error instanceof Error ? error.message : "Could not save delivery settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-[40vh] animate-pulse rounded-3xl bg-surface" />;
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Delivery</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Manual delivery is active for v1. Kwikseller delivery is visible as coming soon but disabled until operations are ready.
          </p>
        </div>
        <AppButton type="button" onClick={save} isLoading={isSaving} loadingLabel="Saving...">
          <Save className="h-4 w-4" />
          Save delivery
        </AppButton>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4 border border-border bg-background p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4 border border-border p-4">
            <div className="flex gap-3">
              <div className="flex h-11 w-11 items-center justify-center bg-accent-soft text-accent-soft-foreground">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-heading text-base font-semibold">Manual delivery</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  You control dispatch timing and customer delivery notes.
                </p>
              </div>
            </div>
            <span className="bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Live</span>
          </div>

          <FieldInput
            type="number"
            min={0}
            label="Processing days"
            value={settings.processingDays}
            onChange={(event) => setSettings((current) => ({ ...current, processingDays: Number(event.target.value) }))}
          />
          <FieldTextarea
            label="Dispatch note"
            placeholder="Example: Orders before 2pm dispatch same day inside Lagos."
            value={settings.dispatchNote ?? ""}
            onChange={(event) => setSettings((current) => ({ ...current, dispatchNote: event.target.value }))}
          />
          <FieldTextarea
            label="Return policy"
            placeholder="Example: Returns accepted within 3 days for unopened items."
            value={settings.returnPolicy ?? ""}
            onChange={(event) => setSettings((current) => ({ ...current, returnPolicy: event.target.value }))}
          />
        </div>

        <aside className="h-fit border border-border bg-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Coming soon</p>
          <h2 className="mt-3 font-heading text-lg font-semibold">Kwikseller delivery</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Platform-managed pickup, rates, riders, and live tracking will be enabled after operations rollout.
          </p>
          <button disabled className="mt-5 h-11 w-full cursor-not-allowed bg-muted/20 text-sm font-semibold text-muted-foreground">
            Not available yet
          </button>
        </aside>
      </section>
    </div>
  );
}
