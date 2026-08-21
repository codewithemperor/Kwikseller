import { Metadata, Viewport } from "next";
import { JetBrains_Mono, Figtree, DM_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { HeroUIProviderWrapper, AuthProvider } from "@/lib/utils";
import { Toast } from "@heroui/react";
import { QueryProvider } from "@/lib/query-provider";

// Heading font - Poppins (modern, geometric sans-serif)
const fontHeading = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

const fontText = DM_Sans({
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
    default: "Admin Panel | KWIKSELLER",
    template: "%s | KWIKSELLER Admin",
  },
  description:
    "Super Admin and Sub-Admin panel for KWIKSELLER platform management.",
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
      className={`${fontHeading.variable} ${fontText.variable} ${fontMono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-text antialiased bg-background text-foreground">
        <QueryProvider>
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
              </ThemeProvider>
            </AuthProvider>
          </HeroUIProviderWrapper>
        </QueryProvider>
      </body>
    </html>
  );
}

