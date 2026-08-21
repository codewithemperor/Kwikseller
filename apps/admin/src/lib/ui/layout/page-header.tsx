'use client'

import React from 'react'
import { Button } from '@heroui/react'
import { cn } from '../lib/utils'
import { ArrowLeft } from 'lucide-react'

export interface PageHeaderProps {
  title: string
  description?: string
  backButton?: boolean
  onBack?: () => void
  actions?: React.ReactNode
  breadcrumbs?: React.ReactNode
  className?: string
}

/**
 * PageHeader - A shared page header component
 */
export function PageHeader({
  title,
  description,
  backButton = false,
  onBack,
  actions,
  breadcrumbs,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('border-b border-divider bg-background', className)}>
      {breadcrumbs && (
        <div className="px-6 pt-4">
          {breadcrumbs}
        </div>
      )}
      
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          {backButton && (
            <Button
              isIconOnly
              variant="ghost"
              onPress={onBack}
              className="mr-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            {description && (
              <p className="text-default-500 mt-1">{description}</p>
            )}
          </div>
        </div>
        
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}

export default PageHeader
