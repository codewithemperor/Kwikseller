"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type AppButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type AppButtonSize = "sm" | "md" | "lg";

export type AppButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
};

const variantClass: Record<AppButtonVariant, string> = {
  primary: "bg-accent text-accent-foreground hover:brightness-95",
  secondary:
    "border border-border bg-background text-foreground hover:border-accent hover:text-accent dark:border-white/10 dark:bg-white/5 dark:text-white",
  ghost:
    "text-foreground hover:bg-surface dark:text-white dark:hover:bg-white/10",
  danger:
    "bg-red-600 text-white hover:bg-red-700",
};

const sizeClass: Record<AppButtonSize, string> = {
  sm: "h-9 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-sm",
};

export function AppButton({
  variant = "primary",
  size = "md",
  fullWidth = false,
  isLoading = false,
  loadingLabel,
  disabled,
  className,
  children,
  ...props
}: AppButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition focus:outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        variantClass[variant],
        sizeClass[size],
        fullWidth && "w-full",
        className,
      )}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {isLoading ? loadingLabel ?? children : children}
    </button>
  );
}
