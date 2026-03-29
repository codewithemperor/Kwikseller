/** @type {import('next').NextConfig} */
import withPWA from "next-pwa";

const isDev = process.env.NODE_ENV === "development";
// const nextConfig = {};

export default withPWA({
  dest: "public",
  disable: isDev, // disable PWA in dev (important)
})( {
  reactStrictMode: true,
});
