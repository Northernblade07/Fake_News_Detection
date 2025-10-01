"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useTranslations } from "next-intl";
import Link from "next/link";

gsap.registerPlugin(useGSAP);

export default function Hero() {
  const t = useTranslations("landing.hero");
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Respect reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // Animate title, subtitle, CTA in sequence with stagger
    tl.fromTo(
      ".hero-title",
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9 }
    )
      .fromTo(
        ".hero-sub",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 },
        "-=0.4"
      )
      .fromTo(
        ".hero-cta",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, stagger: 0.15 },
        "-=0.3"
      )
      // Image entrance
      .fromTo(
        ".hero-art",
        { x: 40, opacity: 0, scale: 0.95, rotate: -3 },
        { x: 0, opacity: 1, scale: 1, rotate: 0, duration: 1 },
        "-=0.5"
      );

    // Gentle continuous float on the image wrapper
    gsap.to(".hero-art-float", {
      y: -12,
      repeat: -1,
      yoyo: true,
      duration: 2.6,
      ease: "sine.inOut",
    });
  }, { scope });

  return (
    <section
      ref={scope}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0e1424]/90 px-6 py-1 md:py-24 shadow-[0_10px_40px_rgba(0,0,0,0.6)] backdrop-blur"
    >
      <div className="relative z-10 mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left: content */}
        <div className="lg:pr-4 text-center lg:text-left">
          <h1 className="hero-title text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight">
            {t("title")}
          </h1>
          <p className="hero-sub mt-4 text-lg md:text-xl text-slate-300">
            {t("subtitle")}
          </p>
          <div className="mt-8 flex flex-wrap lg:justify-start justify-center gap-4">
            <Link
              href="/dashboard"
              className="hero-cta inline-flex items-center rounded-xl bg-gradient-to-r from-green-400 via-sky-200 to-amber-800 px-6 py-3 font-semibold text-[#0b0f1a] shadow-[0_6px_30px_rgba(56,189,248,0.35)] hover:brightness-110 transition"
            >
              {t("ctaPrimary")}
            </Link>
            <Link
              href="/explore"
              className="hero-cta inline-flex items-center rounded-xl border border-white/10 bg-[#0f1524] px-6 py-3 text-slate-100 hover:border-sky-400/30 hover:bg-[#111a2f] transition"
            >
              {t("ctaSecondary")}
            </Link>
          </div>
        </div>

        {/* Right: image */}
        <div className="relative hero-art">
          <div className="hero-art-float relative mx-auto w-full max-w-[520px]">
            <Image
              src="/hero_image.png"
              alt="Illustration for misinformation analysis"
              width={1040}
              height={780}
              priority
              className="w-full h-auto drop-shadow-[0_12px_40px_rgba(56,189,248,0.25)] rounded-2xl select-none pointer-events-none"
            />
            {/* subtle glow background */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-8 -z-10 rounded-[32px] bg-gradient-to-r from-sky-400/15 via-white/5 to-amber-400/15 blur-2xl"
            />
          </div>
        </div>
      </div>

      {/* Existing floating accent */}
      <div
        aria-hidden
        className="absolute top-0 left-1/2 h-60 w-80 -translate-x-1/2 bg-gradient-to-r from-sky-400/20 via-white/10 to-amber-400/20 blur-3xl rounded-full animate-pulse-slow"
      />
    </section>
  );
}
