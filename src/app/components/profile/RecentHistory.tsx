// app/profile/components/RecentHistory.tsx
"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { cardBase } from "../Theme";

// Type-safe detection object matching SSR query
export interface Detection {
  _id: string;
  title?: string;
  textContent?: string;
  result: {
    label: "fake" | "real" | "unknown";
    probability: number;
  };
  createdAt: string;
}

interface RecentHistoryProps {
  detections: Detection[];
}

export default function RecentHistory({ detections }: RecentHistoryProps) {
  
  
  
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;
    gsap.from(containerRef.current.children, {
      opacity: 0,
      y: 20,
      stagger: 0.12,
      duration: 0.5,
      ease: "power2.out",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 85%",
      },
    });
  }, []);

  if (!detections || detections.length === 0) {
    return (
      <section className="mt-12 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-gradient">Recent Detections</h2>
        <p className="text-slate-400">No recent detections found.</p>
      </section>
    );
  }

  return (
    <section className="mt-12 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gradient">Recent Detections</h2>
      <div
        ref={containerRef}
        className="grid grid-cols-1 sm:grid-cols-2 gap-6"
      >
        {detections.map(({ _id, title, textContent, result, createdAt }) => (
          <article
            key={_id}
            className={`${cardBase} cursor-pointer p-5 transition hover:scale-[1.03] hover:shadow-[0_12px_40px_rgba(255,181,40,0.35)]`}
            tabIndex={0}
            aria-label={`Detection ${title || textContent?.slice(0,40)} status ${result.label}`}
            role="button"
          >
            <h3 className="font-semibold">
              {title || (textContent ? textContent.slice(0, 60) + "..." : "Untitled")}
            </h3>
            <p className="mt-2 text-slate-300 text-sm">{new Date(createdAt).toLocaleDateString()}</p>
            <span
              className={`inline-block mt-3 rounded-full px-3 py-1 font-semibold text-sm ${
                result.label === "fake"
                  ? "bg-amber-400/20 text-amber-400"
                  : result.label === "real"
                  ? "bg-emerald-400/20 text-emerald-400"
                  : "bg-slate-400/20 text-slate-400"
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
