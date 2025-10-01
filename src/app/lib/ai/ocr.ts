// lib/ai/ocr.ts
import { createWorker, type Worker, PSM } from "tesseract.js";
import sharp from "sharp";

// 0–1 percent crop box
export type CropPercent = { left: number; top: number; width: number; height: number };

async function extractByPercent(buf: Buffer, box: CropPercent): Promise<Buffer> {
  const meta = await sharp(buf).metadata();
  const W = meta.width ?? 0;
  const H = meta.height ?? 0;
  const left = Math.max(0, Math.floor(box.left * W));
  const top = Math.max(0, Math.floor(box.top * H));
  const width = Math.max(1, Math.floor(box.width * W));
  const height = Math.max(1, Math.floor(box.height * H));
  return await sharp(buf).extract({ left, top, width, height }).toBuffer();
}

let ocrWorker: Worker | null = null;
let currentLang = "eng";

async function preprocessImage(buf: Buffer): Promise<Buffer> {
  return await sharp(buf)
    .rotate()                                      // fix EXIF orientation
    .grayscale()                                   // reduce color noise
    .resize({ width: 1600, withoutEnlargement: false }) // modest upscale
    .median(3)                                     // denoise small specks
    .threshold(175)                                // binarize
    .toFormat("png")
    .toBuffer();
}

async function getOcrWorker(lang: string = "eng"): Promise<Worker> {
  if (!ocrWorker) {
    ocrWorker = await createWorker(lang);
    currentLang = lang;
  } else if (lang !== currentLang) {
    await ocrWorker.reinitialize(lang);
    currentLang = lang;
  }
  return ocrWorker;
}

// Optional: lightweight text cleanup
function cleanLines(s: string): string {
  const lines = s
    .split("\n")
    .map((l) => l.replace(/[^\w\s:,'"().-]/g, "").trim()) // drop odd symbols
    .filter((l) => l.length >= 10);                       // keep meaningful lines
  return lines.join("\n").trim();
}

export async function ocrImageBuffer(
  buf: Buffer,
  lang: string = "eng",
  crop?: CropPercent,
  psm: PSM = PSM.SINGLE_BLOCK
): Promise<string> {
  let work = buf;
  if (crop) {
    work = await extractByPercent(work, crop);            // crop first
  }
  const pre = await preprocessImage(work);
  const worker = await getOcrWorker(lang);

  // Tune for headline/caption
  await worker.setParameters({
    tessedit_pageseg_mode: psm,                           // try PSM.SINGLE_LINE for strictly one line
    user_defined_dpi: "300",                              // helps low-DPI screenshots
    // Optional whitelist for English headlines:
    // tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz 0123456789:,'().-",
  });

  let { data } = await worker.recognize(pre);

  // Fallback PSM if empty
  if (!data.text?.trim()) {
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
    data = (await worker.recognize(pre)).data;
  }

  // Confidence+length guard
  const raw = (data.text ?? "").trim();
  if (data.confidence < 40 || raw.replace(/\s/g, "").length < 20) {
    return "";
  }
  return cleanLines(raw);
}

export async function disposeOcrWorker(): Promise<void> {
  if (ocrWorker) {
    await ocrWorker.terminate();
    ocrWorker = null;
  }
}
