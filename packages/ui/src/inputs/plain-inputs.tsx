"use client";

import React from "react";
import { cn } from "../lib/utils";

const baseControl =
  "mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none ring-0 transition placeholder:text-muted-foreground focus:border-border focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white";

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
