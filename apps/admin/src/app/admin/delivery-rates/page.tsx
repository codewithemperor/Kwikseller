"use client";

import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@heroui/react";
import { Edit3, Power, RotateCw, Truck } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { deliveryRatesApi, type DeliveryRate } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

const NIGERIA_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

const blankForm = {
  state: "Lagos",
  localGovernment: "",
  fee: 0,
  minDeliveryDays: 2,
  maxDeliveryDays: 5,
  isActive: true,
};

function unwrap<T>(value: unknown): T {
  if (value && typeof value === "object" && "data" in value) {
    return (value as { data: T }).data;
  }
  return value as T;
}

export default function DeliveryRatesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = React.useState(blankForm);
  const [editing, setEditing] = React.useState<DeliveryRate | null>(null);
  const [stateFilter, setStateFilter] = React.useState("");

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["admin-delivery-rates", stateFilter],
    queryFn: async () => {
      const response = await deliveryRatesApi.list({ state: stateFilter || undefined });
      return unwrap<DeliveryRate[]>(response.data);
    },
  });

  const rates = data ?? [];

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        fee: Number(form.fee),
        minDeliveryDays: Number(form.minDeliveryDays),
        maxDeliveryDays: Number(form.maxDeliveryDays),
      };
      return editing ? deliveryRatesApi.update(editing.id, payload) : deliveryRatesApi.create(payload);
    },
    onSuccess: () => {
      toast.success(editing ? "Delivery rate updated" : "Delivery rate saved");
      setEditing(null);
      setForm(blankForm);
      queryClient.invalidateQueries({ queryKey: ["admin-delivery-rates"] });
    },
    onError: (error: Error) => toast.danger(error.message || "Failed to save delivery rate"),
  });

  const deactivateMutation = useMutation({
    mutationFn: (rate: DeliveryRate) => deliveryRatesApi.update(rate.id, { isActive: !rate.isActive }),
    onSuccess: () => {
      toast.success("Delivery rate status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-delivery-rates"] });
    },
    onError: (error: Error) => toast.danger(error.message || "Failed to update status"),
  });

  const startEdit = (rate: DeliveryRate) => {
    setEditing(rate);
    setForm({
      state: rate.state,
      localGovernment: rate.localGovernment,
      fee: rate.fee,
      minDeliveryDays: rate.minDeliveryDays,
      maxDeliveryDays: rate.maxDeliveryDays,
      isActive: rate.isActive,
    });
  };

  const updateForm = (field: keyof typeof blankForm, value: string | number | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery Rates"
        description="Set platform delivery fees and windows by state and local government for manual dispatch."
        breadcrumbs={[{ label: "Delivery Rates" }]}
        actions={
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-foreground hover:bg-surface"
          >
            <RotateCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            saveMutation.mutate();
          }}
          className="border border-border bg-background p-5"
        >
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-accent" />
            <h2 className="font-heading text-base font-semibold text-foreground">
              {editing ? "Edit rate" : "Create rate"}
            </h2>
          </div>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">State</span>
              <select
                value={form.state}
                onChange={(event) => updateForm("state", event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-accent"
              >
                {NIGERIA_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">Local government</span>
              <input
                value={form.localGovernment}
                onChange={(event) => updateForm("localGovernment", event.target.value)}
                required
                placeholder="Ikeja"
                className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-accent"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">Fee</span>
              <input
                type="number"
                min={0}
                value={form.fee}
                onChange={(event) => updateForm("fee", Number(event.target.value))}
                className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-accent"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">Min days</span>
                <input
                  type="number"
                  min={0}
                  value={form.minDeliveryDays}
                  onChange={(event) => updateForm("minDeliveryDays", Number(event.target.value))}
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-accent"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">Max days</span>
                <input
                  type="number"
                  min={0}
                  value={form.maxDeliveryDays}
                  onChange={(event) => updateForm("maxDeliveryDays", Number(event.target.value))}
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-accent"
                />
              </label>
            </div>
            <label className="flex items-center justify-between border border-border px-3 py-2 text-sm text-foreground">
              Active for checkout
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => updateForm("isActive", event.target.checked)}
                className="h-4 w-4"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground disabled:opacity-50"
              >
                {saveMutation.isPending ? "Saving..." : editing ? "Update rate" : "Save rate"}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setForm(blankForm);
                  }}
                  className="h-10 rounded-lg border border-border px-4 text-sm font-semibold text-foreground"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </form>

        <section className="border border-border bg-background">
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-base font-semibold text-foreground">Platform locations</h2>
              <p className="text-sm text-muted-foreground">{rates.length} configured rate{rates.length === 1 ? "" : "s"}</p>
            </div>
            <select
              value={stateFilter}
              onChange={(event) => setStateFilter(event.target.value)}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-accent"
            >
              <option value="">All states</option>
              {NIGERIA_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <div className="p-8 text-sm text-muted-foreground">Loading delivery rates...</div>
          ) : rates.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">State</th>
                    <th className="px-4 py-3 font-semibold">Local government</th>
                    <th className="px-4 py-3 font-semibold">Fee</th>
                    <th className="px-4 py-3 font-semibold">Window</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rates.map((rate) => (
                    <tr key={rate.id}>
                      <td className="px-4 py-3 font-medium text-foreground">{rate.state}</td>
                      <td className="px-4 py-3 text-muted-foreground">{rate.localGovernment}</td>
                      <td className="px-4 py-3 font-semibold text-foreground">{formatCurrency(rate.fee)}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {rate.minDeliveryDays}-{rate.maxDeliveryDays} days
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${rate.isActive ? "bg-success/10 text-success" : "bg-default-100 text-muted-foreground"}`}>
                          {rate.isActive ? "Active" : "Paused"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(rate)}
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2 text-xs font-semibold text-foreground hover:bg-surface"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deactivateMutation.mutate(rate)}
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2 text-xs font-semibold text-foreground hover:bg-surface"
                          >
                            <Power className="h-3.5 w-3.5" />
                            {rate.isActive ? "Pause" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center">
              <Truck className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <h3 className="mt-3 font-heading text-base font-semibold text-foreground">No delivery rates yet</h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Add rates by state and local government before physical checkout can calculate delivery.
              </p>
            </div>
          )}
        </section>
      </section>
    </div>
  );
}

