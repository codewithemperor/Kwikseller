"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  Moon,
  Globe,
  Check,
  Loader2,
  Save,
  Volume2,
  VolumeX,
} from "lucide-react";
import { AccountLayout } from "@/components/layout/account-layout";
import { PageLoading } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { kwikToast } from "@kwikseller/utils";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  type NotificationChannel,
  type NotificationPreferenceGroup,
} from "@/lib/order-api";
import { cn } from "@/lib/utils";

/* ─── Channel metadata ─────────────────────────────────────────────────── */

const CHANNEL_META: Record<
  NotificationChannel,
  { label: string; icon: React.ComponentType<{ className?: string }>; accent: string }
> = {
  email: {
    label: "Email",
    icon: Mail,
    accent: "text-kwik-orange",
  },
  push: {
    label: "Push",
    icon: Smartphone,
    accent: "text-kwik-amber",
  },
  sms: {
    label: "SMS",
    icon: MessageSquare,
    accent: "text-kwik-green",
  },
};

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  ha: "Hausa",
  yo: "Yoruba",
  ig: "Igbo",
};

/* ─── Toggle switch ────────────────────────────────────────────────────── */

function ToggleSwitch({
  checked,
  onChange,
  disabled,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kwik-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-kwik-orange" : "bg-kwik-border-light",
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
  );
}

/* ─── Preference group row ─────────────────────────────────────────────── */

function PreferenceRow({
  group,
  onToggle,
  saving,
}: {
  group: NotificationPreferenceGroup;
  onToggle: (channel: NotificationChannel, next: boolean) => void;
  saving: boolean;
}) {
  return (
    <div className="rounded-2xl border border-kwik-border-light bg-background p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-kwik-dark">{group.label}</h3>
          <p className="mt-0.5 text-xs leading-5 text-kwik-muted">{group.description}</p>
        </div>
        <div className="flex items-center gap-4 sm:gap-5">
          {(Object.keys(CHANNEL_META) as NotificationChannel[]).map((ch) => {
            const meta = CHANNEL_META[ch];
            const Icon = meta.icon;
            const enabled = group.channels[ch];
            return (
              <div key={ch} className="flex items-center gap-2">
                <Icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    enabled ? meta.accent : "text-kwik-gray-light",
                  )}
                />
                <span
                  className={cn(
                    "hidden text-xs font-medium sm:inline-block",
                    enabled ? "text-kwik-dark" : "text-kwik-gray-light",
                  )}
                >
                  {meta.label}
                </span>
                <ToggleSwitch
                  checked={enabled}
                  disabled={saving}
                  onChange={(next) => onToggle(ch, next)}
                  ariaLabel={`${group.label} ${meta.label} notifications`}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Do Not Disturb card ──────────────────────────────────────────────── */

function DoNotDisturbCard({
  enabled,
  startHour,
  endHour,
  onEnabledChange,
  onHourChange,
  saving,
}: {
  enabled: boolean;
  startHour: number;
  endHour: number;
  onEnabledChange: (next: boolean) => void;
  onHourChange: (which: "startHour" | "endHour", value: number) => void;
  saving: boolean;
}) {
  const formatHour = (h: number) => {
    const period = h < 12 ? "AM" : "PM";
    const display = h % 12 === 0 ? 12 : h % 12;
    return `${display}:00 ${period}`;
  };

  return (
    <div className="rounded-2xl border border-kwik-border-light bg-background p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4 text-kwik-violet" />
            <h3 className="text-sm font-semibold text-kwik-dark">Do Not Disturb</h3>
          </div>
          <p className="mt-0.5 text-xs leading-5 text-kwik-muted">
            Silence non-essential push notifications during your chosen hours.
            Order updates and security alerts still come through.
          </p>
        </div>
        <ToggleSwitch
          checked={enabled}
          disabled={saving}
          onChange={onEnabledChange}
          ariaLabel="Toggle Do Not Disturb"
        />
      </div>

      {enabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.2 }}
          className="mt-4 grid grid-cols-2 gap-3 overflow-hidden"
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-kwik-muted">Starts at</span>
            <select
              value={startHour}
              disabled={saving}
              onChange={(e) => onHourChange("startHour", Number(e.target.value))}
              className="rounded-lg border border-kwik-border-light bg-background px-3 py-2 text-sm font-medium text-kwik-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kwik-orange"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {formatHour(i)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-kwik-muted">Ends at</span>
            <select
              value={endHour}
              disabled={saving}
              onChange={(e) => onHourChange("endHour", Number(e.target.value))}
              className="rounded-lg border border-kwik-border-light bg-background px-3 py-2 text-sm font-medium text-kwik-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kwik-orange"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {formatHour(i)}
                </option>
              ))}
            </select>
          </label>
        </motion.div>
      )}

      {enabled && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-kwik-muted">
          <VolumeX className="h-3.5 w-3.5" />
          Quiet hours: {formatHour(startHour)} → {formatHour(endHour)}
        </p>
      )}
    </div>
  );
}

