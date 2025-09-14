// app/api/news/revalidate/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function GET() {
  try {
    // purge all explore fetches and trending
    revalidateTag("news:explore");
    revalidateTag("news:trending");
    return NextResponse.json({ ok: true, revalidated: ["news:explore", "news:trending"] });
  } catch (e) {
    console.log(e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
