// lib/ai/ocr.ts
import { createWorker } from "tesseract.js";

export async function ocrImageBuffer(buf: Buffer, lang = "eng"): Promise<string> {
  const worker = await createWorker();

  // Load core + language, then initialize that language
  await worker.load();                       // prepare Tesseract core [19]
  await worker.loadLanguage(lang);           // e.g., "eng" or "eng+hin" [19][5]
  await worker.initialize(lang);             // initialize selected language(s) [19]

  const { data } = await worker.recognize(buf); // run OCR [4]
  await worker.terminate();                      // free memory [19]
  return data.text || "";
}
