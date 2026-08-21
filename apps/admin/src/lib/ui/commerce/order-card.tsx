'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Store } from 'lucide-react';
import { cn, formatCurrency, formatRelativeTime } from '../lib/utils';
import { OrderStatusBadge, type OrderStatus } from './order-status-badge';

export type OrderCardPaymentStatus =
  | 'PENDING'
  | 'AUTHORIZED'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED';

export interface OrderCardProps {
  orderRef: string;
  status: OrderStatus | string;
  paymentStatus?: OrderCardPaymentStatus | string;
  storeName?: string;
  itemNames: string[];
  itemCount: number;
  totalAmount: number;
  date: string;
  deliveryAddress?: string;
  onClick?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

const paymentStatusColor: Record<string, string> = {
  PENDING: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  AUTHORIZED: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  PAID: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  FAILED: 'bg-red-500/10 text-red-600 dark:text-red-400',
  REFUNDED: 'bg-default-100 text-muted-foreground',
};

/**
 * OrderCard — a compact order card for order list pages (buyer, vendor, admin).
 * The whole card is clickable via onClick; optional actions slot renders
 * extra buttons on the right of the bottom row.
 */
export function OrderCard({
  orderRef,
  status,
  paymentStatus,
  storeName,
  itemNames,
  itemCount,
  totalAmount,
  date,
  deliveryAddress,
  onClick,
  actions,
  className,
}: OrderCardProps) {
  const visibleNames = itemNames.slice(0, 2);
  const extraCount = Math.max(0, itemNames.length - visibleNames.length);
  const relTime = (() => {
    try {
      return formatRelativeTime(date) || date;
    } catch {
      return date;
    }
  })();

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      whileHover={onClick ? { y: -2 } : undefined}
      onClick={onClick}
      className={cn(
        'rounded-2xl border border-kwik-border bg-surface p-4 transition-colors',
        onClick && 'cursor-pointer hover:border-accent/30',
        className,
      )}
    >
      {/* Top row: orderRef + badges */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-mono text-xs font-semibold text-foreground">
            #{orderRef}
          </p>
          {storeName && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Store className="h-3 w-3" />
              <span className="truncate">{storeName}</span>
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          <OrderStatusBadge status={status} size="sm" />
          {paymentStatus && (
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
                paymentStatusColor[paymentStatus] ?? 'bg-default-100 text-muted-foreground',
              )}
            >
              {paymentStatus}
            </span>
          )}
        </div>
      </div>

      {/* Items summary */}
      <div className="mt-3">
        <p className="text-sm text-foreground">
          {visibleNames.join(', ')}
          {extraCount > 0 && (
            <span className="text-muted-foreground"> +{extraCount} more</span>
          )}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {itemCount} {itemCount === 1 ? 'item' : 'items'} total
        </p>
      </div>

      {/* Delivery address */}
      {deliveryAddress && (
        <p className="mt-2 flex items-start gap-1 text-xs text-muted-foreground">
          <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
          <span className="line-clamp-1">{deliveryAddress}</span>
        </p>
      )}

      {/* Bottom row: amount + date + actions */}
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-kwik-border pt-3">
        <div className="min-w-0">
          <p className="text-base font-bold text-foreground">
            {formatCurrency(totalAmount)}
          </p>
          <p className="text-xs text-muted-foreground">{relTime}</p>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </motion.article>
  );
}

export default OrderCard;
