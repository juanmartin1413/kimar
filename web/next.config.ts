import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    API_URL: process.env.API_URL || 'https://kimar-backend.up.railway.app',
  },
};

export default nextConfig;
