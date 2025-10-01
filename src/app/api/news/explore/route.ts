// app/api/news/explore/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import crypto from "node:crypto";
import { NextResponse } from "next/server";

type NewsItem = {
  id: string;
  title: string;
  url: string;
  source: string | null;
  publishedAt: string | null;
  urlToImage: string | null;
  description: string | null;
};

interface NewsAPIArticle {
  source?: { id?: string; name?: string };
  author?: string;
  title?: string;
  description?: string;
  url?: string;
  urlToImage?: string;
  publishedAt?: string;
}
interface NewsAPIResponse {
  status?: string;
  totalResults?: number;
  articles?: NewsAPIArticle[];
  code?: string;
  message?: string;
}

interface GNewsArticle {
  id?: string;
  source?: { name?: string };
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  publishedAt?: string;
}
interface GNewsResponse {
  totalArticles?: number;
  articles?: GNewsArticle[];
  error?: string;
}

const parseDate = (d?: string | null) => {
  const t = new Date(d || "");
  return isNaN(t.getTime()) ? 0 : t.getTime();
};

function mapNewsAPIItem(a: NewsAPIArticle): NewsItem {
  return {
    id: a.url ?? crypto.randomUUID(),
    title: a.title ?? "Untitled",
    url: a.url ?? "#",
    source: a.source?.name ?? a.author ?? null,
    publishedAt: a.publishedAt ?? null,
    urlToImage: a.urlToImage ?? null,
    description: a.description ?? null,
  };
}
function mapGNewsItem(a: GNewsArticle): NewsItem {
  return {
    id: a.url ?? a.id ?? crypto.randomUUID(),
    title: a.title ?? "Untitled",
    url: a.url ?? "#",
    source: a.source?.name ?? null,
    publishedAt: a.publishedAt ?? null,
    urlToImage: a.image ?? null,
    description: a.description ?? null,
  };
}
function dedupe(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  const out: NewsItem[] = [];
  for (const it of items) {
    const key = (it.url || "").toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(it);
    }
  }
  return out;
}
function mapCategoryToGNews(category: string): string {
  const mapping: Record<string, string> = {
    all: "general",
    business: "business",
    technology: "technology",
    entertainment: "entertainment",
    sports: "sports",
    science: "science",
    health: "health",
    politics: "nation",
  };
  return mapping[category] || "general";
}
function mapSortForNewsAPI(sortBy: string): "publishedAt" | "relevancy" | "popularity" {
  return (["publishedAt", "relevancy", "popularity"].includes(sortBy) ? sortBy : "publishedAt") as
    | "publishedAt"
    | "relevancy"
    | "popularity";
}
function mapSortForGNews(sortBy: string): "publishedAt" | "relevance" {
  return sortBy === "relevancy" ? "relevance" : "publishedAt";
}

async function fetchNewsAPIPage(
  q: string,
  category: string,
  sortBy: string,
  page: number,
  pageSize: number,
  lang: string,
  country: string
): Promise<{ items: NewsItem[]; hasMore: boolean }> {
  const key = process.env.NEWS_API_KEY;
  if (!key) return { items: [], hasMore: false };
  const base = "https://newsapi.org/v2";
  const url = q
    ? `${base}/everything?language=${lang}&q=${encodeURIComponent(q)}&sortBy=${mapSortForNewsAPI(
        sortBy
      )}&page=${page}&pageSize=${pageSize}&apiKey=${key}`
    : `${base}/top-headlines?country=${country}${
        category !== "all" ? `&category=${encodeURIComponent(category)}` : ""
      }&page=${page}&pageSize=${pageSize}&apiKey=${key}`;
  const res = await fetch(url, { next: { tags: ["news:explore"] } });
  const json: NewsAPIResponse = await res.json();
  if (!res.ok || !Array.isArray(json.articles)) return { items: [], hasMore: false };
  const items = json.articles.map(mapNewsAPIItem);
  const hasMore = (json.articles?.length ?? 0) === pageSize; // page/pageSize per docs
  return { items, hasMore };
}

async function fetchGNewsPage(
  q: string,
  category: string,
  page: number,
  pageSize: number,
  lang: string,
  country: string,
  sortBy: "publishedAt" | "relevance"
): Promise<{ items: NewsItem[]; hasMore: boolean }> {
  const key = process.env.GNEWS_API_KEY;
  if (!key) return { items: [], hasMore: false };
  const base = "https://gnews.io/api/v4";
  const gCategory = mapCategoryToGNews(category);
  const common = `lang=${lang}&country=${country}&max=${pageSize}&page=${page}&apikey=${key}`;
  const url = q
    ? `${base}/search?q=${encodeURIComponent(q)}&sortby=${sortBy}&${common}`
    : `${base}/top-headlines?category=${gCategory}&${common}`;
  const res = await fetch(url, { next: { tags: ["news:explore"] } });
  const json: GNewsResponse = await res.json();
  if (!res.ok || !Array.isArray(json.articles)) return { items: [], hasMore: false };
  const items = json.articles.map(mapGNewsItem);
  const hasMore = (json.articles?.length ?? 0) === pageSize; // page/max per docs
  return { items, hasMore };
}

async function fetchTrending(lang: string, country: string): Promise<NewsItem[]> {
  // 1) Try NewsAPI Top Headlines (no q) first
  const na = await fetchNewsAPIPage("", "all", "publishedAt", 1, 8, lang, country);
  if (na.items.length > 0) return na.items;
  // 2) Fallback to GNews Top Headlines if NewsAPI empty or unavailable
  const gn = await fetchGNewsPage("", "all", 1, 8, lang, country, "publishedAt");
  return gn.items;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const category = searchParams.get("category") || "all";
    const sortBy = searchParams.get("sortBy") || "publishedAt";
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") || "12")));
    const lang = searchParams.get("lang") || "en";
    const country = searchParams.get("country") || "in";

    const [{ items: naItems, hasMore: naHasMore }, { items: gnItems, hasMore: gnHasMore }] =
      await Promise.all([
        fetchNewsAPIPage(q, category, sortBy, page, pageSize, lang, country),
        fetchGNewsPage(q, category, page, pageSize, lang, country, mapSortForGNews(sortBy)),
      ]);

    const merged = dedupe([...naItems, ...gnItems]);
    const articles =
      sortBy === "publishedAt"
        ? [...merged].sort((a, b) => parseDate(b.publishedAt) - parseDate(a.publishedAt))
        : merged;

    const trending = await fetchTrending(lang, country);

    const hasMore = naHasMore || gnHasMore;

    return NextResponse.json({
      articles,
      trending,
      page,
      pageSize,
      hasMore,
    });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}
