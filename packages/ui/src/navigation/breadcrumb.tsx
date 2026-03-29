'use client';

import * as React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../components/utils';

/**
 * Breadcrumb - Navigation breadcrumb component
 */

export interface BreadcrumbItem {
  /** Display label */
  label: string;
  /** Navigation href */
  href?: string;
  /** Click handler */
  onClick?: () => void;
}

export interface BreadcrumbProps {
  /** Breadcrumb items */
  items: BreadcrumbItem[];
  /** Show home icon */
  showHome?: boolean;
  /** Home href */
  homeHref?: string;
  /** Additional class names */
  className?: string;
  /** Separator component */
  separator?: React.ReactNode;
}

export function Breadcrumb({
  items,
  showHome = true,
  homeHref = '/',
  className,
  separator = <ChevronRight className="h-4 w-4" />,
}: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center text-sm', className)}>
      <ol className="flex items-center gap-1.5">
        {showHome && (
          <>
            <li>
              <a
                href={homeHref}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Home"
              >
                <Home className="h-4 w-4" />
              </a>
            </li>
            {items.length > 0 && (
              <li className="text-muted-foreground" aria-hidden="true">
                {separator}
              </li>
            )}
          </>
        )}
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <React.Fragment key={index}>
              <li>
                {item.href && !isLast ? (
                  <a
                    href={item.href}
                    onClick={item.onClick}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </a>
                ) : (
                  <span
                    className={isLast ? 'font-medium text-foreground' : 'text-muted-foreground'}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {item.label}
                  </span>
                )}
              </li>
              {!isLast && (
                <li className="text-muted-foreground" aria-hidden="true">
                  {separator}
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

Breadcrumb.displayName = 'Breadcrumb';
