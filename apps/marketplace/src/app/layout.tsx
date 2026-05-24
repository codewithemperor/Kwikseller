import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import {
  DM_Sans,
  Figtree,
  Inter,
  Lato,
  Merriweather,
  Montserrat,
  Playfair_Display,
  Poppins,
  Sora,
} from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { QueryProvider } from "@/lib/query-provider";
import { ThemeProvider } from "next-themes";
import { AuthProvider, HeroUIProviderWrapper } from "@kwikseller/utils";
import { Toast } from "@heroui/react";
import { MarketplaceLayout } from "@/components/layout/marketplace-layout";
import { NotificationToastStack } from "@/components/landing/notification-toast";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-text",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const inter = Inter({ subsets: ["latin"], variable: "--font-store-inter", display: "swap" });
const poppins = Poppins({ subsets: ["latin"], variable: "--font-store-poppins", weight: ["400", "500", "600", "700"], display: "swap" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-store-dm-sans", display: "swap" });
const lato = Lato({ subsets: ["latin"], variable: "--font-store-lato", weight: ["400", "700"], display: "swap" });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-store-montserrat", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-store-playfair", display: "swap" });
const merriweather = Merriweather({ subsets: ["latin"], variable: "--font-store-merriweather", weight: ["400", "700"], display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "KWIKSELLER - Africa's Most Powerful Commerce Operating System",
    template: "%s | KWIKSELLER",
  },
  description:
    "KWIKSELLER is Africa's most powerful commerce operating system. Create your online store, sell products, manage orders, and grow your business with our comprehensive platform.",
  keywords: [
    "KWIKSELLER",
    "Africa",
    "E-commerce",
    "Online Store",
    "Marketplace",
    "Vendor Dashboard",
    "Sell Online",
    "Commerce Platform",
    "African Business",
    "Online Shopping",
  ],
  authors: [{ name: "KWIKSELLER Team" }],
  creator: "KWIKSELLER",
  publisher: "KWIKSELLER",
  metadataBase: new URL("https://app.kwikseller.com"),
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://app.kwikseller.com",
    siteName: "KWIKSELLER",
    title: "KWIKSELLER - Africa's Most Powerful Commerce Operating System",
    description:
      "Create your online store, sell products, manage orders, and grow your business with Africa's most comprehensive commerce platform.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "KWIKSELLER - Africa's Commerce Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KWIKSELLER - Africa's Most Powerful Commerce Operating System",
    description:
      "Create your online store, sell products, and grow your business with Africa's most comprehensive commerce platform.",
    images: ["/og-image.png"],
    creator: "@kwikseller",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
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
    { media: "(prefers-color-scheme: light)", color: "#1A56DB" },
    { media: "(prefers-color-scheme: dark)", color: "#1E40AF" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className={`${figtree.variable} ${sora.variable} ${inter.variable} ${poppins.variable} ${dmSans.variable} ${lato.variable} ${montserrat.variable} ${playfair.variable} ${merriweather.variable} font-sans antialiased bg-background text-foreground`}>
        <HeroUIProviderWrapper>
          <QueryProvider>
            <AuthProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                <Suspense fallback={null}>
                  <MarketplaceLayout>
                    {children}
                  </MarketplaceLayout>
                </Suspense>
                <Toast.Provider placement="top end" maxVisibleToasts={3} />
                <Toaster
                  position="top-right"
                  richColors
                  closeButton
                  toastOptions={{
                    unstyled: false,
                    classNames: {
                      toast: "!rounded-2xl !border !border-kwik-border/60 !shadow-xl !backdrop-blur-xl !bg-background/95",
                      title: "!text-sm !font-semibold !text-kwik-dark",
                      description: "!text-xs !text-kwik-gray-light",
                      actionButton: "!rounded-lg !bg-kwik-orange !px-3 !py-1.5 !text-xs !font-semibold !text-white",
                      cancelButton: "!rounded-lg !bg-kwik-bg-surface !px-3 !py-1.5 !text-xs !font-medium !text-kwik-gray",
                      success: "!border-kwik-green/30",
                      error: "!border-kwik-red/30",
                      info: "!border-kwik-blue/30",
                      warning: "!border-kwik-amber/30",
                      closeButton: "!top-3 !right-3 !left-auto !bg-kwik-bg-surface !border-kwik-border !text-kwik-muted hover:!text-kwik-dark hover:!bg-kwik-border/50",
                    },
                  }}
                />
                <NotificationToastStack />
              </ThemeProvider>
            </AuthProvider>
          </QueryProvider>
        </HeroUIProviderWrapper>
      </body>
    </html>
  );
}
