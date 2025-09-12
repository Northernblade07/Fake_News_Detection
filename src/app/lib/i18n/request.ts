// lib/i18n/request.ts
import { getRequestConfig } from "next-intl/server";
import { cookies as nextCookies } from "next/headers";

// Supported locales
const SUPPORTED = ["en","hi","bn","mr","te","ta","gu","ur","kn","or","ml","pa"] as const;
export type Locale = (typeof SUPPORTED)[number];

export default getRequestConfig(async () => {
  // Type-safe cast: cookies() has get() method
  const cookieStore = nextCookies() as unknown as {
    get: (name: string) => { value: string } | undefined;
  };

  const c = cookieStore.get("lang")?.value;
  const locale: Locale = c && SUPPORTED.includes(c as Locale) ? (c as Locale) : "en";

  // Dynamically import messages
  const messages = (await import(`../../public/messages/${locale}.json`)).default;

  return { locale, messages };
});
