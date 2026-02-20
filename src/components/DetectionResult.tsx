"use client";

import { useRef, useState } from "react";
import { CheckCircle, XCircle, HelpCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import FactCheckModal, { RagResult } from "./FactCheckModal";

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
  rag: RagResult;
};

type Props = {
  result: DetectionSuccess;
  userLang: string;
};

export default function DetectionResult({ result }: Props) {

  console.log(result)
  const t = useTranslations("detect.result");

  const ref = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);

  const label = result?.rag.label;
  const probability = result?.rag.confidence;
  const percentage = Math.round(probability * 100);

  const rag = result.rag;

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.fromTo(
      ref.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }
    );
    tl.fromTo(
      progressRef.current,
      { width: "0%" },
      { width: `${percentage}%`, duration: 0.8, ease: "power2.out" },
      0.2
    );
  }, [percentage]);

  const getIcon = () => {
    switch (label) {
      case "fake":
        return <XCircle className="h-8 w-8 text-red-400" />;
      case "real":
        return <CheckCircle className="h-8 w-8 text-green-400" />;
      default:
        return <HelpCircle className="h-8 w-8 text-yellow-400" />;
    }
  };

  const getColors = () => {
    switch (label) {
      case "fake":
        return {
          bg: "bg-red-500/10",
          border: "border-red-500/30",
          text: "text-red-300",
          progress: "bg-red-500",
        };
      case "real":
        return {
          bg: "bg-green-500/10",
          border: "border-green-500/30",
          text: "text-green-300",
          progress: "bg-green-500",
        };
      default:
        return {
          bg: "bg-yellow-500/10",
          border: "border-yellow-500/30",
          text: "text-yellow-300",
          progress: "bg-yellow-500",
        };
    }
  };

  const colors = getColors();

  return (
    <>
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

        {/* Confidence */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-300">
              {t("confidence", { percent: percentage })}
            </span>
            <span className={`text-lg font-bold ${colors.text}`}>
              {percentage}%
            </span>
          </div>

          <div className="relative h-3 bg-slate-700 rounded-full overflow-hidden">
            <div
              ref={progressRef}
              className={`h-full ${colors.progress} rounded-full`}
            />
          </div>
        </div>

        {/* Open modal */}
        <button
          onClick={() => setOpen(true)}
          className="mt-6 w-full rounded-xl px-5 py-3 font-semibold 
          bg-gradient-to-r from-sky-400 via-sky-500 to-amber-400
          text-[#0b0f1a] shadow-[0_6px_30px_rgba(56,189,248,0.25)]
          hover:brightness-110 transition"
        >
          Show Fact-Check Details
        </button>
      </div>

      <FactCheckModal
        open={open}
        onClose={() => setOpen(false)}
        rag={rag}
        media={result.news.media}
        originalText={result.news.textContent || ""}
        normalizedText={result.news.normalizedText || ""}
      />
    </>
  );
}
