import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/lib/query-provider";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "KWIKSELLER - Africa's Most Powerful Commerce Operating System",
    template: "%s | KWIKSELLER",
  },
  description: "KWIKSELLER is Africa's most powerful commerce operating system. Create your online store, sell products, manage orders, and grow your business with our comprehensive platform.",
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
    description: "Create your online store, sell products, manage orders, and grow your business with Africa's most comprehensive commerce platform.",
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
    description: "Create your online store, sell products, and grow your business with Africa's most comprehensive commerce platform.",
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
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster position="top-right" richColors closeButton />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
