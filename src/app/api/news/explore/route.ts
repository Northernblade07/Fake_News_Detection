// app/api/news/explore/route.ts
export const runtime = "nodejs";
export const revalidate = 0;
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

// NewsAPI Article type
interface NewsAPIArticle {
  source?: { id?: string; name?: string };
  author?: string;
  title?: string;
  description?: string;
  url?: string;
  urlToImage?: string;
  publishedAt?: string;
  content?: string;
}

// GNews Article type
interface GNewsArticle {
  id?: string;
  source?: { name?: string };
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  publishedAt?: string;
  content?: string;
}

// Safe date parser
const parseDate = (d?: string | null) => {
  const t = new Date(d || "");
  return isNaN(t.getTime()) ? 0 : t.getTime();
};

// Map NewsAPI item to NewsItem
function mapNewsAPIItem(a: NewsAPIArticle): NewsItem {
  return {
    id: a.url ?? crypto.randomUUID(),
    title: a.title ?? "Untitled",
    url: a.url ?? "#",
    source: a.source?.name ?? a.author ?? null,
    publishedAt: a.publishedAt ?? null,
    urlToImage: a.urlToImage ?? null,
    description: a.description ?? null
  };
}

// Map GNews item to NewsItem
function mapGNewsItem(a: GNewsArticle): NewsItem {
  return {
    id: a.url ?? a.id ?? crypto.randomUUID(),
    title: a.title ?? "Untitled",
    url: a.url ?? "#",
    source: a.source?.name ?? null,
    publishedAt: a.publishedAt ?? null,
    urlToImage: a.image ?? null,
    description: a.description ?? null
  };
}

// Deduplicate articles by URL
function dedupe(items: NewsItem[]): NewsItem[] {
  const seen = new Map<string, NewsItem>();
  for (const it of items) {
    const key = (it.url || "").toLowerCase();
    if (!seen.has(key)) seen.set(key, it);
  }
  return Array.from(seen.values());
}

// Map frontend category to GNews category
function mapCategoryToGNews(category: string): string {
  const mapping: Record<string, string> = {
    all: "general",
    business: "business",
    technology: "technology",
    entertainment: "entertainment",
    sports: "sports",
    science: "science",
    health: "health",
    politics: "nation"
  };
  return mapping[category] || "general";
}

// Helper to fetch NewsAPI
async function fetchNewsAPI(
  Nkey: string,
  q: string,
  category: string,
  sortBy: string,
  page: number,
  pageSize: number,
  lang: string,
  country: string
): Promise<NewsItem[]> {
  try {
    const Nkey = process.env.NEWS_API_KEY!;
    const base = "https://newsapi.org/v2";
    const url = q
      ? `${base}/everything?language=${lang}&q=${encodeURIComponent(q)}&sortBy=${encodeURIComponent(sortBy)}&page=${page}&pageSize=${pageSize}&apiKey=${Nkey}`
      : `${base}/top-headlines?country=${country}${category !== "all" ? `&category=${encodeURIComponent(category)}` : ""}&page=${page}&pageSize=${pageSize}&apiKey=${Nkey}`;

    const res = await fetch(url, { next: { revalidate: 60 * 60 * 2 } });
    const json = await res.json();
    if (!res.ok || !Array.isArray(json.articles)) return [];
    return json.articles.map(mapNewsAPIItem);
  } catch (err) {
    console.log(err)
    return [];
  }
}

// Helper to fetch GNews
async function fetchGNews(
  Gkey: string,
  q: string,
  category: string,
  sortBy: string,
  page: number,
  pageSize: number,
  lang: string,
  country: string
): Promise<NewsItem[]> {
  try {
    const Gkey = process.env.GNEWS_API_KEY!;
    const base = "https://gnews.io/api/v4";
    const gCategory = mapCategoryToGNews(category);
    const url = q
      ? `${base}/search?q=${encodeURIComponent(q)}&lang=${lang}&country=${country}&max=${pageSize}&page=${page}&sortby=${sortBy === "publishedAt" ? "publishedAt" : "relevance"}&apikey=${Gkey}`
      : `${base}/top-headlines?category=${gCategory}&lang=${lang}&country=${country}&max=${pageSize}&page=${page}&apikey=${Gkey}`;

    const res = await fetch(url, { next: { revalidate: 60 * 60 * 2 } });
    const json = await res.json();
    if (!res.ok || !Array.isArray(json.articles)) return [];
    return json.articles.map(mapGNewsItem);
  } catch (err) {
    console.log(err);
    return [];
  }
}

// Main route
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

    const NEWSAPI_KEY = process.env.NEWS_API_KEY;
    const GNEWS_KEY = process.env.GNEWS_API_KEY;

    if (!NEWSAPI_KEY && !GNEWS_KEY) {
      return NextResponse.json({ error: "No API keys configured" }, { status: 500 });
    }

    // Fetch concurrently
    const [newsAPIArticles, gNewsArticles] = await Promise.all([
      NEWSAPI_KEY ? fetchNewsAPI(NEWSAPI_KEY, q, category, sortBy, page, pageSize, lang, country) : Promise.resolve([]),
      GNEWS_KEY ? fetchGNews(GNEWS_KEY, q, category, sortBy, page, pageSize, lang, country) : Promise.resolve([])
    ]);

    // Merge and dedupe
    const allArticles = dedupe([...newsAPIArticles, ...gNewsArticles]);

    // Sort
    const sortedArticles = [...allArticles];
    if (sortBy === "publishedAt") {
      sortedArticles.sort((a, b) => parseDate(b.publishedAt) - parseDate(a.publishedAt));
    } else if (sortBy === "popularity") {
      sortedArticles.sort((a, b) => {
        const aw = (a.urlToImage ? 1 : 0) + (a.source ? 1 : 0);
        const bw = (b.urlToImage ? 1 : 0) + (b.source ? 1 : 0);
        if (bw !== aw) return bw - aw;
        return parseDate(b.publishedAt) - parseDate(a.publishedAt);
      });
    }

    // Server-side pagination
    const start = (page - 1) * pageSize;
    const paginated = sortedArticles.slice(start, start + pageSize);

    // Trending (dynamic per country)
    let trending: NewsItem[] = [];
    if (NEWSAPI_KEY) {
      trending = await fetchNewsAPI(NEWSAPI_KEY, "", "all", "publishedAt", 1, 8, lang, country);
    }

    return NextResponse.json({
      articles: paginated,
      trending,
      page,
      pageSize,
      total: sortedArticles.length,
      debug: {
        newsAPICount: newsAPIArticles.length,
        gNewsCount: gNewsArticles.length,
        totalBeforePagination: allArticles.length
      }
    });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}
