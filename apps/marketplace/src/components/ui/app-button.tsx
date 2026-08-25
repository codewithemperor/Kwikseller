"use client";

import { Button, type ButtonProps } from "@heroui/react";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AppButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type AppButtonSize = "sm" | "md" | "lg";

export type AppButtonProps = Omit<
  ButtonProps,
  "children" | "className" | "variant" | "size" | "fullWidth" | "isDisabled"
> & {
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
};

const variantClass: Record<AppButtonVariant, string> = {
  primary: "border border-accent bg-accent text-accent-foreground hover:brightness-95",
  secondary:
    "border border-border bg-background text-foreground hover:border-accent hover:text-accent dark:border-white/12 dark:bg-white/[0.03] dark:text-white",
  ghost:
    "text-foreground hover:bg-surface dark:text-white dark:hover:bg-white/10",
  danger:
    "border border-red-600 bg-red-600 text-white hover:bg-red-700",
};

const sizeClass: Record<AppButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
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
    <Button
      {...props}
      isDisabled={disabled || isLoading}
      variant="primary"
      size="md"
      fullWidth={fullWidth}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold shadow-none transition-colors focus:outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        variantClass[variant],
        sizeClass[size],
        className,
      )}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {isLoading ? loadingLabel ?? children : children}
    </Button>
  );
}
