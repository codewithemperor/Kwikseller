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

// Font imports for Next.js apps
// Use these in your root layout.tsx
export const fontImports = {
  /**
   * HEADING FONT: Poppins
   * A geometric sans-serif with clean, modern letterforms
   * Great for headings, titles, and display text
   */
  heading: {
    name: 'fontHeading',
    import: "import { Poppins } from 'next/font/google'",
    config: `const fontHeading = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-heading',
  display: 'swap',
})`,
    variable: '--font-heading',
  },

  /**
   * TEXT FONT: Inter
   * A variable font designed for computer screens
   * Excellent readability for body text
   */
  text: {
    name: 'fontText',
    import: "import { Inter } from 'next/font/google'",
    config: `const fontText = Inter({
  subsets: ['latin'],
  variable: '--font-text',
  display: 'swap',
})`,
    variable: '--font-text',
  },

  /**
   * MONO FONT: JetBrains Mono
   * A monospace font designed for developers
   * Perfect for code snippets, numbers, and technical content
   */
  mono: {
    name: 'fontMono',
    import: "import { JetBrains_Mono } from 'next/font/google'",
    config: `const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})`,
    variable: '--font-mono',
  },
}

// CSS classes for font families
export const fontClasses = {
  heading: 'font-heading',
  text: 'font-text',
  mono: 'font-mono',
  sans: 'font-sans',
}

// Example usage documentation
export const fontUsageExamples = `
// ============================================
// HOW TO USE FONTS IN YOUR APP
// ============================================

// 1. In your root layout.tsx:
// --------------------------------------------
import { fontImports } from '@kwikseller/fonts'

${fontImports.heading.import}
${fontImports.text.import}
${fontImports.mono.import}

${fontImports.heading.config}
${fontImports.text.config}
${fontImports.mono.config}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={\`\${fontHeading.variable} \${fontText.variable} \${fontMono.variable}\`}>
      <body className="font-text antialiased">
        {children}
      </body>
    </html>
  )
}

// 2. In your tailwind.config.ts:
// --------------------------------------------
import type { Config } from 'tailwindcss'
import { fontConfig } from '@kwikseller/fonts'

const config: Config = {
  theme: {
    extend: {
      fontFamily: fontConfig,
    },
  },
}
export default config

// 3. Usage in components:
// --------------------------------------------
// <h1 className="font-heading text-3xl font-bold">Heading</h1>
// <p className="font-text text-base">Body text</p>
// <code className="font-mono text-sm">Code snippet</code>
`

// Export types
export type FontFamily = keyof typeof FONT_FAMILIES
