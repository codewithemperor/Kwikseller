import type { NextConfig } from "next";

const useDummy = process.env.NEXT_PUBLIC_USE_DUMMY_DATA === "true";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  allowedDevOrigins: ["*", "192.168.0.105", "192.168.0.100", "192.168.0.101"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "plus.unsplash.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },

  // ── API routing ────────────────────────────────────────────────
  // When dummy data is DISABLED, proxy /api/v1/* to the real NestJS
  // backend (API_URL). When dummy data is ENABLED (development), the
  // in-app route handlers at /api/v1/* serve mock data — no proxy.
  async rewrites() {
    if (useDummy) return [];
    const apiBase = process.env.API_URL || "http://localhost:4000";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiBase}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
