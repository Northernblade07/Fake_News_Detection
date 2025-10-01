"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useTranslations } from "next-intl";

gsap.registerPlugin(useGSAP);

export default function StatsStrip() {
  const t = useTranslations("landing.stats");
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.fromTo(
      ".stat-item",
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "power2.out", stagger: 0.1 }
    );
  }, { scope });

  useEffect(() => {
    // count-up animation
    const numbers = document.querySelectorAll<HTMLElement>(".count-up");
    numbers.forEach((num) => {
      const target = +num.dataset.value!;
      gsap.fromTo(
        num,
        { innerText: 0 },
        {
          innerText: target,
          duration: 2,
          snap: { innerText: 1 },
          ease: "power1.out",
        }
      );
    });
  }, []);

  const items = [
    { k: "analyses", v: 1200000, d: t("analyses") },
    { k: "sources", v: 9000, d: t("sources") },
    { k: "langs", v: 12, d: t("langs") }
  ];

  return (
    <section
      ref={scope}
      className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-2xl border border-white/10 bg-[#0e1424]/80 p-6 backdrop-blur"
    >
      {items.map((it) => (
        <div
          key={it.k}
          className="stat-item flex flex-col items-center rounded-xl border border-white/10 bg-[#0f1524] p-6 text-center"
        >
          <div className="count-up text-3xl md:text-4xl font-extrabold" data-value={it.v}>
            {it.v}
          </div>
          <div className="mt-1 text-sm text-slate-400">{it.d}</div>
        </div>
      ))}
    </section>
  );
}
