// app/api/ai/asr/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { transcribeUrl } from "@/app/lib/ai/transformers-pipeline";

export async function POST(req: Request) {
  const { url } = await req.json();
  if (!url || !String(url).startsWith("http")) {
    return NextResponse.json({ error: "Valid URL required" }, { status: 400 });
  }
  const out = await transcribeUrl(String(url)); // whisper-tiny.en [2]
  return NextResponse.json({ transcript: out });
}