/* ─── Language card ────────────────────────────────────────────────────── */

function LanguageCard({
  language,
  onChange,
  saving,
}: {
  language: "en" | "ha" | "yo" | "ig";
  onChange: (next: "en" | "ha" | "yo" | "ig") => void;
  saving: boolean;
}) {
  const options: Array<{ value: "en" | "ha" | "yo" | "ig"; label: string; flag: string }> = [
    { value: "en", label: "English", flag: "🇳🇬" },
    { value: "ha", label: "Hausa", flag: "🟠" },
    { value: "yo", label: "Yoruba", flag: "🟢" },
    { value: "ig", label: "Igbo", flag: "🔵" },
  ];
  return (
    <div className="rounded-2xl border border-kwik-border-light bg-background p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-kwik-orange" />
        <h3 className="text-sm font-semibold text-kwik-dark">Preferred language</h3>
      </div>
      <p className="mt-0.5 text-xs leading-5 text-kwik-muted">
        Choose the language for transactional emails and push notifications.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {options.map((opt) => {
          const active = language === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={saving}
              onClick={() => onChange(opt.value)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kwik-orange focus-visible:ring-offset-1",
                active
                  ? "border-kwik-orange bg-kwik-orange/10 text-kwik-orange"
                  : "border-kwik-border-light text-kwik-muted hover:border-kwik-orange/40 hover:text-kwik-dark",
              )}
            >
              <span aria-hidden>{opt.flag}</span>
              {opt.label}
              {active && <Check className="h-3.5 w-3.5" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Page header ──────────────────────────────────────────────────────── */

function PageHeader({ updatedAt }: { updatedAt?: string }) {
  return (
    <section className="kwik-gradient relative overflow-hidden rounded-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_55%)]" />
      <div className="relative p-5 sm:p-7">
        <Link
          href="/profile"
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-white/85 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to profile
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/80">
            Account preferences
          </p>
          <h1 className="mt-1 flex items-center gap-2 font-heading text-3xl font-bold text-white sm:text-4xl">
            <Bell className="h-7 w-7" />
            Notification preferences
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85">
            Choose how Kwikseller reaches you. Order updates and security
            alerts remain on by default — you can disable marketing and
            promotional channels anytime.
          </p>
          {updatedAt && (
            <p className="mt-3 text-xs text-white/60">
              Last updated: {new Intl.DateTimeFormat("en-NG", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(updatedAt))}
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Inner page ──────────────────────────────────────────────────────── */

function NotificationPreferencesPageInner() {
  const { data: prefs, isLoading, isError } = useNotificationPreferences();
  const update = useUpdateNotificationPreferences();

  // Local mirror so toggles feel instant even before the network round-trips.
  // We seed from server data and re-sync when server data changes.
  const localPrefs = useMemo(() => prefs, [prefs]);

  function handleChannelToggle(
    groupKey: string,
    channel: NotificationChannel,
    next: boolean,
  ) {
    if (!localPrefs) return;
    const groups = localPrefs.groups.map((g) =>
      g.key === groupKey ? { ...g, channels: { ...g.channels, [channel]: next } } : g,
    );
    update.mutate({ groups });
    kwikToast.success(
      next ? "Channel enabled" : "Channel disabled",
      `${groupKey.replace(/_/g, " ")} · ${channel.toUpperCase()}`,
    );
  }

  function handleDndToggle(next: boolean) {
    if (!localPrefs) return;
    update.mutate({
      doNotDisturb: { ...localPrefs.doNotDisturb, enabled: next },
    });
    kwikToast.info(
      next ? "Do Not Disturb on" : "Do Not Disturb off",
      next
        ? "Only order and security alerts will come through during quiet hours."
        : "You'll receive all notifications again.",
    );
  }

  function handleDndHourChange(which: "startHour" | "endHour", value: number) {
    if (!localPrefs) return;
    update.mutate({
      doNotDisturb: { ...localPrefs.doNotDisturb, [which]: value },
    });
  }

  function handleLanguageChange(next: "en" | "ha" | "yo" | "ig") {
    if (!localPrefs) return;
    update.mutate({ language: next });
    kwikToast.success("Language updated", LANGUAGE_LABELS[next]);
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageLoading label="Loading notification preferences…" />
      </div>
    );
  }

  if (isError || !localPrefs) {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState
          variant="error"
          title="Couldn't load preferences"
          description="We couldn't reach the notification preferences service. Please try again."
          action={
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-kwik-orange px-4 text-sm font-semibold text-white transition-colors hover:bg-kwik-orange-hover"
            >
              Retry
            </button>
          }
          className="rounded-2xl border border-kwik-border bg-background"
        />
      </div>
    );
  }

  const saving = update.isPending;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader updatedAt={localPrefs.updatedAt} />

      {/* Channel legend */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-kwik-border-light bg-kwik-bg-surface px-4 py-3 text-xs">
        <span className="font-medium text-kwik-muted">Channels:</span>
        {(Object.keys(CHANNEL_META) as NotificationChannel[]).map((ch) => {
          const meta = CHANNEL_META[ch];
          const Icon = meta.icon;
          return (
            <span key={ch} className="flex items-center gap-1.5 text-kwik-dark">
              <Icon className={cn("h-3.5 w-3.5", meta.accent)} />
              {meta.label}
            </span>
          );
        })}
        <span className="ml-auto flex items-center gap-1.5 text-kwik-muted">
          {saving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Volume2 className="h-3.5 w-3.5 text-kwik-green" />
              Auto-saved
            </>
          )}
        </span>
      </div>

      {/* Preference groups */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-3"
      >
        <h2 className="px-1 text-[11px] font-semibold uppercase tracking-wider text-kwik-gray-light">
          Notification types
        </h2>
        {localPrefs.groups.map((group) => (
          <PreferenceRow
            key={group.key}
            group={group}
            onToggle={(ch, next) => handleChannelToggle(group.key, ch, next)}
            saving={saving}
          />
        ))}
      </motion.div>

      {/* Quiet hours + language */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="space-y-3"
      >
        <h2 className="px-1 text-[11px] font-semibold uppercase tracking-wider text-kwik-gray-light">
          Schedule & language
        </h2>
        <DoNotDisturbCard
          enabled={localPrefs.doNotDisturb.enabled}
          startHour={localPrefs.doNotDisturb.startHour}
          endHour={localPrefs.doNotDisturb.endHour}
          onEnabledChange={handleDndToggle}
          onHourChange={handleDndHourChange}
          saving={saving}
        />
        <LanguageCard
          language={localPrefs.language}
          onChange={handleLanguageChange}
          saving={saving}
        />
      </motion.div>

      {/* Help footer */}
      <div className="flex items-start gap-3 rounded-2xl border border-kwik-orange/15 bg-kwik-orange/5 p-4 text-sm leading-6 text-kwik-dark">
        <Save className="mt-0.5 h-4 w-4 shrink-0 text-kwik-orange" />
        <div>
          <p className="font-semibold">Changes save automatically.</p>
          <p className="mt-1 text-xs leading-5 text-kwik-muted">
            We apply your preferences instantly. Order-critical notifications
            (payment failures, delivery issues, account security) may still be
            sent even if you opt out — that&apos;s required to keep your account
            safe and your orders moving.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function NotificationPreferencesPage() {
  return (
    <AccountLayout>
      <NotificationPreferencesPageInner />
    </AccountLayout>
  );
}
