"use client";

import React from "react";
import { Palette } from "lucide-react";
import { ColorField, ColorPicker, ColorSwatch } from "@heroui/react";
import { cn } from "../lib/utils";

export type AppColorPickerProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
  className?: string;
};

function normalizeHex(value: string) {
  const trimmed = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed.toUpperCase() : "#071A2F";
}

export function AppColorPicker({
  label,
  value,
  onChange,
  description,
  className,
}: AppColorPickerProps) {
  const safeValue = normalizeHex(value);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <ColorPicker value={safeValue} onChange={(color: any) => onChange(color?.toString?.("hex") ?? safeValue)}>
          <ColorPicker.Trigger className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background shadow-sm">
            <ColorSwatch color={safeValue} className="h-7 w-7 rounded-full" />
          </ColorPicker.Trigger>
          <ColorPicker.Popover className="z-[80] rounded-2xl border border-border bg-background p-3 shadow-2xl">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Palette className="h-4 w-4" />
              Pick color
            </div>
            <input
              type="color"
              value={safeValue}
              onChange={(event) => onChange(event.target.value.toUpperCase())}
              className="mt-3 h-12 w-full cursor-pointer rounded-xl border border-border bg-background"
            />
          </ColorPicker.Popover>
        </ColorPicker>
      </div>
      <ColorField value={safeValue} onChange={(color: any) => onChange(color?.toString?.("hex") ?? safeValue)}>
        <ColorField.Group className="h-11 rounded-xl border border-border bg-background px-3">
          <ColorField.Input className="text-sm font-semibold uppercase outline-none" />
        </ColorField.Group>
      </ColorField>
    </div>
  );
}
