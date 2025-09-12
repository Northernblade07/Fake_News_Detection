import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['onnxruntime-node', 'sharp'],
  },
  /* config options here */
};

export default nextConfig;
