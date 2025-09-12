// lib/i18n/routing.ts
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en","hi","bn","mr","te","ta","gu","ur","kn","or","ml","pa"],
  defaultLocale: "en",
});
