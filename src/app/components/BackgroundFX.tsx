"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function BackgroundFX() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    // Subtle shimmering sweep across the top for a metallic feel
    const tl = gsap.timeline({ repeat: -1, defaults: { ease: "power2.out" } });
    tl.fromTo(
      el,
      { xPercent: -30, opacity: 0.0 },
      { xPercent: 130, opacity: 0.25, duration: 4.5 }
    ).to(el, { opacity: 0.0, duration: 0.6 });
    return () => { tl.kill(); };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 h-40 w-1/3 bg-gradient-to-r from-white/5 via-white/15 to-transparent blur-xl"
    />
  );
}
