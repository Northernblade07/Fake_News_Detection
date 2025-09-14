// app/explore/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, Bookmark, Gauge, Loader2 } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import ExternalImage from "@/app/components/ExternalImage";

gsap.registerPlugin(useGSAP);

type Article = {
  id: string;
  title: string;
  url: string;
  source?: string | null;
  publishedAt?: string | null;
  urlToImage?: string | null;
  description?: string | null;
};

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "business", label: "Business" },
  { key: "technology", label: "Technology" },
  { key: "entertainment", label: "Entertainment" },
  { key: "sports", label: "Sports" },
  { key: "science", label: "Science" },
  { key: "health", label: "Health" },
  { key: "politics", label: "Politics" },
] as const;

const SORTS = [
  { key: "publishedAt", label: "Newest" },
  { key: "relevancy", label: "Relevancy" },
  { key: "popularity", label: "Popularity" },
] as const;

const PAGE_SIZE = 12;

export default function ExplorePage() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["key"]>("all");
  const [sortBy, setSortBy] = useState<(typeof SORTS)[number]["key"]>("publishedAt");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [items, setItems] = useState<Article[]>([]);
  const [trending, setTrending] = useState<Article[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const listScope = useRef<HTMLDivElement>(null);
  const trendScope = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  const queryKey = useMemo(() => JSON.stringify({ q: debouncedQ.trim(), category, sortBy }), [debouncedQ, category, sortBy]);

  // GSAP animation for news list
  useGSAP(
    () => {
      if (!listScope.current) return;
      gsap.fromTo(
        listScope.current.querySelectorAll(".news-item"),
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", stagger: 0.05 }
      );
    },
    { scope: listScope, dependencies: [items.length], revertOnUpdate: true }
  );

  // GSAP animation for trending
  useGSAP(
    () => {
      if (!trendScope.current) return;
      gsap.fromTo(
        trendScope.current.querySelectorAll(".trend-item"),
        { x: 12, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.45, ease: "power2.out", stagger: 0.05 }
      );
    },
    { scope: trendScope, dependencies: [trending.length], revertOnUpdate: true }
  );

  // Loader function
  const load = useCallback(
    async (mode: "replace" | "append") => {
      const targetPage = mode === "replace" ? 1 : page + 1;
      const isFirst = mode === "replace";

      try {
        isFirst ? setLoading(true) : setLoadingMore(true);
        setErr(null);

        const params = new URLSearchParams();
        if (debouncedQ.trim()) params.set("q", debouncedQ.trim());
        if (category !== "all") params.set("category", category);
        if (sortBy) params.set("sortBy", sortBy);
        params.set("page", String(targetPage));
        params.set("pageSize", String(PAGE_SIZE));

        const res = await fetch(`/api/news/explore?${params.toString()}`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load news");

        const incoming: Article[] = json.articles ?? [];
        setTrending(json.trending ?? []);

        if (isFirst) {
          setItems(incoming);
          setPage(1);
        } else {
          setItems((prev) => {
            const combined = [...prev, ...incoming];
            const seen = new Set<string>();
            return combined.filter((a) => (a.id && !seen.has(a.id) && seen.add(a.id)));
          });
          setPage(targetPage);
        }

        setHasMore(incoming.length >= PAGE_SIZE);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to load news");
      } finally {
        isFirst ? setLoading(false) : setLoadingMore(false);
      }
    },
    [debouncedQ, category, sortBy, page]
  );

  useEffect(() => {
    setHasMore(true);
    load("replace");
  }, [load, queryKey]);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !loading && !loadingMore && hasMore && !err) {
          load("append");
        }
      },
      { root: null, rootMargin: "600px 0px 600px 0px", threshold: 0.01 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [load, loading, loadingMore, hasMore, err]);

  const sidebarCard =
    "rounded-2xl border border-white/10 bg-[#0e1424]/80 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur";
  const chip =
    "inline-flex items-center rounded-md border border-white/10 bg-[#0f1524] px-3 py-1.5 text-xs text-slate-200 hover:border-sky-400/30 hover:bg-[#111a2f] transition";

  return (
    <div className="mx-auto grid max-w-[1280px] grid-cols-12 gap-5 px-5 py-7">
      {/* Left Sidebar */}
      <aside className="col-span-12 lg:col-span-3 space-y-5">
        <section className={sidebarCard}>
          <h2 className="text-sm font-semibold tracking-wide text-slate-200">Categories</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={`${chip} ${category === c.key ? "ring-2 ring-sky-400/30" : ""}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </section>

        <section className={sidebarCard + " flex items-center justify-between"}>
          <div className="text-sm text-slate-300">Go to dashboard</div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-400 via-sky-500 to-amber-400 px-3 py-1.5 text-sm font-semibold text-[#0b0f1a] hover:brightness-110 transition"
          >
            <Gauge className="h-4 w-4" /> Open
          </Link>
        </section>

        <section className={sidebarCard + " hidden lg:block"}>
          <div className="text-sm font-semibold text-slate-200">Bookmarks</div>
          <p className="mt-1 text-xs text-slate-400">Sign in to view saved items.</p>
          <div className="mt-3 inline-flex items-center gap-2 text-slate-300 text-sm">
            <Bookmark className="h-4 w-4 text-sky-300" /> Coming soon
          </div>
        </section>
      </aside>

      {/* Middle Feed */}
      <main className="col-span-12 lg:col-span-6">
        {/* Controls */}
        <div className="rounded-2xl border border-white/10 bg-[#0e1424]/80 p-4 backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search news..."
                className="w-full rounded-lg border border-white/10 bg-[#0f1524] px-9 py-2.5 text-slate-100 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30"
              />
              <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
            <div className="flex items-center gap-2 mt-2 md:mt-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="rounded-lg border border-white/10 bg-[#0f1524] px-3 py-2.5 text-slate-100"
              >
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => load("replace")}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#0f1524] px-3 py-2.5 text-sm text-slate-100 hover:border-sky-400/30 hover:bg-[#111a2f] transition"
                title="Apply filters"
              >
                <SlidersHorizontal className="h-4 w-4 text-sky-300" /> Apply
              </button>
            </div>
          </div>
        </div>

        {/* News List */}
        <div ref={listScope} className="mt-5 space-y-4">
          {/* Loading, Error, No Results remain unchanged */}
          {loading && (
            <div className="grid gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-[#0f1524] p-4 animate-pulse">
                  <div className="flex gap-4">
                    <div className="h-28 w-44 rounded-lg bg-white/5" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 w-2/3 rounded bg-white/5" />
                      <div className="h-3 w-1/3 rounded bg-white/5" />
                      <div className="h-3 w-1/2 rounded bg-white/5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && err && (
            <div className="rounded-2xl border border-white/10 bg-[#0f1524] p-4 text-sm text-rose-300">{err}</div>
          )}
          {!loading && items.length === 0 && !err && (
            <div className="rounded-2xl border border-white/10 bg-[#0f1524] p-4 text-sm text-slate-400 text-center">
              No news found
            </div>
          )}

          {/* Articles */}
          {!loading &&
            items.map((a) => (
              <article
                key={a.id}
                className="news-item rounded-2xl border border-white/10 bg-[#0f1524] p-4 hover:shadow-lg transition"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative h-28 w-full sm:w-44 overflow-hidden rounded-lg bg-white/5">
                    <ExternalImage src={a.urlToImage} alt={a.title} className="h-full w-full rounded-lg" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold leading-snug">{a.title}</h3>
                    <div className="mt-1 text-xs text-slate-400">
                      {a.source || "Unknown source"}{" "}
                      {a.publishedAt ? `• ${new Date(a.publishedAt).toLocaleString()}` : ""}
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-300">{a.description ?? ""}</p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <a href={a.url} target="_blank" rel="noreferrer" className="text-sky-300 text-sm hover:text-amber-300">
                        Read
                      </a>
                      <Link
                        href={{ pathname: "/dashboard", query: { sourceUrl: a.url, title: a.title } }}
                        className="text-sm text-slate-200 underline-offset-2 hover:underline"
                      >
                        Analyze
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-8 w-full" />
          {loadingMore && (
            <div className="flex items-center justify-center gap-2 py-3 text-xs text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading more...
            </div>
          )}
          {!hasMore && !loading && items.length > 0 && (
            <div className="py-3 text-center text-xs text-slate-500">No more results</div>
          )}
        </div>
      </main>

      {/* Right Sidebar */}
      <aside className="col-span-12 lg:col-span-3 space-y-5">
        <section className={sidebarCard}>
          <h2 className="text-sm font-semibold tracking-wide text-slate-200">Trending today</h2>
          <div ref={trendScope} className="mt-3 grid gap-2">
            {trending.map((t) => (
              <a
                key={t.id}
                href={t.url}
                target="_blank"
                rel="noreferrer"
                className="trend-item rounded-xl border border-white/10 bg-[#0f1524] p-3 hover:border-sky-400/30 hover:bg-[#111a2f] transition"
              >
                <div className="line-clamp-2 text-sm">{t.title}</div>
                <div className="mt-1 text-[11px] text-slate-500">{t.source || "Unknown"}</div>
              </a>
            ))}
            {trending.length === 0 && (
              <div className="rounded-xl border border-white/10 bg-[#0f1524] p-3 text-xs text-slate-400 text-center">
                No trending items
              </div>
            )}
          </div>
        </section>
      </aside>
    </div>
  );
}
