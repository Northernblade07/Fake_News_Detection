// app/api/related/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import mongoose from "mongoose";
import { connectToDatabase } from "@/app/lib/db";

/* ---------------- ENV ---------------- */
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID!;
const GOOGLE_CSE_KEY = process.env.GOOGLE_CSE_KEY!;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY ?? null;
const SERP_API_KEY = process.env.SERP_API_KEY ?? null;
const BING_API_KEY = process.env.BING_API_KEY ?? null;

/* ---------------- CONFIG ---------------- */
const DAILY_QUOTA = 100;
const SAFETY_BUFFER = 10;
const EFFECTIVE_DAILY_LIMIT = DAILY_QUOTA - SAFETY_BUFFER;
const CACHE_TTL_SECONDS = 60 * 60 * 3; // 3 hours
const TARGET_RESULT_COUNT = 8;
const BLOCK_SOCIAL = /(facebook|instagram|threads|tiktok|x\.com|twitter\.com)/i;

/* ---------------- TYPES ---------------- */
interface RelatedReq {
  title: string;
  summary?: string;
  lang?: string;
  region?: string;
}

interface RelatedArticle {
  title: string;
  url: string;
  snippet: string;
  source: string | null;
  publishedAt: string | null;
}

// --- Google Types ---
interface GoogleItem {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
  pagemap?: { metatags?: Array<Record<string, string>> };
}

interface GoogleResponse {
  items?: GoogleItem[];
}

// --- Tavily Types ---
interface TavilyItem {
  title: string;
  url: string;
  content: string;
  score?: number;
}

interface TavilyResponse {
  results?: TavilyItem[];
}

// --- SerpApi Types ---
interface SerpItem {
  title: string;
  link: string;
  snippet: string;
  source?: string;
  date?: string;
}

interface SerpApiResponse {
  organic_results?: SerpItem[];
}

// --- Bing Types ---
interface BingItem {
  name: string;
  url: string;
  description: string;
  datePublished?: string;
  provider?: Array<{ name: string }>;
}

interface BingResponse {
  value?: BingItem[];
}

/* ---------------- HELPERS ---------------- */

function buildSafeQuery(req: RelatedReq): string {
  const clean = (text?: string): string =>
    (text ?? "")
      .replace(/[^\p{L}\p{N}\s]/gu, "")
      .trim()
      .split(/\s+/)
      .slice(0, 10)
      .join(" ");

  const cleanTitle = clean(req.title);
  if (cleanTitle.length > 3) return cleanTitle;

  const cleanSummary = clean(req.summary);
  if (cleanSummary.length > 3) {
    return cleanSummary.split(" ").slice(0, 8).join(" ");
  }

  return "";
}

function hashKey(str: string): string {
  return crypto.createHash("sha256").update(str).digest("hex");
}

const todayKey = (): string =>
  new Date().toLocaleDateString("en-CA", { timeZone: "UTC" });

function mergeAndRank(...lists: RelatedArticle[][]): RelatedArticle[] {
  const map = new Map<string, RelatedArticle>();

  for (const list of lists) {
    for (const item of list) {
      if (!item?.url) continue;
      // Deduplicate by URL
      if (!map.has(item.url)) {
        map.set(item.url, item);
      }
    }
  }

  // Filter out social media and cap the results
  return Array.from(map.values())
    .filter((r) => !BLOCK_SOCIAL.test(r.source ?? "") && !BLOCK_SOCIAL.test(r.url))
    .slice(0, TARGET_RESULT_COUNT);
}

/* ---------------- MONGO HELPERS ---------------- */
const getDB = (): mongoose.mongo.Db => mongoose.connection.db!;

async function getCount(dateKey: string): Promise<number> {
  const col = getDB().collection<{ date: string; provider: string; count: number }>("api_counters");
  const doc = await col.findOne({ date: dateKey, provider: "google_cse" });
  return doc?.count ?? 0;
}

async function incrementCount(dateKey: string): Promise<void> {
  await getDB().collection("api_counters").updateOne(
    { date: dateKey, provider: "google_cse" },
    { $inc: { count: 1 }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true }
  );
}

async function getCached(key: string): Promise<RelatedArticle[] | null> {
  const doc = await getDB()
    .collection<{ key: string; payload: RelatedArticle[]; expiresAt: Date }>("api_cache")
    .findOne({ key, expiresAt: { $gt: new Date() } });

  return doc?.payload ?? null;
}

async function setCached(key: string, payload: RelatedArticle[]): Promise<void> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CACHE_TTL_SECONDS * 1000);

  await getDB().collection("api_cache").updateOne(
    { key },
    { $set: { payload, expiresAt, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true }
  );
}

/* ---------------- API CALLS ---------------- */

async function callGoogle(url: URL): Promise<GoogleResponse | null> {
  const res = await fetch(url.toString());
  if (!res.ok) return null;
  return (await res.json()) as GoogleResponse;
}

async function callTavily(query: string): Promise<TavilyResponse | null> {
  if (!TAVILY_API_KEY) return null;
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query,
        max_results: 4,
        search_depth: "basic",
      }),
    });
    if (!res.ok) return null;
    return (await res.json()) as TavilyResponse;
  } catch {
    return null;
  }
}

