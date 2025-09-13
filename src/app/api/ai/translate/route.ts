// app/api/ai/translate/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { translateText, LangISO, FLORES } from "@/app/lib/ai/translate";

interface TranslateRequest {
  text: string;
  from: LangISO;
  to: LangISO;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<TranslateRequest>;

    if (!body.text || !body.from || !body.to) {
      return NextResponse.json(
        { error: "text, from, to are required" },
        { status: 400 }
      );
    }

    if (!(body.from in FLORES) || !(body.to in FLORES)) {
      return NextResponse.json(
        { error: "Unsupported language code" },
        { status: 400 }
      );
    }

    const translated = await translateText(
      body.text,
      body.from as LangISO,
      body.to as LangISO
    );

    return NextResponse.json({ translated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Translation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
