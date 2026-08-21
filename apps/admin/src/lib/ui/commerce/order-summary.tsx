'use client';

import React, { useState } from 'react';
import { ChevronDown, ShoppingCart, Tag } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { Divider } from '../layout/divider';
import { PriceDisplay } from './price-display';
import { FieldInput, AppButton } from '../inputs';

export interface OrderSummaryItem {
  name: string;
  quantity: number;
  unitPrice: number;
  image?: string;
}

export interface OrderSummaryProps {
  items: OrderSummaryItem[];
  subtotal: number;
  deliveryFee?: number;
  discount?: number;
  total: number;
  currency?: string;
  showDeliveryFee?: boolean;
  showDiscount?: boolean;
  showCouponInput?: boolean;
  couponApplied?: boolean;
  couponCode?: string;
  onApplyCoupon?: (code: string) => void;
  onRemoveCoupon?: () => void;
  className?: string;
}

/**
 * OrderSummary — reusable order summary sidebar used in cart/checkout,
 * order detail pages (buyer + vendor), and the checkout verify page.
 */
export function OrderSummary({
  items,
  subtotal,
  deliveryFee,
  discount,
  total,
  currency = 'NGN',
  showDeliveryFee = true,
  showDiscount = true,
  showCouponInput = false,
  couponApplied = false,
  couponCode,
  onApplyCoupon,
  onRemoveCoupon,
  className,
}: OrderSummaryProps) {
  const [expanded, setExpanded] = useState(false);
  const [couponCodeInput, setCouponCodeInput] = useState('');

  const visibleItems = expanded ? items : items.slice(0, 2);
  const hiddenCount = items.length - visibleItems.length;
  const deliveryDetermined = typeof deliveryFee === 'number';

  return (
    <div
      className={cn(
        'rounded-2xl border border-kwik-border bg-surface p-5',
        className,
      )}
    >
      {/* Title */}
      <div className="mb-4 flex items-center gap-2">
        <ShoppingCart className="h-5 w-5 text-accent" />
        <h3 className="font-heading text-base font-bold text-foreground">
          Order Summary
        </h3>
        <span className="ml-auto text-xs text-muted-foreground">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Item list */}
      <div className="space-y-3">
        {visibleItems.map((item, idx) => (
          <div key={`${item.name}-${idx}`} className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-default-100">
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-muted-foreground">
                  {item.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {item.name}
              </p>
              <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
            </div>
            <PriceDisplay
              price={item.unitPrice * item.quantity}
              currency={currency}
              size="sm"
              showDiscount={false}
            />
          </div>
        ))}

        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs font-semibold text-accent transition-colors hover:underline"
          >
            <ChevronDown
              className={cn('h-3.5 w-3.5 transition-transform', expanded && 'rotate-180')}
            />
            {expanded ? 'Show less' : `+${hiddenCount} more ${hiddenCount === 1 ? 'item' : 'items'}`}
          </button>
        )}
      </div>

      <Divider className="my-4" />

      {/* Totals rows */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium text-foreground">
            {formatCurrency(subtotal, currency)}
          </span>
        </div>

        {showDeliveryFee && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Delivery fee</span>
            {deliveryDetermined ? (
              <span className="font-medium text-foreground">
                {formatCurrency(deliveryFee ?? 0, currency)}
              </span>
            ) : (
              <span className="rounded-full bg-default-100 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                Calculated at checkout
              </span>
            )}
          </div>
        )}

        {showDiscount && discount && discount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-success">Discount</span>
            <span className="font-medium text-success">
              -{formatCurrency(discount, currency)}
            </span>
          </div>
        )}
      </div>

      {/* Coupon input */}
      {showCouponInput && (
        <div className="mt-4">
          {couponApplied ? (
            <div className="flex items-center justify-between rounded-lg border border-success/30 bg-success/5 px-3 py-2">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-success" />
                <span className="text-sm font-semibold text-success">
                  {couponCode || 'Coupon applied'}
                </span>
              </div>
              {onRemoveCoupon && (
                <button
                  type="button"
                  onClick={onRemoveCoupon}
                  className="text-xs font-medium text-muted-foreground transition-colors hover:text-danger"
                >
                  Remove
                </button>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <FieldInput
                name="coupon"
                label=""
                placeholder="Enter coupon code"
                value={couponCodeInput}
                onChange={(e) => setCouponCodeInput(e.target.value)}
                wrapperClassName="flex-1"
              />
              <AppButton
                type="button"
                variant="secondary"
                size="md"
                onClick={() => couponCodeInput && onApplyCoupon?.(couponCodeInput)}
                disabled={!couponCodeInput}
                className="shrink-0"
              >
                Apply
              </AppButton>
            </div>
          )}
        </div>
      )}

      <Divider className="my-4" />

      {/* Total */}
      <div className="flex items-center justify-between">
        <span className="font-heading text-base font-bold text-foreground">
          Total
        </span>
        <PriceDisplay
          price={total}
          currency={currency}
          size="lg"
          showDiscount={false}
        />
      </div>
    </div>
  );
}

export default OrderSummary;
