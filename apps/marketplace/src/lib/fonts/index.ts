// KWIKSELLER - Local Fonts Configuration for Marketplace
// Re-exports everything from the local fonts module

// Font family configuration
export const FONT_FAMILIES = {
  heading: 'var(--font-heading)',
  text: 'var(--font-text)',
  mono: 'var(--font-mono)',
} as const;

// Tailwind font configuration
export const fontConfig = {
  heading: [FONT_FAMILIES.heading, 'system-ui', 'sans-serif'],
  text: [FONT_FAMILIES.text, 'system-ui', 'sans-serif'],
  mono: [FONT_FAMILIES.mono, 'Consolas', 'monospace'],
  sans: [FONT_FAMILIES.text, 'system-ui', 'sans-serif'],
};

// CSS classes for font families
export const fontClasses = {
  heading: 'font-heading',
  text: 'font-text',
  mono: 'font-mono',
  sans: 'font-sans',
};

// Export types
export type FontFamily = keyof typeof FONT_FAMILIES;

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
} from './fonts';

// Re-export everything from tailwind.ts
export {
  fontConfig as tailwindFontConfig,
  fontFamilies,
  cssFontProperties,
  fontSizeConfig,
  letterSpacingConfig,
  lineHeightConfig,
  typographyConfig,
  type FontConfig,
  type FontFamilies as FontFamiliesType,
  type TypographyConfig,
} from './tailwind';
