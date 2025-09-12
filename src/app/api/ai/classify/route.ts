// app/api/ai/classify/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { classifyText } from "@/app/lib/ai/transformers-pipeline";
// Optional Gemini fallback
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_KEY = process.env.GOOGLE_API_KEY; // set only if using fallback [8]
const gemini = GEMINI_KEY ? new GoogleGenerativeAI(GEMINI_KEY) : null;

type LocalOut = { label: string; score: number };

function mapLocal(top: LocalOut) {
  const l = top.label.toLowerCase();
  const label = l.includes("neg") || l.includes("fake") ? "fake" : "real";
  return { label, confidence: Number(top.score), reason: "local" as const };
}

async function geminiFallback(text: string) {
  if (!gemini) return { label: "unknown", confidence: 0, reason: "no-gemini" as const };
  const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" }); // fast [8]
  const prompt = `You are a fake news detection assistant. Analyze the text and return only JSON: {"label":"fake|real","confidence":0..1,"reason":"..."}\nText:\n${text}`;
  const res = await model.generateContent(prompt);
  const raw = res.response.text();
  try { return JSON.parse(raw) as { label: string; confidence: number; reason: string }; }
  catch { return { label: "unknown", confidence: 0, reason: "parse-failed" }; }
}

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text || !String(text).trim()) {
      return NextResponse.json({ error: "Text required" }, { status: 400 });
    }
    const raw = await classifyText(String(text)); // local free pipeline [1]
    const sorted = [...raw].sort((a, b) => b.score - a.score);
    const top = sorted ?? { label: "unknown", score: 0 };
    const local = mapLocal(top);

    if (local.confidence >= 0.8 || !gemini) {
      return NextResponse.json({ result: local, source: "local" });
    }

    const fallback = await geminiFallback(String(text)); // optional [8]
    return NextResponse.json({ result: fallback, source: "gemini" });
  } catch (e) {
    return NextResponse.json({ error: "Detection failed" }, { status: 500 });
  }
}
