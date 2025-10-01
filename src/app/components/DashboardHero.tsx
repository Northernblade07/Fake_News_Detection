// app/components/DashboardHero.tsx
"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useTranslations } from "next-intl";

export default function DashboardHero() {
  const t = useTranslations("detect.hero");
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!ref.current) return;
    gsap.fromTo(
      ref.current,
      { y: 18, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" }
    );
  }, []);

  return (
    <header
      ref={ref}
      className="rounded-2xl border border-white/10 bg-[#0e1424]/80 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.45)] backdrop-blur"
    >
      <h1 className="text-2xl font-extrabold tracking-tight">{t("title")}</h1>
      <p className="mt-2 text-sm text-slate-400">{t("subtitle")}</p>
    </header>
  );
}
