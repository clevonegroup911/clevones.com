import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Playwright e2e sets NEXT_DIST_DIR=.next-e2e so FULL CI `next build` artifacts
  // in `.next/` are not rewritten by `next dev` (loadManifest truncated-JSON races).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  reactStrictMode: true,
  serverExternalPackages: ["argon2", "@prisma/client", "otpauth", "qrcode"],
  async redirects() {
    return [
      {
        source: "/accueil",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
