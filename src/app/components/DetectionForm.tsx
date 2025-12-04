// app/components/DetectionForm.tsx
"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import DetectionResult from "./DetectionResult";
import { useSearchParams } from "next/navigation";

type DetectType = "text" | "file";

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


type DetectionError = { error: string };
type DetectionResponse = DetectionSuccess | DetectionError;

export default function DetectionForm() {
  const t = useTranslations("detect.form");
  const [kind, setKind] = useState<DetectType>("text");
  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DetectionResponse | null>(null);
  const [lang, setLang] = useState("en");
  
  const cardRef = useRef<HTMLFormElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);

  const supportedLanguages = [
    { code: "en", name: t("languages.en") },
    { code: "hi", name: t("languages.hi") },
    { code: "bn", name: t("languages.bn") },
    { code: "mr", name: t("languages.mr") },
    { code: "te", name: t("languages.te") },
    { code: "ta", name: t("languages.ta") },
    { code: "gu", name: t("languages.gu") },
    { code: "ur", name: t("languages.ur") },
    { code: "kn", name: t("languages.kn") },
    { code: "or", name: t("languages.or") },
    { code: "ml", name: t("languages.ml") },
    { code: "pa", name: t("languages.pa") },
  ];


  const searchParams = useSearchParams();

useEffect(() => {
  const titleParam = searchParams.get("title");
  const sourceParam = searchParams.get("sourceUrl");
  const descParam = searchParams.get("description");

  if (titleParam) setTitle(decodeURIComponent(titleParam));
  if (sourceParam) setSourceUrl(decodeURIComponent(sourceParam));
  if (descParam) setText(decodeURIComponent(descParam));
}, [searchParams]);


  useGSAP(() => {
    if (!cardRef.current || !headlineRef.current || !subRef.current) return;

    const tl = gsap.timeline({ defaults: { duration: 0.5, ease: "power2.out" } });
    tl.from(cardRef.current, { y: 20, opacity: 0 });
    tl.from(headlineRef.current, { y: -20, opacity: 0 }, "<0.2");
    tl.from(subRef.current, { y: -10, opacity: 0 }, "<0.1");
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);

    try {
      const fd = new FormData();
      fd.append("type", kind);
      fd.append("lang", lang);
      if (title.trim()) fd.append("title", title.trim());
      if (sourceUrl.trim()) fd.append("sourceUrl", sourceUrl.trim());

      if (kind === "text") {
        const v = text.trim();
        if (!v) throw new Error(t("errors.textRequired"));
        fd.append("text", v);
      } else {
        if (!file) throw new Error(t("errors.fileRequired"));
        if (file.size > 25 * 1024 * 1024) throw new Error(t("errors.fileTooLarge"));
        fd.append("file", file);
      }

      const res = await fetch("/api/detect", {
        method: "POST",
        body: fd,
      });
      console.log(res)

      const json: DetectionResponse = await res.json();

      if (!res.ok || "error" in json) {
        throw new Error("error" in json ? json.error : t("errors.detectionFailed"));
      }
      console.log(json);
      setResult(json);
      if ("serviceWorker" in navigator) {
  const reg = await navigator.serviceWorker.ready;
  reg.showNotification("Detection Completed", {
    body: `Your detection is done. See the result `,
    icon: "/icons-192x192.png",
    badge: "/icons-192x192.png",
    data:{url:"/detect"}
  });
}

    } catch (err) {
      const msg = err instanceof Error ? err.message : t("errors.unexpectedError");
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.currentTarget.files?.[0] ?? null;
    setFile(selectedFile);
  }

  return (
    <div>
      <form
        ref={cardRef}
        onSubmit={onSubmit}
        className="group rounded-2xl border p-7 backdrop-blur border-white/10 bg-[#0e1424]/80 shadow-[0_10px_40px_rgba(0,0,0,0.45)] focus-within:border-sky-400/40 hover:border-sky-300/20 transition-colors"
      >
        <header className="flex items-start justify-between mb-6">
          <div>
            <h2 ref={headlineRef} className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {t("title")}
            </h2>
            <p ref={subRef} className="mt-1 text-sm text-slate-400">
              {t("subtitle")}
            </p>
          </div>
          <div
            aria-hidden
            className="ml-3 h-8 w-24 rounded-full bg-gradient-to-r from-white/10 via-white/25 to-transparent blur-md opacity-70 group-hover:opacity-90 transition"
          />
        </header>

        <div className="flex flex-wrap items-center gap-4 mb-5">
          <div className="inline-flex rounded-xl border border-white/10 bg-[#0f1524] p-1">
            {(["text", "file"] as DetectType[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                aria-pressed={kind === k}
                className={`px-4 py-2 text-sm rounded-lg transition ${
                  kind === k
                    ? k === "text"
                      ? "bg-sky-500/20 text-sky-200 border border-sky-400/30 shadow-inner"
                      : "bg-amber-500/20 text-amber-200 border border-amber-400/30 shadow-inner"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                {t(`inputTypes.${k}`)}
              </button>
            ))}
          </div>

          <label className="grid gap-2">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              disabled={busy}
              className="rounded-lg border border-white/10 bg-[#0f1524] px-4 py-3 text-sm text-slate-100 outline-none ring-0 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30 disabled:opacity-50"
            >
              {supportedLanguages.map(l => (
                <option key={l.code} value={l.code}>{l.name}</option>
              ))}
            </select>
          </label>
        </div>

        {/* Title + Source */}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-xs text-slate-400">{t("fields.title")}</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={busy}
              placeholder={t("fields.titlePlaceholder")}
              className="rounded-lg border border-white/10 bg-[#0f1524] px-3 py-2 text-slate-100 outline-none ring-0 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30 disabled:opacity-50"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-slate-400">{t("fields.sourceUrl")}</span>
            <input
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              disabled={busy}
              placeholder={t("fields.sourceUrlPlaceholder")}
              className="rounded-lg border border-white/10 bg-[#0f1524] px-3 py-2 text-slate-100 outline-none ring-0 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30 disabled:opacity-50"
            />
          </label>
        </div>

        {/* Input */}
        {kind === "text" ? (
          <label className="mt-5 grid gap-1">
            <span className="text-xs text-slate-400">{t("fields.textContent")}</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={busy}
              className="min-h-40 rounded-lg border border-white/10 bg-[#0f1524] px-3 py-3 text-slate-100 outline-none ring-0 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30 disabled:opacity-50"
              placeholder={t("fields.textPlaceholder")}
              required
            />
            <span className="text-[11px] text-slate-500">
              {t("fields.chars", { count: text.length })}
            </span>
          </label>
        ) : (
          <label className="mt-5 grid gap-2">
            <span className="text-xs text-slate-400">{t("fields.uploadFile")}</span>
            <div className="relative rounded-xl border border-dashed border-white/15 bg-[#0f1524] p-5 text-slate-300 hover:border-sky-400/40 transition">
              <input
                type="file"
                accept=".pdf,image/*,video/*,audio/*"
                onChange={onFileChange}
                disabled={busy}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                aria-label="Choose a file to upload"
                required
              />
              <div className="pointer-events-none flex flex-col items-center justify-center gap-2">
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-sky-400/30 to-amber-400/30 blur-sm" />
                <p className="text-sm">
                  {t.rich("fields.dragDrop", {
                    browse: (chunks) => <span className="text-sky-300">{chunks} </span>
                  })}
                </p>
                <p className="text-xs text-slate-500">{t("fields.fileTypes")}</p>
                {file && (
                  <p className="mt-2 text-xs text-slate-400">
                    {t("fields.selected", { 
                      filename: file.name, 
                      size: (file.size / 1024).toFixed(1) 
                    })}
                  </p>
                )}
              </div>
            </div>
          </label>
        )}

        {/* Error */}
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        {/* Submit */}
        <div className="mt-6">
          <button
            type="submit"
            disabled={busy}
            className="relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl px-5 py-3 font-semibold text-[#0b0f1a] bg-gradient-to-r from-sky-400 via-sky-500 to-amber-400 shadow-[0_6px_30px_rgba(56,189,248,0.25)] transition hover:brightness-110 disabled:opacity-60"
          >
            <span className="relative z-10">
              {busy ? t("buttons.submitting") : t("buttons.detect")}
            </span>
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition group-hover:translate-x-full" />
          </button>
        </div>
      </form>

      {/* Result Display */}
      {result && !("error" in result) && (
        <DetectionResult result={result} userLang={lang}/>
      )}
    </div>
  );
}
