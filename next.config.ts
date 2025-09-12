import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./src/app/lib/i18n/request.ts"); // <-- custom path

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['onnxruntime-node', 'sharp'],
  },
};

export default withNextIntl(nextConfig);
