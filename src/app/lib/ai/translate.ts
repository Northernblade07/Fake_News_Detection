// lib/ai/translate.ts
import Groq from "groq-sdk";

export const SUPPORTED_LANGS = [
  "en","hi","bn","mr","te","ta","gu","ur","kn","or","ml","pa"
] as const;

export type LangISO = typeof SUPPORTED_LANGS[number];

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

/**
 * Lightweight LLM-based translation
 * Uses Groq Llama 70B instead of local NLLB model.
 */
export async function translateText(
  text: string,
  from: LangISO,
  to: LangISO | "en"
): Promise<string> {

  // Skip unnecessary translation
  if (!text?.trim() || from === to) {
    return text;
  }

  try {
    const prompt = `
Translate the following text from ${from} to ${to}.
Preserve meaning exactly.
Return ONLY the translated text.

Text:
${text}
`;

    const res = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      max_tokens: 800,
    });

    const translated =
      res.choices?.[0]?.message?.content?.trim();

    return translated || text;

  } catch (err) {
    console.error("Translation failed:", err);
    return text; // graceful fallback
  }
}
