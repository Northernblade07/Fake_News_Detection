"use client";

type RelatedArticle = {
  title: string;
  url: string;
  snippet: string;
  source: string | null;
  publishedAt: string | null;
};

export default function RelatedNewsList({ articles }: { articles: RelatedArticle[] }) {
  if (!articles.length) {
    return <p className="text-slate-400 text-center py-6">No related news found.</p>;
  }

  return (
    <div className="grid gap-4 max-h-[60vh] overflow-y-auto pr-2">
      {articles.map((a, i) => (
        <a
          key={i}
          href={a.url}
          target="_blank"
          className="block rounded-xl border border-white/10 bg-[#0f1524] p-4
            hover:border-sky-400/40 transition shadow-sm hover:shadow-lg"
        >
          <h3 className="text-lg font-semibold text-slate-200">{a.title}</h3>
          <p className="text-sm text-slate-400 mt-1">{a.snippet}</p>

          <div className="mt-2 text-xs text-slate-500 flex justify-between">
            <span>{a.source ?? "Unknown Source"}</span>
            {a.publishedAt && (
              <span>{new Date(a.publishedAt).toLocaleDateString()}</span>
            )}
          </div>
        </a>
      ))}
    </div>
  );
}
