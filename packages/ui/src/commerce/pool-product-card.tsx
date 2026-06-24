'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Plus, Eye, Trash2, Store } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { AppImage } from '../inputs/app-image';
import { AppButton } from '../inputs/app-button';

export interface PoolProductCardProduct {
  id: string;
  name: string;
  description?: string;
  image?: string;
  images?: string[];
  wholesalePrice: number;
  suggestedRetailPrice?: number;
  sourceType?: string;
  sourceStoreName?: string;
  category?: string;
  alreadySelected?: boolean;
  linkedOfferId?: string;
  poolMinSalePrice?: number;
  vendorRetailPrice?: number;
}

export interface PoolProductCardProps {
  product: PoolProductCardProduct;
  onAddToStore?: (product: PoolProductCardProduct) => void;
  onViewDetail?: (product: PoolProductCardProduct) => void;
  onRemove?: (productId: string) => void;
  isAdding?: boolean;
  className?: string;
}

export function PoolProductCard({
  product,
  onAddToStore,
  onViewDetail,
  onRemove,
  isAdding = false,
  className,
}: PoolProductCardProps) {
  const image = product.image ?? product.images?.[0];
  const wholesale = Number(product.wholesalePrice ?? 0);
  const suggested = Number(product.suggestedRetailPrice ?? 0);
  const retail = product.vendorRetailPrice ?? suggested;
  const margin = retail - wholesale;
  const isPositiveMargin = margin > 0;
  const sourceName =
    product.sourceType === 'VENDOR_PRODUCT'
      ? product.sourceStoreName ?? 'Vendor'
      : 'Kwikseller';

  return (
    <motion.article
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileHover={{ y: -2 }}
      className={cn(
        'group flex flex-col overflow-hidden rounded-2xl border border-kwik-border bg-surface transition-shadow hover:shadow-md',
        className,
      )}
    >
      {/* Image */}
      <div className="relative aspect-[3/4] min-h-[160px] overflow-hidden bg-default-100">
        <AppImage
          src={image}
          alt={product.name}
          fallbackVariant="product"
          fallbackHint={product.name}
          className="absolute inset-0 h-full w-full transition-transform duration-700 ease-out group-hover:scale-105"
          objectFit="cover"
        />

        {/* Source badge */}
        <span className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-[11px] font-medium text-foreground shadow-sm backdrop-blur-sm">
          {sourceName}
        </span>

        {/* Already selected badge */}
        {product.alreadySelected && (
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
            <Check className="h-3 w-3" />
            In Your Store
          </span>
        )}

        {/* Category chip */}
        {product.category && (
          <span className="absolute bottom-2 left-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
            {product.category}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
          {product.name}
        </p>

        {/* Pricing */}
        <div className="mt-2 space-y-1">
          <p className="text-xs text-muted-foreground">
            Wholesale: <span className="font-medium text-foreground">{formatCurrency(wholesale)}</span>
          </p>
          {suggested > 0 && (
            <p className="text-xs text-muted-foreground">
              Suggested: <span className="font-medium text-foreground">{formatCurrency(suggested)}</span>
            </p>
          )}
          {product.vendorRetailPrice !== undefined && (
            <>
              <p className="text-xs">
                <span className="text-muted-foreground">Your Price: </span>
                <span className="font-bold text-accent">{formatCurrency(retail)}</span>
              </p>
              <p className={cn('text-xs font-semibold', isPositiveMargin ? 'text-success' : 'text-danger')}>
                Margin: {formatCurrency(Math.abs(margin))} {isPositiveMargin ? 'profit' : 'loss'}
              </p>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="mt-auto flex items-center gap-2 pt-3">
          {product.alreadySelected ? (
            <>
              {onViewDetail && (
                <AppButton
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => onViewDetail(product)}
                >
                  <Eye className="h-3.5 w-3.5" />
                  View
                </AppButton>
              )}
              {onRemove && (
                <AppButton
                  variant="ghost"
                  size="sm"
                  className="text-danger hover:bg-danger/10"
                  onClick={() => onRemove(product.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </AppButton>
              )}
            </>
          ) : (
            <AppButton
              variant="primary"
              size="sm"
              fullWidth
              isLoading={isAdding}
              onClick={() => onAddToStore?.(product)}
            >
              <Plus className="h-3.5 w-3.5" />
              Add to Store
            </AppButton>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export default PoolProductCard;
