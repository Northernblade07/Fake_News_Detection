// app/profile/components/ActivityStats.tsx
"use client";

import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

interface ActivityStatsProps {
  stats: {
    totalDetections: number;
    fakeCount: number;
    realCount: number;
  };
}

export default function ActivityStats({ stats }: ActivityStatsProps) {
  const countRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!countRef.current) return;
    gsap.from(countRef.current.children, {
      opacity: 0,
      y: 15,
      stagger: 0.1,
      duration: 0.6,
      ease: "power3.out",
    });
  }, []);

  // Animate counts (simplified)
  const formatNumber = (num: number) => num.toLocaleString();

  return (
    <section
      ref={countRef}
      className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-xl mx-auto bg-[#0e1424]/80 p-6 rounded-2xl shadow-lg text-white"
    >
      <div className="text-center">
        <h3 className="text-4xl font-extrabold text-gradient">{formatNumber(stats.totalDetections)}</h3>
        <p className="text-sm uppercase tracking-wide text-slate-400">Total Detections</p>
      </div>

      <div className="text-center">
        <h3 className="text-4xl font-extrabold text-emerald-400">{formatNumber(stats.realCount)}</h3>
        <p className="text-sm uppercase tracking-wide text-slate-400">Real</p>
      </div>

      <div className="text-center">
        <h3 className="text-4xl font-extrabold text-amber-400">{formatNumber(stats.fakeCount)}</h3>
        <p className="text-sm uppercase tracking-wide text-slate-400">Fake</p>
      </div>
    </section>
  );
}
