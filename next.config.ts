import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
