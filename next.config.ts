import type { NextConfig } from "next";

/**
 * Playwright runs on `next dev` (tests/e2e/dev-server.ts sets X200_E2E=1).
 * By default the dev server evicts pages idle for 60 s and recompiles them
 * on the next hit; during that recompilation a route can read a manifest
 * still being rewritten ("Unexpected end of JSON input", HTTP 500), which
 * made the mobile pass flaky. Keep every compiled entry for the whole run.
 * `onDemandEntries` only affects `next dev`, never `next build`/`next start`.
 */
const e2eDevEntries: NextConfig["onDemandEntries"] =
  process.env.X200_E2E === "1"
    ? { maxInactiveAge: 60 * 60 * 1000, pagesBufferLength: 1000 }
    : undefined;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(e2eDevEntries ? { onDemandEntries: e2eDevEntries } : {}),
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
