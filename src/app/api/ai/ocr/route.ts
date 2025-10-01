// app/api/ai/ocr/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { ocrImageBuffer } from "@/app/lib/ai/ocr";

export async function POST(req: Request) {
  const form = await req.formData(); // App Router FormData [7]
  const f = form.get("file");
  if (!(f instanceof File)) return NextResponse.json({ error: "File required" }, { status: 400 });
  const buf = Buffer.from(await f.arrayBuffer());
  const text = await ocrImageBuffer(buf, "eng"); // change lang as needed [3]
  return NextResponse.json({ text });
}
