export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { connectToDatabase } from "@/app/lib/db";
import NewsDetection from "@/app/model/News";
import DetectionLog from "@/app/model/detectionlog";

// You said you have used "groq-sdk" earlier in examples. If you use a different client,
// change the import accordingly. This code guards for missing key.
import Groq from "groq-sdk";

type FactLabel = "fake" | "real" | "unsure";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GOOGLE_KEY = process.env.GOOGLE_SEARCH_API_KEY || "";
const GOOGLE_CX = process.env.GOOGLE_SEARCH_ENGINE_ID || "";
const MAX_SOURCES = Number(process.env.FACTCHECK_MAX_SOURCES || 10);

// Initialize groq client only if key present
const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;

// Safe helper to call Groq chat with retries
async function groqChatSafe(prompt: string, fallback = ""): Promise<string> {
  if (!groq) return fallback;

  try {
    const res = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.15,
      max_tokens: 800,
    });
    return res?.choices?.[0]?.message?.content ?? fallback;
  } catch (err) {
    console.error("Groq call failed:", err);
    return fallback;
  }
}

// Google Programmable Search wrapper
async function googleSearch(query: string) {
  if (!GOOGLE_KEY || !GOOGLE_CX) return [];
  const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(
    GOOGLE_KEY
  )}&cx=${encodeURIComponent(GOOGLE_CX)}&q=${encodeURIComponent(query)}&num=10`;
  try {
    const r = await fetch(url);
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      console.warn("Google search non-OK:", r.status, text);
      return [];
    }
    const data = await r.json();
    return (data.items || []).map((it: any) => ({
      title: it.title,
      link: it.link,
      snippet: it.snippet || it.pagemap?.metatags?.[0]?.description || "",
    })) as Array<{ title?: string; link?: string; snippet?: string }>;
  } catch (err) {
    console.error("Google search failed:", err);
    return [];
  }
}

function safeParseJSON<T = any>(raw: string): T | null {
  if (!raw) return null;
  // try to extract a JSON object from raw text
  const jsonMatch = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]) as T;
  } catch (err) {
    try {
      // last-resort: eval-like (not recommended) - avoid for security
      return null;
    } catch {
      return null;
    }
  }
}

// API route
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();

    const body = await req.json().catch(() => ({}));
    const text = (body?.text || "").toString().trim();
    const newsId = body?.newsId;

    if (!text) return NextResponse.json({ error: "Missing text" }, { status: 400 });

    // 1) Generate 3-5 search queries
    const queriesPrompt = `
You are given a short claim or news text. Generate 4 concise Google search queries (as JSON array of strings)
that will help verify or falsify the claim. Output only a JSON array.
Claim: ${text}
`;
    const queriesRaw = await groqChatSafe(queriesPrompt, "");
    let queries: string[] = [];
    try {
      const parsed = safeParseJSON<string[]>(queriesRaw);
      if (Array.isArray(parsed) && parsed.length) queries = parsed.slice(0, 6);
    } catch (e) {
      /* ignore */
    }
    if (!queries.length) queries = [text];

    // 2) Run searches (use your existing Google CSE)
    const allResults: Array<{ title?: string; link?: string; snippet?: string }> = [];
    for (const q of queries) {
      const res = await googleSearch(q);
      if (res && res.length) {
        for (const r of res) {
          allResults.push(r);
        }
      }
      // small delay is optional to be nice to the API
      await new Promise((r) => setTimeout(r, 150));
      if (allResults.length >= MAX_SOURCES) break;
    }

    const topResults = allResults.slice(0, MAX_SOURCES);

    // 3) Summarize evidence
    const summaryPrompt = `
Summarize the following evidence (use neutral language, 4-6 sentences). Provide a concise summary.

Evidence list:
${topResults.map((s, i) => `#${i + 1} Title: ${s.title}\nSnippet: ${s.snippet}\nLink: ${s.link}`).join("\n\n")}
`;
    const evidenceSummary = (await groqChatSafe(summaryPrompt, "")).trim() || "";

    // 4) Final verdict JSON
    const verdictPrompt = `
Given the claim:
"${text}"

And the evidence summary:
"${evidenceSummary}"

Classify the claim strictly as one of: "real", "fake", "unsure".
Return ONLY valid JSON with keys: label, confidence (0.0-1.0), explanation.
Example:
{"label":"fake","confidence":0.78,"explanation":"..."}
`;
    const verdictRaw = await groqChatSafe(verdictPrompt, "");
    let verdict = safeParseJSON<{ label?: string; confidence?: number; explanation?: string }>(verdictRaw);

    if (!verdict) {
      // fallback: simple heuristic if no LLM output
      verdict = {
        label: "unsure",
        confidence: 0.35,
        explanation: "Could not reliably parse model output",
      };
    }

    const label = (verdict.label === "real" || verdict.label === "fake" ? verdict.label : "unsure") as FactLabel;
    const confidence =
      typeof verdict.confidence === "number" && !Number.isNaN(verdict.confidence)
        ? Math.min(Math.max(verdict.confidence, 0), 1)
        : 0.0;
    const explanation = verdict.explanation?.toString?.() ?? "";

    // 5) Persist into DB under factCheck
    const factCheckRecord = {
      label,
      confidence,
      explanation,
      evidenceSummary,
      sources: topResults,
      checkedAt: new Date(),
    };

    if (newsId) {
      try {
        await NewsDetection.findByIdAndUpdate(newsId, { factCheck: factCheckRecord }, { new: true }).exec();
        await DetectionLog.create({
          user: session.user.id,
          news: newsId,
          result: { label: label === "real" ? "real" : label === "fake" ? "fake" : "unknown", probability: confidence },
        });
      } catch (err) {
        console.warn("Failed to save fact-check:", err);
      }
    }

    // 6) Return
    return NextResponse.json(
      {
        verdict: { label, confidence, explanation },
        evidenceSummary,
        sources: topResults,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Fact-check route error:", err);
    return NextResponse.json({ error: err ?? "Internal error" }, { status: 500 });
  }
}
