// app/profile/components/SecurityPanel.tsx
"use client";

import { useState, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { primaryBtn } from "../Theme";

interface SecurityPanelProps {
  providers: {
    google: boolean;
    github: boolean;
  };
}

export default function SecurityPanel({ providers }: SecurityPanelProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!panelRef.current) return;
    if (open) {
      gsap.to(panelRef.current, {
        height: "auto",
        opacity: 1,
        duration: 0.5,
        ease: "power2.out",
      });
    } else {
      gsap.to(panelRef.current, {
        height: 0,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
      });
    }
  }, [open]);

  return (
    <section className="mt-10 p-6 rounded-2xl bg-[#0e1424]/80 shadow-lg text-slate-100">
      <h2 className="text-xl font-bold mb-4 text-gradient">
        Account & Security
      </h2>

      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="password-change-panel"
        className={`${primaryBtn} max-w-md`}
      >
        {open ? "Hide Password Change" : "Change Password"}
      </button>

      <div
        id="password-change-panel"
        ref={panelRef}
        className="overflow-hidden mt-4 max-w-md"
        style={{ height: 0, opacity: 0 }}
      >
        {/* Password change form goes here */}
        <p className="text-slate-400">Password change feature coming soon.</p>
      </div>

      <div className="mt-8 flex flex-col gap-4 max-w-md">
        <div className="flex items-center gap-3">
          <img src="/icons/google.svg" alt="Google" className="w-6 h-6" loading="lazy" />
          <span className="flex-1">Google Provider</span>
          <span className={`font-semibold ${providers.google ? "text-emerald-400" : "text-amber-400"}`}>
            {providers.google ? "Linked" : "Not Linked"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <img src="/icons/github.svg" alt="GitHub" className="w-6 h-6" loading="lazy" />
          <span className="flex-1">GitHub Provider</span>
          <span className={`font-semibold ${providers.github ? "text-emerald-400" : "text-amber-400"}`}>
            {providers.github ? "Linked" : "Not Linked"}
          </span>
        </div>
      </div>
    </section>
  );
}
