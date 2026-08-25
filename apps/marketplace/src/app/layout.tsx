import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { QueryProvider } from "@/lib/query-provider";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/lib/auth-context";
import { HeroUIProviderWrapper } from "@/lib/heroui-provider";
import { ToastProvider } from "@/components/layout/toast-provider";
import {
  fontHeading,
  fontText,
  fontInter,
  fontPoppins,
  fontDmSans,
  fontLato,
  fontMontserrat,
  fontPlayfairDisplay,
  fontMerriweather,
} from "@/lib/fonts";

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
    { media: "(prefers-color-scheme: light)", color: "#F97316" },
    { media: "(prefers-color-scheme: dark)", color: "#C2410C" },
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
      <body className={`${fontText.variable} ${fontHeading.variable} ${fontInter.variable} ${fontPoppins.variable} ${fontDmSans.variable} ${fontLato.variable} ${fontMontserrat.variable} ${fontPlayfairDisplay.variable} ${fontMerriweather.variable} font-sans antialiased bg-background text-foreground`}>
        <HeroUIProviderWrapper>
          <QueryProvider>
            <AuthProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                {children}
                <ToastProvider />
                <Toaster
                  position="top-right"
                  richColors
                  closeButton
                  toastOptions={{
                    unstyled: false,
                    classNames: {
                      toast: "!rounded-xl !border !border-foreground !bg-foreground !text-background !shadow-none",
                      title: "!text-sm !font-semibold !text-background",
                      description: "!text-xs !text-background/75",
                      actionButton: "!rounded-md !bg-kwik-orange !px-3 !py-1.5 !text-xs !font-semibold !text-white",
                      cancelButton: "!rounded-md !bg-white/15 !px-3 !py-1.5 !text-xs !font-medium !text-background",
                      success: "!border-success !bg-success !text-success-foreground",
                      error: "!border-danger !bg-danger !text-danger-foreground",
                      info: "!border-kwik-blue !bg-kwik-blue !text-white",
                      warning: "!border-warning !bg-warning !text-warning-foreground",
                      closeButton: "!top-3 !right-3 !left-auto !border-transparent !bg-transparent !text-current/70 hover:!bg-white/15 hover:!text-current",
                    },
                  }}
                />
              </ThemeProvider>
            </AuthProvider>
          </QueryProvider>
        </HeroUIProviderWrapper>
      </body>
    </html>
  );
}
