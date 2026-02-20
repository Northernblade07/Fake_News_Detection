"use client";

import { useEffect, useState } from "react";

type RelatedArticle = {
  title: string;
  url: string;
  snippet: string;
  source: string | null;
  publishedAt: string | null;
};

type Props = {
  title?: string;
  summary?: string;
  lang?: string;
  region?: string;
  onClose: () => void;
};

export default function RelatedNewsModal({ title, summary, lang, region, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<RelatedArticle[]>([]);
  const [source, setSource] = useState<string>("");

  // 🔥 Trim summary to safe length for Google API
  const safeSummary =
    summary?.slice(0, 200).trim() || ""; // 200 chars is optimal

  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch("/api/related", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title?.slice(0, 120) || "",     // also trim title
            summary: safeSummary,                  // trimmed summary
            lang,
            region
          })
        });
        console.log(res);

        const data = await res.json();
        console.log(data)
        setArticles(data.items || []);
        setSource(data.source || "unknown");
      } catch (e) {
        console.error("Error fetching related:", e);
      }
      setLoading(false);
    }

    fetchNews();
  }, [title, safeSummary, lang, region]); // 🔥 correct dependencies

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[999]">
      <div className="bg-[#0e1424] border border-white/10 rounded-2xl p-6 w-full max-w-xl shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-white"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold mb-3">Related News</h2>
        <p className="text-xs text-slate-500 mb-4">Source: {source}</p>

        {loading ? (
          <p className="text-slate-300 text-center">Loading...</p>
        ) : articles.length === 0 ? (
          <p className="text-slate-400 text-center">No related news found.</p>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {articles.map((a, i) => (
              <a
                key={i}
                href={a.url}
                target="_blank"
                className="block rounded-xl border border-white/10 bg-[#161c2c] p-4 hover:border-sky-400/40 transition"
              >
                <h3 className="text-sky-300 font-semibold">{a.title}</h3>
                <p className="text-sm text-slate-300 mt-1">{a.snippet}</p>
                <p className="text-xs text-slate-500 mt-2">{a.source}</p>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
