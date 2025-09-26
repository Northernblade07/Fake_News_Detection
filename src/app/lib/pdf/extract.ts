// app/lib/pdf/extract.ts
import * as pdfjsLib from "pdfjs-dist";
import { fromBuffer } from "pdf2pic";
import { ocrImageBuffer } from "@/app/lib/ai/ocr";

(pdfjsLib as any).GlobalWorkerOptions.workerSrc =
  require("pdfjs-dist/build/pdf.worker.js");

export async function extractTextFromPdf(buffer: Buffer): Promise<{ text: string; pages: number }> {
  let combined = "";
  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;

  // Step 1: Try text content extraction
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((it: any) => it.str ?? "").join(" ").trim();
    if (pageText && pageText.length > 20) {
      combined += (combined ? "\n\n" : "") + pageText;
    }
  }

  // Step 2: Fallback to OCR for scanned/image-only pages
  const convert = fromBuffer(buffer, { density: 150, format: "png" });
  for (let i = 1; i <= pdf.numPages; i++) {
    const img = await convert(i, true); // true = return base64
    const ocrText = await ocrImageBuffer(Buffer.from(img.base64, "base64"));
    if (ocrText?.trim()) combined += (combined ? "\n\n" : "") + ocrText.trim();
  }

  return { text: combined.trim(), pages: pdf.numPages };
}
