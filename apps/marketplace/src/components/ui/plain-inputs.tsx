"use client";

import type { Key } from "@heroui/react";
import {
  Autocomplete,
  EmptyState,
  Label,
  ListBox,
  SearchField,
  useFilter,
} from "@heroui/react";
import React from "react";
import { cn } from "@/lib/utils";

const baseControl =
  "mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground shadow-none outline-none ring-0 transition-colors placeholder:text-muted-foreground/70 hover:border-muted-foreground/45 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/12 dark:bg-white/[0.03] dark:text-white";

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

export type FieldAutocompleteOption = {
  value: string;
  label: string;
};

export type FieldAutocompleteProps = {
  label?: string;
  error?: string;
  wrapperClassName?: string;
  className?: string;
  value: string;
  options: FieldAutocompleteOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  allowCustomValue?: boolean;
  onValueChange: (value: string) => void;
};

export function FieldAutocomplete({
  label,
  error,
  wrapperClassName,
  className,
  value,
  options,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  emptyText = "No results found",
  disabled,
  allowCustomValue = true,
  onValueChange,
}: FieldAutocompleteProps) {
  const { contains } = useFilter({ sensitivity: "base" });
  const selectedKey = value ? value : null;
  const hasSelectedOption = options.some((option) => option.value === value);
  const items =
    value && allowCustomValue && !hasSelectedOption
      ? [{ value, label: value }, ...options]
      : options;

  const handleChange = (key: Key | Key[] | null) => {
    if (Array.isArray(key)) {
      onValueChange(String(key[0] ?? ""));
      return;
    }
    onValueChange(key == null ? "" : String(key));
  };

  return (
    <div className={cn("block", wrapperClassName)}>
      <Autocomplete
        className="w-full"
        value={selectedKey}
        // @ts-expect-error HeroUI Autocomplete inputValue type mismatch
        inputValue={value}
        isDisabled={disabled}
        onChange={handleChange}
        onInputChange={(nextValue: string) => {
          if (allowCustomValue) onValueChange(nextValue);
        }}
      >
        {label && (
          <Label className="text-xs font-semibold text-muted dark:text-white/60">
            {label}
          </Label>
        )}
        <Autocomplete.Trigger
          className={cn(
            baseControl,
            "flex items-center gap-2 py-0",
            className,
          )}
        >
          <Autocomplete.Value className="min-w-0 flex-1 text-sm truncate">
            {value || placeholder}
          </Autocomplete.Value >
          <Autocomplete.ClearButton className="text-muted hover:text-foreground" />
          <Autocomplete.Indicator className="text-muted" />
        </Autocomplete.Trigger>
        <Autocomplete.Popover className="rounded-lg border border-border bg-background p-2 shadow-none dark:border-white/12 dark:bg-[#07111f]">
          <Autocomplete.Filter filter={contains}>
            <SearchField autoFocus name="search" variant="secondary">
              <SearchField.Group className="flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-3 shadow-none transition-colors focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15 dark:border-white/12 dark:bg-white/[0.03]">
                <SearchField.SearchIcon className="h-4 w-4 text-muted" />
                <SearchField.Input
                  placeholder={searchPlaceholder}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <SearchField.ClearButton className="text-muted hover:text-foreground" />
              </SearchField.Group>
            </SearchField>
            <ListBox
              className="mt-2 max-h-56 overflow-y-auto"
              renderEmptyState={() => <EmptyState>{emptyText}</EmptyState>}
            >
              {items.map((item) => (
                <ListBox.Item
                  key={item.value}
                  id={item.value}
                  textValue={item.label}
                  className="rounded-md px-3 py-2 text-sm hover:bg-muted/40"
                >
                  {item.label}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Autocomplete.Filter>
        </Autocomplete.Popover>
      </Autocomplete>
      {error && <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>}
    </div>
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
      <select
        {...props}
        className={cn(
          baseControl,
          "[&>option]:bg-background [&>option]:text-foreground dark:[&>option]:bg-neutral-900 dark:[&>option]:text-white",
          className,
        )}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>}
    </label>
  );
}
