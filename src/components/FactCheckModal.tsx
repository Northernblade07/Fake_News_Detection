"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import {FocusTrap} from "focus-trap-react";
import {
  CheckCircle,
  XCircle,
  HelpCircle,
  Link as LinkIcon,
} from "lucide-react";
import { useGSAP } from "@gsap/react";

type Source = {
  title?: string;
  url?: string;
  snippet?: string;
};

type MediaItem = {
  url: string;
  resourceType: "image" | "video" | "raw" | string;
  format?: string;
  width?: number;
  height?: number;
  duration?: number;
};

export type RagResult = {
  label: "real" | "fake" | "unsure" | string;
  confidence: number;
  explanation?: string;
  evidenceSummary?: string;
  sources?: Source[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  rag: RagResult | null;
  media?: MediaItem[];
  originalText?: string;
  normalizedText?: string;
};

export default function FactCheckModal({
  open,
  onClose,
  rag,
  media = [],
  originalText = "",
  normalizedText = "",
}: Props) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const sourcesRef = useRef<HTMLDivElement>(null);

  const [showOriginal, setShowOriginal] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  const [loading, setLoading] = useState(true); // 🔥 NEW: skeleton loading

  console.log(rag , "rag " , media, originalText , normalizedText)
  // PANEL ANIMATION + OPEN LOGIC
  useGSAP(() => {
    if (!open) return;

    const bk = backdropRef.current;
    const panel = panelRef.current;

    setLoading(true);

    gsap.fromTo(
      bk,
      { opacity: 0 },
      { opacity: 1, duration: 0.25, ease: "power2.out" }
    );

    gsap.fromTo(
      panel,
      { y: 40, opacity: 0, scale: 0.97 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.35,
        ease: "power2.out",
        onComplete: () => {
          // Swap skeleton → real content after animation
          setTimeout(() => setLoading(false), 200);
        },
      }
    );

    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", keyHandler);
    return () => window.removeEventListener("keydown", keyHandler);
  }, [open, onClose]);

  // SOURCE LIST STAGGER ANIMATION
  useGSAP(() => {
    if (loading || !sourcesRef.current) return;

    const items = gsap.utils.toArray<HTMLElement>(
      sourcesRef.current.querySelectorAll(".source-item")
    );

    gsap.from(items, {
      opacity: 1,
      y: 10,
      duration: 0.35,
      stagger: 0.07,
      ease: "power2.out",
    });
  }, [loading]);

  // RESET WHEN OPENING
  useEffect(() => {
    if (!open) return;
    setShowOriginal(false);
    setActiveMediaIndex(0);
  }, [open]);

  if (!open) return null;

  const pct = rag ? Math.round(rag.confidence * 1000) / 10 : 0;

  const getIcon = () => {
    switch (rag?.label) {
      case "fake":
        return <XCircle className="h-9 w-9 text-red-400" />;
      case "real":
        return <CheckCircle className="h-9 w-9 text-green-400" />;
      default:
        return <HelpCircle className="h-9 w-9 text-yellow-400" />;
    }
  };

  const getColor = () => {
    switch (rag?.label) {
      case "fake":
        return "text-red-300";
      case "real":
        return "text-green-300";
      default:
        return "text-yellow-300";
    }
  };

  // Skeleton block
  const Skeleton = ({ h = "h-4", w = "w-full"  , className=""}) => (
    <div
      className={`animate-pulse rounded-md bg-white/10 ${h} ${w} ${className}`}
    />
  );

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[999] p-4"
    >
      <FocusTrap active={open}>
       <div
  ref={panelRef}
  className="relative w-full max-w-5xl rounded-2xl border border-white/10 
             bg-[#0e1424]/90 shadow-2xl backdrop-blur-xl
             max-h-[90vh] overflow-hidden flex flex-col p-4"
  role="dialog"
  aria-modal="true"
>

          {/* CLOSE BTN */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
          >
            ✕
          </button>
<div className="flex-1 overflow-auto pr-1">

          <div className="flex flex-col md:flex-row gap-6">
            {/* LEFT */}
            <div className="flex-1">
              {/* TITLE + CONFIDENCE */}
              <div className="flex items-center gap-3 mb-4">
                {loading ? (
                  <Skeleton h="h-9" w="w-9" />
                ) : (
                  getIcon()
                )}

                <div>
                  {loading ? (
                    <>
                      <Skeleton h="h-4" w="w-32" />
                      <Skeleton h="h-3" w="w-20" className="mt-2" />
                    </>
                  ) : (
                    <>
                      <h3 className={`text-xl font-bold ${getColor()}`}>
                        {rag?.label.toUpperCase()}
                      </h3>
                      <p className="text-m text-slate-400">
                        Confidence:{" "}
                        <span className="text-slate-100 font-semibold">
                          {pct}%
                        </span>
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* EXPLANATION */}
              <div className="mt-4">
                <h4 className="text-slate-300 text-m font-semibold">
                  Explanation
                </h4>

                {loading ? (
                  <div className="mt-3 space-y-2">
                    <Skeleton />
                    <Skeleton />
                    <Skeleton w="w-3/5" />
                  </div>
                ) : (
                  <p className="mt-2 text-slate-200 text-m whitespace-pre-line">
                    {rag?.explanation || "No explanation available."}
                  </p>
                )}
              </div>

              {/* SUMMARY */}
              <div className="mt-6">
                <h4 className="text-slate-300 text-m font-semibold mb-2">
                  Evidence Summary
                </h4>

                {loading ? (
                  <div className="mt-3 space-y-2">
                    <Skeleton />
                    <Skeleton />
                    <Skeleton w="w-2/3" />
                  </div>
                ) : (
                  <p className="mt-2 text-slate-200 text-m whitespace-pre-line">
                    {rag?.evidenceSummary || "No summary available."}
                  </p>
                )}
              </div>

              {/* TEXT TOGGLE */}
              {!loading && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-slate-300 text-m font-semibold">
                      Analyzed Text
                    </h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowOriginal(false)}
                        className={`px-3 py-1 rounded-lg text-xs ${
                          !showOriginal
                            ? "bg-sky-500/20 text-sky-200"
                            : "text-slate-400"
                        }`}
                      >
                        Normalized
                      </button>
                      <button
                        onClick={() => setShowOriginal(true)}
                        className={`px-3 py-1 rounded-lg text-xs ${
                          showOriginal
                            ? "bg-sky-500/20 text-sky-200"
                            : "text-slate-400"
                        }`}
                      >
                        Original
                      </button>
                    </div>
                  </div>

                  <div className="rounded-lg bg-[#0a1220]/60 border border-white/10 p-3 max-h-60 overflow-auto text-m">
                    {showOriginal ? originalText : normalizedText}
                  </div>
                </div>
              )}

             
            </div>

            {/* RIGHT SIDE MEDIA PANEL */}
            <aside className="w-full md:w-80 flex-shrink-0">
              <div className="rounded-xl border border-white/10 bg-[#111827]/50 p-4">
                <h4 className="text-slate-300 text-m font-semibold mb-2">
                  Media
                </h4>

                {loading ? (
                  <Skeleton h="h-48" />
                ) : !media.length ? (
                  <p className="text-slate-500 text-m">No media uploaded.</p>
                ) : (
                  <>
                    <div className="relative h-48 rounded-lg overflow-hidden bg-black/20">
                      {/* IMAGE */}
                      {media[activeMediaIndex].resourceType === "image" && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={media[activeMediaIndex].url}
                          className="w-full h-full object-contain"
                          alt=""
                        />
                      )}

                      {/* VIDEO */}
                      {media[activeMediaIndex].resourceType === "video" && (
                        <video
                          src={media[activeMediaIndex].url}
                          controls
                          className="w-full h-full object-contain"
                        />
                      )}

                      {/* RAW */}
                      {media[activeMediaIndex].resourceType === "raw" && (
                        <a
                          href={media[activeMediaIndex].url}
                          target="_blank"
                          className="text-slate-300 underline"
                        >
                          Download File
                        </a>
                      )}
                    </div>

                    {/* THUMBS */}
                    <div className="flex gap-2 mt-3 overflow-auto">
                      {media.map((m, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveMediaIndex(i)}
                          className={`border rounded-lg overflow-hidden ${
                            i === activeMediaIndex
                              ? "border-sky-400"
                              : "border-white/10"
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={m.url}
                            alt=""
                            className="h-12 w-20 object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </>
                )}

                <button
                  onClick={onClose}
                  className="mt-4 w-full rounded-lg py-2 bg-gradient-to-r from-sky-400 via-sky-500 to-amber-400 text-[#0b0f1a] font-semibold"
                >
                  Close
                </button>
              </div>

               {/* SOURCES w/ STAGGER */}
              <div className="mt-6 max-h-8xl">
                <h4 className="text-slate-300 text-m font-semibold">
                  Sources
                </h4>

                <div
                  ref={sourcesRef}
                  className="mt-3 flex flex-col gap-3 max-h-78 overflow-auto"
                >
                  {loading ? (
                    <>
                      <Skeleton h="h-14" />
                      <Skeleton h="h-14" />
                      <Skeleton h="h-14" />
                    </>
                  ) : rag?.sources?.length ? (
                    rag.sources.map((s, i) => (
                      <a
                        key={i}
                        href={s.url}
                        target="_blank"
                        className="source-item rounded-xl bg-[#151d2e]/80 border border-white/10 p-4 
                        hover:border-sky-400/40 transition block"
                      >
                        <h5 className="text-sky-300 font-semibold flex items-center gap-2">
                          <LinkIcon className="h-4 w-4" />
                          {s.title || "Source"}
                        </h5>
                        <p className="text-m text-slate-300 mt-1">
                          {s.snippet}
                        </p>
                      </a>
                    ))
                  ) : (
                    <p className="text-slate-500 text-m">
                      No sources available.
                    </p>
                  )}
                </div>
              </div>
            </aside>
          </div>
          </div>
        </div>
      </FocusTrap>
    </div>
  );
}
