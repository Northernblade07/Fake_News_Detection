// app/api/ai/embed/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { embedText } from "@/app/lib/ai/transformers-pipeline";

export async function POST(req: Request) {
  const { text } = await req.json();
  if (!text || !String(text).trim()) {
    return NextResponse.json({ error: "Text required" }, { status: 400 });
  }
  const vec = await embedText(String(text)); // free local embedding [1]
  return NextResponse.json({ embedding: vec, dim: vec.length });
}
