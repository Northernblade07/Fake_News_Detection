// app/explore/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState, useCallback, useTransition } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, Bookmark, Gauge, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import ExternalImage from "@/app/components/ExternalImage";
import { useTranslations, useLocale, useFormatter } from "next-intl";

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

type ExploreResponse = {
  articles: Article[];
  trending: {
   value: Article[]};
  page: number;
  pageSize: number;
  hasMore: boolean;
};

const CATEGORIES = [
  "all",
  "business",
  "technology",
  "entertainment",
  "sports",
  "science",
  "health",
  "politics",
] as const;
type CategoryKey = (typeof CATEGORIES)[number];

const SORTS = ["publishedAt", "relevancy", "popularity"] as const;
type SortKey = (typeof SORTS)[number];

const PAGE_SIZE = 12;

export default function ExplorePage() {
  const t = useTranslations("explore");
  const tc = useTranslations("common");
  const locale = useLocale();
  const f = useFormatter();

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [category, setCategory] = useState<CategoryKey>("all");
  const [sortBy, setSortBy] = useState<SortKey>("publishedAt");
  const [items, setItems] = useState<Article[]>([]);
  const [trending, setTrending] = useState<Article[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition(); // soft-transition for UX

  const listScope = useRef<HTMLDivElement>(null);
  const trendScope = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Debounce search
  useEffect(() => {
    const tmr = setTimeout(() => setDebouncedQ(q), 400);
    return () => clearTimeout(tmr);
  }, [q]);

  const queryKey = useMemo(
    () => JSON.stringify({ q: debouncedQ.trim(), category, sortBy, locale }),
    [debouncedQ, category, sortBy, locale]
  );

  // GSAP animations
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

  // Single-page loader
  const loadPage = useCallback(
    async (p: number) => {
      try {
        setLoading(true);
        setErr(null);

        // Cancel in-flight request
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        const params = new URLSearchParams();
        if (debouncedQ.trim()) params.set("q", debouncedQ.trim());
        if (category !== "all") params.set("category", category);
        if (sortBy) params.set("sortBy", sortBy);
        params.set("page", String(p));
        params.set("pageSize", String(PAGE_SIZE));
        params.set("lang", locale);

        const res = await fetch(`/api/news/explore?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const json: ExploreResponse = await res.json();
        if (!res.ok) throw new Error("Failed to load news");

        // console.log(json)
        // Soft transition to keep layout stable during swap
        startTransition(() => {
          setItems(json.articles ?? []);
          setTrending(json.trending.value ?? []);
          setHasMore(Boolean(json.hasMore));
          setPage(p);
        });
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setErr(e instanceof Error ? e.message : "Failed to load news");
      } finally {
        setLoading(false);
      }
    },
    [debouncedQ, category, sortBy, locale]
  );

  // Load first page whenever filters/search/locale change
  useEffect(() => {
    loadPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  const sidebarCard =
    "rounded-2xl border border-white/10 bg-[#0e1424]/80 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur";
  const chip =
    "inline-flex items-center rounded-md border border-white/10 bg-[#0f1524] px-3 py-1.5 text-xs text-slate-200 hover:border-sky-400/30 hover:bg-[#111a2f] transition";

  return (
    <div className="mx-auto grid max-w-[1480px] grid-cols-12 gap-5 px-5 py-7">
      {/* Left Sidebar */}
      <aside className="col-span-12 lg:col-span-3 space-y-5">
        <section className={sidebarCard}>
          <h2 className="text-sm font-semibold tracking-wide text-slate-200">
            {t("sidebar.categories")}
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {CATEGORIES.map((key) => (
             
<button
  key={key}
  onClick={() => {
    setCategory(key);
    // fetch page 1 after changing category
    loadPage(1);
  }}
  className={`${chip} ${category === key ? "ring-2 ring-sky-400/30" : ""}`}
>
  {t(`categories.${key}`)}
</button>

            ))}
          </div>
        </section>

        <section className={sidebarCard + " flex items-center justify-between"}>
          <div className="text-sm text-slate-300">{t("sidebar.dashboardCta")}</div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-400 via-sky-500 to-amber-400 px-3 py-1.5 text-sm font-semibold text-[#0b0f1a] hover:brightness-110 transition"
          >
            <Gauge className="h-4 w-4" /> {t("buttons.open")}
          </Link>
        </section>

        <section className={sidebarCard + " hidden lg:block"}>
          <div className="text-sm font-semibold text-slate-200">
            {t("sidebar.bookmarks.title")}
          </div>
          <p className="mt-1 text-xs text-slate-400">{t("sidebar.bookmarks.signIn")}</p>
          <div className="mt-3 inline-flex items-center gap-2 text-slate-300 text-sm">
            <Bookmark className="h-4 w-4 text-sky-300" /> {t("sidebar.bookmarks.soon")}
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
                placeholder={t("controls.searchPlaceholder")}
                className="w-full rounded-lg border border-white/10 bg-[#0f1524] px-9 py-2.5 text-slate-100 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30"
              />
              <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
            <div className="flex items-center gap-2 mt-2 md:mt-0">
              <select
                value={sortBy}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setSortBy(e.target.value as SortKey);
                  loadPage(1);
                }}
                className="rounded-lg border border-white/10 bg-[#0f1524] px-3 py-2.5 text-slate-100"
              >
                {SORTS.map((key) => (
                  <option key={key} value={key}>
                    {t(`sorts.${key}`)}
                  </option>
                ))}
              </select>
              <button
                onClick={() => loadPage(1)}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#0f1524] px-3 py-2.5 text-sm text-slate-100 hover:border-sky-400/30 hover:bg-[#111a2f] transition"
                title={t("controls.apply")}
              >
                <SlidersHorizontal className="h-4 w-4 text-sky-300" /> {t("controls.apply")}
              </button>
            </div>
          </div>
        </div>

        {/* News List */}
        <div ref={listScope} className="mt-5 space-y-4">
          {(loading || isPending) && (
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
            <div className="rounded-2xl border border-white/10 bg-[#0f1524] p-4 text-sm text-rose-300">
              {err}
            </div>
          )}

          {!loading && items.length === 0 && !err && (
            <div className="rounded-2xl border border-white/10 bg-[#0f1524] p-4 text-sm text-slate-400 text-center">
              {t("states.noResults")}
            </div>
          )}

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
                      {a.source || t("article.unknownSource")}{" "}
                      {a.publishedAt
                        ? `• ${f.dateTime(new Date(a.publishedAt), {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}`
                        : ""}
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-300">{a.description ?? ""}</p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <a href={a.url} target="_blank" rel="noreferrer" className="text-sky-300 text-sm hover:text-amber-300">
                        {t("article.read")}
                      </a>
                     <Link
  href={{
    pathname: "/detect",
    query: {
      title: encodeURIComponent(a.title || ""),
      sourceUrl: encodeURIComponent(a.url || ""),
      description: encodeURIComponent(a.description || ""),
    },
  }}
  className="text-sm text-slate-200 underline-offset-2 hover:underline"
>
                        {t("article.analyze")}
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}

          {/* Pagination controls */}
          <div className="mt-4 flex items-center justify-between">
            <button
              disabled={page <= 1 || loading}
              onClick={() => loadPage(page - 1)}
              className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-[#0f1524] px-3 py-2 text-sm text-slate-100 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              {t("controls.prev")}
            </button>
            <span className="text-xs text-slate-400">{t("states.page", { page })}</span>
            <button
              disabled={!hasMore || loading}
              onClick={() => loadPage(page + 1)}
              className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-[#0f1524] px-3 py-2 text-sm text-slate-100 disabled:opacity-50"
            >
              {t("controls.next")}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </main>

      {/* Right Sidebar */}
      <aside className="col-span-12 lg:col-span-3 space-y-5">
        <section className={sidebarCard}>
          <h2 className="text-sm font-semibold tracking-wide text-slate-200">{t("trending.title")}</h2>
          <div ref={trendScope} className="mt-3 grid gap-2">
            {trending.length >0 && trending.map((tItem) => (
              <a
                key={tItem.id}
                href={tItem.url}
                target="_blank"
                rel="noreferrer"
                className="trend-item rounded-xl border border-white/10 bg-[#0f1524] p-3 hover:border-sky-400/30 hover:bg-[#111a2f] transition"
              >
                <div className="line-clamp-2 text-sm">{tItem.title}</div>
                <div className="mt-1 text-[11px] text-slate-500">{tItem.source || tc("unknown")}</div>
              </a>
            ))}
            {trending.length === 0 && (
              <div className="rounded-xl border border-white/10 bg-[#0f1524] p-3 text-xs text-slate-400 text-center">
                {t("trending.none")}
              </div>
            )}
          </div>
        </section>
      </aside>
    </div>
  );
}
