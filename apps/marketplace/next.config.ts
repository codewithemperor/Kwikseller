import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // Configure Turbopack (Next.js 16 uses Turbopack by default)
  turbopack: {},
};

export default nextConfig;
