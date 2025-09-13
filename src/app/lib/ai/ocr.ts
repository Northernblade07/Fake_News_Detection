// lib/ai/ocr.ts
import { createWorker, type Worker } from "tesseract.js";

// Keep a single worker in-memory to avoid reloading on every request
let ocrWorker: Worker | null = null;
let currentLang = "eng";

/**
 * Get a ready worker in the requested language (reuses and reinitializes if needed).
 */
async function getOcrWorker(lang: string = "eng"): Promise<Worker> {
  if (!ocrWorker) {
    // In v6, language is set here; initialize/loadLanguage were removed. [21]
    ocrWorker = await createWorker(lang);
    currentLang = lang;
    return ocrWorker;
  }
  if (lang !== currentLang) {
    // Switch languages without recreating the worker. 
    await ocrWorker.reinitialize(lang);
    currentLang = lang;
  }
  return ocrWorker;
}

/**
 * OCR an image buffer using Tesseract.js v6.
 */
export async function ocrImageBuffer(buf: Buffer, lang: string = "eng"): Promise<string> {
  const worker = await getOcrWorker(lang);
  const { data } = await worker.recognize(buf);
  return typeof data?.text === "string" ? data.text : "";
}

/**
 * Optionally dispose the worker (e.g., on shutdown).
 */
export async function disposeOcrWorker(): Promise<void> {
  if (ocrWorker) {
    await ocrWorker.terminate();
    ocrWorker = null;
  }
}
