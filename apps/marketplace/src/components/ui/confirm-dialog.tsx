'use client';

import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { AppModal } from './app-modal';
import { AppButton } from './app-button';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void> | unknown;
  isLoading?: boolean;
  variant?: 'danger' | 'warning' | 'default';
  icon?: LucideIcon;
  className?: string;
}

const variantConfig: Record<
  NonNullable<ConfirmDialogProps['variant']>,
  { icon: LucideIcon; iconBg: string; iconColor: string; buttonVariant: 'primary' | 'secondary' | 'danger' }
> = {
  danger: { icon: AlertTriangle, iconBg: 'bg-danger/10', iconColor: 'text-danger', buttonVariant: 'danger' },
  warning: { icon: AlertCircle, iconBg: 'bg-warning/10', iconColor: 'text-warning', buttonVariant: 'primary' },
  default: { icon: AlertCircle, iconBg: 'bg-accent/10', iconColor: 'text-accent', buttonVariant: 'primary' },
};

export function ConfirmDialog({
  isOpen,
  onOpenChange,
  title = 'Confirm Action',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  isLoading = false,
  variant = 'danger',
  icon,
  className,
}: ConfirmDialogProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const loading = isLoading || internalLoading;
  const cfg = variantConfig[variant];
  const Icon = icon ?? cfg.icon;

  const handleConfirm = async () => {
    try {
      const result = onConfirm();
      if (result instanceof Promise) {
        setInternalLoading(true);
        await result;
      }
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={() => onOpenChange(false)}
      title={title}
      className={cn('max-w-md', className)}
      footer={
        <div className="flex w-full justify-end gap-2">
          <AppButton
            variant="secondary"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelLabel}
          </AppButton>
          <AppButton
            variant={cfg.buttonVariant}
            size="sm"
            onClick={handleConfirm}
            isLoading={loading}
          >
            {loading ? 'Processing...' : confirmLabel}
          </AppButton>
        </div>
      }
    >
      <div className="flex items-start gap-3">
        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', cfg.iconBg)}>
          <Icon className={cn('h-5 w-5', cfg.iconColor)} />
        </span>
        <div className="min-w-0 flex-1 text-sm text-muted-foreground">{message}</div>
      </div>
    </AppModal>
  );
}

export default ConfirmDialog;
