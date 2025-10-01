// app/lib/pdf/extract.ts

// Use the legacy ESM build for Node/Next.js server runtimes to avoid DOM APIs like DOMMatrix
// @ts-expect-error ESM-only legacy entry
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import type { TextItem } from "pdfjs-dist/types/src/display/api";

import { fromBuffer } from "pdf2pic";
import { ocrImageBuffer } from "@/app/lib/ai/ocr";

// Load the legacy worker once per process to register the worker handler in Node
let legacyWorkerLoaded = false;
async function ensureLegacyWorkerLoaded(): Promise<void> {
  if (!legacyWorkerLoaded) {
    // @ts-expect-error ESM-only worker entry
    await import("pdfjs-dist/legacy/build/pdf.worker.min.mjs");
    legacyWorkerLoaded = true;
  }
}

// Threshold for deciding OCR fallback
const MIN_TEXT_LEN = 20;
// Limit parallel OCR to avoid CPU oversubscription
const OCR_CONCURRENCY = 4;

type Pdf2PicResult =
  | string
  | {
      base64?: string;
      base64Image?: string;
      data?: string;
    };

function extractBase64(result: Pdf2PicResult): string {
  const raw =
    typeof result === "string"
      ? result
      : result.base64 || result.base64Image || result.data || "";
  if (!raw) return "";
  const comma = raw.indexOf(",");
  return comma >= 0 ? raw.slice(comma + 1) : raw;
}

// Normalize Buffer/Uint8Array to a clean Uint8Array for pdfjs-dist
function asUint8Array(data: Uint8Array | Buffer): Uint8Array {
  return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
}

export interface ExtractedPdfText {
  text: string;
  pages: number;
}

/**
 * Extracts text from a PDF buffer with OCR fallback for image-only/scanned pages.
 * - Pass 1: embedded text via PDF.js
 * - Pass 2: OCR only for pages with insufficient text
 */
export async function extractTextFromPdf(
  data: Uint8Array | Buffer
): Promise<ExtractedPdfText> {
  await ensureLegacyWorkerLoaded();

  const u8 = asUint8Array(data);
  const loadingTask = pdfjsLib.getDocument({ data: u8 });
  const pdf = await loadingTask.promise;

  const perPageText: string[] = new Array(pdf.numPages).fill("");

  // Pass 1: extract embedded text
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const items = textContent.items as TextItem[];
    perPageText[i - 1] = items.map((it) => it.str ?? "").join(" ").trim();
  }

  // Identify pages that need OCR
  const pagesNeedingOcr: number[] = [];
  for (let i = 0; i < pdf.numPages; i++) {
    const txt = perPageText[i];
    if (!txt || txt.length < MIN_TEXT_LEN) {
      pagesNeedingOcr.push(i);
    }
  }

  // Pass 2: OCR fallback for image/scanned pages
  if (pagesNeedingOcr.length > 0) {
    const convert = fromBuffer(Buffer.from(u8), { density: 150, format: "png" });

    for (let start = 0; start < pagesNeedingOcr.length; start += OCR_CONCURRENCY) {
      const batch = pagesNeedingOcr.slice(start, start + OCR_CONCURRENCY);
      await Promise.all(
        batch.map(async (idx) => {
          try {
            const pageNumber = idx + 1; // pdf2pic is 1-indexed
            const imgResult = await convert(pageNumber, { responseType: "base64" });
            const b64 = extractBase64(imgResult);
            if (!b64) return;

            const ocrText = await ocrImageBuffer(Buffer.from(b64, "base64"));
            if (ocrText?.trim()) {
              perPageText[idx] = ocrText.trim();
            }
          } catch (e) {
            console.warn(`OCR fallback failed on page ${idx + 1}:`, e);
          }
        })
      );
    }
  }

  return {
    text: perPageText.filter(Boolean).join("\n\n").trim(),
    pages: pdf.numPages,
  };
}
