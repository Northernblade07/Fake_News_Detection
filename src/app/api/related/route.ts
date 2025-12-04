// app/api/related/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import mongoose from "mongoose";
import { connectToDatabase } from "@/app/lib/db";

/* ---------------- ENV ---------------- */
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID!;
const GOOGLE_CSE_KEY = process.env.GOOGLE_CSE_KEY!;
const BING_API_KEY = process.env.BING_API_KEY ?? null;

/* ---------------- CONFIG ---------------- */
const DAILY_QUOTA = 100;
const SAFETY_BUFFER = 10;
const EFFECTIVE_DAILY_LIMIT = DAILY_QUOTA - SAFETY_BUFFER;
const CACHE_TTL_SECONDS = 60 * 60 * 3; // 3 hours

/* ---------------- TYPES ---------------- */
interface RelatedReq {
  title: string;
  summary?: string;
  lang?: string;
  region?: string;
  mode?: "related" | "authoritative";
}

interface RelatedArticle {
  title: string;
  url: string;
  snippet: string;
  source: string | null;
  publishedAt: string | null;
}

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

interface BingArticle {
  name: string;
  url: string;
  description: string;
  datePublished?: string;
  provider?: Array<{ name: string }>;
}

interface BingResponse {
  value?: BingArticle[];
}

/* ---------------- HELPERS ---------------- */

// CLEAN, SHORT QUERY USING ONLY TITLE (and light summary fallback)
function buildSafeQuery(req: RelatedReq): string {
  const clean = (text?: string): string =>
    (text ?? "")
      .replace(/[^\p{L}\p{N}\s]/gu, "")
      .trim()
      .split(/\s+/)
      .slice(0, 10)
      .join(" ");

  // Prefer title → this gives best results
  const cleanTitle = clean(req.title);

  if (cleanTitle.length > 3) return cleanTitle;

  // Fallback: take FIRST 8 meaningful words of summary
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

async function callBing(query: string): Promise<BingResponse | null> {
  if (!BING_API_KEY) return null;

  const url = new URL("https://api.bing.microsoft.com/v7.0/news/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", "6");

  const res = await fetch(url.toString(), {
    headers: { "Ocp-Apim-Subscription-Key": BING_API_KEY },
  });

  if (!res.ok) return null;
  return (await res.json()) as BingResponse;
}

/* ---------------- TRANSFORM ---------------- */
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
    const googleKey = `google:${hashKey(cacheKeyBase)}`;
    const bingKey = `bing:${hashKey(cacheKeyBase)}`;

    /** 1. Cached Google */
    const cachedGoogle = await getCached(googleKey);
    if (cachedGoogle) {
      return NextResponse.json({ items: cachedGoogle, source: "google-cache" });
    }

    /** 2. Cached Bing */
    const cachedBing = await getCached(bingKey);
    if (cachedBing) {
      return NextResponse.json({ items: cachedBing, source: "bing-cache" });
    }

    /** 3. Google quota check */
    const today = todayKey();
    const used = await getCount(today);
    const underLimit = used < EFFECTIVE_DAILY_LIMIT;

    /** 4. Try Google API */
    if (underLimit) {
      const gUrl = new URL("https://www.googleapis.com/customsearch/v1");
      gUrl.searchParams.set("key", GOOGLE_CSE_KEY);
      gUrl.searchParams.set("cx", GOOGLE_CSE_ID);
      gUrl.searchParams.set("q", safeQuery);
      gUrl.searchParams.set("num", "10");

      const googleResp = await callGoogle(gUrl);

      if (googleResp?.items?.length) {
        const articles = transformGoogle(googleResp);
        await incrementCount(today);
        await setCached(googleKey, articles);

        return NextResponse.json({ items: articles, source: "google" });
      }
    }

    /** 5. Bing Fallback */
    const bingResp = await callBing(safeQuery);
    if (bingResp?.value?.length) {
      const articles = transformBing(bingResp);
      await setCached(bingKey, articles);

      return NextResponse.json({ items: articles, source: "bing" });
    }

    /** 6. Nothing found */
    return NextResponse.json({ items: [], source: "none" });

  } catch (err) {
    console.error("related error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
