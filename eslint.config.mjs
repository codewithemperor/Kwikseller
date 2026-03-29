// Root ESLint config for monorepo
// This config is intentionally minimal because each app has its own eslint.config.mjs
// The root config only applies to shared packages and provides defaults

import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

/** @type {import('typescript-eslint').Config} */
export default [
  // Ignore all app directories - they have their own configs
  {
    ignores: [
      "apps/**",
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      "examples/**",
      "skills/**",
      "*.config.js",
      "*.config.mjs",
      "**/node_modules/**",
      "**/.next/**",
    ],
  },
  // Config for root-level files only
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
      "no-console": "off",
    },
  },
];
