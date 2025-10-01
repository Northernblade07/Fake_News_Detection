"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Link from "next/link";
import { useTranslations } from "next-intl";

gsap.registerPlugin(useGSAP);

export default function CtaBand() {
  const t = useTranslations("landing.cta");
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.fromTo(
      scope.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" }
    );
  }, { scope });

  return (
    <section
      ref={scope}
      className="mt-14 rounded-3xl border border-white/10 bg-[#0e1424]/90 p-10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur"
    >
      
      <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight">{t("title")}</h3>
          <p className="mt-2 text-sm text-slate-400">{t("subtitle")}</p>
        </div>
        <div className="flex gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-xl bg-gradient-to-r from-sky-400 via-sky-500 to-amber-400 px-6 py-3 font-semibold text-[#0b0f1a] shadow-[0_6px_30px_rgba(56,189,248,0.35)] hover:brightness-110 transition"
          >
            {t("primary")}
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center rounded-xl border border-white/10 bg-[#0f1524] px-6 py-3 text-slate-100 hover:border-sky-400/30 hover:bg-[#111a2f] transition"
          >
            {t("secondary")}
          </Link>
        </div>
      </div>
    </section>
  );
}
