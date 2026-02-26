// next.config.ts
import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

// Keep your existing next-intl setup
const withNextIntl = createNextIntlPlugin("./src/app/lib/i18n/request.ts");

const nextConfig: NextConfig = {
  output:"standalone",
  serverExternalPackages: [
    "ffmpeg-static",
    "ffprobe-static",
    "sharp",
    "tesseract.js"
  ],
  typescript:{
    ignoreBuildErrors:true
  },
  eslint:{
    ignoreDuringBuilds:true
  },
  // 1) Security + SW headers (applied before filesystem)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },

  // 2) Your existing settings
  outputFileTracingIncludes: {
    "/api/**/*": [
      "./node_modules/tesseract.js/src/worker-script/node/index.js",
      "./node_modules/tesseract.js-core/**/*.wasm",
      "./node_modules/tesseract.js-core/**/*.wasm.js",
    ],
  },

  // experimental: {
  //   serverComponentsExternalPackages: ["onnxruntime-node",],
  // },

  images: {
    domains: [
      "assets.upstox.com",
      "avatars.githubusercontent.com",
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