"use client";

import { ShieldCheck, Languages, AudioLines, Image as Img, FileScan, Brain } from "lucide-react";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useTranslations } from "next-intl";

gsap.registerPlugin(useGSAP);

export default function Features() {
  const t = useTranslations("landing.features");
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.fromTo(
      ".feat-card",
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "power2.out", stagger: 0.08 }
    );
  }, { scope });

  const features = [
    { icon: ShieldCheck, title: t("security.title"), desc: t("security.desc") },
    { icon: Languages, title: t("multilingual.title"), desc: t("multilingual.desc") },
    { icon: Brain, title: t("ai.title"), desc: t("ai.desc") },
    { icon: FileScan, title: t("text.title"), desc: t("text.desc") },
    { icon: Img, title: t("media.title"), desc: t("media.desc") },
    { icon: AudioLines, title: t("audio.title"), desc: t("audio.desc") },
  ];

  return (
    <section
      ref={scope}
      className="rounded-3xl border border-white/10 bg-[#0e1424]/90 p-8 md:p-10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur"
    >
      <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">{t("heading")}</h2>
      <p className="mt-2 text-base text-slate-400">{t("subheading")}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {features.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="feat-card group rounded-2xl border border-white/10 bg-[#0f1524] p-6 hover:border-sky-400/30 hover:shadow-lg hover:shadow-sky-500/10 transition-transform duration-300 hover:-translate-y-1"
          >
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-sky-400/30 to-amber-400/30">
              <Icon className="h-6 w-6 text-sky-300" />
            </div>
            <h3 className="mt-4 font-semibold text-lg">{title}</h3>
            <p className="mt-2 text-sm text-slate-400">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
