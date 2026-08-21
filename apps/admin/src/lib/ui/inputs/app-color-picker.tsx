"use client";

import React from "react";
import type { ColorChannel, ColorSpace } from "@heroui/react";
import {
  ColorArea,
  ColorField,
  ColorPicker,
  ColorSlider,
  ColorSwatch,
  Label,
  ListBox,
  Select,
} from "@heroui/react";
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

const colorChannelsByColorSpace: Record<ColorSpace, ColorChannel[]> = {
  hsb: ["hue", "saturation", "brightness"],
  hsl: ["hue", "saturation", "lightness"],
  rgb: ["red", "green", "blue"],
};

function colorToHex(color: any, fallback: string) {
  const next = color?.toString?.("hex") ?? color?.toString?.();
  return typeof next === "string" && next.startsWith("#")
    ? next.toUpperCase()
    : fallback;
}

export function AppColorPicker({
  label,
  value,
  onChange,
  description,
  className,
}: AppColorPickerProps) {
  const [colorSpace, setColorSpace] = React.useState<ColorSpace>("hsl");
  const safeValue = normalizeHex(value);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <ColorPicker value={safeValue} onChange={(color: any) => onChange(colorToHex(color, safeValue))}>
          <ColorPicker.Trigger className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background">
            <ColorSwatch color={safeValue} size="lg" className="h-7 w-7 rounded-full" />
          </ColorPicker.Trigger>
          <ColorPicker.Popover className="z-[80] max-w-64 gap-2 rounded-2xl border border-border bg-background p-3">
            <ColorArea
              className="max-w-full"
              colorSpace="hsb"
              xChannel="saturation"
              yChannel="brightness"
            >
              <ColorArea.Thumb />
            </ColorArea>
            <ColorSlider channel="hue" className="gap-1 px-1" colorSpace="hsb">
              <Label>Hue</Label>
              <ColorSlider.Output className="text-muted-foreground" />
              <ColorSlider.Track>
                <ColorSlider.Thumb />
              </ColorSlider.Track>
            </ColorSlider>
            <Select
              aria-label="Color space"
              value={colorSpace}
              variant="secondary"
              onChange={(next: ColorSpace | { target?: { value?: ColorSpace } }) => {
                setColorSpace(typeof next === "string" ? next : next.target?.value || "hsl");
              }}
            >
              <Select.Trigger>
                <Select.Value className="uppercase" />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {Object.keys(colorChannelsByColorSpace).map((space) => (
                    <ListBox.Item key={space} className="uppercase" id={space} textValue={space}>
                      {space}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
            <div className="grid w-full grid-cols-3 items-center gap-2">
              {colorChannelsByColorSpace[colorSpace].map((channel) => (
                <ColorField
                  key={channel}
                  aria-label={channel}
                  channel={channel}
                  colorSpace={colorSpace}
                >
                  <ColorField.Group variant="secondary">
                    <ColorField.Input />
                  </ColorField.Group>
                </ColorField>
              ))}
            </div>
          </ColorPicker.Popover>
        </ColorPicker>
      </div>
      <ColorField value={safeValue} onChange={(color: any) => onChange(colorToHex(color, safeValue))}>
        <ColorField.Group className="h-11 rounded-xl border border-border bg-background px-3">
          <ColorField.Input className="text-sm font-semibold uppercase outline-none" />
        </ColorField.Group>
      </ColorField>
    </div>
  );
}
