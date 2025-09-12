// app/components/DetectionForm.tsx
"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";

type DetectType = "text" | "file";

type DetectionSuccess = {
  news: { _id: string };
  log: { _id: string };
};

type DetectionError = { error: string };

type DetectionResponse = DetectionSuccess | DetectionError;

export default function DetectionForm() {
  const [kind, setKind] = useState<DetectType>("text");
  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DetectionResponse | null>(null);

  const cardRef = useRef<HTMLFormElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!cardRef.current || !headlineRef.current || !subRef.current) return;

    const tl = gsap.timeline({ defaults: { duration: 0.5, ease: "power2.out" } });

    // Animate card fade-in
    tl.from(cardRef.current, { y: 20, opacity: 0 });

    // Animate headline + subheading staggered
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

      if (title.trim()) fd.append("title", title.trim());
      if (sourceUrl.trim()) fd.append("sourceUrl", sourceUrl.trim());

      if (kind === "text") {
        const v = text.trim();
        if (!v) throw new Error("Text is required");
        fd.append("text", v);
      } else {
        if (!file) throw new Error("File is required");
        fd.append("file", file);
      }

      const res = await fetch("/api/detect", {
        method: "POST",
        body: fd,
      });

      const json: DetectionResponse = await res.json();

      if (!res.ok || "error" in json) {
        throw new Error("Detection failed");
      }

      setResult(json);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Unexpected error occurred";
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
   <form
      ref={cardRef}
      onSubmit={onSubmit}
      className="group rounded-2xl border p-7 backdrop-blur border-white/10 bg-[#0e1424]/80 shadow-[0_10px_40px_rgba(0,0,0,0.45)] focus-within:border-sky-400/40 hover:border-sky-300/20 transition-colors"
    >
      <header className="flex items-start justify-between mb-6">
        <div>
          <h2 ref={headlineRef} className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Detect News
          </h2>
          <p ref={subRef} className="mt-1 text-sm text-slate-400">
            Paste text or upload a file to analyze content
          </p>
        </div>
        <div
          aria-hidden
          className="ml-3 h-8 w-24 rounded-full bg-gradient-to-r from-white/10 via-white/25 to-transparent blur-md opacity-70 group-hover:opacity-90 transition"
        />
      </header>

      {/* Segmented toggle */}
      <div className="inline-flex rounded-xl border border-white/10 bg-[#0f1524] p-1 mb-5">
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
            {k === "text" ? "Text" : "File"}
          </button>
        ))}
      </div>

      {/* Title + Source */}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1">
          <span className="text-xs text-slate-400">Title (optional)</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={busy}
            placeholder="Short title"
            className="rounded-lg border border-white/10 bg-[#0f1524] px-3 py-2 text-slate-100 outline-none ring-0 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30 disabled:opacity-50"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-xs text-slate-400">Source URL (optional)</span>
          <input
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            disabled={busy}
            placeholder="https://example.com/article"
            className="rounded-lg border border-white/10 bg-[#0f1524] px-3 py-2 text-slate-100 outline-none ring-0 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30 disabled:opacity-50"
          />
        </label>
      </div>

      {/* Input */}
      {kind === "text" ? (
        <label className="mt-5 grid gap-1">
          <span className="text-xs text-slate-400">Text content</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={busy}
            className="min-h-40 rounded-lg border border-white/10 bg-[#0f1524] px-3 py-3 text-slate-100 outline-none ring-0 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30 disabled:opacity-50"
            placeholder="Paste the news text here..."
            required
          />
          <span className="text-[11px] text-slate-500">{text.length} chars</span>
        </label>
      ) : (
        <label className="mt-5 grid gap-2">
          <span className="text-xs text-slate-400">Upload file</span>
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
                Drag & drop or <span className="text-sky-300">browse</span>
              </p>
              <p className="text-xs text-slate-500">PDF, images, video, or audio</p>
              {file && (
                <p className="mt-2 text-xs text-slate-400">
                  Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
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
          <span className="relative z-10">{busy ? "Submitting..." : "Detect"}</span>
          <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition group-hover:translate-x-full" />
        </button>
      </div>

      {/* Result */}
      {result && (
        <pre className="mt-5 whitespace-pre-wrap rounded-lg border border-white/10 bg-[#0f1524] p-4 text-xs text-slate-200">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </form>
  );
}
