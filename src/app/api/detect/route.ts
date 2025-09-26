// app/api/detect/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { promises as fs } from "fs";

import { auth } from "@/../auth";
import { connectToDatabase } from "@/app/lib/db";
import NewsDetection, { INewsMedia } from "@/app/model/News";
import DetectionLog from "@/app/model/detectionlog";
import { uploadBufferToCloudinary, normalizeResourceType } from "@/app/lib/cloudinary";
import { validateType, validateText, validateOptionalUrl, readAndValidateFile } from "@/app/lib/validation";
import { translateText, type LangISO } from "@/app/lib/ai/translate";
import { ocrImageBuffer } from "@/app/lib/ai/ocr";
import { detectLanguage } from "@/app/lib/ai/langDetect";

// New local helpers (ensure these exist)
import { extractTextFromPdf } from "@/app/lib/pdf/extract";            // pdf.js text + OCR fallback
import { writeTempFile, extractMono16kWav } from "@/app/lib/ai/ffmpeg"; // ffmpeg → mono 16k WAV
import { transcribeFile, classifyLocalFakeRealUnknown } from "@/app/lib/ai/transformers-pipeline"; // Whisper + local zero-shot

type Classification = { label: "fake" | "real" | "unknown"; probability: number };

function toObjectId(id: string): mongoose.Types.ObjectId {
  if (!mongoose.isValidObjectId(id)) throw new Error("Invalid user id");
  return new mongoose.Types.ObjectId(id);
}

const SUPPORTED_LANGS: ReadonlyArray<LangISO> = [
  "en","hi","bn","mr","te","ta","gu","ur","kn","or","ml","pa"
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(req: Request) {
  const tmpFiles: string[] = [];
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const form = await req.formData();
    const type = validateType(form.get("type")?.toString() ?? null);
    const title = form.get("title")?.toString()?.trim() || undefined;
    const sourceUrl = validateOptionalUrl(form.get("sourceUrl")?.toString() ?? null);

    let textContent: string | undefined;
    const media: INewsMedia[] = [];

    if (type === "text") {
      textContent = validateText(form.get("text")?.toString() ?? null);
    } else {
      const files = form.getAll("file");
      if (!files.length) {
        return NextResponse.json({ error: "At least one file is required" }, { status: 400 });
      }

      for (const f of files) {
        if (!(f instanceof File)) continue;
        if (f.size > MAX_FILE_SIZE) {
          return NextResponse.json({ error: `File too large: ${f.name}` }, { status: 400 });
        }

        const { buffer, mime } = await readAndValidateFile(f);

        // 1) Image → OCR (Tesseract.js behind ocrImageBuffer)
        if (mime.startsWith("image/")) {
          try {
            const extractedText = await ocrImageBuffer(buffer);
            if (extractedText?.trim()) {
              textContent = (textContent ?? "") + (textContent ? "\n\n" : "") + extractedText.trim();
            }
          } catch (e) {
            console.warn(`OCR failed for ${f.name}:`, e);
          }
        }
        // 2) PDF → pdf.js per-page getTextContent; OCR fallback for low-text pages
        else if (mime === "application/pdf") {
          try {
            const { text } = await extractTextFromPdf(buffer);
            if (text?.trim()) {
              textContent = (textContent ?? "") + (textContent ? "\n\n" : "") + text.trim();
            }
          } catch (e) {
            console.warn(`PDF extraction failed for ${f.name}:`, e);
          }
        }
        // 3) Audio/Video → FFmpeg normalize → Whisper ASR (Transformers.js)
        else if (mime.startsWith("audio/") || mime.startsWith("video/")) {
          try {
            const inPath = await writeTempFile("media", mime.split("/")[1] || "bin", buffer);
            tmpFiles.push(inPath);
            const wavPath = await extractMono16kWav(inPath);
            tmpFiles.push(wavPath);
            const asr = await transcribeFile(wavPath);
            const transcript = typeof asr?.text === "string" ? asr.text : "";
            if (transcript?.trim()) {
              textContent = (textContent ?? "") + (textContent ? "\n\n" : "") + transcript.trim();
            }
          } catch (e) {
            console.warn(`ASR failed for ${f.name}:`, e);
          }
        }

        // Upload original file for auditability
        const uploaded = await uploadBufferToCloudinary(buffer, {
          folder: "satyashield/uploads",
          resource_type: "auto",
          use_filename: true,
          unique_filename: true,
          filename_override: f.name.replace(/\s+/g, "_").slice(0, 200),
        });

        media.push({
          url: uploaded.secure_url,
          publicId: uploaded.public_id,
          resourceType: normalizeResourceType(uploaded.resource_type),
          format: uploaded.format,
          bytes: uploaded.bytes,
          width: uploaded.width,
          height: uploaded.height,
          duration: uploaded.duration,
        });
      }
    }

    // Language normalization for analysis
    const rawLang = form.get("lang")?.toString() ?? null;
    let userLang: LangISO = "en";
    const analysisLang: LangISO = "en";

    if (rawLang && (SUPPORTED_LANGS as readonly string[]).includes(rawLang)) {
      userLang = rawLang as LangISO;
    } else if (textContent) {
      try {
        const detection = await detectLanguage(textContent);
        if (detection.isReliable && (SUPPORTED_LANGS as readonly string[]).includes(detection.language)) {
          userLang = detection.language as LangISO;
        }
      } catch (e) {
        console.warn("Language detection failed:", e);
      }
    }

    let normalizedText = textContent;
    if (textContent && userLang !== analysisLang) {
      try {
        normalizedText = await translateText(textContent, userLang, analysisLang);
      } catch {
        normalizedText = textContent;
      }
    }

    // Local zero-shot classification via Transformers.js (multilingual NLI), map low confidence to unknown
    let aiResult: Classification = { label: "unknown", probability: 0 };
    if (normalizedText?.trim()) {
      const out = await classifyLocalFakeRealUnknown(normalizedText);
      aiResult = { label: out.label, probability: out.probability };
    }

    const userId = toObjectId(String(session.user.id));
    const newsDoc = await NewsDetection.create({
      type,
      title,
      textContent,    // original
      normalizedText, // translated/cleaned for analysis
      media,
      source: { url: sourceUrl },
      result: aiResult,
      user: userId,
    });

    const logDoc = await DetectionLog.create({
      user: userId,
      news: newsDoc._id,
      result: aiResult,
    });

    return NextResponse.json({ news: newsDoc, log: logDoc }, { status: 201 });
  } catch (err) {
    console.error("Detect API Error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await Promise.allSettled(tmpFiles.map(p => fs.rm(p, { force: true }).catch(() => {})));
  }
}
