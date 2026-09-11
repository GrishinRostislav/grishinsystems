import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/cashFlow',
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
