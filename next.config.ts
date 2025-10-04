import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./src/app/lib/i18n/request.ts");

const nextConfig: NextConfig = {
   outputFileTracingIncludes: {
      "/api/**/*": [
        "./node_modules/tesseract.js/src/worker-script/node/index.js",  // worker entry
        "./node_modules/tesseract.js-core/**/*.wasm",                   // WASM files
        "./node_modules/tesseract.js-core/**/*.wasm.js",                // loader stubs
      ],
    },
  experimental: {
    serverComponentsExternalPackages: [
      "onnxruntime-node",
      "sharp",
      "tesseract.js",                  // add
    ],
   
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
      "api.dicebear.com",
      "lh3.googleusercontent.com",
      "avatar.iran.liara.run",
    ],
  },
};

export default withNextIntl(nextConfig);
