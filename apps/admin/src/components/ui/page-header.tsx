"use client";

import React from "react";
import Link from "next/link";
import { Breadcrumbs } from "@heroui/react";
import { Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, breadcrumbs, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="flex flex-col gap-1.5">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumbs className="mb-1">
            <Breadcrumbs.Item>
              <Link href="/admin" className="flex items-center gap-1">
                <Home className="h-3.5 w-3.5" />
              </Link>
            </Breadcrumbs.Item>
            {breadcrumbs.map((crumb, index) => (
              <Breadcrumbs.Item key={index}>
                {crumb.href
                  ? <Link href={crumb.href}>{crumb.label}</Link>
                  : <span className="text-foreground font-medium">{crumb.label}</span>}
              </Breadcrumbs.Item>
            ))}
          </Breadcrumbs>
        )}
        <h1 className="text-2xl font-heading font-bold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