async function callSerp(query: string): Promise<SerpApiResponse | null> {
  if (!SERP_API_KEY) return null;
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("q", query);
  url.searchParams.set("api_key", SERP_API_KEY);
  url.searchParams.set("engine", "google");
  url.searchParams.set("num", "6");

  try {
    const res = await fetch(url.toString());
    if (!res.ok) return null;
    return (await res.json()) as SerpApiResponse;
  } catch {
    return null;
  }
}

async function callBing(query: string): Promise<BingResponse | null> {
  if (!BING_API_KEY) return null;
  const url = new URL("https://api.bing.microsoft.com/v7.0/news/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", "7");

  try {
    const res = await fetch(url.toString(), {
      headers: { "Ocp-Apim-Subscription-Key": BING_API_KEY },
    });
    if (!res.ok) return null;
    return (await res.json()) as BingResponse;
  } catch {
    return null;
  }
}

/* ---------------- TRANSFORMERS ---------------- */

function transformGoogle(json: GoogleResponse): RelatedArticle[] {
  return (json.items ?? []).map((it) => ({
    title: it.title,
    url: it.link,
    snippet: it.snippet,
    source: it.displayLink,
    publishedAt:
      it.pagemap?.metatags?.[0]?.["article:published_time"] ??
      it.pagemap?.metatags?.[0]?.["og:updated_time"] ??
      null,
  }));
}

function transformTavily(json: TavilyResponse): RelatedArticle[] {
  return (json.results ?? []).map((r) => {
    let hostname = "tavily";
    try { hostname = new URL(r.url).hostname; } catch {}
    
    return {
      title: r.title,
      url: r.url,
      snippet: r.content,
      source: hostname, // Extracts actual domain for credibility scoring
      publishedAt: null,
    };
  });
}

function transformSerp(json: SerpApiResponse): RelatedArticle[] {
  return (json.organic_results ?? []).map((r) => {
    let hostname = r.source ?? "serpapi";
    try { hostname = new URL(r.link).hostname; } catch {}

    return {
      title: r.title,
      url: r.link,
      snippet: r.snippet,
      source: hostname,
      publishedAt: r.date ?? null,
    };
  });
}

function transformBing(json: BingResponse): RelatedArticle[] {
  return (json.value ?? []).map((v) => ({
    title: v.name,
    url: v.url,
    snippet: v.description,
    source: v.provider?.[0]?.name ?? null,
    publishedAt: v.datePublished ?? null,
  }));
}

/* ---------------- HANDLER ---------------- */
export async function POST(req: Request): Promise<Response> {
  try {
    await connectToDatabase();

    const body = (await req.json()) as RelatedReq;
    const safeQuery = buildSafeQuery(body);

    if (!safeQuery) {
      return NextResponse.json({ items: [], source: "invalid-query" });
    }

    const cacheKeyBase = `${safeQuery}|lang=${body.lang ?? ""}|region=${body.region ?? ""}`;
    const hash = hashKey(cacheKeyBase);
    const mergedCacheKey = `merged:${hash}`;

    /** 1. Check Merged Cache First */
    const cachedMerged = await getCached(mergedCacheKey);
    if (cachedMerged && cachedMerged.length > 0) {
      return NextResponse.json({ items: cachedMerged, source: "merged-cache" });
    }

    let mergedResults: RelatedArticle[] = [];
    const sourceTags: string[] = [];

    /** 2. Try Google (Primary) */
    const today = todayKey();
    const used = await getCount(today);
    
    if (used < EFFECTIVE_DAILY_LIMIT) {
      const gUrl = new URL("https://www.googleapis.com/customsearch/v1");
      gUrl.searchParams.set("key", GOOGLE_CSE_KEY);
      gUrl.searchParams.set("cx", GOOGLE_CSE_ID);
      gUrl.searchParams.set("q", safeQuery);
      gUrl.searchParams.set("num", "8");

      const googleResp = await callGoogle(gUrl);

      console.log(googleResp)
      if (googleResp?.items?.length) {
        const articles = transformGoogle(googleResp);
        mergedResults = mergeAndRank(mergedResults, articles);
        sourceTags.push("google");
        await incrementCount(today);
      }
    }

    /** 3. Smart Fill with Fallbacks (Only call if we need more results) */
    if (mergedResults.length < 2 && TAVILY_API_KEY) {
      const tavilyResp = await callTavily(safeQuery);
      if (tavilyResp?.results?.length) {
        const articles = transformTavily(tavilyResp);
        mergedResults = mergeAndRank(mergedResults, articles);
        sourceTags.push("tavily");
      }
    }

    if (mergedResults.length < 2 && SERP_API_KEY) {
      const serpResp = await callSerp(safeQuery);
      if (serpResp?.organic_results?.length) {
        const articles = transformSerp(serpResp);
        mergedResults = mergeAndRank(mergedResults, articles);
        sourceTags.push("serpapi");
      }
    }

    if (mergedResults.length < 2 && BING_API_KEY) {
      const bingResp = await callBing(safeQuery);
      if (bingResp?.value?.length) {
        const articles = transformBing(bingResp);
        mergedResults = mergeAndRank(mergedResults, articles);
        sourceTags.push("bing");
      }
    }

    /** 4. Cache and Return Final Merged Pool */
    if (mergedResults.length > 0) {
      await setCached(mergedCacheKey, mergedResults);
      return NextResponse.json({ 
        items: mergedResults, 
        source: sourceTags.join("+") 
      });
    }

    return NextResponse.json({ items: [], source: "none" });

  } catch (err) {
    console.error("related error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}