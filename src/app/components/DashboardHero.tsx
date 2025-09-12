"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function DashboardHero() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
      <h1 className="text-2xl font-extrabold tracking-tight">Analyze Content</h1>
      <p className="mt-2 text-sm text-slate-400">
        Submit text or upload media to analyze your news content with AI.
      </p>
    </header>
  );
}
