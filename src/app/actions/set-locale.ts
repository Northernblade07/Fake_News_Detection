"use server";

import { cookies as nextCookies } from "next/headers";
import { SUPPORTED, type Locale } from "@/app/lib/i18n/request";

export async function setLocale(locale: Locale) {
  if (!SUPPORTED.includes(locale)) return;

  // Await cookies()
  const cookieStore = await nextCookies();

  cookieStore.set({
    name: "lang",
    value: locale,
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
  });
}

