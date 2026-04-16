// KWIKSELLER - PWA Manifest
// Progressive Web App configuration for installability

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KWIKSELLER - Africa's Commerce Platform",
    short_name: "KWIKSELLER",
    description: "Africa's Most Powerful Commerce Operating System. Shop, sell, and grow your business.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#F07A22",
    orientation: "portrait-primary",
    scope: "/",
    lang: "en",
    categories: ["shopping", "business", "lifestyle"],
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/screenshots/home.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: "KWIKSELLER Marketplace",
      },
      {
        src: "/screenshots/mobile.png",
        sizes: "750x1334",
        type: "image/png",
        form_factor: "narrow",
        label: "KWIKSELLER Mobile Experience",
      },
    ],
    shortcuts: [
      {
        name: "Browse Products",
        short_name: "Shop",
        description: "Browse products on KWIKSELLER",
        url: "/products",
        icons: [{ src: "/icons/shop.png", sizes: "96x96" }],
      },
      {
        name: "My Cart",
        short_name: "Cart",
        description: "View your shopping cart",
        url: "/cart",
        icons: [{ src: "/icons/cart.png", sizes: "96x96" }],
      },
      {
        name: "My Orders",
        short_name: "Orders",
        description: "Track your orders",
        url: "/orders",
        icons: [{ src: "/icons/orders.png", sizes: "96x96" }],
      },
    ],
    related_applications: [],
    prefer_related_applications: false,
  };
}
