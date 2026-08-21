import {
  Inter,
  JetBrains_Mono,
  Sora,
  Figtree,
  Poppins,
  DM_Sans,
  Lato,
  Montserrat,
  Playfair_Display,
  Merriweather,
} from 'next/font/google';

/**
 * Heading font - Sora
 * Geometric sans-serif with clean, modern letterforms
 * Uses CSS variable: --font-heading
 */
export const fontHeading = Sora({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

/**
 * Text/Sans font - Figtree
 * Friendly geometric sans with excellent readability
 * Uses CSS variable: --font-sans (also aliased as --font-text)
 */
export const fontText = Figtree({
  subsets: ['latin'],
  variable: '--font-text',
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

// ─── Storefront Designer Fonts ──────────────────────────────────────
// Available for the storefront designer so vendors can preview fonts
// in real-time. Each maps to a CSS variable --font-{slug}.

/**
 * Inter - Variable font for computer screens
 * Uses CSS variable: --font-inter
 */
export const fontInter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

/**
 * Poppins - Geometric sans-serif, great for headings
 * Uses CSS variable: --font-poppins
 */
export const fontPoppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

/**
 * DM Sans - Clean low-contrast geometric sans
 * Uses CSS variable: --font-dm-sans
 */
export const fontDmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

/**
 * Lato - Classic humanist sans-serif
 * Uses CSS variable: --font-lato
 */
export const fontLato = Lato({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-lato',
  display: 'swap',
});

/**
 * Montserrat - Modern geometric sans inspired by Montserrat
 * Uses CSS variable: --font-montserrat
 */
export const fontMontserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-montserrat',
  display: 'swap',
});

/**
 * Playfair Display - Transitional serif with optical sizing
 * Uses CSS variable: --font-playfair-display
 */
export const fontPlayfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-playfair-display',
  display: 'swap',
});

/**
 * Merriweather - Designed for on-screen reading
 * Uses CSS variable: --font-merriweather
 */
export const fontMerriweather = Merriweather({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-merriweather',
  display: 'swap',
});

/**
 * Font configuration object for easy access
 */
export const fonts = {
  heading: fontHeading,
  text: fontText,
  sans: fontSans,
  mono: fontMono,
  // Storefront designer fonts
  inter: fontInter,
  poppins: fontPoppins,
  dmSans: fontDmSans,
  lato: fontLato,
  montserrat: fontMontserrat,
  playfairDisplay: fontPlayfairDisplay,
  merriweather: fontMerriweather,
} as const;

/**
 * CSS variable names for reference
 */
export const fontVariables = {
  heading: '--font-heading',
  sans: '--font-sans',
  text: '--font-text',
  mono: '--font-mono',
  // Storefront designer fonts
  inter: '--font-inter',
  poppins: '--font-poppins',
  dmSans: '--font-dm-sans',
  lato: '--font-lato',
  montserrat: '--font-montserrat',
  playfairDisplay: '--font-playfair-display',
  merriweather: '--font-merriweather',
} as const;

/**
 * Map from StorefrontFontKey (uppercase) to CSS variable name
 * Used by the storefront preview component
 */
export const storefrontFontMap: Record<string, string> = {
  SORA: 'var(--font-heading)',
  FIGTREE: 'var(--font-text)',
  INTER: 'var(--font-inter)',
  POPPINS: 'var(--font-poppins)',
  DM_SANS: 'var(--font-dm-sans)',
  LATO: 'var(--font-lato)',
  MONTSERRAT: 'var(--font-montserrat)',
  PLAYFAIR_DISPLAY: 'var(--font-playfair-display)',
  MERRIWEATHER: 'var(--font-merriweather)',
};

/**
 * Utility to get all font variable class names
 * Use this to apply all font CSS variables to the html element
 */
export function getFontVariableClasses() {
  return [
    fontHeading.variable,
    fontText.variable,
    fontMono.variable,
    fontInter.variable,
    fontPoppins.variable,
    fontDmSans.variable,
    fontLato.variable,
    fontMontserrat.variable,
    fontPlayfairDisplay.variable,
    fontMerriweather.variable,
  ].join(' ');
}

/**
 * Type definitions for font configurations
 */
export type FontHeading = typeof fontHeading;
export type FontText = typeof fontText;
export type FontSans = typeof fontSans;
export type FontMono = typeof fontMono;
export type Fonts = typeof fonts;
