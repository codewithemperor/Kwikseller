'use client';

import * as React from 'react';
import { cn } from '../utils';

/**
 * AppShell - Main layout wrapper for all 4 apps
 * Configurable TopNav + Sidebar + main content + Footer slots
 */

export interface AppShellProps {
  children: React.ReactNode;
  /** Top navigation slot */
  topNav?: React.ReactNode;
  /** Sidebar slot */
  sidebar?: React.ReactNode;
  /** Footer slot */
  footer?: React.ReactNode;
  /** Mobile bottom navigation slot */
  mobileBottomNav?: React.ReactNode;
  /** Whether sidebar is collapsed */
  sidebarCollapsed?: boolean;
  /** Whether to show sidebar on mobile */
  showSidebarOnMobile?: boolean;
  /** Additional class names */
  className?: string;
  /** Main content class names */
  mainClassName?: string;
  /** Sidebar width when expanded */
  sidebarWidth?: string;
  /** Sidebar width when collapsed */
  sidebarCollapsedWidth?: string;
}

export function AppShell({
  children,
  topNav,
  sidebar,
  footer,
  mobileBottomNav,
  sidebarCollapsed = false,
  showSidebarOnMobile = false,
  className,
  mainClassName,
  sidebarWidth = 'w-64',
  sidebarCollapsedWidth = 'w-16',
}: AppShellProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

  return (
    <div className={cn('min-h-screen flex flex-col bg-background', className)}>
      {/* Top Navigation */}
      {topNav && (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          {React.cloneElement(topNav as React.ReactElement, {
            onMenuClick: () => setMobileSidebarOpen(!mobileSidebarOpen),
            sidebarCollapsed,
          })}
        </header>
      )}

      <div className="flex flex-1">
        {/* Sidebar - Desktop */}
        {sidebar && (
          <>
            {/* Desktop Sidebar */}
            <aside
              className={cn(
                'hidden lg:flex flex-col border-r bg-background transition-all duration-300',
                sidebarCollapsed ? sidebarCollapsedWidth : sidebarWidth
              )}
            >
              {React.cloneElement(sidebar as React.ReactElement, {
                collapsed: sidebarCollapsed,
              })}
            </aside>

            {/* Mobile Sidebar Overlay */}
            {(showSidebarOnMobile || mobileSidebarOpen) && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                  onClick={() => setMobileSidebarOpen(false)}
                />

                {/* Mobile Sidebar */}
                <aside
                  className={cn(
                    'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-background lg:hidden',
                    mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                  )}
                  style={{ transition: 'transform 0.3s ease-in-out' }}
                >
                  {React.cloneElement(sidebar as React.ReactElement, {
                    collapsed: false,
                    onNavigate: () => setMobileSidebarOpen(false),
                  })}
                </aside>
              </>
            )}
          </>
        )}

        {/* Main Content Area */}
        <main
          className={cn(
            'flex-1 flex flex-col min-w-0',
            mainClassName
          )}
        >
          <div className="flex-1">
            {children}
          </div>

          {/* Footer - Desktop */}
          {footer && (
            <footer className="hidden lg:block mt-auto border-t bg-background">
              {footer}
            </footer>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {mobileBottomNav && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
          {mobileBottomNav}
        </nav>
      )}
    </div>
  );
}

AppShell.displayName = 'AppShell';
