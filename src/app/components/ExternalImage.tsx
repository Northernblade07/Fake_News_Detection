// components/ExternalImage.tsx
"use client";

import Image from "next/image";

interface ExternalImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
}

export default function ExternalImage({ src, alt = "", className }: ExternalImageProps) {
  if (!src) {
    return (
      <div className={`grid h-full w-full place-items-center text-xs text-slate-500 ${className || ""}`}>
        No image
      </div>
    );
  }

  // Trusted domains for Next.js Image
  const WHITELISTED_DOMAINS = [
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
  ];

  try {
    const url = new URL(src);
    if (WHITELISTED_DOMAINS.includes(url.hostname)) {
      return <Image src={src} alt={alt} fill className={`${className} h-full w-full object-cover`} />;
    }
  } catch (err) {
    console.log(err)
    console.warn("Invalid image URL:", src);
  }

  // Fallback for unknown domains
  return <img src={src} alt={alt} className={`${className} h-full w-full object-cover`} />;
}
