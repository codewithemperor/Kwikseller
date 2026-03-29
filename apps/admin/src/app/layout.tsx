import type { Metadata } from "next";
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
    default: "Admin Panel | KWIKSELLER",
    template: "%s | KWIKSELLER Admin",
  },
  description: "Super Admin and Sub-Admin panel for KWIKSELLER platform management.",
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
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
