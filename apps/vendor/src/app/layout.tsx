import type { Metadata, Viewport } from "next";
import { Poppins, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
import { HeroUIProviderWrapper, AuthProvider } from "@kwikseller/utils";

// Heading font - Poppins
const fontHeading = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-heading",
  display: "swap",
});

// Text/Body font - Inter
const fontText = Inter({
  subsets: ["latin"],
  variable: "--font-text",
  display: "swap",
});

// Monospace font - JetBrains Mono
const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Vendor Dashboard | KWIKSELLER",
    template: "%s | KWIKSELLER Vendor",
  },
  description: "Manage your online store, products, orders, and grow your business with KWIKSELLER Vendor Dashboard.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#1A56DB",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="en" 
      className={`${fontHeading.variable} ${fontText.variable} ${fontMono.variable}`}
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
              <Toaster position="top-right" richColors closeButton />
            </ThemeProvider>
          </AuthProvider>
        </HeroUIProviderWrapper>
      </body>
    </html>
  );
}
