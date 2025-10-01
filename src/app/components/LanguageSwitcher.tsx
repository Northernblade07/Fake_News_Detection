"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { setLocale } from "@/app/actions/set-locale";
import { LOCALE_LABELS } from "@/app/lib/i18n/labels";

const SUPPORTED = ["en","hi","bn","mr","te","ta","gu","ur","kn","or","ml","pa"] as const;
type Locale = typeof SUPPORTED[number];

export default function LanguageSwitcher() {
  const router = useRouter();
  const locale = useLocale() as Locale;
  const t = useTranslations("nav");
  const [pending, start] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as Locale;
    if (!(SUPPORTED as readonly string[]).includes(next)) return;
    start(async () => {
      await setLocale(next);
      router.refresh(); // reload messages without changing URL
    });
  }

  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="text-slate-400">{t("language")}</span>
      <select
        className="rounded-md border border-white/10 bg-[#0f1524] px-2 py-1 text-slate-100"
        value={locale}
        onChange={onChange}
        disabled={pending}
      >
        {SUPPORTED.map((l) => (
          <option key={l} value={l}>
            {LOCALE_LABELS[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
