'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { AppModal } from '../overlays/app-modal';
import { AppButton } from '../inputs/app-button';
import { cn } from '../lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface AlertDialogAction {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  onPress: () => void;
}

export interface AlertDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  variant?: 'info' | 'success' | 'warning' | 'danger';
  actions?: AlertDialogAction[];
  className?: string;
}

const variantConfig: Record<
  NonNullable<AlertDialogProps['variant']>,
  { icon: LucideIcon; accent: string; iconColor: string }
> = {
  info: { icon: Info, accent: 'border-l-blue-500', iconColor: 'text-blue-500' },
  success: { icon: CheckCircle2, accent: 'border-l-emerald-500', iconColor: 'text-emerald-500' },
  warning: { icon: AlertTriangle, accent: 'border-l-amber-500', iconColor: 'text-amber-500' },
  danger: { icon: AlertCircle, accent: 'border-l-red-500', iconColor: 'text-red-500' },
};

export function AlertDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  variant = 'info',
  actions,
  className,
}: AlertDialogProps) {
  const cfg = variantConfig[variant];
  const Icon = cfg.icon;

  return (
    <AppModal
      isOpen={isOpen}
      onClose={() => onOpenChange(false)}
      title={title}
      className={cn('max-w-md border-l-4', cfg.accent, className)}
      footer={
        actions && actions.length > 0 ? (
          <div className="flex w-full justify-end gap-2">
            {actions.map((action, idx) => (
              <AppButton
                key={idx}
                variant={action.variant ?? 'primary'}
                size="sm"
                onClick={action.onPress}
              >
                {action.label}
              </AppButton>
            ))}
          </div>
        ) : undefined
      }
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('h-6 w-6 shrink-0', cfg.iconColor)} />
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
    </AppModal>
  );
}

export default AlertDialog;
