/**
 * Tailwind CSS font configuration for Kwikseller
 *
 * This module exports configuration helpers that can be used
 * in each app's tailwind.config.ts file.
 */

/**
 * Font family configuration for Tailwind
 *
 * Usage in tailwind.config.ts:
 * ```ts
 * import { fontConfig } from '@kwikseller/fonts/tailwind';
 *
 * const config = {
 *   theme: {
 *     extend: {
 *       ...fontConfig,
 *     },
 *   },
 * };
 * ```
 */
export const fontConfig = {
  fontFamily: {
    heading: ['var(--font-heading)', 'system-ui', 'sans-serif'],
    sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
    text: ['var(--font-sans)', 'system-ui', 'sans-serif'],
    mono: ['var(--font-mono)', 'monospace'],
  },
};

/**
 * Font family values for direct use
 */
export const fontFamilies = {
  heading: 'var(--font-heading)',
  sans: 'var(--font-sans)',
  text: 'var(--font-sans)',
  mono: 'var(--font-mono)',
} as const;

/**
 * CSS custom properties for fonts
 * Can be used for inline styles or CSS-in-JS
 */
export const cssFontProperties = {
  '--font-heading': 'var(--font-heading)',
  '--font-sans': 'var(--font-sans)',
  '--font-text': 'var(--font-sans)',
  '--font-mono': 'var(--font-mono)',
} as const;

/**
 * Tailwind font size scale (optional enhancement)
 * Provides consistent font sizes across all apps
 */
export const fontSizeConfig = {
  fontSize: {
    '2xs': ['0.625rem', { lineHeight: '0.875rem' }], // 10px
    xs: ['0.75rem', { lineHeight: '1rem' }], // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }], // 14px
    base: ['1rem', { lineHeight: '1.5rem' }], // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }], // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }], // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }], // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
    '5xl': ['3rem', { lineHeight: '1' }], // 48px
    '6xl': ['3.75rem', { lineHeight: '1' }], // 60px
    '7xl': ['4.5rem', { lineHeight: '1' }], // 72px
    '8xl': ['6rem', { lineHeight: '1' }], // 96px
    '9xl': ['8rem', { lineHeight: '1' }], // 128px
  },
};

/**
 * Letter spacing configuration (optional enhancement)
 */
export const letterSpacingConfig = {
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};

/**
 * Line height configuration (optional enhancement)
 */
export const lineHeightConfig = {
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
};

/**
 * Complete typography configuration
 * Includes font families, sizes, letter spacing, and line heights
 */
export const typographyConfig = {
  ...fontConfig,
  ...fontSizeConfig,
  ...letterSpacingConfig,
  ...lineHeightConfig,
};

/**
 * Type definitions
 */
export type FontConfig = typeof fontConfig;
export type FontFamilies = typeof fontFamilies;
export type TypographyConfig = typeof typographyConfig;
