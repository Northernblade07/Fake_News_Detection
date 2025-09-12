"use server";

import { cookies as nextCookies } from "next/headers";

// Define supported locales
const SUPPORTED = ["en","hi","bn","mr","te","ta","gu","ur","kn","or","ml","pa"] as const;
export type Locale = (typeof SUPPORTED)[number];

/**
 * Set the locale cookie safely.
 * This function must be called from a server action.
 */
export function setLocale(locale: Locale) {
  if (!SUPPORTED.includes(locale)) return;

  // Explicit type cast to ResponseCookies to make TS happy
  const cookieStore = nextCookies() as unknown as {
    set: (options: {
      name: string;
      value: string;
      path?: string;
      maxAge?: number;
      sameSite?: "lax" | "strict" | "none";
    }) => void;
  };

  cookieStore.set({
    name: "lang",
    value: locale,
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
  });
}
