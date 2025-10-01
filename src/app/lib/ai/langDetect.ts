// lib/ai/langDetect.ts
import { loadModule, type CldFactory } from "cld3-asm";

let cldFactoryPromise: Promise<CldFactory> | null = null;
let identifier: ReturnType<Awaited<ReturnType<typeof loadModule>>["create"]> | null = null;

export interface LangDetectResponse {
  language: string;
  probability: number;
  isReliable: boolean;
  proportion?: number;
}

export async function detectLanguage(text: string): Promise<LangDetectResponse> {
  if (!cldFactoryPromise) cldFactoryPromise = loadModule(); // load WASM once per instance [web:35]
  const factory = await cldFactoryPromise;

  // Create a reusable identifier (min/max byte defaults are fine for general use)
  if (!identifier) {
    // Optional: provide bounds e.g., create(0, 1000) similar to CLD3 defaults
    identifier = factory.create(); // returns LanguageIdentifier with findLanguage(...) [web:35][web:39]
  }

  const trimmed = text.trim();
  if (trimmed.length < 3) {
    throw new Error("Text too short for reliable detection");
  }

  const r = identifier.findLanguage(trimmed); // method exists on LanguageIdentifier [web:35][web:39]
  // r has { language, probability, isReliable, proportion } in JS bindings [web:35][web:49]
  return {
    language: r.language,
    probability: r.probability,
    isReliable: r.is_reliable,
    proportion: (r).proportion, // optional field; safe to omit if not needed
  };
}
