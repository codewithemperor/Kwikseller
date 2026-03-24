import type { Metadata, Viewport } from "next";
import { Poppins, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@kwikseller/ui/sonner";

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
    default: "KWIKSELLER Rider - Delivery App",
    template: "%s | KWIKSELLER Rider",
  },
  description: "KWIKSELLER Rider App - Manage deliveries, track earnings, and complete orders on the go.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#1A56DB",
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
      className={`${fontHeading.variable} ${fontText.variable} ${fontMono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-text antialiased bg-background text-foreground">
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
