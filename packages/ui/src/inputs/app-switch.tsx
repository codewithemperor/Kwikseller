"use client";

import React from "react";
import { Check, Moon, Power, Sun } from "lucide-react";
import { Switch } from "@heroui/react";
import { cn } from "../lib/utils";

export type AppSwitchProps = {
  isSelected: boolean;
  onChange: (selected: boolean) => void;
  label?: string;
  description?: string;
  mode?: "default" | "theme";
  className?: string;
};

export function AppSwitch({
  isSelected,
  onChange,
  label,
  description,
  mode = "default",
  className,
}: AppSwitchProps) {
  const OnIcon = mode === "theme" ? Sun : Check;
  const OffIcon = mode === "theme" ? Moon : Power;

  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      {(label || description) && (
        <div className="min-w-0">
          {label && <p className="text-sm font-semibold text-foreground">{label}</p>}
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      )}
      <Switch isSelected={isSelected} onValueChange={onChange} size="lg">
        {({ isSelected: selected }: { isSelected: boolean }) => (
          <Switch.Control className={selected ? "bg-accent/80" : ""}>
            <Switch.Thumb>
              <Switch.Icon>
                {selected ? (
                  <OnIcon className="size-3 text-inherit opacity-100" />
                ) : (
                  <OffIcon className="size-3 text-inherit opacity-70" />
                )}
              </Switch.Icon>
            </Switch.Thumb>
          </Switch.Control>
        )}
      </Switch>
    </div>
  );
}
