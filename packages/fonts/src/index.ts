// KWIKSELLER - Shared Fonts Configuration
// Exports font configurations for use across all apps

/**
 * Font Family Configuration
 * 
 * These fonts are configured for use with Tailwind CSS.
 * Add them to your tailwind.config.ts like:
 * 
 * import { fontConfig } from '@kwikseller/fonts'
 * 
 * // In your tailwind.config.ts theme.extend:
 * fontFamily: fontConfig
 */

// Font family names as CSS variables
export const FONT_FAMILIES = {
  heading: 'var(--font-heading)',
  text: 'var(--font-text)',
  mono: 'var(--font-mono)',
} as const

// Tailwind font configuration
export const fontConfig = {
  heading: [FONT_FAMILIES.heading, 'system-ui', 'sans-serif'],
  text: [FONT_FAMILIES.text, 'system-ui', 'sans-serif'],
  mono: [FONT_FAMILIES.mono, 'Consolas', 'monospace'],
  sans: [FONT_FAMILIES.text, 'system-ui', 'sans-serif'],
}

// CSS classes for font families
export const fontClasses = {
  heading: 'font-heading',
  text: 'font-text',
  mono: 'font-mono',
  sans: 'font-sans',
}

// Export types
export type FontFamily = keyof typeof FONT_FAMILIES

// Re-export everything from fonts.ts
export {
  fonts,
  fontVariables,
  storefrontFontMap,
  getFontVariableClasses,
  fontHeading,
  fontText,
  fontSans,
  fontMono,
  fontInter,
  fontPoppins,
  fontDmSans,
  fontLato,
  fontMontserrat,
  fontPlayfairDisplay,
  fontMerriweather,
  type FontHeading,
  type FontText,
  type FontSans,
  type FontMono,
  type Fonts,
} from './fonts'
