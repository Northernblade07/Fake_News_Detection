import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./src/app/lib/i18n/request.ts");

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["onnxruntime-node", "sharp"],
  },
  images: {
    domains: [
     "assets.upstox.com",
      "www.hindustantimes.com",
      "cdn.cnn.com",
      "ichef.bbci.co.uk",
      "images.wsj.net",
      "static01.nyt.com",
      "media.gq.com",
      "cdn.vox-cdn.com",
      "encrypted-tbn0.gstatic.com",
      "images.financialexpressdigital.com",
    ],
  },
};

export default withNextIntl(nextConfig);
