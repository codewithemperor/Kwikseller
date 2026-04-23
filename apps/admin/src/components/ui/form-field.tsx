"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface FormFieldProps {
  label: string;
  name: string;
  type?: "text" | "number" | "email" | "password" | "textarea" | "url";
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  description?: string;
  error?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: () => void;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  className?: string;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  rows?: number;
}

export function FormField({ label, name, type = "text", placeholder, required = false, disabled = false, description, error, value, onChange, onBlur, startContent, endContent, className, min, max, step, rows = 3 }: FormFieldProps) {
  const inputCls = "w-full rounded-lg border border-default-200 bg-default-50 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-50";
  const labelCls = "block text-sm font-medium mb-1.5";

  if (type === "textarea") {
    return (
      <div className={cn("space-y-1.5", className)}>
        <label className={labelCls}>{label}{required && <span className="text-danger">*</span>}</label>
        <textarea name={name} placeholder={placeholder} disabled={disabled} value={value as string} onChange={onChange} onBlur={onBlur} rows={rows} className={cn(inputCls, "min-h-[60px] resize-y")} />
        {description && !error && <p className="text-xs text-muted-foreground">{description}</p>}
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <label className={labelCls}>{label}{required && <span className="text-danger">*</span>}</label>
      <div className="relative">
        {startContent && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">{startContent}</span>}
        <input name={name} type={type} placeholder={placeholder} disabled={disabled} value={value as string} onChange={onChange} onBlur={onBlur} min={min} max={max} step={step} className={cn(inputCls, startContent && "pl-9", endContent && "pr-9")} />
        {endContent && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">{endContent}</span>}
      </div>
      {description && !error && <p className="text-xs text-muted-foreground">{description}</p>}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
