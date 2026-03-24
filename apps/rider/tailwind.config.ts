import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        kwik: {
          blue: "#1A56DB",
          "blue-dark": "#1E40AF",
          "blue-light": "#3B82F6",
          green: "#059669",
          "green-light": "#10B981",
          orange: "#EA580C",
          gold: "#D97706",
        },
      },
    },
  },
  plugins: [],
};

export default config;
