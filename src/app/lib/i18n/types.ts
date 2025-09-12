// lib/i18n/types.ts
import { routing } from "@/app/lib/i18n/routing";

// "en" | "hi" | ... derived from the locales array
export type Locale = (typeof routing.locales)[number];

// Type guard for narrowing unknown values to Locale
export function isLocale(val: unknown): val is Locale {
  return (
    typeof val === "string" &&
    (routing.locales as readonly string[]).includes(val)
  );
}

// Get the current locale from a pathname, falling back to default
export function getCurrentLocale(pathname: string): Locale {
  const parts = pathname.split("/").filter(Boolean); // string[]
  const first = parts[0]; // string | undefined
  return isLocale(first) ? first : routing.defaultLocale;
}

// Build a locale-aware href (always a single string out)
// If the path already starts with a locale, it gets replaced
export function withLocaleHref(path: string, locale: Locale): string {
  const parts = path.split("/").filter(Boolean);

  // If first segment is already a locale, drop it
  if (isLocale(parts[0])) {
    parts.shift();
  }

  const clean = parts.join("/");
  const raw = clean ? `/${locale}/${clean}` : `/${locale}`;
  return raw.replace(/\/{2,}/g, "/"); // collapse accidental duplicate slashes
}

// Normalize query params: always return a single string
export function ensureString(v: string | string[] | null | undefined): string {
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}
