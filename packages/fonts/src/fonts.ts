import { Inter, JetBrains_Mono } from 'next/font/google';

/**
 * Heading font - Inter
 * Clean, modern sans-serif perfect for headings
 * Uses CSS variable: --font-heading
 */
export const fontHeading = Inter({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
});

/**
 * Text/Sans font - Inter
 * Same as heading for consistency across the brand
 * Uses CSS variable: --font-sans (also aliased as --font-text)
 */
export const fontText = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

/**
 * Alias for fontText - provides semantic naming
 * Uses CSS variable: --font-sans
 */
export const fontSans = fontText;

/**
 * Monospace font - JetBrains Mono
 * Excellent for code, technical content
 * Uses CSS variable: --font-mono
 */
export const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

/**
 * Font configuration object for easy access
 */
export const fonts = {
  heading: fontHeading,
  text: fontText,
  sans: fontSans,
  mono: fontMono,
} as const;

/**
 * CSS variable names for reference
 */
export const fontVariables = {
  heading: '--font-heading',
  sans: '--font-sans',
  text: '--font-sans', // Alias
  mono: '--font-mono',
} as const;

/**
 * Utility to get all font variable class names
 * Use this to apply all font CSS variables to the html element
 */
export function getFontVariableClasses() {
  return `${fontHeading.variable} ${fontText.variable} ${fontMono.variable}`;
}

/**
 * Type definitions for font configurations
 */
export type FontHeading = typeof fontHeading;
export type FontText = typeof fontText;
export type FontSans = typeof fontSans;
export type FontMono = typeof fontMono;
export type Fonts = typeof fonts;
