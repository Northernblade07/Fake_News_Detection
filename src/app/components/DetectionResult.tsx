// app/components/DetectionResult.tsx
"use client";

import { useRef } from "react";
import { CheckCircle, XCircle, HelpCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import RelatedNewsButton from "./related/RelatedNewsButton";

type DetectionSuccess = {
  news: { 
    _id: string;
    title?: string;
    textContent?: string;
    normalizedText?: string;
    type: "text" | "file";

    media: Array<{
      url: string;
      publicId: string;
      resourceType: "image" | "video" | "raw";
      format?: string;
      bytes?: number;
      width?: number;
      height?: number;
      duration?: number;
    }>;

    result: {
      label: "fake" | "real" | "unknown";
      probability: number;
    };
  };
  log: { _id: string };
};


type Props = {
  result: DetectionSuccess;
  userLang:string;
};

export default function DetectionResult({ result , userLang }: Props) {
  const t = useTranslations("detect.result");
  console.log(result)
  const ref = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const { label, probability } = result.news.result;
  const percentage = Math.round(probability * 100);

  useGSAP(() => {
    if (!ref.current || !progressRef.current) return;
    
    const tl = gsap.timeline();
    tl.fromTo(ref.current, 
      { y: 20, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }
    );
    tl.fromTo(progressRef.current,
      { width: "0%" },
      { width: `${percentage}%`, duration: 0.8, ease: "power2.out" },
      0.2
    );
  }, [percentage]);

  const getIcon = () => {
    switch (label) {
      case "fake": return <XCircle className="h-8 w-8 text-red-400" />;
      case "real": return <CheckCircle className="h-8 w-8 text-green-400" />;
      default: return <HelpCircle className="h-8 w-8 text-yellow-400" />;
    }
  };

  const getColors = () => {
    switch (label) {
      case "fake": return {
        bg: "bg-red-500/10",
        border: "border-red-500/30", 
        text: "text-red-300",
        progress: "bg-red-500"
      };
      case "real": return {
        bg: "bg-green-500/10",
        border: "border-green-500/30",
        text: "text-green-300", 
        progress: "bg-green-500"
      };
      default: return {
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/30",
        text: "text-yellow-300",
        progress: "bg-yellow-500"
      };
    }
  };

  const colors = getColors();

  return (
    <div
      ref={ref}
      className={`mt-6 rounded-2xl border p-6 ${colors.bg} ${colors.border} backdrop-blur`}
    >
      <div className="flex items-center gap-4 mb-4">
        {getIcon()}
        <div>
          <h3 className={`text-xl font-bold ${colors.text}`}>
            {t(`labels.${label}`)}
          </h3>
          <p className="text-sm text-slate-400">
            {t(`descriptions.${label}`)}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-slate-300">
            {t("confidence", { percent: percentage })}
          </span>
          <span className={`text-lg font-bold ${colors.text}`}>
            {percentage}%
          </span>
        </div>
        
        <div className="relative h-3 bg-slate-700 rounded-full overflow-hidden">
          <div
            ref={progressRef}
            className={`h-full ${colors.progress} rounded-full transition-all duration-300`}
            style={{ width: "0%" }}
          />
        </div>
      </div>

      {/* Analysis breakdown */}
      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg bg-slate-800/50 p-3">
          <div className={`text-lg font-bold ${label === 'fake' ? colors.text : 'text-slate-400'}`}>
            {label === 'fake' ? percentage : Math.max(0, 100 - percentage)}%
          </div>
          <div className="text-xs text-slate-500">{t("labels.fake")}</div>
        </div>
        <div className="rounded-lg bg-slate-800/50 p-3">
          <div className={`text-lg font-bold ${label === 'real' ? colors.text : 'text-slate-400'}`}>
            {label === 'real' ? percentage : Math.max(0, 100 - percentage)}%
          </div>
          <div className="text-xs text-slate-500">{t("labels.real")}</div>
        </div>
        <div className="rounded-lg bg-slate-800/50 p-3">
          <div className={`text-lg font-bold ${label === 'unknown' ? colors.text : 'text-slate-400'}`}>
            {label === 'unknown' ? percentage : Math.min(100 - percentage, 100)}%
          </div>
          <div className="text-xs text-slate-500">{t("labels.unknown")}</div>
        </div>
      </div>

 {/* Suggested News Button at the BOTTOM */}
<div className="mt-6">
  <RelatedNewsButton 
    summary={result.news.textContent || result.news.normalizedText || ""}
    title={result.news.title || result.news?.textContent?.slice(0, 80)}
    lang={userLang}
    region="in"
  />
</div>


    </div>
  );
}
