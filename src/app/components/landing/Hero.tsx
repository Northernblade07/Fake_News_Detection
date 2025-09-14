"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useTranslations } from "next-intl";
import Link from "next/link";

gsap.registerPlugin(useGSAP);

export default function Hero() {
  const t = useTranslations("landing.hero");
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.fromTo(
      ".hero-title",
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", stagger: 0.04 }
    );
    gsap.fromTo(
      ".hero-sub",
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: "power2.out", delay: 0.2 }
    );
    gsap.fromTo(
      ".hero-cta",
      { y: 15, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "power2.out", delay: 0.3, stagger: 0.1 }
    );
  }, { scope });

  return (
    <section
      ref={scope}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0e1424]/90 px-6 py-16 md:py-24 text-center shadow-[0_10px_40px_rgba(0,0,0,0.6)] backdrop-blur"
    >
      <div className="relative z-10 mx-auto max-w-4xl">
        <h1 className="hero-title text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight">
          {t("title")}
        </h1>
        <p className="hero-sub mt-4 text-lg md:text-xl text-slate-300">
          {t("subtitle")}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
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

      {/* Floating gradient accents */}
      <div
        aria-hidden
        className="absolute top-0 left-1/2 h-80 w-80 -translate-x-1/2 bg-gradient-to-r from-sky-400/20 via-white/10 to-amber-400/20 blur-3xl rounded-full animate-pulse-slow"
      />
    </section>
  );
}
