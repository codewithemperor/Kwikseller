import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Space_Grotesk, Figtree } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
import { HeroUIProviderWrapper, AuthProvider } from "@kwikseller/utils";
import { Toast } from "@heroui/react";

// Heading font - Poppins (modern, geometric sans-serif)
const fontHeading = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

// Text/Body font - Inter (excellent readability)
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

export const metadata: Metadata = {
  title: {
    default: "KWIKSELLER Rider - Delivery App",
    template: "%s | KWIKSELLER Rider",
  },
  description:
    "KWIKSELLER Rider App - Manage deliveries, track earnings, and complete orders on the go.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1A56DB" },
    { media: "(prefers-color-scheme: dark)", color: "#1E40AF" },
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
              <Toast.Provider placement="top end" maxVisibleToasts={3} />
              <Toaster position="top-right" richColors closeButton />
            </ThemeProvider>
          </AuthProvider>
        </HeroUIProviderWrapper>
      </body>
    </html>
  );
}
