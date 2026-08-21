'use client'

import React from 'react'

interface HeroUIProviderWrapperProps {
  children: React.ReactNode
}

/**
 * HeroUIProvider - Wrapper for HeroUI provider
 * HeroUI v3 doesn't require a provider, components work out of the box
 * This wrapper is kept for future compatibility and consistent structure
 */
export function HeroUIProviderWrapper({ children }: HeroUIProviderWrapperProps) {
  return <>{children}</>
}

export default HeroUIProviderWrapper
