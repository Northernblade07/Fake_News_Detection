// app/profile/components/RecentHistory.tsx
"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cardBase } from "../Theme";
import { useTranslations } from "next-intl";

gsap.registerPlugin(ScrollTrigger);

export interface Detection {
  _id: string;
  title?: string;
  textContent?: string;
  result: { label: "fake" | "real" | "unknown"; probability: number };
  createdAt: string;
}

interface RecentHistoryProps { detections: Detection[] }

export default function RecentHistory({ detections }: RecentHistoryProps) {
  const t = useTranslations("profile.recent");
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;
    gsap.from(containerRef.current.children, {
      opacity: 0,
      y: 18,
      stagger: 0.12,
      duration: 0.5,
      ease: "power2.out",
      scrollTrigger: { trigger: containerRef.current, start: "top 85%", invalidateOnRefresh: true },
    });
  }, [detections.length]);

  if (!detections || detections.length === 0) {
    return (
      <section className="mt-12 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">{t("title")}</h2>
        <p className="text-slate-400">{t("empty")}</p>
      </section>
    );
  }

  return (
    <section className="mt-12 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">{t("title")}</h2>
      <div ref={containerRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
        {detections.map(({ _id, title, textContent, result, createdAt }) => (
          <article key={_id} className={`${cardBase} p-5 transition hover:scale-[1.02] hover:shadow-[0_12px_40px_rgba(56,189,248,0.25)]`} tabIndex={0} role="button">
            <h3 className="font-semibold">{title || (textContent ? textContent.slice(0, 60) + "..." : "Untitled")}</h3>
            <p className="mt-2 text-slate-300 text-sm">{new Date(createdAt).toLocaleDateString()}</p>
            <span
              className={`mt-3 inline-block rounded-full px-3 py-1 text-sm font-semibold ${
                result.label === "fake" ? "bg-amber-400/20 text-amber-300" : result.label === "real" ? "bg-emerald-400/20 text-emerald-300" : "bg-slate-400/20 text-slate-300"
              }`}
            >
              {result.label.toUpperCase()} ({(result.probability * 100).toFixed(1)}%)
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}
