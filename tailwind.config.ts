import type { Config } from "tailwindcss";

/**
 * Clevones institutional design system.
 *
 * Theme tokens (colors, typography, spacing) are defined in app/globals.css
 * via Tailwind CSS v4 @theme. This file configures content scanning and
 * documents the design intent.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
};

export default config;
