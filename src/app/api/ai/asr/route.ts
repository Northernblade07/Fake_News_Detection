// app/api/ai/asr/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { transcribeFile } from "@/app/lib/ai/transformers-pipeline";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== "string" || !/^https?:\/\//.test(url)) {
      return NextResponse.json({ error: "Valid URL required" }, { status: 400 });
    }

    // Fetch the file as a Blob
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: `Failed to fetch file: ${res.status}` }, { status: 400 });
    }
    const arrayBuffer = await res.arrayBuffer();
    const blob = new Blob([arrayBuffer]);

    // Transcribe using your local Whisper pipeline
    const asrResult = await transcribeFile(blob);

    return NextResponse.json({ transcript: asrResult.text, chunks: asrResult.chunks ?? [] });
  } catch (err) {
    console.error("ASR Route Error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
