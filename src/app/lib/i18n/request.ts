// lib/i18n/request.ts
import { getRequestConfig } from "next-intl/server";
import { cookies as nextCookies } from "next/headers";

export const SUPPORTED = [
  "en","hi","bn","mr","te","ta","gu","ur","kn","or","ml","pa"
] as const;

export type Locale = (typeof SUPPORTED)[number];

export default getRequestConfig(async () => {
  // Await cookies()
  const cookieStore = await nextCookies();

  // Safe get
  const raw = cookieStore.get("lang")?.value;
  const locale: Locale = raw && SUPPORTED.includes(raw as Locale) ? (raw as Locale) : "en";

  // Dynamically import messages from local folder
  const messages: Record<string, unknown> = (
    await import(`./messages/${locale}.json`) // <-- your folder name
  ).default;

  return { locale, messages };
});
