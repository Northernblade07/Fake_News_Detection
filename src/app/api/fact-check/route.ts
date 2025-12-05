export const runtime = "nodejs";

import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { auth } from "@/../auth";
import { connectToDatabase } from "@/app/lib/db";
import NewsDetection, { IFactCheck, FactLabel } from "@/app/model/News";
import DetectionLog from "@/app/model/detectionlog";

import Groq from "groq-sdk";

/* -------------------------------------------------------------------------- */
/*                               ENV VARIABLES                                */
/* -------------------------------------------------------------------------- */

const GROQ_API_KEY = process.env.GROQ_API_KEY ?? "";
const APP_BASE_URL = process.env.APP_BASE_URL ?? "http://localhost:3000";
const FACTCHECK_CACHE_TTL = Number(process.env.FACTCHECK_CACHE_TTL ?? 60 * 60 * 6); // 6 hrs
const MAX_SOURCES = Number(process.env.FACTCHECK_MAX_SOURCES ?? 6);

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

interface RelatedArticle {
  title: string;
  url: string;
  snippet: string;
  source: string | null;
  publishedAt: string | null;
}

interface RelatedApiResponse {
  items: RelatedArticle[];
  source: string;
}

interface FactCheckRequestBody {
  text?: string;
  newsId?: string;
}

interface GroqVerdict {
  label: FactLabel;
  confidence: number;
  explanation: string;
}

/* -------------------------------------------------------------------------- */
/*                        SAFE DATABASE CACHE UTILITIES                       */
/* -------------------------------------------------------------------------- */

function db() {
  const d = mongoose.connection.db;
  if (!d) throw new Error("MongoDB connection missing");
  return d;
}

async function getCachedFact(key: string) {
  const result = await db()
    .collection<{ key: string; payload: unknown; expiresAt: Date }>("api_cache")
    .findOne({ key, expiresAt: { $gt: new Date() } });

  return result ?? null;
}

async function setCachedFact(key: string, payload: unknown, ttlSeconds: number) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

  await db().collection("api_cache").updateOne(
    { key },
    { $set: { payload, expiresAt, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true }
  );
}

/* -------------------------------------------------------------------------- */
/*                                 HELPERS                                    */
/* -------------------------------------------------------------------------- */

const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;

async function groqChat(prompt: string): Promise<string> {
  if (!groq) return "";
  try {
    const out = await groq.chat.completions.create({
       model: "llama-3.3-70b-versatile",  // ← LATEST 70B (free)
      // Fallback: "llama-3.1-70b-versatile"
      messages: [{ role: "user", content: prompt }],
      temperature: 0.05,
      max_tokens: 1000,
    });
    return out.choices[0]?.message?.content ?? "";
  } catch (err) {
    console.error("Groq failed:", err);
    return "";
  }
}

async function fetchRelated(text: string): Promise<RelatedArticle[]> {
  try {
    const res = await fetch(`${APP_BASE_URL}/api/related`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: text }),
    });

    if (!res.ok) return [];
    const json = (await res.json()) as RelatedApiResponse;
    return json.items.slice(0, MAX_SOURCES);
  } catch (err) {
    console.error("related-api error:", err);
    return [];
  }
}

function safeJson<T>(input: string): T | null {
  const m = input.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]) as T;
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*                                ROUTE LOGIC                                  */
/* -------------------------------------------------------------------------- */

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();

    const body = (await req.json()) as FactCheckRequestBody;
    const text = body.text?.trim() ?? "";
    const newsId = body.newsId;

    if (!text)
      return NextResponse.json({ error: "Missing text" }, { status: 400 });

    /* -------------------------- (1) CACHE CHECK -------------------------- */
    const cacheKey = `factcheck:${text}`;
    const cached = await getCachedFact(cacheKey);
if (cached) {
  const payload = cached.payload as Record<string, unknown>;
  return NextResponse.json({ cached: true, ...payload }, { status: 200 });
}

    /* -------------------------- (2) FETCH SOURCES ------------------------ */
    const relatedArticles = await fetchRelated(text);

    /* -------------------------- (3) SUMMARIZE ---------------------------- */
    const evidence = relatedArticles
      .map((a, i) => `${i + 1}. ${a.title} — ${a.snippet}`)
      .join("\n");

    let evidenceSummary = evidence;

    if (groq) {
      const prompt = `Summarize the following evidence in 3–5 neutral sentences:\n${evidence}`;
      const out = await groqChat(prompt);
      if (out.trim().length > 5) evidenceSummary = out.trim();
    }

    /* -------------------------- (4) VERDICT ------------------------------ */
    let verdict: GroqVerdict = {
      label: "unsure",
      confidence: 0.35,
      explanation: "Not enough evidence.",
    };

    if (groq) {
      const prompt = `
Given this claim: "${text}"
And this evidence summary: "${evidenceSummary}"

Return strict JSON:
{"label":"real|fake|unsure","confidence":0.0-1.0,"explanation":"..."}
`;
      const raw = await groqChat(prompt);
      const parsed = safeJson<GroqVerdict>(raw);

      if (parsed) verdict = parsed;
    }

    /* -------------------------- (5) SAVE TO DB --------------------------- */
    if (newsId) {
      const userObjectId = new mongoose.Types.ObjectId(session.user.id);

      await NewsDetection.findByIdAndUpdate(
        newsId,
        { factCheck: verdict },
        { new: true }
      );

      await DetectionLog.create({
        user: userObjectId,
        news: new mongoose.Types.ObjectId(newsId),
        result: {
          label:
            verdict.label === "real"
              ? "real"
              : verdict.label === "fake"
              ? "fake"
              : "unknown",
          probability: verdict.confidence,
        },
      });
    }

    /* -------------------------- (6) CACHE ------------------------------- */
    const payload = {
      verdict,
      evidenceSummary,
      sources: relatedArticles,
    };

    await setCachedFact(cacheKey, payload, FACTCHECK_CACHE_TTL);

    /* -------------------------- (7) RETURN ------------------------------ */
    return NextResponse.json(
      { cached: false, ...payload },
      { status: 200 }
    );
  } catch (err) {
    console.error("Fact-check error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
