// lib/ai/ocr.ts
import { createWorker, type Worker } from "tesseract.js";
import sharp from "sharp";

let ocrWorker: Worker | null = null;
let currentLang = "eng";

// Basic, fast preprocessing: rotate, grayscale, modest upscale, binarize
async function preprocessImage(buf: Buffer): Promise<Buffer> {
  // Adjust target width/threshold to taste; keep operations cheap for serverless
  return await sharp(buf)
    .rotate()                               // auto-orient based on EXIF
    .grayscale()                            // reduce color noise
    .resize({ width: 1200, withoutEnlargement: false }) // modest upscale
    .threshold(160)                         // simple global binarization
    .toFormat("png")                        // stable input to Tesseract
    .toBuffer();
}

async function getOcrWorker(lang: string = "eng"): Promise<Worker> {
  if (!ocrWorker) {
    ocrWorker = await createWorker(lang);
    currentLang = lang;
    return ocrWorker;
  }
  if (lang !== currentLang) {
    await ocrWorker.reinitialize(lang);
    currentLang = lang;
  }
  return ocrWorker;
}

export async function ocrImageBuffer(buf: Buffer, lang: string = "eng"): Promise<string> {
  const worker = await getOcrWorker(lang);
  const pre = await preprocessImage(buf);   // preprocess only for OCR
  const { data } = await worker.recognize(pre);
  return typeof data?.text === "string" ? data.text : "";
}

export async function disposeOcrWorker(): Promise<void> {
  if (ocrWorker) {
    await ocrWorker.terminate();
    ocrWorker = null;
  }
}
