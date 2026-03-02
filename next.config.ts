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
    "tesseract.js",
    "@napi-rs/canvas",
  "@napi-rs/canvas-linux-x64-gnu",
  "@napi-rs/canvas-linux-x64-musl",
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
  remotePatterns: [
    {
      protocol: "https",
      hostname: "assets.upstox.com",
    },
    {
      protocol: "https",
      hostname: "avatars.githubusercontent.com",
    },
    {
      protocol: "https",
      hostname: "www.hindustantimes.com",
    },
    {
      protocol: "https",
      hostname: "cdn.cnn.com",
    },
    {
      protocol: "https",
      hostname: "ichef.bbci.co.uk",
    },
    {
      protocol: "https",
      hostname: "images.wsj.net",
    },
    {
      protocol: "https",
      hostname: "static01.nyt.com",
    },
    {
      protocol: "https",
      hostname: "media.gq.com",
    },
    {
      protocol: "https",
      hostname: "cdn.vox-cdn.com",
    },
    {
      protocol: "https",
      hostname: "encrypted-tbn0.gstatic.com",
    },
    {
      protocol: "https",
      hostname: "images.financialexpressdigital.com",
    },
    {
      protocol: "https",
      hostname: "api.dicebear.com",
    },
    {
      protocol: "https",
      hostname: "lh3.googleusercontent.com",
    },
    {
      protocol: "https",
      hostname: "avatar.iran.liara.run",
    },
  ],
},
};

export default withNextIntl(nextConfig);