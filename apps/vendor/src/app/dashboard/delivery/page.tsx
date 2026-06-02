"use client";

import React from "react";
import { Clock, PackageCheck, Save, Truck } from "lucide-react";
import {
  VendorMetricCard,
  VendorPageHeader,
  VendorSoftPanel,
} from "@/components/dashboard/vendor-dashboard-ui";
import { KwiksellerLoader } from "@/components/kwikseller-loader";
import { unwrapApiData } from "@/lib/vendor-format";
import { vendorCommerceApi } from "@kwikseller/api-client";
import { AppButton, AppSwitch, FieldInput, FieldTextarea } from "@kwikseller/ui";
import { kwikToast } from "@kwikseller/utils";

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
    return <KwiksellerLoader />;
  }

  return (
    <div className="space-y-6">
      <VendorPageHeader
        title="Delivery"
        description="Set manual delivery rules for your physical products. Kwikseller delivery remains visible as coming soon."
        action={
          <AppButton type="button" size="lg" onClick={save} disabled={isSaving}>
            <Save className="h-4 w-4" />
            Save delivery
          </AppButton>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <VendorMetricCard label="Manual delivery" value={settings.manualDeliveryEnabled ? "Live" : "Off"} note="Vendor controlled" icon={Truck} tone="success" />
        <VendorMetricCard label="Processing" value={`${settings.processingDays || 1} day${Number(settings.processingDays || 1) === 1 ? "" : "s"}`} note="Before dispatch" icon={Clock} tone="accent" />
        <VendorMetricCard label="Kwikseller delivery" value="Soon" note="Not enabled yet" icon={PackageCheck} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <VendorSoftPanel title="Manual delivery" description="You control dispatch timing, notes, and return policy.">
          <div className="space-y-4">
            <div className="rounded-[22px] bg-surface p-4">
              <AppSwitch
                isSelected={settings.manualDeliveryEnabled}
                onChange={(selected) => setSettings((current) => ({ ...current, manualDeliveryEnabled: selected }))}
                label="Manual delivery"
                description="Allow customers to buy shippable products from your store."
              />
            </div>
            <FieldInput
              type="number"
              min={0}
              label="Processing days"
              value={settings.processingDays}
              onChange={(event) => setSettings((current) => ({ ...current, processingDays: Number(event.target.value) }))}
              className="h-12 rounded-2xl bg-white dark:bg-white/5"
            />
            <FieldTextarea
              label="Dispatch note"
              placeholder="Example: Orders before 2pm dispatch same day inside Lagos."
              value={settings.dispatchNote ?? ""}
              onChange={(event) => setSettings((current) => ({ ...current, dispatchNote: event.target.value }))}
              className="rounded-2xl bg-white dark:bg-white/5"
            />
            <FieldTextarea
              label="Return policy"
              placeholder="Example: Returns accepted within 3 days for unopened items."
              value={settings.returnPolicy ?? ""}
              onChange={(event) => setSettings((current) => ({ ...current, returnPolicy: event.target.value }))}
              className="rounded-2xl bg-white dark:bg-white/5"
            />
          </div>
        </VendorSoftPanel>

        <VendorSoftPanel title="Kwikseller delivery" description="Platform-managed pickup, rates, riders, and live tracking.">
          <div className="rounded-[22px] bg-surface p-4">
            <AppSwitch
              isSelected={false}
              onChange={() => undefined}
              label="Coming soon"
              description="Disabled until operations rollout."
            />
          </div>
          <button disabled className="mt-5 h-12 w-full cursor-not-allowed rounded-2xl bg-muted/20 text-sm font-semibold text-muted-foreground">
            Not available yet
          </button>
        </VendorSoftPanel>
      </section>
      {isSaving ? <KwiksellerLoader overlay /> : null}
    </div>
  );
}
