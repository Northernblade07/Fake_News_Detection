// app/api/transcribe/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { writeTempFile } from "@/app/lib/ai/ffmpeg";
// 1. CHANGE THIS IMPORT: Import Groq directly
import { transcribeWithGroq } from "@/app/lib/ai/transcribe";

export async function POST(req: Request) {
  const tmpFiles: string[] = [];

  try {
    const formData = await req.formData();
    const audio = formData.get("audio");

    if (!(audio instanceof Blob)) {
      return NextResponse.json({ error: "No audio provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await audio.arrayBuffer());
    console.log("Audio bytes:", buffer.length);

    if (buffer.length === 0) {
      return NextResponse.json({ error: "Empty audio buffer" }, { status: 400 });
    }
    console.log(audio)
    const mime = audio.type || "audio/webm";
    const ext = mime.includes("mp4") ? "mp4" : mime.includes("ogg") ? "ogg" : "webm";

    console.log(mime)

    const inPath = await writeTempFile("mic_record", ext, buffer);
    tmpFiles.push(inPath);

    console.log(inPath)
    // 2. CHANGE THIS: Send the webm file directly to Groq! No FFmpeg needed.
    const text = await transcribeWithGroq(inPath);
    console.log("Transcript:", text);

    console.log(text)
    return NextResponse.json({ text });

  } catch (err) {
    console.error("Transcribe API error:", err);
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
  } finally {
    await Promise.allSettled(tmpFiles.map(p => fs.rm(p, { force: true })));
  }
}