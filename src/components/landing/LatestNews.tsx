"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Link from "next/link";
import { useTranslations } from "next-intl";

gsap.registerPlugin(useGSAP);

type Item = {
  id: string;
  title: string;
  label: "fake" | "real" | "unknown";
  source?: string;
};

export default function LatestNews() {
  const t = useTranslations("landing.news");
  const scope = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useGSAP(() => {
    gsap.fromTo(
      ".news-item",
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "power2.out", stagger: 0.1 }
    );
  }, { scope, dependencies: [items.length], revertOnUpdate: true });

  useEffect(() => {
    setTimeout(() => {
      setItems([
        { id: "1", title: "Claim about policy X debunked", label: "fake", source: "Wire" },
        { id: "2", title: "Election turnout report validated", label: "real", source: "Official" },
        { id: "3", title: "Misinformation trend across regions", label: "unknown" },
      ]);
      setLoading(false);
    }, 1500);
  }, []);

  const badge = (label: Item["label"]) =>
    label === "real"
      ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
      : label === "fake"
      ? "bg-rose-500/20 text-rose-300 border-rose-400/30"
      : "bg-slate-500/20 text-slate-300 border-slate-400/30";

  return (
    <section ref={scope} className="mt-14">
      <div className="mb-6">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">{t("heading")}</h2>
        <p className="mt-2 text-sm text-slate-400">{t("subheading")}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-white/10 bg-[#0f1524] p-5 h-36" />
            ))
          : items.map((n) => (
              <article
                key={n.id}
                className="news-item rounded-2xl border border-white/10 bg-[#0f1524] p-15 hover:border-sky-400/30 transition"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${badge(n.label)}`}>
                    {n.label.toUpperCase()}
                  </span>
                  {n.source && <span className="text-xs text-slate-500">{n.source}</span>}
                </div>
                <h3 className="mt-3 font-semibold text-base md:text-lg">{n.title}</h3>
                <div className="mt-4">
                  <Link href="/explore" className="text-sky-300 hover:text-amber-300 transition text-sm">
                    {t("details")} →
                  </Link>
                </div>
              </article>
            ))}
      </div>
    </section>
  );
}
