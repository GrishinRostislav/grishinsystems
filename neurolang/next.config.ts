import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/neurolang',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
