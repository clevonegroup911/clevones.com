import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
