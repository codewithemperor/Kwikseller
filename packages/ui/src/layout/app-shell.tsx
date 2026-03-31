'use client'

import React from 'react'
import { cn } from '../lib/utils'

export interface AppShellProps {
  children: React.ReactNode
  header?: React.ReactNode
  sidebar?: React.ReactNode
  footer?: React.ReactNode
  className?: string
  mainClassName?: string
}

/**
 * AppShell - A shared app shell layout component
 */
export function AppShell({
  children,
  header,
  sidebar,
  footer,
  className,
  mainClassName,
}: AppShellProps) {
  return (
    <div className={cn('min-h-screen flex flex-col', className)}>
      {header && (
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-divider">
          {header}
        </header>
      )}
      
      <div className="flex-1 flex">
        {sidebar && (
          <aside className="hidden lg:block w-64 border-r border-divider bg-background">
            {sidebar}
          </aside>
        )}
        
        <main className={cn('flex-1', mainClassName)}>
          {children}
        </main>
      </div>
      
      {footer && (
        <footer className="mt-auto border-t border-divider bg-background">
          {footer}
        </footer>
      )}
    </div>
  )
}

export default AppShell
