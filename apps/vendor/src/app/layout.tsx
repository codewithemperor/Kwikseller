import type { Metadata, Viewport } from "next";
import {
  JetBrains_Mono,
  Figtree,
  Sora,
  Inter,
  Poppins,
  DM_Sans,
  Lato,
  Montserrat,
  Playfair_Display,
  Merriweather,
} from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
import { HeroUIProviderWrapper, AuthProvider } from "@kwikseller/utils";

const fontHeading = Sora({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const fontText = Figtree({
  subsets: ["latin"],
  variable: "--font-text",
  display: "swap",
});

// Monospace font - JetBrains Mono (for code, numbers)
const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

// ─── Storefront Designer Fonts ──────────────────────────────────────
// These fonts are loaded so the storefront designer preview uses real fonts
// instead of falling back to system-ui. Each maps to a CSS variable
// --font-{slug} used by the storefront preview component.

const fontInter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fontPoppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const fontDmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

const fontLato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-lato",
  display: "swap",
});

const fontMontserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

const fontPlayfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-playfair-display",
  display: "swap",
});

const fontMerriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-merriweather",
  display: "swap",
});

// Collect all storefront font variables for the <html> element
const storefrontFontVariables = [
  fontInter.variable,
  fontPoppins.variable,
  fontDmSans.variable,
  fontLato.variable,
  fontMontserrat.variable,
  fontPlayfairDisplay.variable,
  fontMerriweather.variable,
].join(' ');

export const metadata: Metadata = {
  title: {
    default: "Vendor Dashboard | KWIKSELLER",
    template: "%s | KWIKSELLER Vendor",
  },
  description:
    "Manage your online store, products, orders, and grow your business with KWIKSELLER Vendor Dashboard.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
      { url: "/icon.png", type: "image/png", sizes: "16x16" },
    ],
    apple: [{ url: "/icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F07A22" },
    { media: "(prefers-color-scheme: dark)", color: "#F07A22" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontHeading.variable} ${fontText.variable} ${fontMono.variable} ${storefrontFontVariables}`}
      suppressHydrationWarning
    >
      <body className="font-text antialiased bg-background text-foreground">
        <HeroUIProviderWrapper>
          <AuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster
                position="top-right"
                richColors
                closeButton
                toastOptions={{
                  unstyled: false,
                  classNames: {
                    toast: "!rounded-2xl !border !border-kwik-border/60 !shadow-xl !backdrop-blur-xl !bg-background/95",
                    title: "!text-sm !font-semibold !text-foreground",
                    description: "!text-xs !text-muted-foreground",
                    actionButton: "!rounded-lg !bg-accent !px-3 !py-1.5 !text-xs !font-semibold !text-accent-foreground",
                    cancelButton: "!rounded-lg !bg-surface !px-3 !py-1.5 !text-xs !font-medium !text-muted-foreground",
                    success: "!border-success/30",
                    error: "!border-danger/30",
                    info: "!border-kwik-blue/30",
                    warning: "!border-warning/30",
                    closeButton: "!top-3 !right-3 !left-auto !bg-surface !border-kwik-border !text-muted-foreground hover:!text-foreground hover:!bg-default-100",
                  },
                }}
              />
            </ThemeProvider>
          </AuthProvider>
        </HeroUIProviderWrapper>
      </body>
    </html>
  );
}
