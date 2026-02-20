// app/profile/components/SecurityPanel.tsx
"use client";

import { useState, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { cardBase, primaryBtn } from "../Theme";
import { useTranslations } from "next-intl";

import { FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc"

interface SecurityPanelProps { providers: { google: boolean; github: boolean } }

export default function SecurityPanel({ providers }: SecurityPanelProps) {
  const t = useTranslations("profile.security");
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!panelRef.current) return;
    gsap.to(panelRef.current, {
      height: open ? "auto" : 0,
      opacity: open ? 1 : 0,
      duration: open ? 0.45 : 0.25,
      ease: open ? "power2.out" : "power2.in",
    });
  }, [open]);

  return (
    <section className={`${cardBase} mt-8 max-w-3xl mx-auto`}>
      <h2 className="text-xl font-bold mb-4">{t("title")}</h2>

      <button onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="password-change-panel" className={`${primaryBtn} w-full`}>
        {open ? t("hide") : t("change")}
      </button>

      <div id="password-change-panel" ref={panelRef} className="overflow-hidden mt-4" style={{ height: 0, opacity: 0 }}>
        <div className="rounded-lg border border-white/10 bg-[#0f1524] p-4 text-slate-400">{t("comingSoon")}</div>
      </div>

      <div className="mt-6 grid gap-3">
        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#0f1524] p-3">
<FcGoogle />
          <span className="flex-1">{t("google")}</span>
          <span className={`font-semibold ${providers.google ? "text-emerald-400" : "text-amber-400"}`}>
            {providers.google ? t("linked") : t("notLinked")}
          </span>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#0f1524] p-3">
<FaGithub height={10} width={10} />
          <span className="flex-1">{t("github")}</span>
          <span className={`font-semibold ${providers.github ? "text-emerald-400" : "text-amber-400"}`}>
            {providers.github ? t("linked") : t("notLinked")}
          </span>
        </div>
      </div>
    </section>
  );
}

