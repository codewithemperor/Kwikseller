import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.kwikseller.com",
      },
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  // Turbopack handles monorepo packages natively
  turbopack: {},
};

export default nextConfig;
