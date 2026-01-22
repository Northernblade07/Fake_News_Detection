// app/lib/ai/factCheck.ts
/* eslint-disable @typescript-eslint/no-unused-vars */
import Groq from "groq-sdk";

/**
 * Production-hardened RAG fact-check utility
 *
 * - Type-safe (no `any` used)
 * - Short timeouts & bounded tokens to limit latency & quota use
 * - Groq primary, Gemini fallback
 * - Provenance: which model produced summary & verdict
 * - Defensive sanitization & JSON parsing
 */

/* ----------------------------- Types ------------------------------------ */

export interface RelatedArticle {
  title: string;
  url: string;
  snippet: string;
  source: string | null;
  publishedAt: string | null;
}

export type VerdictLabel = "real" | "fake" | "unsure";

export interface FactCheckResult {
  label: VerdictLabel;
  confidence: number; // 0..1
  explanation: string;
  evidenceSummary: string;
  sources: RelatedArticle[]; // included for UI, not required to persist
  modelUsedSummary: "groq" | "gemini" | "none";
  modelUsedVerdict: "groq" | "gemini" | "none";
  processingTimeMs: number;
}

/* --------------------------- Config / ENV ------------------------------- */

const APP_BASE_URL = process.env.APP_BASE_URL ?? "http://localhost:3000";
const GROQ_API_KEY = process.env.GROQ_API_KEY ?? "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";
const MAX_SOURCES = Number(process.env.FACTCHECK_MAX_SOURCES ?? 6);
const MAX_SNIPPET_CHARS = Number(process.env.FACTCHECK_SNIPPET_LIMIT ?? 250);
const RELATED_TIMEOUT_MS = Number(process.env.FACTCHECK_RELATED_TIMEOUT_MS ?? 4000); // 4s
const GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
const GROQ_MAX_TOKENS_SUMMARY = Number(process.env.GROQ_MAX_TOKENS_SUMMARY ?? 400);
const GROQ_MAX_TOKENS_VERDICT = Number(process.env.GROQ_MAX_TOKENS_VERDICT ?? 250);
const GROQ_MAX_RETRIES = Number(process.env.GROQ_MAX_RETRIES ?? 2);

/* --------------------------- Groq client -------------------------------- */

const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;

/* ------------------------- Utility helpers ------------------------------ */

function nowMs(): number {
  return Math.round(performance.now());
}

