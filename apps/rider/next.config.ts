import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // Configure Turbopack (Next.js 16 uses Turbopack by default)
  turbopack: {},
  allowedDevOrigins: ["172.20.10.2"],

  // Proxy all /api/v1 requests to the NestJS backend
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${process.env.API_URL || "http://localhost:4000"}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
