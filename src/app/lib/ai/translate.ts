// lib/ai/translate.ts
import { pipeline } from "@huggingface/transformers";

// FLORES-200 codes for major Indian languages (extend as needed)
export const FLORES = {
  en: "eng_Latn",
  hi: "hin_Deva",
  bn: "ben_Beng",
  mr: "mar_Deva",
  te: "tel_Telu",
  ta: "tam_Taml",
  gu: "guj_Gujr",
  ur: "urd_Arab",
  kn: "kan_Knda",
  or: "ory_Orya", // Odia
  ml: "mal_Mlym",
  pa: "pan_Guru",
} as const;

export type LangISO = keyof typeof FLORES;

type TranslationFn = (
  text: string,
  opts: { src_lang: string; tgt_lang: string }
) => Promise<Array<{ translation_text: string }>>;

let translatePipe: TranslationFn | null = null;

/**
 * Load the NLLB model once and reuse it.
 */
async function getTranslator(): Promise<TranslationFn> {
  if (!translatePipe) {
    const t = await pipeline("translation", "Xenova/nllb-200-distilled-600M");
    translatePipe = t as TranslationFn;
  }
  return translatePipe;
}

/**
 * Translate text between FLORES-compatible languages.
 */
export async function translateText(
  text: string,
  from: LangISO,
  to: LangISO
): Promise<string> {
  const src = FLORES[from];
  const tgt = FLORES[to];

  const t = await getTranslator();
  const out = await t(text, { src_lang: src, tgt_lang: tgt });

  return out[0]?.translation_text ?? text;
}
