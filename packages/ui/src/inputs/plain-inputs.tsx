"use client";

import React from "react";
import { cn } from "../lib/utils";

const baseControl =
  "mt-1 h-12 w-full rounded-md border border-border bg-field-background px-3 text-base text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-[#07111f] dark:text-white";

export type FieldInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  wrapperClassName?: string;
};

export function FieldInput({
  label,
  error,
  className,
  wrapperClassName,
  ...props
}: FieldInputProps) {
  return (
    <label className={cn("block", wrapperClassName)}>
      {label && (
        <span className="text-xs font-semibold text-muted dark:text-white/60">
          {label}
        </span>
      )}
      <input {...props} className={cn(baseControl, className)} />
      {error && <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>}
    </label>
  );
}

export type FieldTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
  wrapperClassName?: string;
};

export function FieldTextarea({
  label,
  error,
  className,
  wrapperClassName,
  ...props
}: FieldTextareaProps) {
  return (
    <label className={cn("block", wrapperClassName)}>
      {label && (
        <span className="text-xs font-semibold text-muted dark:text-white/60">
          {label}
        </span>
      )}
      <textarea
        {...props}
        className={cn(
          baseControl,
          "min-h-24 py-2",
          className,
        )}
      />
      {error && <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>}
    </label>
  );
}

export type FieldSelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  wrapperClassName?: string;
};

export function FieldSelect({
  label,
  error,
  className,
  wrapperClassName,
  children,
  ...props
}: FieldSelectProps) {
  return (
    <label className={cn("block", wrapperClassName)}>
      {label && (
        <span className="text-xs font-semibold text-muted dark:text-white/60">
          {label}
        </span>
      )}
      <select {...props} className={cn(baseControl, className)}>
        {children}
      </select>
      {error && <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>}
    </label>
  );
}
