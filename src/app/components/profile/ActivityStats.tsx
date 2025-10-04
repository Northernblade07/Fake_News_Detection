// app/profile/components/ActivityStats.tsx
"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { cardBase } from "../Theme";
import { useTranslations } from "next-intl";

interface ActivityStatsProps {
  stats: { totalDetections: number; fakeCount: number; realCount: number };
}

export default function ActivityStats({ stats }: ActivityStatsProps) {
  const t = useTranslations("profile");
  const countRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!countRef.current) return;
    gsap.from(countRef.current.children, {
      opacity: 0,
      y: 14,
      stagger: 0.12,
      duration: 0.55,
      ease: "power2.out",
    });
  }, []);

  const fmt = (n: number) => n.toLocaleString();

  return (
    <section className={`${cardBase} mt-8 max-w-3xl mx-auto`}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-white" ref={countRef}>
        <div className="text-center">
          <h3 className="text-4xl font-extrabold text-emerald-400">{fmt(stats.realCount)}</h3>
          <p className="text-sm uppercase tracking-wide text-slate-400">{t("statsLabels.real")}</p>
        </div>
        <div className="text-center">
          <h3 className="text-4xl font-extrabold bg-gradient-to-r from-sky-400 via-sky-500 to-amber-400 bg-clip-text text-transparent">
            {fmt(stats.totalDetections)}
          </h3>
          <p className="text-sm uppercase tracking-wide text-slate-300">{t("statsLabels.total")}</p>
        </div>
        <div className="text-center">
          <h3 className="text-4xl font-extrabold text-amber-400">{fmt(stats.fakeCount)}</h3>
          <p className="text-sm uppercase tracking-wide text-slate-400">{t("statsLabels.fake")}</p>
        </div>
      </div>
    </section>
  );
}
