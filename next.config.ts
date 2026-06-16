import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Skip TypeScript build errors check if any arise on Vercel environment
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