function sanitizeClaim(raw?: string | null): string {
  if (!raw) return "";
  // remove control chars, newlines, and collapse whitespace; keep it short
  return raw.replace(/[\r\n]+/g, " ").replace(/["]+/g, "'").trim().slice(0, 2000);
}

function truncateSnippet(s?: string | null): string {
  if (!s) return "";
  const t = s.trim();
  return t.length <= MAX_SNIPPET_CHARS ? t : t.slice(0, MAX_SNIPPET_CHARS - 1) + "…";
}

/**
 * Robust JSON extraction by scanning for first '{' and matching closing '}'.
 * Avoids catastrophic regex on large input.
 */
function extractJsonObject<T>(input: string): T | null {
  if (!input) return null;
  const first = input.indexOf("{");
  if (first === -1) return null;

  let depth = 0;
  for (let i = first; i < input.length; i++) {
    const ch = input[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        const candidate = input.slice(first, i + 1);
        try {
          return JSON.parse(candidate) as T;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

/* ------------------------ Network helpers (no `any`) --------------------- */

async function fetchJson<T>(url: string, opts: RequestInit): Promise<T | null> {
  const controller = new AbortController();
  const signal = controller.signal;
  const timeoutId = setTimeout(() => controller.abort(), RELATED_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...opts, signal });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const data = (await res.json()) as T;
    return data;
  } catch (e) {
    clearTimeout(timeoutId);
    return null;
  }
}

/* ----------------------- Related articles fetch ------------------------- */

interface RelatedApiResponse {
  items?: RelatedArticle[];
  source?: string;
}

async function fetchRelatedArticles(query: string): Promise<RelatedArticle[]> {
  // short-circuit
  if (!query || query.trim().length < 3) return [];

  const url = `${APP_BASE_URL}/api/related`;
  const body = JSON.stringify({ title: query });

  const json = await fetchJson<RelatedApiResponse>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  console.log(json , "json")

  const items = (json?.items ?? []) as RelatedArticle[];
  // trim & restrict

  console.log(items , "items")
  return items
    .slice(0, MAX_SOURCES)
    .map((s) => ({
      title: s.title,
      url: s.url,
      snippet: truncateSnippet(s.snippet),
      source: s.source ?? null,
      publishedAt: s.publishedAt ?? null,
    }));
}

/* ---------------------------- Groq call --------------------------------- */

async function groqChat(prompt: string, maxTokens: number): Promise<string> {
  if (!groq) return "";

  let lastErr: unknown = null;
  for (let attempt = 1; attempt <= GROQ_MAX_RETRIES; attempt++) {
    try {
      const res = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.08,
        max_tokens: maxTokens,
      });
      const text = res?.choices?.[0]?.message?.content ?? "";
      return typeof text === "string" ? text.trim() : "";
    } catch (err) {
      lastErr = err;
      // small backoff
      const backoff = 200 * attempt;
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  console.error("groq exhausted retries:", lastErr);
  return "";
}

/* ------------------------- Gemini fallback ------------------------------ */

async function geminiGenerate(prompt: string, maxOutputTokens = 500): Promise<string> {
  if (!GEMINI_API_KEY) return "";

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-preview:generateContent?key=${GEMINI_API_KEY}`;

  const body = {
    // simple generation body: keep minimal to avoid extra quota/time
    prompt: {
      text: prompt,
    },
    temperature: 0.1,
    maxOutputTokens,
  };

  try {
    const json = await fetchJson<Record<string, unknown>>(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // attempt to extract text from common candidate shapes
    if (!json) return "";
    // typed access without using `any`
    const maybeCandidates = (json as Record<string, unknown>)["candidates"];
    if (Array.isArray(maybeCandidates) && maybeCandidates.length > 0) {
      const first = maybeCandidates[0] as Record<string, unknown>;
      const content = first["content"] as Record<string, unknown> | undefined;
      if (content) {
        const parts = content["parts"] as unknown;
        if (Array.isArray(parts) && typeof parts[0] === "string") {
          return (parts[0] as string).trim();
        }
      }
    }

    // Last resort: stringify whole JSON (unlikely)
    return JSON.stringify(json).slice(0, 2000);
  } catch (e) {
    console.error("geminiGenerate failed:", e);
    return "";
  }
}


function buildSearchQuery(claim: string): string {
  return claim
    .replace(/["']/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .trim()
    .split(/\s+/)
    .slice(0, 10)
    .join(" ");
}


/* --------------------------- Main runner -------------------------------- */

export async function runFactCheck(rawClaim?: string | null): Promise<FactCheckResult> {
  const started = nowMs();
  const claim = sanitizeClaim(rawClaim);

  if (!claim || claim.length < 3) {
    return {
      label: "unsure",
      confidence: 0.0,
      explanation: "No readable claim provided.",
      evidenceSummary: "",
      sources: [],
      modelUsedSummary: "none",
      modelUsedVerdict: "none",
      processingTimeMs: Math.round(nowMs() - started),
    };
  }

  // 1) fetch related articles (bounded & quick)
const searchQuery = buildSearchQuery(claim);
const sources = await fetchRelatedArticles(searchQuery);
  
  if (sources.length === 0) {
    return {
      label: "unsure",
      confidence: 0.2,
      explanation: "No relevant sources found to verify the claim.",
      evidenceSummary: "",
      sources: [],
      modelUsedSummary: "none",
      modelUsedVerdict: "none",
      processingTimeMs: Math.round(nowMs() - started),
    };
  }

  // 2) build compact evidence for prompt (limit length)
  const evidenceChunks = sources.map((s, i) => `${i + 1}. ${s.title}\n   ${s.snippet}`);
  const evidence = evidenceChunks.join("\n\n").slice(0, 4000); // token safety guard

  // 3) summary (prefer Groq, fallback Gemini)
  const summaryPrompt = `Summarize the evidence below about the claim "${claim}" in 3-5 neutral sentences. Use facts only. Evidence:\n\n${evidence}`;
  let evidenceSummary = "";
  let modelUsedSummary: FactCheckResult["modelUsedSummary"] = "none";

  const groqSummary = await groqChat(summaryPrompt, GROQ_MAX_TOKENS_SUMMARY);
  if (groqSummary && groqSummary.length > 20) {
    evidenceSummary = groqSummary.trim();
    modelUsedSummary = "groq";
  } else {
    const geminiSummary = await geminiGenerate(summaryPrompt, 300);
    if (geminiSummary && geminiSummary.length > 20) {
      evidenceSummary = geminiSummary.trim();
      modelUsedSummary = "gemini";
    } else {
      // fallback to minimal concatenated evidence (safe)
      evidenceSummary = evidenceChunks.slice(0, 3).join(" | ");
      modelUsedSummary = "none";
    }
  }

  // 4) verdict (prefer Groq, fallback Gemini)
const verdictPrompt = `
You are a fake new and fact-checking system.

Rules:
- Focus on the CORE claim, not minor numerical differences.
- If multiple reliable sources support the main claim, label it "real".
- Minor differences in numbers or wording do NOT make a claim false.
- Label "fake" ONLY if credible sources explicitly contradict the claim.

Claim:
"${claim}?"

Evidence summary:
"${evidenceSummary}"

Return ONLY valid JSON:
{
  "label": "real" | "fake" | "unsure",
  "confidence": 0.0-1.0,
  "explanation": "1–2 sentences grounded in the evidence"
}
`;
  let modelUsedVerdict: FactCheckResult["modelUsedVerdict"] = "none";
  let rawVerdictText = await groqChat(verdictPrompt, GROQ_MAX_TOKENS_VERDICT);

  if (!rawVerdictText || rawVerdictText.trim().length < 10) {
    rawVerdictText = await geminiGenerate(verdictPrompt, 200);
    modelUsedVerdict = rawVerdictText ? "gemini" : "none";
  } else {
    modelUsedVerdict = "groq";
  }

  const parsed = extractJsonObject<{ label?: string; confidence?: number | string; explanation?: string }>(rawVerdictText ?? "");

  let label: VerdictLabel = "unsure";
  let confidence = 0.35;
  let explanation = "Insufficient evidence to form a verdict.";

  if (parsed && typeof parsed.label === "string" && ["real", "fake", "unsure"].includes(parsed.label)) {
    label = parsed.label as VerdictLabel;
    const confNum = typeof parsed.confidence === "number" ? parsed.confidence : Number(parsed.confidence ?? 0);
    confidence = Number.isFinite(confNum) ? Math.max(0, Math.min(1, confNum)) : 0.35;
    explanation = typeof parsed.explanation === "string" && parsed.explanation.trim().length > 0 ? parsed.explanation.trim() : explanation;
  } else {
    // fallback heuristics: if many authoritative sources mention the claim as real, bump confidence a bit
    const authoritativeCount = sources.filter((s) => (s.source ?? "").match(/nasa|gov|edu|bbc|reuters|ap/gi)).length;
    if (authoritativeCount >= Math.min(2, Math.ceil(sources.length / 3))) {
      label = "real";
      confidence = Math.min(0.85, 0.5 + authoritativeCount * 0.1);
      explanation = "Multiple authoritative sources appear to corroborate the claim.";
    }
  }

  const processingTimeMs = Math.round(nowMs() - started);

  return {
    label,
    confidence,
    explanation,
    evidenceSummary,
    sources,
    modelUsedSummary,
    modelUsedVerdict,
    processingTimeMs,
  };
}
