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

type CursorState = {
  newsapiPage: number;
  gnewsPage: number;
  lastPublishedAt: string | null;
  sig: { q: string; category: string; sortBy: string; lang: string; country: string; pageSize: number };
};

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

function encodeCursor(c: CursorState): string {
  const json = JSON.stringify(c);
  return Buffer.from(json).toString("base64url");
}
function decodeCursor(s: string | null): CursorState | null {
  if (!s) return null;
  try {
    const json = Buffer.from(s, "base64url").toString("utf8");
    const obj = JSON.parse(json) as CursorState;
    if (
      typeof obj.newsapiPage === "number" &&
      typeof obj.gnewsPage === "number"
    ) {
      return obj;
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchNewsAPIPage(
  q: string,
  category: string,
  sortBy: string,
  page: number,
  pageSize: number,
  lang: string,
  country: string,
  toISO?: string | null
): Promise<{ items: NewsItem[]; hasMore: boolean }> {
  const key = process.env.NEWS_API_KEY;
  if (!key) return { items: [], hasMore: false };

  const base = "https://newsapi.org/v2";
  // Everything supports from/to; Top-headlines does not support from/to [1][2].
  const url = q
    ? `${base}/everything?language=${lang}&q=${encodeURIComponent(q)}&sortBy=${encodeURIComponent(
        sortBy
      )}&page=${page}&pageSize=${pageSize}${toISO ? `&to=${encodeURIComponent(toISO)}` : ""}&apiKey=${key}`
    : `${base}/top-headlines?country=${country}${
        category !== "all" ? `&category=${encodeURIComponent(category)}` : ""
      }&page=${page}&pageSize=${pageSize}&apiKey=${key}`;

  const res = await fetch(url, { next: { tags: ["news:explore"] } });
  const json: NewsAPIResponse = await res.json();
  if (!res.ok || !Array.isArray(json.articles)) return { items: [], hasMore: false };

  const items = json.articles.map(mapNewsAPIItem);
  const hasMore = (json.articles?.length ?? 0) === pageSize;
  return { items, hasMore };
}

async function fetchGNewsPage(
  q: string,
  category: string,
  page: number,
  pageSize: number,
  lang: string,
  country: string,
  sortBy: "publishedAt" | "relevance",
  toISO?: string | null
): Promise<{ items: NewsItem[]; hasMore: boolean }> {
  const key = process.env.GNEWS_API_KEY;
  if (!key) return { items: [], hasMore: false };

  const base = "https://gnews.io/api/v4";
  const gCategory = mapCategoryToGNews(category);
  // GNews search and top-headlines both support from/to, page, and max [3][4].
  const common = `lang=${lang}&country=${country}&max=${pageSize}&page=${page}${
    toISO ? `&to=${encodeURIComponent(toISO)}` : ""
  }&apikey=${key}`;

  const url = q
    ? `${base}/search?q=${encodeURIComponent(q)}&sortby=${sortBy}&${common}`
    : `${base}/top-headlines?category=${gCategory}&${common}`;

  const res = await fetch(url, { next: { tags: ["news:explore"] } });
  const json: GNewsResponse = await res.json();
  if (!res.ok || !Array.isArray(json.articles)) return { items: [], hasMore: false };

  const items = json.articles.map(mapGNewsItem);
  const hasMore = (json.articles?.length ?? 0) === pageSize;
  return { items, hasMore };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const category = searchParams.get("category") || "all";
    const sortBy = searchParams.get("sortBy") || "publishedAt";
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") || "12")));
    const lang = searchParams.get("lang") || "en";
    const country = searchParams.get("country") || "in";
    const cursorRaw = searchParams.get("cursor");

    const sig = { q, category, sortBy, lang, country, pageSize };
    const decoded = decodeCursor(cursorRaw);
    const cursorMatches =
      decoded &&
      decoded.sig.q === q &&
      decoded.sig.category === category &&
      decoded.sig.sortBy === sortBy &&
      decoded.sig.lang === lang &&
      decoded.sig.country === country &&
      decoded.sig.pageSize === pageSize;

    let newsapiPage = cursorMatches ? decoded!.newsapiPage : 1;
    let gnewsPage = cursorMatches ? decoded!.gnewsPage : 1;
    const lastPublishedAt = cursorMatches ? decoded!.lastPublishedAt : null;

    // Optional “to” optimization: steer providers to return items older than cursor
    const toISO = lastPublishedAt ?? null;

    // Gather enough items to fill one page, possibly advancing provider pages
    const collected: NewsItem[] = [];
    let naHasMore = true;
    let gnHasMore = true;
    let safety = 0;

    // Refill loop: fetch one page per provider per iteration until enough items or no more
    while (collected.length < pageSize && safety < 5 && (naHasMore || gnHasMore)) {
      safety++;

      const [na, gn] = await Promise.all([
        fetchNewsAPIPage(q, category, sortBy, newsapiPage, pageSize, lang, country, toISO),
        fetchGNewsPage(q, category, gnewsPage, pageSize, lang, country, "publishedAt", toISO),
      ]);

      newsapiPage += na.items.length > 0 || na.hasMore ? 1 : 0;
      gnewsPage += gn.items.length > 0 || gn.hasMore ? 1 : 0;
      naHasMore = na.hasMore;
      gnHasMore = gn.hasMore;

      // Merge freshly fetched items into a staging pool
      const merged = dedupe([...collected, ...na.items, ...gn.items]);
      // Sort newest first (publishedAt desc)
      merged.sort((a, b) => parseDate(b.publishedAt) - parseDate(a.publishedAt));
      // If cursor exists, only keep items strictly older than the cursor timestamp
      const olderOnly = lastPublishedAt ? merged.filter((a) => parseDate(a.publishedAt) < parseDate(lastPublishedAt)) : merged;

      // Keep only up to pageSize in the collected buffer this round (remaining items will be reconsidered in the next loop if needed)
      collected.splice(0, collected.length, ...olderOnly.slice(0, pageSize));
      // If still short of pageSize, the loop will fetch next provider pages
    }

    const articles = collected.slice(0, pageSize);
    const nextCursor =
      articles.length > 0
        ? encodeCursor({
            newsapiPage,
            gnewsPage,
            lastPublishedAt: articles[articles.length - 1].publishedAt ?? null,
            sig,
          })
        : null;

    // Sidebar trending from NewsAPI Top Headlines or Everything first slice
    let trending: NewsItem[] = [];
    if (process.env.NEWS_API_KEY) {
      const t = await fetchNewsAPIPage("", "all", "publishedAt", 1, 8, lang, country, null);
      trending = t.items;
    }

    const hasMore = Boolean(nextCursor);

    return NextResponse.json({
      articles,
      trending,
      nextCursor,
      hasMore,
    });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}
