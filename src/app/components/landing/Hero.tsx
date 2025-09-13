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

  useGSAP(
    () => {
      gsap.fromTo(
        ".hero-title",
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power2.out", stagger: 0.04 }
      );
      gsap.fromTo(
        ".hero-sub",
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.2 }
      );
      gsap.fromTo(
        ".hero-cta",
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, ease: "power2.out", delay: 0.3, stagger: 0.08 }
      );
    },
    { scope }
  );

  return (
    <section
      ref={scope}
      className="relative rounded-3xl border border-white/10 bg-[#0e1424]/80 p-8 md:p-12 shadow-[0_10px_40px_rgba(0,0,0,0.45)] backdrop-blur"
    >
      <div className="max-w-3xl">
        <h1 className="hero-title text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
          AI News Integrity for India
        </h1>
        <p className="hero-sub mt-3 text-slate-300">
          Multilingual fake‑news detection across text, images, audio, and video—built for trust and speed.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard"
            className="hero-cta inline-flex items-center rounded-xl bg-gradient-to-r from-sky-400 via-sky-500 to-amber-400 px-5 py-2.5 font-semibold text-[#0b0f1a] shadow-[0_6px_30px_rgba(56,189,248,0.25)] hover:brightness-110 transition"
          >
            Get started
          </Link>
          <Link
            href="/explore"
            className="hero-cta inline-flex items-center rounded-xl border border-white/10 bg-[#0f1524] px-5 py-2.5 text-slate-100 hover:border-sky-400/30 hover:bg-[#111a2f] transition"
          >
            Explore latest news
          </Link>
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-44 rounded-2xl bg-gradient-to-r from-sky-400/20 via-white/10 to-amber-400/20 blur-2xl"
      />
    </section>
  );
}
